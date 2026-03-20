import Builds from '@/components/Builds'
import DesignList from '@/components/DesignList'
import Draft from '@/components/Draft'
import Footer from '@/components/Footer'
import MainNav from '@/components/MainNav'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { useEffect, useState } from 'react'
import { labelConfig } from '@/utils/label'
import type { Label } from '@/types/init.type'
import designs from '../../public/designs/json/designs'
import { useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/redux/store'
import { loadSessionThunk } from '@/redux/slices/SessionSlice'
import SessionCard from '@/components/SessionCard'


export default function Main() {
    const dispatch = useDispatch<AppDispatch>()
    const [tabs, setTabs] = useState<'explore' | 'draft' | 'build'>('explore')
    const [labelFilter, setLabelFilter] = useState<Label | null>(null)
    const [searchParams, setSearchParams] = useSearchParams()
    const filteredDesigns = labelFilter
        ? designs.designs.filter(design =>
            design.label.includes(labelFilter)
        )
        : designs.designs

    const sessionId = searchParams.get("id")

    useEffect(() => {
        if (!sessionId) return;
        console.log("extracted session id is ", sessionId)

        dispatch(loadSessionThunk(sessionId))
    }, [sessionId])

    return (
        <>
            <section className='min-h-screen flex flex-col pb-20 md:pb-0'>
                <MainNav />

                <main className='flex-1 bg-[#F0F0F0] my-2'>
                    <section className='flex items-center mx-5 justify-between pb-3'>
                        <div>
                            <h2 className='text-[26px] font-bold mt-4 text-[#4B5971]'>
                                Recommended Designs
                            </h2>
                            <p className='text-[#4B5563]'>
                                Browse & Manage verified designs
                            </p>
                        </div>

                        <div className='hidden md:block'>
                            <Tabs value={tabs}>
                                <TabsList>
                                    <TabsTrigger
                                        value="explore"
                                        onClick={() => setTabs('explore')}
                                        className='px-3 text-base font-semibold'
                                    >
                                        <i className="fa-solid fa-compass mr-2"></i>
                                        Explore
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="draft"
                                        onClick={() => setTabs('draft')}
                                        className='px-3 text-base font-semibold'
                                    >
                                        <i className="fa-solid fa-file-pen mr-2"></i>
                                        Draft
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="build"
                                        onClick={() => setTabs('build')}
                                        className='px-3 text-base font-semibold'
                                    >
                                        <i className="fa-solid fa-money-bills mr-2"></i>
                                        Builds
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </section>

                    <Separator />

                    <section className='mt-4 mx-6 px-4 py-3 bg-white rounded-xl flex flex-wrap gap-2 items-center w-fit'>
                        <TooltipProvider>
                            {(['Community', 'Event', 'Cypherpunk', 'Gifts', 'Regular', 'Other'] as Label[]).map(
                                (label) => {
                                    const config = labelConfig[label]

                                    return (
                                        <Tooltip key={label}>
                                            <TooltipTrigger asChild>
                                                <Badge
                                                    className={`${config.bg} ${config.text} ${config.hover} ${labelFilter === label ? `${config.selected}` : ''}`}
                                                    onClick={() => setLabelFilter(prev => prev === label ? null : label)}
                                                >
                                                    <i className={`${config.icon} text-base pr-[24px]`} />
                                                    {label}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{config.tooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                }
                            )}
                        </TooltipProvider>
                    </section>

                    <section className='min-h-full mt-4'>
                        {tabs === 'explore' && <DesignList filteredDesigns={filteredDesigns} />}
                        {tabs === 'draft' && <Draft />}
                        {tabs === 'build' && <Builds />}
                    </section>
                </main>

                <div className='fixed bottom-0 left-0 w-full bg-white border-t shadow-md md:hidden z-50'>
                    <div className='flex justify-around items-center py-2'>

                        <button
                            onClick={() => setTabs('explore')}
                            className={`flex flex-col items-center text-sm ${tabs === 'explore'
                                ? 'text-[#319BD9]'
                                : 'text-gray-500'
                                }`}
                        >
                            <i className="fa-solid fa-compass text-lg"></i>
                            Explore
                        </button>

                        <button
                            onClick={() => setTabs('draft')}
                            className={`flex flex-col items-center text-sm ${tabs === 'draft'
                                ? 'text-[#319BD9]'
                                : 'text-gray-500'
                                }`}
                        >
                            <i className="fa-solid fa-file-pen text-lg"></i>
                            Draft
                        </button>

                        <button
                            onClick={() => setTabs('build')}
                            className={`flex flex-col items-center text-sm ${tabs === 'build'
                                ? 'text-[#319BD9]'
                                : 'text-gray-500'
                                }`}
                        >
                            <i className="fa-solid fa-money-bills text-lg"></i>
                            Builds
                        </button>
                    </div>
                </div>

                <Footer />

                {sessionId && (
                    <SessionCard
                        open={true}
                        onClose={() => {
                            searchParams.delete("id")
                            setSearchParams(searchParams)
                        }}
                    />
                )}
            </section>
        </>
    )
}