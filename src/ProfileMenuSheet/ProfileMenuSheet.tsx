import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useAppUser } from "../context/AppUserContext";
import Settings from "../Settings/Settings"; // Import the Settings component
import { useTheme } from "../Settings/ThemeContext"; // Import useTheme

interface Props {
  visible: boolean;
  onClose: () => void;
  onProfile: () => void;
  onBookings: () => void;
  onDashboard: () => void;
  onWallet: () => void;
  onContact: () => void;
}

const ProfileMenuSheet: React.FC<Props> = ({
  visible,
  onClose,
  onProfile,
  onBookings,
  onDashboard,
  onWallet,
  onContact,
}) => {
  const { appUser } = useAppUser();
  const { colors } = useTheme(); // Get theme colors

  // State for settings modal
  const [showSettings, setShowSettings] = useState(false);

  const isCustomer = appUser?.role === "CUSTOMER";
  const isServiceProvider = appUser?.role === "SERVICE_PROVIDER";

  const handleSettingsPress = () => {
    onClose();
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // Handle contact press - now opens settings instead of direct contact
  const handleContactPress = () => {
    onClose();
    setShowSettings(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {appUser?.name || appUser?.email || "User"}
          </Text>

          {/* Profile - Always show for authenticated users */}
          <MenuItem 
            label="Profile" 
            icon="person" 
            onPress={onProfile} 
            colors={colors}
          />

          {/* Customer specific menu items */}
          {isCustomer && (
            <>
              <MenuItem 
                label="My Bookings" 
                icon="event-note" 
                onPress={onBookings} 
                colors={colors}
              />
              <MenuItem 
                label="Wallet" 
                icon="account-balance-wallet" 
                onPress={onWallet} 
                colors={colors}
              />
            </>
          )}

          {/* Service Provider specific menu items */}
          {isServiceProvider && (
            <>
              <MenuItem 
                label="Dashboard" 
                icon="dashboard" 
                onPress={onDashboard} 
                colors={colors}
              />
            </>
          )}

          {/* Settings button - now contains all settings including About and Contact */}
          <MenuItem 
            label="Settings" 
            icon="settings" 
            onPress={handleSettingsPress} 
            colors={colors}
          />
        </View>
      </Modal>

      {/* Settings Modal - contains all settings including About, Contact, and Terms */}
      <Settings visible={showSettings} onClose={handleCloseSettings} />
    </>
  );
};

// Updated MenuItem to use theme colors
const MenuItem = ({ label, icon, onPress, danger = false, colors }: any) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <MaterialIcon 
      name={icon} 
      size={22} 
      color={danger ? colors.error : colors.primary} 
    />
    <Text 
      style={[
        styles.itemText, 
        { 
          color: danger ? colors.error : colors.text,
        }
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  itemText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
});

export default ProfileMenuSheet;