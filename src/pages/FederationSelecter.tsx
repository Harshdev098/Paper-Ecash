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
import { generateMnemonic, getMnemonic, joinFederation } from '@fedimint/core-web'
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
    const { sessionId, walletId, currentStep } = useSelector((state: RootState) => state.SessionSlice)
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

    const selectFederation = async () => {
        try {
            if (!inviteCode) throw Error("Please enter Invite Code or select a Federation")
            console.log("joining the federation", walletId, currentStep)
            setIsJoining(true);
            dispatch(setLoader({ loader: true, loaderMessage: "Joining the selected Federation" }))
            let mnemonics = await getMnemonic();

            if (!mnemonics?.length) {
                mnemonics = (await generateMnemonic()) as unknown as string[];
            }
            const result = await joinFederation(inviteCode, false, sessionId ?? undefined)
            console.log("federation joining result is ", result)
            if (result) {
                dispatch(setWalletStatus('opened'))
                const federationId = await result.federation.getFederationId()
                console.log("federation id is ", federationId)
                dispatch(updateSessionThunk({ federationId: federationId, walletId: result.id }))
            }
        } catch (err) {
            console.log("an error occured ", err)
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
                        <Input type="text" onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter federation invite code" />
                    </Field>
                </div>

                <h4 className="text-center text-sm text-muted-foreground">OR</h4>
                <div className="flex flex-col gap-6 pt-0 w-full">
                    <ItemGroup className="w-full sm:w-[95%] mx-auto max-h-[250px] overflow-y-auto">
                        {(federationList && federationList.length !== 0) && federationList.map((fed, index) => (
                            <Item key={index} variant="outline" className={`flex flex-col cursor-pointer m-2 ${selectedId === fed.id ? 'border-blue-600' : ''}`} onClick={() => {
                                setSelectedId(selectedId === fed.id ? null : fed.id)
                                setInviteCode(selectedId === fed.id ? null : fed.invite)
                            }}>
                                <div className="flex items-center w-full">
                                    <ItemMedia>
                                        <Avatar>
                                            <AvatarImage src={""} className="grayscale" />
                                            <AvatarFallback>{fed.name?.slice(0, 1)}</AvatarFallback>
                                        </Avatar>
                                    </ItemMedia>

                                    <ItemContent className="gap-1 min-w-0">
                                        <ItemTitle>{fed.name} {fed.nostr_votes.avg && <span className='font-bold px-2 text-base text-yellow-700 bg-yellow-100'><i className="fa-solid fa-star"></i>{fed.nostr_votes.avg?.toFixed(1)}</span>}</ItemTitle>
                                        <ItemDescription className='break-words'>{fed.id}</ItemDescription>
                                    </ItemContent>

                                    <ItemActions className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation(); setExpandedId(expandedId === fed.id ? null : fed.id)
                                            }
                                            }
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
                                        <p><strong>Members</strong> {fed.members}</p>
                                        <p><strong>Holdings:</strong> {fed.deposits} sats</p>
                                        <p><strong>Status</strong> {fed.health}</p>
                                        <p><strong>Ratings:</strong> {fed.nostr_votes.avg?.toFixed(1)}</p>
                                    </div>
                                )}
                            </Item>
                        ))}
                    </ItemGroup>
                </div>

                <DrawerFooter>
                    <Button disabled={isJoining} type="button" className='bg-[#319BD9] hover:bg-[#0e90dc] font-semibold' onClick={selectFederation}>{isJoining ? "Joining..." : "Next "}{!isJoining && <i className="fa-solid fa-arrow-right"></i>}</Button>
                </DrawerFooter>
            </div>
        </>
    )
}