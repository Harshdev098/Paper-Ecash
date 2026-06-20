import { describe, it, expect } from 'vitest'
import { encryptTokens, decryptTokens } from '@/utils/ecash'

describe('utils/ecash', () => {
    const mnemonic = ['abandon', 'ability', 'able', 'about', 'above', 'absent']

    describe('encryptTokens / decryptTokens', () => {
        it('round-trips an array of tokens', async () => {
            const tokens = ['tokenA', 'tokenB', 'tokenC']
            const encrypted = await encryptTokens(tokens, mnemonic)

            expect(typeof encrypted).toBe('string')
            expect(encrypted.length).toBeGreaterThan(0)

            const decrypted = await decryptTokens(encrypted, mnemonic)
            expect(decrypted).toEqual(tokens)
        })

        it('round-trips an empty token array', async () => {
            const encrypted = await encryptTokens([], mnemonic)
            const decrypted = await decryptTokens(encrypted, mnemonic)
            expect(decrypted).toEqual([])
        })

        it('produces different ciphertext on every call (random IV)', async () => {
            const tokens = ['same-token']
            const first = await encryptTokens(tokens, mnemonic)
            const second = await encryptTokens(tokens, mnemonic)

            expect(first).not.toBe(second)

            await expect(decryptTokens(first, mnemonic)).resolves.toEqual(tokens)
            await expect(decryptTokens(second, mnemonic)).resolves.toEqual(tokens)
        })

        it('derives a deterministic key for the same mnemonic, decryptable across calls', async () => {
            const tokens = ['x', 'y']
            const encrypted = await encryptTokens(tokens, mnemonic)

            const sameMnemonicNewArray = [...mnemonic]
            await expect(decryptTokens(encrypted, sameMnemonicNewArray)).resolves.toEqual(tokens)
        })

        it('rejects when decrypting with a different mnemonic', async () => {
            const tokens = ['secret-token']
            const encrypted = await encryptTokens(tokens, mnemonic)
            const wrongMnemonic = ['zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'wrong']

            await expect(decryptTokens(encrypted, wrongMnemonic)).rejects.toThrow()
        })

        it('rejects when ciphertext has been tampered with', async () => {
            const tokens = ['secret-token']
            const encrypted = await encryptTokens(tokens, mnemonic)

            const bytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
            bytes[bytes.length - 1] ^= 0xff
            const tampered = btoa(String.fromCharCode(...bytes))

            await expect(decryptTokens(tampered, mnemonic)).rejects.toThrow()
        })

        it('rejects on a malformed (too-short) payload', async () => {
            const tooShort = btoa('short')
            await expect(decryptTokens(tooShort, mnemonic)).rejects.toThrow()
        })

        it('preserves large token lists and unicode-safe content', async () => {
            const tokens = Array.from({ length: 50 }, (_, i) => `note-token-${i}-üñîçødé`)
            const encrypted = await encryptTokens(tokens, mnemonic)
            const decrypted = await decryptTokens(encrypted, mnemonic)
            expect(decrypted).toEqual(tokens)
        })
    })
})