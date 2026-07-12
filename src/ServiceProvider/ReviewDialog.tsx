import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import StarIcon from "react-native-vector-icons/FontAwesome";
import { BRAND } from "../theme/brandColors";
import {
  fetchProviderReviews,
  type ProviderRatingSummary,
  type ProviderReview,
} from "../services/reviewsService";

interface ReviewsDialogProps {
  visible: boolean;
  onClose: () => void;
  serviceProviderId: number | null;
}

type FilterKey = "ALL" | "ON_DEMAND" | "MONTHLY" | "SHORT_TERM";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ON_DEMAND", label: "On demand" },
  { key: "MONTHLY", label: "Monthly" },
  { key: "SHORT_TERM", label: "Short term" },
];

function getGradeColor(grade: string): string {
  const g = grade.replace(/[^A-Z]/g, "");
  if (g.startsWith("A")) return "#059669";
  if (g.startsWith("B")) return BRAND.accent;
  if (g.startsWith("C")) return "#d97706";
  if (g === "D") return "#ea580c";
  if (g === "F") return "#dc2626";
  return BRAND.textMuted;
}

function getServiceTypeLabel(type: string): string {
  switch (type) {
    case "ON_DEMAND":
      return "On demand";
    case "MONTHLY":
      return "Monthly";
    case "SHORT_TERM":
      return "Short term";
    default:
      return type;
  }
}

function getServiceTypeStyle(type: string): { bg: string; text: string } {
  switch (type) {
    case "ON_DEMAND":
      return { bg: BRAND.accentSoft, text: BRAND.accent };
    case "MONTHLY":
      return { bg: "#ecfdf5", text: "#059669" };
    case "SHORT_TERM":
      return { bg: "#f5f3ff", text: "#6d28d9" };
    default:
      return { bg: BRAND.canvas, text: BRAND.textMuted };
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function renderStars(rating: number, size = 14) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          name="star"
          size={size}
          color={i <= rating ? "#f59e0b" : BRAND.line}
          style={styles.starGap}
        />
      ))}
    </View>
  );
}

export function ReviewsDialog({ visible, onClose, serviceProviderId }: ReviewsDialogProps) {
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [providerRating, setProviderRating] = useState<ProviderRatingSummary | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("ALL");
  const [loadError, setLoadError] = useState(false);

  const averageRating = providerRating?.rating ?? 0;
  const totalReviews = providerRating?.review_count ?? 0;

  const loadReviews = useCallback(async () => {
    if (!serviceProviderId) return;

    try {
      setLoadError(false);
      const data = await fetchProviderReviews(serviceProviderId, { limit: 100 });
      setProviderRating(data.provider);
      setReviews(data.reviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setLoadError(true);
      Alert.alert("Error", "Failed to load reviews. Please try again.");
    }
  }, [serviceProviderId]);

  useEffect(() => {
    if (visible && serviceProviderId) {
      setLoading(true);
      loadReviews().finally(() => setLoading(false));
    } else if (!visible) {
      setReviews([]);
      setProviderRating(null);
      setSelectedFilter("ALL");
      setLoadError(false);
    }
  }, [visible, serviceProviderId, loadReviews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const filteredReviews = useMemo(() => {
    if (selectedFilter === "ALL") return reviews;
    return reviews.filter((r) => r.service_type === selectedFilter);
  }, [reviews, selectedFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
      ALL: reviews.length,
      ON_DEMAND: 0,
      MONTHLY: 0,
      SHORT_TERM: 0,
    };
    reviews.forEach((r) => {
      const key = r.service_type as FilterKey;
      if (key in counts && key !== "ALL") counts[key] += 1;
    });
    return counts;
  }, [reviews]);

  const renderReviewCard = (item: ProviderReview, index: number, total: number) => {
    const serviceStyle = getServiceTypeStyle(item.service_type);
    const hasText = Boolean(item.review?.trim());

    return (
      <View key={item.review_id} style={[styles.reviewCard, index < total - 1 && styles.reviewCardBorder]}>
        <View style={styles.reviewTop}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeValue}>{item.rating.toFixed(1)}</Text>
            <MaterialIcon name="star" size={12} color="#f59e0b" />
          </View>
          <View style={styles.reviewMetaCol}>
            {renderStars(item.rating, 12)}
            <View style={[styles.servicePill, { backgroundColor: serviceStyle.bg }]}>
              <Text style={[styles.servicePillText, { color: serviceStyle.text }]}>
                {getServiceTypeLabel(item.service_type)}
              </Text>
            </View>
          </View>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>
        {item.customer_name ? (
          <Text style={styles.customerName}>{item.customer_name}</Text>
        ) : null}
        <Text style={[styles.reviewBody, !hasText && styles.reviewBodyMuted]}>
          {hasText ? item.review : "No written feedback"}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.sheet}>
          <View style={styles.headerAccent} />
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcon name="star-rate" size={22} color={BRAND.accent} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Customer reviews</Text>
              <Text style={styles.headerSubtitle}>Ratings and feedback from your clients</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <MaterialIcon name="close" size={22} color={BRAND.textMuted} />
            </TouchableOpacity>
          </View>

          {loading && !refreshing && reviews.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={BRAND.bookingSky} />
              <Text style={styles.centeredText}>Loading reviews...</Text>
            </View>
          ) : loadError && reviews.length === 0 ? (
            <View style={styles.centered}>
              <MaterialIcon name="error-outline" size={40} color={BRAND.textMuted} />
              <Text style={styles.emptyTitle}>Could not load reviews</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadReviews().finally(() => setLoading(false)); }}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.bookingSky} />
              }
            >
              {providerRating ? (
                <View style={styles.heroCard}>
                  <View style={styles.heroAccent} />
                  <View style={styles.heroRow}>
                    <View style={styles.heroLeft}>
                      <Text style={styles.heroScore}>{averageRating.toFixed(1)}</Text>
                      {renderStars(Math.round(averageRating), 16)}
                      <Text style={styles.heroCount}>
                        {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                      </Text>
                    </View>
                    <View style={styles.gradeBlock}>
                      <Text style={styles.gradeLabel}>Provider grade</Text>
                      <View style={[styles.gradeCircle, { backgroundColor: getGradeColor(providerRating.grade) }]}>
                        <Text style={styles.gradeText}>{providerRating.grade}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}

              {providerRating && totalReviews > 0 ? (
                <View style={styles.distCard}>
                  <Text style={styles.sectionTitle}>Rating breakdown</Text>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count =
                      providerRating.distribution[String(stars) as "1" | "2" | "3" | "4" | "5"] ?? 0;
                    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <View key={stars} style={styles.distRow}>
                        <Text style={styles.distLabel}>{stars}</Text>
                        <MaterialIcon name="star" size={12} color="#f59e0b" />
                        <View style={styles.distTrack}>
                          <View style={[styles.distFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.distCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View style={styles.segmentWrap}>
                {FILTER_TABS.map(({ key, label }) => {
                  const active = selectedFilter === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.segment, active && styles.segmentActive]}
                      onPress={() => setSelectedFilter(key)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
                      <View style={[styles.segmentCount, active && styles.segmentCountActive]}>
                        <Text style={[styles.segmentCountText, active && styles.segmentCountTextActive]}>
                          {filterCounts[key]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>
                {filteredReviews.length} {filteredReviews.length === 1 ? "review" : "reviews"}
                {selectedFilter !== "ALL" ? ` · ${getServiceTypeLabel(selectedFilter)}` : ""}
              </Text>

              <View style={styles.listCard}>
                {filteredReviews.length === 0 ? (
                  <View style={styles.listEmpty}>
                    <MaterialIcon name="rate-review" size={36} color={BRAND.textMuted} />
                    <Text style={styles.emptyTitle}>No reviews yet</Text>
                    <Text style={styles.emptyDesc}>
                      {selectedFilter !== "ALL"
                        ? `No reviews for ${getServiceTypeLabel(selectedFilter)} services yet.`
                        : "When customers rate your work, reviews will show up here."}
                    </Text>
                  </View>
                ) : (
                  filteredReviews.map((r, i, arr) => renderReviewCard(r, i, arr.length))
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BRAND.canvas },
  sheet: { flex: 1, backgroundColor: BRAND.canvas },
  headerAccent: { height: 3, backgroundColor: BRAND.accent },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BRAND.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: { flex: 1, marginLeft: 12, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BRAND.text },
  headerSubtitle: { fontSize: 12, color: BRAND.textMuted, marginTop: 2, fontWeight: "500" },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  centeredText: { fontSize: 14, color: BRAND.textMuted },
  heroCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    marginBottom: 12,
    overflow: "hidden",
  },
  heroAccent: { height: 4, backgroundColor: BRAND.accent },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  heroLeft: { alignItems: "flex-start" },
  heroScore: { fontSize: 42, fontWeight: "800", color: BRAND.text, letterSpacing: -1 },
  heroCount: { fontSize: 13, color: BRAND.textMuted, marginTop: 6, fontWeight: "500" },
  starsRow: { flexDirection: "row", marginTop: 6 },
  starGap: { marginRight: 2 },
  gradeBlock: { alignItems: "center" },
  gradeLabel: { fontSize: 11, color: BRAND.textMuted, fontWeight: "600", marginBottom: 8 },
  gradeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  distCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  distRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  distLabel: { width: 14, fontSize: 12, fontWeight: "600", color: BRAND.text },
  distTrack: {
    flex: 1,
    height: 8,
    backgroundColor: BRAND.canvas,
    borderRadius: 4,
    overflow: "hidden",
  },
  distFill: { height: "100%", backgroundColor: "#fbbf24", borderRadius: 4 },
  distCount: { width: 24, fontSize: 12, color: BRAND.textMuted, textAlign: "right" },
  segmentWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  segmentActive: { backgroundColor: BRAND.accent, borderColor: BRAND.accent },
  segmentLabel: { fontSize: 13, fontWeight: "600", color: BRAND.textMuted },
  segmentLabelActive: { color: "#fff" },
  segmentCount: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: BRAND.canvas,
    alignItems: "center",
  },
  segmentCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  segmentCountText: { fontSize: 11, fontWeight: "700", color: BRAND.textMuted },
  segmentCountTextActive: { color: "#fff" },
  listCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.line,
    overflow: "hidden",
  },
  listEmpty: { alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: BRAND.text, marginTop: 12 },
  emptyDesc: {
    fontSize: 13,
    color: BRAND.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  reviewCard: { padding: 16 },
  reviewCardBorder: { borderBottomWidth: 1, borderBottomColor: BRAND.line },
  reviewTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadgeValue: { fontSize: 14, fontWeight: "800", color: "#b45309" },
  reviewMetaCol: { flex: 1, gap: 6 },
  servicePill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  servicePillText: { fontSize: 10, fontWeight: "700" },
  reviewDate: { fontSize: 11, color: BRAND.textMuted, fontWeight: "500" },
  customerName: { fontSize: 13, fontWeight: "600", color: BRAND.text, marginBottom: 6 },
  reviewBody: { fontSize: 14, color: BRAND.text, lineHeight: 21 },
  reviewBodyMuted: { color: BRAND.textMuted, fontStyle: "italic" },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: BRAND.accent,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

export default ReviewsDialog;
