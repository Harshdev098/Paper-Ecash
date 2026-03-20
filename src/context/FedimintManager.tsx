import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { setWalletStatus } from "@/redux/slices/WalletSlice";
import { getWallet, listClients, openWallet, setLogLevel, type Wallet } from "@fedimint/core-web";

interface FedimintManagerType {
    wallet: Wallet | undefined
    clearInstance: () => void
}

const FedimintManagerContext = createContext<FedimintManagerType | undefined>(undefined)

export const FedimintManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dispatch = useDispatch<AppDispatch>()
    const { walletStatus } = useSelector((state: RootState) => state.WalletSlice)
    const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
    const { walletId, currentStep } = useSelector((state: RootState) => state.SessionSlice)

    const initializeFedimintInstance = async () => {
        try {
            dispatch(setWalletStatus('opening'))
            const walletList = listClients()
            setLogLevel('debug')
            console.log("walletList is ", walletList)
            console.log("the wallet id and currentStep from the redux is ", walletId, currentStep)
            if (walletId) {
                const walletData = (await getWallet(walletId)) || (await openWallet(walletId));
                console.log("wallet data is ", walletData)
                dispatch(setWalletStatus('opened'))
                setWallet(walletData)
            }
        } catch (err) {
            console.log("an error occured", err)
            dispatch(setWalletStatus('closed'))
        }
    }

    const clearInstance = async () => {
        if (walletStatus === 'opened') {
            await wallet?.cleanup()
        }
    }

    useEffect(() => {
        if (!walletId) return
        initializeFedimintInstance()
    }, [walletId])

    useEffect(() => {
        const handleBeforeUnload = () => {
            clearInstance()
        }

        window.addEventListener("beforeunload", handleBeforeUnload)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
        }
    }, [walletStatus, wallet])

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