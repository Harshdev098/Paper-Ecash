import type { DenominationPerNote } from "./fedimint.type"

export const LABELS = [
    'Community',
    'Other',
    'Gifts',
    'Event',
    'Cypherpunk',
    'Regular'
] as const

export type Label = typeof LABELS[number]

export type Design = {
    id: number,
    DesignName: string,
    path: string,
    designer: string,
    lnurl: string,
    label: Label[],
    qr:{x:number,y:number,height:number,width:number},
    denomination:{x:number,y:number,fontSize:number}
}

export type DesignResponse = {
    designs: Design[]
}

export type session = {
    sessionId: string | null,
    designId: number | null,
    walletId:string | null,
    operationId:string | null
    paymentStatus: 'paid' | 'pending'
    currentStep: number,
    federationId: string | null,
    updatedAt: string | null,
}

export type CreateSessionPayload = {
    sessionId: string
    designId: number
}

export type notesPayload = {
    sessionId: string | null,
    federationId: string | null,
    notes: DenominationPerNote[],
    designId: number | null
}

export type NotesData = {
    notes: DenominationPerNote[],
    federation_id: string,
    session_id: string,
    expiry: number
}

export type DraftDesign = Design & {
  sessionId: string,
  currentStep:number
}