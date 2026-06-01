import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "../../src/Settings/ThemeContext";
import { useAppUser } from "../context/AppUserContext";
import {
  createSupportTicket,
  getEngagementIdFromBooking,
  ticketErrorMessage,
  type TicketCategory,
} from "../services/ticketsService";

interface RaiseComplaintDialogProps {
  visible: boolean;
  onClose: () => void;
  booking: { id?: number; engagement_id?: number; service_type?: string } | null;
  onSubmitted?: () => void;
}

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "GENERAL", label: "General" },
  { value: "BOOKING", label: "Booking issue" },
  { value: "PAYMENT", label: "Payment / billing" },
  { value: "SERVICE_QUALITY", label: "Service quality" },
  { value: "PROVIDER_CONDUCT", label: "Provider conduct" },
  { value: "REFUND", label: "Refund request" },
  { value: "APP_TECHNICAL", label: "App / technical" },
];

const RaiseComplaintDialog: React.FC<RaiseComplaintDialogProps> = ({
  visible,
  onClose,
  booking,
  onSubmitted,
}) => {
  const { colors } = useTheme();
  const { appUser } = useAppUser();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("GENERAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const customerId =
    appUser?.customerId != null
      ? Number(appUser.customerId)
      : appUser?.customerid != null
        ? Number(appUser.customerid)
        : undefined;

  const engagementId = booking ? getEngagementIdFromBooking(booking) : null;

  useEffect(() => {
    if (visible && booking?.service_type && !subject) {
      setSubject(`Issue with ${booking.service_type} booking`);
    }
  }, [visible, booking, subject]);

  const handleSubmit = async () => {
    if (!customerId) {
      setMessage("Please sign in to submit a complaint.");
      return;
    }
    if (!subject.trim() || !description.trim()) {
      setMessage("Enter a subject and description.");
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const result = await createSupportTicket({
        customerId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        engagementId,
      });
      if (!result.success) {
        throw new Error(ticketErrorMessage(result.error));
      }
      setMessage(result.message || "Complaint submitted. Our team will respond within 48 hours.");
      onSubmitted?.();
      setTimeout(() => {
        setSubject("");
        setDescription("");
        onClose();
      }, 1500);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setMessage(ticketErrorMessage(err?.response?.data?.error, err?.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Raise a complaint</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body}>
            <Text style={{ color: colors.textSecondary, marginBottom: 12, fontSize: 13 }}>
              Default response target: 48 hours.
              {engagementId ? ` Linked to booking #${engagementId}.` : ""}
            </Text>
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: category === c.value ? colors.primary + "22" : colors.border + "40",
                      borderColor: category === c.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: colors.text, fontSize: 12 }}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={subject}
              onChangeText={setSubject}
            />
            <Text style={[styles.label, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            {message ? (
              <Text style={{ color: colors.primary, marginTop: 8, fontSize: 13 }}>{message}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.submit, { backgroundColor: colors.primary }]}
              onPress={() => void handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit complaint</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "88%", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  body: { paddingBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  submit: { borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  submitText: { color: "#fff", fontWeight: "700" },
});

export default RaiseComplaintDialog;
