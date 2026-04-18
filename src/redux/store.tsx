import { configureStore } from "@reduxjs/toolkit";
import DesignSlice from "./slices/DesignSlice";
import SessionSlice from "./slices/SessionSlice";
import WalletSlice from "./slices/WalletSlice";
import LoaderSlice from "./slices/LoaderSlice";
import AlertSlice from "./slices/Alert";
// import NoteSlice from "./slices/NoteSlice";

export const store= configureStore({
    reducer:{
        choosenDesign:DesignSlice,
        SessionSlice:SessionSlice,
        WalletSlice:WalletSlice,
        LoaderSlice:LoaderSlice,
        AlertSlice:AlertSlice,
        // NoteSlice: NoteSlice, 
    },
})


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;