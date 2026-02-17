/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import Icon from 'react-native-vector-icons/Feather';
import StarIcon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { Chip } from 'react-native-paper';
import { useToast } from "../hooks/useToast";
import reviewsInstance from "../services/reviewsInstance";

const { width, height } = Dimensions.get('window');

// Define types based on the API response
interface ProviderRating {
  id: number;
  rating: string;
  review_count: number;
  grade: string;
  distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

interface Review {
  review_id: number;
  rating: number;
  review: string;
  service_type: string;
  created_at: number;
  customerName?: string;
}

interface ReviewsApiResponse {
  success: boolean;
  provider: ProviderRating;
  count: number;
  reviews: Review[];
}

interface ReviewsDialogProps {
  visible: boolean;
  onClose: () => void;
  serviceProviderId: number | null;
}

// Service type options
const SERVICE_TYPES = [
  { value: "ALL", label: "All Services" },
  { value: "ON_DEMAND", label: "On Demand" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "SHORT_TERM", label: "Short Term" }
];

// Get emoji based on rating
const getRatingEmoji = (rating: number): string => {
  switch (rating) {
    case 5: return "😍";
    case 4: return "😊";
    case 3: return "😐";
    case 2: return "😕";
    case 1: return "😞";
    default: return "👤";
  }
};

// Get grade color based on grade value
const getGradeColor = (grade: string): string => {
  const gradeValue = grade.replace(/[^A-Z]/g, '');
  
  switch(gradeValue) {
    case 'A':
    case 'A+':
    case 'A-': return '#059669';
    case 'B':
    case 'B+':
    case 'B-': return '#2563eb';
    case 'C':
    case 'C+':
    case 'C-': return '#d97706';
    case 'D': return '#ea580c';
    case 'F': return '#dc2626';
    default: return '#7c3aed';
  }
};

const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.skeletonItem}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonStars} />
          </View>
        </View>
        <View style={styles.skeletonText} />
      </View>
    ))}
  </View>
);

export function ReviewsDialog({ visible, onClose, serviceProviderId }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerRating, setProviderRating] = useState<ProviderRating | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("ALL");
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (visible && serviceProviderId) {
      fetchReviews();
    } else {
      // Reset state when modal closes
      resetState();
    }
  }, [visible, serviceProviderId]);

  useEffect(() => {
    if (selectedServiceType === "ALL") {
      setFilteredReviews(reviews);
    } else {
      const filtered = reviews.filter(
        review => review.service_type === selectedServiceType
      );
      setFilteredReviews(filtered);
    }
  }, [selectedServiceType, reviews]);

  const resetState = () => {
    setReviews([]);
    setFilteredReviews([]);
    setProviderRating(null);
    setAverageRating(0);
    setTotalReviews(0);
    setSelectedServiceType("ALL");
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const response = await reviewsInstance.get<ReviewsApiResponse>(
        `/reviews/providers/${serviceProviderId}/reviews`
      );
      
      if (response.data.success) {
        const { provider, reviews: reviewsData } = response.data;
        
        setProviderRating(provider);
        setAverageRating(parseFloat(provider.rating));
        setTotalReviews(provider.review_count);
        
        const processedReviews = reviewsData.map(review => ({
          ...review,
          customerName: `Customer ${review.review_id}`
        }));

        const sortedReviews = processedReviews.sort((a, b) => b.created_at - a.created_at);
        
        setReviews(sortedReviews);
        setFilteredReviews(sortedReviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType);
  };

  const renderStars = (rating: number, size: number = 12) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((index) => (
          <StarIcon
            key={index}
            name="star"
            size={size}
            color={index <= rating ? "#facc15" : "#d1d5db"}
            style={styles.star}
          />
        ))}
      </View>
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getServiceTypeLabel = (type: string): string => {
    switch (type) {
      case 'ON_DEMAND': return 'On Demand';
      case 'MONTHLY': return 'Monthly';
      case 'SHORT_TERM': return 'Short Term';
      default: return type;
    }
  };

  const getServiceTypeColor = (type: string): { bg: string; text: string } => {
    switch (type) {
      case 'ON_DEMAND': return { bg: '#dbeafe', text: '#1e40af' };
      case 'MONTHLY': return { bg: '#dcfce7', text: '#166534' };
      case 'SHORT_TERM': return { bg: '#f3e8ff', text: '#6b21a8' };
      default: return { bg: '#f3f4f6', text: '#1f2937' };
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header - Fixed at top */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.titleSection}>
                <StarIcon name="star" size={24} color="#ffffff" />
                <Text style={styles.title}>Customer Reviews</Text>
                {providerRating && (
                  <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(providerRating.grade) }]}>
                    <Text style={styles.gradeText}>{providerRating.grade}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtitle}>Feedback from your clients helps you improve</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="x" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {loading && reviews.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : (
              <>
                {/* Rating Summary */}
                {providerRating && (
                  <View style={styles.ratingCard}>
                    <View style={styles.ratingHeader}>
                      <View style={styles.ratingMain}>
                        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                        {renderStars(Math.round(averageRating), 16)}
                        <Text style={styles.ratingCount}>{totalReviews} total reviews</Text>
                      </View>
                      
                      <View style={styles.gradeContainer}>
                        <Text style={styles.gradeLabel}>Provider Grade</Text>
                        <View style={[styles.gradeCircle, { backgroundColor: getGradeColor(providerRating?.grade || 'B') }]}>
                          <Text style={styles.gradeCircleText}>{providerRating?.grade}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Distribution */}
                    <View style={styles.distributionContainer}>
                      <Text style={styles.distributionTitle}>Rating Distribution</Text>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = providerRating.distribution[stars.toString() as keyof typeof providerRating.distribution] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        
                        return (
                          <View key={stars} style={styles.distributionRow}>
                            <Text style={styles.distributionStar}>{stars} ★</Text>
                            <View style={styles.progressContainer}>
                              <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                            </View>
                            <Text style={styles.distributionCount}>{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Filter Section */}
                <View style={styles.filterSection}>
                  <View style={styles.filterLabelContainer}>
                    <Icon name="filter" size={16} color="#6b7280" />
                    <Text style={styles.filterTitle}>Filter by service type:</Text>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                  >
                    {SERVICE_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.filterChip,
                          selectedServiceType === type.value && styles.filterChipSelected
                        ]}
                        onPress={() => handleServiceTypeChange(type.value)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedServiceType === type.value && styles.filterChipTextSelected
                        ]}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Results Count */}
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsText}>
                    Showing {filteredReviews.length} {filteredReviews.length === 1 ? 'review' : 'reviews'}
                    {selectedServiceType !== 'ALL' && ` for ${getServiceTypeLabel(selectedServiceType)}`}
                  </Text>
                </View>

                {/* Reviews List */}
                <View style={styles.reviewsContainer}>
                  {filteredReviews.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon name="message-circle" size={64} color="#d1d5db" />
                      <Text style={styles.emptyStateTitle}>No reviews yet</Text>
                      <Text style={styles.emptyStateText}>
                        {selectedServiceType !== 'ALL' 
                          ? `No reviews for ${getServiceTypeLabel(selectedServiceType)} services`
                          : 'Reviews will appear here once clients rate your services'}
                      </Text>
                    </View>
                  ) : (
                    filteredReviews.map((review) => {
                      const serviceColors = getServiceTypeColor(review.service_type);
                      return (
                        <View key={review.review_id} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <View style={styles.reviewerInfo}>
                              <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{getRatingEmoji(review.rating)}</Text>
                              </View>
                              <View style={styles.reviewerDetails}>
                                <Text style={styles.reviewerName}>
                                  {review.customerName || 'Anonymous Customer'}
                                </Text>
                                <View style={styles.reviewMeta}>
                                  {renderStars(review.rating, 12)}
                                  <View style={[styles.serviceBadge, { backgroundColor: serviceColors.bg }]}>
                                    <Text style={[styles.serviceBadgeText, { color: serviceColors.text }]}>
                                      {getServiceTypeLabel(review.service_type)}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                            <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                          </View>
                          
                          <Text style={styles.reviewContent}>
                            {review.review || "No comment provided"}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.95,
    maxWidth: 600,
    height: height * 0.85, // Fixed height instead of maxHeight
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    marginRight: 40,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  gradeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  ratingCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingMain: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 2,
  },
  star: {
    marginHorizontal: 1,
  },
  ratingCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  gradeContainer: {
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  gradeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeCircleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  distributionContainer: {
    marginTop: 16,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  distributionStar: {
    fontSize: 12,
    color: '#4b5563',
    width: 40,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#facc15',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: '#6b7280',
    width: 30,
    textAlign: 'right',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 14,
    color: '#4b5563',
  },
  filterChipTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  avatarText: {
    fontSize: 20,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  reviewContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginLeft: 52,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 200,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Skeleton styles
  skeletonContainer: {
    padding: 20,
    gap: 16,
  },
  skeletonItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  skeletonHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    width: '60%',
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  skeletonStars: {
    height: 14,
    width: '40%',
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
  skeletonText: {
    height: 40,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginLeft: 52,
  },
});