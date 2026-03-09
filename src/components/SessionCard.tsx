import { Dialog, DialogContent } from "@/components/ui/dialog"
import FederationSelecter from "@/pages/FederationSelecter"
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";


interface SessionCardProps {
  open: boolean
  onClose: () => void
}

export default function SessionCard({ open, onClose }: SessionCardProps) {
  const { currentStep } = useSelector((state: RootState) => state.SessionSlice)

  return (
    <>
      {currentStep === 1 && (
        <Dialog open={open} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl rounded-2xl p-0 overflow-hidden">
            <FederationSelecter />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
