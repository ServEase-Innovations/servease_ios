import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, Dimensions, Platform } from "react-native";
import { Text } from "../theme/BrandTypography";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HIGHLIGHT_FEATURES = [
  {
    icon: "verified-user",
    title: "100% Verified Pros",
    desc: "Background checked cooks, maids & nannies",
  },
  {
    icon: "near-me",
    title: "Neighborhood Matching",
    desc: "Quick arrival from helpers nearby",
  },
  {
    icon: "event-available",
    title: "Flexible Scheduling",
    desc: "Single-day, recurring & monthly slots",
  },
];

type BrandLoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

const BrandLoadingScreen: React.FC<BrandLoadingScreenProps> = ({
  title = "Getting things ready",
  subtitle = "Setting up trusted household help in your neighborhood",
}) => {
  const barTranslate = useRef(new Animated.Value(-120)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(14)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const ambientShiftA = useRef(new Animated.Value(0)).current;
  const ambientShiftB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Intro entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 45,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(contentTranslateY, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Infinite progress bar animation
    const progressLoop = Animated.loop(
      Animated.timing(barTranslate, {
        toValue: 260,
        duration: 1400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    );

    // Subtle breathing pulse on logo
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.025,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Floating animation
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Ambient floating lights
    const ambientLoopA = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientShiftA, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientShiftA, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const ambientLoopB = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientShiftB, {
          toValue: 1,
          duration: 16000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientShiftB, {
          toValue: 0,
          duration: 16000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    progressLoop.start();
    breathingLoop.start();
    floatLoop.start();
    ambientLoopA.start();
    ambientLoopB.start();

    return () => {
      progressLoop.stop();
      breathingLoop.stop();
      floatLoop.stop();
      ambientLoopA.stop();
      ambientLoopB.stop();
    };
  }, [ambientShiftA, ambientShiftB, barTranslate, contentOpacity, contentTranslateY, floatAnim, logoOpacity, logoScale, pulseScale]);

  const ambientAX = ambientShiftA.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15],
  });
  const ambientAY = ambientShiftA.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 12],
  });
  const ambientAScale = ambientShiftA.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const ambientBX = ambientShiftB.interpolate({
    inputRange: [0, 1],
    outputRange: [15, -15],
  });
  const ambientBY = ambientShiftB.interpolate({
    inputRange: [0, 1],
    outputRange: [12, -10],
  });
  const ambientBScale = ambientShiftB.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 0.95],
  });

  return (
    <View style={styles.wrapper}>
      {/* Light sky-blue brand gradient */}
      <LinearGradient
        colors={["#00BFFF", "#0284C7", "#0369A1"]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Decorative ambient glowing circles */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientCircle,
          styles.ambientA,
          {
            transform: [
              { translateX: ambientAX },
              { translateY: ambientAY },
              { scale: ambientAScale },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambientCircle,
          styles.ambientB,
          {
            transform: [
              { translateX: ambientBX },
              { translateY: ambientBY },
              { scale: ambientBScale },
            ],
          },
        ]}
      />

      {/* Main Container */}
      <View style={styles.centerContainer}>
        {/* Logo with gentle float and pulse */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [
                { scale: Animated.multiply(logoScale, pulseScale) },
                { translateY: floatAnim },
              ],
            },
          ]}
        >
          <View style={styles.logoHalo} />
          <Animated.Image
            source={require("../../assets/images/fulllogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Informative Hub: Title, Progress Bar, and All Key Info Visible at Once */}
        <Animated.View
          style={[
            styles.metaContainer,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {/* Smooth liquid progress bar */}
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.bar,
                { transform: [{ translateX: barTranslate }] },
              ]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.15)", "#FFFFFF", "rgba(224,242,254,0.95)"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.barGradient}
              />
            </Animated.View>
          </View>

          {/* All Information in 1 Card (No tabs, no cycling) */}
          <View style={styles.infoCard}>
            {HIGHLIGHT_FEATURES.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.infoRow}>
                  <View style={styles.iconWrap}>
                    <MaterialIcon name={item.icon} size={20} color="#0284C7" />
                  </View>
                  <View style={styles.infoTextCol}>
                    <Text style={styles.infoItemTitle}>{item.title}</Text>
                    <Text style={styles.infoItemDesc}>{item.desc}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Footer Tagline */}
      <View style={styles.footerWrap} pointerEvents="none">
        <Text style={styles.footerText}>Book trusted household help in minutes</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  ambientCircle: {
    position: "absolute",
    width: Math.min(SCREEN_WIDTH * 0.95, 420),
    height: Math.min(SCREEN_WIDTH * 0.95, 420),
    borderRadius: Math.min(SCREEN_WIDTH * 0.95, 420) / 2,
  },
  ambientA: {
    top: "6%",
    left: -120,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  ambientB: {
    bottom: "5%",
    right: -130,
    backgroundColor: "rgba(186, 230, 253, 0.18)",
  },
  centerContainer: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  logoHalo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    transform: [{ scale: 1.15 }],
  },
  logo: {
    width: 175,
    height: 175,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
      },
      android: {
        elevation: 7,
      },
    }),
  },
  metaContainer: {
    width: "100%",
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 24,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.12)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    marginTop: 4,
    maxWidth: 320,
    color: "rgba(240, 249, 255, 0.92)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  track: {
    width: "100%",
    maxWidth: 180,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 16,
  },
  bar: {
    width: 70,
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  barGradient: {
    flex: 1,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    ...Platform.select({
      ios: {
        shadowColor: "#003254",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 16,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E2E8F0",
    marginLeft: 44,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTextCol: {
    flex: 1,
    minWidth: 0,
  },
  infoItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  infoItemDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
    lineHeight: 15,
  },
  footerWrap: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    letterSpacing: 0.4,
    textAlign: "center",
    textTransform: "uppercase",
  },
});

export default BrandLoadingScreen;
