import React, { useEffect, useState } from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const REGISTRATION_KEYBOARD_ACCESSORY_ID = "registration-keyboard-accessory";

export const registrationKeyboardInputProps =
  Platform.OS === "ios"
    ? { inputAccessoryViewID: REGISTRATION_KEYBOARD_ACCESSORY_ID }
    : {};

function KeyboardToolbar({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: () => void;
}) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity
        onPress={onCancel}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onDone}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

export function RegistrationKeyboardAccessory() {
  const dismissKeyboard = () => Keyboard.dismiss();

  if (Platform.OS === "ios") {
    return (
      <InputAccessoryView nativeID={REGISTRATION_KEYBOARD_ACCESSORY_ID}>
        <KeyboardToolbar onCancel={dismissKeyboard} onDone={dismissKeyboard} />
      </InputAccessoryView>
    );
  }

  return null;
}

export function RegistrationAndroidKeyboardBar() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;

    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (Platform.OS !== "android" || keyboardHeight === 0) {
    return null;
  }

  const dismissKeyboard = () => Keyboard.dismiss();

  return (
    <View style={[styles.androidWrap, { bottom: keyboardHeight }]}>
      <KeyboardToolbar onCancel={dismissKeyboard} onDone={dismissKeyboard} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 64,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#64748b",
  },
  doneText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2563eb",
    textAlign: "right",
  },
  androidWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 8,
  },
});
