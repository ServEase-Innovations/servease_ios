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
import { useAuth0 } from "react-native-auth0";
import { useAppUser } from "../context/AppUserContext";
import { useDispatch } from "react-redux";
import { remove } from "../features/userSlice";
import ContactUs from "../ContactUs/ContactUs"; // Adjust import path as needed
import AboutUs from "../AboutUs/AboutPage";
// import AboutUs from "../AboutUs/AboutPage"; // Adjust import path as needed

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
  const { clearSession } = useAuth0();
  const { appUser } = useAppUser();
  const dispatch = useDispatch();

  // State for modals
  const [showContactUs, setShowContactUs] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);

  const handleLogout = async () => {
    try {
      await clearSession({
        returnToUrl: "com.serveaso://logout",
      });

      dispatch(remove());
      onClose(); // Close the menu after logout
    } catch (e) {
      console.log("Log out error:", e);
    }
  };

  const handleContactPress = () => {
    onClose(); // Close the menu
    setShowContactUs(true); // Open Contact Us modal
  };

  const handleAboutPress = () => {
    onClose(); // Close the menu
    setShowAboutUs(true); // Open About Us modal
  };

  const handleCloseContactUs = () => {
    setShowContactUs(false);
  };

  const handleCloseAboutUs = () => {
    setShowAboutUs(false);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <Text style={styles.userName}>
            {appUser?.name || appUser?.email || "User"}
          </Text>

          <MenuItem label="Profile" icon="person" onPress={onProfile} />

          {appUser?.role === "CUSTOMER" && (
            <MenuItem label="My Bookings" icon="event-note" onPress={onBookings} />
          )}

          {appUser?.role === "SERVICE_PROVIDER" && (
            <MenuItem label="Dashboard" icon="dashboard" onPress={onDashboard} />
          )}

          <MenuItem label="Wallet" icon="account-balance-wallet" onPress={onWallet} />
          
          {/* New Menu Items */}
          <MenuItem label="Contact Us" icon="phone" onPress={handleContactPress} />
          <MenuItem label="About Us" icon="info" onPress={handleAboutPress} />

        </View>
      </Modal>

      {/* Contact Us Modal */}
      <Modal
        visible={showContactUs}
        animationType="slide"
        onRequestClose={handleCloseContactUs}
      >
        <ContactUs onBack={handleCloseContactUs} />
      </Modal>

      {/* About Us Modal */}
      <Modal
        visible={showAboutUs}
        animationType="slide"
        onRequestClose={handleCloseAboutUs}
      >
        <AboutUs onBack={handleCloseAboutUs} visible={showAboutUs} />
      </Modal>
    </>
  );
};

const MenuItem = ({ label, icon, onPress, danger = false }: any) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <MaterialIcon name={icon} size={22} color={danger ? "#ef4444" : "#111"} />
    <Text style={[styles.itemText, danger && { color: "#ef4444" }]}>
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
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30, // Add extra padding at bottom
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#111",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111",
  },
});

export default ProfileMenuSheet;