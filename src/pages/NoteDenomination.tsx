import { useFedimint } from '@/context/FedimintManager'
import type { AppDispatch, RootState } from '@/redux/store'
import { useDispatch, useSelector } from 'react-redux'
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Field, FieldLabel } from "@/components/ui/field"
import QRCode from 'react-qr-code';
import { Input } from '@/components/ui/input'
import Stepper from "@/components/Stepper";
import { useEffect, useMemo, useState } from "react";
import type { DenominationPerNote } from "@/types/fedimint.type";
import { getNotesData, getSessionBySessionId, saveNotesToDB } from "@/utils/db";
import { updateSessionThunk } from '@/redux/slices/SessionSlice'
import { BackToStep } from '@/services/SessionControl'


export default function NoteDenomination() {
    const { walletId, sessionId, designId, currentStep } = useSelector((state: RootState) => state.SessionSlice)
    const { wallet } = useFedimint()
    const dispatch = useDispatch<AppDispatch>()
    const [denominationList, setDenominationList] = useState<number[]>([])
    const [selectedDenominations, setSelectedDenomination] = useState<DenominationPerNote[]>([])

    const NoteDenominationList = () => {
        let start = 1.02
        let final = 18000000
        const denominations: number[] = []
        let current = start
        while (current < final) {
            denominations.push(current)
            current = 2 * current
        }
        setDenominationList(denominations)
    }

    const formatSats = (value: number) => {
        if (value >= 1_000_000) {
            return (value / 1_000_000).toFixed(2) + "M"
        }

        if (value >= 1_000) {
            return (value / 1_000).toFixed(2) + "K"
        }

        return value.toFixed(2)
    }

    useEffect(() => {
        NoteDenominationList()
    }, [])

    useEffect(() => {
        const loadPreviousNotes = async () => {
            if (!sessionId) return
            try {
                const saved = await getNotesData(sessionId)
                if (saved?.notes?.length) {
                    setSelectedDenomination(saved.notes)
                }
            } catch (err) {
                console.log("Could not load previous denominations", err)
            }
        }
        loadPreviousNotes()
    }, [sessionId])

    useEffect(() => {
        if (wallet && walletId && sessionId) {
            console.log("the data rendering the note denomination is ", sessionId, walletId, wallet.id)
        }
    }, [wallet, walletId])

    const toggleDenomination = (value: number) => {
        console.log("toggling denomination", value)
        setSelectedDenomination(prev => {
            const exists = prev.find(d => d.denomination === value)
            if (exists) {
                console.log("denomination exists", exists)
                return prev.filter(d => d.denomination !== value)
            }
            return [...prev, { denomination: value, quantity: 1 }]
        })
    }

    const totalAmount = useMemo(() => {
        const total = selectedDenominations.reduce(
            (sum, item) => sum + item.denomination * item.quantity,
            0
        )

        return Number(total.toFixed(2))
    }, [selectedDenominations])

    const totalExpression = useMemo(() => {
        const expr = selectedDenominations
            .map(item => `${item.denomination} X ${item.quantity}`)
            .join(" + ")

        return `(${expr})`
    }, [selectedDenominations])

    const updateQuantity = (value: number, quantity: number) => {
        setSelectedDenomination(prev =>
            prev.map(d =>
                d.denomination === value ? { ...d, quantity } : d
            )
        )
    }

    const isSelected = (value: number) =>
        selectedDenominations.some(d => d.denomination === value)

    const formatStringtoArray = (s: string): DenominationPerNote[] => {
        if (!s.trim()) return []

        return s.split(",")
            .map(val => Number(val.trim()))
            .filter(num => !isNaN(num))
            .map(num => ({
                denomination: num,
                quantity: 1
            }))
    }

    const updateSessionWithNotes = async () => {
        try {
            if (selectedDenominations.length == 0) throw new Error("Please select a denomination")
            if (sessionId && walletId) {
                console.log("the data in updating the session with notes is ", sessionId, walletId, wallet?.id)
                const session = await getSessionBySessionId(sessionId)
                await saveNotesToDB({ sessionId, notes: selectedDenominations, federationId: session?.federationId ?? '', designId })
                dispatch(updateSessionThunk())
            } else {
                console.log("wallet id or session id not found", sessionId, walletId, wallet?.id)
            }
        } catch (err) {
            console.log("an error occured while updating session", err)
        }
    }

    return (
        <>
            <DrawerHeader>
                <DrawerTitle className='text-center text-2xl'>Select Note Denomination</DrawerTitle>
                <DrawerDescription className='text-center'>
                    Choose the note denomination and number of notes you wanted to print
                </DrawerDescription>
            </DrawerHeader>
            <div className='m-4'>
                <Stepper currentStep={2} />
            </div>
            <section className="w-full max-w-xl mx-auto m-12">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 m-2">
                    {denominationList.map((value, index) => (
                        <div
                            key={index}
                            className={`${isSelected(value) ? 'bg-blue-500 text-white' : ''} flex items-center justify-center border-2 border-blue-400 rounded-lg text-[#4B5971] font-medium py-3 cursor-pointer transition-all duration-200 hover:scale-110`}
                            onClick={() => toggleDenomination(value)}
                        >
                            {formatSats(value)}
                        </div>
                    ))}
                </div>
            </section>

            <h4 className="text-center text-sm text-muted-foreground">OR</h4>

            <div className='flex justify-center items-center m-4'>
                <Field className='max-w-sm'>
                    <FieldLabel>Custom denominations (in sats). eg: 1008, 5000, 10000</FieldLabel>
                    <Input type="text" onChange={(e) => setSelectedDenomination(formatStringtoArray(e.target.value))} placeholder="Enter federation invite code" />
                </Field>
            </div>

            {selectedDenominations.length !== 0 && (<section className='mt-8'>
                <h2 className='text-[#4B5971] text-center text-2xl'>Total Amount: <b className='text-blue-400'>{totalAmount} sats</b></h2>
                <p className='text-[#4B5563] text-center'>{totalExpression}</p>
            </section>)}

            <section className="flex gap-4 flex-row justify-center m-2 mt-4 overflow-x-auto">
                {selectedDenominations.map((item) => (
                    <Card
                        key={item.denomination}
                        className="w-52 p-3 flex flex-col items-center gap-4 shadow-md"
                    >
                        <div className="p-3 bg-white rounded-md border">
                            <QRCode
                                value={String(item.denomination)}
                                size={110}
                                bgColor="white"
                                fgColor="black"
                            />
                        </div>
                        <CardHeader className="w-full p-0">
                            <Field className="flex flex-col gap-2 w-full">
                                <FieldLabel className="text-center">
                                    <b>{formatSats(item.denomination)} sats:</b> No. of Notes
                                </FieldLabel>

                                <Input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                        updateQuantity(
                                            item.denomination,
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </Field>
                        </CardHeader>
                    </Card>
                ))}
            </section>

            <DrawerFooter>
                <Button type="button" onClick={updateSessionWithNotes} className='bg-[#319BD9] hover:bg-[#0e90dc] font-semibold'>Next <i className="fa-solid fa-arrow-right"></i></Button>
                <Button variant='outline' onClick={() => BackToStep(dispatch, currentStep)}>Back</Button>
            </DrawerFooter>
        </>
    )
}
