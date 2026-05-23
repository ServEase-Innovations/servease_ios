/* eslint-disable */
import React from "react";
import { EnhancedProviderDetails } from "../types/ProviderDetailsType";
import ServiceBookingSheetDialog from "./ServiceBookingSheetDialog";

interface MaidServiceDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
  user?: unknown;
  bookingType?: unknown;
  onBookingSuccess?: () => void;
}

const MaidServiceDialog: React.FC<MaidServiceDialogProps> = ({
  open,
  handleClose,
  providerDetails,
  sendDataToParent,
  onBookingSuccess,
}) => (
  <ServiceBookingSheetDialog
    serviceKind="maid"
    open={open}
    handleClose={handleClose}
    providerDetails={providerDetails}
    sendDataToParent={sendDataToParent}
    onBookingSuccess={onBookingSuccess}
  />
);

export default MaidServiceDialog;
