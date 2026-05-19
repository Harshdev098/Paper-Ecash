import { setLoader } from "@/redux/slices/LoaderSlice";
import { getSmartColors } from "@/services/NotesDownloader";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { Design } from "@/types/init.type";
import { getAssetUrl, getNaturalDesignSize } from "@/utils/url";
import QRCode from "react-qr-code";
import { FastAverageColor } from "fast-average-color";

interface PreviewDesignProps {
    design: Design
    noteTotalMsats: number
    onColorsResolved?: (colors: { fg: string; bg: string }) => void
    showTamperRegion?: boolean
}

export default function PreviewDesign({ design, noteTotalMsats, onColorsResolved, showTamperRegion = false }: PreviewDesignProps) {
    const dispatch = useDispatch()
    const [renderSize, setRenderSize] = useState<{ height: number, width: number }>({ width: 1, height: 1 });
    const [naturalSize, setNaturalSize] = useState<{ height: number, width: number }>(getNaturalDesignSize(design?.id));
    const [qrColors, setQrColors] = useState({ bg: "#ffffff", fg: "#000000" });
    const [bgColor, setBgColor] = useState("#eff6ff");
    const scaleX = renderSize.width / naturalSize.width;
    const scaleY = renderSize.height / naturalSize.height;

    const TAMPER_PADDING = 8;

    const imgRef = useRef<HTMLImageElement | null>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

    const setImgRef = useCallback((node: HTMLImageElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (!node) {
            imgRef.current = null;
            return;
        }
        imgRef.current = node;

        const observer = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect;
            setRenderSize({ width: rect.width, height: rect.height });
        });
        observer.observe(node);
        observerRef.current = observer;
    }, []);

    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        dispatch(setLoader({ loader: true, loaderMessage: "Previewing the Notes" }))
        const fac = new FastAverageColor();

        const handleLoad = async () => {
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
            try {
                const color = await fac.getColorAsync(img);
                const colors = getSmartColors(img);
                if (colors) {
                    const resolved = { fg: colors.dark, bg: colors.light }
                    setQrColors(resolved)
                    onColorsResolved?.(resolved)
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
    }, [design?.frontPath]);

    const qrLeft   = design.qr.x * scaleX;
    const qrTop    = design.qr.y * scaleY;
    const qrWidth  = design.qr.width * scaleX;
    const qrHeight = design.qr.height * scaleY;

    return (
        <div
            className="md:w-1/2 w-full mt-4 flex items-end justify-center transition-colors duration-500 relative"
            style={{ background: `linear-gradient(to bottom, white, ${bgColor})` }}
        >
            <div className="w-full flex justify-center items-center pb-8 px-4">
                <div className="relative inline-block" key={design?.frontPath}>
                    <img
                        ref={setImgRef}
                        src={getAssetUrl(design?.frontPath ?? '')}
                        alt="Ecash Notes"
                        crossOrigin="anonymous"
                        className="block w-full h-auto drop-shadow-lg"
                    />

                    {/* QR code — always visible */}
                    {design && (
                        <div
                            style={{
                                position: "absolute",
                                left: qrLeft,
                                top: qrTop,
                                width: qrWidth,
                                height: qrHeight,
                                zIndex: 2,
                                pointerEvents: "none",
                            }}
                        >
                            <QRCode
                                value="A dumb value for previewing"
                                bgColor={qrColors.bg}
                                fgColor={qrColors.fg}
                                style={{ width: "100%", height: "100%" }}
                            />
                        </div>
                    )}

                    {/* Tamper border — dashed rectangle around QR, QR stays fully visible */}
                    {design && showTamperRegion && (
                        <div
                            style={{
                                position: "absolute",
                                left: qrLeft - TAMPER_PADDING,
                                top: qrTop - TAMPER_PADDING,
                                width: qrWidth + TAMPER_PADDING * 2,
                                height: qrHeight + TAMPER_PADDING * 2,
                                border: "2px dashed #e53e3e",
                                borderRadius: 4,
                                boxSizing: "border-box",
                                pointerEvents: "none",
                                zIndex: 3,
                            }}
                        />
                    )}

                    {design && (
                        <h2
                            style={{
                                position: "absolute",
                                left: design.denomination.x * scaleX,
                                top: design.denomination.y * scaleY,
                                fontSize: design.denomination.fontSize * scaleX,
                                fontWeight: "bold",
                                color: qrColors.fg,
                                margin: 0,
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                                zIndex: 3,
                            }}
                        >
                            {noteTotalMsats} SATS
                        </h2>
                    )}
                </div>
            </div>
        </div>
    )
}