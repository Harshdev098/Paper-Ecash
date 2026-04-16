import { setLoader } from "@/redux/slices/LoaderSlice";
import { getSmartColors } from "@/services/NotesDownloader";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import type { Design } from "@/types/init.type";
import { getAssetUrl } from "@/utils/url";
import QRCode from "react-qr-code";

export default function PreviewDesign({ design, totalSats }: { design: Design | null, totalSats: number }) {
    const dispatch = useDispatch()
    const [renderSize, setRenderSize] = useState({ width: 1, height: 1 });
    const [naturalSize, setNaturalSize] = useState({ width: 1748, height: 874 });
    const [qrColors, setQrColors] = useState({ bg: "#ffffff", fg: "#000000" });
    const scaleX = renderSize.width / naturalSize.width;
    const scaleY = renderSize.height / naturalSize.height;

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

        const handleLoad = async () => {
            setNaturalSize({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });

            try {
                const colors = getSmartColors(img);

                if (colors) {
                    setQrColors({
                        bg: colors.light,
                        fg: colors.dark,
                    });
                }
            } catch (err) {
                console.error(err);
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
        };
    }, [design?.path]);

    return (
        <>
            <div className="relative inline-block" key={design?.path}>
                <img
                    ref={setImgRef}
                    src={getAssetUrl(design?.path ?? '')}
                    alt="Ecash Notes"
                    crossOrigin="anonymous"
                    className="block w-full h-auto drop-shadow-lg"
                />
                {design && (
                    <div
                        style={{
                            position: "absolute",
                            left: design.qr.x * scaleX,
                            top: design.qr.y * scaleY,
                            width: design.qr.width * scaleX,
                            height: design.qr.height * scaleY,
                        }}
                    >
                        <QRCode
                            value={design.lnurl}
                            bgColor={qrColors.bg}
                            fgColor={qrColors.fg}
                            style={{ width: "100%", height: "100%" }}
                        />
                    </div>
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
                        }}
                    >
                        {totalSats} SATS
                    </h2>
                )}
            </div>
        </>
    )
}
