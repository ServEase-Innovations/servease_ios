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
      setWizardState({ step: 'schedule', canGoNext: false, canGoBack: false, canSubmit: false });
    }
  }, [open, booking]);

  const handleAvailabilityVerifiedChange = useCallback((verified: boolean, message?: string) => {
    setAvailabilityVerified(verified);
    if (!verified && message) setError(message);
  }, []);

  const handleScheduleChange = useCallback(() => {
    setAvailabilityVerified(false);
    setError(null);
  }, []);

  const handleCheckAvailability = async () => {
    setError(null);
    setIsCheckingAvailability(true);
    try {
      const ok = await scheduleRef.current?.checkAvailability();
      if (!ok) setAvailabilityVerified(false);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    if (!booking || modificationDisabled) return;
    const snapshot = scheduleRef.current?.getScheduleSnapshot();
    if (!snapshot) {
      setError(t('modifyBooking.validation.completeSchedule'));
      return;
    }
    if (!availabilityVerified) {
      setError(t('modifyBooking.validation.checkAvailabilityFirst'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
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

      if (result.requires_payment && result.razorpay_order_id) {
        const amountPaise = Number(result.amount);
        const paymentResponse = await BookingService.openRazorpay(
          String(result.razorpay_order_id),
          amountPaise,
          String(result.currency || 'INR')
        );
        (paymentResponse as { engagementId?: number }).engagementId = booking.id;
        await (BookingService as typeof BookingService & {
          verifyModifySchedulePayment: (payment: Record<string, unknown>) => Promise<unknown>;
        }).verifyModifySchedulePayment(paymentResponse);
      }

      if (customerId !== null) await refreshBookings();

      const displayTime = dayjs(snapshot.startTime, 'HH:mm').isValid()
        ? dayjs(snapshot.startTime, 'HH:mm').format('hh:mm A')
        : booking.timeSlot;

      onSave({
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        timeSlot: displayTime,
      });
      setOpenSnackbar(true);
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      if (isPaymentCancelledError(err)) {
        setError(t('modifyBooking.messages.paymentCancelled'));
        return;
      }
      const apiMessage =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiMessage || t('modifyBooking.messages.error'));
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
                {t('modifyBooking.bookingInfo', { id: booking.id, service: booking.service_type })}
              </Text>
              <Text style={{ color: colors.text, marginTop: 4 }}>
                {t('modifyBooking.scheduled', {
                  date: dayjs(parseCalendarDateToDate(booking.startDate) ?? undefined).format('MMM D, YYYY'),
                  time: booking.timeSlot,
                })}
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
              />
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={{ color: colors.error }}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {!modificationDisabled && canModifyType ? (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              {wizardState.step === 'review' ? (
                <BrandButton variant="ghost" onPress={() => scheduleRef.current?.goBack()} style={styles.footerBtn}>
                  {t('modifyBooking.actions.back')}
                </BrandButton>
              ) : null}

              {wizardState.step === 'schedule' ? (
                <BrandButton
                  variant="primary"
                  onPress={() => scheduleRef.current?.goNext()}
                  disabled={!wizardState.canGoNext}
                  style={styles.footerBtn}
                >
                  {t('modifyBooking.actions.review')}
                </BrandButton>
              ) : (
                <>
                  <BrandButton
                    variant="ghost"
                    onPress={handleCheckAvailability}
                    disabled={isCheckingAvailability || isLoading}
                    style={styles.footerBtn}
                  >
                    {isCheckingAvailability
                      ? t('modifyBooking.review.checking')
                      : t('modifyBooking.actions.checkAvailability')}
                  </BrandButton>
                  <BrandButton
                    variant="primary"
                    onPress={handleSubmit}
                    disabled={!wizardState.canSubmit || !availabilityVerified || isLoading}
                    style={styles.footerBtn}
                  >
                    {isLoading ? t('modifyBooking.actions.saving') : t('modifyBooking.actions.saveChanges')}
                  </BrandButton>
                </>
              )}
            </View>
          ) : (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  footerBtn: {
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
