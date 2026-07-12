import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import dayjs, { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import LinearGradient from "react-native-linear-gradient";
import PaymentInstance from "../services/paymentInstance";
import { useTheme } from "../Settings/ThemeContext";
import DribbbleDateTimePicker from "../common/DribbbleDateTimePicker";
import { getServiceTitle } from "../common/BookingUtils";
import { coalesceEndEpoch, coalesceStartEpoch } from "../services/bookingEpoch";
import { countInclusiveDays, toCalendarDay } from "../utils/inclusiveDayCount";
import ConfirmationDialog from "./ConfirmationDialog";
import { BrandButton } from "../design-system/BrandButton";
import { HOME_HERO_GRADIENT, HOME_M3 } from "../theme/brandColors";

const MIN_VACATION_DAYS = 10;
const VACATION_MODIFICATION_PENALTY = 400;
const HORIZONTAL_GUTTER = 16;

interface VacationBooking {
  id: number;
  startDate?: string;
  endDate?: string;
  start_epoch?: number | null;
  end_epoch?: number | null;
  service_type?: string;
  serviceType?: string;
  bookingType?: string;
  vacation?: {
    start_date?: string;
    end_date?: string;
    leave_days?: number;
  };
  vacationDetails?: {
    start_date?: string;
    end_date?: string;
    leave_start_date?: string;
    leave_end_date?: string;
    total_days?: number;
  };
  hasVacation?: boolean;
}

interface VacationManagementDialogProps {
  open: boolean;
  onClose: () => void;
  booking: VacationBooking | null;
  customerId: number | null;
  onSuccess: (message?: string) => void;
}

function resolveVacation(booking: VacationBooking | null) {
  if (!booking) return null;
  if (booking.vacation?.start_date && booking.vacation?.end_date) {
    return booking.vacation;
  }
  const details = booking.vacationDetails;
  const start = details?.start_date || details?.leave_start_date;
  const end = details?.end_date || details?.leave_end_date;
  if (!start || !end) return null;
  return {
    start_date: start,
    end_date: end,
    leave_days: details?.total_days,
  };
}

const VacationManagementDialog: React.FC<VacationManagementDialogProps> = ({
  open,
  onClose,
  booking,
  customerId,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { colors, fontSize } = useTheme();
  const today = useMemo(() => dayjs().startOf("day"), []);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [minDate, setMinDate] = useState<Dayjs | null>(null);
  const [maxDate, setMaxDate] = useState<Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const vacation = resolveVacation(booking);

  const bookingStart = useMemo(() => {
    if (!booking) return null;
    const epoch = coalesceStartEpoch(booking.start_epoch, booking.startDate);
    if (epoch != null) return dayjs.unix(epoch).startOf("day");
    return booking.startDate ? toCalendarDay(booking.startDate) : null;
  }, [booking]);

  const bookingEnd = useMemo(() => {
    if (!booking) return null;
    const epoch = coalesceEndEpoch(booking.end_epoch, booking.endDate);
    if (epoch != null) return dayjs.unix(epoch).startOf("day");
    return booking.endDate ? toCalendarDay(booking.endDate) : null;
  }, [booking]);

  const totalDays =
    startDate && endDate ? countInclusiveDays(startDate, endDate) : 0;

  const earliestEndDate = startDate
    ? startDate.add(MIN_VACATION_DAYS - 1, "day")
    : null;

  const startDateKey = startDate?.format("YYYY-MM-DD") ?? "";
  const endDateKey = endDate?.format("YYYY-MM-DD") ?? "";
  const bookingId = booking?.id ?? null;
  const vacationStartKey = vacation?.start_date ?? "";
  const vacationEndKey = vacation?.end_date ?? "";
  const bookingStartKey = bookingStart?.format("YYYY-MM-DD") ?? "";
  const bookingEndKey = bookingEnd?.format("YYYY-MM-DD") ?? "";

  const pickerRangeValue = useMemo(
    () => ({
      startDate: startDate?.toDate(),
      endDate: endDate?.toDate(),
    }),
    [startDateKey, endDateKey, startDate, endDate]
  );

  const pickerMinDate = useMemo(() => minDate?.toDate(), [minDate]);
  const pickerMaxDate = useMemo(() => maxDate?.toDate(), [maxDate]);

  const isAddMode = !vacation?.start_date || !vacation?.end_date;

  const vacationDatesChanged = useMemo(() => {
    if (isAddMode || !startDate || !endDate || !vacationStartKey || !vacationEndKey) {
      return false;
    }
    const prevStart = toCalendarDay(vacationStartKey);
    const prevEnd = toCalendarDay(vacationEndKey);
    if (!prevStart || !prevEnd) return false;
    return !startDate.isSame(prevStart, "day") || !endDate.isSame(prevEnd, "day");
  }, [isAddMode, startDate, endDate, vacationStartKey, vacationEndKey]);

  const isValidVacationPeriod = (): boolean => {
    if (!startDate || !endDate || !minDate || !maxDate) return false;
    if (startDate.isBefore(minDate, "day") || endDate.isAfter(maxDate, "day")) return false;
    return totalDays >= MIN_VACATION_DAYS;
  };

  useEffect(() => {
    if (!open || bookingId == null) return;

    const startBound = bookingStartKey ? toCalendarDay(bookingStartKey) : null;
    const endBound = bookingEndKey ? toCalendarDay(bookingEndKey) : null;
    const effectiveMin =
      startBound && startBound.isBefore(today) ? today : startBound ?? today;

    setMinDate((prev) => (prev?.isSame(effectiveMin, "day") ? prev : effectiveMin));
    setMaxDate((prev) => {
      const next = endBound ?? null;
      if (prev === null && next === null) return prev;
      if (prev && next && prev.isSame(next, "day")) return prev;
      if (prev && next === null) return null;
      return next;
    });

    if (vacationStartKey && vacationEndKey) {
      const nextStart = toCalendarDay(vacationStartKey);
      const nextEnd = toCalendarDay(vacationEndKey);
      setStartDate((prev) =>
        prev && nextStart && prev.isSame(nextStart, "day") ? prev : nextStart
      );
      setEndDate((prev) =>
        prev && nextEnd && prev.isSame(nextEnd, "day") ? prev : nextEnd
      );
    } else {
      setStartDate((prev) => (prev === null ? prev : null));
      setEndDate((prev) => (prev === null ? prev : null));
    }

    setError(null);
    setSuccess(null);
    setShowConfirm(false);
  }, [
    open,
    bookingId,
    bookingStartKey,
    bookingEndKey,
    today,
    vacationEndKey,
    vacationStartKey,
  ]);

  const handleRangeChange = useCallback((start: Date, end?: Date) => {
    const nextStart = toCalendarDay(start);
    const nextEnd = end ? toCalendarDay(end) : null;
    setStartDate((prev) =>
      prev && nextStart && prev.isSame(nextStart, "day") ? prev : nextStart
    );
    setEndDate((prev) => {
      if (prev === null && nextEnd === null) return prev;
      if (prev && nextEnd && prev.isSame(nextEnd, "day")) return prev;
      return nextEnd;
    });
    setError(null);
  }, []);

  const validateVacationForm = (): boolean => {
    if (!startDate || !endDate || !booking?.id) {
      setError(t("vacationManagement.validation.selectBothDates"));
      return false;
    }
    if (startDate.isBefore(today, "day")) {
      setError(t("vacationManagement.validation.startDatePast"));
      return false;
    }
    if (endDate.isBefore(startDate, "day")) {
      setError(t("vacationManagement.validation.endDateBeforeStart"));
      return false;
    }
    if (!isValidVacationPeriod()) {
      setError(t("vacationManagement.validation.minimumVacationDays"));
      return false;
    }
    setError(null);
    return true;
  };

  const submitVacation = async () => {
    if (!startDate || !endDate || !booking || !customerId) return;

    const successMessage = isAddMode
      ? t("vacationManagement.vacationSubmittedSuccess")
      : t("vacationManagement.vacationUpdated");

    setIsLoading(true);
    setError(null);

    try {
      const res = await PaymentInstance.post(
        `api/v2/createEngagements/${booking.id}/vacation`,
        {
          customerid: customerId,
          vacation_start_date: startDate.format("YYYY-MM-DD"),
          vacation_end_date: endDate.format("YYYY-MM-DD"),
          leave_type: "VACATION",
          modified_by_id: customerId,
          modified_by_role: "CUSTOMER",
        }
      );

      const penalty = Number(res.data?.penalty ?? 0);
      let message = successMessage;
      if (penalty > 0) {
        message += t("vacationManagement.penaltyCharged", {
          amount: penalty.toFixed(0),
        });
      }

      setSuccess(message);
      setShowConfirm(false);
      setTimeout(() => {
        onSuccess(message);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error saving vacation:", err);
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message;
      setError(apiMessage || t("vacationManagement.updateFailed"));
      setShowConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVacation = () => {
    if (!validateVacationForm() || !customerId) return;

    if (!isAddMode && vacationDatesChanged) {
      setShowConfirm(true);
      return;
    }

    void submitVacation();
  };

  const handleCancelVacation = async () => {
    if (!booking || !customerId) return;

    setIsLoading(true);
    setError(null);

    try {
      await PaymentInstance.post(
        `api/v2/createEngagements/${booking.id}/vacation/cancel`,
        {
          customerid: customerId,
          modified_by_id: customerId,
          modified_by_role: "CUSTOMER",
        }
      );

      const message = t("vacationManagement.cancelSuccess");
      setSuccess(message);
      setTimeout(() => {
        onSuccess(message);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error canceling vacation:", err);
      const apiMessage = err?.response?.data?.error || err?.response?.data?.message;
      setError(apiMessage || t("vacationManagement.cancelError"));
    } finally {
      setIsLoading(false);
    }
  };

  const titleSize =
    fontSize === "small" ? 18 : fontSize === "large" ? 22 : 20;
  const bodySize =
    fontSize === "small" ? 12 : fontSize === "large" ? 15 : 13;
  const headerTitle = isAddMode
    ? t("vacationManagement.applyVacationHoliday")
    : t("vacationManagement.modifyVacation");

  if (!open) return null;

  const serviceType = booking?.service_type || booking?.serviceType || "";

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={styles.sheet}>
          <View style={styles.headerShell}>
            <LinearGradient
              colors={[...HOME_HERO_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.headerToolbar}>
              <TouchableOpacity
                style={styles.headerSideBtn}
                onPress={onClose}
                disabled={isLoading}
                accessibilityLabel={t("common.close")}
                hitSlop={10}
              >
                <Icon name="x" size={20} color="#ffffff" />
              </TouchableOpacity>
              <Text
                style={[
                  styles.headerTitleCenter,
                  { fontSize: titleSize },
                  Platform.OS === "android" ? { includeFontPadding: false } : null,
                ]}
                numberOfLines={1}
              >
                {headerTitle}
              </Text>
              <View style={styles.headerSideBtn} />
            </View>
          </View>

          <View style={styles.body}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isAddMode && booking && bookingStart && bookingEnd ? (
              <View style={[styles.infoCard, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
                <Text style={[styles.infoCardTitle, { color: colors.info, fontSize: bodySize + 1 }]}>
                  {t("vacationManagement.bookedPeriod")}
                </Text>
                <View style={styles.chipRow}>
                  <View style={[styles.chip, { borderColor: colors.info }]}>
                    <Text style={[styles.chipText, { color: colors.info }]}>#{booking.id}</Text>
                  </View>
                  {serviceType ? (
                    <View style={[styles.chip, styles.chipFilled, { backgroundColor: colors.info }]}>
                      <Text style={[styles.chipText, { color: "#fff" }]}>
                        {getServiceTitle(serviceType)}
                      </Text>
                    </View>
                  ) : null}
                  {booking.bookingType ? (
                    <View style={[styles.chip, { borderColor: colors.info }]}>
                      <Text style={[styles.chipText, { color: colors.info }]}>
                        {booking.bookingType}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: bodySize }}>
                  {bookingStart.format("MMM D, YYYY")} {t("vacationManagement.to")}{" "}
                  {bookingEnd.format("MMM D, YYYY")}
                </Text>
              </View>
            ) : null}

            {!isAddMode && vacation ? (
              <View style={[styles.infoCard, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
                <Text style={[styles.infoCardTitle, { color: colors.info, fontSize: bodySize + 1 }]}>
                  {t("vacationManagement.currentVacation")}
                </Text>
                <View style={styles.chipRow}>
                  <View style={[styles.chip, { borderColor: colors.info }]}>
                    <Text style={[styles.chipText, { color: colors.info }]}>
                      {dayjs(vacation.start_date).format("MMM D, YYYY")}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: bodySize }}>
                    {t("vacationManagement.to")}
                  </Text>
                  <View style={[styles.chip, { borderColor: colors.info }]}>
                    <Text style={[styles.chipText, { color: colors.info }]}>
                      {dayjs(vacation.end_date).format("MMM D, YYYY")}
                    </Text>
                  </View>
                  {vacation.leave_days != null ? (
                    <View style={[styles.chip, styles.chipFilled, { backgroundColor: colors.info }]}>
                      <Text style={[styles.chipText, { color: "#fff" }]}>
                        {vacation.leave_days} {t("vacationManagement.days")}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.alert, { backgroundColor: colors.errorLight }]}>
                <Text style={{ color: colors.error, fontSize: bodySize }}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={[styles.alert, { backgroundColor: colors.successLight }]}>
                <Text style={{ color: colors.success, fontSize: bodySize }}>{success}</Text>
              </View>
            ) : null}

            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: titleSize - 2 }]}>
              {isAddMode
                ? t("vacationManagement.selectVacationDates")
                : t("vacationManagement.updateVacationDates")}
            </Text>
            <Text style={[styles.helperText, { color: colors.textSecondary, fontSize: bodySize }]}>
              {t("vacationManagement.minimumVacationNote")}{" "}
              {earliestEndDate && startDate ? (
                <Text style={{ fontWeight: "700" }}>
                  {earliestEndDate.format("MMM D, YYYY")}
                </Text>
              ) : (
                <Text style={{ fontWeight: "700" }}>
                  {MIN_VACATION_DAYS} {t("vacationManagement.days")}
                </Text>
              )}
            </Text>

            {minDate && maxDate ? (
              <View style={[styles.pickerShell, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <DribbbleDateTimePicker
                  mode="range"
                  hideTimeSelection
                  minRangeDays={MIN_VACATION_DAYS}
                  minDate={pickerMinDate}
                  maxDate={pickerMaxDate}
                  value={pickerRangeValue}
                  onDateChange={({ startDate: rangeStart, endDate: rangeEnd }) => {
                    handleRangeChange(rangeStart, rangeEnd);
                  }}
                  onChange={({ startDate: rangeStart, endDate: rangeEnd }) => {
                    handleRangeChange(rangeStart, rangeEnd);
                  }}
                />
              </View>
            ) : null}

            {startDate ? (
              <View style={[styles.dateSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontSize: bodySize, marginBottom: 6 }}>
                  <Text style={{ fontWeight: "700" }}>{t("vacationManagement.dateInformation")}:</Text>
                </Text>
                <View style={styles.dateSummaryRow}>
                  <Text style={{ color: colors.text, fontSize: bodySize }}>
                    {t("vacationManagement.start")}:{" "}
                    <Text style={{ fontWeight: "700" }}>{startDate.format("MMM D, YYYY")}</Text>
                  </Text>
                  {endDate ? (
                    <Text style={{ color: colors.text, fontSize: bodySize }}>
                      {t("vacationManagement.end")}:{" "}
                      <Text style={{ fontWeight: "700" }}>{endDate.format("MMM D, YYYY")}</Text>
                    </Text>
                  ) : null}
                  {totalDays > 0 ? (
                    <Text
                      style={{
                        color: totalDays >= MIN_VACATION_DAYS ? colors.primary : colors.error,
                        fontSize: bodySize,
                        fontWeight: "600",
                      }}
                    >
                      {t("vacationManagement.totalDaysLabel")}: {totalDays}
                      {totalDays < MIN_VACATION_DAYS
                        ? ` (${t("vacationManagement.minimumDaysRequired")})`
                        : ""}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            <View style={[styles.policyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.policyTitle, { color: colors.text, fontSize: bodySize + 1 }]}>
                {t("vacationManagement.vacationPolicy")}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: bodySize, lineHeight: bodySize * 1.5 }}>
                • {t("vacationManagement.minimumVacationPeriod")}:{" "}
                <Text style={{ fontWeight: "700" }}>10 {t("vacationManagement.days")}</Text>
                {"\n"}• {t("vacationManagement.vacationPauseMessage")}
                {!isAddMode ? (
                  <>
                    {"\n"}• {t("vacationManagement.penaltyMessage", {
                      fee: VACATION_MODIFICATION_PENALTY,
                    })}
                  </>
                ) : null}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {isAddMode ? (
              <BrandButton
                variant="ghost"
                onPress={onClose}
                disabled={isLoading}
                style={styles.footerBtn}
              >
                {t("common.cancel")}
              </BrandButton>
            ) : (
              <BrandButton
                variant="outline"
                onPress={handleCancelVacation}
                disabled={isLoading}
                loading={isLoading}
                style={styles.footerBtn}
                textStyle={{ color: colors.error }}
              >
                {t("vacationManagement.cancelVacation")}
              </BrandButton>
            )}
            <TouchableOpacity
              style={[
                styles.themePrimaryBtn,
                styles.footerBtn,
                (isLoading || !startDate || !endDate || !isValidVacationPeriod()) &&
                  styles.themePrimaryBtnDisabled,
              ]}
              onPress={handleSaveVacation}
              disabled={isLoading || !startDate || !endDate || !isValidVacationPeriod()}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.themePrimaryBtnText}>
                  {isAddMode
                    ? t("vacationManagement.applyVacationAction")
                    : t("vacationManagement.updateVacation")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </View>

      <ConfirmationDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => void submitVacation()}
        title={t("vacationManagement.confirmVacationUpdate")}
        message={t("vacationManagement.confirmVacationUpdateMessage", {
          start: startDate?.format("MMMM D, YYYY") ?? "",
          end: endDate?.format("MMMM D, YYYY") ?? "",
          days: String(totalDays),
          fee: String(VACATION_MODIFICATION_PENALTY),
        })}
        confirmText={t("vacationManagement.confirmUpdate")}
        cancelText={t("common.cancel")}
        loading={isLoading}
        severity="warning"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    backgroundColor: HOME_M3.surfaceContainerLowest,
  },
  headerShell: {
    position: "relative",
    backgroundColor: HOME_M3.primary,
    height: 60,
    justifyContent: "center",
    overflow: "hidden",
  },
  headerToolbar: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    paddingHorizontal: 8,
  },
  headerSideBtn: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  headerTitleCenter: {
    flex: 1,
    textAlign: "center",
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  body: {
    flexShrink: 1,
    backgroundColor: HOME_M3.surfaceContainerLowest,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  infoCardTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipFilled: {
    borderWidth: 0,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  alert: {
    padding: 12,
    borderRadius: 10,
  },
  sectionTitle: {
    fontWeight: "700",
    marginTop: 4,
  },
  helperText: {
    lineHeight: 20,
    marginBottom: 4,
  },
  pickerShell: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignSelf: "center",
    width: "100%",
    maxWidth: 380,
  },
  dateSummary: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateSummaryRow: {
    gap: 8,
  },
  policyCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  policyTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: HOME_M3.outlineVariant,
    backgroundColor: HOME_M3.surfaceContainerLowest,
  },
  footerBtn: {
    flex: 1,
    minWidth: 0,
  },
  themePrimaryBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: HOME_M3.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themePrimaryBtnDisabled: {
    backgroundColor: "#cbd5e1",
  },
  themePrimaryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },
});

export default VacationManagementDialog;
