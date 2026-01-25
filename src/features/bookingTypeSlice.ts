import { createSlice } from '@reduxjs/toolkit'

export const bookingTypeSlice = createSlice({
  name: 'bookingType',
  initialState: {
    value: null as Record<string, any> | null, // Ensure value is an object or null
  },
  reducers: {
    add: (state, action) => {
      state.value = action.payload;
    },
    remove: (state) => {
      state.value = null;
    },
    update: (state, action) => {
      console.log("Previous State Before Update:", state.value);
      console.log("Payload Received:", action.payload);
    
      if (!state.value) {
        state.value = action.payload; // Directly assign if state is null
      } else {
        Object.entries(action.payload).forEach(([key, value]) => {
          state.value![key] = value; // Ensure immer detects change
        });
      }
    
      console.log("Updated Redux State:", state.value);
    }
    
    
  },
})

// Action creators
export const { add, remove, update } = bookingTypeSlice.actions;

export default bookingTypeSlice.reducer;