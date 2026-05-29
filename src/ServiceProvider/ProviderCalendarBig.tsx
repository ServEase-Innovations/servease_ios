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
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "UNAVAILABLE";
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
      try {
        const month = moment(currentDate).format("YYYY-MM");
        const res = await PaymentInstance.get(
          `/api/service-providers/${providerId}/calendar?month=${month}`
        );

        const entries: CalendarEntry[] = res.data.calendar || [];
        const evts = entries.map((e) => {
          const baseDate = new Date(e.date);
          const [sh, sm] = e.start_time.split(":").map(Number);
          const [eh, em] = e.end_time.split(":").map(Number);

          const start = new Date(baseDate);
          start.setHours(sh, sm, 0);

          const end = new Date(baseDate);
          end.setHours(eh, em, 0);

          return {
            id: e.id,
            engagement_id: e.engagement_id,
            title:
              e.status === "BOOKED"
                ? `Booked #${e.engagement_id}`
                : e.status === "AVAILABLE"
                ? "Available"
                : "Unavailable",
            start,
            end,
            status: e.status,
          };
        });

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

  const updateMarkedDates = (evts: Event[]) => {
    const marked: { [key: string]: MarkedDate } = {};

    evts.forEach((event) => {
      const dateKey = moment(event.start).format("YYYY-MM-DD");
      
      let dotColor = "#3b82f6"; // default blue
      let backgroundColor = "rgba(59,130,246,0.1)";
      if (event.status === "BOOKED") {
        dotColor = "#8b5cf6"; // purple for booked
        backgroundColor = "rgba(139,92,246,0.1)";
      } else if (event.status === "AVAILABLE") {
        dotColor = "#10b981"; // green for available
        backgroundColor = "rgba(16,185,129,0.1)";
      } else if (event.status === "UNAVAILABLE") {
        dotColor = "#64748b"; // slate gray for unavailable
        backgroundColor = "rgba(100,116,139,0.1)";
      }

      if (marked[dateKey]) {
        const existing = marked[dateKey];
        if (event.status === "BOOKED" || existing.dotColor === "#8b5cf6") {
          marked[dateKey].dotColor = "#5660ee";
          marked[dateKey].selectedColor = "#122475";
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
    const newDate = new Date(month.dateString);
    setCurrentDate(newDate);
  };

  const handleEventPress = (event: Event) => {
    const message =
      event.status === "BOOKED"
        ? `This time slot is BOOKED\nEngagement #${event.engagement_id}\nTime: ${formatTime(event.start)} - ${formatTime(event.end)}`
        : event.status === "AVAILABLE"
        ? `This time slot is AVAILABLE\nTime: ${formatTime(event.start)} - ${formatTime(event.end)}\nYou can book this slot.`
        : `This time slot is UNAVAILABLE\nTime: ${formatTime(event.start)} - ${formatTime(event.end)}\nPlease select another time.`;
    
    Alert.alert(
      event.status === "BOOKED" ? "Booked Slot" : event.status === "AVAILABLE" ? "Available Slot" : "Unavailable Slot",
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
      case "AVAILABLE": return "Available";
      case "UNAVAILABLE": return "Unavailable";
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

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
      </LinearGradient>

      {/* Calendar Component */}
      <Calendar
        current={currentDate.toISOString()}
        onDayPress={handleDateSelect}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        markingType="custom"
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
          "stylesheet.calendar.header": {
            week: {
              marginTop: 8,
              flexDirection: "row",
              justifyContent: "space-around",
            },
          },
        } as any}
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