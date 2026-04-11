import { api } from '@/api/observerClient'
import type { FormatedFederationData, LnTransaction } from '@/types/fedimint.type'
import { getSessionBySessionId } from '@/utils/db';
import { parseBolt11Invoice, type CreateBolt11Response, type LightningTransaction, type Wallet } from '@fedimint/core-web';
const SATS_PER_BTC = 100_000_000;


export const fetchFederationWithSessionId = async (sessionId: string) => {
    const federationId = await getSessionBySessionId(sessionId)
    const federationData = await fetchFormatedFederation(federationId?.federationId ?? undefined)

    return federationData;
}

export const fetchFormatedFederation = async (
    federationId?: string
): Promise<FormatedFederationData[]> => {

    let federations;

    if (federationId) {
        const federation = await api.getFederation(federationId);
        federations = [federation];
    } else {
        federations = await api.getFederations();
    }

    const formattedFederations: FormatedFederationData[] = [];

    for (const fed of federations) {
        const config = await api.getFederationConfig(fed.id);

        const apiEndpoints = (config?.global as any)?.api_endpoints ?? {};
        const members = Object.keys(apiEndpoints).length;

        if (fed.health === 'online' || fed.health === 'degraded') {
            formattedFederations.push({
                ...fed,
                members
            });
        }
    }

    return formattedFederations.sort((a, b) => {
        const avgA = a.nostr_votes?.avg ?? 0;
        const avgB = b.nostr_votes?.avg ?? 0;

        return avgB - avgA;
    });
};

export const createInvoice = async (wallet: Wallet, amountMsats: number): Promise<CreateBolt11Response> => {
    try {
        console.log("creating invoice now",amountMsats)
        const nonce = Date.now().toString(36)
        const invoiceResult = await wallet.lightning.createInvoice(amountMsats, `PaperEcash Notes Funding ${nonce}`, 5 * 60)
        return invoiceResult;
    } catch (err) {
        throw err
    }
}

export const searchInvoiceForOperation = async (wallet: Wallet, operationId: string | null): Promise<LnTransaction | null> => {
    try {
        const transaction = await wallet.federation.listTransactions()
        let found = false
        for (let tx of transaction) {
            if (tx.kind === 'ln') {
                if (tx.operationId === operationId) {
                    found = true
                    const parsedInvoice = (await parseBolt11Invoice((tx as LightningTransaction).invoice))
                    console.log("the parsed invoice is ", parsedInvoice)
                    let amount = parsedInvoice.amount
                    let expiry = parsedInvoice.expiry
                    const now = Math.floor(Date.now() / 1000);
                    const expiryTime = tx.timestamp + expiry;
                    const expired = now > expiryTime;
                    return { ...(tx as LightningTransaction), amount, expired };
                }
            }
        }
        if (found === false) {
            return null;
        }
    } catch (err) {
        console.log("an error occured ", err)
    }
    return null;
}

export const getEcashToken = async (wallet: Wallet, amount: number): Promise<string> => {
    try {
        console.log("getting ecash notes for amount ", amount)
        const notes = await wallet.mint.spendNotes(amount * 1000, Number.MAX_SAFE_INTEGER)
        return notes.notes;
    } catch (err) {
        console.log("an error occured while generating ecash notes", err)
        throw err;
    }
}

const fetchExchangeRates = async () => {
    try {
        const res = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        const data = await res.json();
        if (data) {
            localStorage.setItem('usdRate', data.bitcoin.usd);
        }
        return {
            usd: data.bitcoin.usd ?? localStorage.getItem('usdRate'),
        };
    } catch (err) {
        console.log('an error occured while fetching exchange rates', err);
    }
};

export const convertFromSat = async (sats: number): Promise<number> => {
    const btcValue = sats / SATS_PER_BTC;
    const rates = await fetchExchangeRates();

    return Number((btcValue * (rates?.usd || localStorage.getItem('usdRate'))).toFixed(4));
};