import type { EcashData, notesPayload, session } from "@/types/init.type"
import { openDB } from "idb"
export const DB_NAME = "PaperEcash"
export const DB_VERSION = 4
export const SESSION_STORE_NAME = "sessions"
export const NOTES_STORE_NAME = "notes"
export const ECASH_STORE_NAME = "ecash"

export const openedDB = openDB(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion) {
        // Always ensure stores exist
        if (!db.objectStoreNames.contains(NOTES_STORE_NAME)) {
            const noteStore = db.createObjectStore(NOTES_STORE_NAME, {
                keyPath: "sessionId",
            })
            noteStore.createIndex("federationId", "federationId")
        }
        if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
            const sessionStore = db.createObjectStore(SESSION_STORE_NAME, {
                keyPath: "sessionId",
            })
            sessionStore.createIndex("currentStep", "currentStep")
        }
        if (!db.objectStoreNames.contains(ECASH_STORE_NAME)) {
            db.createObjectStore(ECASH_STORE_NAME, {
                keyPath: "sessionId",
            })
        }
    },
})

export async function saveCreatedSession(sessionData: session) {
    try {
        if (sessionData.sessionId && sessionData.designId) {
            const db = await openedDB
            const existing = await getSessionBySessionId(sessionData.sessionId)
            if (!existing) {
                await db.add(SESSION_STORE_NAME, sessionData)
            }
        }
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occured while saving session: ${err.message}`)
        } else {
            throw new Error(`An error occured while saving session: ${err}`)
        }
    }
}

export async function updateSessionOnDB(sessionData: session) {
    try {
        const db = await openedDB
        await db.put(SESSION_STORE_NAME, sessionData)
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occured while updating session: ${err.message}`)
        } else {
            throw new Error(`An error occured while getting session: ${err}`)
        }
    }
}

export async function getSessionBySessionId(sessionId: string): Promise<session | undefined> {
    try {
        const db = await openedDB
        return db.get(SESSION_STORE_NAME, sessionId)
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occured while getting session: ${err.message}`)
        } else {
            throw new Error(`An error occured while getting session: ${err}`)
        }
    }
}

export async function saveNotesToDB(notesData: notesPayload) {
    try {
        const db = await openedDB
        await db.put(NOTES_STORE_NAME, notesData)
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occured while saving notes: ${err.message}`)
        } else {
            throw new Error(`An error occured while saving notes: ${err}`)
        }
    }
}

export async function getNotesData(sessionId: string): Promise<notesPayload | undefined> {
    try {
        const db = await openedDB
        return db.get(NOTES_STORE_NAME, sessionId)
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occured while getting notes data: ${err.message}`)
        } else {
            throw new Error(`An error occured while getting notes data: ${err}`)
        }
    }
}

export async function purgeExpiredEcashVaults(): Promise<void> {
    try {
        const db = await openedDB
        const all = await db.getAll(ECASH_STORE_NAME)
        const now = Date.now()
        const ONE_DAY_MS = 24 * 60 * 60 * 1000
        for (const item of all) {
            if (item.createdAt && now - item.createdAt > ONE_DAY_MS) {
                await db.delete(ECASH_STORE_NAME, item.sessionId)
                console.log(`purged expired ecash vault for session ${item.sessionId}`)
            }
        }
    } catch (err) {
        console.warn('purge error:', err)
    }
}

export async function saveEcashOperation(ecashData: EcashData) {
    try {
        const db = await openedDB
        await db.put(ECASH_STORE_NAME, ecashData)
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occurred while saving operation: ${err.message}`)
        } else {
            throw new Error(`An error occurred while saving operation: ${err}`)
        }
    }
}

export async function getEcashNoteData(sessionId: string): Promise<EcashData | undefined> {
    try {
        const db = await openedDB
        const data = await db.get(ECASH_STORE_NAME, sessionId)
        if (!data) return undefined
        // Enforce 24h expiry at read time too
        const ONE_DAY_MS = 24 * 60 * 60 * 1000
        if (data.createdAt && Date.now() - data.createdAt > ONE_DAY_MS) {
            await db.delete(ECASH_STORE_NAME, sessionId)
            console.log(`[vault] deleted expired vault on read for session ${sessionId}`)
            return undefined
        }
        return data
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occurred while getting operation: ${err.message}`)
        } else {
            throw new Error(`An error occurred while getting operation: ${err}`)
        }
    }
}