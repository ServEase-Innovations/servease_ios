import { createSlice } from '@reduxjs/toolkit'
import { normalizeGeoLocationPayload } from '../utils/bookingLocation'

export const geoLocationSlice = createSlice({
  name: 'geoLocationData',
  initialState: {
    value: null as Record<string, unknown> | null,
    updatedAt: 0,
  },
  reducers: {
    addLocation: (state, action) => {
      state.value = normalizeGeoLocationPayload(action.payload) ?? action.payload
      state.updatedAt = Date.now()
    },
    remove: (state) => {
      state.value = null
      state.updatedAt = Date.now()
    }
  },
})

export const { addLocation, remove } = geoLocationSlice.actions

export default geoLocationSlice.reducer
