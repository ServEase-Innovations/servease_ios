import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../Settings/ThemeContext';
import { BrandButton } from '../design-system/BrandButton';
import { formatDateOnly, parseCalendarDateToDate } from '../utils/maidPricingUtils';
import { BookingService, isPaymentCancelledError } from '../services/bookingService';
import ModifyBookingScheduleSection, {
  type ModifyBookingScheduleHandle,
  type ModifyWizardState,
} from './ModifyBookingScheduleSection';

interface Booking {
  bookingType: string;
  id: number;
  startDate: string;
  endDate: string;
  start_time?: string;
  end_time?: string;
  timeSlot: string;
  service_type: string;
  serviceProviderId?: number;
  latitude?: number | null;
  longitude?: number | null;
  customerId?: number;
  modifications?: Array<{ date: string; action: string }>;
}

interface ModifyBookingDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  timeSlots: string[];
  onSave: (updatedData: { startDate: string; endDate: string; timeSlot: string }) => void;
  customerId: number | null;
  refreshBookings: () => Promise<void>;
  setOpenSnackbar: React.Dispatch<React.SetStateAction<boolean>>;
}

function parseTimeSlot(booking: Booking): { start?: string; end?: string } {
  if (booking.start_time) {
    return { start: booking.start_time, end: booking.end_time || undefined };
  }
  const slot = String(booking.timeSlot || '').trim();
  if (slot.includes('-')) {
    const [a, b] = slot.split('-').map((s) => s.trim());
    return { start: a, end: b };
  }
  return { start: slot || undefined };
}

const ModifyBookingDialog: React.FC<ModifyBookingDialogProps> = ({
  open,
  onClose,
  booking,
  onSave,
  customerId,
  refreshBookings,
  setOpenSnackbar,
}) => {
  const { colors, fontSize } = useTheme();
  const { t } = useTranslation();
  const scheduleRef = useRef<ModifyBookingScheduleHandle>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityVerified, setAvailabilityVerified] = useState(false);
  const [availabilityCheckBlocked, setAvailabilityCheckBlocked] = useState(false);
  const [wizardState, setWizardState] = useState<ModifyWizardState>({
    step: 'schedule',
    canGoNext: false,
    canGoBack: false,
    canSubmit: false,
  });

  const titleSize = fontSize === 'large' ? 20 : fontSize === 'small' ? 16 : 18;

  const isModificationTimeAllowed = (value: Booking | null): boolean => {
    if (!value) return false;
    const base = parseCalendarDateToDate(value.startDate);
    if (!base) return false;
    const { start } = parseTimeSlot(value);
    if (!start) return dayjs().isBefore(dayjs(base).subtract(30, 'minute'));
    const parsed = dayjs(start, ['HH:mm', 'h:mm A'], true);
    const booked = parsed.isValid()
      ? dayjs(base).hour(parsed.hour()).minute(parsed.minute())
      : dayjs(base);
    return dayjs().isBefore(booked.subtract(30, 'minute'));
  };

  const isBookingAlreadyModified = (value: Booking | null): boolean => {
    if (!value) return false;
    return (value.modifications ?? []).some((mod) => {
      const action = String(mod.action || '');
      return ['Schedule Rescheduled', 'Date Rescheduled', 'Time Rescheduled', 'Modified', 'Rescheduled'].includes(action);
    });
  };

  const modificationDisabled =
    !booking || !isModificationTimeAllowed(booking) || isBookingAlreadyModified(booking);

  const canModifyType =
    booking?.bookingType === 'MONTHLY' || booking?.bookingType === 'SHORT_TERM';

  const bookingCoords =
    booking?.latitude != null &&
    booking?.longitude != null &&
    Number.isFinite(Number(booking.latitude)) &&
    Number.isFinite(Number(booking.longitude))
      ? { lat: Number(booking.latitude), lng: Number(booking.longitude) }
      : null;

  const times = booking ? parseTimeSlot(booking) : {};

  useEffect(() => {
    if (open && booking) {
      setError(null);
      setAvailabilityVerified(false);
      setAvailabilityCheckBlocked(false);
      setWizardState({ step: 'schedule', canGoNext: false, canGoBack: false, canSubmit: false });
    }
  }, [open, booking]);

  const handleAvailabilityVerifiedChange = useCallback((verified: boolean, message?: string) => {
    setAvailabilityVerified(verified);
    if (!verified && message) {
      setError(message);
    }
  }, []);

  const handleScheduleChange = useCallback(() => {
    setAvailabilityVerified(false);
    setAvailabilityCheckBlocked(false);
  }, []);

  const handleCheckAvailability = async () => {
    setError(null);
    setIsCheckingAvailability(true);
    try {
      const ok = await scheduleRef.current?.checkAvailability();
      if (ok) {
        setAvailabilityVerified(true);
        setAvailabilityCheckBlocked(false);
      } else {
        setAvailabilityVerified(false);
        setAvailabilityCheckBlocked(true);
      }
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    if (!booking || modificationDisabled) return;
    const snapshot = scheduleRef.current?.getScheduleSnapshot();
    if (!snapshot) {
      setError('Please complete the schedule selection');
      return;
    }
    if (!availabilityVerified) {
      setError('Please check availability before proceeding');
      return;
    }

    console.log('[ModifyBooking] Starting modification for booking:', booking.id);
    console.log('[ModifyBooking] Schedule snapshot:', snapshot);
    
    setIsLoading(true);
    setError(null);
    
    // Helper function to make the modification request
    const makeModificationRequest = async () => {
      console.log('[ModifyBooking] Calling modifyScheduleWithPayment...');
      const result = await (BookingService as typeof BookingService & {
        modifyScheduleWithPayment: (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
        verifyModifySchedulePayment: (payment: Record<string, unknown>) => Promise<unknown>;
        openRazorpay: (orderId: string, amountPaise: number, keyId?: string) => Promise<Record<string, unknown>>;
      }).modifyScheduleWithPayment({
        engagementId: booking.id,
        start_date: snapshot.startDate,
        end_date: snapshot.endDate,
        start_time: snapshot.startTime,
        end_time: snapshot.endTime || undefined,
        modified_by_id: customerId,
        modified_by_role: 'CUSTOMER',
      });

      console.log('[ModifyBooking] Modification result:', result);

      if (result.requires_payment && result.razorpay_order_id) {
        console.log('[ModifyBooking] Payment required, opening Razorpay...');
        const amountPaise = Number(result.amount);
        const paymentResponse = await BookingService.openRazorpay(
          String(result.razorpay_order_id),
          amountPaise,
          String(result.currency || 'INR'),
          undefined,  // prefill
          String(result.razorpay_key_id || '')  // razorpay_key_id
        );
        (paymentResponse as { engagementId?: number }).engagementId = booking.id;
        
        console.log('[ModifyBooking] Payment response before verification:', JSON.stringify(paymentResponse));
        console.log('[ModifyBooking] Verifying payment...');
        await (BookingService as typeof BookingService & {
          verifyModifySchedulePayment: (payment: Record<string, unknown>) => Promise<unknown>;
        }).verifyModifySchedulePayment(paymentResponse);
        console.log('[ModifyBooking] Payment verified successfully');
      }

      if (customerId !== null) {
        console.log('[ModifyBooking] Refreshing bookings...');
        await refreshBookings();
      }

      const displayTime = dayjs(snapshot.startTime, 'HH:mm').isValid()
        ? dayjs(snapshot.startTime, 'HH:mm').format('hh:mm A')
        : booking.timeSlot;

      onSave({
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        timeSlot: displayTime,
      });
      
      console.log('[ModifyBooking] Modification completed successfully');
      setOpenSnackbar(true);
      setTimeout(() => onClose(), 1200);
    };
    
    // Retry logic for 409 conflicts (booking being modified)
    let lastError: unknown;
    const maxRetries = 1; // Only retry once for 409 errors
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await makeModificationRequest();
        return; // Success!
      } catch (err: unknown) {
        lastError = err;
        
        const apiError = err as { response?: { data?: { error?: string; message?: string }; status?: number } };
        const is409Conflict = apiError?.response?.status === 409;
        
        // Only retry on 409 conflicts and if we haven't exhausted retries
        if (is409Conflict && attempt < maxRetries) {
          const delay = 1500; // Wait 1.5 seconds before retry
          console.log(`[ModifyBooking] 409 conflict detected, retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a 409 or we've exhausted retries, handle the error
        break;
      }
    }
    
    // Handle the error
    
    // Handle the error
    const err = lastError;
    try {
      console.error('[ModifyBooking] Error during modification:', err);
      
      if (isPaymentCancelledError(err)) {
        setError('Payment was cancelled. Please try again.');
        return;
      }
      
      // Extract error message from API response
      const apiError = err as { response?: { data?: { error?: string; message?: string }; status?: number } };
      let errorMessage = apiError?.response?.data?.error || apiError?.response?.data?.message;
      
      console.log('[ModifyBooking] Raw error message:', errorMessage);
      console.log('[ModifyBooking] Status code:', apiError?.response?.status);
      
      // Handle specific error types with user-friendly messages
      if (errorMessage) {
        const lowerError = errorMessage.toLowerCase();
        
        // 409 Conflict - booking is being modified by another process
        if (apiError?.response?.status === 409) {
          if (lowerError.includes('being modified') || lowerError.includes('currently being')) {
            errorMessage = 'This booking is currently being processed. Please wait a moment and try again.';
          } else if (lowerError.includes('overlap') || lowerError.includes('conflict')) {
            errorMessage = 'Time conflict detected. Please choose a different time slot.';
          } else {
            errorMessage = 'Unable to modify booking at this time. Please try again in a moment.';
          }
        }
        // Database deadlock error - provide user-friendly message
        else if (lowerError.includes('deadlock')) {
          console.warn('[ModifyBooking] Deadlock detected - should have been retried automatically');
          errorMessage = 'The system is busy processing your request. Please try again in a moment.';
        }
        // Transaction errors
        else if (lowerError.includes('transaction')) {
          errorMessage = 'Unable to process your request at this time. Please try again.';
        }
        // Timeout errors
        else if (lowerError.includes('timeout') || lowerError.includes('timed out')) {
          errorMessage = 'The request took too long. Please check your connection and try again.';
        }
        // Generic database errors - don't expose technical details
        else if (lowerError.includes('database') || lowerError.includes('sql') || lowerError.includes('query')) {
          errorMessage = 'A technical error occurred. Please try again or contact support if the issue persists.';
        }
      }
      
      console.log('[ModifyBooking] User-facing error message:', errorMessage);
      setError(errorMessage || 'Failed to modify booking. Please try again.');
    } catch (errorHandlingErr) {
      console.error('[ModifyBooking] Error in error handling:', errorHandlingErr);
      setError('Failed to modify booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !booking) return null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text, fontSize: titleSize }]}>
              {t('modifyBooking.title')}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.close, { color: colors.text }]}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={[styles.infoCard, { backgroundColor: colors.infoLight }]}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Booking #{booking.id} • {booking.service_type}
              </Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>
                Currently scheduled for {dayjs(parseCalendarDateToDate(booking.startDate) ?? undefined).format('MMM D, YYYY')} at {booking.timeSlot}
              </Text>
            </View>

            {modificationDisabled ? (
              <View style={[styles.warningBox, { backgroundColor: colors.warningLight }]}>
                <Text style={{ color: colors.warning, textAlign: 'center' }}>
                  {isBookingAlreadyModified(booking)
                    ? t('modifyBooking.status.alreadyModified')
                    : t('modifyBooking.status.modificationNotAllowed')}
                </Text>
              </View>
            ) : !canModifyType ? (
              <View style={[styles.warningBox, { backgroundColor: colors.warningLight }]}>
                <Text style={{ color: colors.warning, textAlign: 'center' }}>
                  {t('modifyBooking.validation.unsupportedType')}
                </Text>
              </View>
            ) : (
              <ModifyBookingScheduleSection
                ref={scheduleRef}
                bookingType={booking.bookingType}
                serviceType={booking.service_type}
                engagementId={booking.id}
                providerId={booking.serviceProviderId}
                customerId={customerId}
                bookingCoords={bookingCoords}
                initialStartDate={formatDateOnly(booking.startDate)}
                initialEndDate={formatDateOnly(booking.endDate)}
                initialStartTime={times.start}
                initialEndTime={times.end}
                onAvailabilityVerifiedChange={handleAvailabilityVerifiedChange}
                onScheduleChange={handleScheduleChange}
                onWizardStateChange={setWizardState}
                availabilityVerified={availabilityVerified}
                isCheckingAvailability={isCheckingAvailability}
              />
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={{ color: colors.error }}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {!modificationDisabled && canModifyType ? (
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
              {wizardState.step === 'review' ? (
                <>
                  <View style={styles.reviewButtons}>
                    <BrandButton
                      variant="ghost"
                      onPress={onClose}
                      disabled={isLoading || isCheckingAvailability}
                      style={styles.halfBtn}
                    >
                      {t('common.cancel')}
                    </BrandButton>
                    <BrandButton
                      variant="ghost"
                      onPress={() => scheduleRef.current?.goBack()}
                      disabled={isLoading || isCheckingAvailability}
                      style={styles.halfBtn}
                    >
                      {t('modifyBooking.actions.back')}
                    </BrandButton>
                  </View>
                  {availabilityVerified ? (
                    <BrandButton
                      variant="primary"
                      onPress={handleSubmit}
                      disabled={!wizardState.canSubmit || isLoading}
                      fullWidth
                    >
                      {isLoading ? t('modifyBooking.actions.saving') : t('modifyBooking.actions.saveChanges')}
                    </BrandButton>
                  ) : (
                    <BrandButton
                      variant="primary"
                      onPress={handleCheckAvailability}
                      disabled={isCheckingAvailability || !wizardState.canSubmit || availabilityCheckBlocked}
                      fullWidth
                    >
                      {isCheckingAvailability
                        ? t('modifyBooking.review.checking')
                        : t('modifyBooking.actions.checkAvailability')}
                    </BrandButton>
                  )}
                </>
              ) : (
                <View style={styles.scheduleButtons}>
                  <BrandButton variant="ghost" onPress={onClose} style={styles.halfBtn}>
                    {t('common.cancel')}
                  </BrandButton>
                  <BrandButton
                    variant="primary"
                    onPress={() => scheduleRef.current?.goNext()}
                    disabled={!wizardState.canGoNext}
                    style={styles.halfBtn}
                  >
                    Continue
                  </BrandButton>
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
              <BrandButton variant="primary" onPress={onClose} fullWidth>
                {t('common.close')}
              </BrandButton>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '700',
  },
  close: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '300',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  infoCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warningBox: {
    borderRadius: 10,
    padding: 12,
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  footer: {
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  scheduleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  halfBtn: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ModifyBookingDialog;
