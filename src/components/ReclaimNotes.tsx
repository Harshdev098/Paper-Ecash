import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getEcashNoteData } from "@/utils/db";
import type { SpendNotesState, Wallet } from "@fedimint/core-web";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { setErrorWithTimeout, setResultWithTimeout } from "@/redux/slices/Alert";


function StatusBadge({ status }: { status: SpendNotesState }) {
    if (status === "Created") {
        return <Badge className="bg-green-500">Created</Badge>;
    }
    if (status === "Refunded") {
        return <Badge variant="secondary">Redeemed</Badge>;
    }
    if (status === 'UserCanceledSuccess') {
        return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (status === 'UserCanceledProcessing') {
        return <Badge variant="destructive">Cancelling</Badge>;
    }
}

export default function ReclaimNotes({ wallet, sessionId, noteTotalMsats }: { wallet: Wallet | undefined, sessionId: string, noteTotalMsats: number }) {
    const [operations, setOperations] = useState<string[]>([])
    const { walletStatus } = useSelector((state: RootState) => state.WalletSlice)
    const [operationStatus, setOperationStatus] = useState<Record<string, SpendNotesState>>({})
    const dispatch=useDispatch<AppDispatch>()


    const getOperationStatus = async (operations: string[]) => {
        for (let op of operations) {
            const unsubscribe = wallet?.mint.subscribeSpendNotes(
                op,
                (state: SpendNotesState) => {
                    console.log("the state is", state)
                    setOperationStatus(prev => ({
                        ...prev,
                        [op]: state
                    }))
                },
                (err) => {
                    console.log("the error in subscription are ", err)
                }
            )

            setTimeout(() => {
                unsubscribe?.()
            }, 30000)
        }
    }

    useEffect(() => {
        const getOperations = async () => {
            try {
                const ecashOperations = await getEcashNoteData(sessionId)
                if (!ecashOperations) {
                    throw new Error("No ecash operation found! Please Generate PDF ecash first")
                }

                if (!ecashOperations.operationId) {
                    console.warn("No operationId found in ecash data")
                    return
                }
                setOperations(ecashOperations.operationId)
                console.log("the ecash operations are ", ecashOperations)
                getOperationStatus(ecashOperations.operationId)
            }catch(err){
                const message = err instanceof Error ? err.message : String(err);
                dispatch(setErrorWithTimeout({ type: "Ecash Error", message:`${message}` }))
            }
        }
        getOperations()
    }, [walletStatus])

    const cancelNotes = async (operationId: string) => {
        try {
            await wallet?.mint.tryCancelSpendNotes(operationId)
            const unsubscribe = wallet?.mint.subscribeSpendNotes(operationId, (state: SpendNotesState) => {
                console.log('the state is', state)
                if (state === 'UserCanceledSuccess') {
                    setResultWithTimeout("Notes Cancelled Successfully")
                }
            }, (err) => {
                console.log("the error in subscription are ", err)
            })
            setTimeout(() => {
                unsubscribe?.()
            }, 30000);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            dispatch(setErrorWithTimeout({ type: "Sesssion Init Error", message }))
        }
    }

    return (
        <>
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mx-auto">
                {operations.map((op, index) => (
                    <Card key={index} className="shadow-md m-4">
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Note #{index + 1}</h3>
                                <StatusBadge status={operationStatus[op]} />
                            </div>

                            <div className="text-lg font-bold text-primary">
                                {noteTotalMsats} SATS
                            </div>

                            <div className="flex gap-2 mt-2">
                                <Button onClick={() => cancelNotes(op)} className="bg-[#319BD9] hover:bg-[#0e90dc] w-full text-sm" disabled={operationStatus[op] === 'Refunded' || operationStatus[op] === 'UserCanceledSuccess'}>
                                    Cancel & Redeem
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>
        </>
    );
}
