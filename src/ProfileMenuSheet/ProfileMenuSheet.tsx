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
import Settings from "../Settings/Settings";
import { useTheme } from "../Settings/ThemeContext";
import { useTranslation } from 'react-i18next';
import AgentRegistrationForm from "../Agent/AgentRegistrationForm";

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
  const { colors } = useTheme();
  const { t } = useTranslation();

  // State for settings modal
  const [showSettings, setShowSettings] = useState(false);
  
  // State for agent registration modal
  const [showAgentRegistration, setShowAgentRegistration] = useState(false);

  const isCustomer = appUser?.role === "CUSTOMER";
  const isServiceProvider = appUser?.role === "SERVICE_PROVIDER";
  const isAdmin = appUser?.role === "ADMIN";

  const handleSettingsPress = () => {
    onClose();
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleAgentRegistrationPress = () => {
    onClose();
    setShowAgentRegistration(true);
  };

  const handleCloseAgentRegistration = () => {
    setShowAgentRegistration(false);
  };

  const handleBackToLogin = (data: boolean) => {
    console.log("Back to login:", data);
    setShowAgentRegistration(false);
  };

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
            {appUser?.name || appUser?.email || t('profileMenu.user')}
          </Text>

          {/* Profile - Always show for authenticated users */}
          <MenuItem 
            label={t('profileMenu.profile')} 
            icon="person" 
            onPress={onProfile} 
            colors={colors}
          />

          {/* Customer specific menu items */}
          {isCustomer && (
            <>
              <MenuItem 
                label={t('profileMenu.myBookings')} 
                icon="event-note" 
                onPress={onBookings} 
                colors={colors}
              />
              <MenuItem 
                label={t('profileMenu.wallet')} 
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
                label={t('profileMenu.dashboard')} 
                icon="dashboard" 
                onPress={onDashboard} 
                colors={colors}
              />
            </>
          )}

          {/* Admin specific menu items - Add Agent Registration for Admin */}
          {isAdmin && (
            <MenuItem 
              label="Agent Registration" 
              icon="person-add" 
              onPress={handleAgentRegistrationPress} 
              colors={colors}
            />
          )}

          {/* Settings button */}
          <MenuItem 
            label={t('profileMenu.settings')} 
            icon="settings" 
            onPress={handleSettingsPress} 
            colors={colors}
          />
        </View>
      </Modal>

      {/* Settings Modal */}
      <Settings visible={showSettings} onClose={handleCloseSettings} />

      {/* Agent Registration Modal */}
      {showAgentRegistration && (
        <AgentRegistrationForm
          onBackToLogin={handleBackToLogin}
          onClose={handleCloseAgentRegistration}
        />
      )}
    </>
  );
};

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