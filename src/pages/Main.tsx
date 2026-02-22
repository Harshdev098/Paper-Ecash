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
import { useState } from 'react'

export default function Main() {
    const [tabs, setTabs] = useState<'explore' | 'draft' | 'build'>('explore')

    return (
        <>
            <MainNav />

            <main className='bg-[#F0F0F0] my-2 pb-20 md:pb-0'>
                {/* Header Section */}
                <section className='flex items-center mx-5 justify-between pb-3'>
                    <div>
                        <h2 className='text-[26px] font-bold mt-4 text-[#36454F]'>
                            Recommended Designs
                        </h2>
                        <p className='text-[#4B5563]'>
                            Browse & Manage verified designs
                        </p>
                    </div>

                    {/* Desktop Tabs */}
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

                {/* Filters */}
                <section className='mt-4 mx-6 px-4 py-3 bg-white rounded-xl flex flex-wrap gap-2 items-center w-fit ml-auto'>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge className="bg-green-50 text-green-700 hover:bg-green-200">
                                    <i className="fa-brands fa-connectdevelop text-base pr-[24px]"></i>
                                    Community
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Community edition</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-200">
                                    <i className="fa-regular fa-calendar-check text-base pr-[24px]"></i>
                                    Event
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Bitcoin Event/Submit</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-200">
                                    <i className="fa-solid fa-user-lock text-base pr-[24px]"></i>
                                    Privacy
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Privacy focused</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge className="bg-red-50 text-red-700 hover:bg-red-200">
                                    <i className="fa-solid fa-gift text-base pr-[24px]"></i>
                                    Gifts
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Gifts & Celebration</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </section>

                {/* Content */}
                <section className='min-h-full mt-4'>
                    {tabs === 'explore' && <DesignList />}
                    {tabs === 'draft' && <Draft />}
                    {tabs === 'build' && <Builds />}
                </section>
            </main>

            {/* ✅ Mobile Bottom Navigation */}
            <div className='fixed bottom-0 left-0 w-full bg-white border-t shadow-md md:hidden z-50'>
                <div className='flex justify-around items-center py-2'>

                    <button
                        onClick={() => setTabs('explore')}
                        className={`flex flex-col items-center text-sm ${
                            tabs === 'explore'
                                ? 'text-[#319BD9]'
                                : 'text-gray-500'
                        }`}
                    >
                        <i className="fa-solid fa-compass text-lg"></i>
                        Explore
                    </button>

                    <button
                        onClick={() => setTabs('draft')}
                        className={`flex flex-col items-center text-sm ${
                            tabs === 'draft'
                                ? 'text-[#319BD9]'
                                : 'text-gray-500'
                        }`}
                    >
                        <i className="fa-solid fa-file-pen text-lg"></i>
                        Draft
                    </button>

                    <button
                        onClick={() => setTabs('build')}
                        className={`flex flex-col items-center text-sm ${
                            tabs === 'build'
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
        </>
    )
}