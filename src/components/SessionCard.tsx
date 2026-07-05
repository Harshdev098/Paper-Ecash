import { Drawer, DrawerContent } from "@/components/ui/drawer"
import FederationSelecter from "@/pages/FederationSelecter"
import NoteDenomination from "@/pages/NoteDenomination"
import FundNotes from "@/pages/FundNotes"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { FedimintManagerProvider } from "@/context/FedimintManager"
import DownloadPDF from "@/pages/DownloadPDF"
import { useEffect } from "react"

interface SessionCardProps {
    open: boolean
    onClose: (open: boolean) => void
}

export default function SessionCard({ open, onClose }: SessionCardProps) {
    const { currentStep, sessionId } = useSelector((state: RootState) => state.SessionSlice)

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [open])

    const STEPS: Record<number, React.ReactNode> = {
        1: <FederationSelecter />,
        2: <NoteDenomination />,
        3: <FundNotes />,
        4: <DownloadPDF />,
    }

    const step = STEPS[currentStep]

    return (
        <FedimintManagerProvider key={sessionId ?? 'no-session'}>
            <Drawer open={open && !!step} onOpenChange={onClose}>
                <DrawerContent className="w-full rounded-2xl max-h-[80vh] flex flex-col">
                    <div className="flex-1 overflow-y-auto relative">
                        {step ?? null}
                    </div>
                </DrawerContent>
            </Drawer>
        </FedimintManagerProvider>
    )
}
