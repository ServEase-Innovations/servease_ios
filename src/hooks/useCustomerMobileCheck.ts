/* eslint-disable */
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAppUser } from '../context/AppUserContext';
import { clearCustomer, fetchCustomerDetails } from '../features/customerSlice';
import { RootState } from '../store/userStore';

export const useCustomerMobileCheck = () => {
  const dispatch = useDispatch();
  const { appUser } = useAppUser();
  
  // Get data from Redux
  const customerState = useSelector((state: RootState) => state.customer);
  const hasMobileNumber = customerState.hasMobileNumber;
  const loading = customerState.loading;
  
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check for customers
    if (!appUser || appUser.role?.toUpperCase() !== "CUSTOMER") {
      return;
    }

    // Don't check again if already checked
    if (hasCheckedRef.current) {
      return;
    }

    // Fetch customer details
    if (appUser.customerid) {
      hasCheckedRef.current = true;
      dispatch(fetchCustomerDetails(appUser.customerid) as any);
    }

    // Cleanup
    return () => {
      dispatch(clearCustomer());
    };
  }, [appUser, dispatch]);

  return {
    hasMobileNumber,
    loading,
    showMobileDialog: hasMobileNumber === false,
  };
};