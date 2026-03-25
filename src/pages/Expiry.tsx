// import Stepper from "@/components/Stepper"
// import { Button } from "@/components/ui/button"
// import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Field, FieldLabel } from "@/components/ui/field"
// import { useEffect, useState } from "react"
// import { getNotesData, saveNotesToDB } from "@/utils/db"
// import { useDispatch, useSelector } from "react-redux"
// import type { AppDispatch, RootState } from "@/redux/store"
// import { updateSessionThunk } from "@/redux/slices/SessionSlice"
// import { BackToStep } from "@/services/SessionControl"


// export default function Expiry() {
//     const [expiry, setExpiry] = useState<null | number>(null)
//     const { sessionId, designId, currentStep } = useSelector((state: RootState) => state.SessionSlice)
//     const dispatch = useDispatch<AppDispatch>()

//     useEffect(() => {
//         const loadPreviousExpiry = async () => {
//             if (!sessionId) return
//             try {
//                 const notes = await getNotesData(sessionId)
//                 if (notes?.expiry) {
//                     setExpiry(notes.expiry / (24 * 60 * 60))
//                 }
//             } catch (err) {
//                 console.log("Could not load previous expiry", err)
//             }
//         }
//         loadPreviousExpiry()
//     }, [sessionId])

//     const saveExpiryOnDB = async () => {
//         try {
//             if (sessionId && designId) {
//                 const notes = await getNotesData(sessionId)
//                 console.log("the data in saveExpiry function is ", sessionId, designId, notes.notes, expiry)
//                 await saveNotesToDB({ sessionId, notes: notes.notes, federationId: notes.federationId, designId, expiry: expiry ? expiry * 24 * 60 * 60 : null })
//                 dispatch(updateSessionThunk())
//             }
//         } catch (err) {
//             console.log("an error occured while setting expiry ", err)
//         }
//     }

//     return (
//         <>
//             <DrawerHeader>
//                 <DrawerTitle className='text-center text-2xl'>Set Optional Expiry</DrawerTitle>
//                 <DrawerDescription className='text-center'>
//                     Set an optional expiry for the note to be used in specific time
//                 </DrawerDescription>
//             </DrawerHeader>
//             <div className='m-4'>
//                 <Stepper currentStep={3} />
//             </div>
//             <section className="flex flex-col gap-6 justify-center items-center mb-4">
//                 <Alert className="max-w-2xl mt-6 mb-2 mx-auto border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
//                     <div className="flex items-start gap-3">
//                         <i className="fa-solid fa-triangle-exclamation mt-1"></i>
//                         <div>
//                             <AlertTitle>Optional expiry for issued notes</AlertTitle>
//                             <AlertDescription>
//                                 Setting an expiry allows you to reclaim unredeemed notes after the chosen time.
//                             </AlertDescription>
//                         </div>
//                     </div>
//                 </Alert>
//                 <Field className="w-full max-w-48">
//                     <FieldLabel>Set Expiry</FieldLabel>
//                     <Select
//                         value={expiry ? String(expiry) : undefined}
//                         onValueChange={(value) => setExpiry(Number(value))}
//                     >
//                         <SelectTrigger className="w-full max-w-48">
//                             <SelectValue placeholder="Select a expiry time" />
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectGroup>
//                                 <SelectLabel>Expiry</SelectLabel>
//                                 <SelectItem value="1">1 day</SelectItem>
//                                 <SelectItem value="3">3 days</SelectItem>
//                                 <SelectItem value="5">5 days</SelectItem>
//                                 <SelectItem value="7">7 days</SelectItem>
//                                 <SelectItem value="10">10 days</SelectItem>
//                                 <SelectItem value="14">14 days</SelectItem>
//                             </SelectGroup>
//                         </SelectContent>
//                     </Select>
//                 </Field>
//             </section>
//             <DrawerFooter>
//                 <Button type="button" onClick={saveExpiryOnDB} className='bg-[#319BD9] hover:bg-[#0e90dc] font-semibold'>Next <i className="fa-solid fa-arrow-right"></i></Button>
//                 <Button variant='outline' onClick={() => BackToStep(dispatch, currentStep)} className="font-semibold">Back</Button>
//             </DrawerFooter>
//         </>
//     )
// }
