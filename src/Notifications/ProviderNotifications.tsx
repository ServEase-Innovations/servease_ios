/* eslint-disable */
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView } from "react-native";
import { io, Socket } from "socket.io-client";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import PaymentInstance from "../services/paymentInstance";

interface NotificationPayload {
  engagementId: number;
  serviceType: string;
  bookingType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string; // Added from React code
  baseAmount: number;
  status?: "pending" | "accepted" | "rejected" | "completed"; // Added status field
  created_at?: string; // Added created_at field
  customerLocation?: { latitude: number; longitude: number };
}

export default function ProviderNotifications({ providerId }: { providerId: number }) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!providerId) return;

    const newSocket = io(
      process.env.REACT_APP_SOCKET_URL || "https://payments-j5id.onrender.com",
      {
        transports: ["websocket"],
        withCredentials: true,
      }
    );

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🔌 Connected to WebSocket server as provider", providerId);
      newSocket.emit("join", { providerId });
    });

    newSocket.on("new-engagement", (data: NotificationPayload) => {
      console.log("📩 New engagement notification:", data);
      // Add default status and timestamp if not provided
      const notificationWithDefaults = {
        ...data,
        status: data.status || "pending",
        created_at: data.created_at || new Date().toISOString()
      };
      setNotifications((prev) => [notificationWithDefaults, ...prev]);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [providerId]);

  const handleAccept = async (engagementId: number) => {
    try {
      const res = await PaymentInstance.post(
        `/api/engagements/${engagementId}/accept`,
        { providerId }
      );
      Alert.alert("Success", res.data.message || "Engagement accepted!");
      // Update status instead of removing immediately
      setNotifications((prev) =>
        prev.map((n) =>
          n.engagementId === engagementId 
            ? { ...n, status: "accepted" as const }
            : n
        )
      );
      
      // Remove after a delay to show success state
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.engagementId !== engagementId)
        );
      }, 2000);
      
    } catch (err: any) {
      console.error("Error accepting engagement:", err);
      Alert.alert("Error", err.response?.data?.message || "Failed to accept engagement");
    }
  };

  const handleReject = async (engagementId: number) => {
    try {
      const res = await PaymentInstance.post(
        `/api/engagements/${engagementId}/reject`,
        { providerId }
      );
      Alert.alert("Success", res.data.message || "Engagement rejected!");
      setNotifications((prev) =>
        prev.map((n) =>
          n.engagementId === engagementId 
            ? { ...n, status: "rejected" as const }
            : n
        )
      );
      
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.engagementId !== engagementId)
        );
      }, 2000);
      
    } catch (err: any) {
      console.error("Error rejecting engagement:", err);
      Alert.alert("Error", err.response?.data?.message || "Failed to reject engagement");
    }
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
            setNotifications((prev) =>
              prev.filter((n) => n.engagementId !== engagementId)
            );
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#d97706";
      case "accepted": return "#059669";
      case "rejected": return "#dc2626";
      case "completed": return "#2563eb";
      default: return "#6b7280";
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case "pending": return "#fef3c7";
      case "accepted": return "#d1fae5";
      case "rejected": return "#fee2e2";
      case "completed": return "#dbeafe";
      default: return "#f3f4f6";
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

  const renderNotification = ({ item }: { item: NotificationPayload }) => (
    <View style={[styles.notificationCard, { borderLeftWidth: 4, borderLeftColor: getStatusColor(item.status || "pending") }]}>
      <View style={styles.notificationHeader}>
        <View style={styles.statusContainer}>
          <Icon 
            name={getStatusIcon(item.status || "pending")} 
            size={16} 
            color={getStatusColor(item.status || "pending")} 
          />
          <View 
            style={[
              styles.statusBadge, 
              { backgroundColor: getStatusBackgroundColor(item.status || "pending") }
            ]}
          >
            <Text 
              style={[
                styles.statusText, 
                { color: getStatusColor(item.status || "pending") }
              ]}
            >
              {(item.status || "pending").charAt(0).toUpperCase() + (item.status || "pending").slice(1)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDelete(item.engagementId)}
          style={styles.deleteButton}
        >
          <Icon name="delete-outline" size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        New {item.bookingType} booking:{" "}
        <Text style={styles.highlight}>{item.serviceType}</Text>
      </Text>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.subtitle}>
          📅 {item.startDate} ({item.startTime} – {item.endTime})
        </Text>
        <Text style={styles.amount}>₹{item.baseAmount}</Text>
        {item.created_at && (
          <Text style={styles.timestamp}>
            Received: {new Date(item.created_at).toLocaleString()}
          </Text>
        )}
      </View>

      {(item.status === "pending" || !item.status) && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(item.engagementId)}
          >
            <Icon name="close-circle" size={16} color="#dc2626" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAccept(item.engagementId)}
          >
            <Icon name="check-circle" size={16} color="#fff" />
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === "accepted" && (
        <View style={[styles.statusMessage, { backgroundColor: "#d1fae5" }]}>
          <Text style={[styles.statusMessageText, { color: "#059669" }]}>
            ✅ Engagement Accepted
          </Text>
        </View>
      )}

      {item.status === "rejected" && (
        <View style={[styles.statusMessage, { backgroundColor: "#fee2e2" }]}>
          <Text style={[styles.statusMessageText, { color: "#dc2626" }]}>
            ❌ Engagement Rejected
          </Text>
        </View>
      )}
    </View>
  );

  const pendingCount = notifications.filter(n => n.status === "pending").length;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="bell" size={20} color="#f5a623" />
          <Text style={styles.headerText}>Notifications</Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                "Clear All",
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
            }}
          >
            <Icon name="delete-sweep" size={20} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="bell-outline" size={40} color="#d1d5db" />
          <Text style={styles.emptyStateText}>No new notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.engagementId.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    maxHeight: 500,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  badge: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    paddingVertical: 4,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  highlight: {
    color: "#2563eb",
    fontWeight: "600",
  },
  detailsContainer: {
    gap: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563eb",
  },
  timestamp: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rejectButtonText: {
    color: "#dc2626",
    fontWeight: "500",
    fontSize: 14,
  },
  acceptButton: {
    backgroundColor: "#059669",
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  statusMessage: {
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  statusMessageText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
});