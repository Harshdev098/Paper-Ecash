import type { AppDispatch, RootState } from '@/redux/store'
import { useDispatch, useSelector } from 'react-redux'
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from '@/components/ui/button'
import Stepper from "@/components/Stepper"
import { useEffect, useMemo, useState } from "react"
import { getNotesData, getSessionBySessionId, saveNotesToDB } from "@/utils/db"
import { updateSessionThunk } from '@/redux/slices/SessionSlice'
import { BackToStep } from '@/services/SessionControl'
import Loader from '@/components/Loader'
import { setLoader } from '@/redux/slices/LoaderSlice'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { convertFromSat } from '@/services/Federation'
import { setErrorWithTimeout } from '@/redux/slices/Alert'

const MINT_DENOMINATIONS = [
    { msats: 1024, label: '1.02 sat' },
    { msats: 2048, label: '2.05 sat' },
    { msats: 4096, label: '4.10 sat' },
    { msats: 8192, label: '8.19 sat' },
    { msats: 16384, label: '16.4 sat' },
    { msats: 32768, label: '32.8 sat' },
    { msats: 65536, label: '65.5 sat' },
    { msats: 131072, label: '131 sat' },
    { msats: 262144, label: '262 sat' },
    { msats: 524288, label: '524 sat' },
    { msats: 1048576, label: '1.05 ksat' },
    { msats: 2097152, label: '2.10 ksat' },
    { msats: 4194304, label: '4.19 ksat' },
    { msats: 8388608, label: '8.39 ksat' },
    { msats: 16777216, label: '16.8 ksat' },
    { msats: 33554432, label: '33.6 ksat' },
    { msats: 67108864, label: '67.1 ksat' },
    { msats: 134217728, label: '134 ksat' },
    { msats: 268435456, label: '268 ksat' },
    { msats: 536870912, label: '537 ksat' },
    { msats: 1073741824, label: '1.07 Msat' },
]

const MAX_DENOMS_PER_NOTE = 4

export default function NoteDenomination() {
    const { walletId, sessionId, designId, currentStep } = useSelector((state: RootState) => state.SessionSlice)
    const { loader, loaderMessage } = useSelector((state: RootState) => state.LoaderSlice)
    const dispatch = useDispatch<AppDispatch>()
    const [noteMsats, setNoteMsats] = useState<number[]>([])
    const [noteCount, setNoteCount] = useState(1)
    const [usdAmount, setUsdAmount] = useState(0)

    useEffect(() => {
        if (!sessionId) return
        const load = async () => {
            try {
                dispatch(setLoader({ loader: true, loaderMessage: null }))
                const saved = await getNotesData(sessionId)
                if (saved) {
                    setNoteMsats(saved.noteMsats ?? [])
                    setNoteCount(saved.noteCount ?? 1)
                }
            } catch (err) {
                console.log("[NoteDenomination] load error:", err)
            } finally {
                dispatch(setLoader({ loader: false, loaderMessage: null }))
            }
        }
        load()
    }, [sessionId])

    const toggleDenom = (msats: number) => {
        setNoteMsats(prev => {
            if (prev.includes(msats)) return prev.filter(m => m !== msats)
            if (prev.length >= MAX_DENOMS_PER_NOTE) return prev
            return [...prev, msats]
        })
    }

    // Total msats for ONE paper note
    const noteTotalMsats = useMemo(
        () => noteMsats.reduce((s, m) => s + m, 0),
        [noteMsats]
    )

    // Total sats across all copies
    const totalSats = useMemo(
        () => (noteTotalMsats * noteCount) / 1000,
        [noteTotalMsats, noteCount]
    )

    useEffect(() => {
        if (totalSats === 0) return
        convertFromSat(totalSats)
            .then(setUsdAmount)
            .catch(err => console.log("[NoteDenomination] USD conversion error:", err))
    }, [totalSats])

    const formatMsats = (msats: number) => {
        const sats = msats / 1000
        if (sats >= 1_000_000) return (sats / 1_000_000).toFixed(2) + ' Msat'
        if (sats >= 1_000) return (sats / 1_000).toFixed(2) + ' ksat'
        return sats.toFixed(2) + ' sat'
    }

    const saveAndProceed = async () => {
        try {
            if (noteMsats.length === 0) throw new Error("Select at least one denomination")
            if (noteCount < 1) throw new Error("Need at least 1 note")
            if (!sessionId || !walletId) throw new Error("Session not initialized")

            dispatch(setLoader({ loader: true, loaderMessage: null }))
            const session = await getSessionBySessionId(sessionId)

            await saveNotesToDB({
                sessionId,
                noteMsats,
                noteCount,
                federationId: session?.federationId ?? '',
                designId,
            })

            dispatch(updateSessionThunk())
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            dispatch(setErrorWithTimeout({ type: "Notes Loader Error", message }))
        } finally {
            dispatch(setLoader({ loader: false, loaderMessage: null }))
        }
    }

    return (
        <>
            {loader && <Loader message={loaderMessage} />}
            <DrawerHeader>
                <DrawerTitle className='text-center text-2xl'>Select Note Denomination</DrawerTitle>
                <DrawerDescription className='text-center'>
                    Select up to {MAX_DENOMS_PER_NOTE} denominations per paper note.
                    Each is a single mint-native ecash note.
                </DrawerDescription>
            </DrawerHeader>

            <div className='m-4'>
                <Stepper currentStep={2} />
            </div>

            <section className="w-full max-w-xl mx-auto mt-4 px-4">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                    Composing <b>one</b> paper note ({noteMsats.length}/{MAX_DENOMS_PER_NOTE} selected)
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {MINT_DENOMINATIONS.map(({ msats, label }) => {
                        const selected = noteMsats.includes(msats)
                        const disabled = !selected && noteMsats.length >= MAX_DENOMS_PER_NOTE
                        return (
                            <button
                                key={msats}
                                disabled={disabled}
                                onClick={() => toggleDenom(msats)}
                                className={`
                                    py-3 rounded-lg border-2 text-sm font-medium
                                    transition-all duration-150 select-none
                                    ${selected
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : disabled
                                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                            : 'border-blue-400 text-[#4B5971] hover:scale-105 cursor-pointer'
                                    }
                                `}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>
            </section>

            {noteMsats.length > 0 && (
                <section className="max-w-xl mx-auto mt-5 px-4">
                    <div className="rounded-xl border bg-blue-50 dark:bg-blue-950 p-4 space-y-2">
                        <p className="text-sm font-semibold text-[#4B5971]">One paper note contains:</p>
                        <div className="flex flex-wrap gap-2">
                            {noteMsats.map((msats, i) => (
                                <span
                                    key={`${msats}-${i}`}
                                    className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs font-medium"
                                >
                                    {formatMsats(msats)}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-[#4B5971]">
                            Note value: <b className="text-blue-600">{formatMsats(noteTotalMsats)}</b>
                        </p>
                    </div>
                </section>
            )}

            <section className="max-w-xl mx-auto mt-4 px-4">
                <Field className="max-w-xs mx-auto">
                    <FieldLabel>Number of paper notes to print</FieldLabel>
                    <Input
                        type="number"
                        min={1}
                        max={20}
                        value={noteCount}
                        onChange={e => setNoteCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                    />
                </Field>
            </section>

            {noteMsats.length > 0 && (
                <section className="mt-5 text-center px-4 pb-2">
                    <p className="text-[#4B5971] text-lg">
                        Total to fund:{' '}
                        <b className="text-blue-500">{totalSats.toFixed(3)} sats</b>
                        <span className="text-sm text-muted-foreground ml-2">(~ ${usdAmount})</span>
                    </p>
                </section>
            )}

            <DrawerFooter>
                <Button
                    type="button"
                    onClick={saveAndProceed}
                    disabled={noteMsats.length === 0}
                    className='bg-[#319BD9] hover:bg-[#0e90dc] font-semibold'
                >
                    Next <i className="fa-solid fa-arrow-right ml-1"></i>
                </Button>
                <Button variant='outline' onClick={() => BackToStep(dispatch, currentStep)}>
                    Back
                </Button>
            </DrawerFooter>
        </>
    )
}