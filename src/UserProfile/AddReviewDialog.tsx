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
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });
  const { user: auth0User } = useAuth0();

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
          color={rating >= star ? '#fbbf24' : '#d1d5db'}
          fill={rating >= star ? '#fbbf24' : 'transparent'}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={isSubmitting ? undefined : onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.dialogContainer}>
            {/* Header - Updated to match React version */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Review</Text>
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                style={styles.closeButton}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {/* Service Information */}
              {booking && (
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceText}>
                    Reviewing service:{' '}
                    {booking.service_type
                      ? booking.service_type.charAt(0).toUpperCase() +
                        booking.service_type.slice(1).toLowerCase()
                      : 'Unknown Service'}
                  </Text>
                  <Text style={styles.providerText}>
                    Provider: {booking.serviceProviderName || 'Not specified'}
                  </Text>
                </View>
              )}

              {/* Star Rating */}
              <View style={styles.ratingSection}>
                <Text style={styles.label}>
                  How would you rate this service? *
                </Text>
                <View style={styles.starsContainer}>{renderStars()}</View>
              </View>

              {/* Review Input */}
              <View style={styles.reviewSection}>
                <Text style={styles.label}>Your review (optional)</Text>
                <TextInput
                  value={review}
                  onChangeText={setReview}
                  style={styles.textInput}
                  placeholder="Share your experience with this service..."
                  placeholderTextColor="#9ca3af"
                  multiline={true}
                  numberOfLines={6}
                  editable={!isSubmitting}
                  textAlignVertical="top"
                />
              </View>

              {/* Submit Button Only (like React version) */}
              <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!rating || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!rating || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Review</Text>
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
          styles.snackbar,
          snackbar.type === 'success' ? styles.snackbarSuccess : styles.snackbarError
        ]}>
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827', // Dark background like React version
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  title: {
    fontSize: 16,
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
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  serviceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  providerText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  ratingSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reviewSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#1f2937',
  },
  submitButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  snackbarSuccess: {
    backgroundColor: '#4caf50',
  },
  snackbarError: {
    backgroundColor: '#f44336',
  },
  snackbarText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default AddReviewDialog;