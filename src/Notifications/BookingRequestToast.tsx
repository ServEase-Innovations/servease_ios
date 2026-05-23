import React, { useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import BookingRequestPanel from "./BookingRequestPanel";
import { BookingRequestPayload, isBookingToastInfoOnly } from "./inAppNotificationUtils";

type Props = {
  visible?: boolean;
  engagement: BookingRequestPayload | Record<string, unknown>;
  onAccept: (engagementId: number) => void | Promise<void>;
  onReject: (engagementId: number) => void;
  onClose: () => void;
  actionBusy?: boolean;
  acceptError?: string | null;
};

export default function BookingRequestToast({
  visible = true,
  engagement,
  onAccept,
  onReject,
  onClose,
  actionBusy = false,
  acceptError = null,
}: Props) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const payload = engagement as BookingRequestPayload;
  const isInfoOnly = isBookingToastInfoOnly(payload);
  const sheetWidth = Math.min(windowWidth - 32, 420);
  const maxSheetHeight = Math.round(windowHeight * 0.82);

  useEffect(() => {
    if (!visible || isInfoOnly) return undefined;
    const timer = setTimeout(() => onClose(), 60000);
    return () => clearTimeout(timer);
  }, [onClose, isInfoOnly, visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Dismiss" />

        <View style={[styles.sheet, { width: sheetWidth, maxHeight: maxSheetHeight }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <MaterialIcon name="close" size={24} color="#334155" />
          </TouchableOpacity>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <BookingRequestPanel
              engagement={payload}
              onAccept={onAccept}
              onReject={(id) => {
                onReject(id);
                onClose();
              }}
              actionBusy={actionBusy}
              errorText={acceptError}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    zIndex: 2,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  scrollContent: {
    flexGrow: 0,
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 10,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
  },
});
