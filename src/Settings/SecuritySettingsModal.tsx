import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "./ThemeContext";
import { BOOKING_HEADER_GRADIENT } from "../Constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SecuritySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 14, headingSize: 18, smallText: 12 };
      case 'large':
        return { textSize: 18, headingSize: 24, smallText: 16 };
      default:
        return { textSize: 16, headingSize: 20, smallText: 14 };
    }
  };

  const fontStyles = getFontSizeStyles();
  
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const iconGradient = isDarkMode ? ['#3b82f6', '#1d4ed8'] : ['#3b82f6', '#2563eb'];

  const handleChangePassword = () => {
    Alert.alert(
      "Change Password",
      "We will send a password reset link to your registered email address. Would you like to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send Link", 
          onPress: () => Alert.alert("Success", "Password reset link has been sent to your email.") 
        }
      ]
    );
  };

  const handleActiveSessions = () => {
    Alert.alert(
      "Active Sessions",
      "You are currently logged in on 1 device.\n\n• iPhone 14 Pro (This device)\nLocation: Bangalore, India",
      [
        { text: "Sign out of all other devices", style: "destructive", onPress: () => Alert.alert("Success", "You have been signed out of all other devices.") },
        { text: "Close", style: "cancel" }
      ]
    );
  };

  const handleRequestDataExport = () => {
    Alert.alert(
      "Request Data Export",
      "We will compile your personal data, including your profile and booking history, and send it to your email within 24 hours.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Request Export", onPress: () => Alert.alert("Success", "Your data export request has been received.") }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to completely delete your account? This action is irreversible. All your data, wallet balance, and bookings will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive", 
          onPress: () => Alert.alert("Account Deleted", "Your account deletion request has been submitted and will be processed within 30 days. You will be logged out now.") 
        }
      ]
    );
  };

  const SettingRow = ({ icon, label, description, rightElement, onPress, isDanger }: any) => (
    <TouchableOpacity 
      style={[
        styles.settingRow, 
        { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingRowLeft}>
        <LinearGradient colors={isDanger ? ['#ef4444', '#b91c1c'] : iconGradient} style={styles.settingIconBg}>
          <MaterialIcon name={icon} size={20} color="#ffffff" />
        </LinearGradient>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingLabel, { color: isDanger ? '#ef4444' : (isDarkMode ? '#f8fafc' : '#1e293b'), fontSize: fontStyles.textSize }]}>
            {label}
          </Text>
          {description && (
            <Text style={[styles.settingDescription, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      {rightElement ? rightElement : (
        onPress && <MaterialIcon name="chevron-right" size={24} color={isDarkMode ? '#64748b' : '#94a3b8'} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.bottomSheetOverlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.bottomSheetContent, 
                { 
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  paddingBottom: insets.bottom + 20,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {/* Bottom Sheet Header */}
              <View style={styles.bottomSheetHeader}>
                <View style={styles.bottomSheetHandle} />
                <View style={styles.bottomSheetTitleRow}>
                  <LinearGradient
                    colors={iconGradient}
                    style={styles.bottomSheetIconBg}
                  >
                    <MaterialIcon name="security" size={24} color="#ffffff" />
                  </LinearGradient>
                  <Text style={[styles.bottomSheetTitle, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.headingSize }]}>
                    Security Settings
                  </Text>
                  <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.bottomSheetCloseBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcon name="close" size={24} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Children / Items */}
              <ScrollView 
                style={styles.bottomSheetScrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
                    AUTHENTICATION & ACCESS
                  </Text>
                  <SettingRow 
                    icon="password" 
                    label="Change Password" 
                    description="Update your account password" 
                    onPress={handleChangePassword}
                  />
                  <SettingRow 
                    icon="fingerprint" 
                    label="Biometric Login" 
                    description="Use Face ID / Touch ID to open the app"
                    rightElement={
                      <Switch 
                        value={biometricsEnabled}
                        onValueChange={setBiometricsEnabled}
                        trackColor={{ false: isDarkMode ? '#334155' : '#cbd5e1', true: colors.primary }}
                        thumbColor="#ffffff"
                      />
                    }
                  />
                  <SettingRow 
                    icon="lock" 
                    label="App Lock" 
                    description="Require a PIN to unlock the app"
                    rightElement={
                      <Switch 
                        value={appLockEnabled}
                        onValueChange={setAppLockEnabled}
                        trackColor={{ false: isDarkMode ? '#334155' : '#cbd5e1', true: colors.primary }}
                        thumbColor="#ffffff"
                      />
                    }
                  />
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
                    ACCOUNT & DEVICES
                  </Text>
                  <SettingRow 
                    icon="devices" 
                    label="Active Sessions" 
                    description="Manage devices logged into your account" 
                    onPress={handleActiveSessions}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
                    DATA & COMPLIANCE
                  </Text>
                  <SettingRow 
                    icon="download" 
                    label="Request Data Export" 
                    description="Get a copy of your personal data" 
                    onPress={handleRequestDataExport}
                  />
                  <SettingRow 
                    icon="delete-forever" 
                    label="Delete Account" 
                    description="Permanently delete your account and data" 
                    onPress={handleDeleteAccount}
                    isDanger={true}
                  />
                </View>
                
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  bottomSheetHeader: {
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(150,150,150,0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSheetIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bottomSheetTitle: {
    flex: 1,
    fontWeight: '700',
  },
  bottomSheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(150,150,150,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetScrollView: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
  },
});

export default SecuritySettingsModal;
