/* eslint-disable */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  useWindowDimensions,
  Animated,
  RefreshControl,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import Snackbar from "react-native-snackbar";
import { useTranslation } from "react-i18next";
import PaymentInstance from "../services/paymentInstance";
import { useAppUser } from "../context/AppUserContext";
import {
  acceptEngagement,
  parseAcceptEngagementError,
  parseEngagementId,
} from "../services/engagementService";
import BookingRequestPanel from "./BookingRequestPanel";
import {
  InAppNotification,
  inAppToBookingRequestPayload,
  recipientParams,
  timeAgo,
  typeMeta,
} from "./inAppNotificationUtils";
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";
import { useTheme } from "../../src/Settings/ThemeContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChange?: (n: number) => void;
};

function asMetaRecord(m: unknown): Record<string, unknown> | null {
  if (m && typeof m === "object" && !Array.isArray(m)) {
    return m as Record<string, unknown>;
  }
  return null;
}

export default function NotificationsPage({
  visible,
  onClose,
  onUnreadCountChange,
}: Props) {
  const { t } = useTranslation();
  const { appUser } = useAppUser();
  const { colors, isDarkMode } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * 0.85);
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<InAppNotification | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');
  
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const r = useMemo(() => recipientParams(appUser), [appUser]);

  const setUnreadSafe = useCallback(
    (n: number) => {
      setUnread(n);
      onUnreadCountChange?.(n);
    },
    [onUnreadCountChange]
  );

  const bumpUnread = useCallback(
    (delta: number) => {
      setUnread((u) => {
        const next = Math.max(0, u + delta);
        onUnreadCountChange?.(next);
        return next;
      });
    },
    [onUnreadCountChange]
  );

  const fetchList = useCallback(async () => {
    if (!r) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await PaymentInstance.get("/api/in-app-notifications", {
        params: {
          recipientType: r.recipientType,
          recipientId: r.recipientId,
          limit: 100,
        },
      });
      const list = (data?.notifications || []) as InAppNotification[];
      setItems(list);
      const count = data?.unreadCount ?? 0;
      setUnreadSafe(Number(count));
    } catch (e: any) {
      setError(e?.message || "Could not load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [r, setUnreadSafe]);

  useEffect(() => {
    if (!visible || !r) return;
    void fetchList();
  }, [visible, r, fetchList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchList();
  }, [fetchList]);

  const markRead = useCallback(
    async (n: InAppNotification) => {
      if (!r || n.readAt) return;
      const rid = Number(r.recipientId);
      const nid = String(n.id ?? "").trim();
      if (!Number.isFinite(rid) || rid < 1 || !/^\d+$/.test(nid)) return;
      try {
        await PaymentInstance.patch(`/api/in-app-notifications/${nid}/read`, {
          recipientType: r.recipientType,
          recipientId: rid,
        }, {
          params: { recipientType: r.recipientType, recipientId: rid },
        });
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x
          )
        );
        bumpUnread(-1);
      } catch (e: any) {
        Snackbar.show({
          text: e?.response?.data?.error || e?.message || "Could not update notification",
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: "#f44336",
        });
      }
    },
    [r, bumpUnread]
  );

  const markAll = async () => {
    if (!r) return;
    try {
      await PaymentInstance.post("/api/in-app-notifications/read-all", {
        recipientType: r.recipientType,
        recipientId: r.recipientId,
      });
      setItems((prev) =>
        prev.map((x) => ({ ...x, readAt: x.readAt || new Date().toISOString() }))
      );
      setUnreadSafe(0);
      Snackbar.show({
        text: "All notifications marked as read",
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: "#4caf50",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const acceptFromList = useCallback(
    async (n: InAppNotification) => {
      if (!r || r.recipientType !== "provider") {
        Snackbar.show({
          text: "Sign in as a provider to accept",
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: "#f44336",
        });
        return;
      }
      const eid = parseEngagementId(n.engagementId);
      if (eid == null) return;
      setAcceptingId(n.id);
      setDetailError(null);
      try {
        const result = await acceptEngagement(eid, appUser);
        Snackbar.show({
          text: result.message,
          duration: Snackbar.LENGTH_SHORT,
          backgroundColor: "#4caf50",
        });
        setDetailFor((d) => (d != null && String(d.id) === String(n.id) ? null : d));
        await fetchList();
      } catch (e: unknown) {
        const msg = parseAcceptEngagementError(e);
        setDetailError(msg);
        Snackbar.show({ text: msg, duration: Snackbar.LENGTH_LONG, backgroundColor: "#f44336" });
      } finally {
        setAcceptingId(null);
      }
    },
    [r, appUser, fetchList]
  );

  const notInterested = useCallback(
    async (n: InAppNotification) => {
      if (!n.readAt) await markRead(n);
      setDetailFor((d) => (d?.id === n.id ? null : d));
    },
    [markRead]
  );

  const detailPayload = detailFor ? inAppToBookingRequestPayload(detailFor) : null;

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'unread') {
      return items.filter(item => !item.readAt);
    } else if (selectedFilter === 'read') {
      return items.filter(item => item.readAt);
    }
    return items;
  }, [items, selectedFilter]);

  const FilterChip = ({ label, value, count }: { label: string; value: 'all' | 'unread' | 'read'; count: number }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === value && styles.filterChipActive,
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        selectedFilter === value && styles.filterChipTextActive,
      ]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[
          styles.filterBadge,
          selectedFilter === value && styles.filterBadgeActive,
        ]}>
          <Text style={[
            styles.filterBadgeText,
            selectedFilter === value && styles.filterBadgeTextActive,
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderItem = ({ item: n, index }: { item: InAppNotification; index: number }) => {
    const unreadItem = !n.readAt;
    const meta = typeMeta(n.type);
    const metaRow = asMetaRecord(n.metadata);
    const tUpper = (n.type || "").toUpperCase();
    const isSpOndemandNewBooking =
      r?.recipientType === "provider" &&
      (tUpper === "NEW_BOOKING_OPPORTUNITY" || tUpper === "NEW_BOOKING_REQUEST");
    const isSpAssignedConfirmed =
      r?.recipientType === "provider" && tUpper === "ASSIGNED_BOOKING_CONFIRMED";
    const eid = parseEngagementId(n.engagementId);
    const hasBookingDetailPanel =
      (isSpOndemandNewBooking || isSpAssignedConfirmed) && eid != null;
    const canQuickAct = isSpOndemandNewBooking && unreadItem && hasBookingDetailPanel;

    return (
      <Animated.View
        style={[
          styles.itemWrapper,
          {
            opacity: slideAnim,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.itemCard,
            unreadItem && styles.itemUnread,
            { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }
          ]}
          activeOpacity={0.85}
          onPress={() => {
            if (isSpAssignedConfirmed && hasBookingDetailPanel) {
              setDetailError(null);
              setDetailFor(n);
              if (unreadItem) void markRead(n);
              return;
            }
            if (isSpOndemandNewBooking) return;
            if (unreadItem) void markRead(n);
          }}
        >
          <View style={styles.itemRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${meta.color}15` }]}>
              <LinearGradient
                colors={[meta.color, meta.color + 'CC']}
                style={styles.iconGradient}
              >
                <MaterialIcon name={meta.icon} size={22} color="#ffffff" />
              </LinearGradient>
            </View>
            <View style={styles.itemContent}>
              <View style={styles.titleRow}>
                <Text style={[styles.itemTitle, unreadItem && styles.itemTitleBold, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]} numberOfLines={2}>
                  {n.title}
                </Text>
                {unreadItem && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>New</Text>
                  </View>
                )}
              </View>
              {n.body ? (
                <Text style={[styles.itemBody, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                  {n.body}
                </Text>
              ) : null}
              {metaRow?.address ? (
                <View style={styles.metaLine}>
                  <MaterialIcon name="location-on" size={14} color={meta.color} />
                  <Text style={[styles.metaText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    {String(metaRow.address)}
                  </Text>
                </View>
              ) : null}
              {hasBookingDetailPanel && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewButton]}
                    onPress={() => {
                      setDetailError(null);
                      setDetailFor(n);
                      if (unreadItem && isSpAssignedConfirmed) void markRead(n);
                    }}
                  >
                    <MaterialIcon name="visibility" size={16} color="#3b82f6" />
                    <Text style={styles.viewButtonText}>View details</Text>
                  </TouchableOpacity>
                  {canQuickAct && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        disabled={acceptingId === n.id}
                        onPress={() => void acceptFromList(n)}
                      >
                        {acceptingId === n.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <MaterialIcon name="check" size={16} color="#ffffff" />
                            <Text style={styles.acceptButtonText}>Accept</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.declineButton]}
                        disabled={acceptingId === n.id}
                        onPress={() => void notInterested(n)}
                      >
                        <MaterialIcon name="close" size={16} color="#ef4444" />
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
              <View style={styles.itemFooter}>
                <View style={styles.categoryBadge}>
                  <MaterialIcon name={meta.icon} size={12} color={meta.color} />
                  <Text style={[styles.categoryText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  {timeAgo(n.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderGuest = () => (
    <View style={[styles.guestContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }]}>
      <View style={styles.guestIconWrapper}>
        <LinearGradient
          colors={[...BOOKING_HEADER_GRADIENT]}
          style={styles.guestIconGradient}
        >
          <MaterialIcon name="notifications-none" size={48} color="#ffffff" />
        </LinearGradient>
      </View>
      <Text style={[styles.guestTitle, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>
        Stay updated
      </Text>
      <Text style={[styles.guestText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
        Sign in as a customer or service provider to see booking and service updates here.
      </Text>
    </View>
  );

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [windowHeight, 0],
  });

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <Animated.View
            style={[
              styles.dialog,
              {
                transform: [{ translateY }],
                height: sheetHeight,
                width: windowWidth,
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
              }
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={[...BOOKING_HEADER_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <View style={styles.sheetHandle}>
                <View style={styles.sheetHandleBar} />
              </View>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <Text style={styles.headerBadge}>NOTIFICATIONS</Text>
                  <Text style={styles.headerTitle}>Activity Center</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcon name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <Text style={styles.headerSubtitle}>
                {r
                  ? unread > 0
                    ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}`
                    : "All caught up! No unread notifications"
                  : "Sign in to see your activity"}
              </Text>
            </LinearGradient>

            {/* Stats Bar */}
            {r && items.length > 0 && (
              <View style={[styles.statsBar, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff' }]}>
                <View style={styles.statItem}>
                  <MaterialIcon name="notifications" size={18} color="#3b82f6" />
                  <Text style={[styles.statNumber, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>
                    {items.length}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    Total
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcon name="markunread" size={18} color="#f59e0b" />
                  <Text style={[styles.statNumber, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>
                    {unread}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    Unread
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <MaterialIcon name="done-all" size={18} color="#10b981" />
                  <Text style={[styles.statNumber, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>
                    {items.length - unread}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    Read
                  </Text>
                </View>
              </View>
            )}

            {/* Filter Chips */}
            {r && items.length > 0 && (
              <View style={styles.filterContainer}>
                <FilterChip label="All" value="all" count={items.length} />
                <FilterChip label="Unread" value="unread" count={unread} />
                <FilterChip label="Read" value="read" count={items.length - unread} />
                {unread > 0 && (
                  <TouchableOpacity style={styles.markAllButton} onPress={markAll}>
                    <MaterialIcon name="done-all" size={18} color="#3b82f6" />
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Content */}
            <View style={[styles.body, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
              {!r ? (
                <ScrollView
                  contentContainerStyle={styles.centeredScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {renderGuest()}
                </ScrollView>
              ) : loading && items.length === 0 ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="#3b82f6" />
                  <Text style={[styles.loadingText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    Loading your activity…
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.centered}>
                  <MaterialIcon name="error-outline" size={48} color="#ef4444" />
                  <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => void fetchList()}>
                    <Text style={styles.retryText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredItems.length === 0 ? (
                <View style={styles.centered}>
                  <View style={styles.emptyIconWrapper}>
                    <MaterialIcon name={selectedFilter === 'unread' ? "markunread" : "inbox"} size={56} color="#cbd5e1" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: isDarkMode ? '#f8fafc' : '#0f172a' }]}>
                    {selectedFilter === 'unread' ? 'No unread notifications' : 'Nothing new yet'}
                  </Text>
                  <Text style={[styles.emptyText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                    {selectedFilter === 'unread'
                      ? "You've read all your notifications. Great job staying updated!"
                      : "When a booking is accepted, a visit starts, or a service completes, you will see it here."}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#3b82f6"
                      colors={["#3b82f6"]}
                    />
                  }
                />
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={visible && detailFor != null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setDetailFor(null);
          setDetailError(null);
        }}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => {
            setDetailFor(null);
            setDetailError(null);
          }} />
          <View style={[styles.detailDialog, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
            <TouchableOpacity
              style={styles.detailClose}
              onPress={() => {
                setDetailFor(null);
                setDetailError(null);
              }}
            >
              <LinearGradient
                colors={[...BOOKING_HEADER_GRADIENT]}
                style={styles.detailCloseGradient}
              >
                <MaterialIcon name="close" size={20} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            {detailFor && !detailPayload ? (
              <ScrollView contentContainerStyle={styles.centered}>
                <MaterialIcon name="info-outline" size={48} color="#94a3b8" />
                <Text style={[styles.emptyText, { marginTop: 16 }]}>
                  Booking details are not available for this item.
                </Text>
                <TouchableOpacity
                  style={styles.closeDetailButton}
                  onPress={() => {
                    setDetailFor(null);
                    setDetailError(null);
                  }}
                >
                  <Text style={styles.closeDetailButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
            {detailFor && detailPayload ? (
              <BookingRequestPanel
                engagement={detailPayload}
                onAccept={() => {
                  if (detailFor) void acceptFromList(detailFor);
                }}
                onReject={(engId) => {
                  if (detailFor && Number(detailFor.engagementId) === engId) {
                    void notInterested(detailFor);
                  }
                }}
                actionBusy={
                  detailFor != null &&
                  acceptingId != null &&
                  String(acceptingId) === String(detailFor.id)
                }
                errorText={detailError}
                headerCaption={`Engagement #${detailPayload.engagement_id}`}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  dialog: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    alignSelf: "center",
  },
  detailDialog: {
    alignSelf: "center",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    alignItems: "center",
    marginBottom: 12,
  },
  sheetHandleBar: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
  },
  headerBadge: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 8,
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: "#3b82f6",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  filterBadge: {
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },
  filterBadgeTextActive: {
    color: "#ffffff",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
  },
  body: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  itemWrapper: {
    marginBottom: 12,
  },
  itemCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  itemRow: {
    flexDirection: "row",
    gap: 14,
  },
  iconWrap: {
    borderRadius: 12,
    overflow: "hidden",
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  itemTitleBold: {
    fontWeight: "800",
  },
  newBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  viewButton: {
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  acceptButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  declineButton: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  declineButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 11,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  centeredScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginBottom: 12,
    textAlign: "center",
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  emptyIconWrapper: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  guestContainer: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    margin: 16,
  },
  guestIconWrapper: {
    marginBottom: 20,
  },
  guestIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  guestText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  detailClose: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 10,
  },
  detailCloseGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeDetailButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 10,
  },
  closeDetailButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});