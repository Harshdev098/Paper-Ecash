import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { setWalletStatus } from "@/redux/slices/WalletSlice";
import { getWallet, openWallet, setLogLevel, listClients, type Wallet } from "@fedimint/core-web";
import Loader from "@/components/Loader";

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
    const isInitializing = useRef(false)
    const [walletLoading, setWalletLoading] = useState(false)
    const [walletLoadingMessage, setWalletLoadingMessage] = useState<string | null>(null)


    const initializeFedimintInstance = async (id: string) => {
        if (isInitializing.current) {
            console.log("skipping duplicate initialization")
            return
        }

        isInitializing.current = true

        setWalletLoading(true)
        setWalletLoadingMessage("Opening wallet...")

        try {
            dispatch(setWalletStatus('opening'))
            setLogLevel('debug')

            const walletList = listClients()
            console.log("known wallet clients:", walletList)
            console.log("initializing wallet for id:", id)

            let walletData = await getWallet(id)
            if (!walletData) {
                walletData = await openWallet(id)
            }

            if (!walletData) throw new Error(`Could not open wallet ${id}`)

            console.log("wallet ready:", walletData.id)
            setWallet(walletData)
            dispatch(setWalletStatus('opened'))
        } catch (err) {
            console.error("error initializing wallet:", err)
            setWallet(undefined)
            dispatch(setWalletStatus('closed'))
        } finally {
            setWalletLoading(false)
            setWalletLoadingMessage(null)
            isInitializing.current = false
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
        console.log("walletId changed, reinitializing:", walletId)
        initializeFedimintInstance(walletId)
    }, [walletId])

    useEffect(() => {
        const handleBeforeUnload = () => { clearInstance() }
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [walletStatus, wallet])

    return (
        <FedimintManagerContext.Provider value={{ wallet, clearInstance }}>
            {walletLoading && <Loader message={walletLoadingMessage} />}
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