/* eslint-disable */
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface Engagement {
  engagement_id: number;
  service_type: string;
  booking_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  base_amount: number;
}

interface BookingRequestToastProps {
  engagement: Engagement;
  onAccept: (engagementId: number) => void;
  onReject: (engagementId: number) => void;
  onClose: () => void;
  visible?: boolean;
}

export default function BookingRequestToast({
  engagement,
  onAccept,
  onReject,
  onClose,
  visible = true,
}: BookingRequestToastProps) {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  // Auto close after 1 min
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 60_000); // 60 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  // Animation on mount
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleReject = () => {
    onReject(engagement.engagement_id);
    onClose();
  };

  const handleAccept = () => {
    onAccept(engagement.engagement_id);
    onClose();
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>🚨 New Booking Request</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              {engagement.booking_type} booking for{" "}
              <Text style={styles.bold}>{engagement.service_type}</Text>
            </Text>
            <Text style={styles.date}>
              {engagement.start_date} ({engagement.start_time} – {engagement.end_time})
            </Text>
            <Text style={styles.amount}>₹{engagement.base_amount}</Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleReject}
                activeOpacity={0.8}
              >
                <Icon name="x-circle" size={18} color="#dc2626" />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={handleAccept}
                activeOpacity={0.8}
              >
                <Icon name="check-circle" size={18} color="#fff" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    overflow: "hidden",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#1f2937",
  },
  content: {
    padding: 24,
    gap: 16,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "600",
    color: "#0ea5e9",
  },
  date: {
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  amount: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#0ea5e9",
    marginVertical: 8,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    minHeight: 44,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  acceptButton: {
    backgroundColor: "#16a34a",
    shadowColor: "#16a34a",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  rejectText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 16,
  },
  acceptText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});