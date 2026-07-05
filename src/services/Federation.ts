import { api } from '@/api/observerClient'
import type { FormatedFederationData, LnTransaction } from '@/types/fedimint.type'
import { getSessionBySessionId } from '@/utils/db';
import { parseBolt11Invoice, type CreateBolt11Response, type LightningTransaction, type Wallet } from '@fedimint/core-web';

const SATS_PER_BTC = 100_000_000;


export const fetchFederationWithSessionId = async (sessionId: string) => {
    try {
        const federationId = await getSessionBySessionId(sessionId)
        const federationData = await fetchFormatedFederation(federationId?.federationId ?? undefined)

        return federationData;
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`${err}`)
        } else {
            throw new Error(`${err}`)
        }
    }
}

export const fetchFormatedFederation = async (
    federationId?: string
): Promise<FormatedFederationData[]> => {
    try {
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
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`Fedimint Observer Error: ${err.message}`);
        } else {
            throw new Error(`Fedimint Observer Error: ${String(err)}`);
        }
    }
};

export const createInvoice = async (wallet: Wallet, amountMsats: number): Promise<CreateBolt11Response> => {
    try {
        console.log("creating invoice now", amountMsats)
        const nonce = Date.now().toString(36)
        const invoiceResult = await wallet.lightning.createInvoice(amountMsats, `PaperEcash Notes Funding ${nonce}`, 5 * 60)
        return invoiceResult;
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`Federation error occurred: ${err.message}`);
        } else {
            throw new Error(`Federation error occurred: ${String(err)}`);
        }
    }
}

export const searchInvoiceForOperation = async (wallet: Wallet, operationId: string | null): Promise<LnTransaction | null> => {
    try {
        const transaction = await wallet.federation.listTransactions()
        for (let tx of transaction) {
            if (tx.kind === 'ln') {
                if (tx.operationId === operationId) {
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
        return null;
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`Federation error occurred: ${err.message}`);
        } else {
            throw new Error(`Federation error occurred: ${String(err)}`);
        }
    }
}

export const getEcashToken = async (wallet: Wallet, noteMsats: number[]): Promise<string> => {
    const operationId = await wallet.mint.spendExactDenominationNotes(noteMsats, Number.MAX_SAFE_INTEGER);
    console.log("the spend exact operation id is ", operationId)

    return new Promise((resolve, reject) => {
        const unsubscribe = wallet.mint.subscribeSpendExactNotes(
            operationId,
            false,
            (state: string) => {
                console.log("the token is ", state)
                resolve(state)
            },
            (err) => {
                unsubscribe();
                reject(err);
            }
        );
        setTimeout(() => {
            unsubscribe()
        }, 10000)
    });
};

const fetchExchangeRates = async () => {
    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        );

        const data = await res.json();
        const usd = data?.bitcoin?.usd;

        if (typeof usd === "number") {
            localStorage.setItem("usdRate", usd.toString());
            return { usd };
        }
    } catch (err) {
        console.error("Error fetching exchange rates:", err);
    }

    const fallback = localStorage.getItem("usdRate");
    return {
        usd: fallback ? Number(fallback) : null,
    };
};

export const convertFromSat = async (sats: number): Promise<number> => {
    const btcValue = sats / SATS_PER_BTC;
    const { usd } = await fetchExchangeRates();

    if (usd == null) {
        throw new Error("No exchange rate available.");
    }

    return Number((btcValue * usd).toFixed(4));
};
