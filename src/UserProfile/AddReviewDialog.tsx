// AddReviewDialog.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { useAuth0 } from 'react-native-auth0';
import axiosInstance from '../services/axiosInstance';
import { useTheme } from '../../src/Settings/ThemeContext';

interface AddReviewDialogProps {
  visible: boolean;
  onClose: () => void;
  booking: any;
  onReviewSubmitted: (bookingId: number) => void;
}

const AddReviewDialog: React.FC<AddReviewDialogProps> = ({
  visible,
  onClose,
  booking,
  onReviewSubmitted,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });
  const { user: auth0User } = useAuth0();

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          title: 15,
          serviceText: 13,
          providerText: 11,
          label: 13,
          input: 13,
          buttonText: 14,
          snackbarText: 13,
        };
      case 'large':
        return {
          title: 18,
          serviceText: 16,
          providerText: 14,
          label: 16,
          input: 16,
          buttonText: 18,
          snackbarText: 16,
        };
      default:
        return {
          title: 16,
          serviceText: 14,
          providerText: 12,
          label: 14,
          input: 14,
          buttonText: 16,
          snackbarText: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => setSnackbar({ ...snackbar, visible: false }), 4000);
  };

  const handleSubmit = async () => {
    if (!rating) {
      showSnackbar('Please provide a rating', 'error');
      return;
    }

    if (!booking || !auth0User) {
      showSnackbar('Missing required information', 'error');
      return;
    }

    if (!booking.serviceProviderId) {
      showSnackbar('Service provider information is missing', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId: auth0User.customerid,
        customerName: auth0User.customerName,
        serviceProviderId: booking.serviceProviderId,
        rating: rating,
        comment: review.trim() || 'No comment provided',
      };

      await axiosInstance.post('/api/customer/add-feedback', payload);
      
      onReviewSubmitted(booking.id);
      
      showSnackbar('Review submitted successfully!', 'success');
      
      setTimeout(() => {
        setRating(0);
        setReview('');
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review. Please try again.';
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => !isSubmitting && setRating(star)}
        disabled={isSubmitting}
      >
        <Star
          size={32}
          color={rating >= star ? colors.rating : colors.border}
          fill={rating >= star ? colors.rating : 'transparent'}
        />
      </TouchableOpacity>
    ));
  };

  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    dialogContainer: {
      width: '100%',
      maxWidth: 450,
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#111827', // Keeping dark background like React version for contrast
      paddingHorizontal: 16,
      paddingVertical: 12,
      height: 48,
    },
    title: {
      fontSize: fontSizes.title,
      fontWeight: '600',
      color: '#ffffff',
    },
    closeButton: {
      padding: 4,
    },
    scrollView: {
      padding: 16,
    },
    serviceInfo: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    serviceText: {
      fontSize: fontSizes.serviceText,
      fontWeight: '500',
      color: colors.text,
    },
    providerText: {
      fontSize: fontSizes.providerText,
      color: colors.textSecondary,
      marginTop: 4,
    },
    ratingSection: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    label: {
      fontSize: fontSizes.label,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    reviewSection: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: fontSizes.input,
      minHeight: 100,
      textAlignVertical: 'top',
      color: colors.text,
      backgroundColor: colors.card,
    },
    submitButtonContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: colors.disabled,
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#ffffff',
      fontWeight: '500',
      fontSize: fontSizes.buttonText,
    },
    snackbar: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    snackbarSuccess: {
      backgroundColor: colors.success,
    },
    snackbarError: {
      backgroundColor: colors.error,
    },
    snackbarText: {
      color: '#ffffff',
      fontWeight: '500',
      fontSize: fontSizes.snackbarText,
    },
  });

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={isSubmitting ? undefined : onClose}
      >
        <View style={dynamicStyles.overlay}>
          <View style={dynamicStyles.dialogContainer}>
            {/* Header - Updated to match React version */}
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.title}>Add Review</Text>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                style={dynamicStyles.closeButton}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={dynamicStyles.scrollView}>
              {/* Service Information */}
              {booking && (
                <View style={dynamicStyles.serviceInfo}>
                  <Text style={dynamicStyles.serviceText}>
                    Reviewing service:{' '}
                    {booking.service_type
                      ? booking.service_type.charAt(0).toUpperCase() +
                        booking.service_type.slice(1).toLowerCase()
                      : 'Unknown Service'}
                  </Text>
                  <Text style={dynamicStyles.providerText}>
                    Provider: {booking.serviceProviderName || 'Not specified'}
                  </Text>
                </View>
              )}

              {/* Star Rating */}
              <View style={dynamicStyles.ratingSection}>
                <Text style={dynamicStyles.label}>
                  How would you rate this service? *
                </Text>
                <View style={dynamicStyles.starsContainer}>{renderStars()}</View>
              </View>

              {/* Review Input */}
              <View style={dynamicStyles.reviewSection}>
                <Text style={dynamicStyles.label}>Your review (optional)</Text>
                <TextInput
                  value={review}
                  onChangeText={setReview}
                  style={dynamicStyles.textInput}
                  placeholder="Share your experience with this service..."
                  placeholderTextColor={colors.placeholder}
                  multiline={true}
                  numberOfLines={6}
                  editable={!isSubmitting}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button Only (like React version) */}
              <View style={dynamicStyles.submitButtonContainer}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.submitButton,
                    (!rating || isSubmitting) && dynamicStyles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!rating || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={dynamicStyles.submitButtonText}>Submit Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Snackbar Implementation */}
      {snackbar.visible && (
        <View style={[
          dynamicStyles.snackbar,
          snackbar.type === 'success' ? dynamicStyles.snackbarSuccess : dynamicStyles.snackbarError
        ]}>
          <Text style={dynamicStyles.snackbarText}>{snackbar.message}</Text>
        </View>
      )}
    </>
  );
};

export default AddReviewDialog;