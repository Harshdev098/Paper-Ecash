const PBKDF2_ITERATIONS = 100_000

const mnemonicToKey = async (mnemonic: string[]): Promise<CryptoKey> => {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(mnemonic.join(' ')),
        'PBKDF2',
        false,
        ['deriveKey']
    )
    // Deterministic salt — no need to store it
    const salt = enc.encode(`paperecash-v1-${mnemonic[0]}-${mnemonic[mnemonic.length - 1]}`)
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

export const encryptTokens = async (
    tokens: string[],
    mnemonic: string[]
): Promise<string> => {
    const key = await mnemonicToKey(mnemonic)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const enc = new TextEncoder()
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(JSON.stringify(tokens))
    )
    // Combine iv (12 bytes) + ciphertext and encode as base64
    const combined = new Uint8Array(12 + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), 12)
    return btoa(String.fromCharCode(...combined))
}

export const decryptTokens = async (
    encrypted: string,
    mnemonic: string[]
): Promise<string[]> => {
    const key = await mnemonicToKey(mnemonic)
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const dec = new TextDecoder()
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    )
    return JSON.parse(dec.decode(plaintext))
}