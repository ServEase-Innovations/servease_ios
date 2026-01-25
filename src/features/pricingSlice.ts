import { createSlice } from '@reduxjs/toolkit'

export const pricingSlice = createSlice({
  name: 'pricing',
  initialState: {
    value: [],  // Start with an empty array
    groupedServices: {}
  },
  reducers: {
    add: (state :any, action:any) => {
      // Add new service to the `value` array
      state.value.push(action.payload);

      // Group services by their `Service` type
      // Group the services by their "Service" field into a single object per service type
      state.groupedServices = action.payload.reduce((acc:any, service:any) => {
        const serviceType = service.Service.toLowerCase();

        // If the serviceType doesn't exist in acc, initialize it as an array
        if (!acc[serviceType.toLowerCase()]) {
          acc[serviceType.toLowerCase()] = [];
        }

        // Push the current service into the appropriate service type array
        acc[serviceType.toLowerCase()].push(service);
        return acc;
      }, {});
    },
    remove: (state) => {
      state.value = [];  // Clear the value array
      state.groupedServices = {};  // Clear the grouped services
    }
  },
})

// Action creators are generated for each case reducer function
export const { add, remove } = pricingSlice.actions

export default pricingSlice.reducer;