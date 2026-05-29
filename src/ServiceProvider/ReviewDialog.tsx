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
  useWindowDimensions,
} from "react-native";
import Icon from 'react-native-vector-icons/Feather';
import StarIcon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from "react-native-linear-gradient";
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";
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
    case 'B-': return '#3b82f6';
    case 'C':
    case 'C+':
    case 'C-': return '#f59e0b';
    case 'D': return '#ea580c';
    case 'F': return '#dc2626';
    default: return '#8b5cf6';
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerRating, setProviderRating] = useState<ProviderRating | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>("ALL");
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Responsive dimensions
  const modalWidth = Math.min(windowWidth * 0.92, 500);
  const modalHeight = windowHeight * 0.85;

  useEffect(() => {
    if (visible && serviceProviderId) {
      fetchReviews();
    } else {
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
    } finally {
      setLoading(false);
    }
  };

  const handleServiceTypeChange = (serviceType: string) => {
    setSelectedServiceType(serviceType);
  };

  const renderStars = (rating: number, size: number = 12) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((index) => (
        <StarIcon
          key={index}
          name="star"
          size={size}
          color={index <= rating ? "#facc15" : "#cbd5e1"}
          style={styles.star}
        />
      ))}
    </View>
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Yesterday";
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
      default: return { bg: '#f1f5f9', text: '#475569' };
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
        <View style={[styles.modalContainer, { width: modalWidth, height: modalHeight }]}>
          
          {/* Gradient Header */}
          <LinearGradient
            colors={[...BOOKING_HEADER_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.titleSection}>
                <View style={styles.titleIconContainer}>
                  <StarIcon name="star" size={22} color="#ffffff" />
                </View>
                <Text style={styles.title}>Reviews & Ratings</Text>
                {providerRating && (
                  <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(providerRating.grade) }]}>
                    <Text style={styles.gradeText}>{providerRating.grade}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtitle}>What customers are saying</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="x" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {loading && reviews.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : (
              <>
                {/* Rating Summary Card */}
                {providerRating && (
                  <LinearGradient
                    colors={["#ffffff", "#f8fafc"]}
                    style={styles.ratingCard}
                  >
                    <View style={styles.ratingHeader}>
                      <View style={styles.ratingMain}>
                        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                        {renderStars(Math.round(averageRating), 16)}
                        <Text style={styles.ratingCount}>
                          {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                        </Text>
                      </View>
                      
                      <View style={styles.gradeContainer}>
                        <Text style={styles.gradeLabel}>Provider Grade</Text>
                        <LinearGradient
                          colors={[getGradeColor(providerRating?.grade || 'B'), getGradeColor(providerRating?.grade || 'B') + 'CC']}
                          style={[styles.gradeCircle]}
                        >
                          <Text style={styles.gradeCircleText}>{providerRating?.grade}</Text>
                        </LinearGradient>
                      </View>
                    </View>

                    {/* Rating Distribution */}
                    <View style={styles.distributionContainer}>
                      <Text style={styles.distributionTitle}>Rating Distribution</Text>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = providerRating.distribution[stars.toString() as keyof typeof providerRating.distribution] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        
                        return (
                          <View key={stars} style={styles.distributionRow}>
                            <Text style={styles.distributionStar}>{stars} ★</Text>
                            <View style={styles.progressContainer}>
                              <LinearGradient
                                colors={["#facc15", "#fbbf24"]}
                                style={[styles.progressFill, { width: `${percentage}%` }]}
                              />
                            </View>
                            <Text style={styles.distributionCount}>{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </LinearGradient>
                )}

                {/* Filter Section */}
                <View style={styles.filterSection}>
                  <View style={styles.filterLabelContainer}>
                    <Icon name="filter" size={16} color="#64748b" />
                    <Text style={styles.filterTitle}>Filter by service type</Text>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                    contentContainerStyle={styles.filterScrollContent}
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
                        <LinearGradient
                          colors={selectedServiceType === type.value ? [...BOOKING_HEADER_GRADIENT] : ["#f1f5f9", "#f1f5f9"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.filterChipGradient}
                        >
                          <Text style={[
                            styles.filterChipText,
                            selectedServiceType === type.value && styles.filterChipTextSelected
                          ]}>
                            {type.label}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Results Count */}
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsText}>
                    {selectedServiceType === 'ALL' 
                      ? `Showing ${filteredReviews.length} ${filteredReviews.length === 1 ? 'review' : 'reviews'}`
                      : `${filteredReviews.length} ${filteredReviews.length === 1 ? 'review' : 'reviews'} for ${getServiceTypeLabel(selectedServiceType)}`
                    }
                  </Text>
                </View>

                {/* Reviews List */}
                <View style={styles.reviewsContainer}>
                  {filteredReviews.length === 0 ? (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyStateIconContainer}>
                        <Icon name="message-circle" size={48} color="#cbd5e1" />
                      </View>
                      <Text style={styles.emptyStateTitle}>No reviews yet</Text>
                      <Text style={styles.emptyStateText}>
                        {selectedServiceType !== 'ALL' 
                          ? `No reviews available for ${getServiceTypeLabel(selectedServiceType)} service`
                          : "Be the first to leave a review for this provider"}
                      </Text>
                    </View>
                  ) : (
                    filteredReviews.map((review) => {
                      const serviceColors = getServiceTypeColor(review.service_type);
                      return (
                        <View key={review.review_id} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <View style={styles.reviewerInfo}>
                              <LinearGradient
                                colors={["#f1f5f9", "#e2e8f0"]}
                                style={styles.avatar}
                              >
                                <Text style={styles.avatarText}>{getRatingEmoji(review.rating)}</Text>
                              </LinearGradient>
                              <View style={styles.reviewerDetails}>
                                <Text style={styles.reviewerName}>
                                  {review.customerName || "Anonymous Customer"}
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
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    gap: 10,
    flexWrap: 'wrap',
  },
  titleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gradeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContentContainer: {
    paddingBottom: 24,
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
    color: '#64748b',
  },
  ratingCard: {
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
  },
  ratingMain: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0f172a',
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
    color: '#64748b',
  },
  gradeContainer: {
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
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
    fontWeight: '800',
    color: '#ffffff',
  },
  distributionContainer: {
    marginTop: 8,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 6,
  },
  distributionStar: {
    fontSize: 12,
    color: '#475569',
    width: 42,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionCount: {
    fontSize: 12,
    color: '#64748b',
    width: 32,
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
    color: '#334155',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterScrollContent: {
    paddingRight: 16,
  },
  filterChip: {
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 10,
  },
  filterChipGradient: {
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  filterChipSelected: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  filterChipTextSelected: {
    color: '#ffffff',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 13,
    color: '#64748b',
  },
  reviewsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
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
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  reviewContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginLeft: 56,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonContainer: {
    padding: 16,
    gap: 16,
  },
  skeletonItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skeletonHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    width: '60%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  skeletonStars: {
    height: 14,
    width: '40%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  skeletonText: {
    height: 40,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginLeft: 56,
  },
});

export default ReviewsDialog;