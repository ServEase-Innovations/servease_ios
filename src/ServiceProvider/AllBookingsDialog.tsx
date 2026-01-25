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
  DimensionValue
} from "react-native";
import { Calendar, MapPin, X, Phone, Clock } from "lucide-react-native";
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from "./../common/BookingUtils";
import PaymentInstance from "../services/paymentInstance";
import dayjs, { Dayjs } from "dayjs";
import { Booking, BookingHistoryResponse } from "./Dashboard";

interface AllBookingsDialogProps {
  bookings: BookingHistoryResponse | null;
  serviceProviderId: number | null;
  trigger?: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  onContactClient: (booking: Booking) => void;
}

// Helper function to convert epoch to formatted date and time
const formatEpochToDateTime = (epochSeconds: number) => {
  const date = new Date(epochSeconds * 1000);
  
  // Format date
  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  
  // Format time in 12-hour format with AM/PM
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  
  return { formattedDate, formattedTime, date };
};

// Function to format time string to AM/PM format
const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0 to 12, 13 to 1, etc.
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original if parsing fails
  }
};

// Function to format time range from start and end time strings
const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
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

  const mapApiBookingToBooking = (apiBooking: any): Booking => {
    // Use epoch time if available, otherwise fall back to date strings
    let date, timeRange;
    
    if (apiBooking.start_epoch && apiBooking.end_epoch) {
      // Convert epoch seconds to Date objects
      const startDate = new Date(apiBooking.start_epoch * 1000);
      const endDate = new Date(apiBooking.end_epoch * 1000);
      
      // Format date
      const formattedDate = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
      
      // Format time range
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
      // Fallback to using date strings and time strings
      const startDateRaw = apiBooking.startDate || apiBooking.start_date;
      const startTimeStr = apiBooking.startTime || "00:00";
      const endTimeStr = apiBooking.endTime || "00:00";

      const startDate = new Date(startDateRaw);
      const endDate = new Date(startDateRaw);

      const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
      const [endHours, endMinutes] = endTimeStr.split(":").map(Number);

      startDate.setHours(startHours, startMinutes);
      endDate.setHours(endHours, endMinutes);

      timeRange = formatTimeRange(apiBooking.startTime, apiBooking.endTime);
      
      date = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }

    // Get client name - using email since name fields are empty
    const clientName = apiBooking.firstname || 
                      apiBooking.customerName || 
                      apiBooking.email || 
                      "Client";

    // Get booking ID - use engagement_id, convert to number
    const bookingId = Number(apiBooking.engagement_id || apiBooking.id);

    // Get amount - use base_amount, format properly
    const amount = apiBooking.base_amount ? 
      `₹${parseFloat(apiBooking.base_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
      "₹0";

    const responsibilities = apiBooking.responsibilities || {};

    return {
      id: bookingId, // Now returns a number
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
      location: apiBooking.address || "Address not provided",
      status: apiBooking.task_status || apiBooking.taskStatus || "",
      amount: amount,
      bookingData: {
        ...apiBooking,
        mobileno: apiBooking.mobileno || "",
        contact: apiBooking.mobileno || "Contact info not available"
      }
    };
  };

  const fetchBookingsByMonth = async (
    type: "ongoing" | "future" | "past",
    month: number,
    year: number
  ) => {
    if (!serviceProviderId) return [];

    try {
      setLoading(true);
      const formatted = `${year}-${String(month).padStart(2, "0")}`;
      const res = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/engagements?month=${formatted}`
      );

      const apiData: BookingHistoryResponse = res.data;
      
      let list: any[] = [];
      
      if (type === "ongoing") {
        // For ongoing tab, get current bookings for the current month
        list = apiData.current ?? [];
      } else if (type === "future") {
        list = apiData.upcoming ?? [];
      } else if (type === "past") {
        list = apiData.past ?? [];
      }
      
      return list.map(mapApiBookingToBooking);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      Alert.alert("Error", "Failed to fetch bookings");
      return [];
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const fetchOngoingBookings = async () => {
    if (!serviceProviderId) return [];
    
    try {
      setLoading(true);
      const now = dayjs();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();
      
      const bookings = await fetchBookingsByMonth("ongoing", currentMonth, currentYear);
      
      // Filter to get today's bookings or active ongoing bookings
      const today = dayjs().format("YYYY-MM-DD");
      const ongoingBookings = bookings.filter((booking) => {
        const bookingDate = dayjs(booking.start_date).format("YYYY-MM-DD");
        return bookingDate === today || booking.taskStatus === "IN_PROGRESS";
      });
      
      return ongoingBookings;
    } catch (err) {
      console.error("Error fetching ongoing bookings:", err);
      Alert.alert("Error", "Failed to fetch ongoing bookings");
      return [];
    }
  };

  // Sync visible prop with internal state
  useEffect(() => {
    if (visible) {
      setInitialLoad(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    
    // Reset data when dialog opens
    setData([]);
    setTotalBookings(0);
    
    if (!serviceProviderId) {
      // Fallback to using props if no serviceProviderId
      if (bookings) {
        const mapData = (list: any[]) => list.map(mapApiBookingToBooking);
        
        if (tab === "ongoing") {
          const ongoingBookings = mapData(bookings.current ?? []);
          setData(ongoingBookings);
          setTotalBookings(ongoingBookings.length);
          setSelectedMonth(dayjs());
        } else if (tab === "future") {
          const nextMonth = dayjs().add(1, "month").startOf("month");
          setSelectedMonth(nextMonth);
          const futureBookings = mapData(bookings.upcoming ?? []);
          setData(futureBookings);
          setTotalBookings(futureBookings.length);
        } else if (tab === "past") {
          const prevMonth = dayjs().subtract(1, "month").startOf("month");
          setSelectedMonth(prevMonth);
          const pastBookings = mapData(bookings.past ?? []);
          setData(pastBookings);
          setTotalBookings(pastBookings.length);
        }
      }
      setInitialLoad(false);
      return;
    }
    
    // Fetch data from API based on tab
    if (tab === "ongoing") {
      fetchOngoingBookings().then((res) => {
        setData(res);
        setTotalBookings(res.length);
        setSelectedMonth(dayjs());
      });
    } else if (tab === "future") {
      const nextMonth = dayjs().add(1, "month").startOf("month");
      setSelectedMonth(nextMonth);
      fetchBookingsByMonth("future", nextMonth.month() + 1, nextMonth.year()).then(
        (res) => {
          setData(res ?? []);
          setTotalBookings(res.length);
        }
      );
    } else if (tab === "past") {
      const prevMonth = dayjs().subtract(1, "month").startOf("month");
      setSelectedMonth(prevMonth);
      fetchBookingsByMonth("past", prevMonth.month() + 1, prevMonth.year()).then(
        (res) => {
          setData(res ?? []);
          setTotalBookings(res.length);
        }
      );
    }
  }, [tab, visible]);

  useEffect(() => {
    if (!visible || !selectedMonth || tab === "ongoing") return;

    setLoading(true);
    fetchBookingsByMonth(
      tab,
      selectedMonth.month() + 1,
      selectedMonth.year()
    ).then((res) => {
      setData(res ?? []);
      setTotalBookings(res.length);
    });
  }, [selectedMonth, tab, visible]);

  const getMonthName = (date: Dayjs) => {
    return date.format("MMMM YYYY");
  };

  // Enhanced badge component
  interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "destructive" | "secondary" | "outline";
    style?: any;
  }

  const Badge = ({ children, variant = "default", style }: BadgeProps) => {
    const getVariantStyle = () => {
      switch (variant) {
        case "success":
          return styles.badgeSuccess;
        case "warning":
          return styles.badgeWarning;
        case "destructive":
          return styles.badgeDestructive;
        case "secondary":
          return styles.badgeSecondary;
        case "outline":
          return styles.badgeOutline;
        default:
          return styles.badgeDefault;
      }
    };

    const getTextStyle = () => {
      switch (variant) {
        case "outline":
          return styles.badgeOutlineText;
        default:
          return styles.badgeText;
      }
    };

    return (
      <View style={[styles.badge, getVariantStyle(), style]}>
        <Text style={[getTextStyle(), styles.badgeText]}>{children}</Text>
      </View>
    );
  };

  // Enhanced button component with disabled state
  interface ButtonProps {
    children: React.ReactNode;
    variant?: "default" | "outline" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    onPress?: () => void;
    disabled?: boolean;
    icon?: React.ReactNode;
  }

  const Button = ({ 
    children, 
    variant = "default", 
    size = "md", 
    onPress,
    disabled = false,
    icon
  }: ButtonProps) => {
    const getVariantStyle = () => {
      if (disabled) return styles.buttonDisabled;
      
      switch (variant) {
        case "outline":
          return styles.buttonOutline;
        case "secondary":
          return styles.buttonSecondary;
        case "ghost":
          return styles.buttonGhost;
        default:
          return styles.buttonDefault;
      }
    };

    const getSizeStyle = () => {
      switch (size) {
        case "sm":
          return styles.buttonSm;
        case "lg":
          return styles.buttonLg;
        default:
          return styles.buttonMd;
      }
    };

    const getTextStyle = () => {
      if (disabled) return styles.buttonDisabledText;
      
      switch (variant) {
        case "outline":
          return styles.buttonOutlineText;
        case "secondary":
          return styles.buttonSecondaryText;
        case "ghost":
          return styles.buttonGhostText;
        default:
          return styles.buttonDefaultText;
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.button, getVariantStyle(), getSizeStyle()]}
        onPress={onPress}
        disabled={disabled}
      >
        <View style={styles.buttonContent}>
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
          <Text style={[styles.buttonText, getTextStyle()]}>
            {children}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  interface TabButtonProps {
    label: string;
    isActive: boolean;
    onPress: () => void;
  }

  const TabButton = ({ label, isActive, onPress }: TabButtonProps) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced MonthSelector with better styling
  const MonthSelector = () => (
    <View style={styles.monthSelector}>
      <TouchableOpacity 
        style={[styles.monthNavButton, styles.monthNavButtonPrev]}
        onPress={() => {
          const newMonth = selectedMonth.subtract(1, 'month');
          setSelectedMonth(newMonth);
        }}
      >
        <Text style={styles.monthNavText}>‹</Text>
      </TouchableOpacity>
      
      <View style={styles.monthTextContainer}>
        <Text style={styles.monthText}>
          {getMonthName(selectedMonth)}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.monthNavButton, styles.monthNavButtonNext]}
        onPress={() => {
          const newMonth = selectedMonth.add(1, 'month');
          setSelectedMonth(newMonth);
        }}
      >
        <Text style={styles.monthNavText}>›</Text>
      </TouchableOpacity>
    </View>
  );

  interface SkeletonLoaderProps {
    width: DimensionValue;
    height: number;
    style?: any;
  }

  // Enhanced SkeletonLoader with customizable style
  const SkeletonLoader = ({ width, height, style }: SkeletonLoaderProps) => (
    <View style={[styles.skeleton, { width, height }, style]} />
  );

  // Enhanced responsibilities rendering
  const renderResponsibilities = (booking: Booking) => {
    if (!booking.responsibilities) return null;

    return (
      <View style={styles.responsibilitiesSection}>
        <Text style={styles.responsibilitiesTitle}>Responsibilities:</Text>
        <View style={styles.responsibilitiesList}>
          {booking.responsibilities?.tasks?.map((task: any, index: number) => {
            const taskLabel = task.persons ? `${task.persons} persons` : "";
            return (
              <Badge key={index} variant="outline" style={styles.responsibilityBadge}>
                <Text style={styles.responsibilityText}>
                  {task.taskType} {taskLabel}
                </Text>
              </Badge>
            );
          })}
          {booking.responsibilities?.add_ons?.map((addon: any, index: number) => (
            <Badge key={`addon-${index}`} variant="outline" style={[styles.responsibilityBadge, styles.addonBadge]}>
              <Text style={styles.responsibilityText}>
                Add-on: {typeof addon === 'object' ? JSON.stringify(addon) : addon}
              </Text>
            </Badge>
          ))}
          {(!booking.responsibilities?.tasks?.length && !booking.responsibilities?.add_ons?.length) && (
            <Text style={styles.noResponsibilitiesText}>No responsibilities listed</Text>
          )}
        </View>
      </View>
    );
  };

  // Enhanced tab label formatting
  const getTabLabel = (tabType: "ongoing" | "future" | "past") => {
    const baseLabels = {
      ongoing: `Ongoing (${data.length})`,
      future: "Future",
      past: "Past"
    };
    
    return baseLabels[tabType];
  };

  // Enhanced modal title
  const getModalTitle = () => {
    return "View all Bookings";
  };

  // Enhanced empty state message
  const getEmptyStateMessage = () => {
    if (tab === "ongoing") {
      return "No ongoing bookings found. All your current bookings will appear here.";
    }
    return `No ${tab} bookings found. Try selecting a different month to view ${tab} bookings.`;
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {/* Only render trigger if provided */}
      {trigger && (
        <TouchableWithoutFeedback onPress={() => {}}>
          <View>{trigger}</View>
        </TouchableWithoutFeedback>
      )}

      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Enhanced header with better styling */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getModalTitle()}
              </Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Enhanced tabs with better visual feedback */}
            <View style={styles.tabsContainer}>
              <TabButton 
                label={getTabLabel("ongoing")}
                isActive={tab === "ongoing"}
                onPress={() => setTab("ongoing")}
              />
              <TabButton 
                label={getTabLabel("future")}
                isActive={tab === "future"}
                onPress={() => setTab("future")}
              />
              <TabButton 
                label={getTabLabel("past")}
                isActive={tab === "past"}
                onPress={() => setTab("past")}
              />
            </View>

            {/* Enhanced month selector section */}
            <View style={styles.monthInfoContainer}>
              {(tab === "future" || tab === "past") ? (
                <View style={styles.monthSelectorSection}>
                  <MonthSelector />
                  <Text style={styles.bookingCount}>
                    {loading ? (
                      <SkeletonLoader width={120} height={16} />
                    ) : (
                      `${totalBookings} booking${totalBookings !== 1 ? 's' : ''} in ${getMonthName(selectedMonth)}`
                    )}
                  </Text>
                </View>
              ) : (
                <View style={styles.ongoingCountContainer}>
                  <Text style={styles.bookingCount}>
                    {loading ? (
                      <SkeletonLoader width={120} height={16} />
                    ) : (
                      `${totalBookings} ongoing booking${totalBookings !== 1 ? 's' : ''}`
                    )}
                  </Text>
                </View>
              )}
            </View>

            {/* Enhanced scrollable content */}
            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {loading && initialLoad ? (
                <View style={styles.loadingContainer}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonCard}>
                      <View style={styles.skeletonHeader}>
                        <View style={styles.skeletonHeaderRow}>
                          <SkeletonLoader width="30%" height={12} />
                          <SkeletonLoader width="40%" height={12} />
                        </View>
                        <SkeletonLoader width="60%" height={24} style={styles.skeletonMargin} />
                        <SkeletonLoader width="40%" height={16} />
                      </View>
                      <View style={styles.skeletonContent}>
                        <View style={styles.skeletonRow}>
                          <View style={styles.skeletonInfo}>
                            <SkeletonLoader width="80%" height={16} style={styles.skeletonMargin} />
                            <SkeletonLoader width="60%" height={16} />
                          </View>
                          <SkeletonLoader width="30%" height={20} />
                        </View>
                        <SkeletonLoader width="90%" height={16} style={styles.skeletonMargin} />
                        <View style={styles.skeletonBadges}>
                          <SkeletonLoader width="60%" height={20} style={styles.skeletonMargin} />
                        </View>
                        <SkeletonLoader width="100%" height={36} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : data.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Calendar size={48} color="#d1d5db" />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {tab === "ongoing" 
                      ? "No ongoing bookings found" 
                      : `No ${tab} bookings found`
                    }
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {getEmptyStateMessage()}
                  </Text>
                </View>
              ) : (
                <View style={styles.bookingsContainer}>
                  {data.map((booking) => (
                    <View key={booking.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderTop}>
                          <Text style={styles.bookingId}>
                            Booking ID: {booking.id}
                          </Text>
                          <View style={styles.headerBadges}>
                            {getBookingTypeBadge(booking.booking_type || "")}
                          </View>
                        </View>
                        <View style={styles.cardHeaderMain}>
                          <View style={styles.cardHeaderLeft}>
                            <Text style={styles.cardTitle}>
                              {booking.clientName}
                            </Text>
                            <View style={styles.serviceStatusRow}>
                              <Text style={styles.serviceText}>
                                {getServiceTitle(booking.service)}
                              </Text>
                              <Text style={styles.dotSeparator}>•</Text>
                              {getStatusBadge(booking.taskStatus || "")}
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardContent}>
                        {/* Date, Time and Amount */}
                        <View style={styles.infoGrid}>
                          <View style={styles.dateTimeSection}>
                            <View style={styles.infoRow}>
                              <Calendar size={16} color="#6b7280" />
                              <Text style={styles.infoText}>
                                {booking.date}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Clock size={16} color="#6b7280" />
                              <Text style={styles.infoText}>
                                {booking.time}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.amountSection}>
                            <Text style={styles.amountLabel}>Amount</Text>
                            <Text style={styles.amountText}>
                              {booking.amount}
                            </Text>
                          </View>
                        </View>

                        {/* Location */}
                        <View style={styles.locationRow}>
                          <MapPin size={16} color="#6b7280" />
                          <Text style={styles.locationText}>
                            {booking.location}
                          </Text>
                        </View>

                        {/* Enhanced responsibilities section */}
                        {renderResponsibilities(booking)}

                        {/* Contact Button */}
                        <Button 
                          variant="outline"
                          size="sm"
                          onPress={() => onContactClient(booking)}
                          icon={<Phone size={16} color="#374151" />}
                        >
                          Contact Client
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
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
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#3b82f6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  monthInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  monthSelectorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ongoingCountContainer: {
    alignItems: 'flex-start',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavButtonPrev: {
    marginRight: 4,
  },
  monthNavButtonNext: {
    marginLeft: 4,
  },
  monthNavText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  monthTextContainer: {
    minWidth: 120,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  bookingCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    gap: 16,
  },
  skeletonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skeletonHeader: {
    marginBottom: 12,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skeletonContent: {
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonInfo: {
    flex: 1,
    gap: 8,
  },
  skeletonBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonMargin: {
    marginBottom: 4,
  },
  skeleton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  bookingsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  cardHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dotSeparator: {
    color: '#d1d5db',
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateTimeSection: {
    flex: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  amountSection: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
    lineHeight: 20,
  },
  responsibilitiesSection: {
    marginBottom: 20,
  },
  responsibilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  responsibilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  responsibilityBadge: {
    marginBottom: 4,
  },
  addonBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  responsibilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  noResponsibilitiesText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  // Enhanced Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  badgeDefault: {
    backgroundColor: '#3b82f6',
  },
  badgeSuccess: {
    backgroundColor: '#10b981',
  },
  badgeWarning: {
    backgroundColor: '#f59e0b',
  },
  badgeDestructive: {
    backgroundColor: '#ef4444',
  },
  badgeSecondary: {
    backgroundColor: '#6b7280',
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  badgeOutlineText: {
    color: '#374151',
  },
  // Enhanced Button styles
  button: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSm: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonMd: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonLg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonDefault: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonDefaultText: {
    color: 'white',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: '#d1d5db',
  },
  buttonOutlineText: {
    color: '#374151',
  },
  buttonSecondary: {
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  buttonSecondaryText: {
    color: 'white',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonGhostText: {
    color: '#374151',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    borderColor: '#9ca3af',
  },
  buttonDisabledText: {
    color: '#6b7280',
  },
});