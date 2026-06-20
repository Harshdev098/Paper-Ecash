import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { FaucetService } from './FaucetService'

/**
 * Drives the 4-step session drawer (FederationSelecter -> NoteDenomination
 * -> FundNotes -> DownloadPDF) the same way a real user would, using the
 * local devimint faucet to fund invoices instead of a real lightning wallet.
 *
 * Assumes the data-testid hooks described in FundNotes.patch.md / the
 * accompanying source-change notes have been applied. Falls back to
 * role/text based selectors where a stable testid wasn't introduced,
 * but those are the most likely to need updating if copy changes.
 */
export class SessionFlow {
    readonly page: Page
    readonly faucet: FaucetService

    constructor(page: Page) {
        this.page = page
        this.faucet = new FaucetService()
    }

    /** Opens the explore tab's first design card and starts (or resumes) a session. */
    async startSessionFromFirstDesign() {
        await this.page.goto('/')

        // Explore tab is the default view; wait for at least one design card.
        const firstCard = this.page.locator('[data-testid^="design-card-"]').first()
        await expect(firstCard).toBeVisible({ timeout: 20_000 })
        await firstCard.click()

        const startButton = this.page.getByTestId('start-session-button')
            .or(this.page.getByRole('button', { name: /start session/i }))
        await expect(startButton).toBeVisible()
        await startButton.click()

        // The drawer should now be open with the URL carrying ?id=<sessionId>
        await expect(this.page).toHaveURL(/[?&]id=/)
    }

    /** Step 1: pastes a real invite code from the local faucet and submits. */
    async joinFederationViaFaucet() {
        const inviteCode = await this.faucet.getInviteCode()

        const inviteInput = this.page.getByTestId('invite-code-input')
            .or(this.page.getByPlaceholder(/enter federation invite code/i))
        await expect(inviteInput).toBeVisible({ timeout: 15_000 })
        await inviteInput.fill(inviteCode)

        const nextButton = this.page.getByTestId('federation-next-button')
            .or(this.page.getByRole('button', { name: /next/i }))
        await nextButton.click()

        // Joining a federation + opening the wasm wallet takes a moment.
        // Step 2's header is the most reliable signal we've moved on.
        await expect(
            this.page.getByText(/select note denomination/i)
        ).toBeVisible({ timeout: 30_000 })

        return inviteCode
    }

    /**
     * Step 2: selects denominations (default: smallest available, 1024 msats)
     * and a note count, then proceeds.
     */
    async chooseDenomination(options?: { msatsValues?: number[]; noteCount?: number }) {
        const msatsValues = options?.msatsValues ?? [1024]
        const noteCount = options?.noteCount ?? 1

        for (const msats of msatsValues) {
            const denomButton = this.page.getByTestId(`denom-${msats}`)
            await expect(denomButton).toBeVisible()
            await denomButton.click()
        }

        if (noteCount !== 1) {
            const countInput = this.page.getByTestId('note-count-input')
                .or(this.page.getByLabel(/number of paper notes to print/i))
            await countInput.fill(String(noteCount))
        }

        const nextButton = this.page.getByTestId('denomination-next-button')
            .or(this.page.getByRole('button', { name: /^next/i }))
        await nextButton.click()

        await expect(
            this.page.getByText(/fund the notes/i)
        ).toBeVisible({ timeout: 15_000 })
    }

    /**
     * Step 3: waits for the app to auto-generate a lightning invoice, reads
     * the full BOLT11 string from the test-only hook, pays it via the
     * faucet, then waits for the app to detect payment and advance.
     */
    async fundViaFaucet() {
        const invoiceEl = this.page.getByTestId('lightning-invoice')
        await expect(invoiceEl).toBeVisible({ timeout: 20_000 })

        const invoice = await invoiceEl.textContent()
        if (!invoice || invoice.trim().length === 0) {
            throw new Error('Lightning invoice hook rendered but was empty')
        }

        await this.faucet.payFaucetInvoice(invoice.trim())

        // FundNotes listens for the operation completing and dispatches
        // currentStep -> 4 once paymentStatus is 'paid'. Give it real time:
        // the wasm wallet has to observe the federation-side state change.
        await expect(
            this.page.getByText(/download ecash notes/i)
        ).toBeVisible({ timeout: 45_000 })
    }

    /**
     * Step 4: triggers the PDF download and waits for the browser's
     * download event, returning the suggested filename for assertions.
     */
    async downloadPDF() {
        const downloadButton = this.page.getByTestId('download-pdf-button')
            .or(this.page.getByRole('button', { name: /download pdf/i }))
        await expect(downloadButton).toBeEnabled({ timeout: 15_000 })

        const [download] = await Promise.all([
            this.page.waitForEvent('download', { timeout: 60_000 }),
            downloadButton.click(),
        ])

        return download
    }
}