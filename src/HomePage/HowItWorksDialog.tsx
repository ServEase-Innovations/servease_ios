import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../Settings/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_MAX_HEIGHT = 580;
const DISMISS_DRAG = 60;
const HEADER_DRAG_ZONE = 80;

const STEPS = [
  {
    id: "step1",
    title: "Choose a Service",
    description: "Select from our range of verified professionals for cooking, cleaning, or caregiving.",
    icon: "search",
    color: "#0b5bd3", // Blue
    gradient: ["#dbeafe", "#bfdbfe"],
  },
  {
    id: "step2",
    title: "Pick Your Schedule",
    description: "Set a time and date that works perfectly for your lifestyle and needs.",
    icon: "calendar",
    color: "#059669", // Emerald
    gradient: ["#d1fae5", "#a7f3d0"],
  },
  {
    id: "step3",
    title: "Sit Back & Relax",
    description: "We handle the rest. Enjoy peace of mind and a perfectly managed home.",
    icon: "star",
    color: "#7c3aed", // Purple
    gradient: ["#ede9fe", "#ddd6fe"],
  },
];

interface HowItWorksDialogProps {
  visible: boolean;
  onClose: () => void;
}

const HowItWorksDialog: React.FC<HowItWorksDialogProps> = ({ visible, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Staggered fade animations for steps
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  const dragStartY = useRef(0);

  const dismissSheet = useCallback(() => {
    dragY.setValue(0);
    onClose();
  }, [dragY, onClose]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.setValue(0);
      stepAnims.forEach(anim => anim.setValue(0));
      
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 70,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Staggered animation for the steps after the sheet opens
        Animated.stagger(120, 
          stepAnims.map(anim => 
            Animated.spring(anim, {
              toValue: 1,
              useNativeDriver: true,
              friction: 8,
              tension: 60,
            })
          )
        ).start();
      });
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        dragY.setValue(0);
      });
    }
  }, [visible, mounted, slideAnim, dragY, fadeAnim, stepAnims]);

  const finishDismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);
      dismissSheet();
    });
  }, [slideAnim, dragY, dismissSheet]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => {
          const inHeader = dragStartY.current <= HEADER_DRAG_ZONE;
          return inHeader && gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        },
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const inHeader = dragStartY.current <= HEADER_DRAG_ZONE;
          return inHeader && gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx);
        },
        onPanResponderGrant: (evt) => {
          dragStartY.current = evt.nativeEvent.locationY;
        },
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            dragY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > DISMISS_DRAG || gesture.vy > 0.45) {
            finishDismiss();
            return;
          }
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY, finishDismiss]
  );

  if (!mounted) return null;

  const surface = isDarkMode ? colors.surface : "#FFFFFF";
  const textPrimary = isDarkMode ? colors.textPrimary : "#0F172A";
  const textMuted = isDarkMode ? colors.textSecondary : "#64748B";
  const sheetTranslateY = Animated.add(slideAnim, dragY);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={dismissSheet}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback onPress={dismissSheet}>
            <View style={styles.backdropTap} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: surface,
              maxHeight: SHEET_MAX_HEIGHT,
              paddingBottom: Math.max(insets.bottom, 24),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }]} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerEyebrow, { color: colors.primary }]}>Getting Started</Text>
              <Text style={[styles.headerTitle, { color: textPrimary }]}>How it works</Text>
            </View>
            <TouchableOpacity
              onPress={dismissSheet}
              style={[styles.closeBtn, { backgroundColor: isDarkMode ? colors.card : "#F1F5F9" }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={20} color={textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.timelineContainer}>
            {/* The vertical connector line behind the steps */}
            <View style={[styles.connectorLine, { backgroundColor: isDarkMode ? "#334155" : "#E2E8F0" }]} />
            
            {STEPS.map((step, index) => {
              const translateY = stepAnims[index].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              });
              
              return (
                <Animated.View 
                  key={step.id} 
                  style={[
                    styles.stepRow, 
                    { 
                      opacity: stepAnims[index],
                      transform: [{ translateY }]
                    }
                  ]}
                >
                  <View style={styles.iconColumn}>
                    <LinearGradient
                      colors={isDarkMode ? ["#334155", "#1e293b"] : step.gradient}
                      style={styles.iconWrap}
                    >
                      <Icon name={step.icon} size={20} color={isDarkMode ? "#fff" : step.color} />
                    </LinearGradient>
                  </View>
                  
                  <View style={styles.textColumn}>
                    <Text style={[styles.stepTitle, { color: textPrimary }]}>
                      {index + 1}. {step.title}
                    </Text>
                    <Text style={[styles.stepDescription, { color: textMuted }]}>
                      {step.description}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </View>

          <TouchableOpacity style={[styles.ctaButton, { backgroundColor: colors.primary }]} onPress={dismissSheet}>
            <Text style={styles.ctaText}>Got it, let's go!</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0, 0, 0, 0.45)" },
  backdropTap: { flex: 1 },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  handleWrap: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  handle: { width: 50, height: 6, borderRadius: 4 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTextWrap: { flex: 1, paddingRight: 12 },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineContainer: {
    paddingHorizontal: 28,
    position: "relative",
    paddingBottom: 24,
  },
  connectorLine: {
    position: "absolute",
    left: 52, // 28 (padding) + 24 (half of iconWrap width)
    top: 24,
    bottom: 40,
    width: 2,
    zIndex: 0,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 32,
    zIndex: 1,
  },
  iconColumn: {
    marginRight: 20,
    alignItems: "center",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textColumn: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
  ctaButton: {
    marginHorizontal: 28,
    marginBottom: 16,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default HowItWorksDialog;
