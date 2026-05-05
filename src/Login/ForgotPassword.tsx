// ForgotPassword.tsx - React Native CLI version with inline styles
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
} from 'react-native';
import axiosInstance from '../services/axiosInstance';

const { width, height } = Dimensions.get("window");

// Custom Snackbar Component
const CustomSnackbar: React.FC<{
  visible: boolean;
  message: string;
  severity: "success" | "error";
  onDismiss: () => void;
  autoHideDuration?: number;
}> = ({ visible, message, severity, onDismiss, autoHideDuration = 6000 }) => {
  const translateY = new Animated.Value(100);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 12,
        bounciness: 4,
      }).start();

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

  const backgroundColor = severity === "success" ? "#10b981" : "#ef4444";

  return (
    <Animated.View
      style={[
        styles.snackbarContainer,
        {
          transform: [{ translateY }],
          backgroundColor,
        },
      ]}
    >
      <Text style={styles.snackbarMessage}>{message}</Text>
      <TouchableOpacity onPress={handleDismiss} style={styles.snackbarCloseButton}>
        <Text style={styles.snackbarCloseText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
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

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };
  
  const handleUpdatePassword = async () => {
    // Validation: Ensure fields are filled and password is strong
    if (!emailOrUsername || !newPassword) {
      setSnackbarMessage('Please fill out all fields.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    // Check password strength
    if (passwordStrengthMessage) {
      setSnackbarMessage(passwordStrengthMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
  
    try {
      setIsUpdating(true);
      // Prepare data to send in the request body
      const requestData = {
        username: emailOrUsername,
        password: newPassword,
      };
  
      // Sending the PUT request using axiosInstance
      const response = await axiosInstance.put('/api/user/update', requestData);
  
      if (response.status === 200) {
        setSnackbarMessage('Password updated successfully!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        setEmailOrUsername('');
        setNewPassword(''); // Reset fields
        setPasswordStrengthMessage('');
        
        // Navigate back to login after successful update
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainContainer}>
          <View style={styles.wrapper}>
            <View style={styles.card}>
              <Text style={styles.title}>Update Password</Text>
              <Text style={styles.subtitle}>
                Enter your email/username and new password to update your account.
              </Text>
              
              <View style={styles.form}>
                <View>
                  <Text style={styles.label}>Email/Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email or username"
                    placeholderTextColor="#9ca3af"
                    value={emailOrUsername}
                    onChangeText={setEmailOrUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                
                <View>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your new password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        validatePassword(text);
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeIconText}>
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {passwordStrengthMessage !== '' && (
                  <Text style={styles.passwordStrengthMessage}>
                    {passwordStrengthMessage}
                  </Text>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    (passwordStrengthMessage !== '' || isUpdating) && styles.updateButtonDisabled
                  ]}
                  onPress={handleUpdatePassword}
                  disabled={passwordStrengthMessage !== '' || isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.updateButtonText}>Update</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.backLinkContainer}>
                <TouchableOpacity onPress={onBackToLogin}>
                  <Text style={styles.backLinkText}>Back to Login</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  mainContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  wrapper: {
    width: "100%",
    maxWidth: width * 0.9,
  },
  card: {
    borderRadius: 26,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 0,
    color: "#1f2937",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginVertical: 16,
    fontSize: 14,
  },
  form: {
    marginTop: 8,
    gap: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 18,
    fontWeight: "400",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    padding: 4,
  },
  eyeIconText: {
    fontSize: 20,
  },
  passwordStrengthMessage: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -8,
  },
  updateButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  backLinkContainer: {
    textAlign: "center",
    marginTop: 16,
    alignItems: "center",
  },
  backLinkText: {
    color: "#60a5fa",
    textDecorationLine: "underline",
    fontSize: 14,
  },
  snackbarContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  snackbarMessage: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  snackbarCloseButton: {
    padding: 4,
  },
  snackbarCloseText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ForgotPassword;