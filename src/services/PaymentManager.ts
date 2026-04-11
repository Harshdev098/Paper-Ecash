import type { Wallet } from '@fedimint/core-web'
import type { LnReceiveState } from '@fedimint/core-web'

interface PaymentSession {
    operationId: string
    claimed: boolean
    unsubscribe: (() => void) | null
}

const activeSessions = new Map<string, PaymentSession>()

export function isAlreadyProcessing(operationId: string): boolean {
    return activeSessions.has(operationId)
}

export function clearSession(operationId: string): void {
    const session = activeSessions.get(operationId)
    if (session?.unsubscribe) {
        session.unsubscribe()
    }
    activeSessions.delete(operationId)
}

export function startPaymentSession(
    wallet: Wallet,
    operationId: string,
    onClaimed: () => void
): void {
    if (activeSessions.has(operationId)) {
        console.log("PaymentManager: already listening for", operationId)
        return
    }

    const session: PaymentSession = {
        operationId,
        claimed: false,
        unsubscribe: null,
    }
    activeSessions.set(operationId, session)

    console.log("PaymentManager: subscribing to", operationId)

    const unsubscribe = wallet.lightning.subscribeLnReceive(
        operationId,
        (state: LnReceiveState) => {
            console.log("PaymentManager state:", state)

            if (state === 'claimed' && !session.claimed) {
                session.claimed = true
                console.log("PaymentManager: claimed")
                onClaimed()
                clearSession(operationId)
            }

            if (
                typeof state === 'object' &&
                state !== null &&
                'canceled' in state
            ) {
                console.log("PaymentManager: operation canceled", state)
                clearSession(operationId)
            }
        },
        (err) => {
            console.error("PaymentManager subscribe error:", err)
            clearSession(operationId)
        }
    )

    session.unsubscribe = unsubscribe

    setTimeout(() => {
        if (!session.claimed) {
            console.log("PaymentManager: timeout cleanup for", operationId)
            clearSession(operationId)
        }
    }, 60 * 60 * 1000)
}