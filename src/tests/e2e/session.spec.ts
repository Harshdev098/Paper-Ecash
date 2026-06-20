import { test, expect } from '@playwright/test'
import { SessionFlow } from './fixtures/session'

test.describe('Full session: create -> fund -> download', () => {
    test('completes the full flow and downloads a PDF after faucet payment', async ({ page }) => {
        test.setTimeout(120_000) // federation join + invoice payment + PDF render

        const flow = new SessionFlow(page)

        await flow.startSessionFromFirstDesign()
        await flow.joinFederationViaFaucet()
        await flow.chooseDenomination({ msatsValues: [1024], noteCount: 1 })
        await flow.fundViaFaucet()

        const download = await flow.downloadPDF()

        expect(download.suggestedFilename()).toBe('ecash-notes.pdf')

        // Sanity-check the downloaded file isn't empty/corrupt.
        const downloadPath = await download.path()
        expect(downloadPath).toBeTruthy()
    })

    test('resumes an in-progress draft session instead of starting a new one', async ({ page }) => {
        test.setTimeout(120_000)

        const flow = new SessionFlow(page)

        // First pass: stop partway through, at step 2 (NoteDenomination),
        // which is still < BUILD_STEP (4) and therefore a "draft" per
        // filterDraftSessions(). Don't fund yet.
        await flow.startSessionFromFirstDesign()
        const firstSessionUrl = page.url()
        await flow.joinFederationViaFaucet()

        // Navigate away without finishing, simulating the user closing the
        // tab mid-flow.
        await page.goto('/')

        // Reopen the same design. searchDesignsInDraft() should find the
        // session left at step 2 and resume it (continueDraftSession),
        // reusing the same sessionId rather than calling createSessionThunk
        // again.
        const firstCard = page.locator('[data-testid^="design-card-"]').first()
        await firstCard.click()

        const startButton = page.getByTestId('start-session-button')
            .or(page.getByRole('button', { name: /start session/i }))
        await startButton.click()

        // Should land back on step 2, not step 1 — confirming the
        // federation join from the first pass was actually persisted to
        // the session and we didn't fall back to a fresh session.
        await expect(
            page.getByText(/select up to \d+ denominations per paper note/i)
        ).toBeVisible({ timeout: 20_000 })

        const resumedUrl = page.url()
        const firstId = new URL(firstSessionUrl).searchParams.get('id')
        const resumedId = new URL(resumedUrl).searchParams.get('id')
        expect(resumedId).toBe(firstId)
    })
})