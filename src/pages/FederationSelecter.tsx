import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Field, FieldLabel } from '@/components/ui/field'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Stepper from '@/components/Stepper'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/redux/store'
import { useFedimint } from '@/context/FedimintManager'
import { setWalletStatus } from '@/redux/slices/WalletSlice'
import { updateSessionThunk } from '@/redux/slices/SessionSlice'

export default function FederationSelecter() {
    const [expanded, setExpanded] = useState(false)
    const dispatch=useDispatch<AppDispatch>()
    const {wallet}=useFedimint()

    const joinFederation=async()=>{
        try{
            console.log("joining the federation")
            const result= wallet?.joinFederation('')
            console.log("federation joining result is ",result)
            if(result){
                dispatch(setWalletStatus('opened'))
                const federationId=await wallet?.federation.getFederationId()
                dispatch(updateSessionThunk({federationId:federationId}))
            }
        }catch(err){
            console.log("an error occured ",err)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 justify-center items-center">
            <DialogHeader>
                <DialogTitle className='text-center text-2xl'>Select Federation</DialogTitle>
                <DialogDescription className='text-center'>
                    Choose your federation to get the ecash value from
                </DialogDescription>
            </DialogHeader>

            <div className='m-4'>
                <Stepper currentStep={1} />
            </div>

            <Field className='max-w-sm'>
                <FieldLabel>Federation ID:</FieldLabel>
                <Input type="text" placeholder="Enter the federation id" />
            </Field>

            <h4 className="text-center text-sm text-muted-foreground">OR</h4>

            <ItemGroup className="w-full max-w-xl">
                <Item variant="outline" className="flex flex-col">
                    <div className="flex items-center w-full">
                        <ItemMedia>
                            <Avatar>
                                <AvatarImage src={""} className="grayscale" />
                                <AvatarFallback>H</AvatarFallback>
                            </Avatar>
                        </ItemMedia>

                        <ItemContent className="gap-1">
                            <ItemTitle>Fedi Testnet</ItemTitle>
                            <ItemDescription>sjdfsdlkfsdfkjdsfsdkfsdfdslksdflksd</ItemDescription>
                        </ItemContent>

                        <ItemActions className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setExpanded(!expanded)}
                            >
                                <i className={`fa-solid fa-chevron-down transition-transform ${expanded ? "rotate-180" : ""}`}></i>
                            </Button>
                            <Button variant="ghost" size="icon">
                                <i className="fa-solid fa-circle-plus text-xl text-[#4B5971]"></i>
                            </Button>
                        </ItemActions>
                    </div>

                    {expanded && (
                        <div className="px-4 pb-4 text-sm text-muted-foreground border-t mt-3 pt-3">
                            <p><strong>Federation ID:</strong> 8sjdf89sdf8sdf</p>
                            <p><strong>Members:</strong> 12</p>
                            <p><strong>Status:</strong> Active</p>
                        </div>
                    )}
                </Item>
            </ItemGroup>

            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Back</Button>
                </DialogClose>
                <Button type="button" className='bg-[#319BD9]' onClick={joinFederation}>Save changes</Button>
            </DialogFooter>
        </div >
    )
}