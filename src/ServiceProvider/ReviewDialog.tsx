import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Star, User, Calendar, MessageSquare, X } from 'lucide-react-native';
import { useToast } from '../hooks/useToast';
import axiosInstance from '../services/axiosInstance';

interface Review {
  id: number;
  customerId: number;
  customerName: string | null;
  serviceProviderId: number;
  rating: number;
  comment: string;
  commentedOn: string;
  serviceType?: string;
  response?: string;
  respondedAt?: string;
}

interface ReviewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceProviderId: number | null;
}

// SkeletonLoader Component
const SkeletonLoader = () => {
  return (
    <View style={styles.skeletonContainer}>
      {/* Rating Summary Skeleton */}
      <View style={styles.skeletonRatingSummary}>
        <View style={styles.skeletonRatingGrid}>
          <View style={styles.skeletonRatingItem}>
            <View style={styles.skeletonNumber} />
            <View style={styles.skeletonStarsContainer}>
              {Array.from({ length: 5 }).map((_, i) => (
                <View key={i} style={styles.skeletonStar} />
              ))}
            </View>
            <View style={styles.skeletonLabel} />
          </View>
          
          <View style={styles.skeletonRatingItem}>
            <View style={styles.skeletonNumber} />
            <View style={styles.skeletonLabel} />
          </View>
          
          <View style={styles.skeletonDistribution}>
            {[5, 4, 3, 2, 1].map((stars) => (
              <View key={stars} style={styles.skeletonRatingBarContainer}>
                <View style={styles.skeletonStarLabel} />
                <View style={styles.skeletonStarSmall} />
                <View style={styles.skeletonRatingBarBackground}>
                  <View style={[styles.skeletonRatingBarFill, { width: `${Math.random() * 70 + 10}%` }]} />
                </View>
                <View style={styles.skeletonRatingCount} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Review Items Skeleton */}
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonReviewCard}>
          <View style={styles.skeletonReviewHeader}>
            <View style={styles.skeletonReviewerInfo}>
              <View style={styles.skeletonAvatar} />
              <View>
                <View style={styles.skeletonName} />
                <View style={styles.skeletonRatingBadgeContainer}>
                  <View style={styles.skeletonStarsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <View key={i} style={styles.skeletonStarSmall} />
                    ))}
                  </View>
                  <View style={styles.skeletonBadge} />
                </View>
              </View>
            </View>
            <View style={styles.skeletonDate} />
          </View>

          <View style={styles.skeletonCommentContainer}>
            <View style={styles.skeletonCommentLine} />
            <View style={[styles.skeletonCommentLine, { width: '80%' }]} />
            <View style={[styles.skeletonCommentLine, { width: '60%' }]} />
          </View>

          <View style={styles.skeletonResponseContainer}>
            <View style={styles.skeletonResponseTitle} />
            <View style={styles.skeletonResponseText} />
          </View>
        </View>
      ))}
    </View>
  );
};

export function ReviewsDialog({ open, onOpenChange, serviceProviderId }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && serviceProviderId) {
      fetchReviews();
    }
  }, [open, serviceProviderId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/customer/get-feedback-by-service-provider/${serviceProviderId}`
      );
      
      if (response.status === 200) {
        const reviewsData: Review[] = response.data;
        
        // Process the API response
        const processedReviews = reviewsData.map(review => ({
          ...review,
          customerName: review.customerName || "Test User",
          createdAt: review.commentedOn,
          serviceType: review.serviceType || "Service",
          bookingId: review.id
        }));

        // Sort reviews by date in descending order (newest first)
        const sortedReviews = processedReviews.sort((a, b) => {
          return new Date(b.commentedOn).getTime() - new Date(a.commentedOn).getTime();
        });

        setReviews(sortedReviews);
        
        // Calculate average rating
        const totalRating = sortedReviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = sortedReviews.length > 0 ? totalRating / sortedReviews.length : 0;
        setAverageRating(avgRating);
        
        // Set total reviews
        setTotalReviews(sortedReviews.length);
        
        // Calculate rating distribution (1-5 stars)
        const distribution = [0, 0, 0, 0, 0];
        sortedReviews.forEach(review => {
          if (review.rating >= 1 && review.rating <= 5) {
            distribution[review.rating - 1]++;
          }
        });
        setRatingDistribution(distribution);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
      
      // Fallback to empty state instead of mock data
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
      setRatingDistribution([0, 0, 0, 0, 0]);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        color={index < rating ? "#fbbf24" : "#d1d5db"}
        fill={index < rating ? "#fbbf24" : "transparent"}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.dialogContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Star size={24} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.title}>Customer Reviews</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Feedback from your clients helps you improve your services
          </Text>

          {loading ? (
            <SkeletonLoader />
          ) : (
            <ScrollView style={styles.scrollView}>
              {/* Rating Summary */}
              <View style={styles.ratingSummary}>
                <View style={styles.ratingGrid}>
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
                    <View style={styles.starsContainer}>
                      {renderStars(Math.round(averageRating))}
                    </View>
                    <Text style={styles.ratingLabel}>Average Rating</Text>
                  </View>
                  
                  <View style={styles.ratingItem}>
                    <Text style={styles.ratingNumber}>{totalReviews}</Text>
                    <Text style={styles.ratingLabel}>Total Reviews</Text>
                  </View>
                  
                  <View style={styles.ratingDistribution}>
                    {[5, 4, 3, 2, 1].map((stars, index) => (
                      <View key={stars} style={styles.ratingBarContainer}>
                        <Text style={styles.starLabel}>{stars}</Text>
                        <Star size={12} color="#fbbf24" fill="#fbbf24" />
                        <View style={styles.ratingBarBackground}>
                          <View
                            style={[
                              styles.ratingBarFill,
                              {
                                width: `${(ratingDistribution[5 - stars] / Math.max(1, totalReviews)) * 100}%`
                              }
                            ]}
                          />
                        </View>
                        <Text style={styles.ratingCount}>
                          {ratingDistribution[5 - stars]}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Reviews List */}
              <View style={styles.reviewsList}>
                {reviews.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MessageSquare size={48} color="#d1d5db" />
                    <Text style={styles.emptyText}>No reviews yet</Text>
                    <Text style={styles.emptySubtext}>
                      Your reviews will appear here once clients rate your services
                    </Text>
                  </View>
                ) : (
                  reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          <View style={styles.avatar}>
                            <User size={20} color="#2563eb" />
                          </View>
                          <View>
                            <Text style={styles.reviewerName}>{review.customerName}</Text>
                            <View style={styles.ratingBadgeContainer}>
                              <View style={styles.starsRow}>
                                {renderStars(review.rating)}
                              </View>
                              <View style={styles.serviceBadge}>
                                <Text style={styles.serviceBadgeText}>{review.serviceType}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <View style={styles.dateContainer}>
                          <Calendar size={16} color="#6b7280" />
                          <Text style={styles.dateText}>
                            {formatDate(review.commentedOn)}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.reviewComment}>{review.comment}</Text>

                      {review.response && (
                        <View style={styles.responseContainer}>
                          <View style={styles.responseHeader}>
                            <Text style={styles.responseTitle}>Your Response</Text>
                            {review.respondedAt && (
                              <Text style={styles.responseDate}>
                                {formatDate(review.respondedAt)}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.responseText}>{review.response}</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButtonMain}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  ratingSummary: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  ratingGrid: {
    flexDirection: 'column',
    gap: 20,
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 2,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#1e40af',
  },
  ratingDistribution: {
    gap: 8,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starLabel: {
    fontSize: 12,
    fontWeight: '500',
    width: 12,
    textAlign: 'center',
  },
  ratingBarBackground: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 10,
    color: '#6b7280',
    width: 16,
    textAlign: 'right',
  },
  reviewsList: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  ratingBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  serviceBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: 12,
    color: '#374151',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  responseContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  responseDate: {
    fontSize: 11,
    color: '#6b7280',
  },
  responseText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  closeButtonMain: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  // Skeleton styles
  skeletonContainer: {
    gap: 24,
  },
  skeletonRatingSummary: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  skeletonRatingGrid: {
    flexDirection: 'column',
    gap: 20,
  },
  skeletonRatingItem: {
    alignItems: 'center',
  },
  skeletonNumber: {
    height: 32,
    width: 64,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonStarsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 2,
  },
  skeletonStar: {
    width: 16,
    height: 16,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  skeletonLabel: {
    height: 14,
    width: 100,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginTop: 4,
  },
  skeletonDistribution: {
    gap: 8,
  },
  skeletonRatingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skeletonStarLabel: {
    width: 12,
    height: 12,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  skeletonStarSmall: {
    width: 12,
    height: 12,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  skeletonRatingBarBackground: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
  },
  skeletonRatingBarFill: {
    height: '100%',
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonRatingCount: {
    width: 16,
    height: 10,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  skeletonReviewCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  skeletonReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skeletonReviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#cbd5e1',
  },
  skeletonName: {
    height: 16,
    width: 120,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonRatingBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  skeletonStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    backgroundColor: '#cbd5e1',
    borderRadius: 12,
  },
  skeletonDate: {
    width: 80,
    height: 14,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonCommentContainer: {
    gap: 6,
    marginBottom: 12,
  },
  skeletonCommentLine: {
    height: 14,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonResponseContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonResponseTitle: {
    height: 12,
    width: 100,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonResponseText: {
    height: 12,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
});