import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { notesPayload } from "@/types/init.type"

const initialState:notesPayload={
    sessionId:null,
    federationId:null,
    notes:{},
    expiry:null,
    designId:null,
}

export const NoteSlice=createSlice({
    name:"Note",
    initialState,
    reducers:{
        
    }
})