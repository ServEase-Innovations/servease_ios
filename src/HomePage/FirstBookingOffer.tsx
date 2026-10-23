import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../Settings/ThemeContext";
import { FIRST_BOOKING_COUPON_CODES } from "../services/couponService";

interface FirstBookingOfferProps {
  onPress: () => void;
  visible?: boolean;
}

const MAX_FONT_SCALE = 1.2;

const FirstBookingOffer: React.FC<FirstBookingOfferProps> = ({
  onPress,
  visible = true,
}) => {
  const { isDarkMode } = useTheme();

  if (!visible) return null;

  const mutedColor = isDarkMode ? "#66552F" : "#725B32";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      accessibilityRole="button"
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

          <View style={styles.couponSection}>
            <Text
              style={styles.couponHeading}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              Choose your coupon
            </Text>
            <View style={styles.couponList}>
              <View style={styles.couponChip}>
                <Text style={styles.couponService}>MAID</Text>
                <Text
                  style={styles.couponCode}
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                >
                  {FIRST_BOOKING_COUPON_CODES.MAID}
                </Text>
              </View>
              <View style={styles.couponChip}>
                <Text style={styles.couponService}>COOK</Text>
                <Text
                  style={styles.couponCode}
                  maxFontSizeMultiplier={MAX_FONT_SCALE}
                >
                  {FIRST_BOOKING_COUPON_CODES.COOK}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bookingButton}>
            <Text
              style={styles.bookingButtonText}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
              numberOfLines={1}
            >
              Tap to Book
            </Text>
            <Icon name="arrow-forward" size={19} color="#FFFFFF" />
          </View>

          <Text
            style={[styles.termsText, { color: mutedColor }]}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            T&C apply · Valid on first booking only
          </Text>
        </LinearGradient>
      </View>
    </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: "hidden",
  },
  offerLabel: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.68)",
  },
  offerLabelText: {
    color: "#7C2D12",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  priceSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 14,
  },
  price: {
    color: "#1F1A10",
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 50,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  priceCaption: {
    color: "#57462A",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  couponSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(201, 162, 78, 0.35)",
    paddingTop: 12,
  },
  couponHeading: {
    color: "#57462A",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  couponList: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  couponChip: {
    flexGrow: 1,
    flexBasis: Platform.OS === "ios" ? 0 : "46%",
    flexShrink: Platform.OS === "ios" ? 1 : 0,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C9A24E",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  couponService: {
    color: "#8A6A2F",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  couponCode: {
    color: "#1F1A10",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
  },
  bookingButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#EA580C",
  },
  bookingButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
    flexShrink: 0,
  },
  termsText: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "500",
    alignSelf: "stretch",
  },
});

export default FirstBookingOffer;