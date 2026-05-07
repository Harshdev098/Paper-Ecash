import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "./ui/button"
import { useState } from "react"
import QRCode from "react-qr-code"

interface LnurlPayPrompt {
    open: boolean
    onClose: (open: boolean) => void
    address: string
    designerName: string
}

export default function LnurlPay({ open, onClose, address, designerName }: LnurlPayPrompt) {
    const [copied, setCopied] = useState(false)

    const copyAddress = async () => {
        await navigator.clipboard.writeText(address)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-semibold">
                        Support {designerName}
                    </DialogTitle>
                    <DialogDescription>
                        Scan with any lnurl enabled Lightning wallet to send a tip directly to the designer.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="p-4 bg-white rounded-xl border shadow-sm">
                        <QRCode
                            value={`lightning:${address}`}
                            size={200}
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted border text-sm font-mono">
                        <span className="flex-1 text-center truncate">{address}</span>
                        <button
                            onClick={copyAddress}
                            className="shrink-0 px-2 py-1 text-xs rounded bg-primary text-primary-foreground hover:opacity-90"
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        type="button"
                        className="w-full bg-[#319BD9] hover:bg-[#0e90dc] font-semibold"
                        onClick={() => { window.location.href = `lightning:${address}` }}
                    >
                        <i className="fa-solid fa-bolt mr-2"></i>
                        Open in Lightning Wallet
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Works with Mutiny, Wallet of Satoshi, and any LNURL-compatible wallet.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}