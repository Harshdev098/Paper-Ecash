import type { Wallet } from '@fedimint/core-web'
import type { LnReceiveState } from '@fedimint/core-web'

interface PaymentSession {
    operationId: string
    claimed: boolean
    streamEnded: boolean
    unsubscribe: (() => void) | null
}

const activeSessions = new Map<string, PaymentSession>()

export function isAlreadyProcessing(operationId: string): boolean {
    return activeSessions.has(operationId)
}

export function clearSession(operationId: string): void {
    const session = activeSessions.get(operationId)
    if (!session) return

    activeSessions.delete(operationId)

    if (session.unsubscribe && !session.streamEnded) {
        console.log(`[PaymentManager] deferring cancel_rpc for ${operationId}`)
        Promise.resolve().then(() => {
            session.unsubscribe?.()
            console.log(`[PaymentManager] cancel_rpc sent for ${operationId}`)
        })
    } else {
        console.log(`[PaymentManager] skipping cancel_rpc for ${operationId} — stream already ended by WASM`)
    }
}

export function startPaymentSession(
    wallet: Wallet,
    operationId: string,
    onClaimed: () => void
): void {
    if (activeSessions.has(operationId)) {
        console.log(`[PaymentManager] already listening for ${operationId}`)
        return
    }

    const session: PaymentSession = {
        operationId,
        claimed: false,
        streamEnded: false,
        unsubscribe: null,
    }
    activeSessions.set(operationId, session)

    console.log(`[PaymentManager] subscribing to ${operationId}`)

    const unsubscribe = wallet.lightning.subscribeLnReceive(
        operationId,
        (state: LnReceiveState) => {
            console.log(`[PaymentManager] ${operationId} state:`, state)

            if (state === 'claimed' && !session.claimed) {
                session.claimed = true
                // WASM stream ends naturally after claimed — mark it so
                // clearSession won't send a redundant cancel_rpc
                session.streamEnded = true
                console.log(`[PaymentManager] ${operationId} claimed — firing onClaimed`)
                onClaimed()
                clearSession(operationId)
                return
            }

            if (
                typeof state === 'object' &&
                state !== null &&
                'canceled' in state
            ) {
                console.warn(`[PaymentManager] ${operationId} CANCELED by federation:`, state)
                session.streamEnded = true
                clearSession(operationId)
                return
            }

            if (
                typeof state === 'object' &&
                state !== null &&
                'waiting_for_payment' in state
            ) {
                console.log(`[PaymentManager] ${operationId} waiting_for_payment — invoice live`)
            }
        },
        (err) => {
            console.error(`[PaymentManager] ${operationId} subscribe error:`, err)
            session.streamEnded = true
            clearSession(operationId)
        }
    )

    session.unsubscribe = unsubscribe

    setTimeout(() => {
        if (!session.claimed) {
            console.warn(`[PaymentManager] timeout cleanup for ${operationId}`)
            clearSession(operationId)
        }
    }, 60 * 60 * 1000)
}