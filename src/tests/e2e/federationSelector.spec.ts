import { test, expect } from '@playwright/test'
import { SessionFlow } from './fixtures/session'

test.describe('Federation selection', () => {
    test('joins the local test federation using a real faucet invite code', async ({ page }) => {
        const flow = new SessionFlow(page)

        await flow.startSessionFromFirstDesign()
        const inviteCode = await flow.joinFederationViaFaucet()

        expect(inviteCode.length).toBeGreaterThan(10)

        await expect(
            page.getByText(/select up to \d+ denominations per paper note/i)
        ).toBeVisible()
    })

    test('shows an error and does not advance when invite code is empty', async ({ page }) => {
        const flow = new SessionFlow(page)
        await flow.startSessionFromFirstDesign()

        const nextButton = page.getByTestId('federation-next-button')
            .or(page.getByRole('button', { name: /next/i }))
        await nextButton.click()

        // selectFederation() throws "Please enter Invite Code or select a
        // Federation" which is routed through setErrorWithTimeout -> Alert.
        await expect(page.getByText(/please enter invite code/i)).toBeVisible({ timeout: 10_000 })

        // Still on step 1.
        await expect(page.getByText(/select federation/i)).toBeVisible()
    })
})