// ForgotPassword.tsx - React Native CLI version with gradient header and modern redesign
/* eslint-disable */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axiosInstance from '../services/axiosInstance';
import { BOOKING_HEADER_GRADIENT } from '../theme/brandColors';
import { useTheme } from '../Settings/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive sizing functions
const scale = (size: number) => {
  const baseWidth = 375; // iPhone 6/7/8 width
  return (SCREEN_WIDTH / baseWidth) * size;
};

const verticalScale = (size: number) => {
  const baseHeight = 667; // iPhone 6/7/8 height
  return (SCREEN_HEIGHT / baseHeight) * size;
};

const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Custom Snackbar Component with Gradient
const CustomSnackbar: React.FC<{
  visible: boolean;
  message: string;
  severity: "success" | "error";
  onDismiss: () => void;
  autoHideDuration?: number;
}> = ({ visible, message, severity, onDismiss, autoHideDuration = 6000 }) => {
  const translateY = new Animated.Value(100);
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 12,
          bounciness: 4,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, autoHideDuration]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  const gradientColors = severity === "success" 
    ? ["#10b981", "#059669"] 
    : ["#ef4444", "#dc2626"];

  return (
    <Animated.View
      style={[
        styles.snackbarContainer,
        {
          transform: [{ translateY }],
          opacity: fadeAnim,
          left: moderateScale(20),
          right: moderateScale(20),
          bottom: verticalScale(20),
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.snackbarGradient}
      >
        <Text style={[styles.snackbarMessage, { fontSize: moderateScale(14) }]}>{message}</Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.snackbarCloseButton}>
          <Text style={[styles.snackbarCloseText, { fontSize: moderateScale(16) }]}>✕</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const { colors, isDarkMode } = useTheme();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Password strength validation
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length === 0) {
      setPasswordStrengthMessage('');
    } else if (password.length < minLength) {
      setPasswordStrengthMessage('Password must be at least 8 characters long.');
    } else if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      setPasswordStrengthMessage('Password must contain uppercase, lowercase, number, and special character.');
    } else {
      setPasswordStrengthMessage('');
    }
  };

  const getPasswordStrengthColor = () => {
    if (newPassword.length === 0) return '#e2e8f0';
    if (passwordStrengthMessage === '') return '#10b981';
    if (newPassword.length < 8) return '#f59e0b';
    return '#ef4444';
  };

  const getPasswordStrengthText = () => {
    if (newPassword.length === 0) return '';
    if (passwordStrengthMessage === '') return 'Strong password ✓';
    if (newPassword.length < 8) return 'Weak - Add more characters';
    return 'Weak - Add complexity';
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };
  
  const handleUpdatePassword = async () => {
    if (!emailOrUsername || !newPassword) {
      setSnackbarMessage('Please fill out all fields.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    if (passwordStrengthMessage) {
      setSnackbarMessage(passwordStrengthMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    try {
      setIsUpdating(true);
      const requestData = {
        username: emailOrUsername,
        password: newPassword,
      };
  
      const response = await axiosInstance.put('/api/user/update', requestData);
  
      if (response.status === 200) {
        setSnackbarMessage('Password updated successfully!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        setEmailOrUsername('');
        setNewPassword('');
        setPasswordStrengthMessage('');
        
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      } else {
        setSnackbarMessage('Failed to update password. Please try again.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setSnackbarMessage('An error occurred. Please try again later.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#0f172a' : '#f3f4f6' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: isDarkMode ? '#0f172a' : '#f3f4f6' }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : verticalScale(20)}
      >
        <LinearGradient
          colors={[...BOOKING_HEADER_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: Platform.OS === "ios" ? verticalScale(50) : verticalScale(40) }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={onBackToLogin} 
              style={[styles.backButton, { width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20) }]}
            >
              <Text style={[styles.backButtonText, { fontSize: moderateScale(24) }]}>←</Text>
            </TouchableOpacity>
            <View style={styles.backButtonPlaceholder} />
          </View>
          <Text style={[styles.headerTitle, { fontSize: moderateScale(28), marginTop: verticalScale(12) }]}>
            Reset Password
          </Text>
          <Text style={[styles.headerSubtitle, { fontSize: moderateScale(14), marginTop: verticalScale(4), paddingHorizontal: moderateScale(20) }]}>
            Create a new secure password for your account
          </Text>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.mainContainer}>
            <View style={[styles.wrapper, { maxWidth: moderateScale(400) }]}>
              <View style={[styles.card, { 
                backgroundColor: isDarkMode ? colors.card : '#ffffff', 
                borderColor: colors.border + '30',
                padding: moderateScale(24),
                borderRadius: moderateScale(24),
              }]}>
                <View style={[styles.iconContainer, { marginBottom: verticalScale(20) }]}>
                  <LinearGradient
                    colors={["#3b82f6", "#1e40af"]}
                    style={[styles.iconGradient, { width: moderateScale(72), height: moderateScale(72), borderRadius: moderateScale(36) }]}
                  >
                    <Text style={[styles.iconText, { fontSize: moderateScale(32) }]}>🔒</Text>
                  </LinearGradient>
                </View>
                
                <Text style={[styles.title, { 
                  color: isDarkMode ? '#f8fafc' : '#1f2937',
                  fontSize: moderateScale(24),
                  marginBottom: verticalScale(8),
                }]}>
                  Update Password
                </Text>
                <Text style={[styles.subtitle, { 
                  color: isDarkMode ? '#94a3b8' : '#6b7280',
                  fontSize: moderateScale(14),
                  marginBottom: verticalScale(24),
                  lineHeight: moderateScale(20),
                }]}>
                  Enter your email/username and create a new strong password
                </Text>
                
                <View style={[styles.form, { gap: verticalScale(20) }]}>
                  <View>
                    <Text style={[styles.label, { 
                      color: isDarkMode ? '#94a3b8' : '#374151',
                      fontSize: moderateScale(14),
                      marginBottom: verticalScale(8),
                    }]}>
                      Email / Username
                    </Text>
                    <View style={[styles.inputWrapper, { 
                      borderColor: colors.border, 
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      borderRadius: moderateScale(12),
                      paddingHorizontal: moderateScale(14),
                      height: verticalScale(52),
                    }]}>
                      <Text style={[styles.inputIcon, { fontSize: moderateScale(18), marginRight: moderateScale(10) }]}>📧</Text>
                      <TextInput
                        style={[styles.input, { 
                          color: isDarkMode ? '#f8fafc' : '#1f2937',
                          fontSize: moderateScale(15),
                          paddingVertical: verticalScale(12),
                        }]}
                        placeholder="Enter your email or username"
                        placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                        value={emailOrUsername}
                        onChangeText={setEmailOrUsername}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                  
                  <View>
                    <Text style={[styles.label, { 
                      color: isDarkMode ? '#94a3b8' : '#374151',
                      fontSize: moderateScale(14),
                      marginBottom: verticalScale(8),
                    }]}>
                      New Password
                    </Text>
                    <View style={[styles.inputWrapper, { 
                      borderColor: colors.border, 
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      borderRadius: moderateScale(12),
                      paddingHorizontal: moderateScale(14),
                      height: verticalScale(52),
                    }]}>
                      <Text style={[styles.inputIcon, { fontSize: moderateScale(18), marginRight: moderateScale(10) }]}>🔐</Text>
                      <TextInput
                        style={[styles.passwordInput, { 
                          color: isDarkMode ? '#f8fafc' : '#1f2937',
                          fontSize: moderateScale(15),
                          paddingVertical: verticalScale(12),
                        }]}
                        placeholder="Enter your new password"
                        placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          validatePassword(text);
                        }}
                      />
                      <TouchableOpacity
                        style={[styles.eyeIcon, { padding: moderateScale(8) }]}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Text style={[styles.eyeIconText, { fontSize: moderateScale(20) }]}>
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {newPassword.length > 0 && (
                    <View style={[styles.strengthContainer, { marginTop: verticalScale(-8) }]}>
                      <View style={[styles.strengthBar, { 
                        backgroundColor: getPasswordStrengthColor(), 
                        width: `${Math.min((newPassword.length / 20) * 100, 100)}%`,
                        height: verticalScale(4),
                        borderRadius: moderateScale(2),
                        marginBottom: verticalScale(6),
                      }]} />
                      <Text style={[styles.strengthText, { 
                        color: getPasswordStrengthColor(),
                        fontSize: moderateScale(11),
                      }]}>
                        {getPasswordStrengthText()}
                      </Text>
                    </View>
                  )}
                  
                  {passwordStrengthMessage !== '' && (
                    <View style={[styles.strengthMessageContainer, { 
                      marginTop: verticalScale(-8),
                      gap: moderateScale(6),
                    }]}>
                      <Text style={[styles.strengthIcon, { fontSize: moderateScale(12) }]}>⚠️</Text>
                      <Text style={[styles.passwordStrengthMessage, { 
                        color: '#ef4444',
                        fontSize: moderateScale(12),
                      }]}>
                        {passwordStrengthMessage}
                      </Text>
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={[
                      styles.updateButton,
                      (passwordStrengthMessage !== '' || isUpdating) && styles.updateButtonDisabled,
                      { borderRadius: moderateScale(12), marginTop: verticalScale(8) }
                    ]}
                    onPress={handleUpdatePassword}
                    disabled={passwordStrengthMessage !== '' || isUpdating}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={passwordStrengthMessage === '' && newPassword.length > 0 ? ["#10b981", "#059669"] : ["#3b82f6", "#1e40af"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.updateButtonGradient, { 
                        paddingVertical: verticalScale(14),
                        gap: moderateScale(8),
                      }]}
                    >
                      {isUpdating ? (
                        <ActivityIndicator color="#ffffff" size={moderateScale(20)} />
                      ) : (
                        <>
                          <Text style={[styles.updateButtonIcon, { fontSize: moderateScale(18) }]}>✓</Text>
                          <Text style={[styles.updateButtonText, { fontSize: moderateScale(16) }]}>Update Password</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.backLinkContainer, { marginTop: verticalScale(24) }]}>
                  <TouchableOpacity 
                    onPress={onBackToLogin} 
                    style={[styles.backLinkButton, { gap: moderateScale(6) }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.backLinkIcon, { fontSize: moderateScale(16) }]}>←</Text>
                    <Text style={[styles.backLinkText, { 
                      color: colors.primary,
                      fontSize: moderateScale(14),
                    }]}>
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        
        <CustomSnackbar
          visible={openSnackbar}
          message={snackbarMessage}
          severity={snackbarSeverity}
          onDismiss={handleSnackbarClose}
          autoHideDuration={6000}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: verticalScale(24),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.15,
    shadowRadius: verticalScale(12),
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(20),
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  backButtonPlaceholder: {
    width: moderateScale(40),
  },
  headerLogoContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerLogo: {
    width: moderateScale(100),
    height: verticalScale(50),
  },
  headerTitle: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(20),
  },
  mainContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    width: "100%",
  },
  card: {
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.1,
    shadowRadius: verticalScale(12),
    elevation: 5,
  },
  iconContainer: {
    alignItems: "center",
  },
  iconGradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {},
  title: {
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  form: {},
  label: {
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  inputIcon: {},
  input: {
    flex: 1,
  },
  passwordInput: {
    flex: 1,
  },
  eyeIcon: {},
  eyeIconText: {},
  strengthContainer: {},
  strengthBar: {},
  strengthText: {
    fontWeight: "500",
  },
  strengthMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  strengthIcon: {},
  passwordStrengthMessage: {
    flex: 1,
  },
  updateButton: {
    overflow: "hidden",
  },
  updateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonIcon: {
    color: "#ffffff",
    fontWeight: "600",
  },
  updateButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  backLinkContainer: {
    alignItems: "center",
  },
  backLinkButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backLinkIcon: {},
  backLinkText: {
    fontWeight: "600",
  },
  snackbarContainer: {
    position: "absolute",
    borderRadius: moderateScale(12),
    overflow: "hidden",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.2,
    shadowRadius: verticalScale(8),
    elevation: 8,
  },
  snackbarGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(14),
  },
  snackbarMessage: {
    color: "#ffffff",
    flex: 1,
    marginRight: moderateScale(12),
    fontWeight: "500",
  },
  snackbarCloseButton: {
    padding: moderateScale(4),
  },
  snackbarCloseText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

export default ForgotPassword;