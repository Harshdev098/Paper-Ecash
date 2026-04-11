import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/redux/store"
import { useEffect, useMemo, useRef, useState } from "react"
import type { DenominationPerNote } from "@/types/fedimint.type"
import { getNotesData } from "@/utils/db"
import QRCode from "react-qr-code"
import { convertFromSat, createInvoice } from "@/services/Federation"
import { useFedimint } from "@/context/FedimintManager"
import { updateSessionThunk } from "@/redux/slices/SessionSlice"
import Stepper from "@/components/Stepper"
import { Button } from "@/components/ui/button"
import { BackToStep } from "@/services/SessionControl"
import { setLoader } from "@/redux/slices/LoaderSlice"
import Loader from "@/components/Loader"
import { isAlreadyProcessing, startPaymentSession } from "@/services/PaymentManager"

export default function FundNotes() {
    const {
        sessionId,
        walletId,
        operationId: reduxOperationId,
        paymentStatus,
        currentStep
    } = useSelector((state: RootState) => state.SessionSlice)
    const { loader, loaderMessage } = useSelector((state: RootState) => state.LoaderSlice)
    const [selectedDenominations, setSelectedDenomination] = useState<DenominationPerNote[]>([])
    const [createdInvoice, setCreatedInvoice] = useState<string | null>(null)
    const { walletStatus } = useSelector((state: RootState) => state.WalletSlice)
    const [usdAmount, setUSDAmount] = useState<number>(0)
    const { wallet } = useFedimint()
    const dispatch = useDispatch<AppDispatch>()
    const isRunningRef = useRef(false)

    useEffect(() => {
        if (!sessionId) return
        const load = async () => {
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Loading Selected Denomination" }))
                const notesData = await getNotesData(sessionId)
                setSelectedDenomination(notesData.notes)
            } catch (err) {
                console.log(err)
            } finally {
                dispatch(setLoader({ loader: false, loaderMessage: null }))
            }
        }
        load()
    }, [sessionId])

    const totalAmount = useMemo(() => {
        const total = selectedDenominations.reduce(
            (sum, item) => sum + item.denomination * item.quantity,
            0
        )
        return Number(total.toFixed(2))
    }, [selectedDenominations])

    useEffect(() => {
        const getUSDAmount = async () => {
            try {
                const usdValue = await convertFromSat(totalAmount)
                setUSDAmount(usdValue)
            } catch (err) {
                console.log("error converting sats to usd", err)
            }
        }
        getUSDAmount()
    }, [totalAmount])

    useEffect(() => {
        if (walletStatus !== 'opened') return
        if (!wallet || !walletId || !sessionId || totalAmount === 0) return
        if (paymentStatus === 'paid') return

        if (reduxOperationId) {
            if (!isAlreadyProcessing(reduxOperationId)) {
                console.log("Reattaching listener to existing operation")
                startPaymentSession(wallet, reduxOperationId, () => {
                    dispatch(updateSessionThunk({ operationId: reduxOperationId, paymentStatus: 'paid' }))
                })
            } else {
                console.log("Listener already active — skipping")
            }
            return
        }

        if (isRunningRef.current) return
        isRunningRef.current = true

        const run = async () => {
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Processing Invoice" }))

                console.log("Creating invoice for", totalAmount, "sats")
                const result = await createInvoice(wallet, Math.round(totalAmount * 1000))
                const currentOpId = result.operation_id

                startPaymentSession(
                    wallet,
                    currentOpId,
                    () => {
                        dispatch(updateSessionThunk({
                            operationId: currentOpId,
                            paymentStatus: 'paid'
                        }))
                    }
                )

                dispatch(updateSessionThunk({
                    operationId: currentOpId,
                    upgradeStep: false
                }))

                setCreatedInvoice(result.invoice)

            } catch (err) {
                console.error("Invoice error:", err)
                isRunningRef.current = false
            } finally {
                dispatch(setLoader({ loader: false, loaderMessage: null }))
            }
        }

        run()

    }, [walletStatus, wallet?.id, walletId, sessionId, totalAmount, reduxOperationId, paymentStatus])

    const getPaymentStatus = async () => {
        if (!wallet || !reduxOperationId) return
        try {
            dispatch(setLoader({ loader: true, loaderMessage: "Getting Payment status" }))
            const balance = await wallet.balance.getBalance()
            if (balance >= totalAmount * 1000) {
                dispatch(updateSessionThunk({ operationId: reduxOperationId, paymentStatus: 'paid' }))
            } else {
                alert(`Payment pending — balance is ${balance / 1000} sats, need ${totalAmount} sats`)
            }
        } catch (err) {
            console.log("error checking payment status", err)
        } finally {
            dispatch(setLoader({ loader: false, loaderMessage: null }))
        }
    }

    return (
        <>
            {loader && <Loader message={loaderMessage} />}
            <div className="flex flex-col justify-center w-full">
                <DrawerHeader>
                    <DrawerTitle className="text-center mt-4">Fund the Notes</DrawerTitle>
                    <DrawerDescription className="text-center">
                        Fund your physical ecash notes with lightning
                    </DrawerDescription>
                </DrawerHeader>
                <Stepper currentStep={3} />
                <Alert className="max-w-md mt-6 mb-2 mx-auto border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                    <div className="flex items-center justify-center gap-3 text-center">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <AlertDescription>
                            If someone scans your Paper Notes, they can redeem the funds.
                        </AlertDescription>
                    </div>
                </Alert>
                <div className="text-center m-6">
                    <h3 className="text-xl font-semibold text-[#4B5971]">
                        Total Fundable Amount:{" "}
                        <b className="text-[#1C6FA7]">{totalAmount} sats</b>
                    </h3>
                    <p className="text-sm text-[#4B5563]">~ ${usdAmount}</p>
                </div>
                {createdInvoice && (
                    <section className="max-w-md mx-auto mt-4 space-y-4 mb-4">
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
                                        onClick={() => navigator.clipboard.writeText(createdInvoice)}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                        <Button
                            className="w-full mt-3"
                            onClick={() => { window.location.href = `lightning:${createdInvoice}` }}
                        >
                            Open in Wallet <i className="fa-solid fa-bolt"></i>
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            You can also paste the invoice into an external Lightning wallet.
                        </p>
                    </section>
                )}
                <DrawerFooter>
                    <Button variant='outline' onClick={() => BackToStep(dispatch, currentStep)}>
                        Back
                    </Button>
                    <p
                        className="p-1 m-2 text-[#4B5971] text-sm text-center font-semibold cursor-pointer"
                        onClick={getPaymentStatus}
                    >
                        Already Paid? Check payment status manually
                    </p>
                </DrawerFooter>
            </div>
        </>
    )
}
