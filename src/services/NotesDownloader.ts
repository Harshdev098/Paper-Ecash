import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import type { Design } from '@/types/init.type'
import { getAssetUrl, getNaturalDesignSize } from '@/utils/url'
import type { Wallet } from '@fedimint/core-web'
import { getEcashToken } from './Federation'
import { getEcashNoteData, saveEcashOperation } from '@/utils/db'
import type { AppDispatch } from '@/redux/store'
import { setLoader } from '@/redux/slices/LoaderSlice'
import { getMnemonic } from '@fedimint/core-web'
import { decryptTokens, encryptTokens } from '@/utils/ecash'

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

const TAMPER_PADDING = 12

export const getSmartColors = (img: HTMLImageElement) => {
    try {
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
    } catch {
        return null
    }
}

function hexToRgb(hex: string) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null
}

function rgbToHex(r: number, g: number, b: number) {
    return `#${[r, g, b]
        .map(v => clamp(Math.round(v)).toString(16).padStart(2, '0'))
        .join('')}`
}

function luminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(hex1: string, hex2: string): number {
    const c1 = hexToRgb(hex1)
    const c2 = hexToRgb(hex2)
    if (!c1 || !c2) return 1
    const l1 = luminance(c1.r, c1.g, c1.b)
    const l2 = luminance(c2.r, c2.g, c2.b)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
}

function clamp(v: number, min = 0, max = 255) {
    return Math.max(min, Math.min(max, v))
}

function darken(hex: string, amount: number): string {
    const c = hexToRgb(hex)
    if (!c) return hex

    return rgbToHex(
        c.r * (1 - amount),
        c.g * (1 - amount),
        c.b * (1 - amount),
    )
}

function lighten(hex: string, amount: number): string {
    const c = hexToRgb(hex)
    if (!c) return hex

    return rgbToHex(
        c.r + (255 - c.r) * amount,
        c.g + (255 - c.g) * amount,
        c.b + (255 - c.b) * amount,
    )
}

function ensureQrContrast(
    darkHex: string,
    lightHex: string,
): { dark: string; light: string } {
    const MIN_CONTRAST = 4.5

    let dark = darkHex
    let light = lightHex

    let ratio = contrastRatio(dark, light)

    if (ratio >= MIN_CONTRAST) {
        return { dark, light }
    }

    for (let i = 0; i < 12; i++) {
        dark = darken(dark, 0.08)
        light = lighten(light, 0.08)

        ratio = contrastRatio(dark, light)

        if (ratio >= MIN_CONTRAST) {
            return { dark, light }
        }
    }
    return {
        dark: '#000000',
        light: '#ffffff',
    }
}

async function renderQRPixelPerfect(
    data: string,
    destCtx: CanvasRenderingContext2D,
    destX: number,
    destY: number,
    destW: number,
    destH: number,
    darkHex: string,
    lightHex: string,
): Promise<void> {
    const { dark, light } = ensureQrContrast(darkHex, lightHex)

    const qrData = QRCode.create(data, {
        errorCorrectionLevel: 'L',
    })

    const modules = qrData.modules.size
    const matrix = qrData.modules.data

    const quietZone = 4

    const moduleSize = Math.floor(
        Math.min(destW, destH) / (modules + quietZone * 2)
    )

    const qrPixels = (modules + quietZone * 2) * moduleSize

    const offsetX = destX + Math.floor((destW - qrPixels) / 2)
    const offsetY = destY + Math.floor((destH - qrPixels) / 2)

    const darkRgb = hexToRgb(dark) ?? { r: 0, g: 0, b: 0 }
    const lightRgb = hexToRgb(light) ?? { r: 255, g: 255, b: 255 }

    const imgData = destCtx.createImageData(qrPixels, qrPixels)
    const buf = imgData.data

    // Fill background
    for (let i = 0; i < buf.length; i += 4) {
        buf[i] = lightRgb.r
        buf[i + 1] = lightRgb.g
        buf[i + 2] = lightRgb.b
        buf[i + 3] = 255
    }

    // Draw modules
    for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
            const isDark = matrix[row * modules + col]

            if (!isDark) continue

            for (let dy = 0; dy < moduleSize; dy++) {
                for (let dx = 0; dx < moduleSize; dx++) {
                    const pxX = (col + quietZone) * moduleSize + dx
                    const pxY = (row + quietZone) * moduleSize + dy
                    const base = (pxY * qrPixels + pxX) * 4
                    buf[base] = darkRgb.r
                    buf[base + 1] = darkRgb.g
                    buf[base + 2] = darkRgb.b
                    buf[base + 3] = 255
                }
            }
        }
    }

    destCtx.putImageData(imgData, offsetX, offsetY)
}

function drawTamperBorder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
): void {
    const radius = Math.min(6, w * 0.03, h * 0.03)

    ctx.save()

    ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)'
    ctx.lineWidth = Math.max(2, w * 0.012)
    ctx.setLineDash([Math.max(6, w * 0.04), Math.max(4, w * 0.025)])

    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    ctx.lineTo(x + w, y + h - radius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    ctx.lineTo(x + radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.stroke()

    ctx.setLineDash([])

    const markLen = Math.max(8, w * 0.05)
    const markWidth = Math.max(2, w * 0.01)
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)'
    ctx.lineWidth = markWidth

    const corners = [
        [[x, y + markLen], [x, y], [x + markLen, y]],
        [[x + w - markLen, y], [x + w, y], [x + w, y + markLen]],
        [[x + w, y + h - markLen], [x + w, y + h], [x + w - markLen, y + h]],
        [[x + markLen, y + h], [x, y + h], [x, y + h - markLen]],
    ] as const

    for (const [start, corner, end] of corners) {
        ctx.beginPath()
        ctx.moveTo(start[0], start[1])
        ctx.lineTo(corner[0], corner[1])
        ctx.lineTo(end[0], end[1])
        ctx.stroke()
    }

    ctx.restore()
}

async function loadDrawable(src: string): Promise<ImageBitmap | HTMLImageElement> {
    try {
        const res = await fetch(src, { cache: 'force-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const bitmap = await createImageBitmap(blob)
        return bitmap
    } catch (fetchErr) {
        console.warn('loadDrawable: fetch/ImageBitmap failed, falling back to <img>', fetchErr)
    }

    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
        img.src = src
    })
}

function drawableSize(d: ImageBitmap | HTMLImageElement): { width: number; height: number } {
    if (d instanceof ImageBitmap) return { width: d.width, height: d.height }
    return { width: d.naturalWidth, height: d.naturalHeight }
}

async function renderNoteToCanvas(
    design: Design,
    displaySats: number | null,
    ecashToken: string,
    fgColor: string,
    bgColor: string,
    dpi: keyof typeof DPI_SCALE,
    printSize: keyof typeof PAGE_SIZES,
    includeTamperRegion: boolean = false,
    isBack: boolean = false,
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

    const noteSize = getNaturalDesignSize(design.id)

    const imagePath = isBack
        ? getAssetUrl(undefined, design.backPath)
        : getAssetUrl(design.frontPath)

    if (!imagePath) {
        throw new Error(
            `Design image path is missing for design id ${design.id} (isBack=${isBack}). ` +
            `frontPath="${design.frontPath}" backPath="${design.backPath}"`
        )
    }

    const drawable = await loadDrawable(imagePath)
    const { width: naturalW, height: naturalH } = drawableSize(drawable)

    const margin = canvasW * 0.04
    const noteW = canvasW - margin * 2
    const aspectRatio = naturalW > 0 && naturalH > 0
        ? naturalH / naturalW
        : noteSize.height / noteSize.width
    const noteH = noteW * aspectRatio
    const noteX = margin
    const noteY = (canvasH - noteH) / 2

    ctx.drawImage(drawable as CanvasImageSource, noteX, noteY, noteW, noteH)

    if (drawable instanceof ImageBitmap) drawable.close()

    const scaleX = noteW / noteSize.width
    const scaleY = noteH / noteSize.height

    const qrX = isBack ? Math.round(noteX + design.backQr.x * scaleX) : Math.round(noteX + design.qr.x * scaleX)
    const qrY = isBack ? Math.round(noteY + design.backQr.y * scaleY) : Math.round(noteY + design.qr.y * scaleY)
    const qrW = isBack ? Math.round(design.backQr.width * scaleX) : Math.round(design.qr.width * scaleX)
    const qrH = isBack ? Math.round(design.backQr.height * scaleY) : Math.round(design.qr.height * scaleY)

    await renderQRPixelPerfect(ecashToken, ctx, qrX, qrY, qrW, qrH, fgColor, bgColor)

    if (!isBack && includeTamperRegion) {
        drawTamperBorder(
            ctx,
            qrX - TAMPER_PADDING,
            qrY - TAMPER_PADDING,
            qrW + TAMPER_PADDING * 2,
            qrH + TAMPER_PADDING * 2,
        )
    }

    if (!isBack && displaySats !== null) {
        const fontSize = Math.round(design.denomination.fontSize * scaleX)
        ctx.font = `bold ${fontSize}px Arial, sans-serif`
        ctx.fillStyle = fgColor
        ctx.textBaseline = 'top'
        ctx.fillText(
            `${displaySats} SATS`,
            noteX + design.denomination.x * scaleX,
            noteY + design.denomination.y * scaleY,
        )
        ctx.textBaseline = 'alphabetic'
    }

    return canvas.toDataURL('image/png')
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
    dispatch: AppDispatch,
    includeTamperRegion: boolean
): Promise<void> {
    try {
        const pdfDoc = await PDFDocument.create()
        const pageSize = PAGE_SIZES[printSize]
        const noteTotalMsats = noteMsats.reduce((s, m) => s + m, 0)
        const displaySats = Number((noteTotalMsats / 1000).toFixed(2))

        const unloadHandler = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = 'Ecash generation in progress'
        }

        window.addEventListener('beforeunload', unloadHandler)

        const BACK_QR_URL = 'https://fedimint.org/wallets'
        let tokenArray: string[] = []

        const mnemonic = await getMnemonic()
        if (!mnemonic?.length) throw new Error("Wallet mnemonic not found, cannot create reclaim")

        const existing = await getEcashNoteData(sessionId)
        console.log("existing ecash notes data", existing)
        if (existing?.encryptedTokens) {
            tokenArray = await decryptTokens(existing?.encryptedTokens, mnemonic)
        }
        console.log("the existing token array", tokenArray);

        const remaining = noteCount - tokenArray.length
        console.log("the remaining count for which to generate the ecash ", remaining)

        if (remaining < 0) {
            throw new Error("Recovered more tokens than requested")
        }

        const required = remaining * noteTotalMsats
        const balance = await wallet.balance.getBalance()

        if (balance < required) {
            throw new Error(
                `Insufficient balance: need ${(required / 1000).toFixed(2)} sats`
            )
        }

        for (let i = 0; i < remaining; i++) {
            dispatch(setLoader({ loader: true, loaderMessage: `Generating note ${(existing?.tokenCount ?? 0) + i + 1} of ${noteCount}...` }))
            const token = await getEcashToken(wallet, noteMsats)
            tokenArray.push(token)
            const encryptedTokens = await encryptTokens(tokenArray, mnemonic)
            await saveEcashOperation({
                sessionId,
                encryptedTokens,
                tokenCount: tokenArray.length,
                createdAt: existing?.createdAt ?? Date.now(),
            })
        }
        window.removeEventListener('beforeunload', unloadHandler)

        for (let i = 0; i < noteCount; i++) {
            const token = tokenArray[i]
            dispatch(setLoader({ loader: true, loaderMessage: `Creating and Downloading the Paper ecash notes` }))

            const frontPng = await renderNoteToCanvas(
                design, displaySats, token, fgColor, bgColor, dpi, printSize, includeTamperRegion, false
            )
            const frontBase64 = frontPng.split(',')[1]
            const frontBytes = Uint8Array.from(atob(frontBase64), c => c.charCodeAt(0))
            const frontImage = await pdfDoc.embedPng(frontBytes)
            const frontPage = pdfDoc.addPage([pageSize.width, pageSize.height])
            frontPage.drawImage(frontImage, {
                x: 0, y: 0,
                width: pageSize.width,
                height: pageSize.height,
            })

            if (design.backPath) {
                const backPng = await renderNoteToCanvas(
                    design, null, BACK_QR_URL, fgColor, bgColor, dpi, printSize, false, true
                )
                const backBase64 = backPng.split(',')[1]
                const backBytes = Uint8Array.from(atob(backBase64), c => c.charCodeAt(0))
                const backImage = await pdfDoc.embedPng(backBytes)
                const backPage = pdfDoc.addPage([pageSize.width, pageSize.height])
                backPage.drawImage(backImage, {
                    x: 0, y: 0,
                    width: pageSize.width,
                    height: pageSize.height,
                })
            }
        }

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes as BufferSource], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'ecash-notes.pdf'
        a.click()
        URL.revokeObjectURL(url)

    } catch (err) {
        throw err instanceof Error ? err : new Error(String(err))
    }
}