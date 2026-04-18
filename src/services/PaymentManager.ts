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
        console.log(`deferring cancel_rpc for ${operationId}`)
        Promise.resolve().then(() => {
            session.unsubscribe?.()
            console.log(`cancel_rpc sent for ${operationId}`)
        })
    } else {
        console.log(`skipping cancel_rpc for ${operationId} — stream already ended`)
    }
}

export type InvoiceStatus = 'created' | 'waiting' | 'funded' | 'claiming' | 'claimed' | 'canceled' | 'error'

export function startPaymentSession(
    wallet: Wallet,
    operationId: string,
    onClaimed: () => void,
    onStateChange?: (status: InvoiceStatus) => void
): void {
    if (activeSessions.has(operationId)) {
        console.log(`already listening for ${operationId}`)
        return
    }

    const session: PaymentSession = {
        operationId,
        claimed: false,
        streamEnded: false,
        unsubscribe: null,
    }
    activeSessions.set(operationId, session)

    console.log(`subscribing to ${operationId}`)

    const unsubscribe = wallet.lightning.subscribeLnReceive(
        operationId,
        (state: LnReceiveState) => {
            console.log(`${operationId} state:`, state)

            if (state === 'created') {
                onStateChange?.('created')
                return
            }

            if (state === 'funded') {
                onStateChange?.('funded')
                return
            }

            if (state === 'claimed' && !session.claimed) {
                session.claimed = true
                session.streamEnded = true
                onStateChange?.('claimed')
                onClaimed()
                clearSession(operationId)
                return
            }

            if (typeof state === 'object' && state !== null) {
                if ('waiting_for_payment' in state) {
                    onStateChange?.('waiting')
                    return
                }

                if ('awaiting_funds' in state) {
                    onStateChange?.('claiming')
                    return
                }

                if ('canceled' in state) {
                    console.warn(`${operationId} CANCELED:`, state)
                    session.streamEnded = true
                    onStateChange?.('canceled')
                    clearSession(operationId)
                    return
                }
            }
        },
        (err) => {
            console.error(`${operationId} subscribe error:`, err)
            session.streamEnded = true
            onStateChange?.('error')
            clearSession(operationId)
        }
    )

    session.unsubscribe = unsubscribe

    setTimeout(() => {
        if (!session.claimed) {
            console.warn(`timeout cleanup for ${operationId}`)
            clearSession(operationId)
        }
    }, 60 * 60 * 1000)
}