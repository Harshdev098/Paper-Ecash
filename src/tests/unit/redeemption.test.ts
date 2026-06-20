import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkNotesRedemption } from '@/services/Redeemption'
import { getEcashNoteData, getSessionBySessionId } from '@/utils/db'
import { api } from '@/api/observerClient'
import { getMnemonic } from '@fedimint/core-web'
import { decryptTokens } from '@/utils/ecash'

vi.mock('@/utils/db', () => ({
    getEcashNoteData: vi.fn(),
    getSessionBySessionId: vi.fn(),
}))

vi.mock('@/api/observerClient', () => ({
    api: { checkNoncesSpent: vi.fn() },
}))

vi.mock('@fedimint/core-web', () => ({
    getMnemonic: vi.fn(),
}))

vi.mock('@/utils/ecash', () => ({
    decryptTokens: vi.fn(),
}))

function makeWallet() {
    return { mint: { decodeNotes: vi.fn() } } as any
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('checkNotesRedemption', () => {
    it('throws when no ecash data exists for the session (reclaim window expired)', async () => {
        ;(getEcashNoteData as any).mockResolvedValue(null)

        await expect(checkNotesRedemption('s1', makeWallet())).rejects.toThrow(
            /24-hour reclaim window/
        )
    })

    it('throws when the wallet mnemonic is missing', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue([])

        await expect(checkNotesRedemption('s1', makeWallet())).rejects.toThrow(
            'Wallet mnemonic not found.'
        )
    })

    it('throws when the decrypted token list is empty', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue([])

        await expect(checkNotesRedemption('s1', makeWallet())).rejects.toThrow(
            'No tokens found after decryption.'
        )
    })

    it('throws when the session has no associated federationId', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue(['token1'])
        ;(getSessionBySessionId as any).mockResolvedValue({ federationId: undefined })

        await expect(checkNotesRedemption('s1', makeWallet())).rejects.toThrow(
            'Federation ID not found for this session.'
        )
    })

    it('reports a note as unspent when none of its nonces appear in the spent map', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue(['token1'])
        ;(getSessionBySessionId as any).mockResolvedValue({ federationId: 'fed1' })
        const wallet = makeWallet()
        wallet.mint.decodeNotes.mockResolvedValue({ notes: { '1024': ['nonceA', 'nonceB'] } })
        ;(api.checkNoncesSpent as any).mockResolvedValue({})

        const result = await checkNotesRedemption('s1', wallet)

        expect(result.totalNotes).toBe(1)
        expect(result.spentNotes).toBe(0)
        expect(result.unspentNotes).toBe(1)
        expect(result.notes[0].spent).toBe(false)
    })

    it('reports a note as spent when every nonce is found, using the latest timestamp', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue(['token1'])
        ;(getSessionBySessionId as any).mockResolvedValue({ federationId: 'fed1' })
        const wallet = makeWallet()
        wallet.mint.decodeNotes.mockResolvedValue({ notes: { '1024': ['nonceA', 'nonceB'] } })
        ;(api.checkNoncesSpent as any).mockResolvedValue({
            nonceA: { estimated_timestamp: '2024-01-01T00:00:00Z', session_index: 1 },
            nonceB: { estimated_timestamp: '2024-01-02T00:00:00Z', session_index: 2 },
        })

        const result = await checkNotesRedemption('s1', wallet)

        expect(result.notes[0].spent).toBe(true)
        expect(result.notes[0].redeemedAt).toBe('2024-01-02T00:00:00Z')
        expect(result.notes[0].sessionIndex).toBe(2)
        expect(result.spentNotes).toBe(1)
    })

    it('treats a note as not (fully) spent when only some of its nonces are spent', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue(['token1'])
        ;(getSessionBySessionId as any).mockResolvedValue({ federationId: 'fed1' })
        const wallet = makeWallet()
        wallet.mint.decodeNotes.mockResolvedValue({ notes: { '1024': ['nonceA', 'nonceB'] } })
        ;(api.checkNoncesSpent as any).mockResolvedValue({
            nonceA: { estimated_timestamp: '2024-01-01T00:00:00Z' },
        })

        const result = await checkNotesRedemption('s1', wallet)

        expect(result.notes[0].spent).toBe(false)
    })

    it('marks a note as unknown (spent=null) when its token fails to decode', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue(['bad-token'])
        ;(getSessionBySessionId as any).mockResolvedValue({ federationId: 'fed1' })
        const wallet = makeWallet()
        wallet.mint.decodeNotes.mockRejectedValue(new Error('cannot decode'))
        ;(api.checkNoncesSpent as any).mockResolvedValue({})

        const result = await checkNotesRedemption('s1', wallet)

        expect(result.notes[0].spent).toBeNull()
        expect(result.notes[0].redeemedAt).toBeNull()
    })

    it('skips calling checkNoncesSpent entirely when there are no nonces to check', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue(['bad-token'])
        ;(getSessionBySessionId as any).mockResolvedValue({ federationId: 'fed1' })
        const wallet = makeWallet()
        wallet.mint.decodeNotes.mockResolvedValue({ notes: {} })

        await checkNotesRedemption('s1', wallet)

        expect(api.checkNoncesSpent).not.toHaveBeenCalled()
    })

    it('aggregates spent/unspent counts correctly across multiple tokens', async () => {
        ;(getEcashNoteData as any).mockResolvedValue({ encryptedTokens: 'enc' })
        ;(getMnemonic as any).mockResolvedValue(['m1'])
        ;(decryptTokens as any).mockResolvedValue(['token1', 'token2'])
        ;(getSessionBySessionId as any).mockResolvedValue({ federationId: 'fed1' })
        const wallet = makeWallet()
        wallet.mint.decodeNotes
            .mockResolvedValueOnce({ notes: { '1024': ['nonceA'] } })
            .mockResolvedValueOnce({ notes: { '1024': ['nonceB'] } })
        ;(api.checkNoncesSpent as any).mockResolvedValue({
            nonceA: { estimated_timestamp: '2024-01-01T00:00:00Z' },
            // nonceB intentionally absent -> unspent
        })

        const result = await checkNotesRedemption('s1', wallet)

        expect(result.totalNotes).toBe(2)
        expect(result.spentNotes).toBe(1)
        expect(result.unspentNotes).toBe(1)
    })
})