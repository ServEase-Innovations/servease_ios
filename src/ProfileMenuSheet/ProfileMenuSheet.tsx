import React from "react";
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
  const { appUser, setAppUser } = useAppUser();

  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
          await clearSession({
            returnToUrl: "com.serveaso://logout",
          });
    
          dispatch(remove());
        //   setMenuVisible(false);
        //   setCurrentLocation(null);
        //   handleClick("sign_out");
        //   showInfoSnackbar("Signed out successfully");
        } catch (e) {
          console.log("Log out error:", e);
        //   showErrorSnackbar("Failed to sign out");
        }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <Text style={styles.userName}>
          {appUser?.name || appUser?.email}
        </Text>

        <MenuItem label="Profile" icon="person" onPress={onProfile} />

        {appUser?.role === "CUSTOMER" && (
          <MenuItem label="My Bookings" icon="event-note" onPress={onBookings} />
        )}

        {appUser?.role === "SERVICE_PROVIDER" && (
          <MenuItem label="Dashboard" icon="dashboard" onPress={onDashboard} />
        )}

        <MenuItem label="Wallet" icon="account-balance-wallet" onPress={onWallet} />
        <MenuItem label="Contact Us" icon="phone" onPress={onContact} />

        <MenuItem label="Sign Out" icon="logout" danger onPress={handleLogout} />
      </View>
    </Modal>
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
  },
});


export default ProfileMenuSheet;
