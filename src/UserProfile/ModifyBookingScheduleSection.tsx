import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import DribbbleDateTimePicker from '../common/DribbbleDateTimePicker';
import { useTheme } from '../Settings/ThemeContext';
import { BRAND } from '../theme/brandColors';
import { buildReduxBookingPatch } from '../utils/bookingSchedulePatch';
import { formatDateOnly, getBookingTypeFromPreference, parseCalendarDateToDate } from '../utils/maidPricingUtils';
import { isBookingScheduleComplete, computeDurationHours } from '../ServiceDialogs/serviceBookingConfig';
import { checkSelectedProviderAvailability } from '../services/providerScheduleAvailability';

dayjs.extend(customParseFormat);

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6];
const WORK_DAY_END_MINUTES = 20 * 60;
const LATEST_START_MINUTES = 19 * 60;

const QUICK_TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 19 && m > 0) continue;
      const hour12 = h % 12 || 12;
      const minute = m === 0 ? '00' : String(m);
      const ampm = h < 12 ? 'AM' : 'PM';
      slots.push(`${hour12}:${minute} ${ampm}`);
    }
  }
  return slots;
})();

export type ModifyWizardStep = 'schedule' | 'review';

export type ModifyScheduleSnapshot = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

export type ModifyWizardState = {
  step: ModifyWizardStep;
  canGoNext: boolean;
  canGoBack: boolean;
  canSubmit: boolean;
};

export type ModifyBookingScheduleHandle = {
  activeStep: ModifyWizardStep;
  canGoNext: boolean;
  canSubmit: boolean;
  goNext: () => boolean;
  goBack: () => void;
  checkAvailability: () => Promise<boolean>;
  getScheduleSnapshot: () => ModifyScheduleSnapshot | null;
  isChecking: boolean;
  isLocalScheduleComplete: boolean;
  durationHours: number;
};

export type ModifyBookingScheduleSectionProps = {
  bookingType: string;
  serviceType: string;
  engagementId: number;
  providerId?: number | null;
  customerId?: number | null;
  bookingCoords?: { lat: number; lng: number } | null;
  initialStartDate?: string;
  initialEndDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  onAvailabilityVerifiedChange?: (verified: boolean, message?: string) => void;
  onScheduleChange?: () => void;
  onWizardStateChange?: (state: ModifyWizardState) => void;
};

function bookingPreferenceFromType(bookingType: string): string {
  const code = String(bookingType || '').toUpperCase();
  if (code === 'SHORT_TERM') return 'Short term';
  return 'Monthly';
}

function parseTimeOnDate(dateStr: string | undefined, timeStr: string | undefined): Dayjs | null {
  if (!dateStr || !timeStr) return null;
  const base = dayjs(parseCalendarDateToDate(dateStr));
  if (!base.isValid()) return null;
  const normalized = String(timeStr).trim();
  const parsed = dayjs(normalized, ['HH:mm:ss', 'HH:mm', 'h:mm A', 'hh:mm A'], true);
  if (parsed.isValid()) {
    return base.hour(parsed.hour()).minute(parsed.minute()).second(0);
  }
  const [h, m] = normalized.split(':').map(Number);
  if (!Number.isFinite(h)) return null;
  return base.hour(h).minute(Number.isFinite(m) ? m : 0);
}

function durationHoursFromTimes(start: Dayjs | null, end: Dayjs | null): number {
  if (!start || !end) return 0;
  const mins = end.diff(start, 'minute');
  if (mins <= 0) return 0;
  return Math.max(1, Math.min(6, Math.round(mins / 60)));
}

function timeMinutesOnDay(time: Dayjs): number {
  return time.hour() * 60 + time.minute();
}

function isDurationWithinWorkHours(start: Dayjs, hours: number): boolean {
  return timeMinutesOnDay(start) + hours * 60 <= WORK_DAY_END_MINUTES;
}

function maxAllowedDurationHours(start: Dayjs): number {
  let max = 0;
  for (const h of DURATION_OPTIONS) {
    if (isDurationWithinWorkHours(start, h)) max = h;
  }
  return max;
}

const ModifyBookingScheduleSection = forwardRef<
  ModifyBookingScheduleHandle,
  ModifyBookingScheduleSectionProps
>((props, ref) => {
  const {
    bookingType,
    serviceType,
    engagementId,
    providerId,
    customerId,
    bookingCoords,
    initialStartDate,
    initialEndDate,
    initialStartTime,
    initialEndTime,
    onAvailabilityVerifiedChange,
    onScheduleChange,
    onWizardStateChange,
  } = props;

  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const preference = bookingPreferenceFromType(bookingType);
  const today = dayjs();
  const maxDate90Days = today.add(89, 'day');

  const [activeStep, setActiveStep] = useState<ModifyWizardStep>('schedule');
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [selectedDurationHours, setSelectedDurationHours] = useState(1);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);

  const originalScheduleRef = useRef<{
    dateSummary: string;
    timeSummary: string;
    durationHours: number;
  } | null>(null);

  const onAvailabilityVerifiedChangeRef = useRef(onAvailabilityVerifiedChange);
  const onScheduleChangeRef = useRef(onScheduleChange);
  const onWizardStateChangeRef = useRef(onWizardStateChange);

  useEffect(() => {
    onAvailabilityVerifiedChangeRef.current = onAvailabilityVerifiedChange;
    onScheduleChangeRef.current = onScheduleChange;
    onWizardStateChangeRef.current = onWizardStateChange;
  }, [onAvailabilityVerifiedChange, onScheduleChange, onWizardStateChange]);

  const bookingHydrationKey = useMemo(
    () =>
      [engagementId, bookingType, initialStartDate, initialEndDate, initialStartTime, initialEndTime].join('|'),
    [bookingType, engagementId, initialEndDate, initialEndTime, initialStartDate, initialStartTime]
  );

  useEffect(() => {
    const dateStr = formatDateOnly(initialStartDate) || dayjs().format('YYYY-MM-DD');
    const endStr = formatDateOnly(initialEndDate) || dateStr;
    const sd = dayjs(parseCalendarDateToDate(dateStr)).startOf('day');
    let ed = dayjs(parseCalendarDateToDate(endStr)).startOf('day');
    const st = parseTimeOnDate(dateStr, initialStartTime) ?? sd.hour(9).minute(0);
    const et = parseTimeOnDate(dateStr, initialEndTime) ?? st.add(1, 'hour');

    if (preference === 'Monthly') ed = sd.add(1, 'month');

    setActiveStep('schedule');
    setStartDate(sd);
    setEndDate(ed);
    setStartTime(st);
    setEndTime(et);
    const dur = durationHoursFromTimes(st, et);
    setSelectedDurationHours(dur > 0 ? dur : 1);
    setValidationMsg(null);
    setShowAllTimes(false);
    onAvailabilityVerifiedChangeRef.current?.(false);

    const dateSummary =
      preference === 'Short term' && sd && ed
        ? `${sd.format('MMM D')} – ${ed.format('MMM D')}`
        : sd.format('ddd, MMM D');
    const timeSummary =
      st && et ? `${st.format('h:mm A')} – ${et.format('h:mm A')}` : st?.format('h:mm A') ?? '—';

    originalScheduleRef.current = { dateSummary, timeSummary, durationHours: dur > 0 ? dur : 1 };
  }, [bookingHydrationKey, preference]);

  const markScheduleTouched = useCallback(() => {
    onAvailabilityVerifiedChangeRef.current?.(false);
    onScheduleChangeRef.current?.();
  }, []);

  const localSchedulePatch = useMemo(
    () => buildReduxBookingPatch(preference, startDate, endDate, startTime, endTime, null),
    [preference, startDate, endDate, startTime, endTime]
  );

  const isLocalScheduleComplete = useMemo(() => {
    const bookingTypeCode = getBookingTypeFromPreference(preference);
    return isBookingScheduleComplete(localSchedulePatch as Record<string, unknown>, bookingTypeCode);
  }, [localSchedulePatch, preference]);

  const durationFromTimes = useMemo(() => durationHoursFromTimes(startTime, endTime), [startTime, endTime]);
  const durationHours = durationFromTimes > 0 ? durationFromTimes : selectedDurationHours;

  const datesComplete =
    preference === 'Short term' ? Boolean(startDate && endDate) : Boolean(startDate);

  const setDurationHours = (hours: number) => {
    markScheduleTouched();
    setSelectedDurationHours(hours);
    if (!startTime) return;
    if (!isDurationWithinWorkHours(startTime, hours)) {
      setValidationMsg(t('modifyBooking.validation.durationExceedsWorkHours'));
      return;
    }
    setEndTime(startTime.add(hours, 'hour'));
    setValidationMsg(null);
  };

  const applyQuickTime = (timeLabel: string) => {
    if (!startDate || (preference === 'Short term' && !endDate)) return;
    const parsed = dayjs(timeLabel, 'h:mm A');
    if (!parsed.isValid()) return;
    const baseDay = startDate.startOf('day');
    const nextStart = baseDay.hour(parsed.hour()).minute(parsed.minute()).second(0);
    if (!isDurationWithinWorkHours(nextStart, durationHours)) {
      setValidationMsg(t('modifyBooking.validation.durationExceedsWorkHours'));
      return;
    }
    markScheduleTouched();
    const nextEnd = nextStart.add(durationHours, 'hour');
    setStartTime(nextStart);
    setEndTime(nextEnd);
    if (preference === 'Monthly') {
      setEndDate(nextStart.add(1, 'month'));
    }
    setValidationMsg(null);
  };

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (!isLocalScheduleComplete) {
      setValidationMsg(t('modifyBooking.validation.completeSchedule'));
      onAvailabilityVerifiedChangeRef.current?.(false);
      return false;
    }

    const resolvedProviderId = Number(providerId);
    if (!Number.isFinite(resolvedProviderId) || resolvedProviderId < 1) {
      setValidationMsg(t('modifyBooking.validation.noProvider'));
      onAvailabilityVerifiedChangeRef.current?.(false);
      return false;
    }

    if (!bookingCoords) {
      setValidationMsg(t('modifyBooking.validation.noLocation'));
      onAvailabilityVerifiedChangeRef.current?.(false);
      return false;
    }

    const bookingTypeCode = getBookingTypeFromPreference(preference);
    const startDateYmd = formatDateOnly(String(localSchedulePatch.startDate ?? ''));
    const endDateYmd = formatDateOnly(String(localSchedulePatch.endDate ?? '')) || startDateYmd;
    const startTimeStr = String(localSchedulePatch.startTime ?? '').trim();
    const endTimeStr = String(localSchedulePatch.endTime ?? '').trim();
    const durationHoursResolved = computeDurationHours(
      bookingTypeCode,
      startTimeStr,
      endTimeStr,
      startDateYmd,
      endDateYmd,
      String(localSchedulePatch.timeRange ?? '')
    );
    const durationMinutes =
      durationHoursResolved != null && durationHoursResolved > 0
        ? Math.round(durationHoursResolved * 60)
        : 60;

    setIsChecking(true);
    try {
      const availability = await checkSelectedProviderAvailability({
        providerId: resolvedProviderId,
        latitude: bookingCoords.lat,
        longitude: bookingCoords.lng,
        role: String(serviceType || 'maid').toUpperCase(),
        startDate: startDateYmd,
        endDate: endDateYmd,
        preferredStartTime: startTimeStr,
        serviceDurationMinutes: durationMinutes,
        customerId,
        excludeEngagementId: engagementId,
      });

      if (!availability.available) {
        const message = availability.message || t('modifyBooking.validation.notAvailable');
        setValidationMsg(message);
        onAvailabilityVerifiedChangeRef.current?.(false, message);
        return false;
      }

      setValidationMsg(null);
      onAvailabilityVerifiedChangeRef.current?.(true);
      return true;
    } catch {
      const message = t('modifyBooking.validation.checkFailed');
      setValidationMsg(message);
      onAvailabilityVerifiedChangeRef.current?.(false, message);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [
    bookingCoords,
    customerId,
    engagementId,
    isLocalScheduleComplete,
    localSchedulePatch,
    preference,
    providerId,
    serviceType,
    t,
  ]);

  const getScheduleSnapshot = useCallback((): ModifyScheduleSnapshot | null => {
    if (!isLocalScheduleComplete) return null;
    return {
      startDate: formatDateOnly(String(localSchedulePatch.startDate ?? '')),
      endDate: formatDateOnly(String(localSchedulePatch.endDate ?? '')),
      startTime: String(localSchedulePatch.startTime ?? '').trim(),
      endTime: String(localSchedulePatch.endTime ?? '').trim(),
    };
  }, [isLocalScheduleComplete, localSchedulePatch]);

  const timeSummary = useMemo(() => {
    if (!startTime) return '—';
    if (endTime) return `${startTime.format('h:mm A')} – ${endTime.format('h:mm A')}`;
    return startTime.format('h:mm A');
  }, [startTime, endTime]);

  const dateSummary = useMemo(() => {
    if (preference === 'Short term' && startDate && endDate) {
      return `${startDate.format('MMM D')} – ${endDate.format('MMM D, YYYY')}`;
    }
    if (startDate) return startDate.format('ddd, MMM D, YYYY');
    return '—';
  }, [preference, startDate, endDate]);

  const scheduleChanged = useMemo(() => {
    const orig = originalScheduleRef.current;
    if (!orig) return false;
    const compactDateSummary =
      preference === 'Short term' && startDate && endDate
        ? `${startDate.format('MMM D')} – ${endDate.format('MMM D')}`
        : startDate?.format('ddd, MMM D') ?? '—';
    return (
      orig.dateSummary !== compactDateSummary ||
      orig.timeSummary !== timeSummary ||
      orig.durationHours !== durationHours
    );
  }, [durationHours, endDate, preference, startDate, timeSummary]);

  const canGoNext = activeStep === 'schedule' && datesComplete && Boolean(startTime);
  const canSubmit = activeStep === 'review' && isLocalScheduleComplete && scheduleChanged;

  const goNext = useCallback((): boolean => {
    if (!datesComplete) {
      setValidationMsg(t('modifyBooking.validation.selectDates'));
      return false;
    }
    if (!startTime) {
      setValidationMsg(t('modifyBooking.validation.selectTime'));
      return false;
    }
    setValidationMsg(null);
    setActiveStep('review');
    return true;
  }, [datesComplete, startTime, t]);

  const goBack = useCallback(() => {
    setValidationMsg(null);
    if (activeStep === 'review') setActiveStep('schedule');
  }, [activeStep]);

  useEffect(() => {
    onWizardStateChangeRef.current?.({
      step: activeStep,
      canGoNext,
      canGoBack: activeStep !== 'schedule',
      canSubmit,
    });
  }, [activeStep, canGoNext, canSubmit]);

  useImperativeHandle(
    ref,
    () => ({
      activeStep,
      canGoNext,
      canSubmit,
      goNext,
      goBack,
      checkAvailability,
      getScheduleSnapshot,
      isChecking,
      isLocalScheduleComplete,
      durationHours,
    }),
    [activeStep, canGoNext, canSubmit, checkAvailability, getScheduleSnapshot, goBack, goNext, isChecking, isLocalScheduleComplete, durationHours]
  );

  const availableQuickTimes = useMemo(() => {
    if (!startDate) return [];
    const dayBase = startDate.startOf('day');
    const now = dayjs();
    const isToday = dayBase.isSame(now, 'day');
    return QUICK_TIME_SLOTS.filter((slot) => {
      const parsed = dayjs(slot, 'h:mm A');
      const candidate = dayBase.hour(parsed.hour()).minute(parsed.minute()).second(0);
      const startMins = candidate.hour() * 60 + candidate.minute();
      if (startMins < 6 * 60 || startMins > LATEST_START_MINUTES) return false;
      if (!isDurationWithinWorkHours(candidate, durationHours)) return false;
      if (isToday && candidate.isBefore(now.add(30, 'minute'))) return false;
      return true;
    });
  }, [startDate, durationHours]);

  const displayedTimes =
    showAllTimes || availableQuickTimes.length <= 12
      ? availableQuickTimes
      : availableQuickTimes.slice(0, 12);

  const maxDurationHours = startTime ? maxAllowedDurationHours(startTime) : 6;
  const chipBorder = isDarkMode ? colors.border : '#E2E8F0';
  const chipBg = isDarkMode ? colors.card : '#fff';

  return (
    <View>
      {activeStep === 'schedule' ? (
        <View>
          <DribbbleDateTimePicker
            compact
            mode={preference === 'Short term' ? 'range' : 'single'}
            hideTimeSelection
            maxRangeDays={preference === 'Short term' ? 14 : undefined}
            maxDate={preference === 'Monthly' ? maxDate90Days.toDate() : undefined}
            minDate={today.startOf('day').toDate()}
            value={
              preference === 'Short term'
                ? { startDate: startDate?.toDate(), endDate: endDate?.toDate() }
                : startDate?.toDate()
            }
            onDateChange={(payload: Date | { startDate: Date; endDate?: Date }) => {
              markScheduleTouched();
              if (preference === 'Short term' && payload && typeof payload === 'object' && 'startDate' in payload) {
                const start = dayjs(payload.startDate).startOf('day');
                const end = payload.endDate ? dayjs(payload.endDate).startOf('day') : null;
                setStartDate(start);
                setEndDate(end);
              } else {
                const start = dayjs(payload as Date).startOf('day');
                setStartDate(start);
                setEndDate(start.add(1, 'month'));
              }
              setStartTime(null);
              setEndTime(null);
              setValidationMsg(null);
            }}
          />

          <View style={[styles.section, { borderColor: chipBorder, backgroundColor: isDarkMode ? colors.surface : '#F8FAFC' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('modifyBooking.duration.title')}
            </Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
              {preference === 'Short term'
                ? t('modifyBooking.duration.shortTermHint')
                : t('modifyBooking.duration.monthlyHint')}
            </Text>
            <View style={styles.chipRow}>
              {DURATION_OPTIONS.map((h) => {
                const disabled = !datesComplete || (Boolean(startTime) && h > maxDurationHours);
                const active = durationHours === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.durationChip,
                      {
                        borderColor: active ? BRAND.accent : chipBorder,
                        backgroundColor: active ? BRAND.accent : chipBg,
                      },
                      disabled && styles.chipDisabled,
                    ]}
                    disabled={disabled}
                    onPress={() => setDurationHours(h)}
                  >
                    <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700', fontSize: 13 }}>
                      {t('modifyBooking.duration.hours', { count: h })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.section, { borderColor: chipBorder, backgroundColor: isDarkMode ? colors.surface : '#F8FAFC' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('modifyBooking.timeSelection.selectNewTime')}
            </Text>
            {!datesComplete ? (
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {t('modifyBooking.validation.selectDatesFirst')}
              </Text>
            ) : displayedTimes.length === 0 ? (
              <Text style={[styles.hint, { color: colors.warning }]}>
                {t('modifyBooking.validation.noTimeSlots')}
              </Text>
            ) : (
              <View style={styles.timeGrid}>
                {displayedTimes.map((slot) => {
                  const selected = startTime?.format('h:mm A') === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeChip,
                        {
                          borderColor: selected ? BRAND.accent : chipBorder,
                          backgroundColor: selected ? BRAND.accent : chipBg,
                        },
                      ]}
                      onPress={() => applyQuickTime(slot)}
                    >
                      <Text style={{ color: selected ? '#fff' : colors.text, fontSize: 12, fontWeight: '600' }}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {startTime ? (
              <View style={styles.selectedSummary}>
                <Icon name="schedule" size={16} color="#15803D" />
                <Text style={styles.selectedSummaryText}>
                  {timeSummary} · {t('modifyBooking.duration.hours', { count: durationHours })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.reviewWrap}>
          <Text style={[styles.reviewHeading, { color: colors.text }]}>{t('modifyBooking.review.title')}</Text>
          <View style={[styles.reviewCard, { backgroundColor: isDarkMode ? colors.surface : '#F1F5F9' }]}>
            <Text style={styles.reviewLabel}>{t('modifyBooking.review.current')}</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>
              {originalScheduleRef.current?.dateSummary}
            </Text>
            <Text style={{ color: colors.textSecondary }}>{originalScheduleRef.current?.timeSummary}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
              {t('modifyBooking.duration.hours', { count: originalScheduleRef.current?.durationHours ?? 1 })}
            </Text>
          </View>
          <View style={[styles.reviewCard, styles.reviewCardNew, { borderColor: BRAND.accent }]}>
            <Text style={[styles.reviewLabel, { color: BRAND.accent }]}>{t('modifyBooking.review.new')}</Text>
            <Text style={[styles.reviewValue, { color: colors.text }]}>{dateSummary}</Text>
            <Text style={{ color: colors.textSecondary }}>{timeSummary}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
              {t('modifyBooking.duration.hours', { count: durationHours })}
            </Text>
          </View>
          {isChecking ? (
            <View style={styles.checkingRow}>
              <ActivityIndicator color={BRAND.accent} size="small" />
              <Text style={{ color: colors.textSecondary, marginLeft: 8 }}>
                {t('modifyBooking.review.checking')}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {validationMsg ? (
        <View style={styles.validationBox}>
          <Text style={styles.validationText}>{validationMsg}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: '30%',
    alignItems: 'center',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 10,
  },
  selectedSummaryText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  reviewWrap: {
    gap: 10,
  },
  reviewHeading: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewCard: {
    borderRadius: 12,
    padding: 12,
  },
  reviewCardNew: {
    borderWidth: 2,
    backgroundColor: '#EFF6FF',
  },
  reviewLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#64748B',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  checkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  validationBox: {
    marginTop: 10,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  validationText: {
    color: '#92400E',
    fontSize: 13,
  },
});

ModifyBookingScheduleSection.displayName = 'ModifyBookingScheduleSection';

export default ModifyBookingScheduleSection;
