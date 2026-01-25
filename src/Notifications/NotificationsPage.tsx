// NotificationsDialog.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface Engagement {
  engagement_id: number;
  service_type: string;
  booking_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  base_amount: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  created_at: string;
}

interface NotificationItemProps {
  engagement: Engagement;
  onAccept: (engagementId: number) => void;
  onReject: (engagementId: number) => void;
  onDelete: (engagementId: number) => void;
}

interface NotificationsDialogProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get("window");

// Custom Card Components
const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const CardContent: React.FC<{ children: React.ReactNode; style?: any }> = ({ 
  children, 
  style 
}) => {
  return (
    <View style={[styles.cardContent, style]}>
      {children}
    </View>
  );
};

function NotificationItem({
  engagement,
  onAccept,
  onReject,
  onDelete,
}: NotificationItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return { color: "#d97706", backgroundColor: "#fef3c7" };
      case "accepted": return { color: "#059669", backgroundColor: "#d1fae5" };
      case "rejected": return { color: "#dc2626", backgroundColor: "#fee2e2" };
      case "completed": return { color: "#2563eb", backgroundColor: "#dbeafe" };
      default: return { color: "#4b5563", backgroundColor: "#f3f4f6" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "clock";
      case "accepted": return "check-circle";
      case "rejected": return "close-circle";
      case "completed": return "party-popper";
      default: return "bell";
    }
  };

  const statusStyle = getStatusColor(engagement.status);

  return (
    <Card style={[styles.notificationCard, { borderLeftWidth: 4, borderLeftColor: "#2563eb" }]}>
      <CardContent style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.statusContainer}>
            <Icon name={getStatusIcon(engagement.status)} size={20} color={statusStyle.color} />
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {engagement.status.charAt(0).toUpperCase() + engagement.status.slice(1)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onDelete(engagement.engagement_id)}
            style={styles.deleteButton}
          >
            <Icon name="delete-outline" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text style={styles.notificationTitle}>
          {engagement.booking_type} booking for{" "}
          <Text style={styles.serviceType}>{engagement.service_type}</Text>
        </Text>
        
        <View style={styles.notificationDetails}>
          <Text style={styles.detailText}>
            📅 {engagement.start_date} ({engagement.start_time} – {engagement.end_time})
          </Text>
          <Text style={styles.amountText}>₹{engagement.base_amount}</Text>
          <Text style={styles.dateText}>
            Received: {new Date(engagement.created_at).toLocaleString()}
          </Text>
        </View>

        {engagement.status === "pending" && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => onReject(engagement.engagement_id)}
            >
              <Icon name="close-circle" size={16} color="#dc2626" />
              <Text style={styles.rejectButtonText}> Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => onAccept(engagement.engagement_id)}
            >
              <Icon name="check-circle" size={16} color="#ffffff" />
              <Text style={styles.acceptButtonText}> Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

export default function NotificationsDialog({ visible, onClose }: NotificationsDialogProps) {
  const [notifications, setNotifications] = useState<Engagement[]>([
    {
      engagement_id: 1,
      service_type: "Home Cook",
      booking_type: "Regular",
      start_date: "2024-01-15",
      end_date: "2024-01-15",
      start_time: "10:00 AM",
      end_time: "12:00 PM",
      base_amount: 1200,
      status: "pending",
      created_at: "2024-01-14T10:30:00Z"
    },
    {
      engagement_id: 2,
      service_type: "Cleaning Help",
      booking_type: "One-time",
      start_date: "2024-01-16",
      end_date: "2024-01-16",
      start_time: "2:00 PM",
      end_time: "4:00 PM",
      base_amount: 800,
      status: "accepted",
      created_at: "2024-01-14T09:15:00Z"
    },
    {
      engagement_id: 3,
      service_type: "Caregiver",
      booking_type: "Long-term",
      start_date: "2024-01-17",
      end_date: "2024-01-20",
      start_time: "9:00 AM",
      end_time: "5:00 PM",
      base_amount: 3500,
      status: "rejected",
      created_at: "2024-01-13T14:20:00Z"
    },
    {
      engagement_id: 4,
      service_type: "Home Cook",
      booking_type: "Short-term",
      start_date: "2024-01-18",
      end_date: "2024-01-18",
      start_time: "6:00 PM",
      end_time: "8:00 PM",
      base_amount: 1500,
      status: "completed",
      created_at: "2024-01-12T16:45:00Z"
    }
  ]);

  const [filter, setFilter] = useState<string>("all");

  const handleAccept = (engagementId: number) => {
    setNotifications(notifications.map(notif => 
      notif.engagement_id === engagementId 
        ? { ...notif, status: "accepted" as const }
        : notif
    ));
    console.log(`Accepted engagement: ${engagementId}`);
  };

  const handleReject = (engagementId: number) => {
    setNotifications(notifications.map(notif => 
      notif.engagement_id === engagementId 
        ? { ...notif, status: "rejected" as const }
        : notif
    ));
    console.log(`Rejected engagement: ${engagementId}`);
  };

  const handleDelete = (engagementId: number) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setNotifications(notifications.filter(notif => notif.engagement_id !== engagementId));
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: () => setNotifications([])
        }
      ]
    );
  };

  const filteredNotifications = notifications.filter(notif => 
    filter === "all" ? true : notif.status === filter
  );

  const getNotificationCount = (status: string) => {
    return notifications.filter(notif => notif.status === status).length;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.dialog}>
          {/* Dialog Header */}
          <View style={styles.dialogHeader}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Icon name="bell" size={24} color="#ffffff" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.dialogTitle}>Notifications</Text>
                <Text style={styles.dialogSubtitle}>Manage your booking requests and updates</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.dialogContent}>
            {/* Stats and Filters */}
            <Card style={styles.statsCard}>
              <CardContent>
                <View style={styles.statsContainer}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{getNotificationCount("pending")}</Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, styles.acceptedStat]}>{getNotificationCount("accepted")}</Text>
                      <Text style={styles.statLabel}>Accepted</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, styles.totalStat]}>{notifications.length}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.filterContainer}
                    onPress={() => {
                      // Simple filter toggle for demo
                      setFilter(filter === "all" ? "pending" : "all");
                    }}
                  >
                    <Icon name="filter" size={16} color="#6b7280" />
                    <View style={styles.filterSelect}>
                      <Text style={styles.filterText}>
                        {filter === "all" ? "All Notifications" : 
                         filter === "pending" ? "Pending" :
                         filter === "accepted" ? "Accepted" :
                         filter === "rejected" ? "Rejected" : "Completed"}
                      </Text>
                      <Icon name="chevron-down" size={16} color="#6b7280" />
                    </View>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>

            {/* Clear All Button */}
            {notifications.length > 0 && (
              <View style={styles.clearAllContainer}>
                <TouchableOpacity
                  onPress={handleClearAll}
                  style={styles.clearAllButton}
                >
                  <Icon name="delete-outline" size={16} color="#dc2626" />
                  <Text style={styles.clearAllText}> Clear All</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Notifications List */}
            <ScrollView 
              style={styles.notificationsList}
              showsVerticalScrollIndicator={false}
            >
              {filteredNotifications.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <CardContent style={styles.emptyContent}>
                    <Icon name="bell-outline" size={48} color="#d1d5db" />
                    <Text style={styles.emptyTitle}>No notifications</Text>
                    <Text style={styles.emptyText}>
                      {notifications.length === 0 
                        ? "You don't have any notifications yet." 
                        : `No ${filter === "all" ? "" : filter + " "}notifications found.`
                      }
                    </Text>
                  </CardContent>
                </Card>
              ) : (
                <View>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.engagement_id}
                      engagement={notification}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    borderRadius: 12,
    maxHeight: "85%",
    backgroundColor: "#ffffff",
    // width: '100%',
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dialogHeader: {
    backgroundColor: "#0a2a66",
    padding: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  closeButton: {
    padding: 4,
  },
  dialogContent: {
    flex: 1,
  },
  // Card Styles
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardContent: {
    padding: 16,
  },
  // Stats Card
  statsCard: {
    margin: 16,
    marginBottom: 0,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
  },
  acceptedStat: {
    color: "#059669",
  },
  totalStat: {
    color: "#6b7280",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterSelect: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterText: {
    fontSize: 14,
    color: "#374151",
    marginRight: 4,
  },
  clearAllContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearAllText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  notificationsList: {
    maxHeight: 400,
    padding: 16,
  },
  notificationCard: {
    marginBottom: 16,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  serviceType: {
    fontWeight: "600",
    color: "#2563eb",
  },
  notificationDetails: {
    gap: 4,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
  },
  dateText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  rejectButton: {
    borderColor: "#dc2626",
    backgroundColor: "transparent",
  },
  rejectButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  acceptButton: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  acceptButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
  },
  emptyContent: {
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});