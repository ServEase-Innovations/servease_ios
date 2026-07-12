/* eslint-disable */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import providerInstance from "../services/providerInstance";

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

export const fetchCustomerDetails = createAsyncThunk(
  "customer/fetchCustomerDetails",
  async (customerId: string, { rejectWithValue }) => {
    try {
      const response = await providerInstance.get(`/api/customer/${customerId}`);
      const body = response.data;

      if (body?.status === 200 && body?.data) {
        return body.data;
      }
      if (body?.data) {
        return body.data;
      }
      if (body && typeof body === "object" && !body.status) {
        return body;
      }

      throw new Error(body?.message || "Failed to fetch customer details");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch customer details"
      );
    }
  }
);

const customerSlice = createSlice({
  name: "customer",
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
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerDetails.fulfilled, (state, action) => {
        state.loading = false;
        const p = action.payload || {};
        const mobileRaw = p.mobileNo ?? p.mobileno ?? p.mobile_no ?? null;
        const altRaw = p.alternateNo ?? p.alternateno ?? p.alternate_no ?? null;
        const mobileStr =
          mobileRaw != null && mobileRaw !== "" ? String(mobileRaw).replace(/\D/g, "") : "";

        state.customerId = String(p.customerId ?? p.customerid ?? "");
        state.firstName = p.firstName ?? p.firstname ?? null;
        state.lastName = p.lastName ?? p.lastname ?? null;
        state.emailId = p.emailId ?? p.emailid ?? null;
        state.mobileNo = mobileStr || null;
        state.alternateNo =
          altRaw != null && altRaw !== "" ? String(altRaw).replace(/\D/g, "") : null;
        state.hasMobileNumber = mobileStr.length >= 10;
      })
      .addCase(fetchCustomerDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.hasMobileNumber = null;
      });
  },
});

export const { clearCustomer, setHasMobileNumber, setMobileNumber, setAlternateNumber } =
  customerSlice.actions;
export default customerSlice.reducer;
