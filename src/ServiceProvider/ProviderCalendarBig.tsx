/* eslint-disable */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import moment from "moment";
import PaymentInstance from "../services/paymentInstance";
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";

const { width, height } = Dimensions.get("window");

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

interface MarkedDate {
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
  dotColor?: string;
  customStyles?: {
    container?: object;
    text?: object;
  };
}

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
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [markedDates, setMarkedDates] = useState({});

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
        updateMarkedDates(evts);
      } catch (err) {
        console.error("Error fetching calendar", err);
        Alert.alert("Error", "Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, [providerId, currentDate, refreshToken]);

  useEffect(() => {
    if (events.length > 0) {
      updateMarkedDates(events);
    }
  }, [selectedDate]);

  const updateMarkedDates = (evts: Event[]) => {
    const marked: { [key: string]: MarkedDate } = {};

    evts.forEach((event) => {
      const dateKey = moment(event.start).format("YYYY-MM-DD");
      
      let dotColor = "#3b82f6"; // default blue
      let backgroundColor = "rgba(59,130,246,0.1)";
      if (event.status === "BOOKED") {
        dotColor = "#8b5cf6"; // purple for booked
        backgroundColor = "rgba(139,92,246,0.1)";
      } else if (event.status === "QUEUE_STANDBY") {
        dotColor = "#14b8a6"; // teal for backup queue
        backgroundColor = "rgba(20,184,166,0.12)";
      } else if (event.status === "AVAILABLE") {
        dotColor = "#10b981"; // green for available
        backgroundColor = "rgba(16,185,129,0.1)";
      } else if (event.status === "UNAVAILABLE") {
        dotColor = "#64748b"; // slate gray for unavailable
        backgroundColor = "rgba(100,116,139,0.1)";
      } else if (event.status === "VACATION") {
        dotColor = "#f59e0b";
        backgroundColor = "rgba(245,158,11,0.12)";
      } else if (event.status === "FREE") {
        dotColor = "#3b82f6";
        backgroundColor = "rgba(59,130,246,0.1)";
      }

      if (marked[dateKey]) {
        const existing = marked[dateKey];
        if (event.status === "BOOKED" || existing.dotColor === "#8b5cf6") {
          marked[dateKey].dotColor = "#5660ee";
          marked[dateKey].selectedColor = "#122475";
        } else if (event.status === "QUEUE_STANDBY" || existing.dotColor === "#14b8a6") {
          marked[dateKey].dotColor = "#14b8a6";
          marked[dateKey].selectedColor = "#0f766e";
        } else if (event.status === "AVAILABLE" || existing.dotColor === "#10b981") {
          marked[dateKey].dotColor = "#10b981";
          marked[dateKey].selectedColor = "#10b981";
        }
      } else {
        marked[dateKey] = {
          marked: true,
          dotColor,
          selectedColor: dotColor,
          customStyles: {
            container: {
              backgroundColor: dateKey === selectedDate ? backgroundColor : "transparent",
              borderRadius: 8,
            },
          },
        };
      }
    });

    // Add selected date styling
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].customStyles = {
        container: {
          backgroundColor: "rgba(59,130,246,0.15)",
          borderRadius: 8,
        },
      };
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: "#3b82f6",
        customStyles: {
          container: {
            backgroundColor: "rgba(59,130,246,0.15)",
            borderRadius: 8,
          },
        },
      };
    }

    setMarkedDates(marked);
  };

  const getEventsForSelectedDate = () => {
    return events.filter((event) => {
      const eventDate = moment(event.start).format("YYYY-MM-DD");
      return eventDate === selectedDate;
    });
  };

  const handleDateSelect = (date: { dateString: string }) => {
    setSelectedDate(date.dateString);
  };

  const handleMonthChange = (month: { dateString: string }) => {
    const newDate = moment(month.dateString, "YYYY-MM-DD").toDate();
    setCurrentDate(newDate);
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

  const getStatusColor = (status: string): { bg: string; text: string; icon: string; gradientStart: string; gradientEnd: string } => {
    switch (status) {
      case "BOOKED":
        return { 
          bg: "#717fff", 
          text: "#ffffff", 
          icon: "calendar-clock",
          gradientStart: "#00115c",
          gradientEnd: "#5f8aff"
        };
      case "QUEUE_STANDBY":
        return {
          bg: "#14b8a6",
          text: "#ffffff",
          icon: "account-clock",
          gradientStart: "#0f766e",
          gradientEnd: "#14b8a6",
        };
      case "AVAILABLE":
        return { 
          bg: "#10b981", 
          text: "#ffffff", 
          icon: "calendar-check",
          gradientStart: "#10b981",
          gradientEnd: "#059669"
        };
      case "UNAVAILABLE":
        return { 
          bg: "#64748b", 
          text: "#ffffff", 
          icon: "calendar-remove",
          gradientStart: "#64748b",
          gradientEnd: "#475569"
        };
      case "VACATION":
        return {
          bg: "#f59e0b",
          text: "#ffffff",
          icon: "beach",
          gradientStart: "#f59e0b",
          gradientEnd: "#d97706",
        };
      case "FREE":
        return {
          bg: "#3b82f6",
          text: "#ffffff",
          icon: "calendar-blank",
          gradientStart: "#3b82f6",
          gradientEnd: "#2563eb",
        };
      default:
        return { 
          bg: "#3b82f6", 
          text: "#ffffff", 
          icon: "calendar",
          gradientStart: "#3b82f6",
          gradientEnd: "#2563eb"
        };
    }
  };

  const formatTime = (date: Date) => {
    return moment(date).format("h:mm A");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "BOOKED": return "Booked";
      case "QUEUE_STANDBY": return "Backup queue";
      case "AVAILABLE": return "Available";
      case "UNAVAILABLE": return "Unavailable";
      case "VACATION": return "Vacation";
      case "FREE": return "Free";
      default: return status;
    }
  };

  const monthLabel = moment(currentDate).format("MMMM YYYY");
  const dailyEvents = getEventsForSelectedDate();

  return (
    <View style={styles.container}>
      {/* Calendar Header with Gradient */}
      <LinearGradient
        colors={[...BOOKING_HEADER_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.calendarHeader}
      >
        <View style={styles.headerContent}>
          <Icon name="calendar-month" size={22} color="#ffffff" />
          <Text style={styles.headerTitle}>Service Calendar</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          View your schedule and availability
        </Text>

        <View style={styles.monthNavRow}>
          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => shiftMonth(-1)}
            accessibilityLabel="Previous month"
          >
            <Icon name="chevron-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.monthNavCenter}>
            <Text style={styles.monthNavLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={goToToday}>
              <Text style={styles.todayLink}>Today</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.monthNavButton}
            onPress={() => shiftMonth(1)}
            accessibilityLabel="Next month"
          >
            <Icon name="chevron-right" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.inlineLoadingText}>Loading {monthLabel}...</Text>
        </View>
      ) : null}

      <Calendar
        key={monthLabel}
        current={moment(currentDate).format("YYYY-MM-DD")}
        onDayPress={handleDateSelect}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        markingType="custom"
        hideArrows
        hideExtraDays
        enableSwipeMonths
        renderHeader={() => <View style={styles.hiddenCalendarHeader} />}
        theme={{
          selectedDayBackgroundColor: "#3b82f6",
          todayTextColor: "#3b82f6",
          arrowColor: "#3b82f6",
          monthTextColor: "#1e293b",
          textMonthFontWeight: "700",
          textMonthFontSize: 16,
          textDayHeaderFontWeight: "600",
          textDayHeaderFontSize: 13,
          textDayFontSize: 14,
        }}
        style={styles.calendar}
      />

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <LinearGradient colors={["#10b981", "#059669"]} style={styles.legendDot} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <LinearGradient colors={["#8b5cf6", "#7c3aed"]} style={styles.legendDot} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
        <View style={styles.legendItem}>
          <LinearGradient colors={["#14b8a6", "#0f766e"]} style={styles.legendDot} />
          <Text style={styles.legendText}>Backup queue</Text>
        </View>
        <View style={styles.legendItem}>
          <LinearGradient colors={["#64748b", "#475569"]} style={styles.legendDot} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
      
      {/* Events List */}
      <View style={styles.eventsContainer}>
        <View style={styles.eventsHeader}>
          <LinearGradient colors={["#3b82f6", "#2563eb"]} style={styles.eventsHeaderIcon}>
            <Icon name="clock-outline" size={18} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.eventsTitle}>
            {moment(selectedDate).format("MMMM D, YYYY")}
          </Text>
        </View>
        
        <ScrollView 
          style={styles.eventsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.eventsListContent}
        >
          {dailyEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-blank" size={48} color="#cbd5e1" />
              <Text style={styles.noEvents}>No events scheduled</Text>
              <Text style={styles.noEventsSubtext}>
                This date has no time slots configured
              </Text>
            </View>
          ) : (
            dailyEvents.map((event) => {
              const statusColors = getStatusColor(event.status);
              return (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[statusColors.gradientStart, statusColors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.eventItem}
                  >
                    <View style={styles.eventTimeContainer}>
                      <Icon name="clock-outline" size={14} color="rgba(255,255,255,0.85)" />
                      <Text style={styles.eventTime}>
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <View style={styles.eventIconContainer}>
                        <Icon name={statusColors.icon} size={20} color="#ffffff" />
                      </View>
                      <View style={styles.eventDetails}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View style={styles.eventStatusBadge}>
                          <Text style={styles.eventStatus}>
                            {getStatusLabel(event.status)}
                          </Text>
                        </View>
                      </View>
                      <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Status Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <LinearGradient colors={["#10b981", "#059669"]} style={styles.summaryDot} />
          <Text style={styles.summaryLabel}>Available</Text>
          <Text style={styles.summaryCount}>
            {events.filter(e => e.status === "AVAILABLE").length}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <LinearGradient colors={["#8b5cf6", "#7c3aed"]} style={styles.summaryDot} />
          <Text style={styles.summaryLabel}>Booked</Text>
          <Text style={styles.summaryCount}>
            {events.filter(e => e.status === "BOOKED").length}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <LinearGradient colors={["#64748b", "#475569"]} style={styles.summaryDot} />
          <Text style={styles.summaryLabel}>Unavailable</Text>
          <Text style={styles.summaryCount}>
            {events.filter(e => e.status === "UNAVAILABLE").length}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  calendarHeader: {
    paddingTop: Platform.OS === "ios" ? 12 : 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  monthNavCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  monthNavLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  todayLink: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    textDecorationLine: "underline",
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    marginHorizontal: 12,
  },
  inlineLoadingText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  hiddenCalendarHeader: {
    height: 0,
    overflow: "hidden",
  },
  calendar: {
    backgroundColor: "#ffffff",
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 12,
    marginHorizontal: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  eventsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  eventsHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noEvents: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
    marginBottom: 4,
  },
  noEventsSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  eventItem: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    padding: 14,
  },
  eventTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  eventTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  eventDetails: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  eventStatusBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  eventStatus: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  summaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  summaryCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
  },
});