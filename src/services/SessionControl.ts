import type { DraftDesign, session } from "@/types/init.type";
import { openedDB, SESSION_STORE_NAME } from "@/utils/db"
import designs from '../../public/designs/json/designs'
import type { AppDispatch } from "@/redux/store";
import { updateLocalStep } from "@/redux/slices/SessionSlice";

export const BUILD_STEP=4;

export const filterDraftSessions = async (): Promise<session[]> => {
    const db = await openedDB

    const sessions = await db.getAll(SESSION_STORE_NAME);
    console.log("all fetched sessions from db is ", sessions)

    const draftSessions = sessions.filter(session => session.currentStep < BUILD_STEP)
    console.log("draft sessions are ", draftSessions)
    return draftSessions;
}

export const searchDesignsInDraft = async (designId: number | undefined): Promise<string | null> => {
    const draftSessions = await filterDraftSessions()
    const draftDesigns = await extractDesingListFromSession(draftSessions)
    if (draftDesigns) {
        const result = draftDesigns.find(design => design.id === designId)
        console.log("the result in search designs in draft is", result)
        return result?.sessionId ?? null;
    }
    return null;
}

export const filterBuildSession = async (): Promise<session[]> => {
    const db = await openedDB

    const sessions = await db.getAll(SESSION_STORE_NAME)
    const builds = sessions.filter(session => session.currentStep === BUILD_STEP)
    console.log("builds are ", builds)
    return builds;
}

export const extractDesingListFromSession = (sessions: session[]) => {
    const designList: DraftDesign[] = []

    for (const s of sessions) {
        if (s.designId !== null) {
            const design = extractDesign(s.designId)

            if (design) {
                designList.push({
                    ...design,
                    sessionId: s.sessionId || '',
                    currentStep: s.currentStep
                })
            }
        }
    }

    return designList
}

export const extractDesign = (designId: number) => {
    const design = designs.designs.find(design => design.id === designId)
    return design ? design : null;
}

export const BackToStep=(dispatch:AppDispatch,currentStep:number)=>{
    dispatch(updateLocalStep(currentStep))
}