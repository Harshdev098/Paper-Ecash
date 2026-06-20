import { test, expect } from '@playwright/test'
import { FaucetService } from './fixtures/FaucetService'

test.describe('FaucetService', () => {
  test('creates a faucet invoice and returns a valid BOLT11 string', async () => {
    const faucet = new FaucetService()
    const amountSat = 1000

    const invoice = await faucet.createFaucetInvoice(amountSat)

    expect(typeof invoice).toBe('string')
    expect(invoice.length).toBeGreaterThan(10)
    expect(invoice).toMatch(/^ln[a-z0-9]+/i)
  })
})