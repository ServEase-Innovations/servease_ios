// AddReviewDialog.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Star } from 'lucide-react-native';
import { useTheme } from '../../src/Settings/ThemeContext';
import { useAppUser } from '../context/AppUserContext';
import {
  checkReviewEligibility,
  createReview,
  getEngagementIdFromBooking,
  reviewReasonMessage,
} from '../services/reviewsService';

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
  const { colors, fontSize } = useTheme();
  const { appUser } = useAppUser();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const customerId =
    appUser?.customerId != null
      ? Number(appUser.customerId)
      : appUser?.customerid != null
        ? Number(appUser.customerid)
        : undefined;

  const engagementId = booking ? getEngagementIdFromBooking(booking) : null;

  const fontSizes =
    fontSize === 'small'
      ? { title: 15, label: 13, input: 13, buttonText: 14 }
      : fontSize === 'large'
        ? { title: 18, label: 16, input: 16, buttonText: 18 }
        : { title: 16, label: 14, input: 14, buttonText: 16 };

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ visible: true, message, type });
    setTimeout(() => setSnackbar((s) => ({ ...s, visible: false })), 4000);
  };

  useEffect(() => {
    if (!visible || !engagementId) {
      setEligibilityMessage(null);
      return;
    }

    let cancelled = false;
    setCheckingEligibility(true);
    checkReviewEligibility(engagementId, customerId)
      .then((result) => {
        if (cancelled) return;
        setEligibilityMessage(
          result.eligible ? null : result.message || reviewReasonMessage(result.reason)
        );
      })
      .catch(() => {
        if (!cancelled) setEligibilityMessage(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingEligibility(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, engagementId, customerId]);

  const handleSubmit = async () => {
    if (!rating) {
      showSnackbar('Please provide a rating', 'error');
      return;
    }

    if (!booking || !engagementId) {
      showSnackbar('Service engagement information is missing', 'error');
      return;
    }

    if (eligibilityMessage) {
      showSnackbar(eligibilityMessage, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createReview({
        engagementId,
        rating,
        review: review.trim() || undefined,
        customerId,
      });

      if (result?.success === false) {
        throw new Error(
          result.message || reviewReasonMessage(result.reason, 'Failed to submit review')
        );
      }

      onReviewSubmitted(booking.id ?? engagementId);
      showSnackbar('Review submitted successfully!', 'success');

      setTimeout(() => {
        setRating(0);
        setReview('');
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const data = error.response?.data;
      const errorMessage =
        data?.message ||
        reviewReasonMessage(data?.reason) ||
        error.message ||
        'Failed to submit review. Please try again.';
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () =>
    [1, 2, 3, 4, 5].map((star) => (
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

  const submitDisabled =
    isSubmitting || checkingEligibility || !rating || !!eligibilityMessage || !engagementId;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={isSubmitting ? undefined : onClose}
      >
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.dialogContainer, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { fontSize: fontSizes.title }]}>Add Review</Text>
              <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {booking && (
                <View style={[styles.serviceInfo, { backgroundColor: colors.surface }]}>
                  <Text style={{ fontSize: fontSizes.label, color: colors.text, fontWeight: '500' }}>
                    Reviewing: {booking.service_type || booking.service || 'Service'}
                  </Text>
                  {booking.serviceProviderName ? (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      Provider: {booking.serviceProviderName}
                    </Text>
                  ) : null}
                </View>
              )}

              {checkingEligibility ? (
                <Text style={{ textAlign: 'center', color: colors.textSecondary, marginBottom: 8 }}>
                  Checking eligibility...
                </Text>
              ) : null}

              {eligibilityMessage ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>{eligibilityMessage}</Text>
                </View>
              ) : null}

              <View style={styles.ratingSection}>
                <Text style={[styles.label, { fontSize: fontSizes.label, color: colors.text }]}>
                  How would you rate this service? *
                </Text>
                <View style={styles.starsContainer}>{renderStars()}</View>
              </View>

              <View style={styles.reviewSection}>
                <Text style={[styles.label, { fontSize: fontSizes.label, color: colors.text }]}>
                  Your review (optional)
                </Text>
                <TextInput
                  value={review}
                  onChangeText={setReview}
                  style={[
                    styles.textInput,
                    {
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                  ]}
                  placeholder="Share your experience..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  maxLength={2000}
                  editable={!isSubmitting}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: submitDisabled ? colors.disabled : colors.primary },
                ]}
                onPress={handleSubmit}
                disabled={submitDisabled}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: fontSizes.buttonText }}>
                    Submit Review
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {snackbar.visible && (
        <View
          style={[
            styles.snackbar,
            { backgroundColor: snackbar.type === 'success' ? colors.success : colors.error },
          ]}
        >
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 450,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: '#fff', fontWeight: '600' },
  scrollView: { padding: 16 },
  serviceInfo: { borderRadius: 8, padding: 12, marginBottom: 12 },
  warningBox: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  warningText: { fontSize: 12, color: '#92400e' },
  ratingSection: { marginBottom: 16 },
  label: { marginBottom: 8, textAlign: 'center', fontWeight: '500' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  reviewSection: { marginBottom: 16 },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  snackbar: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  snackbarText: { color: '#fff', fontWeight: '500' },
});

export default AddReviewDialog;
