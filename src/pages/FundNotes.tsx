import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/redux/store"
import { useEffect, useMemo, useRef, useState } from "react"
import { getNotesData } from "@/utils/db"
import QRCode from "react-qr-code"
import { convertFromSat, createInvoice, searchInvoiceForOperation } from "@/services/Federation"
import { useFedimint } from "@/context/FedimintManager"
import { updateSessionThunk } from "@/redux/slices/SessionSlice"
import Stepper from "@/components/Stepper"
import { Button } from "@/components/ui/button"
import { BackToStep } from "@/services/SessionControl"
import { setLoader } from "@/redux/slices/LoaderSlice"
import Loader from "@/components/Loader"
import { isAlreadyProcessing, startPaymentSession, type InvoiceStatus } from "@/services/PaymentManager"

export default function FundNotes() {
    const { sessionId, walletId, operationId: reduxOperationId, paymentStatus, currentStep } = useSelector((state: RootState) => state.SessionSlice)
    const { loader, loaderMessage } = useSelector((state: RootState) => state.LoaderSlice)
    const { walletStatus } = useSelector((state: RootState) => state.WalletSlice)
    const { wallet } = useFedimint()
    const dispatch = useDispatch<AppDispatch>()
    const isRunningRef = useRef(false)
    const [noteMsats, setNoteMsats] = useState<number[]>([])
    const [noteCount, setNoteCount] = useState(1)
    const [createdInvoice, setCreatedInvoice] = useState<string | null>(null)
    const [usdAmount, setUsdAmount] = useState(0)
    const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus | null>(null)
    const noteTotalMsats = useMemo(() => noteMsats.reduce((s, m) => s + m, 0), [noteMsats])
    const invoiceMsats = useMemo(() => noteTotalMsats * noteCount, [noteTotalMsats, noteCount])
    const totalSats = useMemo(() => invoiceMsats / 1000, [invoiceMsats])

    useEffect(() => {
        if (!sessionId) return
        const load = async () => {
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Loading denomination" }))
                const saved = await getNotesData(sessionId)
                if (saved) {
                    setNoteMsats(saved.noteMsats ?? [])
                    setNoteCount(saved.noteCount ?? 1)
                }
            } catch (err) {
                console.log("[FundNotes] load error:", err)
            } finally {
                dispatch(setLoader({ loader: false, loaderMessage: null }))
            }
        }
        load()
    }, [sessionId])

    useEffect(() => {
        if (totalSats === 0) return
        convertFromSat(totalSats)
            .then(setUsdAmount)
            .catch(err => console.log("[FundNotes] USD conversion error:", err))
    }, [totalSats])

    useEffect(() => {
        if (walletStatus !== 'opened') return
        if (!wallet || !walletId || !sessionId || invoiceMsats === 0) return
        if (paymentStatus === 'paid') return
        if (isRunningRef.current) return

        isRunningRef.current = true

        const handleInvoice = async () => {
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Processing Invoice" }))

                const existingTx = reduxOperationId
                    ? await searchInvoiceForOperation(wallet, reduxOperationId)
                    : null

                console.log("[FundNotes] existing tx:", existingTx)

                const canReuse =
                    existingTx &&
                    !existingTx.expired &&
                    Math.abs(existingTx.amount - invoiceMsats) < 10

                if (canReuse && reduxOperationId) {
                    console.log("[FundNotes] reusing invoice for op:", reduxOperationId)
                    setCreatedInvoice(existingTx!.invoice)
                    setInvoiceStatus('waiting')
                    if (!isAlreadyProcessing(reduxOperationId)) {
                        startPaymentSession(
                            wallet, reduxOperationId,
                            () => dispatch(updateSessionThunk({ operationId: reduxOperationId, paymentStatus: 'paid' })),
                            (status) => {
                                setInvoiceStatus(status)
                                if (status === 'canceled') isRunningRef.current = false
                            }
                        )
                    }
                    return
                }

                if (existingTx?.expired) {
                    console.log("[FundNotes] invoice expired — creating new")
                    setInvoiceStatus('canceled')
                }

                console.log("[FundNotes] creating invoice for", invoiceMsats, "msats")
                const result = await createInvoice(wallet, invoiceMsats)
                const currentOpId = result.operation_id

                startPaymentSession(
                    wallet, currentOpId,
                    () => dispatch(updateSessionThunk({ operationId: currentOpId, paymentStatus: 'paid' })),
                    (status) => {
                        setInvoiceStatus(status)
                        if (status === 'canceled') isRunningRef.current = false
                    }
                )

                dispatch(updateSessionThunk({ operationId: currentOpId, upgradeStep: false }))
                setCreatedInvoice(result.invoice)
                setInvoiceStatus('waiting')

            } catch (err) {
                console.error("[FundNotes] invoice error:", err)
                isRunningRef.current = false
            } finally {
                dispatch(setLoader({ loader: false, loaderMessage: null }))
            }
        }

        handleInvoice()
    }, [walletStatus, walletId, invoiceMsats, reduxOperationId])

    const getPaymentStatus = async () => {
        if (!wallet || !reduxOperationId) return
        try {
            dispatch(setLoader({ loader: true, loaderMessage: "Checking payment status" }))
            const balance = await wallet.balance.getBalance()
            if (balance >= invoiceMsats) {
                dispatch(updateSessionThunk({ operationId: reduxOperationId, paymentStatus: 'paid' }))
            } else {
                alert(`Payment pending — balance ${balance / 1000} sats, need ${totalSats} sats`)
            }
        } catch (err) {
            console.log("[FundNotes] check error:", err)
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
                        <b className="text-[#1C6FA7]">{totalSats.toFixed(3)} sats</b>
                    </h3>
                    <p className="text-sm text-[#4B5563]">~ ${usdAmount}</p>
                </div>

                {invoiceStatus && (
                    <div
                        className="mx-auto mt-4 flex items-center gap-2 px-4 py-2 rounded-full border border-blue-600 bg-blue-50 text-blue-800 text-sm font-medium w-fit"
                    >
                        <span className="capitalize">{invoiceStatus}</span>
                    </div>
                )}

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