import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/redux/store"
import { useEffect, useMemo, useState } from "react"
import type { DenominationPerNote } from "@/types/fedimint.type"
import { getNotesData } from "@/utils/db"
import QRCode from "react-qr-code"
import { createInvoice, searchInvoiceForOperation } from "@/services/Federation"
import { useFedimint } from "@/context/FedimintManager"
import type { LnReceiveState } from "@fedimint/core-web"
import { updateSessionThunk } from "@/redux/slices/SessionSlice"
import Stepper from "@/components/Stepper"
import { Button } from "@/components/ui/button"
import { BackToStep } from "@/services/SessionControl"


export default function FundNotes() {
    const { sessionId, walletId, operationId } = useSelector((state: RootState) => state.SessionSlice)
    const [selectedDenominations, setSelectedDenomination] = useState<DenominationPerNote[]>([])
    const { currentStep } = useSelector((state: RootState) => state.SessionSlice)
    const [createdInvoice, setCreatedInvoice] = useState<string | null>(null)
    const { wallet } = useFedimint()
    const dispatch = useDispatch<AppDispatch>()

    const unsubscribe = (operationId: string) => {
        const unsubscribe = wallet?.lightning.subscribeLnReceive(operationId, (state: LnReceiveState) => {
            console.log(state)
            if (state === 'claimed' || state === 'funded') {
                dispatch(updateSessionThunk({ operationId: operationId, paymentStatus: 'paid' }))
            }
        },
            (err: string) => {
                console.log("an error occured while subscribing to LnReceive", err)
            }
        )

        setTimeout(() => {
            unsubscribe?.()
        }, 300000);
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

    useEffect(() => {
        const loadSelectedDenomination = async () => {
            if (sessionId && wallet) {
                try {
                    const notesData = await getNotesData(sessionId)
                    setSelectedDenomination(notesData.notes)
                    let invoiceToUse: string | null = null

                    const invoiceData = await searchInvoiceForOperation(wallet, operationId)
                    if (operationId && (invoiceData?.amount === totalAmount)) {
                        if (invoiceData) {
                            invoiceToUse = invoiceData.invoice
                            setCreatedInvoice(invoiceData.invoice)
                            unsubscribe(operationId)
                        }
                    }

                    if (!invoiceToUse) {
                        const result = await createInvoice(wallet, totalAmount * 1000, notesData.expiry ?? 0)
                        dispatch(updateSessionThunk({ operationId: result.operation_id, upgradeStep: false }))
                        setCreatedInvoice(result.invoice)
                        unsubscribe(result.operation_id)
                    }
                } catch (err) {
                    console.log("an error occured", err)
                }
            }
        }
        loadSelectedDenomination()
    }, [walletId, wallet, selectedDenominations])

    const getPaymentStatus = async () => {
        if (!wallet) return;
        try {
            if (!operationId) throw new Error('Operation Id not found')
            const paymentData = await searchInvoiceForOperation(wallet, operationId)
            if (paymentData?.outcome === 'claimed' || paymentData?.outcome === 'funded') {
                dispatch(updateSessionThunk({ operationId: operationId, paymentStatus: 'paid' }))
            } else {
                alert('Payment Status: Waiting')
            }
        } catch (err) {
            console.log("an error occured")
        }
    }

    return (
        <div className="flex flex-col justify-center w-full">
            <DrawerHeader>
                <DrawerTitle className="text-center mt-4">Fund the Notes</DrawerTitle>
                <DrawerDescription className="text-center">Fund your physical ecash notes with lightning</DrawerDescription>
            </DrawerHeader>
            <Stepper currentStep={4} />
            <Alert className="max-w-md mt-6 mb-2 mx-auto border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                <div className="flex items-center justify-center gap-3 text-center">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <AlertDescription>
                        If someone scans your Paper Notes, they can redeem the funds.
                    </AlertDescription>
                </div>
            </Alert>
            <div className="text-center m-6">
                <h3 className="text-xl font-semibold text-[#4B5971]">Total Fundable Amount: <b className="text-[#1C6FA7]">{totalAmount} sats</b></h3>
                <p className="text-sm text-[#4B5563]">{totalExpression}</p>
            </div>
            {createdInvoice && <section className="max-w-md mx-auto mt-4 space-y-4 mb-4">
                <div className="flex flex-col items-center p-6 border rounded-xl bg-white dark:bg-zinc-900 shadow-sm">
                    <div className="p-4 bg-white rounded-lg border">
                        <QRCode value={createdInvoice} size={160} bgColor="white" fgColor="black" />
                    </div>

                    <p className="text-sm text-muted-foreground text-center mt-4">
                        Scan this QR code with your wallet to fund the notes
                    </p>

                    <div className="w-full mt-4">
                        <p className="text-xs text-muted-foreground mb-1">Lightning Invoice</p>

                        <div className="flex items-center gap-2 p-3 rounded-md bg-muted border text-xs break-all">
                            <span className="flex-1 font-mono">
                                {createdInvoice.slice(0, 50)}...
                            </span>

                            <button
                                className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:opacity-90"
                                onClick={() =>
                                    navigator.clipboard.writeText(createdInvoice)
                                }
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    You can also paste the invoice into an external Lightning wallet to complete the payment.
                </p>
            </section>}
            <DrawerFooter>
                <Button variant='outline' onClick={() => BackToStep(dispatch, currentStep)}>Back</Button>
                <p className="p-1 m-2 text-[#4B5971] text-sm text-center font-semibold cursor-pointer" onClick={getPaymentStatus}>Already Paid? Check payment status manually</p>
            </DrawerFooter>
        </div>
    )
}
