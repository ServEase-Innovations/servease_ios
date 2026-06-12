import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../Settings/ThemeContext";
import { BrandButton } from "../design-system/BrandButton";

export type OnDemandRebookDialogBooking = {
  serviceProviderId: number;
  serviceProviderName: string;
};

interface OnDemandRebookDialogProps {
  open: boolean;
  onClose: () => void;
  booking: OnDemandRebookDialogBooking | null;
  canCheckSameProvider: boolean;
  sameProviderDisabledReason?: string | null;
  checkingSameProvider: boolean;
  sameProviderError?: string | null;
  onBookSameProvider: () => void;
  onChooseDifferentProvider: () => void;
}

const OnDemandRebookDialog: React.FC<OnDemandRebookDialogProps> = ({
  open,
  onClose,
  booking,
  canCheckSameProvider,
  sameProviderDisabledReason,
  checkingSameProvider,
  sameProviderError,
  onBookSameProvider,
  onChooseDifferentProvider,
}) => {
  const { colors } = useTheme();
  const providerName =
    booking?.serviceProviderName?.trim() || "your previous provider";
  const hasAssignedProvider =
    Boolean(booking?.serviceProviderId) && booking!.serviceProviderId > 0;

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.overlay}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text }]}>Book again</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              Your schedule is prefilled from your last visit. Book with the same provider, or
              continue to on-demand checkout and we will match you with an available provider near you.
            </Text>

            {sameProviderError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.error + "12", borderColor: colors.error + "35" }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{sameProviderError}</Text>
              </View>
            ) : null}

            {hasAssignedProvider ? (
              <>
                <BrandButton
                  onPress={onBookSameProvider}
                  disabled={!canCheckSameProvider || checkingSameProvider}
                  loading={checkingSameProvider}
                  fullWidth
                  style={styles.primaryBtn}
                >
                  {checkingSameProvider
                    ? "Checking availability..."
                    : `Book with ${providerName} again`}
                </BrandButton>
                {hasAssignedProvider && !canCheckSameProvider && sameProviderDisabledReason ? (
                  <Text style={[styles.caption, { color: colors.textSecondary }]}>
                    {sameProviderDisabledReason}
                  </Text>
                ) : null}
              </>
            ) : null}

            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: colors.border }]}
              onPress={onChooseDifferentProvider}
              disabled={checkingSameProvider}
            >
              <Icon name="account-group-outline" size={18} color={colors.primary} />
              <Text style={[styles.outlineBtnText, { color: colors.primary }]}>
                {hasAssignedProvider ? "Book with a different provider" : "Continue to booking"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  dialogContainer: {
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700" },
  bodyText: { fontSize: 14, lineHeight: 21 },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { fontSize: 13, lineHeight: 18 },
  primaryBtn: { marginTop: 4 },
  caption: { fontSize: 12, lineHeight: 17, marginTop: -4 },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  outlineBtnText: { fontSize: 14, fontWeight: "600" },
});

export default OnDemandRebookDialog;
