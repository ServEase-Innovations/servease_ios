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


  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose} // Android back button
    >
      <View style={StyleSheet.absoluteFill}>
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
            <Text style={styles.title}>Register As</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <MaterialIcon name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <TouchableOpacity style={styles.item} onPress={onUser}>
            <MaterialIcon name="person" size={20} />
            <Text>User</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onProvider}>
            <MaterialIcon name="build" size={20} />
            <Text>Service Provider</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={onAgent}>
            <MaterialIcon name="support-agent" size={20} />
            <Text>Agent</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
});

export default SignupDrawer;
