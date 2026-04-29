import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

type BrandLoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

const BrandLoadingScreen: React.FC<BrandLoadingScreenProps> = ({
  title = "Getting things ready",
  subtitle = "We're loading the latest service information for you",
}) => {
  const barTranslate = useRef(new Animated.Value(-100)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const ambientShiftA = useRef(new Animated.Value(0)).current;
  const ambientShiftB = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(16)).current;
  const cardScale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const barLoop = Animated.loop(
      Animated.timing(barTranslate, {
        toValue: 300,
        duration: 1350,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    );

    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.02,
          duration: 1750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const ambientLoopA = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientShiftA, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientShiftA, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const ambientLoopB = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientShiftB, {
          toValue: 1,
          duration: 22000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ambientShiftB, {
          toValue: 0,
          duration: 22000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    barLoop.start();
    logoLoop.start();
    ambientLoopA.start();
    ambientLoopB.start();

    return () => {
      barLoop.stop();
      logoLoop.stop();
      ambientLoopA.stop();
      ambientLoopB.stop();
    };
  }, [ambientShiftA, ambientShiftB, barTranslate, cardOpacity, cardScale, cardTranslateY, logoScale, screenOpacity]);

  const ambientAX = ambientShiftA.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 4],
  });
  const ambientAY = ambientShiftA.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 8],
  });
  const ambientAScale = ambientShiftA.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const ambientBX = ambientShiftB.interpolate({
    inputRange: [0, 1],
    outputRange: [4, -8],
  });
  const ambientBY = ambientShiftB.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -4],
  });
  const ambientBScale = ambientShiftB.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 0.98],
  });

  return (
    <Animated.View style={[styles.wrapper, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={["#0b6fbd", "#04488f", "#01254a", "#000d1a"]}
        locations={[0, 0.24, 0.62, 1]}
        start={{ x: 0.5, y: -0.2 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.ambientCircle,
          styles.ambientA,
          { transform: [{ translateX: ambientAX }, { translateY: ambientAY }, { scale: ambientAScale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.ambientCircle,
          styles.ambientB,
          { transform: [{ translateX: ambientBX }, { translateY: ambientBY }, { scale: ambientBScale }] },
        ]}
      />
      <View style={styles.vignette} />

      <Animated.View
        style={[
          styles.card,
          { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }, { scale: cardScale }] },
        ]}
      >
        <Animated.Image
          source={require("../../assets/images/serveasologo.png")}
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />

        <View style={styles.track}>
          <Animated.View style={[styles.bar, { transform: [{ translateX: barTranslate }] }]}>
            <LinearGradient
              colors={["rgba(255,255,255,0.1)", "#ffffff", "rgba(200,235,255,0.95)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.barGradient}
            />
          </Animated.View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 24,
  },
  ambientCircle: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.45,
  },
  ambientA: {
    top: "12%",
    left: -110,
    backgroundColor: "rgba(120, 200, 255, 0.35)",
  },
  ambientB: {
    bottom: "9%",
    right: -120,
    backgroundColor: "rgba(0, 180, 200, 0.25)",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 10, 30, 0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 416,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 34,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 26,
    elevation: 10,
  },
  logo: {
    width: 240,
    height: 106,
    marginBottom: 20,
  },
  track: {
    width: "100%",
    maxWidth: 200,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    marginBottom: 20,
  },
  bar: {
    width: 80,
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
    shadowColor: "#96dcff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  barGradient: {
    flex: 1,
  },
  title: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.36,
    lineHeight: 24,
    textAlign: "center",
  },
  subtitle: {
    marginTop: -3,
    maxWidth: 320,
    color: "rgba(220,240,255,0.7)",
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.14,
    textAlign: "center",
  },
});

export default BrandLoadingScreen;
