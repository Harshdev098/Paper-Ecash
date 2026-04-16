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
    sessionId: string | null
    federationId: string | null
    noteMsats: number[]
    noteCount: number
    designId: number | null
}

export type DraftDesign = Design & {
  sessionId: string,
  currentStep:number
}

export type EcashData={
    sessionId:string,
    operationId:string[]
}