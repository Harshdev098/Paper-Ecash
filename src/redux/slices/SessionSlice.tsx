import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { session, CreateSessionPayload } from "@/types/init.type"
import { getSessionBySessionId, saveCreatedSession, updateSessionOnDB } from "@/utils/db"

const initialState: session = {
    sessionId: null,
    designId: null,
    walletId: null,
    operationId: null,
    paymentStatus: 'pending',
    currentStep: 0,
    federationId: null,
    updatedAt: null
}

// creating session at the initial step
export const createSessionThunk = createAsyncThunk('session/create',
    async ({ sessionId, designId }: CreateSessionPayload) => {
        const session: session = {
            sessionId: sessionId,
            designId: designId,
            walletId: null,
            operationId: null,
            paymentStatus: 'pending',
            currentStep: 1,
            federationId: null,
            updatedAt: new Date().toISOString()
        }

        await saveCreatedSession(session)
        console.log("session stored and created")
        return session;
    }
)

// update the session with data and next step, upgrading step in optional
export const updateSessionThunk = createAsyncThunk(
    "session/updateSession",
    async (updates: { federationId?: string; walletId?: string, operationId?: string, paymentStatus?: 'paid' | 'pending', upgradeStep?: boolean } | undefined, { getState }) => {
        const state = getState() as { SessionSlice: session }
        const current = state.SessionSlice

        if (!current.sessionId) {
            throw new Error("No session active")
        }
        console.log("found the current session", current.sessionId, current.designId)
        console.log("updating the session", updates?.federationId, updates?.walletId, updates?.operationId)

        const cleanUpdates = Object.fromEntries(
            Object.entries(updates || {}).filter(([_, v]) => v !== undefined)
        )

        const updatedSession: session = {
            ...current,
            ...cleanUpdates,
            currentStep:
                updates?.upgradeStep === false
                    ? current.currentStep
                    : current.currentStep + 1,
            updatedAt: new Date().toISOString()
        }

        await updateSessionOnDB(updatedSession)
        return updatedSession
    }
)

// load session on app start when session id is present
export const loadSessionThunk = createAsyncThunk(
    "session/loadSession",
    async (sessionId: string) => {
        const session = await getSessionBySessionId(sessionId)
        console.log("loading the session from extracted session id", session)
        if (!session) {
            throw new Error("Session not found")
        }

        return session
    }
)

export const SessionSlice = createSlice({
    name: "Session",
    initialState,
    reducers: {
        updateLocalStep: (state, action: PayloadAction<number>) => {
            state.currentStep = action.payload - 1
        },
        resetSession: (_state) => {
            return { ...initialState }
        },
        clearOperationId: (state) => {
            state.operationId = null
            state.paymentStatus = 'pending'
        }
    },
    extraReducers: (builder) => {
        builder.addCase(createSessionThunk.fulfilled, (state, action) => {
            state.sessionId = action.payload.sessionId
            state.designId = action.payload.designId
            state.walletId = action.payload.walletId
            state.operationId = action.payload.operationId
            state.paymentStatus = action.payload.paymentStatus
            state.currentStep = action.payload.currentStep
            state.updatedAt = action.payload.updatedAt
            state.federationId = action.payload.federationId
        })

        builder.addCase(updateSessionThunk.fulfilled, (state, action) => {
            state.currentStep = action.payload.currentStep
            state.walletId = action.payload.walletId
            state.operationId = action.payload.operationId
            state.paymentStatus = action.payload.paymentStatus
            state.updatedAt = action.payload.updatedAt
            state.federationId = action.payload.federationId
            state.designId = action.payload.designId
        })

        builder.addCase(loadSessionThunk.fulfilled, (state, action) => {
            state.sessionId = action.payload.sessionId
            state.designId = action.payload.designId
            state.walletId = action.payload.walletId
            state.operationId = action.payload.operationId
            state.paymentStatus = action.payload.paymentStatus
            state.currentStep = action.payload.currentStep
            state.updatedAt = action.payload.updatedAt
            state.federationId = action.payload.federationId
        })
    }
})

export const { updateLocalStep, resetSession, clearOperationId } = SessionSlice.actions
export default SessionSlice.reducer;