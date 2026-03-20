import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Design } from "@/types/init.type"

type DesignState = Design | null

const initialState = null as DesignState

export const DesignSlice = createSlice({
  name: "ChoosenDesign",
  initialState,
  reducers: {
    setChoosenDesign: (_, action: PayloadAction<Design>) => {
      return action.payload
    },
    clearChoosenDesign: () => {
      return null
    }
  }
})

export const { setChoosenDesign, clearChoosenDesign } = DesignSlice.actions

export default DesignSlice.reducer