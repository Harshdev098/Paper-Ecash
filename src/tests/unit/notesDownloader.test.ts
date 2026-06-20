import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateNotesPDF, getSmartColors } from '@/services/NotesDownloader'
import * as pdfLib from 'pdf-lib'
import { getEcashNoteData, saveEcashOperation } from '@/utils/db'
import { getEcashToken } from '@/services/Federation'
import { getMnemonic } from '@fedimint/core-web'

vi.mock('pdf-lib', () => {
    const mockPage = { drawImage: vi.fn() }
    const mockDoc = {
        embedPng: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
        addPage: vi.fn(() => mockPage),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }
    return {
        PDFDocument: { create: vi.fn().mockResolvedValue(mockDoc) },
        __mockDoc: mockDoc,
        __mockPage: mockPage,
    }
})

vi.mock('qrcode', () => ({
    default: {
        create: vi.fn(() => ({
            modules: { size: 5, data: new Uint8Array(25).fill(0) },
        })),
    },
}))

vi.mock('@/utils/db', () => ({
    getEcashNoteData: vi.fn(),
    saveEcashOperation: vi.fn(),
}))

vi.mock('@/utils/url', () => ({
    getAssetUrl: vi.fn((front?: string, back?: string) => front ?? back ?? 'mock-asset.png'),
    getNaturalDesignSize: vi.fn(() => ({ width: 400, height: 200 })),
}))

vi.mock('@/services/Federation', () => ({
    getEcashToken: vi.fn().mockResolvedValue('mock-ecash-token'),
}))

vi.mock('@fedimint/core-web', () => ({
    getMnemonic: vi.fn().mockResolvedValue(['word1', 'word2', 'word3']),
}))

vi.mock('@/utils/ecash', () => ({
    encryptTokens: vi.fn(async (tokens: string[]) => JSON.stringify(tokens)),
    decryptTokens: vi.fn(async (enc: string) => JSON.parse(enc)),
}))

vi.mock('@/redux/slices/LoaderSlice', () => ({
    setLoader: vi.fn((payload: any) => ({ type: 'loader/setLoader', payload })),
}))

const mockDoc = (pdfLib as any).__mockDoc

const mockDesign = {
    id: 1,
    frontPath: 'front.png',
    backPath: 'back.png',
    designer: 'tester',
    lnurl: '',
    label: [],
    qr: { x: 10, y: 10, width: 100, height: 100 },
    backQr: { x: 10, y: 10, width: 100, height: 100 },
    denomination: { x: 5, y: 5, fontSize: 24 },
} as any

function makeWallet(balanceMsats = 10_000_000) {
    return {
        balance: { getBalance: vi.fn().mockResolvedValue(balanceMsats) },
    } as any
}

describe('generateNotesPDF', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
        ;(getEcashNoteData as any).mockResolvedValue(null)
        mockDoc.embedPng.mockResolvedValue({ width: 100, height: 100 })
        mockDoc.save.mockResolvedValue(new Uint8Array([1, 2, 3]))
    })

    it('throws when the wallet balance cannot cover the remaining notes', async () => {
        const wallet = makeWallet(0)

        await expect(
            generateNotesPDF(mockDesign, 'session-1', [1024], 2, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)
        ).rejects.toThrow(/Insufficient balance/)
    })

    it('throws when more tokens were already recovered than requested', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({
            encryptedTokens: JSON.stringify(['t1', 't2', 't3']),
            tokenCount: 3,
            createdAt: Date.now(),
        })
        const wallet = makeWallet()

        await expect(
            generateNotesPDF(mockDesign, 'session-1', [1024], 2, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)
        ).rejects.toThrow('Recovered more tokens than requested')
    })

    it('only generates the missing notes when some tokens already exist', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({
            encryptedTokens: JSON.stringify(['existing-token']),
            tokenCount: 1,
            createdAt: Date.now(),
        })
        const wallet = makeWallet()

        await generateNotesPDF(mockDesign, 'session-1', [1024], 2, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)

        // 2 requested - 1 existing = 1 new token needed
        expect(getEcashToken).toHaveBeenCalledTimes(1)
        expect(saveEcashOperation).toHaveBeenCalledTimes(1)
    })

    it('reuses already-generated tokens without calling getEcashToken again', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({
            encryptedTokens: JSON.stringify(['t1', 't2']),
            tokenCount: 2,
            createdAt: Date.now(),
        })
        const wallet = makeWallet()

        await generateNotesPDF(mockDesign, 'session-1', [1024], 2, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)

        expect(getEcashToken).not.toHaveBeenCalled()
        expect(saveEcashOperation).not.toHaveBeenCalled()
    })

    it('creates a front and back page per note when the design has a backPath', async () => {
        const wallet = makeWallet()

        await generateNotesPDF(mockDesign, 'session-1', [1024], 2, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)

        // 2 notes x (front + back) = 4 pages
        expect(mockDoc.addPage).toHaveBeenCalledTimes(4)
        expect(mockDoc.save).toHaveBeenCalled()
    })

    it('creates only front pages when the design has no backPath', async () => {
        const wallet = makeWallet()
        const designNoBack = { ...mockDesign, backPath: undefined }

        await generateNotesPDF(designNoBack, 'session-1', [1024], 2, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)

        expect(mockDoc.addPage).toHaveBeenCalledTimes(2)
    })

    it('triggers a single PDF download named ecash-notes.pdf', async () => {
        const wallet = makeWallet()
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click')

        await generateNotesPDF(mockDesign, 'session-1', [1024], 1, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)

        expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1)
        expect(clickSpy).toHaveBeenCalledTimes(1)
    })

    it('throws when the wallet mnemonic cannot be found', async () => {
        ;(getMnemonic as any).mockResolvedValueOnce([])
        const wallet = makeWallet()

        await expect(
            generateNotesPDF(mockDesign, 'session-1', [1024], 1, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)
        ).rejects.toThrow('Wallet mnemonic not found, cannot create reclaim')
    })

    it('propagates an explicit error when a design image path is missing', async () => {
        const { getAssetUrl } = await import('@/utils/url')
        ;(getAssetUrl as any).mockReturnValueOnce(undefined)
        const wallet = makeWallet()

        await expect(
            generateNotesPDF(mockDesign, 'session-1', [1024], 1, '150', 'a4', '#000', '#fff', wallet, vi.fn(), false)
        ).rejects.toThrow(/Design image path is missing/)
    })
})

describe('getSmartColors', () => {
    it('returns dark/light hex colors derived from the image pixel data', () => {
        const img = { naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement

        const result = getSmartColors(img)

        expect(result).not.toBeNull()
        expect(result?.dark).toMatch(/^#[0-9a-f]{6}$/i)
        expect(result?.light).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('returns null when the canvas 2D context is unavailable', () => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any

        const img = { naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement
        expect(getSmartColors(img)).toBeNull()

        HTMLCanvasElement.prototype.getContext = original
    })

    it('returns null instead of throwing if pixel processing fails unexpectedly', () => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = vi.fn(() => {
            throw new Error('context creation failed')
        }) as any

        const img = { naturalWidth: 10, naturalHeight: 10 } as HTMLImageElement
        expect(getSmartColors(img)).toBeNull()

        HTMLCanvasElement.prototype.getContext = original
    })
})