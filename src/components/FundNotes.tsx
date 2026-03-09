import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from "@/components/ui/item"

export default function FundNotes() {
    let username = "Harsh"
    return (
        <section>
            <Drawer>
                <DrawerTrigger>Open</DrawerTrigger>
                <DrawerContent>
                    <div className="flex flex-col justify-center w-full">
                        <DrawerHeader>
                            <DrawerTitle className="text-center mt-4">Fund the Notes</DrawerTitle>
                            <DrawerDescription className="text-center">Fund your physical ecash notes with lightning/ecash</DrawerDescription>
                            <Alert className="max-w-2xl mt-6 mb-2 mx-auto border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-triangle-exclamation mt-1"></i>
                                    <div>
                                        <AlertTitle>Your subscription will expire in 3 days.</AlertTitle>
                                        <AlertDescription>
                                            Renew now to avoid service interruption or upgrade to a paid plan to
                                            continue using the service.
                                        </AlertDescription>
                                    </div>
                                </div>
                            </Alert>
                            <div className="text-center m-6">
                                <h3 className="text-xl font-semibold">Total Fundable Amount: <b className="text-[#1C6FA7]">200sats</b></h3>
                                <p className="text-sm text-[#4B5563]">(1100 X 3 + 1200 X 4)</p>
                            </div>
                            <ItemGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <Item variant="outline" className="w-full hover:border-[#1C6FA7]">
                                    <ItemMedia>
                                        <Avatar>
                                            <AvatarImage className="grayscale" src="" />
                                            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </ItemMedia>
                                    <ItemContent className="gap-1">
                                        <ItemTitle>Lightning Transfer</ItemTitle>
                                        <ItemDescription>Transfer the total amount from lightning network to your physical notes</ItemDescription>
                                    </ItemContent>
                                    <ItemActions>
                                        <Button variant="ghost" size="icon" className="rounded-full">
                                            <i className="fa-regular fa-circle-check"></i>
                                        </Button>
                                    </ItemActions>
                                </Item>
                                <Item variant="outline" className="w-full hover:border-[#1C6FA7]">
                                    <ItemMedia>
                                        <Avatar>
                                            <AvatarImage className="grayscale" />
                                            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    </ItemMedia>
                                    <ItemContent className="gap-1">
                                        <ItemTitle>Ecash Transfer</ItemTitle>
                                        <ItemDescription>Spend your ecash amount to your physical notes</ItemDescription>
                                    </ItemContent>
                                    <ItemActions>
                                        <Button variant="ghost" size="icon" className="rounded-full">
                                            <i className="fa-regular fa-circle-check"></i>
                                        </Button>
                                    </ItemActions>
                                </Item>
                            </ItemGroup>
                        </DrawerHeader>
                        <DrawerFooter className="flex w-full gap-4">
                            <Button className="flex-1">
                                <i className="fa-solid fa-bolt text-base mr-2"></i>
                                Fund Notes
                            </Button>
                            <DrawerClose asChild>
                                <Button variant="outline" className="flex-1">
                                    Pause
                                </Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>
        </section>
    )
}
