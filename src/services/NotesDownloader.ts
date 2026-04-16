import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import type { Design } from '@/types/init.type'
import { getAssetUrl } from '@/utils/url'
import type { Wallet } from '@fedimint/core-web'
import { getEcashToken } from './Federation'
import { FIGMA_DESIGN_WIDTH, FIGMA_DESIGN_HEIGHT } from '../../public/designs/json/designs'
import { saveEcashOperation } from '@/utils/db'

const PAGE_SIZES = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612, height: 792 },
    a5: { width: 419.53, height: 595.28 },
} as const

const DPI_SCALE = {
    '72': 72 / 72,
    '150': 150 / 72,
    '300': 300 / 72,
} as const

export const getSmartColors = (img: HTMLImageElement) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels: number[] = []
    for (let i = 0; i < data.length; i += 16) {
        pixels.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    }
    pixels.sort((a, b) => a - b)
    const darkTarget = pixels[Math.floor(pixels.length * 0.1)]
    const lightTarget = pixels[Math.floor(pixels.length * 0.9)]
    let darkColor = { r: 0, g: 0, b: 0, diff: Infinity }
    let lightColor = { r: 255, g: 255, b: 255, diff: Infinity }
    for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b
        if (Math.abs(brightness - darkTarget) < darkColor.diff) darkColor = { r, g, b, diff: Math.abs(brightness - darkTarget) }
        if (Math.abs(brightness - lightTarget) < lightColor.diff) lightColor = { r, g, b, diff: Math.abs(brightness - lightTarget) }
    }
    const toHex = (r: number, g: number, b: number) =>
        `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
    return {
        dark: toHex(darkColor.r, darkColor.g, darkColor.b),
        light: toHex(lightColor.r, lightColor.g, lightColor.b),
    }
}

function hexToRgb(hex: string) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null
}

// Pixel-perfect QR: read raw module matrix, stamp each module as exact integer pixels.
// No antialiasing, no scaling blur — matches what the Rust qrcode crate does.
async function renderQRPixelPerfect(
    data: string,
    destCtx: CanvasRenderingContext2D,
    destX: number, destY: number,
    destW: number, destH: number,
    darkHex: string, lightHex: string,
): Promise<void> {
    // Render at 1px-per-module to extract the raw boolean matrix
    const tempCanvas = document.createElement('canvas')
    await QRCode.toCanvas(tempCanvas, data, {
        width: 1,
        margin: 0,
        errorCorrectionLevel: 'L',
        color: { dark: darkHex, light: lightHex },
    })

    const modules = tempCanvas.width
    const tempCtx = tempCanvas.getContext('2d')!
    const { data: px } = tempCtx.getImageData(0, 0, modules, modules)

    const matrix: boolean[][] = Array.from({ length: modules }, (_, row) =>
        Array.from({ length: modules }, (_, col) => px[(row * modules + col) * 4] < 128)
    )

    const quietZone = 2
    const moduleSize = Math.floor(Math.min(destW, destH) / (modules + quietZone * 2))

    if (moduleSize < 1) {
        // QR slot too small — nearest-neighbour scale as fallback
        destCtx.imageSmoothingEnabled = false
        destCtx.drawImage(tempCanvas, destX, destY, destW, destH)
        return
    }

    const qrPixels = modules * moduleSize
    const offsetX = destX + Math.floor((destW - qrPixels) / 2)
    const offsetY = destY + Math.floor((destH - qrPixels) / 2)

    const dark = hexToRgb(darkHex) ?? { r: 0, g: 0, b: 0 }
    const light = hexToRgb(lightHex) ?? { r: 255, g: 255, b: 255 }

    const imgData = destCtx.createImageData(qrPixels, qrPixels)
    const buf = imgData.data

    for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
            const { r, g, b } = matrix[row][col] ? dark : light
            for (let dy = 0; dy < moduleSize; dy++) {
                for (let dx = 0; dx < moduleSize; dx++) {
                    const base = ((row * moduleSize + dy) * qrPixels + (col * moduleSize + dx)) * 4
                    buf[base] = r
                    buf[base + 1] = g
                    buf[base + 2] = b
                    buf[base + 3] = 255
                }
            }
        }
    }

    destCtx.putImageData(imgData, offsetX, offsetY)
}

async function renderNoteToCanvas(
    design: Design,
    displaySats: number,
    ecashToken: string,
    fgColor: string,
    bgColor: string,
    dpi: keyof typeof DPI_SCALE,
    printSize: keyof typeof PAGE_SIZES,
): Promise<string> {
    const pageSize = PAGE_SIZES[printSize]
    const scale = DPI_SCALE[dpi]
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
    const noteH = noteW * (FIGMA_DESIGN_HEIGHT / FIGMA_DESIGN_WIDTH)
    const noteX = margin
    const noteY = (canvasH - noteH) / 2

    ctx.drawImage(img, noteX, noteY, noteW, noteH)

    const scaleX = noteW / FIGMA_DESIGN_WIDTH
    const scaleY = noteH / FIGMA_DESIGN_HEIGHT

    await renderQRPixelPerfect(
        ecashToken, ctx,
        Math.round(noteX + design.qr.x * scaleX),
        Math.round(noteY + design.qr.y * scaleY),
        Math.round(design.qr.width * scaleX),
        Math.round(design.qr.height * scaleY),
        fgColor,
        bgColor,
    )

    const fontSize = Math.round(design.denomination.fontSize * scaleX)
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.fillStyle = fgColor
    ctx.textBaseline = 'top'
    ctx.fillText(
        `${displaySats.toFixed(3)} SATS`,
        noteX + design.denomination.x * scaleX,
        noteY + design.denomination.y * scaleY,
    )
    ctx.textBaseline = 'alphabetic'

    return canvas.toDataURL('image/png')
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
    })
}

export async function generateNotesPDF(
    design: Design,
    sessionId: string,
    noteMsats: number[],
    noteCount: number,
    dpi: '72' | '150' | '300',
    printSize: 'a4' | 'letter' | 'a5',
    fgColor: string,
    bgColor: string,
    wallet: Wallet,
): Promise<void> {
    const pdfDoc = await PDFDocument.create()
    const pageSize = PAGE_SIZES[printSize]
    const noteTotalMsats = noteMsats.reduce((s, m) => s + m, 0)
    const displaySats = noteTotalMsats / 1000

    console.log(`[PDF] ${noteCount} notes × ${noteTotalMsats} msats each`)
    console.log(`[PDF] composition:`, noteMsats)
    let operationArray: string[] = []
    for (let i = 0; i < noteCount; i++) {
        const token = await getEcashToken(wallet, noteTotalMsats)
        operationArray.push(token.operationId)
        const byteLen = new TextEncoder().encode(token.token).byteLength
        console.log(`[PDF] note ${i + 1}/${noteCount}: ${token.token.length} chars, ${byteLen} bytes`)

        const pngDataUrl = await renderNoteToCanvas(
            design, displaySats, token.token, fgColor, bgColor, dpi, printSize
        )

        const base64 = pngDataUrl.split(',')[1]
        const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        const pngImage = await pdfDoc.embedPng(pngBytes)
        const page = pdfDoc.addPage([pageSize.width, pageSize.height])
        page.drawImage(pngImage, { x: 0, y: 0, width: pageSize.width, height: pageSize.height })
    }
    saveEcashOperation({ sessionId, operationId: operationArray })

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as BufferSource], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ecash-notes.pdf'
    a.click()
    URL.revokeObjectURL(url)
}