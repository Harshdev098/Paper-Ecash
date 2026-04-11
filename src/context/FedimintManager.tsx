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
            setLogLevel('debug')

            const walletList = listClients()
            console.log("[FedimintManager] known wallet clients:", walletList)
            console.log("[FedimintManager] initializing wallet for id:", id)

            // Try getWallet first (returns already-open instance),
            // fall back to openWallet (opens persisted wallet from storage).
            // Do NOT set wallet to undefined before this — if we're reusing
            // the same wallet ID as a prior session, we want a clean handoff.
            let walletData = await getWallet(id)
            if (!walletData) {
                console.log("[FedimintManager] wallet not open, calling openWallet")
                walletData = await openWallet(id)
            }

            if (!walletData) throw new Error(`Could not open wallet ${id}`)

            console.log("[FedimintManager] wallet ready:", walletData.id)
            setWallet(walletData)
            dispatch(setWalletStatus('opened'))
        } catch (err) {
            console.error("[FedimintManager] error initializing wallet:", err)
            setWallet(undefined)
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
        console.log("[FedimintManager] walletId changed, reinitializing:", walletId)
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
    const context = useContext(FedimintManagerContext)
    if (!context) {
        throw new Error('useFedimint must be used within FedimintManagerProvider')
    }
    return context
}

export default FedimintManagerContext