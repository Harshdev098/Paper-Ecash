import type { notesPayload, session } from "@/types/init.type";
import { openDB } from "idb";

export const DB_NAME = "PaperEcash";
export const DB_VERSION = 1;
export const SESSION_STORE_NAME = "sessions"
export const NOTES_STORE_NAME = "notes"

export const openedDB = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(NOTES_STORE_NAME)) {
      const noteStore = db.createObjectStore(NOTES_STORE_NAME, {
        keyPath: "sessionId",
      });

      noteStore.createIndex("expiry", "expiry");
      noteStore.createIndex("federationId", "federationId");
    }
    if (!db.objectStoreNames.contains(SESSION_STORE_NAME)) {
      const sessionStore = db.createObjectStore(SESSION_STORE_NAME, {
        keyPath: "sessionId",
      });

      sessionStore.createIndex("currentStep", "currentStep");
    }
  },
});

export async function saveCreatedSession(sessionData: session) {
  if (sessionData.sessionId && sessionData.designId) {
    const db = await openedDB;
    const session = await getSessionBySessionId(sessionData.sessionId)
    if (!session) {
      await db.add(SESSION_STORE_NAME, sessionData);
    } else {
      console.log("session already present in idb")
    }
  }
}

export async function updateSessionOnDB(sessionData: session) {
  const db = await openedDB;

  await db.put(SESSION_STORE_NAME, sessionData);
}

export async function getSessionBySessionId(sessionId: string): Promise<session | undefined> {
  const db = await openedDB;

  const note = await db.get(SESSION_STORE_NAME, sessionId);

  return note;
}

export async function saveNotesToDB(notesData: notesPayload) {
  const db = await openedDB;
  await db.put(NOTES_STORE_NAME, notesData)
}

export async function getNotesData(sessionId: string): Promise<notesPayload> {
  const db = await openedDB;
  const notes = await db.get(NOTES_STORE_NAME, sessionId)
  return notes;
}