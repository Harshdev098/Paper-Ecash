// import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
// import type { notesPayload } from "@/types/init.type"
// import type { DenominationPerNote } from "@/types/fedimint.type"

// const initialState: notesPayload = {
//     sessionId: null,
//     federationId: null,
//     selectedDenominations: [],
//     expiry: null,
//     designId: null,
// }

// export const NoteSlice = createSlice({
//     name: "Note",
//     initialState,
//     reducers: {
//         setSelectedDenomination: (state, action: PayloadAction<DenominationPerNote[]>) => {
//             state.selectedDenominations = action.payload
//         },
//         updateExpiry: (state, action: PayloadAction<number | null>) => {
//             state.expiry = action.payload
//         },
//         updateFederationId: (state, action: PayloadAction<string>) => {
//             state.federationId = action.payload
//         },
//         setNoteSession: (state, action: PayloadAction<{ sessionId: string; designId: number }>) => {
//             state.sessionId = action.payload.sessionId
//             state.designId = action.payload.designId
//         }
//     }
// })

// export const { setNoteSession, setSelectedDenomination, updateExpiry } = NoteSlice.actions
// export default NoteSlice.reducer;