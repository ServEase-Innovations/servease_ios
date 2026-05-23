/* eslint-disable */
import React from "react";
import { EnhancedProviderDetails } from "../types/ProviderDetailsType";
import ServiceBookingSheetDialog from "./ServiceBookingSheetDialog";

interface CookServiceDialogProps {
  open?: boolean;
  /** @deprecated Use `open` — kept for ProviderDetails */
  visible?: boolean;
  handleClose?: () => void;
  onClose?: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
  user?: unknown;
  bookingType?: unknown;
  onBookingSuccess?: () => void;
}

/** Modal booking flow for cook on-demand checkout (pricing engine). */
const CookServiceDialog: React.FC<CookServiceDialogProps> = ({
  open,
  visible,
  handleClose,
  onClose,
  providerDetails,
  sendDataToParent,
  onBookingSuccess,
}) => {
  const isOpen = open ?? visible ?? false;
  const close = handleClose ?? onClose ?? (() => {});

  return (
    <ServiceBookingSheetDialog
      serviceKind="cook"
      open={isOpen}
      handleClose={close}
      providerDetails={providerDetails}
      sendDataToParent={sendDataToParent}
      onBookingSuccess={onBookingSuccess}
    />
  );
};

export default CookServiceDialog;

/** @deprecated Use default export `CookServiceDialog` */
export const DemoCook = CookServiceDialog;
