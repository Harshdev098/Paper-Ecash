import { extractDesign } from "@/services/SessionControl"

const DEFAULT_DESIGN_SIZE = { height: 874, width: 1748 }

export function getAssetUrl(frontPath?: string, backPath?: string) {
    if (frontPath) return `${import.meta.env.BASE_URL}/designs/${frontPath}`
    if (backPath) return `${import.meta.env.BASE_URL}/designs/${backPath}`
}

export const getNaturalDesignSize = (designId: number): { height: number, width: number } => {
    const designDetail = extractDesign(designId);
    return designDetail?.designSize || DEFAULT_DESIGN_SIZE;
}