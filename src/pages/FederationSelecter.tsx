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
import { generateMnemonic, getMnemonic, joinFederation, listClients, getWallet, parseInviteCode, getWalletInfo } from '@fedimint/core-web'
import { fetchFormatedFederation } from '@/services/Federation'
import type { FormatedFederationData } from '@/types/fedimint.type'
import { setLoader } from '@/redux/slices/LoaderSlice'
import Loader from '@/components/Loader'
import { setErrorWithTimeout } from '@/redux/slices/Alert'

export default function FederationSelecter() {
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [isJoining, setIsJoining] = useState<boolean>(false)
    const dispatch = useDispatch<AppDispatch>()
    const [inviteCode, setInviteCode] = useState<string | null>(null)
    const { sessionId } = useSelector((state: RootState) => state.SessionSlice)
    const { loader, loaderMessage } = useSelector((state: RootState) => state.LoaderSlice)
    const [federationList, setFederationList] = useState<FormatedFederationData[] | null>(null)
    const [lastUsedFederation, setLastUsedFederation] = useState<{
        federationId: string,
        name: string | null,
        inviteCode: string
    } | null>(null)

    useEffect(() => {
        const fetchFederations = async () => {
            console.log("calling the observer apis")
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Fetching Recommended Federations" }))
                const federationData = await fetchFormatedFederation()
                console.log("fetched federation data is", federationData)
                setFederationList(federationData)
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                dispatch(setErrorWithTimeout({ type: "Fedimint Observer Error", message }))
            } finally {
                dispatch(setLoader({ loader: false, loaderMessage: null }))
            }
        }
        fetchFederations()
    }, [])

    useEffect(() => {
        const loadLastFederation = async () => {
            const walletId = localStorage.getItem("lastWallet")
            if (!walletId) return

            const walletInfo = getWalletInfo(walletId)
            if (!walletInfo) return

            try {
                const federation = await fetchFormatedFederation(walletInfo.federationId)
                if (federation?.length > 0) {
                    let data = { federationId: federation[0].id, name: federation[0].name, inviteCode: federation[0].invite }
                    setLastUsedFederation(data)
                }
            } catch (err) {
                console.error(err)
            }
        }

        loadLastFederation()
    }, [])

    const getOrJoinFederation = async (inviteCode: string): Promise<{
        walletId: string
        federationId: string
    }> => {
        const parsed = await parseInviteCode(inviteCode)
        const targetFederationId = parsed.federation_id
        console.log("target federation:", targetFederationId)

        // Checking if we already have a wallet on this federation
        const existingClientIds = listClients()
        console.log("existing wallet client IDs:", existingClientIds)

        for (const clientInfo of existingClientIds) {
            if (clientInfo.federationId === targetFederationId) {
                console.log(
                    `reusing existing wallet ${clientInfo.id} for federation ${targetFederationId}`
                )
                getWallet(clientInfo.id)
                return { walletId: clientInfo.id, federationId: targetFederationId }
            }
        }

        // join the federation, if not exists
        console.log("no existing wallet found, joining federation")
        const result = await joinFederation(inviteCode, false)
        if (!result) throw new Error("joinFederation returned null")

        const newWalletId = result.id
        const newFederationId = await result.federation.getFederationId()
        console.log(`joined federation, new wallet: ${newWalletId}`)

        return { walletId: newWalletId, federationId: newFederationId }
    }

    const selectFederation = async () => {
        try {
            if (!inviteCode) throw Error("Please enter Invite Code or select a Federation")
            console.log("joining federation, sessionId:", sessionId)
            setIsJoining(true)
            dispatch(setLoader({ loader: true, loaderMessage: "Joining the selected Federation" }))

            const mnemonics = await getMnemonic()
            if (!mnemonics?.length) {
                await generateMnemonic()
                console.log("generated new global mnemonic")
            } else {
                console.log("reusing existing global mnemonic")
            }

            const { walletId, federationId } = await getOrJoinFederation(inviteCode)

            console.log(`resolved walletId: ${walletId}, federationId: ${federationId}`)
            localStorage.setItem('lastWallet', walletId);
            dispatch(setWalletStatus('opened'))
            dispatch(updateSessionThunk({ federationId, walletId }))

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            dispatch(setErrorWithTimeout({ type: "Federation Selection Error", message }))
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

                {lastUsedFederation && (
                    <div className="w-full sm:w-[95%] mx-auto">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                            Recently Used
                        </p>

                        <Item
                            variant="outline"
                            className={`cursor-pointer p-3 transition-all ${selectedId === lastUsedFederation.federationId
                                ? "border-blue-600"
                                : ""
                                }`}
                            onClick={() => {
                                setSelectedId(
                                    selectedId === lastUsedFederation.federationId
                                        ? null
                                        : lastUsedFederation.federationId
                                )

                                setInviteCode(
                                    selectedId === lastUsedFederation.federationId
                                        ? null
                                        : lastUsedFederation.inviteCode
                                )
                            }}
                        >
                            <div className="flex items-center gap-3 w-full min-w-0">
                                <Avatar className="shrink-0">
                                    <AvatarFallback>
                                        {lastUsedFederation.name?.[0] ?? "F"}
                                    </AvatarFallback>
                                </Avatar>

                                <ItemContent className="min-w-0 flex-1">
                                    <ItemTitle className="flex items-center gap-2 flex-wrap">
                                        <span className="truncate">
                                            {lastUsedFederation.name ??
                                                lastUsedFederation.federationId}
                                        </span>
                                    </ItemTitle>

                                    <ItemDescription className="truncate text-xs sm:text-sm text-muted-foreground">
                                        {lastUsedFederation.federationId}
                                    </ItemDescription>
                                </ItemContent>

                                <ItemActions className="shrink-0">
                                    {selectedId === lastUsedFederation.federationId ? (
                                        <i className="fa-solid fa-circle-check text-blue-600" />
                                    ) : (
                                        <i className="fa-solid fa-clock-rotate-left text-muted-foreground" />
                                    )}
                                </ItemActions>
                            </div>
                        </Item>
                    </div>
                )}

                <div className="flex items-center gap-3 w-full sm:w-[95%] mx-auto mb-3">
                    <div className="flex-1 border-t" />
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Recommended Federations
                    </span>
                    <div className="flex-1 border-t" />
                </div>

                <div className="flex flex-col gap-2 pt-0 w-full">
                    <ItemGroup className="w-full sm:w-[95%] mx-auto max-h-[220px] overflow-y-auto space-y-2">
                        {(federationList && federationList.length !== 0) && federationList.map((fed, index) => (
                            <Item
                                key={index}
                                variant="outline"
                                className={`flex flex-col cursor-pointer p-3 sm:p-4 transition-all ${selectedId === fed.id ? 'border-blue-600' : ''}`}
                                onClick={() => {
                                    setSelectedId(selectedId === fed.id ? null : fed.id)
                                    setInviteCode(selectedId === fed.id ? null : fed.invite)
                                }}
                            >
                                <div className="flex items-center gap-2 w-full min-w-0">
                                    <ItemMedia>
                                        <Avatar>
                                            <AvatarImage src={""} className="grayscale" />
                                            <AvatarFallback>{fed.name?.slice(0, 1)}</AvatarFallback>
                                        </Avatar>
                                    </ItemMedia>

                                    <ItemContent className="gap-0 min-w-0 flex-1">
                                        <ItemTitle className="text-sm sm:text-lg font-semibold leading-tight">
                                            {fed.name}{' '}
                                            {fed.nostr_votes.avg && (
                                                <span className='font-bold px-1.5 py-0.5 text-xs rounded-md text-yellow-700 bg-yellow-100 ml-1'>
                                                    <i className="fa-solid fa-star"></i> {" "}
                                                    {fed.nostr_votes.avg?.toFixed(1)}
                                                </span>
                                            )}
                                        </ItemTitle>
                                        <ItemDescription className='truncate text-xs sm:text-sm text-muted-foreground'>{fed.id}</ItemDescription>
                                    </ItemContent>

                                    <ItemActions className="flex items-center gap-1 sm:gap-2 shrink-0">
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
                                                <i className="fa-solid fa-circle-check text-sm sm:text-base text-muted-foreground"></i>
                                            ) : (
                                                <i className="fa-solid fa-plus text-sm sm:text-base text-muted-foreground"></i>
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
                        className='bg-brand hover:bg-[#0e90dc] font-semibold text-brand-foreground'
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
