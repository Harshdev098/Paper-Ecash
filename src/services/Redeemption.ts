import { getMnemonic, type Wallet } from '@fedimint/core-web'
import { decryptTokens } from '@/utils/ecash'
import { getEcashNoteData, getSessionBySessionId } from '@/utils/db'
import { api } from '@/api/observerClient'
import type { NoteRedemptionStatus, RedemptionResult, SpendCheckResponse } from '@/types/fedimint.type'

export async function checkNotesRedemption(
    sessionId: string,
    wallet: Wallet
): Promise<RedemptionResult> {
    const ecashData = await getEcashNoteData(sessionId)
                console.log("the ecash data is :",ecashData)
    if (!ecashData?.encryptedTokens) {
        throw new Error('No ecash data found. The 24-hour reclaim window may have expired.')
    }

    const mnemonic = await getMnemonic()
    if (!mnemonic?.length) throw new Error('Wallet mnemonic not found.')

    const tokens = await decryptTokens(ecashData.encryptedTokens, mnemonic)
    if (!tokens.length) throw new Error('No tokens found after decryption.')

    const session = await getSessionBySessionId(sessionId)
    const federationId = session?.federationId
    if (!federationId) throw new Error('Federation ID not found for this session.')

    const tokenNonces: { tokenIndex: number; nonces: string[] }[] = []

    for (let i = 0; i < tokens.length; i++) {
        try {
            const decoded = await wallet.mint.decodeNotes(tokens[i])
            console.log("the decoded notes are ",decoded)
            const nonces: string[] = []
            if (decoded?.notes) {
                for (const nonceList of Object.values(decoded.notes as Record<string, string[]>)) {
                    if (Array.isArray(nonceList)) nonces.push(...nonceList)
                }
            }
            tokenNonces.push({ tokenIndex: i, nonces })
        } catch {
            tokenNonces.push({ tokenIndex: i, nonces: [] })
        }
    }
    console.log("the decoded nonces are ",tokenNonces)
    const allNonces = tokenNonces.flatMap(t => t.nonces)
    console.log("teh all nonces are ",allNonces)
    let spentMap: SpendCheckResponse = {}

    if (allNonces.length > 0) {
        spentMap = await api.checkNoncesSpent(federationId, allNonces)
    }

    const notes: NoteRedemptionStatus[] = tokenNonces.map(({ tokenIndex, nonces }) => {
        if (nonces.length === 0) {
            return { noteIndex: tokenIndex, spent: null, redeemedAt: null, sessionIndex: null }
        }

        const allSpent = nonces.every(n => !!spentMap[n])

        const spendInfos = nonces
            .filter(n => !!spentMap[n])
            .map(n => spentMap[n])

        const latest = spendInfos
            .filter(s => !!s.estimated_timestamp)
            .sort((a, b) =>
                (b.estimated_timestamp ?? '').localeCompare(a.estimated_timestamp ?? '')
            )[0] ?? spendInfos[0] ?? null

        return {
            noteIndex: tokenIndex,
            spent: allSpent,
            redeemedAt: latest?.estimated_timestamp ?? null,
            sessionIndex: latest?.session_index ?? null,
        }
    })

    const spentNotes = notes.filter(n => n.spent === true).length

    return {
        notes,
        totalNotes: notes.length,
        spentNotes,
        unspentNotes: notes.filter(n => n.spent === false).length,
        checkedAt: new Date().toISOString(),
    }
}