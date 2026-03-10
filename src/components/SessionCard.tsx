import { Dialog, DialogContent } from "@/components/ui/dialog"
import FederationSelecter from "@/pages/FederationSelecter"
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { FedimintManagerProvider } from "@/context/FedimintManager";
import NoteDenomination from "@/pages/NoteDenomination";


interface SessionCardProps {
  open: boolean
  onClose: () => void
}

export default function SessionCard({ open, onClose }: SessionCardProps) {
  const { currentStep } = useSelector((state: RootState) => state.SessionSlice)

  return (
    <>
      <FedimintManagerProvider>
        {currentStep === 1 && (
          <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl rounded-2xl p-0 overflow-hidden">
              <FederationSelecter />
            </DialogContent>
          </Dialog>
        )}

        {currentStep === 2 && (
          <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl rounded-2xl p-0 overflow-hidden">
              <NoteDenomination />
            </DialogContent>
          </Dialog>
        )}
      </FedimintManagerProvider>
    </>
  )
}
