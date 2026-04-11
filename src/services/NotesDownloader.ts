// NotesDownloader.ts

import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import type { Design } from '@/types/init.type'
import type { DenominationPerNote } from '@/types/fedimint.type'
import { getAssetUrl } from '@/utils/url'
import type { Wallet } from '@fedimint/core-web'
import { getEcashToken } from './Federation'
import { FIGMA_DESIGN_WIDTH, FIGMA_DESIGN_HEIGHT } from '../../public/designs/json/designs'

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
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        pixels.push(brightness)
    }

    pixels.sort((a, b) => a - b)

    const darkTarget = pixels[Math.floor(pixels.length * 0.1)]
    const lightTarget = pixels[Math.floor(pixels.length * 0.9)]

    let darkColor = { r: 0, g: 0, b: 0, diff: Infinity }
    let lightColor = { r: 255, g: 255, b: 255, diff: Infinity }

    for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b

        if (Math.abs(brightness - darkTarget) < darkColor.diff)
            darkColor = { r, g, b, diff: Math.abs(brightness - darkTarget) }
        if (Math.abs(brightness - lightTarget) < lightColor.diff)
            lightColor = { r, g, b, diff: Math.abs(brightness - lightTarget) }
    }

    const toHex = (r: number, g: number, b: number) =>
        `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`

    return {
        dark: toHex(darkColor.r, darkColor.g, darkColor.b),
        light: toHex(lightColor.r, lightColor.g, lightColor.b),
    }
}

async function renderQRPixelPerfect(
    data: string,
    _destCanvas: HTMLCanvasElement,
    destCtx: CanvasRenderingContext2D,
    destX: number,
    destY: number,
    destW: number,
    destH: number,
    darkColor: string,
    lightColor: string,
): Promise<void> {
    const tempCanvas = document.createElement('canvas')
    await QRCode.toCanvas(tempCanvas, data, {
        width: 1,
        margin: 0,
        errorCorrectionLevel: 'L',
        color: { dark: '#000000', light: '#ffffff' },
    })

    const modules = tempCanvas.width  // each pixel = one module at margin:0, width:1
    const tempCtx = tempCanvas.getContext('2d')!
    const { data: pixelData } = tempCtx.getImageData(0, 0, modules, modules)

    const matrix: boolean[][] = []
    for (let row = 0; row < modules; row++) {
        matrix[row] = []
        for (let col = 0; col < modules; col++) {
            const idx = (row * modules + col) * 4
            matrix[row][col] = pixelData[idx] < 128
        }
    }

    // Step 2: compute module size in destination pixels
    // Use floor to keep modules integer-sized — critical for scan accuracy
    const quietZone = 2  // modules of quiet zone each side
    const innerModules = modules - quietZone * 2
    const moduleSize = Math.floor(Math.min(destW, destH) / (innerModules + quietZone * 2))

    if (moduleSize < 1) {
        console.warn('[QR] destination too small for pixel-perfect render, falling back')
        // Fallback: draw scaled (better than nothing)
        destCtx.imageSmoothingEnabled = false
        destCtx.drawImage(tempCanvas, destX, destY, destW, destH)
        return
    }

    // Total rendered QR size in pixels
    const qrPixels = modules * moduleSize

    // Center the QR within the destination slot
    const offsetX = destX + Math.floor((destW - qrPixels) / 2)
    const offsetY = destY + Math.floor((destH - qrPixels) / 2)

    // Parse dark and light colors to RGB
    const parsedDark = hexToRgb(darkColor) ?? { r: 0, g: 0, b: 0 }
    const parsedLight = hexToRgb(lightColor) ?? { r: 255, g: 255, b: 255 }

    // Step 3: write pixels directly into an ImageData — fastest possible method
    const imgData = destCtx.createImageData(qrPixels, qrPixels)
    const buf = imgData.data

    for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
            const isDark = matrix[row][col]
            const { r, g, b } = isDark ? parsedDark : parsedLight

            for (let dy = 0; dy < moduleSize; dy++) {
                for (let dx = 0; dx < moduleSize; dx++) {
                    const px = (row * moduleSize + dy) * qrPixels + (col * moduleSize + dx)
                    buf[px * 4]     = r
                    buf[px * 4 + 1] = g
                    buf[px * 4 + 2] = b
                    buf[px * 4 + 3] = 255
                }
            }
        }
    }

    destCtx.putImageData(imgData, offsetX, offsetY)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null
}

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

    const destX = Math.round(noteX + design.qr.x * scaleX)
    const destY = Math.round(noteY + design.qr.y * scaleY)
    const destW = Math.round(design.qr.width * scaleX)
    const destH = Math.round(design.qr.height * scaleY)

    // Pixel-perfect QR rendering — no antialiasing, exact module boundaries
    await renderQRPixelPerfect(
        ecashToken,
        canvas,
        ctx,
        destX,
        destY,
        destW,
        destH,
        fgColor,  // always black modules for maximum scanner contrast
        bgColor,  // always white background for maximum scanner contrast
    )

    // Denomination text
    const fontSize = Math.round(design.denomination.fontSize * scaleX)
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.fillStyle = fgColor
    ctx.textBaseline = 'top'
    ctx.fillText(
        `${denomination} SATS`,
        noteX + design.denomination.x * scaleX,
        noteY + design.denomination.y * scaleY
    )
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

    const notes: number[] = denominations.flatMap(
        ({ denomination, quantity }) => Array(quantity).fill(denomination)
    )

    for (const denomination of notes) {
        const token = await getEcashToken(wallet, denomination)
        console.log(`[PDF] token for ${denomination} sats: ${token.length} chars`)

        const pngDataUrl = await renderNoteToCanvas(
            design, denomination, token, fgColor, bgColor, dpi, printSize
        )

        const base64 = pngDataUrl.split(',')[1]
        const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
        const pngImage = await pdfDoc.embedPng(pngBytes)
        const page = pdfDoc.addPage([pageSize.width, pageSize.height])
        page.drawImage(pngImage, { x: 0, y: 0, width: pageSize.width, height: pageSize.height })
    }

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as BufferSource], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ecash-notes.pdf'
    a.click()
    URL.revokeObjectURL(url)
}