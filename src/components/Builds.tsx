import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty'
import { Button } from './ui/button'
import { useMemo, useState } from 'react'
import type { DraftDesign } from '@/types/init.type'
import { extractDesingListFromSession, filterBuildSession } from '@/services/SessionControl'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { labelConfig } from '@/utils/label'


export default function Builds() {
    const [builds, setBuilds] = useState<DraftDesign[] | null>(null)

    useMemo(async () => {
        const draftSessions = await filterBuildSession()
        const designList = extractDesingListFromSession(draftSessions)
        setBuilds(designList)
    }, [])

    return (
        <>
            {(builds && builds.length !== 0) ? (
                <ul className="grid gap-12 px-4 py-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,420px))] justify-center">
                    {builds.map((design, index) => {
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
                                        >
                                            Download PDF
                                        </Button>
                                        <Button
                                            className="w-full text-pink-600 hover:bg-pink-100 hover:text-pink-700 text-base font-semibold"
                                        >
                                            Support Designer
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
                        <i className="fa-solid fa-file-pen"></i>
                    </EmptyMedia>
                    <EmptyTitle>No Created Ecash Found</EmptyTitle>
                    <EmptyDescription>
                        Get started by creating your first paper ecash.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex-row justify-center gap-2">
                    <Button className='bg-[#319BD9] hover:bg-[#5399fb]'>Create PaperEcash</Button>
                </EmptyContent>
            </Empty>)
            }
        </>
    )
}
