import { createSlice } from '@reduxjs/toolkit'

export const bookingTypeSlice = createSlice({
  name: 'bookingType',
  initialState: {
    value: null as Record<string, any> | null,
    scheduleRevision: 0,
    scheduleDirty: false,
    scheduleDraft: null as Record<string, unknown> | null,
    activeBookingDialogProviderId: null as string | null,
  },
  reducers: {
    add: (state, action) => {
      state.value = action.payload;
      state.scheduleRevision += 1;
    },
    remove: (state) => {
      state.value = null;
      state.scheduleRevision += 1;
      state.scheduleDraft = null;
      state.scheduleDirty = false;
      state.activeBookingDialogProviderId = null;
    },
    update: (state, action) => {
      if (!state.value) {
        state.value = action.payload;
      } else {
        Object.entries(action.payload).forEach(([key, value]) => {
          state.value![key] = value;
        });
      }
    },
    commitSchedule: (state, action) => {
      const patch = action.payload as Record<string, unknown>;
      if (!state.value) {
        state.value = patch;
      } else {
        Object.entries(patch).forEach(([key, value]) => {
          state.value![key] = value;
        });
      }
      state.scheduleRevision += 1;
      state.scheduleDirty = false;
      state.scheduleDraft = null;
    },
    setScheduleDirty: (state, action) => {
      state.scheduleDirty = Boolean(action.payload);
    },
    setScheduleDraft: (state, action) => {
      state.scheduleDraft = action.payload ?? null;
    },
    openBookingDialog: (state, action) => {
      const id = action.payload;
      state.activeBookingDialogProviderId =
        id != null && String(id).trim() !== "" ? String(id) : null;
    },
    closeBookingDialog: (state) => {
      state.activeBookingDialogProviderId = null;
    },
    /** Clear date/time selections when user dismisses booking without completing checkout. */
    resetBookingSchedule: (state) => {
      if (state.value) {
        state.value = {
          ...state.value,
          startDate: "",
          endDate: "",
          startTime: "",
          endTime: "",
          timeRange: "",
          timeSlot: "",
        };
      }
      state.scheduleRevision += 1;
      state.scheduleDirty = false;
      state.scheduleDraft = null;
    },
  },
})

export const {
  add,
  remove,
  update,
  commitSchedule,
  setScheduleDirty,
  setScheduleDraft,
  openBookingDialog,
  closeBookingDialog,
  resetBookingSchedule,
} = bookingTypeSlice.actions;

export default bookingTypeSlice.reducer;
