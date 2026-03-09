import { configureStore } from "@reduxjs/toolkit";
import DesignSlice from "./slices/DesignSlice";
import SessionSlice from "./slices/SessionSlice";
// import NoteSlice from "./slices/NoteSlice";

export const store= configureStore({
    reducer:{
        choosenDesign:DesignSlice,
        SessionSlice:SessionSlice,
    },
    
})


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;