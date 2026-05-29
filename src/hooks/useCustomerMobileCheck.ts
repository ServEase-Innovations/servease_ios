import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAppUser } from "../context/AppUserContext";
import { fetchCustomerDetails } from "../features/customerSlice";
import { RootState } from "../store/userStore";

/**
 * Mirrors web useCustomerMobileCheck: after login, load customer profile and
 * merge mobile/contact fields into AppUserContext.
 */
export const useCustomerMobileCheck = () => {
  const dispatch = useDispatch();
  const { appUser, setAppUser } = useAppUser();

  const customerState = useSelector((state: RootState) => state.customer);
  const { hasMobileNumber, loading, mobileNo, alternateNo } = customerState;

  const lastCustomerIdRef = useRef<string | null>(null);

  useEffect(() => {
    const role = appUser?.role?.toUpperCase();
    const customerId = appUser?.customerid ?? appUser?.customerId;
    if (!appUser || role !== "CUSTOMER" || customerId == null || customerId === "") {
      return;
    }

    const id = String(customerId);
    if (lastCustomerIdRef.current !== id) {
      lastCustomerIdRef.current = id;
      dispatch(fetchCustomerDetails(id) as never);
    }
  }, [appUser?.customerid, appUser?.customerId, appUser?.role, dispatch]);

  useEffect(() => {
    if (hasMobileNumber !== true || !mobileNo) return;

    setAppUser((prev: Record<string, unknown> | null) => {
      if (!prev) return prev;
      if (prev.mobileNo === mobileNo && prev.alternateNo === (alternateNo ?? null)) {
        return prev;
      }
      return {
        ...prev,
        mobileNo,
        alternateNo: alternateNo ?? null,
      };
    });
  }, [hasMobileNumber, mobileNo, alternateNo, setAppUser]);

  return {
    hasMobileNumber,
    loading,
    showMobileDialog: !loading && hasMobileNumber === false,
  };
};
