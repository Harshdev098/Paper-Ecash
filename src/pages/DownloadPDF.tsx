import { Button } from "@/components/ui/button";
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { extractDesign } from "@/services/SessionControl";
import { getNotesData } from "@/utils/db";
import { setLoader } from "@/redux/slices/LoaderSlice"
import Loader from "@/components/Loader";
import { generateNotesPDF } from "@/services/NotesDownloader";
import { useFedimint } from "@/context/FedimintManager";
import { convertFromSat } from "@/services/Federation";
import PreviewDesign from "@/components/PreviewDesign";
import ReclaimNotes from "@/components/ReclaimNotes";
import { setErrorWithTimeout } from "@/redux/slices/Alert";
import LnurlPay from "@/components/LnurlPay";


export default function DownloadPDF() {
    const dispatch = useDispatch<AppDispatch>()
    const { designId, sessionId } = useSelector((state: RootState) => state.SessionSlice)
    const [dpi, setDpi] = useState<"300" | "72" | "150">("300");
    const [printSize, setPrintSize] = useState<"a4" | "letter" | "a5">('a4')
    const [qrColors, setQrColors] = useState({ fg: "#000000", bg: "#ffffff" });
    const { loader, loaderMessage } = useSelector((state: RootState) => state.LoaderSlice)
    const [usdAmount, setUSDAmount] = useState<number>(0)
    const [noteMsats, setNoteMsats] = useState<number[]>([])
    const [noteCount, setNoteCount] = useState(1)
    const noteTotalMsats = noteMsats.reduce((s, m) => s + m, 0)
    const totalSats = Number(((noteTotalMsats * noteCount) / 1000).toFixed(2))
    const { wallet } = useFedimint()
    const [reclaimWindow, setReclaimWindow] = useState<boolean>(false)
    const [openLnurl, setOpenLnurl] = useState<boolean>(false)
    const [includeTamperRegion, setIncludeTamperRegion] = useState<boolean>(false);
    const [downloading, setDownloading] = useState<boolean>(false)

    const design = useMemo(() => {
        if (!designId) return null;
        return extractDesign(designId)
    }, [designId])

    useEffect(() => {
        const load = async () => {
            if (!sessionId) return
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Loading denomination" }))
                const saved = await getNotesData(sessionId)
                if (saved) {
                    setNoteMsats(saved.noteMsats ?? [])
                    setNoteCount(saved.noteCount ?? 1)
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                dispatch(setErrorWithTimeout({ type: "Notes Loader Error", message }))
            }
            finally { dispatch(setLoader({ loader: false, loaderMessage: null })) }
        }
        load()
    }, [sessionId])

    useEffect(() => {
        const getUSDAmount = async () => {
            try {
                const usdValue = await convertFromSat(totalSats)
                setUSDAmount(usdValue)
            } catch (err) {
                console.log("an error occured while converting sats to usd", err)
            }
        }
        getUSDAmount()
    }, [totalSats, wallet])

    const DownloadPDF = async () => {
        try {
            if (!wallet) throw new Error("Wallet not found")
            if (!design) throw new Error("design not found")
            if (!sessionId) throw new Error("session not found")
            if (noteMsats.length === 0) throw new Error("Note composition not found")
            dispatch(setLoader({ loader: true, loaderMessage: "Creating and downloading the PDF" }))
            setDownloading(true)
            await generateNotesPDF(
                design,
                sessionId,
                noteMsats,
                noteCount,
                dpi,
                printSize,
                qrColors.fg,
                qrColors.bg,
                wallet,
                dispatch,
                includeTamperRegion,
            )
        } catch (err) {
            console.log("error downloading pdf", err)
            const message = err instanceof Error ? err.message : String(err);
            dispatch(setErrorWithTimeout({ type: "Notes Downloading Error", message }))
        } finally {
            dispatch(setLoader({ loader: false, loaderMessage: null }))
            setDownloading(false)
        }
    }

    return (
        <>
            {loader && <Loader message={loaderMessage} />}
            <section className="flex flex-col md:flex-row flex-wrap">
                {design && (
                    <PreviewDesign
                        design={design}
                        noteTotalMsats={Number((noteTotalMsats / 1000).toFixed(2))}
                        showTamperRegion={includeTamperRegion}
                        onColorsResolved={(colors) => {
                            setQrColors({ fg: colors.fg, bg: colors.bg })
                        }}
                    />
                )}

                <div className="md:w-1/2 w-full flex flex-col justify-between p-6">
                    <DrawerHeader>
                        <DrawerTitle className="text-center text-2xl">
                            Download Ecash Notes
                        </DrawerTitle>
                        <DrawerDescription className="text-center">
                            Download ecash notes in high resolution and consistent DPI PDFs
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="text-center m-6">
                        <h3 className="text-xl font-semibold text-muted-foreground">Amount: <b className="text-[#1C6FA7]">{totalSats} sats</b></h3>
                        <p className="text-sm text-muted-foreground">~ ${usdAmount}</p>
                    </div>
                    <div className="mt-4">
                        <div className="bg-yellow-100 rounded-lg p-3 flex flex-row justify-between items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                Add optional tamper-evident or scratch-off regions
                            </p>
                            <Button onClick={() => setIncludeTamperRegion(!includeTamperRegion)} className="self-end md:self-auto px-3 py-1 text-xs md:text-sm bg-brand text-white rounded-md hover:bg-[#0e90dc]">
                                {!includeTamperRegion ? (
                                    <>
                                        <i className="fa-solid fa-plus mr-1"></i>
                                        Add
                                    </>
                                ) : (
                                    "Remove"
                                )}
                            </Button>
                        </div>

                        <div className="flex flex-wrap flex-row gap-4 justify-center items-center">
                            <div className="my-2">
                                <Field className="w-full max-w-48">
                                    <FieldLabel>DPI</FieldLabel>
                                    <Select value={dpi} onValueChange={(value) => setDpi(value as "300" | "72" | "150")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a Resolution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="72">72 DPI (Preview)</SelectItem>
                                                <SelectItem value="150">150 DPI (Standard)</SelectItem>
                                                <SelectItem value="300">300 DPI (High Quality)</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            <div className="my-2">
                                <Field className="w-full max-w-48">
                                    <FieldLabel>Print Size</FieldLabel>
                                    <Select value={printSize} onValueChange={(value) => setPrintSize(value as "a4" | "letter" | "a5")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a Resolution" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="a4">A4 (210mm x 297mm)</SelectItem>
                                                <SelectItem value="letter">Letter (8.5" x 11")</SelectItem>
                                                <SelectItem value="a5">A5</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button
                            type="button"
                            className="bg-brand hover:bg-[#0e90dc] text-base font-semibold"
                            disabled={downloading}
                            onClick={DownloadPDF}
                        >
                            <i className="fa-solid fa-download text-base"></i> Download PDF
                        </Button>
                        <Button
                            onClick={() => setOpenLnurl(true)}
                            className="w-full bg-pink-200 text-pink-600 hover:bg-pink-100 hover:text-pink-700 text-base font-semibold"
                        >
                            <i className="fa-solid fa-hand-holding-heart text-base"></i> Support Designer
                        </Button>
                        <Button
                            type="button"
                            className="bg-white border border-[#319BD9] hover:bg-white text-brand text-base font-semibold"
                            onClick={() => setReclaimWindow(!reclaimWindow)}
                        >
                            <i className="fa-solid fa-rotate-left"></i> Reclaim Ecash Notes
                        </Button>
                    </DrawerFooter>
                </div>
            </section>
            {openLnurl && design?.lnurl && (
                <LnurlPay open={openLnurl} onClose={setOpenLnurl} address={design.lnurl} designerName={design.designer} />
            )}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${reclaimWindow
                    ? "max-h-[2000px] opacity-100 mt-4"
                    : "max-h-0 opacity-0"
                    }`}
            >
                {reclaimWindow && (
                    <div className="border rounded-xl bg-muted/20 p-3 sm:p-4">
                        <ReclaimNotes
                            noteTotalSats={Number((noteTotalMsats / 1000).toFixed(2))}
                            sessionId={sessionId ?? ""}
                            wallet={wallet}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
