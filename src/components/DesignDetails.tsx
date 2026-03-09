import { DialogHeader, Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { labelConfig } from '@/utils/label'
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import { useNavigate, useSearchParams } from "react-router-dom";
import { createSessionThunk, loadSessionThunk } from "@/redux/slices/SessionSlice";
import { searchDesignsInDraft } from "@/services/SessionControl";


interface DesignCardProps {
    open: boolean
    onClose: (open: boolean) => void
}

export default function DesignDetails({ open, onClose }: DesignCardProps) {
    const choosenDesign = useSelector((state: RootState) => state.choosenDesign)
    const [searchParams, setSearchParams] = useSearchParams()
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()

    const createNewSession = () => {
        console.log("generating new session")
        const sessionId = crypto.randomUUID()
        if (sessionId && choosenDesign) {
            console.log("creating the session")
            searchParams.set("id", sessionId)
            setSearchParams(searchParams)
            dispatch(createSessionThunk({ sessionId, designId: choosenDesign?.id }))
        } else {
            console.log("session or design not found")
        }
    }

    const continueDraftSession = (draftSession: string) => {
        console.log("Draft session found for the same design")
        searchParams.set("id", draftSession)
        setSearchParams(searchParams)
        dispatch(loadSessionThunk(draftSession))
    }

    const startSession = async () => {
        const draftSession = await searchDesignsInDraft(choosenDesign?.id)
        if (!draftSession) {
            createNewSession()
        } else {
            continueDraftSession(draftSession)
        }
    }

    const handleClose = (open: boolean) => {
        if (!open) {
            console.log("closing the dialog")
            onClose(open)
            navigate("/explore")
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-5xl rounded-2xl p-0 overflow-hidden">
                    <div className="relative group">
                        <img
                            src={choosenDesign?.path}
                            alt={choosenDesign?.DesignName}
                            className="w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button className="bg-transparent text-white text-base font-semibold px-6 py-3 border-2 border-white rounded-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                Preview
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-4 !pt-0">
                        <DialogHeader className="space-y-1 text-left items-start">
                            <DialogTitle className="text-2xl font-semibold">
                                {choosenDesign?.DesignName}
                            </DialogTitle>

                            <DialogDescription>
                                Designer: {choosenDesign?.designer}
                            </DialogDescription>
                            <DialogDescription>
                                Supporting LNURL: {choosenDesign?.lnurl}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-wrap gap-2">
                            {choosenDesign?.label.map((lbl) => {
                                const config = labelConfig[lbl]

                                return (
                                    <Badge
                                        key={lbl}
                                        className={`transition ${config.bg} ${config.text} ${config.hover}`}
                                    >
                                        <i className={`${config.icon} mr-2`} />
                                        {lbl}
                                    </Badge>
                                )
                            })}
                        </div>

                        <DialogFooter className="flex flex-row justify-end items-center gap-3">
                            <Button variant="outline" className="w-8 h-8 rounded-full bg-pink-50 border-pink-400 text-pink-600 hover:bg-pink-100 hover:text-pink-700 hover:shadow-lg transition-all duration-300 flex items-center justify-center">
                                <i className="fa-solid fa-hand-holding-heart text-base"></i>
                            </Button>
                            <Button type="button" className="bg-[#319BD9] hover:bg-[#0e90dc] text-base font-semibold" onClick={startSession}>
                                Start session
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
