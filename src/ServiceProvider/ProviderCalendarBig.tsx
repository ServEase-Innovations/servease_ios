/* eslint-disable */
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import moment from "moment";
import PaymentInstance from "../services/paymentInstance";
import { getServiceTitle } from "../common/BookingUtils";
import { BRAND, HOME_M3 } from "../theme/brandColors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_HORIZONTAL = 20;
const CARD_PADDING = 12;
const CALENDAR_WIDTH = SCREEN_WIDTH - CONTENT_HORIZONTAL * 2 - CARD_PADDING * 2;
const DAY_CELL_SIZE = Math.floor((CALENDAR_WIDTH - 8) / 7);

interface CalendarEntry {
  id: number;
  provider_id: number;
  engagement_id?: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  start_epoch?: number | null;
  end_epoch?: number | null;
  slot_start_epoch?: number | null;
  slot_end_epoch?: number | null;
  status: string;
}

const STATUS_COLORS = {
  BOOKED: { dot: HOME_M3.secondary, bg: "rgba(51,91,175,0.14)", gradient: [HOME_M3.primary, HOME_M3.secondary] as const },
  QUEUE_STANDBY: { dot: "#14b8a6", bg: "rgba(20,184,166,0.14)", gradient: ["#0f766e", "#14b8a6"] as const },
  AVAILABLE: { dot: "#10b981", bg: "rgba(16,185,129,0.14)", gradient: ["#10b981", "#059669"] as const },
  UNAVAILABLE: { dot: "#64748b", bg: "rgba(100,116,139,0.14)", gradient: ["#64748b", "#475569"] as const },
  VACATION: { dot: "#f59e0b", bg: "rgba(245,158,11,0.14)", gradient: ["#f59e0b", "#d97706"] as const },
  FREE: { dot: BRAND.bookingSky, bg: "rgba(79,143,247,0.14)", gradient: [BRAND.accent, BRAND.bookingSky] as const },
  DEFAULT: { dot: BRAND.bookingSky, bg: "rgba(79,143,247,0.14)", gradient: [BRAND.accent, BRAND.bookingSky] as const },
};

function normalizeTime(value: string | null | undefined): string {
  if (!value) return "00:00";
  const parts = String(value).trim().split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return "00:00";
}

function buildEventTitle(status: string, engagementId?: number): string {
  switch (status) {
    case "BOOKED":
      return `Booked #${engagementId ?? "?"}`;
    case "QUEUE_STANDBY":
      return `Backup queue #${engagementId ?? "?"}`;
    case "VACATION":
      return `Vacation #${engagementId ?? "?"}`;
    case "FREE":
      return "Free / open";
    case "AVAILABLE":
      return "Available";
    case "UNAVAILABLE":
      return "Unavailable";
    default:
      return status || "Scheduled";
  }
}

function mapCalendarEntryToEvent(entry: CalendarEntry): Event | null {
  if (!entry?.date) return null;

  const dayPart = moment(entry.date).isValid()
    ? moment(entry.date).format("YYYY-MM-DD")
    : String(entry.date).slice(0, 10);
  if (!dayPart || dayPart === "Invalid date") return null;

  const startEpoch = entry.start_epoch ?? entry.slot_start_epoch;
  const endEpoch = entry.end_epoch ?? entry.slot_end_epoch;
  let start: Date;
  let end: Date;

  if (startEpoch != null && Number.isFinite(Number(startEpoch))) {
    start = moment.unix(Number(startEpoch)).toDate();
    end =
      endEpoch != null && Number.isFinite(Number(endEpoch))
        ? moment.unix(Number(endEpoch)).toDate()
        : moment(start).add(1, "hour").toDate();
  } else {
    const [sh, sm] = normalizeTime(entry.start_time).split(":").map(Number);
    const [eh, em] = normalizeTime(entry.end_time).split(":").map(Number);
    start = moment(dayPart, "YYYY-MM-DD").hours(sh).minutes(sm).seconds(0).toDate();
    end = moment(dayPart, "YYYY-MM-DD").hours(eh).minutes(em).seconds(0).toDate();
    if (!moment(end).isAfter(start)) {
      end = moment(start).add(1, "hour").toDate();
    }
  }

  const status = String(entry.status || "").toUpperCase();

  return {
    id: entry.id,
    engagement_id: entry.engagement_id,
    title: buildEventTitle(status, entry.engagement_id),
    start,
    end,
    status,
  };
}

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: string;
  engagement_id?: number;
}

interface EngagementMeta {
  customerName: string;
  serviceType: string;
  mobileno: string | null;
}

const AVATAR_COLORS = ["#3b82f6", "#6366f1", "#0ea5e9", "#8b5cf6"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "CU";
}

function getAccentColor(status: string): string {
  switch (String(status).toUpperCase()) {
    case "BOOKED":
      return HOME_M3.primary;
    case "QUEUE_STANDBY":
      return "#14b8a6";
    case "AVAILABLE":
      return "#10b981";
    case "UNAVAILABLE":
      return "#64748b";
    case "VACATION":
      return "#f59e0b";
    default:
      return HOME_M3.secondary;
  }
}

function findNextAvailableSlot(events: Event[], afterDate: string): Event | null {
  const after = moment(afterDate, "YYYY-MM-DD").endOf("day");
  return (
    events
      .filter((event) => ["AVAILABLE", "FREE"].includes(event.status))
      .filter((event) => moment(event.start).isAfter(after))
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null
  );
}

function buildEngagementMap(payload: Record<string, unknown>): Record<number, EngagementMeta> {
  const map: Record<number, EngagementMeta> = {};
  const buckets = ["current", "upcoming", "past"] as const;
  buckets.forEach((key) => {
    const rows = payload[key];
    if (!Array.isArray(rows)) return;
    rows.forEach((row: Record<string, unknown>) => {
      const id = Number(row.engagement_id);
      if (!Number.isFinite(id) || id < 1) return;
      const customerName =
        [row.firstname, row.lastname].filter(Boolean).join(" ").trim() || "Customer";
      map[id] = {
        customerName,
        serviceType: String(row.service_type || row.serviceType || ""),
        mobileno: row.mobileno ? String(row.mobileno) : null,
      };
    });
  });
  return map;
}

interface MarkedDate {
  selected?: boolean;
  marked?: boolean;
  dotColor?: string;
  customStyles?: {
    container?: object;
    text?: object;
  };
}

function getStatusPalette(status: string) {
  const key = String(status || "").toUpperCase() as keyof typeof STATUS_COLORS;
  return STATUS_COLORS[key] ?? STATUS_COLORS.DEFAULT;
}

const calendarTheme = {
  backgroundColor: HOME_M3.surfaceContainerLowest,
  calendarBackground: HOME_M3.surfaceContainerLowest,
  textSectionTitleColor: HOME_M3.onSurfaceVariant,
  selectedDayBackgroundColor: HOME_M3.secondary,
  selectedDayTextColor: HOME_M3.onPrimary,
  todayTextColor: HOME_M3.secondary,
  dayTextColor: HOME_M3.onSurface,
  textDisabledColor: HOME_M3.outlineVariant,
  dotColor: HOME_M3.secondary,
  selectedDotColor: HOME_M3.onPrimary,
  arrowColor: HOME_M3.secondary,
  monthTextColor: HOME_M3.onSurface,
  textDayFontWeight: "500" as const,
  textMonthFontWeight: "700" as const,
  textDayHeaderFontWeight: "600" as const,
  textDayFontSize: 15,
  textMonthFontSize: 0,
  textDayHeaderFontSize: 12,
  "stylesheet.calendar.main": {
    container: {
      paddingLeft: 0,
      paddingRight: 0,
    },
    week: {
      marginTop: 2,
      marginBottom: 2,
      flexDirection: "row",
      justifyContent: "flex-start",
      width: CALENDAR_WIDTH,
    },
  },
  "stylesheet.calendar.header": {
    header: {
      height: 0,
      overflow: "hidden",
    },
    week: {
      marginTop: 4,
      marginBottom: 8,
      flexDirection: "row",
      justifyContent: "flex-start",
      width: CALENDAR_WIDTH,
    },
    dayHeader: {
      marginTop: 0,
      marginBottom: 0,
      width: DAY_CELL_SIZE,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "600",
      color: HOME_M3.onSurfaceVariant,
    },
  },
  "stylesheet.day.basic": {
    base: {
      width: DAY_CELL_SIZE,
      height: DAY_CELL_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
    text: {
      marginTop: Platform.OS === "ios" ? 4 : 2,
      fontSize: 15,
      fontWeight: "500",
      color: HOME_M3.onSurface,
      textAlign: "center",
    },
  },
  "stylesheet.day.period": {
    base: {
      width: DAY_CELL_SIZE,
      height: DAY_CELL_SIZE,
      alignItems: "center",
      justifyContent: "center",
    },
  },
};

export default function ProviderCalendarBig({
  providerId,
  refreshToken = 0,
}: {
  providerId: number;
  refreshToken?: number;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [markedDates, setMarkedDates] = useState<Record<string, MarkedDate>>({});
  const [engagementMap, setEngagementMap] = useState<Record<number, EngagementMeta>>({});

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const month = moment(currentDate).format("YYYY-MM");
        const res = await PaymentInstance.get(
          `/api/service-providers/${providerId}/calendar?month=${month}`
        );

        const entries: CalendarEntry[] = res.data.calendar || [];
        const evts = entries
          .map(mapCalendarEntryToEvent)
          .filter((event): event is Event => event != null);

        setEvents(evts);
        updateMarkedDates(evts, selectedDate);
      } catch (err) {
        console.error("Error fetching calendar", err);
        Alert.alert("Error", "Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    };

    void fetchCalendar();
  }, [providerId, currentDate, refreshToken]);

  useEffect(() => {
    const month = moment(currentDate).format("YYYY-MM");
    let cancelled = false;
    PaymentInstance.get(`/api/service-providers/${providerId}/engagements?month=${month}`)
      .then((res) => {
        if (cancelled) return;
        setEngagementMap(buildEngagementMap(res.data ?? {}));
      })
      .catch(() => {
        if (!cancelled) setEngagementMap({});
      });
    return () => {
      cancelled = true;
    };
  }, [providerId, currentDate, refreshToken]);

  useEffect(() => {
    if (events.length > 0) {
      updateMarkedDates(events, selectedDate);
    }
  }, [selectedDate, events]);

  const updateMarkedDates = (evts: Event[], activeDate: string) => {
    const marked: Record<string, MarkedDate> = {};
    const priority: Record<string, number> = {
      BOOKED: 5,
      QUEUE_STANDBY: 4,
      VACATION: 3,
      UNAVAILABLE: 2,
      AVAILABLE: 1,
      FREE: 0,
    };

    evts.forEach((event) => {
      const dateKey = moment(event.start).format("YYYY-MM-DD");
      const palette = getStatusPalette(event.status);
      const existing = marked[dateKey];

      if (!existing) {
        marked[dateKey] = {
          marked: true,
          dotColor: palette.dot,
          customStyles: {
            container: {
              backgroundColor: "transparent",
              borderRadius: DAY_CELL_SIZE / 2,
              width: DAY_CELL_SIZE,
              height: DAY_CELL_SIZE,
              alignItems: "center",
              justifyContent: "center",
            },
          },
        };
        return;
      }

      const existingPriority = priority[
        Object.keys(STATUS_COLORS).find((k) => STATUS_COLORS[k as keyof typeof STATUS_COLORS].dot === existing.dotColor) ?? "DEFAULT"
      ] ?? 0;
      const nextPriority = priority[event.status] ?? 0;
      if (nextPriority >= existingPriority) {
        marked[dateKey] = {
          ...existing,
          dotColor: palette.dot,
        };
      }
    });

    Object.keys(marked).forEach((dateKey) => {
      marked[dateKey].customStyles = {
        container: {
          backgroundColor:
            dateKey === activeDate ? "rgba(51,91,175,0.16)" : "transparent",
          borderRadius: DAY_CELL_SIZE / 2,
          width: DAY_CELL_SIZE,
          height: DAY_CELL_SIZE,
          alignItems: "center",
          justifyContent: "center",
        },
        text: {
          color: dateKey === activeDate ? HOME_M3.secondary : HOME_M3.onSurface,
          fontWeight: dateKey === activeDate ? "700" : "500",
        },
      };
      if (dateKey === activeDate) {
        marked[dateKey].selected = true;
      }
    });

    if (!marked[activeDate]) {
      marked[activeDate] = {
        selected: true,
        customStyles: {
          container: {
            backgroundColor: "rgba(51,91,175,0.16)",
            borderRadius: DAY_CELL_SIZE / 2,
            width: DAY_CELL_SIZE,
            height: DAY_CELL_SIZE,
            alignItems: "center",
            justifyContent: "center",
          },
          text: {
            color: HOME_M3.secondary,
            fontWeight: "700",
          },
        },
      };
    }

    setMarkedDates(marked);
  };

  const dailyEvents = useMemo(
    () =>
      events
        .filter((event) => moment(event.start).format("YYYY-MM-DD") === selectedDate)
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, selectedDate]
  );

  const bookedDayCount = useMemo(
    () =>
      dailyEvents.filter((event) =>
        ["BOOKED", "QUEUE_STANDBY", "VACATION"].includes(event.status)
      ).length,
    [dailyEvents]
  );

  const nextAvailableSlot = useMemo(
    () => findNextAvailableSlot(events, selectedDate),
    [events, selectedDate]
  );

  const handleChatPress = (mobileno: string | null | undefined) => {
    if (!mobileno) {
      Alert.alert("Contact unavailable", "No phone number is available for this customer.");
      return;
    }
    const url = Platform.OS === "ios" ? `sms:${mobileno}` : `sms:${mobileno}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Unable to open messages", "Please contact the customer from your phone app.");
    });
  };

  const handleDateSelect = (date: DateData) => {
    setSelectedDate(date.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentDate(moment(month.dateString, "YYYY-MM-DD").toDate());
  };

  const shiftMonth = (delta: number) => {
    setCurrentDate((prev) => moment(prev).add(delta, "month").toDate());
  };

  const goToToday = () => {
    const today = moment();
    setCurrentDate(today.toDate());
    setSelectedDate(today.format("YYYY-MM-DD"));
  };

  const handleEventPress = (event: Event) => {
    const timeRange = `${formatTime(event.start)} - ${formatTime(event.end)}`;
    const message =
      event.status === "BOOKED"
        ? `This time slot is BOOKED\nEngagement #${event.engagement_id}\nTime: ${timeRange}`
        : event.status === "QUEUE_STANDBY"
          ? `You are backup in the queue for this booking\nEngagement #${event.engagement_id}\nTime: ${timeRange}`
          : event.status === "VACATION"
            ? `Customer vacation for this booking\nEngagement #${event.engagement_id}\nTime: ${timeRange}`
            : event.status === "FREE"
              ? `This time slot is FREE\nTime: ${timeRange}`
              : event.status === "AVAILABLE"
                ? `This time slot is AVAILABLE\nTime: ${timeRange}\nYou can book this slot.`
                : `This time slot is UNAVAILABLE\nTime: ${timeRange}\nPlease select another time.`;

    Alert.alert(
      event.status === "BOOKED"
        ? "Booked Slot"
        : event.status === "QUEUE_STANDBY"
          ? "Backup queue"
          : event.status === "VACATION"
            ? "Vacation"
            : event.status === "FREE"
              ? "Free slot"
              : event.status === "AVAILABLE"
                ? "Available Slot"
                : "Unavailable Slot",
      message,
      [{ text: "OK", style: "default" }]
    );
  };

  const formatTime = (date: Date) => moment(date).format("h:mm A");

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "BOOKED":
        return "Booked";
      case "QUEUE_STANDBY":
        return "Backup queue";
      case "AVAILABLE":
        return "Available";
      case "UNAVAILABLE":
        return "Unavailable";
      case "VACATION":
        return "Vacation";
      case "FREE":
        return "Free";
      default:
        return status;
    }
  };

  const monthLabel = moment(currentDate).format("MMMM YYYY");

  return (
    <View style={styles.container}>
      <View style={styles.monthNavCard}>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => shiftMonth(-1)}
          accessibilityLabel="Previous month"
        >
          <Icon name="chevron-left" size={22} color={HOME_M3.secondary} />
        </TouchableOpacity>

        <View style={styles.monthNavCenter}>
          <Text style={styles.monthNavLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={goToToday} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.todayLink}>Today</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={() => shiftMonth(1)}
          accessibilityLabel="Next month"
        >
          <Icon name="chevron-right" size={22} color={HOME_M3.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.calendarCard}>
        {loading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color={HOME_M3.secondary} />
            <Text style={styles.inlineLoadingText}>Loading {monthLabel}...</Text>
          </View>
        ) : null}

        <Calendar
          key={monthLabel}
          current={moment(currentDate).format("YYYY-MM-DD")}
          calendarWidth={CALENDAR_WIDTH}
          onDayPress={handleDateSelect}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          markingType="custom"
          hideArrows
          hideExtraDays
          enableSwipeMonths
          renderHeader={() => <View style={styles.hiddenCalendarHeader} />}
          theme={calendarTheme}
          style={styles.calendar}
        />
      </View>

      <View style={styles.legendCard}>
        {(
          [
            { key: "AVAILABLE", label: "Available" },
            { key: "BOOKED", label: "Booked" },
            { key: "QUEUE_STANDBY", label: "Backup queue" },
            { key: "UNAVAILABLE", label: "Unavailable" },
          ] as const
        ).map((item) => {
          const palette = getStatusPalette(item.key);
          return (
            <View key={item.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: palette.dot }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.eventsSection}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsTitle}>
            {moment(selectedDate).format("MMMM D, YYYY")}
          </Text>
          {bookedDayCount > 0 ? (
            <View style={styles.bookingBadge}>
              <Text style={styles.bookingBadgeText}>
                {bookedDayCount} Booking{bookedDayCount !== 1 ? "s" : ""}
              </Text>
            </View>
          ) : dailyEvents.length > 0 ? (
            <View style={styles.bookingBadgeMuted}>
              <Text style={styles.bookingBadgeMutedText}>
                {dailyEvents.length} slot{dailyEvents.length !== 1 ? "s" : ""}
              </Text>
            </View>
          ) : null}
        </View>

        {dailyEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-blank-outline" size={40} color={HOME_M3.outlineVariant} />
            <Text style={styles.noEvents}>No events scheduled</Text>
            <Text style={styles.noEventsSubtext}>Pick another date or check your availability</Text>
          </View>
        ) : (
          dailyEvents.map((event, index) => {
            const meta =
              event.engagement_id != null ? engagementMap[event.engagement_id] : undefined;
            const isBookingSlot = ["BOOKED", "QUEUE_STANDBY", "VACATION"].includes(event.status);
            const serviceTitle = meta?.serviceType
              ? getServiceTitle(meta.serviceType)
              : getStatusLabel(event.status);
            const customerName = meta?.customerName ?? "Customer";
            const bookingRef =
              event.engagement_id != null
                ? `${getStatusLabel(event.status)} #${event.engagement_id}`
                : getStatusLabel(event.status);

            return (
              <View key={event.id} style={styles.slotCard}>
                <View
                  style={[styles.slotAccent, { backgroundColor: getAccentColor(event.status) }]}
                />
                <View style={styles.slotBody}>
                  <View style={styles.slotTopRow}>
                    <View style={styles.slotTopText}>
                      <Text style={styles.slotTime}>
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </Text>
                      <Text style={styles.slotServiceTitle}>{serviceTitle}</Text>
                      <Text style={styles.slotBookingRef}>{bookingRef}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.slotCalendarBtn}
                      onPress={() => handleEventPress(event)}
                      accessibilityLabel="Slot details"
                    >
                      <Icon name="calendar-check" size={18} color={HOME_M3.secondary} />
                    </TouchableOpacity>
                  </View>

                  {isBookingSlot ? (
                    <View style={styles.slotCustomerRow}>
                      <View
                        style={[
                          styles.slotAvatar,
                          { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                        ]}
                      >
                        <Text style={styles.slotAvatarText}>{getInitials(customerName)}</Text>
                      </View>
                      <View style={styles.slotCustomerInfo}>
                        <Text style={styles.slotCustomerName}>{customerName}</Text>
                        {meta?.mobileno ? (
                          <Text style={styles.slotCustomerMeta}>{meta.mobileno}</Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.slotActions}>
                    <TouchableOpacity
                      style={styles.slotDetailsBtn}
                      onPress={() => handleEventPress(event)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.slotDetailsText}>View Details</Text>
                      <Icon name="chevron-right" size={18} color="#ffffff" />
                    </TouchableOpacity>
                    {isBookingSlot ? (
                      <TouchableOpacity
                        style={styles.slotChatBtn}
                        onPress={() => handleChatPress(meta?.mobileno)}
                        accessibilityLabel="Message customer"
                      >
                        <Icon name="message-outline" size={20} color={HOME_M3.secondary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })
        )}

        {nextAvailableSlot ? (
          <View style={styles.nextSlotBanner}>
            <View style={styles.nextSlotIconWrap}>
              <Icon name="lightbulb-on-outline" size={18} color="#ffffff" />
            </View>
            <View style={styles.nextSlotTextWrap}>
              <Text style={styles.nextSlotTitle}>Next available slot</Text>
              <Text style={styles.nextSlotSubtitle}>
                {moment(nextAvailableSlot.start).calendar(null, {
                  sameDay: "[Today at] h:mm A",
                  nextDay: "[Tomorrow,] MMMM D [at] h:mm A",
                  nextWeek: "dddd, MMMM D [at] h:mm A",
                  sameElse: "MMMM D, YYYY [at] h:mm A",
                })}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: 8,
  },
  monthNavCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 12,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HOME_M3.surfaceContainerLow,
  },
  monthNavCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  monthNavLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: HOME_M3.onSurface,
    letterSpacing: -0.2,
  },
  todayLink: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: HOME_M3.secondary,
  },
  calendarCard: {
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    paddingVertical: CARD_PADDING,
    paddingHorizontal: CARD_PADDING,
    marginBottom: 12,
    alignItems: "center",
    overflow: "hidden",
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 8,
  },
  inlineLoadingText: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
    fontWeight: "500",
  },
  hiddenCalendarHeader: {
    height: 0,
    overflow: "hidden",
  },
  calendar: {
    width: CALENDAR_WIDTH,
    backgroundColor: HOME_M3.surfaceContainerLowest,
  },
  legendCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    rowGap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: "42%",
    justifyContent: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: HOME_M3.onSurfaceVariant,
    fontWeight: "600",
  },
  eventsSection: {
    marginBottom: 16,
  },
  eventsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  eventsTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: HOME_M3.onSurface,
    letterSpacing: -0.3,
  },
  bookingBadge: {
    backgroundColor: HOME_M3.secondary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bookingBadgeText: {
    color: HOME_M3.onPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  bookingBadgeMuted: {
    backgroundColor: HOME_M3.surfaceContainerLow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bookingBadgeMutedText: {
    color: HOME_M3.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
  },
  noEvents: {
    fontSize: 15,
    fontWeight: "700",
    color: HOME_M3.onSurfaceVariant,
    marginTop: 12,
    marginBottom: 4,
  },
  noEventsSubtext: {
    fontSize: 13,
    color: HOME_M3.outline,
    textAlign: "center",
  },
  slotCard: {
    flexDirection: "row",
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  slotAccent: {
    width: 5,
  },
  slotBody: {
    flex: 1,
    padding: 14,
  },
  slotTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  slotTopText: {
    flex: 1,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: "600",
    color: HOME_M3.secondary,
    marginBottom: 4,
  },
  slotServiceTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: HOME_M3.onSurface,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  slotBookingRef: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
    fontWeight: "500",
  },
  slotCalendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HOME_M3.surfaceContainerLow,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
  },
  slotCustomerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    paddingTop: 2,
  },
  slotAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  slotAvatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  slotCustomerInfo: {
    flex: 1,
  },
  slotCustomerName: {
    fontSize: 15,
    fontWeight: "700",
    color: HOME_M3.onSurface,
    marginBottom: 2,
  },
  slotCustomerMeta: {
    fontSize: 12,
    color: HOME_M3.onSurfaceVariant,
  },
  slotActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  slotDetailsBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: HOME_M3.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 16,
  },
  slotDetailsText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  slotChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: HOME_M3.secondary,
  },
  nextSlotBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: HOME_M3.secondaryFixed,
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },
  nextSlotIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: HOME_M3.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  nextSlotTextWrap: {
    flex: 1,
  },
  nextSlotTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: HOME_M3.onSurface,
    marginBottom: 2,
  },
  nextSlotSubtitle: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
    lineHeight: 18,
  },
});
