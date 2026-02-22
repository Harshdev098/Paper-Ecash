import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export default function DesignList() {
    return (
        <ul className="grid gap-12 px-4 py-4 
  grid-cols-1 
  sm:grid-cols-[repeat(auto-fit,minmax(380px,2fr))]">
            <li>
                <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                    <img
                        src="../../designs/ecashNote1.png"
                        alt="Design cover"
                        className="aspect-video w-full object-cover"
                    />
                    <CardHeader>
                        <CardTitle>Classic Note</CardTitle>
                        <CardDescription>
                            - By HarshDev098
                        </CardDescription>
                        <Badge className="bg-green-50 self-start text-green-700 hover:bg-green-200 transition">
                            <i className="fa-brands fa-connectdevelop text-base pr-[24px]"></i>
                            Branded
                        </Badge>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-[#319BD9] hover:bg-[#5399fb] text-white transition">
                            Preview Design
                        </Button>
                    </CardFooter>
                </Card>
            </li>
            <li>
                <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                    <img
                        src="../../designs/ecashNote2.png"
                        alt="Design cover"
                        className="aspect-video w-full object-cover"
                    />
                    <CardHeader>
                        <CardTitle>Classic Note</CardTitle>
                        <CardDescription>
                            - By HarshDev098
                        </CardDescription>
                        <Badge className="bg-green-50 self-start text-green-700 hover:bg-green-200 transition">
                            <i className="fa-brands fa-connectdevelop text-base pr-[24px]"></i>
                            Branded
                        </Badge>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-[#319BD9] hover:bg-[#5399fb] text-white transition">
                            Preview Design
                        </Button>
                    </CardFooter>
                </Card>
            </li>
            <li>
                <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                    <img
                        src="../../designs/ecashNote1.png"
                        alt="Design cover"
                        className="aspect-video w-full object-cover"
                    />
                    <CardHeader>
                        <CardTitle>Classic Note</CardTitle>
                        <CardDescription>
                            - By HarshDev098
                        </CardDescription>
                        <Badge className="bg-green-50 self-start text-green-700 hover:bg-green-200 transition">
                            <i className="fa-brands fa-connectdevelop text-base pr-[24px]"></i>
                            Branded
                        </Badge>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-[#319BD9] hover:bg-[#5399fb] text-white transition">
                            Preview Design
                        </Button>
                    </CardFooter>
                </Card>
            </li>
            <li>
                <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                    <img
                        src="../../designs/ecashNote2.png"
                        alt="Design cover"
                        className="aspect-video w-full object-cover"
                    />
                    <CardHeader>
                        <CardTitle>Classic Note</CardTitle>
                        <CardDescription>
                            - By HarshDev098
                        </CardDescription>
                        <Badge className="bg-green-50 self-start text-green-700 hover:bg-green-200 transition">
                            <i className="fa-brands fa-connectdevelop text-base pr-[24px]"></i>
                            Branded
                        </Badge>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-[#319BD9] hover:bg-[#5399fb] text-white transition">
                            Preview Design
                        </Button>
                    </CardFooter>
                </Card>
            </li>
            <li>
                <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                    <img
                        src="../../designs/ecashNote1.png"
                        alt="Design cover"
                        className="aspect-video w-full object-cover"
                    />
                    <CardHeader>
                        <CardTitle>Classic Note</CardTitle>
                        <CardDescription>
                            - By HarshDev098
                        </CardDescription>
                        <Badge className="bg-green-50 self-start text-green-700 hover:bg-green-200 transition">
                            <i className="fa-brands fa-connectdevelop text-base pr-[24px]"></i>
                            Branded
                        </Badge>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-[#319BD9] hover:bg-[#5399fb] text-white transition">
                            Preview Design
                        </Button>
                    </CardFooter>
                </Card>
            </li>
            <li>
                <Card className="group relative w-full pt-0 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-200/40">

                    <img
                        src="../../designs/ecashNote2.png"
                        alt="Design cover"
                        className="aspect-video w-full object-cover"
                    />
                    <CardHeader>
                        <CardTitle>Classic Note</CardTitle>
                        <CardDescription>
                            - By HarshDev098
                        </CardDescription>
                        <Badge className="bg-green-50 self-start text-green-700 hover:bg-green-200 transition">
                            <i className="fa-brands fa-connectdevelop text-base pr-[24px]"></i>
                            Branded
                        </Badge>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full bg-[#319BD9] hover:bg-[#5399fb] text-white transition">
                            Preview Design
                        </Button>
                    </CardFooter>
                </Card>
            </li>
        </ul>
    )
}
