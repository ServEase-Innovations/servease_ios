/* eslint-disable */
import React from "react";
import { EnhancedProviderDetails } from "../types/ProviderDetailsType";
import ServiceBookingSheetDialog from "./ServiceBookingSheetDialog";

interface NannyServiceDialogProps {
  open?: boolean;
  /** @deprecated Use `open` — kept for ProviderDetails */
  visible?: boolean;
  handleClose?: () => void;
  onClose?: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string, options?: { bookingDate?: string; initialTab?: 'today' | 'upcoming' | 'past' | 'cancelled' | 'pending' }) => void;
  user?: unknown;
  bookingType?: unknown;
  onBookingSuccess?: () => void;
}

/** Modal booking flow for nanny / caregiver on-demand checkout (pricing engine). */
const NannyServiceDialog: React.FC<NannyServiceDialogProps> = ({
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
      serviceKind="nanny"
      open={isOpen}
      handleClose={close}
      providerDetails={providerDetails}
      sendDataToParent={sendDataToParent}
      onBookingSuccess={onBookingSuccess}
    />
  );
};

export default NannyServiceDialog;

/** @deprecated Use default export `NannyServiceDialog` */
export const DemoNanny = NannyServiceDialog;