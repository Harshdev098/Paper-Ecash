import type { EcashData, notesPayload, session } from "@/types/init.type"
import { openDB } from "idb"

export const DB_NAME = "PaperEcash"
export const DB_VERSION = 3
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

export async function saveEcashOperation(ecashData: EcashData) {
    try {
        const db = await openedDB
        await db.put(ECASH_STORE_NAME, ecashData)
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occured while saving operation: ${err.message}`)
        } else {
            throw new Error(`An error occured while saving operation: ${err}`)
        }
    }
}

export async function getEcashNoteData(sessionId: string): Promise<EcashData> {
    try {
        const db = await openedDB
        return db.get(ECASH_STORE_NAME, sessionId)
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(`An error occured while getting operation: ${err.message}`)
        } else {
            throw new Error(`An error occured while getting operation: ${err}`)
        }
    }
}