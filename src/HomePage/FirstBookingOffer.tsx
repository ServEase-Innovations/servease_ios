import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import Snackbar from "react-native-snackbar";
import { Text } from "../theme/BrandTypography";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../Settings/ThemeContext";
import { FIRST_BOOKING_COUPON_CODES } from "../services/couponService";

interface FirstBookingOfferProps {
  onBook: () => void;
  visible?: boolean;
}

const MAX_FONT_SCALE = 1.2;

const FirstBookingOffer: React.FC<FirstBookingOfferProps> = ({
  onBook,
  visible = true,
}) => {
  const { isDarkMode } = useTheme();

  if (!visible) return null;

  const mutedColor = isDarkMode ? "#66552F" : "#725B32";

  const copyCoupon = async (code: string) => {
    try {
      await Clipboard.setString(code);
      Snackbar.show({
        text: `Coupon ${code} copied — apply at checkout`,
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#059669",
        textColor: "#ffffff",
      });
    } catch {
      Snackbar.show({
        text: "Could not copy coupon. Please try again.",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#DC2626",
        textColor: "#ffffff",
      });
    }
  };

  return (
    <View
      accessibilityLabel={`First booking offer, 99 rupees with codes ${FIRST_BOOKING_COUPON_CODES.MAID} and ${FIRST_BOOKING_COUPON_CODES.COOK}`}
      style={styles.container}
    >
      <View style={styles.cardOuter}>
        <LinearGradient
          colors={["#FFF5D9", "#FBE6B2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.offerHeader}>
            <View style={styles.offerLabel}>
              <Icon name="local-fire-department" size={17} color="#C2410C" />
              <Text
                style={styles.offerLabelText}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                FIRST BOOKING OFFER
              </Text>
            </View>
            <View style={styles.priceSection}>
              <Text
                style={styles.price}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                ₹99
              </Text>
              <Text
                style={styles.priceCaption}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                flat on your first booking
              </Text>
            </View>
          </View>

          <View style={styles.couponSection}>
            <View style={styles.couponTitleRow}>
              <Text
                style={styles.couponHeading}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                Choose your coupon
              </Text>
              <Text
                style={styles.couponInstructions}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
              >
                Tap to copy · Apply at checkout
              </Text>
            </View>
            <View style={styles.couponList}>
              <TouchableOpacity
                onPress={() => void copyCoupon(FIRST_BOOKING_COUPON_CODES.MAID)}
                style={styles.couponChip}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Copy Maid coupon ${FIRST_BOOKING_COUPON_CODES.MAID}`}
              >
                <Text style={styles.couponService}>MAID</Text>
                <Text
                  style={styles.couponCode}
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                >
                  {FIRST_BOOKING_COUPON_CODES.MAID}
                </Text>
                <Icon name="content-copy" size={14} color="#8A6A2F" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void copyCoupon(FIRST_BOOKING_COUPON_CODES.COOK)}
                style={styles.couponChip}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Copy Cook coupon ${FIRST_BOOKING_COUPON_CODES.COOK}`}
              >
                <Text style={styles.couponService}>COOK</Text>
                <Text
                  style={styles.couponCode}
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                >
                  {FIRST_BOOKING_COUPON_CODES.COOK}
                </Text>
                <Icon name="content-copy" size={14} color="#8A6A2F" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.bookingButton}
            activeOpacity={0.85}
            onPress={onBook}
            accessibilityRole="button"
            accessibilityLabel="Tap to book with the first booking offer"
          >
            <Text
              style={styles.bookingButtonText}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              numberOfLines={1}
            >
              Tap to Book
            </Text>
            <Icon name="arrow-forward" size={19} color="#FFFFFF" />
          </TouchableOpacity>

          <Text
            style={[styles.termsText, { color: mutedColor }]}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            T&C apply · Valid on first booking only
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignSelf: "stretch",
    paddingVertical: 8,
  },
  cardOuter: {
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#B7791F",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: { elevation: 4, shadowColor: "#B7791F" },
    }),
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(201, 162, 78, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  offerLabel: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.68)",
  },
  offerLabelText: {
    color: "#7C2D12",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  priceSection: {
    alignItems: "flex-end",
    flexShrink: 1,
  },
  price: {
    color: "#1F1A10",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
    textAlign: "right",
    paddingHorizontal: 2,
  },
  priceCaption: {
    color: "#57462A",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  couponSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(201, 162, 78, 0.35)",
    paddingTop: 8,
    marginTop: 8,
  },
  couponTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 6,
  },
  couponHeading: {
    color: "#57462A",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    flexShrink: 0,
  },
  couponInstructions: {
    color: "#725B32",
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "500",
    textAlign: "right",
    flexShrink: 1,
  },
  couponList: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  couponChip: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C9A24E",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  couponService: {
    color: "#8A6A2F",
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  couponCode: {
    color: "#1F1A10",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
    minWidth: 0,
  },
  bookingButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#EA580C",
  },
  bookingButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    flexShrink: 0,
  },
  termsText: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 12,
    textAlign: "center",
    fontWeight: "500",
    alignSelf: "stretch",
  },
});

export default FirstBookingOffer;