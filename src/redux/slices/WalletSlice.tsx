import { createSlice, type PayloadAction } from "@reduxjs/toolkit"


const initialState: { walletStatus: 'closed' | 'opened' | 'opening' } = {
    walletStatus: 'closed'
}

export const WalletSlice = createSlice({
    name: "WalletSlice",
    initialState,
    reducers: {
        setWalletStatus: (state, action: PayloadAction<'closed' | 'opened' | 'opening'>) => {
            state.walletStatus = action.payload
        }
    }
})

export const { setWalletStatus } = WalletSlice.actions

export default WalletSlice.reducer