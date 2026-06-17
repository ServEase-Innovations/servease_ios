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
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import AutoCancelledBookingCard from "./AutoCancelledBookingCard";
import {
  InAppNotification,
  inAppToBookingRequestPayload,
  isAutoCancelledNoProviderType,
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

function dedupeNotifications(list: InAppNotification[]): InAppNotification[] {
  const byKey = new Map<string, InAppNotification>();
  for (const n of list) {
    const key = `${n.type}|${n.engagementId ?? ""}|${n.title}`;
    const existing = byKey.get(key);
    if (!existing || new Date(n.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      byKey.set(key, n);
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default function NotificationsPage({
  visible,
  onClose,
  onUnreadCountChange,
}: Props) {
  const { t } = useTranslation();
  const { appUser } = useAppUser();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * 0.88);
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<InAppNotification | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');

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
    let list = items;
    if (selectedFilter === 'unread') {
      list = items.filter(item => !item.readAt);
    } else if (selectedFilter === 'read') {
      list = items.filter(item => item.readAt);
    }
    return dedupeNotifications(list);
  }, [items, selectedFilter]);

  const readCount = Math.max(0, items.length - unread);

  const FilterChip = ({ label, value }: { label: string; value: 'all' | 'unread' | 'read' }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0' },
        selectedFilter === value && styles.filterChipActive,
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterChipText,
        { color: isDarkMode ? '#cbd5e1' : '#64748b' },
        selectedFilter === value && styles.filterChipTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item: n }: { item: InAppNotification; index: number }) => {
    const unreadItem = !n.readAt;
    const meta = typeMeta(n.type);
    const metaRow = asMetaRecord(n.metadata);
    const tUpper = (n.type || "").toUpperCase();
    const isSpOndemandNewBooking =
      r?.recipientType === "provider" &&
      (tUpper === "NEW_BOOKING_OPPORTUNITY" || tUpper === "NEW_BOOKING_REQUEST");
    const isSpAssignedConfirmed =
      r?.recipientType === "provider" && tUpper === "ASSIGNED_BOOKING_CONFIRMED";
    const isCustomerAutoCancelled =
      r?.recipientType === "customer" && isAutoCancelledNoProviderType(n.type);
    const eid = parseEngagementId(n.engagementId);
    const hasBookingDetailPanel =
      (isSpOndemandNewBooking || isSpAssignedConfirmed) && eid != null;
    const canQuickAct = isSpOndemandNewBooking && unreadItem && hasBookingDetailPanel;
    const hasBody = Boolean(n.body?.trim()) && !isCustomerAutoCancelled;
    const hasAddress = Boolean(metaRow?.address) && !isCustomerAutoCancelled;

    return (
      <View style={styles.itemWrapper}>
        <TouchableOpacity
          style={[
            styles.itemCard,
            unreadItem && styles.itemUnread,
            {
              backgroundColor: unreadItem
                ? isDarkMode
                  ? "rgba(59,130,246,0.08)"
                  : "#f8fbff"
                : isDarkMode
                  ? "#1e293b"
                  : "#ffffff",
            },
          ]}
          activeOpacity={0.85}
          onPress={() => {
            if (isSpAssignedConfirmed && hasBookingDetailPanel) {
              setDetailError(null);
              setDetailFor(n);
              if (unreadItem) void markRead(n);
              return;
            }
            if (isCustomerAutoCancelled) {
              if (unreadItem) void markRead(n);
              return;
            }
            if (isSpOndemandNewBooking) return;
            if (unreadItem) void markRead(n);
          }}
        >
          <View style={styles.itemTopRow}>
            <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
              <MaterialIcon name={meta.icon} size={20} color={meta.color} />
              {unreadItem ? <View style={styles.unreadDot} /> : null}
            </View>
            <View style={styles.itemContent}>
              {!isCustomerAutoCancelled ? (
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.itemTitle,
                      unreadItem && styles.itemTitleBold,
                      { color: isDarkMode ? '#f8fafc' : '#0f172a' },
                    ]}
                    numberOfLines={2}
                  >
                    {n.title}
                  </Text>
                  <Text style={[styles.timeText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                    {timeAgo(n.createdAt)}
                  </Text>
                </View>
              ) : null}
              {isCustomerAutoCancelled ? (
                <AutoCancelledBookingCard
                  metadata={n.metadata}
                  engagementId={eid}
                  isDarkMode={isDarkMode}
                  variant="compact"
                />
              ) : null}
              {hasBody ? (
                <Text
                  style={[styles.itemBody, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}
                  numberOfLines={3}
                >
                  {n.body}
                </Text>
              ) : null}
              {hasAddress ? (
                <View style={styles.metaLine}>
                  <MaterialIcon name="location-on" size={14} color={meta.color} />
                  <Text
                    style={[styles.metaText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}
                    numberOfLines={1}
                  >
                    {String(metaRow?.address)}
                  </Text>
                </View>
              ) : null}
              {!isCustomerAutoCancelled ? (
                <View style={styles.itemFooter}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${meta.color}14` }]}>
                    <Text style={[styles.categoryText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
          {hasBookingDetailPanel ? (
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
              {canQuickAct ? (
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
              ) : null}
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
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

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          <View
            style={[
              styles.dialog,
              {
                height: sheetHeight,
                backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
                paddingBottom: Math.max(insets.bottom, 8),
              },
            ]}
          >
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
                  <Text style={styles.headerTitle}>Notifications</Text>
                  <Text style={styles.headerSubtitle}>
                    {r
                      ? unread > 0
                        ? `${unread} unread · ${items.length} total`
                        : items.length > 0
                          ? `${items.length} update${items.length === 1 ? "" : "s"} · all read`
                          : "Stay on top of bookings and visits"
                      : "Sign in to see your activity"}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  {r && unread > 0 ? (
                    <TouchableOpacity
                      style={styles.headerIconBtn}
                      onPress={markAll}
                      accessibilityLabel="Mark all as read"
                    >
                      <MaterialIcon name="done-all" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.headerIconBtn}
                    onPress={onClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Close"
                  >
                    <MaterialIcon name="close" size={22} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {r && items.length > 0 ? (
              <View style={[styles.toolbar, { backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', borderBottomColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
                >
                  <FilterChip label={`All (${items.length})`} value="all" />
                  <FilterChip label={`Unread (${unread})`} value="unread" />
                  <FilterChip label={`Read (${readCount})`} value="read" />
                </ScrollView>
              </View>
            ) : null}

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
          </View>
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
    width: "100%",
    alignSelf: "stretch",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  detailDialog: {
    alignSelf: "center",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    width: "100%",
    alignSelf: "stretch",
    paddingBottom: 14,
  },
  sheetHandle: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: "500",
  },
  toolbar: {
    width: "100%",
    alignSelf: "stretch",
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterChipActive: {
    backgroundColor: "#2563eb",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  body: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
  },
  listContent: {
    padding: 12,
    paddingBottom: 8,
  },
  itemWrapper: {
    marginBottom: 10,
  },
  itemCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
  },
  itemUnread: {
    borderColor: "rgba(59,130,246,0.35)",
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  itemTitleBold: {
    fontWeight: "700",
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    flex: 1,
  },
  bookingSummaryBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
  },
  bookingSummaryBoxDetail: {
    marginTop: 12,
    marginBottom: 8,
  },
  bookingSummaryLabel: {
    fontWeight: "700",
    color: "#334155",
  },
  cancelledDetailScroll: {
    padding: 20,
    paddingTop: 48,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  detailBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailCaption: {
    fontSize: 12,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.2)",
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
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
  timeText: {
    fontSize: 11,
    lineHeight: 14,
    flexShrink: 0,
    marginTop: 2,
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