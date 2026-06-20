import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as dbModule from '@/utils/db'
import {
    filterDraftSessions,
    filterBuildSession,
    searchDesignsInDraft,
    extractDesingListFromSession,
    extractDesign,
    BackToStep,
    BUILD_STEP,
} from '@/services/SessionControl'
import { updateLocalStep } from '@/redux/slices/SessionSlice'

vi.mock('../../../public/json/designs', () => ({
    default: {
        designs: [
            { id: 1, DesignName: 'Design One', frontPath: 'one.png' },
            { id: 2, DesignName: 'Design Two', frontPath: 'two.png' },
        ],
    },
}))

vi.mock('@/utils/db', () => {
    const mockDb = { getAll: vi.fn() }
    return {
        openedDB: Promise.resolve(mockDb),
        SESSION_STORE_NAME: 'sessions',
        __mockDb: mockDb,
    }
})

vi.mock('@/redux/slices/SessionSlice', () => ({
    updateLocalStep: vi.fn((step: number) => ({ type: 'session/updateLocalStep', payload: step })),
}))

const mockDb = (dbModule as any).__mockDb as { getAll: ReturnType<typeof vi.fn> }

beforeEach(() => {
    vi.clearAllMocks()
})

describe('filterDraftSessions', () => {
    it('returns only sessions with currentStep below BUILD_STEP', async () => {
        mockDb.getAll.mockResolvedValue([
            { sessionId: 's1', currentStep: 1, designId: 1 },
            { sessionId: 's2', currentStep: BUILD_STEP, designId: 2 },
            { sessionId: 's3', currentStep: 3, designId: 1 },
        ])

        const result = await filterDraftSessions()

        expect(result.map(s => s.sessionId)).toEqual(['s1', 's3'])
    })

    it('throws a descriptive error when the database read fails', async () => {
        mockDb.getAll.mockRejectedValue(new Error('idb closed'))

        await expect(filterDraftSessions()).rejects.toThrow(
            'Error occured while fetching draft session: idb closed'
        )
    })
})

describe('filterBuildSession', () => {
    it('returns only sessions exactly at BUILD_STEP', async () => {
        mockDb.getAll.mockResolvedValue([
            { sessionId: 's1', currentStep: BUILD_STEP },
            { sessionId: 's2', currentStep: 2 },
        ])

        const result = await filterBuildSession()

        expect(result).toHaveLength(1)
        expect(result[0].sessionId).toBe('s1')
    })
})

describe('extractDesign', () => {
    it('returns the matching design by id', () => {
        expect(extractDesign(1)?.DesignName).toBe('Design One')
    })

    it('returns null when no design matches the id', () => {
        expect(extractDesign(999)).toBeNull()
    })
})

describe('extractDesingListFromSession', () => {
    it('maps sessions to their designs, attaching sessionId and currentStep', () => {
        const sessions = [
            { sessionId: 's1', designId: 1, currentStep: 1 },
            { sessionId: 's2', designId: 2, currentStep: 4 },
        ] as any

        const result = extractDesingListFromSession(sessions)

        expect(result).toHaveLength(2)
        expect(result[0]).toMatchObject({ id: 1, sessionId: 's1', currentStep: 1 })
        expect(result[1]).toMatchObject({ id: 2, sessionId: 's2', currentStep: 4 })
    })

    it('skips sessions with a null designId', () => {
        const sessions = [{ sessionId: 's1', designId: null, currentStep: 1 }] as any

        const result = extractDesingListFromSession(sessions)

        expect(result).toHaveLength(0)
    })

    it('skips sessions whose designId no longer exists in the design catalog', () => {
        const sessions = [{ sessionId: 's1', designId: 999, currentStep: 1 }] as any

        const result = extractDesingListFromSession(sessions)

        expect(result).toHaveLength(0)
    })
})

describe('searchDesignsInDraft', () => {
    it('returns the sessionId of the draft session referencing the given design', async () => {
        mockDb.getAll.mockResolvedValue([
            { sessionId: 's1', currentStep: 1, designId: 2 },
            { sessionId: 's2', currentStep: 1, designId: 1 },
        ])

        const result = await searchDesignsInDraft(2)

        expect(result).toBe('s1')
    })

    it('returns null when no draft session references the design', async () => {
        mockDb.getAll.mockResolvedValue([])

        const result = await searchDesignsInDraft(2)

        expect(result).toBeNull()
    })

    it('ignores sessions that are already in the build stage', async () => {
        mockDb.getAll.mockResolvedValue([
            { sessionId: 's1', currentStep: BUILD_STEP, designId: 1 },
        ])

        const result = await searchDesignsInDraft(1)

        expect(result).toBeNull()
    })
})

describe('BackToStep', () => {
    it('dispatches updateLocalStep with the given step', () => {
        const dispatch = vi.fn()

        BackToStep(dispatch as any, 3)

        expect(updateLocalStep).toHaveBeenCalledWith(3)
        expect(dispatch).toHaveBeenCalledWith({ type: 'session/updateLocalStep', payload: 3 })
    })
})