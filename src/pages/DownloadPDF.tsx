import { Button } from "@/components/ui/button";
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useRef, useState } from "react";
import { FastAverageColor } from "fast-average-color";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { extractDesign } from "@/services/SessionControl";
import { getNotesData } from "@/utils/db";
import { setLoader } from "@/redux/slices/LoaderSlice"
import Loader from "@/components/Loader";
import { generateNotesPDF, getSmartColors } from "@/services/NotesDownloader";
import { useFedimint } from "@/context/FedimintManager";
import { convertFromSat } from "@/services/Federation";
import PreviewDesign from "@/components/PreviewDesign";
import ReclaimNotes from "@/components/ReclaimNotes";


export default function DownloadPDF() {
    const dispatch = useDispatch<AppDispatch>()
    const [bgColor, setBgColor] = useState("#eff6ff");
    const { designId, sessionId } = useSelector((state: RootState) => state.SessionSlice)
    const design = designId ? extractDesign(designId) : null;
    const [dpi, setDpi] = useState<"300" | "72" | "150">("300");
    const [printSize, setPrintSize] = useState<"a4" | "letter" | "a5">('a4')
    const [qrColors, setQrColors] = useState({ bg: "#ffffff", fg: "#000000" });
    const { loader, loaderMessage } = useSelector((state: RootState) => state.LoaderSlice)
    const [usdAmount, setUSDAmount] = useState<number>(0)
    const [noteMsats, setNoteMsats] = useState<number[]>([])
    const [noteCount, setNoteCount] = useState(1)
    const noteTotalMsats = noteMsats.reduce((s, m) => s + m, 0)
    const totalSats = (noteTotalMsats * noteCount) / 1000
    const { wallet } = useFedimint()
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [reclaimWindow, setReclaimWindow] = useState(false)

    useEffect(() => {
        const load = async () => {
            if (!sessionId) return
            try {
                dispatch(setLoader({ loader: true, loaderMessage: "Loading denomination" }))
                const saved = await getNotesData(sessionId)
                console.log("the saved notes data are",saved)
                if (saved) {
                    setNoteMsats(saved.noteMsats ?? [])
                    setNoteCount(saved.noteCount ?? 1)
                }
            } catch (err) { console.log(err) }
            finally { dispatch(setLoader({ loader: false, loaderMessage: null })) }
        }
        load()
    }, [sessionId])

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        dispatch(setLoader({ loader: true, loaderMessage: "Previewing the Notes" }))
        const fac = new FastAverageColor();

        const handleLoad = async () => {
            try {
                const color = await fac.getColorAsync(img);
                const colors = getSmartColors(img);

                if (colors) {
                    setQrColors({
                        bg: colors.light,
                        fg: colors.dark,
                    });
                }
                setBgColor(color.hex);
            } catch (err) {
                console.error(err);
            } finally {
                fac.destroy();
            }
        };

        if (img.complete && img.naturalWidth > 0) {
            handleLoad();
        } else {
            img.addEventListener('load', handleLoad);
        }
        dispatch(setLoader({ loader: false, loaderMessage: null }))

        return () => {
            img.removeEventListener('load', handleLoad);
            fac.destroy();
        };
    }, [design?.path]);

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
            if(!sessionId) throw new Error("session not found")
            if (noteMsats.length === 0) throw new Error("Note composition not found")
            dispatch(setLoader({ loader: true, loaderMessage: "Creating and downloading the PDF" }))
            await generateNotesPDF(design, sessionId, noteMsats, noteCount, dpi, printSize, qrColors.fg, qrColors.bg, wallet)
        } catch (err) {
            console.log("error downloading pdf", err)
        } finally {
            dispatch(setLoader({ loader: false, loaderMessage: null }))
        }
    }

    return (
        <>
            {loader && <Loader message={loaderMessage} />}
            <section className="flex flex-col md:flex-row flex-wrap">
                <div
                    className="md:w-1/2 w-full mt-4 flex items-end justify-center transition-colors duration-500 relative"
                    style={{
                        background: `linear-gradient(to bottom, white, ${bgColor})`
                    }}
                >
                    <div className="w-full flex justify-center items-center pb-8 px-4">
                        <PreviewDesign design={design} totalSats={totalSats} />
                    </div>
                </div>

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
                        <h3 className="text-xl font-semibold text-[#4B5971]">Amount: <b className="text-[#1C6FA7]">{totalSats} sats</b></h3>
                        <p className="text-sm text-[#4B5563]">~ ${usdAmount}</p>
                    </div>
                    <div className="mt-4">
                        <div className="bg-yellow-100 rounded-lg p-3 flex flex-row justify-between items-center gap-2">
                            <p className="text-sm text-[#4B5971]">
                                Add optional tamper-evident or scratch-off regions
                            </p>
                            <button className="self-end md:self-auto px-3 py-1 text-xs md:text-sm bg-[#319BD9] text-white rounded-md hover:bg-[#0e90dc]">
                                <i className="fa-solid fa-plus"></i> Add
                            </button>
                        </div>

                        <div className="flex flex-wrap flex-row gap-4 justify-center md:gap-20 items-center">
                            <div className="my-6">
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
                            <div className="my-6">
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
                            className="bg-[#319BD9] hover:bg-[#0e90dc] text-base font-semibold"
                            onClick={DownloadPDF}
                        >
                            <i className="fa-solid fa-download text-base"></i> Download PDF
                        </Button>
                        <Button
                            className="w-full bg-pink-200 text-pink-600 hover:bg-pink-100 hover:text-pink-700 text-base font-semibold"
                        >
                            <i className="fa-solid fa-hand-holding-heart text-base"></i> Support Designer
                        </Button>
                        <Button
                            type="button"
                            className=" bg-white border border-[#319BD9] hover:bg-white text-[#319BD9] text-base font-semibold"
                            onClick={() => setReclaimWindow(true)}
                        >
                            <i className="fa-solid fa-rotate-left"></i> Reclaim Notes
                        </Button>
                    </DrawerFooter>
                </div>
            </section>
            {reclaimWindow && <ReclaimNotes wallet={wallet} noteTotalMsats={noteTotalMsats/1000} sessionId={sessionId ?? ''} />}
        </>
    );
}