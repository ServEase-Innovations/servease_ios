/* eslint-disable */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import providerInstance from '../services/providerInstance'; // Updated import

interface CustomerState {
  customerId: string | null;
  mobileNo: string | null;
  alternateNo: string | null;
  firstName: string | null;
  lastName: string | null;
  emailId: string | null;
  hasMobileNumber: boolean | null;
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customerId: null,
  mobileNo: null,
  alternateNo: null,
  firstName: null,
  lastName: null,
  emailId: null,
  hasMobileNumber: null,
  loading: false,
  error: null,
};

// Async thunk to fetch customer details using providerInstance
export const fetchCustomerDetails = createAsyncThunk(
  'customer/fetchCustomerDetails',
  async (customerId: string, { rejectWithValue }) => {
    try {
      const response = await providerInstance.get(
        `/api/customer/${customerId}`
      );
      
      // Assuming the response structure matches the provided example
      if (response.data.status === 200 && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch customer details');
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch customer details'
      );
    }
  }
);

const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    setHasMobileNumber: (state, action: PayloadAction<boolean>) => {
      state.hasMobileNumber = action.payload;
    },
    setMobileNumber: (state, action: PayloadAction<string>) => {
      state.mobileNo = action.payload;
      state.hasMobileNumber = true;
    },
    setAlternateNumber: (state, action: PayloadAction<string | null>) => {
      state.alternateNo = action.payload;
    },
    clearCustomer: (state) => {
      state.customerId = null;
      state.mobileNo = null;
      state.alternateNo = null;
      state.firstName = null;
      state.lastName = null;
      state.emailId = null;
      state.hasMobileNumber = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.customerId = action.payload.customerid;
        state.firstName = action.payload.firstname;
        state.lastName = action.payload.lastname;
        state.emailId = action.payload.emailid;
        state.mobileNo = action.payload.mobileno;
        state.alternateNo = action.payload.alternateno;
        state.hasMobileNumber = !!action.payload.mobileno;
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.hasMobileNumber = null;
      });
  },
});

export const { 
  clearCustomer, 
  setHasMobileNumber, 
  setMobileNumber, 
  setAlternateNumber 
} = customerSlice.actions;
export default customerSlice.reducer;