import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { labelConfig } from '@/utils/label'
import { clearChoosenDesign, setChoosenDesign } from '@/redux/slices/DesignSlice'
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../redux/store';
import type { Design } from '@/types/init.type'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty'
import DesignDetails from './DesignDetails'
import { getAssetUrl } from '@/utils/url'


export default function DesignList({ filteredDesigns }: { filteredDesigns: Design[] }) {
    const choosenDesign=useSelector((state: RootState) => state.choosenDesign)
    const dispatch = useDispatch<AppDispatch>();

    const selectDesign = (design: Design) => {
        console.log('the choosen design data is', design)
        dispatch(setChoosenDesign(design))
    }
    return (
        <>
            {filteredDesigns.length === 0 && <Empty className='min-h-[600px]'>
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
                    <Button className='bg-[#319BD9] hover:bg-[#5399fb]'>Use own Design</Button>
                </EmptyContent>
            </Empty>}
            <ul className="grid gap-12 px-4 py-4 grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,420px))] justify-center">
                {filteredDesigns.map((design, index) => {
                    return (
                        <li key={index}>
                            <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                                <img
                                    src={getAssetUrl(design.path)}
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
                                        onClick={() => selectDesign(design)}
                                    >
                                        Preview Design
                                    </Button>
                                </CardFooter>
                            </Card>
                        </li>
                    )
                })}
            </ul>

            {choosenDesign && (
                <DesignDetails
                    open={!!choosenDesign}
                    onClose={() => dispatch(clearChoosenDesign())}
                />
            )}
        </>
    )
}
