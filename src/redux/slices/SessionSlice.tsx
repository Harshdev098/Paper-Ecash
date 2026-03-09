import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import type { session, CreateSessionPayload } from "@/types/init.type"
import { getSessionBySessionId, savedCreatedSession, updateSessionOnDB } from "@/utils/db"

const initialState: session = {
    sessionId: null,
    designId: null,
    currentStep: 0,
    federationId: null,
    updatedAt: null
}

export const createSessionThunk = createAsyncThunk('session/create',
    async ({ sessionId, designId }: CreateSessionPayload) => {
        const session: session = {
            sessionId: sessionId,
            designId: designId,
            currentStep: 1,
            federationId: null,
            updatedAt: new Date().toISOString()
        }

        await savedCreatedSession(session)
        console.log("session stored and created")
        return session;
    }
)

export const updateSessionThunk = createAsyncThunk(
    "session/updateSession",
    async (updates: { federationId?: string; designId?: number } | undefined, { getState }) => {

        const state = getState() as { session: session }
        const current = state.session

        if (!current.sessionId) {
            throw new Error("No session active")
        }
        console.log("found the current session",current.sessionId,current.designId)

        const updatedSession: session = {
            ...current,
            ...updates,
            currentStep: current.currentStep + 1,
            updatedAt: new Date().toISOString()
        }

        await updateSessionOnDB(updatedSession)
        return updatedSession
    }
)

export const loadSessionThunk = createAsyncThunk(
    "session/loadSession",
    async (sessionId: string) => {
        const session = await getSessionBySessionId(sessionId)
        console.log("loading the session from extracted session id",session)
        if (!session) {
            throw new Error("Session not found")
        }

        return session
    }
)

export const SessionSlice = createSlice({
    name: "Session",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(createSessionThunk.fulfilled, (state, action) => {
            state.sessionId = action.payload.sessionId
            state.designId = action.payload.designId
            state.currentStep = action.payload.currentStep
            state.updatedAt = action.payload.updatedAt
            state.federationId = action.payload.federationId
        })

        builder.addCase(updateSessionThunk.fulfilled, (state, action) => {
            state.currentStep = action.payload.currentStep
            state.updatedAt = action.payload.updatedAt
            state.federationId = action.payload.federationId
            state.designId = action.payload.designId
        })

        builder.addCase(loadSessionThunk.fulfilled, (state, action) => {
            state.sessionId = action.payload.sessionId
            state.designId = action.payload.designId
            state.currentStep = action.payload.currentStep
            state.updatedAt = action.payload.updatedAt
            state.federationId = action.payload.federationId
        })
    }
})

export default SessionSlice.reducer;