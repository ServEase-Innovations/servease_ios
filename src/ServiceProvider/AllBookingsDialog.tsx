/* eslint-disable */
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  DimensionValue,
  Linking,
  ActivityIndicator,
  Platform
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from "./../common/BookingUtils";
import PaymentInstance from "../services/paymentInstance";
import dayjs, { Dayjs } from "dayjs";
import { Booking, BookingHistoryResponse } from "./Dashboard";
import axios from "axios";
import { OtpVerificationDialog } from "./OtpVerificationDialog";
import TrackAddress from "./TrackAddress";

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk';

interface AllBookingsDialogProps {
  bookings: BookingHistoryResponse | null;
  serviceProviderId: number | null;
  trigger?: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  onContactClient: (booking: Booking) => void;
}

// Function to format time string to AM/PM format
const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch (error) {
    return timeString;
  }
};

// Function to handle calling customer
const handleCallCustomer = (phoneNumber: string, clientName: string) => {
  if (!phoneNumber || phoneNumber === "Contact info not available") {
    Alert.alert("No Contact Info", "Contact information is not available for this customer.");
    return;
  }
  
  const telLink = `tel:${phoneNumber}`;
  Linking.openURL(telLink).catch(() => {
    Alert.alert("Error", "Unable to make the call. Please try again.");
  });
};

export function AllBookingsDialog({ 
  bookings, 
  serviceProviderId, 
  trigger, 
  visible, 
  onClose, 
  onContactClient 
}: AllBookingsDialogProps) {
  const [tab, setTab] = useState<"ongoing" | "future" | "past">("ongoing");
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalBookings, setTotalBookings] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const [taskStatus, setTaskStatus] = useState<Record<string, "IN_PROGRESS" | "COMPLETED" | undefined>>({});
  const [taskStatusUpdating, setTaskStatusUpdating] = useState<Record<string, boolean>>({});
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [trackAddressDialogOpen, setTrackAddressDialogOpen] = useState(false);
  const [selectedBookingForTrack, setSelectedBookingForTrack] = useState<any>(null);

  const mapApiBookingToBooking = (apiBooking: any): Booking => {
    let date, timeRange;
    
    if (apiBooking.start_epoch && apiBooking.end_epoch) {
      const startDate = new Date(apiBooking.start_epoch * 1000);
      const endDate = new Date(apiBooking.end_epoch * 1000);
      
      const formattedDate = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      
      timeRange = `${startDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })} - ${endDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })}`;
      
      date = formattedDate;
    } else {
      const startDateRaw = apiBooking.startDate || apiBooking.start_date;
      const startTimeStr = apiBooking.startTime || "00:00";
      const endTimeStr = apiBooking.endTime || "00:00";

      const startDate = new Date(startDateRaw);
      const endDate = new Date(startDateRaw);

      const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
      const [endHours, endMinutes] = endTimeStr.split(":").map(Number);

      startDate.setHours(startHours, startMinutes);
      endDate.setHours(endHours, endMinutes);

      timeRange = formatTimeToAMPM(apiBooking.startTime) + " - " + formatTimeToAMPM(apiBooking.endTime);
      
      date = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }

    const clientName = apiBooking.firstname && apiBooking.lastname 
      ? `${apiBooking.firstname} ${apiBooking.lastname}`.trim()
      : apiBooking.firstname 
        ? apiBooking.firstname
        : apiBooking.email || "Client";

    const bookingId = apiBooking.engagement_id || apiBooking.id;

    const amount = apiBooking.base_amount ? 
      `₹${parseFloat(apiBooking.base_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
      "₹0";

    const responsibilities = apiBooking.responsibilities || {};

    return {
      id: Number(apiBooking.engagement_id || apiBooking.id),
      serviceProviderId: Number(apiBooking.serviceproviderid || apiBooking.serviceProviderId),
      customerId: Number(apiBooking.customerid || apiBooking.customerId),
      start_date: apiBooking.start_date || apiBooking.startDate,
      endDate: apiBooking.end_date || apiBooking.endDate,
      engagements: "",
      timeslot: apiBooking.startTime && apiBooking.endTime ? 
                `${formatTimeToAMPM(apiBooking.startTime)} - ${formatTimeToAMPM(apiBooking.endTime)}` : 
                "",
      monthlyAmount: Number(apiBooking.base_amount || apiBooking.monthlyAmount || 0),
      paymentMode: "",
      booking_type: apiBooking.booking_type || apiBooking.bookingType || "",
      service_type: apiBooking.service_type || apiBooking.serviceType || "",
      bookingDate: apiBooking.created_at || apiBooking.bookingDate,
      responsibilities,
      housekeepingRole: null,
      mealType: null,
      noOfPersons: responsibilities.tasks?.[0]?.persons || null,
      experience: null,
      childAge: null,
      customerName: clientName,
      serviceProviderName: "",
      address: apiBooking.address || "",
      taskStatus: apiBooking.task_status || apiBooking.taskStatus || "",
      modifiedBy: "",
      modifiedDate: "",
      availableTimeSlots: null,
      customerHolidays: [],
      serviceProviderLeaves: [],
      active: true,
      clientName: clientName,
      service: apiBooking.service_type || apiBooking.serviceType || "",
      date: date,
      time: timeRange,
      location: apiBooking.address || "Address not available",
      status: apiBooking.task_status || apiBooking.taskStatus || "",
      amount: amount,
      bookingData: {
        ...apiBooking,
        mobileno: apiBooking.mobileno || "",
        contact: apiBooking.mobileno || "No contact info",
        today_service: apiBooking.today_service || null
      }
    };
  };

  const fetchBookingsByMonth = async (
    month: number,
    year: number
  ): Promise<BookingHistoryResponse> => {
    if (!serviceProviderId) {
      return { current: [], upcoming: [], past: [] };
    }

    try {
      setLoading(true);
      const formattedMonth = `${year}-${String(month).padStart(2, "0")}`;
      const res = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/engagements?month=${formattedMonth}`
      );

      return res.data;
    } catch (err) {
      console.error("Error fetching bookings:", err);
      Alert.alert("Error", "Failed to load bookings. Please try again.");
      return { current: [], upcoming: [], past: [] };
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchDataForTab = async (tab: "ongoing" | "future" | "past", monthDate: Dayjs) => {
    if (!serviceProviderId) return;

    try {
      setLoading(true);
      const month = monthDate.month() + 1;
      const year = monthDate.year();
      
      const apiResponse = await fetchBookingsByMonth(month, year);
      
      if (tab === "ongoing") {
        const currentBookings = apiResponse.current || [];
        setData(currentBookings.map(mapApiBookingToBooking));
        setTotalBookings(currentBookings.length);
      } else if (tab === "future") {
        const upcomingBookings = apiResponse.upcoming || [];
        setData(upcomingBookings.map(mapApiBookingToBooking));
        setTotalBookings(upcomingBookings.length);
      } else if (tab === "past") {
        const pastBookings = apiResponse.past || [];
        setData(pastBookings.map(mapApiBookingToBooking));
        setTotalBookings(pastBookings.length);
      }
    } catch (error) {
      console.error("Error fetching data for tab:", error);
      setData([]);
      setTotalBookings(0);
    }
  };

  const handleStartTask = async (bookingId: string, bookingData: any) => {
    if (!bookingId || !bookingData) return;

    const serviceDayId = bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Please contact support.");
      return;
    }

    const previousStatus = taskStatus[bookingId];

    setTaskStatus(prev => ({ ...prev, [bookingId]: "IN_PROGRESS" }));
    setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: true }));

    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/start`,
        {},
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      Alert.alert("Success", "Task started successfully!");
      await fetchDataForTab(tab, selectedMonth);
    } catch (err) {
      setTaskStatus(prev => ({ ...prev, [bookingId]: previousStatus }));
      
      let errorMessage = "Failed to start service. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleStopTask = async (bookingId: string, bookingData: any) => {
    setCurrentBooking({ bookingId, bookingData });
    setOtpDialogOpen(true);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!currentBooking) return;

    const serviceDayId = currentBooking.bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Please contact support.");
      return;
    }

    setVerifyingOtp(true);
    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/complete`,
        { otp },
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      Alert.alert("Success", "Task completed successfully!");
      setTaskStatus(prev => ({ ...prev, [currentBooking.bookingId]: "COMPLETED" }));
      await fetchDataForTab(tab, selectedMonth);
      
      return Promise.resolve();
    } catch (err) {
      let errorMessage = "Failed to complete service. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
      return Promise.reject(err);
    } finally {
      setVerifyingOtp(false);
      setOtpDialogOpen(false);
    }
  };

  const handleTrackAddress = (booking: any) => {
    setSelectedBookingForTrack(booking);
    setTrackAddressDialogOpen(true);
  };

  const handleTabChange = (newValue: "ongoing" | "future" | "past") => {
    const defaultMonth = dayjs().startOf('month');
    setSelectedMonth(defaultMonth);
    setTab(newValue);
  };

  useEffect(() => {
    if (!visible) return;
    setData([]);
    setTotalBookings(0);
    setSelectedMonth(dayjs().startOf('month'));
  }, [visible]);

  useEffect(() => {
    if (!visible || !selectedMonth) return;
    fetchDataForTab(tab, selectedMonth);
  }, [selectedMonth, tab, visible]);

  const getMonthName = (date: Dayjs) => date.format("MMMM YYYY");
  const handleMonthChange = (newDate: Dayjs) => setSelectedMonth(newDate);

  const MonthSelector = () => {
    const currentMonth = dayjs().startOf('month');
    
    const canGoPrev = () => {
      if (tab === "future") return selectedMonth.startOf('month').isAfter(currentMonth, 'month');
      return true;
    };

    const canGoNext = () => {
      if (tab === "past") return selectedMonth.startOf('month').isBefore(currentMonth, 'month');
      return true;
    };

    return (
      <View style={styles.monthSelector}>
        <TouchableOpacity 
          style={[styles.monthNavButton, !canGoPrev() && styles.monthNavButtonDisabled]}
          onPress={() => canGoPrev() && handleMonthChange(selectedMonth.subtract(1, 'month'))}
          disabled={!canGoPrev()}
        >
          <MaterialIcon name="chevron-left" size={20} color={!canGoPrev() ? "#94a3b8" : "#3b82f6"} />
        </TouchableOpacity>
        
        <Text style={styles.monthText}>{getMonthName(selectedMonth)}</Text>
        
        <TouchableOpacity 
          style={[styles.monthNavButton, !canGoNext() && styles.monthNavButtonDisabled]}
          onPress={() => canGoNext() && handleMonthChange(selectedMonth.add(1, 'month'))}
          disabled={!canGoNext()}
        >
          <MaterialIcon name="chevron-right" size={20} color={!canGoNext() ? "#94a3b8" : "#3b82f6"} />
        </TouchableOpacity>
      </View>
    );
  };

  const TabButton = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderBookingCard = (booking: Booking) => {
    const todayServiceStatus = booking.bookingData?.today_service?.status;
    const taskStatusOriginal = booking.taskStatus?.toUpperCase();
    
    const isInProgress = todayServiceStatus === 'IN_PROGRESS' || 
                         taskStatus[booking.id.toString()] === 'IN_PROGRESS' || 
                         taskStatusOriginal === 'IN_PROGRESS' || 
                         taskStatusOriginal === 'STARTED';
    
    const isCompleted = todayServiceStatus === 'COMPLETED' || taskStatusOriginal === 'COMPLETED';
    const isNotStarted = todayServiceStatus === 'SCHEDULED' || taskStatusOriginal === 'NOT_STARTED';
    const canStart = booking.bookingData?.today_service?.can_start === true;
    
    const showStartButton = isNotStarted && canStart;
    const showCompleteButton = isInProgress;
    const showCompletedButton = isCompleted;

    return (
      <View key={booking.id} style={styles.bookingCard}>
        <LinearGradient
          colors={["#1e3a5f", "#1e40af"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardGradientHeader}
        >
          <View style={styles.cardHeaderTop}>
            <View style={styles.bookingIdContainer}>
              <MaterialIcon name="receipt" size={14} color="#94a3b8" />
              <Text style={styles.bookingId}>ID: {booking.id}</Text>
            </View>
            <View style={styles.headerBadges}>
              {getBookingTypeBadge(booking.booking_type || "")}
              {getStatusBadge(booking.taskStatus || "")}
            </View>
          </View>
          <View style={styles.cardHeaderMain}>
            <View>
              <Text style={styles.clientName}>{booking.clientName}</Text>
              <Text style={styles.serviceType}>{getServiceTitle(booking.service)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcon name="event" size={16} color="#3b82f6" />
              <Text style={styles.infoText}>{booking.date}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcon name="schedule" size={16} color="#3b82f6" />
              <Text style={styles.infoText}>{booking.time}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcon name="currency-rupee" size={16} color="#3b82f6" />
              <Text style={styles.amountText}>{booking.amount}</Text>
            </View>
            {booking.bookingData?.mobileno && (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => handleCallCustomer(booking.bookingData.mobileno, booking.clientName)}
              >
                <MaterialIcon name="phone" size={16} color="#ffffff" />
                <Text style={styles.phoneButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.locationRow}>
            <MaterialIcon name="location-on" size={16} color="#3b82f6" />
            <Text style={styles.locationText} numberOfLines={2}>{booking.location}</Text>
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => handleTrackAddress(booking)}
            >
              <MaterialIcon name="navigation" size={14} color="#3b82f6" />
              <Text style={styles.trackButtonText}>Track</Text>
            </TouchableOpacity>
          </View>

          {todayServiceStatus && (
            <View style={styles.statusSection}>
              <Text style={styles.statusLabel}>Today's Status</Text>
              <View style={[styles.statusBadge, 
                todayServiceStatus === 'SCHEDULED' && styles.statusScheduled,
                todayServiceStatus === 'IN_PROGRESS' && styles.statusProgress,
                todayServiceStatus === 'COMPLETED' && styles.statusCompleted
              ]}>
                <Text style={styles.statusText}>{todayServiceStatus}</Text>
              </View>
            </View>
          )}

          <View style={styles.actionRow}>
            <Text style={styles.taskStatusLabel}>
              {isInProgress ? "⚡ In Progress" : isCompleted ? "✓ Completed" : isNotStarted ? "⏳ Not Started" : "📅 Upcoming"}
            </Text>
            <View style={styles.actionButtons}>
              {taskStatusUpdating[booking.id.toString()] ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : showCompleteButton ? (
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => handleStopTask(booking.id.toString(), booking.bookingData)}
                >
                  <MaterialIcon name="check-circle" size={16} color="#ffffff" />
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
              ) : showCompletedButton ? (
                <View style={styles.completedBadge}>
                  <MaterialIcon name="done-all" size={14} color="#10b981" />
                  <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
              ) : showStartButton ? (
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => handleStartTask(booking.id.toString(), booking.bookingData)}
                >
                  <MaterialIcon name="play-arrow" size={16} color="#ffffff" />
                  <Text style={styles.startButtonText}>Start</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.disabledBadge}>
                  <MaterialIcon name="lock" size={14} color="#94a3b8" />
                  <Text style={styles.disabledBadgeText}>Not Ready</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getEmptyStateMessage = () => {
    const monthName = getMonthName(selectedMonth);
    if (tab === "ongoing") return `No ongoing bookings for ${monthName}`;
    if (tab === "future") return `No upcoming bookings for ${monthName}`;
    return `No past bookings for ${monthName}`;
  };

  return (
    <>
      {trigger && <TouchableWithoutFeedback onPress={() => {}}><View>{trigger}</View></TouchableWithoutFeedback>}

      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#1e3a5f", "#1e40af", "#1e3a5f"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>All Bookings</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialIcon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.tabsContainer}>
              <TabButton 
                label={`Ongoing (${tab === "ongoing" ? totalBookings : 0})`}
                isActive={tab === "ongoing"}
                onPress={() => handleTabChange("ongoing")}
              />
              <TabButton 
                label={`Upcoming (${tab === "future" ? totalBookings : 0})`}
                isActive={tab === "future"}
                onPress={() => handleTabChange("future")}
              />
              <TabButton 
                label={`Past (${tab === "past" ? totalBookings : 0})`}
                isActive={tab === "past"}
                onPress={() => handleTabChange("past")}
              />
            </View>

            <View style={styles.monthInfoContainer}>
              <MonthSelector />
              <Text style={styles.bookingCount}>
                {loading ? "Loading..." : `${totalBookings} booking${totalBookings !== 1 ? 's' : ''}`}
              </Text>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {loading && initialLoad ? (
                <View style={styles.loadingContainer}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonCard}>
                      <View style={styles.skeletonHeader} />
                      <View style={styles.skeletonBody}>
                        <View style={styles.skeletonLine} />
                        <View style={styles.skeletonLineShort} />
                        <View style={styles.skeletonLine} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : data.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcon name="event-busy" size={64} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No Bookings Found</Text>
                  <Text style={styles.emptyDescription}>{getEmptyStateMessage()}</Text>
                </View>
              ) : (
                <View style={styles.bookingsContainer}>
                  {data.map(renderBookingCard)}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <OtpVerificationDialog
        open={otpDialogOpen}
        onOpenChange={() => setOtpDialogOpen(false)}
        onVerify={handleVerifyOtp}
        verifying={verifyingOtp}
        bookingInfo={currentBooking ? {
          clientName: currentBooking.bookingData?.firstname || currentBooking.bookingData?.customerName,
          service: getServiceTitle(currentBooking.bookingData?.service_type || currentBooking.bookingData?.serviceType),
          bookingId: currentBooking.bookingData?.engagement_id || currentBooking.bookingData?.id,
        } : undefined}
      />

      <Modal visible={trackAddressDialogOpen} transparent animationType="slide" onRequestClose={() => setTrackAddressDialogOpen(false)}>
        <TrackAddress 
          onClose={() => setTrackAddressDialogOpen(false)}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  monthInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  monthNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavButtonDisabled: {
    backgroundColor: '#f8fafc',
    opacity: 0.5,
  },
  monthText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  bookingCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  modalBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonHeader: {
    height: 80,
    backgroundColor: '#f1f5f9',
  },
  skeletonBody: {
    padding: 16,
    gap: 12,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    width: '100%',
  },
  skeletonLineShort: {
    height: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    width: '60%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  bookingsContainer: {
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardGradientHeader: {
    padding: 16,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingId: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  cardHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  phoneButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  trackButtonText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusScheduled: {
    backgroundColor: '#eff6ff',
  },
  statusProgress: {
    backgroundColor: '#f0fdf4',
  },
  statusCompleted: {
    backgroundColor: '#faf5ff',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#3b82f6',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  taskStatusLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  disabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disabledBadgeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});