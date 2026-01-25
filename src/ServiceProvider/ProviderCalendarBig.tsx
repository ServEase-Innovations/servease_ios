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
} from "react-native";
import { Calendar } from "react-native-calendars";
import moment from "moment";
import axios from "axios";
import PaymentInstance from "../services/paymentInstance";

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
}: {
  providerId: number;
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
          const [sh, sm, ss] = e.start_time.split(":").map(Number);
          const [eh, em, es] = e.end_time.split(":").map(Number);

          const start = new Date(baseDate);
          start.setHours(sh, sm, ss);

          const end = new Date(baseDate);
          end.setHours(eh, em, es);

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
  }, [providerId, currentDate]);

  const updateMarkedDates = (evts: Event[]) => {
    const marked: { [key: string]: MarkedDate } = {};

    evts.forEach((event) => {
      const dateKey = moment(event.start).format("YYYY-MM-DD");
      
      let dotColor = "#3174ad"; // default blue
      if (event.status === "BOOKED") dotColor = "#e74c3c"; // red
      else if (event.status === "AVAILABLE") dotColor = "#2ecc71"; // green
      else if (event.status === "UNAVAILABLE") dotColor = "#95a5a6"; // gray

      if (marked[dateKey]) {
        // If multiple events on same date, use the most prominent status
        const existing = marked[dateKey];
        if (event.status === "BOOKED" || existing.dotColor === "#e74c3c") {
          marked[dateKey].dotColor = "#e74c3c";
        } else if (event.status === "AVAILABLE" || existing.dotColor === "#2ecc71") {
          marked[dateKey].dotColor = "#2ecc71";
        }
      } else {
        marked[dateKey] = {
          marked: true,
          dotColor,
          customStyles: {
            container: {
              backgroundColor: dateKey === selectedDate ? "#f0f0f0" : "transparent",
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
          backgroundColor: "#f0f0f0",
          borderRadius: 5,
        },
      };
    } else {
      marked[selectedDate] = {
        selected: true,
        customStyles: {
          container: {
            backgroundColor: "#f0f0f0",
            borderRadius: 5,
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
        ? `This slot is BOOKED (Engagement #${event.engagement_id})`
        : `This slot is ${event.status}`;
    
    Alert.alert("Event Details", message);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BOOKED":
        return "#e74c3c";
      case "AVAILABLE":
        return "#2ecc71";
      case "UNAVAILABLE":
        return "#95a5a6";
      default:
        return "#3174ad";
    }
  };

  const formatTime = (date: Date) => {
    return moment(date).format("HH:mm");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3174ad" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  const dailyEvents = getEventsForSelectedDate();

  return (
    <View style={styles.container}>
      <Calendar
        current={currentDate.toISOString()}
        onDayPress={handleDateSelect}
        onMonthChange={handleMonthChange}
        markedDates={markedDates}
        markingType="custom"
        theme={{
          selectedDayBackgroundColor: "#3174ad",
          todayTextColor: "#3174ad",
          arrowColor: "#3174ad",
          monthTextColor: "#3174ad",
          textMonthFontWeight: "bold",
        }}
        style={styles.calendar}
      />
      
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>
          Events for {moment(selectedDate).format("MMMM D, YYYY")}
        </Text>
        
        <ScrollView style={styles.eventsList}>
          {dailyEvents.length === 0 ? (
            <Text style={styles.noEvents}>No events for this date</Text>
          ) : (
            dailyEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventItem,
                  { backgroundColor: getStatusColor(event.status) },
                ]}
                onPress={() => handleEventPress(event)}
              >
                <Text style={styles.eventTime}>
                  {formatTime(event.start)} - {formatTime(event.end)}
                </Text>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventStatus}>{event.status}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  calendar: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  eventsContainer: {
    flex: 1,
    padding: 15,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  eventsList: {
    flex: 1,
  },
  noEvents: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  eventItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  eventTime: {
    fontSize: 14,
    color: "white",
    opacity: 0.9,
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 3,
  },
  eventStatus: {
    fontSize: 12,
    color: "white",
    opacity: 0.8,
    textTransform: "uppercase",
  },
});