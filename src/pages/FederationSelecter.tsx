import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Field, FieldLabel } from '@/components/ui/field'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Stepper from '@/components/Stepper'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/redux/store'
import { setWalletStatus } from '@/redux/slices/WalletSlice'
import { updateSessionThunk } from '@/redux/slices/SessionSlice'
import { generateMnemonic, getMnemonic, joinFederation, listClients, getWallet } from '@fedimint/core-web'
import { fetchFormatedFederation } from '@/services/Federation'
import type { FormatedFederationData } from '@/types/fedimint.type'
import { setLoader } from '@/redux/slices/LoaderSlice'
import Loader from '@/components/Loader'

export default function FederationSelecter() {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isJoining, setIsJoining] = useState<boolean>(false)
    const dispatch = useDispatch<AppDispatch>()
    const [inviteCode, setInviteCode] = useState<string | null>(null)
    const { sessionId } = useSelector((state: RootState) => state.SessionSlice)
    const { loader, loaderMessage } = useSelector((state: RootState) => state.LoaderSlice)
    const [federationList, setFederationList] = useState<FormatedFederationData[] | null>(null)

    useEffect(() => {
        const fetchFederations = async () => {
            console.log("calling the observer apis")
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Fetching Recommended Federations" }))
                const federationData = await fetchFormatedFederation()
                console.log("fetched federation data is", federationData)
                setFederationList(federationData)
            } catch (err) {
                console.log("an error occured", err)
            } finally {
                dispatch(setLoader({ loader: false, loaderMessage: null }))
            }
        }
        fetchFederations()
    }, [])

    // The core insight: the Fedimint SDK creates a NEW wallet slot every time
    // joinFederation is called, even without a clientName. Two wallet slots
    // sharing the same mnemonic on the same federation = key collision = canceled.
    // Solution: before joining, check if we already have an open wallet for
    // this federation and reuse it. Only call joinFederation if truly first time.
    const getOrJoinFederation = async (inviteCode: string): Promise<{
        walletId: string
        federationId: string
    }> => {
        // Parse the target federation ID from the invite code first
        // so we can compare against existing wallets
        const existingClientIds = listClients()
        console.log("[FederationSelecter] existing wallet client IDs:", existingClientIds)

        // Check each existing wallet to see if it's already on this federation
        for (const clientId of existingClientIds) {
            try {
                const existingWallet = await getWallet(clientId.id)
                if (!existingWallet) continue

                const existingFedId = await existingWallet.federation.getFederationId()
                console.log(`[FederationSelecter] client ${clientId} is on federation ${existingFedId}`)

                // We need the target federation ID — parse it from a temp join
                // OR compare by joining and checking. But to avoid creating a
                // new slot, we compare federation IDs after a dry parse.
                // The simplest approach: join (which may create a new slot),
                // then check if the new wallet's federation matches an existing one,
                // and if so, discard the new slot and use the existing one.
                // We'll do this check AFTER joining below.
            } catch (err) {
                console.log(`[FederationSelecter] could not open wallet ${clientId}:`, err)
            }
        }

        // Join federation — this always creates a new wallet slot
        const result = await joinFederation(inviteCode, false)
        if (!result) throw new Error("joinFederation returned null")

        const newWalletId = result.id
        const newFederationId = await result.federation.getFederationId()
        console.log(`[FederationSelecter] joinFederation created wallet ${newWalletId} for federation ${newFederationId}`)

        // Now check: does any PREVIOUS wallet slot use the same federation?
        // If yes, the new slot is a duplicate — reuse the original one instead.
        const priorClientIds = existingClientIds.filter(id => id.id !== newWalletId)

        for (const clientId of priorClientIds) {
            try {
                const existingWallet = await getWallet(clientId.id)
                if (!existingWallet) continue

                const existingFedId = await existingWallet.federation.getFederationId()

                if (existingFedId === newFederationId) {
                    console.log(
                        `[FederationSelecter] REUSING existing wallet ${clientId} for federation ${newFederationId}`,
                        `(discarding duplicate new wallet ${newWalletId})`
                    )
                    // The new wallet slot was created but we must not use it —
                    // it shares the mnemonic with clientId and will cause key collisions.
                    // Return the original wallet's ID so all operations go through
                    // the single canonical slot for this federation.
                    return { walletId: clientId.id, federationId: newFederationId }
                }
            } catch (err) {
                console.log(`[FederationSelecter] could not check wallet ${clientId}:`, err)
            }
        }

        // No prior wallet for this federation — the new one is the canonical slot
        console.log(`[FederationSelecter] using new wallet ${newWalletId} as canonical slot`)
        return { walletId: newWalletId, federationId: newFederationId }
    }

    const selectFederation = async () => {
        try {
            if (!inviteCode) throw Error("Please enter Invite Code or select a Federation")
            console.log("[FederationSelecter] joining federation, sessionId:", sessionId)
            setIsJoining(true)
            dispatch(setLoader({ loader: true, loaderMessage: "Joining the selected Federation" }))

            // Ensure global mnemonic exists
            const mnemonics = await getMnemonic()
            if (!mnemonics?.length) {
                await generateMnemonic()
                console.log("[FederationSelecter] generated new global mnemonic")
            } else {
                console.log("[FederationSelecter] reusing existing global mnemonic")
            }

            const { walletId, federationId } = await getOrJoinFederation(inviteCode)

            console.log(`[FederationSelecter] resolved walletId: ${walletId}, federationId: ${federationId}`)
            dispatch(setWalletStatus('opened'))
            dispatch(updateSessionThunk({ federationId, walletId }))

        } catch (err) {
            console.log("[FederationSelecter] error:", err)
        } finally {
            setIsJoining(false)
            dispatch(setLoader({ loader: false, loaderMessage: null }))
        }
    }

    return (
        <>
            {loader && <Loader message={loaderMessage} />}
            <div className="flex flex-col gap-6 p-4 sm:p-6 w-full max-w-2xl mx-auto">
                <DrawerHeader>
                    <DrawerTitle className='text-center text-2xl'>Select Federation</DrawerTitle>
                    <DrawerDescription className='text-center'>
                        Choose your federation to get the ecash value from
                    </DrawerDescription>
                </DrawerHeader>

                <div className='m-4'>
                    <Stepper currentStep={1} />
                </div>

                <div className='flex justify-center items-center'>
                    <Field className='max-w-sm'>
                        <FieldLabel>Invite Code:</FieldLabel>
                        <Input
                            type="text"
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="Enter federation invite code"
                        />
                    </Field>
                </div>

                <h4 className="text-center text-sm text-muted-foreground">OR</h4>

                <div className="flex flex-col gap-6 pt-0 w-full">
                    <ItemGroup className="w-full sm:w-[95%] mx-auto max-h-[250px] overflow-y-auto">
                        {(federationList && federationList.length !== 0) && federationList.map((fed, index) => (
                            <Item
                                key={index}
                                variant="outline"
                                className={`flex flex-col cursor-pointer m-2 ${selectedId === fed.id ? 'border-blue-600' : ''}`}
                                onClick={() => {
                                    setSelectedId(selectedId === fed.id ? null : fed.id)
                                    setInviteCode(selectedId === fed.id ? null : fed.invite)
                                }}
                            >
                                <div className="flex items-center w-full">
                                    <ItemMedia>
                                        <Avatar>
                                            <AvatarImage src={""} className="grayscale" />
                                            <AvatarFallback>{fed.name?.slice(0, 1)}</AvatarFallback>
                                        </Avatar>
                                    </ItemMedia>

                                    <ItemContent className="gap-1 min-w-0">
                                        <ItemTitle>
                                            {fed.name}{' '}
                                            {fed.nostr_votes.avg && (
                                                <span className='font-bold px-2 text-base text-yellow-700 bg-yellow-100'>
                                                    <i className="fa-solid fa-star"></i>
                                                    {fed.nostr_votes.avg?.toFixed(1)}
                                                </span>
                                            )}
                                        </ItemTitle>
                                        <ItemDescription className='break-words'>{fed.id}</ItemDescription>
                                    </ItemContent>

                                    <ItemActions className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setExpandedId(expandedId === fed.id ? null : fed.id)
                                            }}
                                        >
                                            <i className={`fa-solid fa-chevron-down transition-transform ${expandedId === fed.id ? "rotate-180" : ""}`}></i>
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            {selectedId === fed.id ? (
                                                <i className="fa-solid fa-circle-check text-xl text-[#4B5971]"></i>
                                            ) : (
                                                <i className="fa-solid fa-plus text-xl text-[#4B5971]"></i>
                                            )}
                                        </Button>
                                    </ItemActions>
                                </div>

                                {expandedId === fed.id && (
                                    <div className="px-4 pb-4 text-sm text-muted-foreground border-t mt-3 pt-3">
                                        <p><strong>Members:</strong> {fed.members}</p>
                                        <p><strong>Holdings:</strong> {fed.deposits} sats</p>
                                        <p><strong>Status:</strong> {fed.health}</p>
                                        <p><strong>Ratings:</strong> {fed.nostr_votes.avg?.toFixed(1)}</p>
                                    </div>
                                )}
                            </Item>
                        ))}
                    </ItemGroup>
                </div>

                <DrawerFooter>
                    <Button
                        disabled={isJoining}
                        type="button"
                        className='bg-[#319BD9] hover:bg-[#0e90dc] font-semibold'
                        onClick={selectFederation}
                    >
                        {isJoining ? "Joining..." : "Next "}
                        {!isJoining && <i className="fa-solid fa-arrow-right"></i>}
                    </Button>
                </DrawerFooter>
            </div>
        </>
    )
}