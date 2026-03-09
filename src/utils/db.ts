import type { session } from "@/types/init.type";
import { openDB } from "idb";

export const DB_NAME = "PaperEcash";
export const DB_VERSION = 1;
export const SESSION_STORE_NAME= "sessions"
export const NOTES_STOER_NAME="notes"

export const openedDB = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("notes")) {
      const noteStore = db.createObjectStore("notes", {
        keyPath: "sessionId",
      });

      noteStore.createIndex("expiry", "expiry");
      noteStore.createIndex("federationId", "federationId");
    }
    if (!db.objectStoreNames.contains("sessions")) {
      const sessionStore = db.createObjectStore("sessions", {
        keyPath: "sessionId",
      });

      sessionStore.createIndex("currentStep", "currentStep");
    }
  },
});

export async function savedCreatedSession({ sessionId, updatedAt, designId, currentStep, federationId }: session) {
  if (sessionId && designId) {
    const db = await openedDB;
    const session = await getSessionBySessionId(sessionId)
    if (!session) {
      await db.add("sessions", {
        sessionId, updatedAt, designId, currentStep, federationId
      });
    }else{
      console.log("session already present in idb")
    }
  }
}

export async function updateSessionOnDB({ sessionId, updatedAt, designId, currentStep, federationId }: session) {
  const db = await openedDB;

  await db.put("sessions", {
    sessionId,updatedAt,designId,currentStep,federationId
  });
}

export async function getSessionBySessionId(sessionId: string) {
  const db = await openedDB;

  const note = await db.get("sessions", sessionId);

  return note;
}