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
    const { walletId } = useSelector((state: RootState) => state.SessionSlice)

    const initializeFedimintInstance = async (id: string) => {
        try {
            dispatch(setWalletStatus('opening'))
            setWallet(undefined)
            setLogLevel('debug')
            const walletList = listClients()
            console.log("walletList is", walletList)
            console.log("initializing wallet for id:", id)

            const walletData = (await getWallet(id)) || (await openWallet(id))
            console.log("wallet data is", walletData)
            dispatch(setWalletStatus('opened'))
            setWallet(walletData)
        } catch (err) {
            console.log("an error occurred", err)
            dispatch(setWalletStatus('closed'))
        }
    }

    const clearInstance = async () => {
        if (walletStatus === 'opened' && wallet) {
            await wallet.cleanup()
            setWallet(undefined)
            dispatch(setWalletStatus('closed'))
        }
    }

    useEffect(() => {
        if (!walletId) return
        initializeFedimintInstance(walletId)
    }, [walletId])

    useEffect(() => {
        const handleBeforeUnload = () => { clearInstance() }
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [walletStatus, wallet])

    return (
        <FedimintManagerContext.Provider value={{ wallet, clearInstance }}>
            {children}
        </FedimintManagerContext.Provider>
    )
}

export const useFedimint = () => {
    const context = useContext(FedimintManagerContext);
    if (!context) {
        throw new Error('useWallet must be used within WalletProvider');
    }
    return context;
};

export default FedimintManagerContext;