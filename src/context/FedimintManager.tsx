import React, { createContext, useContext, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { setWalletStatus } from "@/redux/slices/WalletSlice";
import { WalletDirector, type FedimintWallet } from '@fedimint/core'
import { WasmWorkerTransport } from '@fedimint/transport-web'

interface FedimintManagerType {
    wallet: FedimintWallet | undefined
    clearInstance: () => void
}

const FedimintManagerContext = createContext<FedimintManagerType | undefined>(undefined)

export const FedimintManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch<AppDispatch>()
    const { walletStatus } = useSelector((state: RootState) => state.WalletSlice)
    const [wallet, setWallet] = useState<FedimintWallet | undefined>(undefined)

    const initializeFedimintInstance = async () => {
        try {
            dispatch(setWalletStatus('opening'))
            let director = new WalletDirector(new WasmWorkerTransport())
            director.setLogLevel('debug')
            const hasMnemonic = await director.getMnemonic()
            console.log('the has mnemonic is', hasMnemonic)
            if (!hasMnemonic) {
                const mnemonic = await director.generateMnemonic()
                console.log("the mnemonic generated is", mnemonic)
            }
            const wallet = await director.createWallet()
            console.log("wallet directory initiated and opening wallet ", wallet)
            let isOpen = await wallet.joinFederation('fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75')
            console.log("wallet opening", isOpen)
            setWallet(wallet)
            if (isOpen) {
                dispatch(setWalletStatus('opened'))
            } else {
                console.log("wallet is not open ", isOpen)
                dispatch(setWalletStatus('closed'))
            }
        } catch (err) {
            console.log("an error occured", err)
        }
    }

    const clearInstance = async () => {
        if (walletStatus === 'opened') {
            await wallet?.cleanup()
        }
    }

    useMemo(async () => {
        await initializeFedimintInstance()
    }, [dispatch, walletStatus])

    return (
        <FedimintManagerContext.Provider value={{ wallet, clearInstance }}>
            {children}
        </FedimintManagerContext.Provider>
    );
}

export const useFedimint = () => {
    const context = useContext(FedimintManagerContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
};

export default FedimintManagerContext;