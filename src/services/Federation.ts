import { api } from '@/api/observerClient'
import type { FormatedFederationData, LnTransaction } from '@/types/fedimint.type'
import { getSessionBySessionId } from '@/utils/db';
import { parseBolt11Invoice, type CreateBolt11Response, type LightningTransaction, type Wallet } from '@fedimint/core-web';

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
        federations = [federation]; // normalize to array
    } else {
        federations = await api.getFederations();
    }

    const formattedFederations: FormatedFederationData[] = [];

    for (const fed of federations) {
        const config = await api.getFederationConfig(fed.id);

        const apiEndpoints = (config?.global as any)?.api_endpoints ?? {};
        const members = Object.keys(apiEndpoints).length;

        formattedFederations.push({
            ...fed,
            members
        });
    }

    return formattedFederations;
};

export const createInvoice = async (wallet: Wallet, amountMsats: number): Promise<CreateBolt11Response> => {
    try {
        console.log("checking the federation")
        const fed = await wallet.federation.getConfig()
        console.log("the checked fed ", fed)
        console.log("creating invoice now")
        const invoiceResult = await wallet.lightning.createInvoice(amountMsats, 'PaperEcash Notes Funding')
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