import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Modal,
  Easing
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get("window");

interface SignupDrawerProps {
  visible: boolean;
  onClose: () => void;
  onUser: () => void;
  onProvider: () => void;
  onAgent: () => void;
}

const SignupDrawer: React.FC<SignupDrawerProps> = ({
  visible,
  onClose,
  onUser,
  onProvider,
  onAgent,
}) => {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 140,
          mass: 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={StyleSheet.absoluteFillObject}>
        {/* Backdrop (tap outside closes) */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('signupDrawer.title') || "Register as"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <MaterialIcon name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <TouchableOpacity style={styles.item} onPress={onUser}>
            <MaterialIcon name="person" size={24} color="#1c4485" />
            <Text style={styles.itemText}>{t('signupDrawer.user') || "User"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onProvider}>
            <MaterialIcon name="build" size={24} color="#1c4485" />
            <Text style={styles.itemText}>{t('signupDrawer.serviceProvider') || "Service Provider"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onAgent}>
            <MaterialIcon name="support-agent" size={24} color="#1c4485" />
            <Text style={styles.itemText}>{t('signupDrawer.agent') || "Agent"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  itemText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
});

export default SignupDrawer;