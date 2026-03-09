import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty'
import { Button } from './ui/button'
import { useMemo, useState } from 'react'
import { extractDesingListFromSession, filterDraftSessions } from '@/services/SessionControl'
import type { DraftDesign } from '@/types/init.type'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { labelConfig } from '@/utils/label'
import { useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/redux/store'
import { loadSessionThunk } from '@/redux/slices/SessionSlice'


export default function Draft() {
    const [draftDesigns, setDraftDesigns] = useState<DraftDesign[] | null>(null)
    const [searchParams, setSearchParams] = useSearchParams()
    const dispatch=useDispatch<AppDispatch>()

    useMemo(async () => {
        const draftSessions = await filterDraftSessions()
        const designList = extractDesingListFromSession(draftSessions)
        setDraftDesigns(designList)
    }, [])

    const continueSession=(sessionId:string)=>{
        console.log("continuing the session")
        searchParams.set('id',sessionId)
        setSearchParams(searchParams)
        dispatch(loadSessionThunk(sessionId))
    }

    return (
        <>
            {(draftDesigns && draftDesigns.length !== 0) ? (
                <ul className="grid gap-12 px-4 py-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,420px))] justify-center">
                    {draftDesigns.map((design, index) => {
                        return (
                            <li key={index}>
                                <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                                    <img
                                        src={design.path}
                                        alt={design.DesignName}
                                        className="aspect-video w-full object-cover"
                                    />

                                    <CardHeader>
                                        <CardTitle>{design.DesignName}</CardTitle>
                                        <CardDescription>
                                            - By {design.designer}
                                            <br />
                                            <i className='p-2'>Continuing on {design.currentStep} step</i>
                                        </CardDescription>

                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {design.label.map((lbl) => {
                                                const config = labelConfig[lbl]

                                                return (
                                                    <Badge
                                                        key={lbl}
                                                        className={`transition ${config.bg} ${config.text} ${config.hover}`}
                                                    >
                                                        <i className={`${config.icon} mr-2`} />
                                                        {lbl}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </CardHeader>

                                    <CardFooter>
                                        <Button
                                            className="w-full bg-[#319BD9] hover:bg-[#5399fb] text-base font-semibold"
                                            onClick={() => continueSession(design.sessionId)}
                                        >
                                            Continue Session
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </li>
                        )
                    })}
                </ul>
            ) : (<Empty className='min-h-[600px]'>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <i className="fa-solid fa-file-pen"></i >
                    </EmptyMedia >
                    <EmptyTitle>No Draft Designs Found</EmptyTitle>
                    <EmptyDescription>
                        You haven&apos;t left any designs incomplete. Get started by creating
                        your first paper ecash.
                    </EmptyDescription>
                </EmptyHeader >
                <EmptyContent className="flex-row justify-center gap-2">
                    <Button className='bg-[#319BD9] hover:bg-[#5399fb]'>Create PaperEcash</Button>
                </EmptyContent>
            </Empty >)
            }
        </>
    )
}
