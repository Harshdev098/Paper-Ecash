import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { getEcashNoteData } from "@/utils/db"
import { decryptTokens } from "@/utils/ecash"
import { getMnemonic } from "@fedimint/core-web"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/redux/store"
import { setErrorWithTimeout } from "@/redux/slices/Alert"
import QRCode from "react-qr-code"

export default function ReclaimNotes({
    sessionId,
    noteTotalSats,
}: {
    sessionId: string
    noteTotalSats: number
}) {
    const [tokens, setTokens] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [expiresAt, setExpiresAt] = useState<number | null>(null)

    const [selectedToken, setSelectedToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const dispatch = useDispatch<AppDispatch>()

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const ecashData = await getEcashNoteData(sessionId)

                if (!ecashData) {
                    setTokens([])
                    return
                }
                const mnemonic = await getMnemonic()

                if (!mnemonic?.length) {
                    throw new Error(
                        "Wallet not initialized — cannot decrypt notes"
                    )
                }

                const decrypted = await decryptTokens(
                    ecashData.encryptedTokens,
                    mnemonic
                )
                setTokens(decrypted)

                const ONE_DAY_MS = 24 * 60 * 60 * 1000
                setExpiresAt(ecashData.createdAt + ONE_DAY_MS)
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                dispatch(
                    setErrorWithTimeout({
                        type: "Decryption Error",
                        message: message.includes("decrypt")
                            ? "Could not decrypt notes. Make sure you are using the same wallet that generated these notes."
                            : message,
                    })
                )
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [sessionId])

    const copyToken = async (token: string) => {
        await navigator.clipboard.writeText(token)

        setCopied(true)

        setTimeout(() => {
            setCopied(false)
        }, 2000)
    }

    const formatExpiry = (ts: number) => {
        const diff = ts - Date.now()

        if (diff <= 0) return "expired"

        const hours = Math.floor(diff / (1000 * 60 * 60))

        const mins = Math.floor(
            (diff % (1000 * 60 * 60)) / (1000 * 60)
        )

        return `${hours}h ${mins}m`
    }

    if (loading) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                Decrypting notes...
            </div>
        )
    }

    if (tokens.length === 0) {
        return (
            <div className="max-w-md mx-auto m-4 space-y-3 px-4">
                <div className="rounded-xl border bg-amber-50 dark:bg-amber-950 p-4 space-y-2">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                        No Reclaim found
                    </p>

                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        The 24-hour reclaim window has expired or no notes were generated for this session. If you still have the physical notes, they will remain valid.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
            <section className="space-y-3 px-2 m-4 pb-4">
                {expiresAt && (
                    <p className="text-sm text-center text-muted-foreground">
                        Reclaim expires in{" "}
                        <b>{formatExpiry(expiresAt)}</b>.
                    </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tokens.map((token, index) => (
                        <Card
                            key={index}
                            className="shadow-md border"
                        >
                            <CardContent className="p-4 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-sm">
                                        Note #{index + 1}
                                    </span>
                                </div>

                                <div className="text-lg font-bold text-primary">
                                    {noteTotalSats}{" "}SATS
                                </div>

                                <Button
                                    onClick={() =>
                                        setSelectedToken(token)
                                    }
                                    className="w-full bg-[#319BD9] hover:bg-[#0e90dc]"
                                >
                                    View Reclaim QR
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <Dialog
                open={!!selectedToken}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedToken(null)
                    }
                }}
            >
                <DialogContent className="w-[95vw] max-w-md sm:max-w-lg overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl font-semibold">
                            Reclaim Ecash Note
                        </DialogTitle>

                        <DialogDescription>
                            Scan this QR with any
                            Fedimint-compatible wallet or copy the
                            token manually.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedToken && (
                        <div className="flex flex-col items-center gap-4 py-2">
                            <div className="w-full flex justify-center p-3 sm:p-4 bg-white rounded-xl border shadow-sm overflow-hidden">
                                <div className="w-[180px] sm:w-[220px]">
                                    <QRCode
                                        value={selectedToken}
                                        size={256}
                                        style={{
                                            width: "100%",
                                            height: "auto",
                                        }}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0 p-2 rounded-lg bg-muted border overflow-hidden">
                                <span className="flex-1 min-w-0 break-all text-[10px] sm:text-xs font-mono">
                                    {selectedToken}
                                </span>

                                <button
                                    onClick={() =>
                                        copyToken(selectedToken)
                                    }
                                    className="shrink-0 px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:opacity-90"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}