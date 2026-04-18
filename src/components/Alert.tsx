import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface AlertsProps {
    Result?: string | null;
    Error?: { type: string, message: string } | null;
}

export default function Alerts({ Result, Error }: AlertsProps) {
    if (!Result && !Error) return null;

    return (
        <div className="fixed top-4 right-4 z-[1000]">
            <Alert
                variant={Result ? "default" : "destructive"}
                className="w-80 shadow-lg"
            >
                <AlertTitle>{Error?.type || "Success"}</AlertTitle>
                <AlertDescription>
                    {Error?.message || Result}
                </AlertDescription>
            </Alert>
        </div>
    );
}