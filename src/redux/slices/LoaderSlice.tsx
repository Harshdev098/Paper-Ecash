import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface Loader {
    loader: boolean,
    loaderMessage: string | null
}

const initialState: Loader = {
    loader: false,
    loaderMessage: null
}

export const LoaderSlice = createSlice({
    name: "LoaderSlice",
    initialState,
    reducers: {
        setLoader: (_, action: PayloadAction<Loader>) => {
            return action.payload
        }
    }
})

export const { setLoader } = LoaderSlice.actions
export default LoaderSlice.reducer