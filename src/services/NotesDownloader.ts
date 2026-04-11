import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import type { Design } from '@/types/init.type'
import type { DenominationPerNote } from '@/types/fedimint.type'
import { getAssetUrl } from '@/utils/url'
import type { Wallet } from '@fedimint/core-web'
import { getEcashToken } from './Federation'

// pdf page points
const PAGE_SIZES = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
    a5: { width: 419.53, height: 595.28 },
} as const

// How many canvas pixels per PDF point at each DPI
// 1 pt = 1/72 inch → at 300 DPI: 300/72 = 4.167 px per pt
const DPI_SCALE = {
    '72': 72 / 72,
    '150': 150 / 72,
    '300': 300 / 72,
} as const

export const getSmartColors = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const pixels: number[] = [];

    for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        pixels.push(brightness);
    }

    pixels.sort((a, b) => a - b);

    // pick percentiles instead of extremes
    const darkIndex = Math.floor(pixels.length * 0.1);   // 10%
    const lightIndex = Math.floor(pixels.length * 0.9);  // 90%

    const darkTarget = pixels[darkIndex];
    const lightTarget = pixels[lightIndex];

    let darkColor = { r: 0, g: 0, b: 0, diff: Infinity };
    let lightColor = { r: 255, g: 255, b: 255, diff: Infinity };

    for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        const dDiff = Math.abs(brightness - darkTarget);
        const lDiff = Math.abs(brightness - lightTarget);

        if (dDiff < darkColor.diff) {
            darkColor = { r, g, b, diff: dDiff };
        }

        if (lDiff < lightColor.diff) {
            lightColor = { r, g, b, diff: lDiff };
        }
    }

    const toHex = (r: number, g: number, b: number) =>
        `#${[r, g, b]
            .map((v) => v.toString(16).padStart(2, "0"))
            .join("")}`;

    return {
        dark: toHex(darkColor.r, darkColor.g, darkColor.b),
        light: toHex(lightColor.r, lightColor.g, lightColor.b),
    };
};

async function renderNoteToCanvas(
    design: Design,
    denomination: number,
    ecashToken: string,
    fgColor: string,
    bgColor: string,
    dpi: keyof typeof DPI_SCALE,
    printSize: keyof typeof PAGE_SIZES
): Promise<string> {
    const pageSize = PAGE_SIZES[printSize]
    const scale = DPI_SCALE[dpi]

    // Canvas size in pixels = PDF page size in pts × scale
    const canvasW = Math.round(pageSize.width * scale)
    const canvasH = Math.round(pageSize.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = canvasW
    canvas.height = canvasH

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvasW, canvasH)

    const img = await loadImage(getAssetUrl(design.path))

    const margin = canvasW * 0.04
    const noteW = canvasW - margin * 2
    const noteH = noteW * (874 / 1748)
    const noteX = margin
    const noteY = (canvasH - noteH) / 2

    ctx.drawImage(img, noteX, noteY, noteW, noteH)

    const scaleX = noteW / 1748
    const scaleY = noteH / 874
    console.log("the ecash token is ",ecashToken)
    const qrSize = Math.round(design.qr.width * scaleX)
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, ecashToken, {
        width: qrSize,
        margin: 0,
        errorCorrectionLevel: 'L',
        color: {
            dark: fgColor,
            light: bgColor,
        },
    })

    ctx.drawImage(
        qrCanvas,
        noteX + design.qr.x * scaleX,
        noteY + design.qr.y * scaleY,
        qrSize,
        Math.round(design.qr.height * scaleY)
    )

    const fontSize = Math.round(design.denomination.fontSize * scaleX)
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.fillStyle = fgColor

    // textBaseline = 'top' makes y behave like CSS top — matching Figma coords
    ctx.textBaseline = 'top'

    ctx.fillText(
        `${denomination} SATS`,
        noteX + design.denomination.x * scaleX,
        noteY + design.denomination.y * scaleY
    )

    // Reset baseline for any subsequent draws
    ctx.textBaseline = 'alphabetic'

    return canvas.toDataURL('image/png')
}


function loadImage(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = path
    })
}

export async function generateNotesPDF(
    design: Design,
    denominations: DenominationPerNote[],
    dpi: '72' | '150' | '300',
    printSize: 'a4' | 'letter' | 'a5',
    fgColor: string,
    bgColor: string,
    wallet: Wallet,
): Promise<void> {
    const pdfDoc = await PDFDocument.create()
    const pageSize = PAGE_SIZES[printSize]
    // const scale = DPI_SCALE[dpi]

    // Expand denominations: [{denomination:5, quantity:3}] → [5, 5, 5]
    const notes: number[] = denominations.flatMap(
        ({ denomination, quantity }) => Array(quantity).fill(denomination)
    )

    for (const denomination of notes) {
        const token = await getEcashToken(wallet, denomination)

        // Render this note to a high-res PNG
        const pngDataUrl = await renderNoteToCanvas(design, denomination, token, fgColor, bgColor, dpi, printSize)

        // Strip the data:image/png;base64, prefix
        const base64 = pngDataUrl.split(',')[1]
        const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

        // Embed into PDF
        const pngImage = await pdfDoc.embedPng(pngBytes)

        // Add a page at the selected paper size
        const page = pdfDoc.addPage([pageSize.width, pageSize.height])

        // Draw image filling the full page
        // pdf-lib uses pts, origin is bottom-left
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: pageSize.width,
            height: pageSize.height,
        })
    }

    // Save and trigger download
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as BufferSource], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'ecash-notes.pdf'
    a.click()
    URL.revokeObjectURL(url)
}