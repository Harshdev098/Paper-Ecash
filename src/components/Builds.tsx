import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty'
import { Button } from './ui/button'

export default function Builds() {
    return (
        <>
            <Empty className='min-h-[600px]'>
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
            </Empty>
        </>
    )
}
