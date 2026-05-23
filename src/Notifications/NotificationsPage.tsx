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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * 0.82);
  const bodyMinHeight = Math.round(windowHeight * 0.48);
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [detailFor, setDetailFor] = useState<InAppNotification | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

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
          limit: 50,
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
    }
  }, [r, setUnreadSafe]);

  useEffect(() => {
    if (!visible || !r) return;
    void fetchList();
  }, [visible, r, fetchList]);

  useEffect(() => {
    if (!visible || !r) return;
    const refreshTimer = setInterval(() => {
      void fetchList();
    }, 10000);
    return () => clearInterval(refreshTimer);
  }, [visible, r, fetchList]);

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

  const renderGuest = () => (
    <View style={styles.guestBody}>
      <MaterialIcon name="inbox" size={40} color="#94a3b8" />
      <Text style={styles.guestTitle}>Stay updated</Text>
      <Text style={styles.guestText}>
        Sign in as a customer or service provider to see booking and service updates here.
      </Text>
    </View>
  );

  const renderItem = ({ item: n }: { item: InAppNotification }) => {
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
      <TouchableOpacity
        style={[styles.itemCard, unreadItem && styles.itemUnread]}
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
          <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
            <MaterialIcon name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.itemTitle, unreadItem && styles.itemTitleBold]} numberOfLines={2}>
                {n.title}
              </Text>
              {unreadItem && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              )}
            </View>
            {n.body ? <Text style={styles.itemBody}>{n.body}</Text> : null}
            {metaRow?.address ? (
              <Text style={styles.metaLine}>
                <Text style={styles.metaBold}>Location: </Text>
                {String(metaRow.address)}
              </Text>
            ) : null}
            {hasBookingDetailPanel && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => {
                    setDetailError(null);
                    setDetailFor(n);
                    if (unreadItem && isSpAssignedConfirmed) void markRead(n);
                  }}
                >
                  <Text style={styles.smallBtnText}>View details</Text>
                </TouchableOpacity>
                {canQuickAct && (
                  <>
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.smallBtnPrimary]}
                      disabled={acceptingId === n.id}
                      onPress={() => void acceptFromList(n)}
                    >
                      <Text style={styles.smallBtnPrimaryText}>
                        {acceptingId === n.id ? "…" : "Accept"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallBtn}
                      disabled={acceptingId === n.id}
                      onPress={() => void notInterested(n)}
                    >
                      <Text style={styles.smallBtnText}>Not interested</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
            <Text style={styles.itemMeta}>
              {meta.label}
              {n.engagementId ? ` · #${n.engagementId}` : ""} · {timeAgo(n.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { height: sheetHeight, width: windowWidth }]}>
            <View style={styles.sheetTop}>
              <View style={styles.sheetHandle} />
            </View>

            <View style={[styles.headerWrap, { width: windowWidth }]}>
              <LinearGradient
                colors={["#0369a1", "#1e3a5f", "#0f172a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradientBg}
              />
              <View style={styles.headerRow}>
                <View style={styles.headerTextBlock}>
                  <Text style={styles.headerEyebrow}>ACTIVITY</Text>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {t("common.notifications")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeHeader}
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close notifications"
                >
                  <Text style={styles.closeHeaderText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.subHeader}>
              {r
                ? unread > 0
                  ? `${unread} unread — tap an item to mark read`
                  : "Bookings, visits, and acceptances appear here in real time."
                : "Sign in to see your activity"}
            </Text>

            <View style={[styles.body, { minHeight: bodyMinHeight }]}>
              {!r ? (
                <ScrollView
                  contentContainerStyle={styles.centeredScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {renderGuest()}
                </ScrollView>
              ) : loading && items.length === 0 ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color="#0284c7" />
                  <Text style={styles.loadingText}>Loading your activity…</Text>
                </View>
              ) : error ? (
                <View style={styles.centered}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => void fetchList()}>
                    <Text style={styles.retryText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : items.length === 0 ? (
                <View style={styles.centered}>
                  <MaterialIcon name="inbox" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>Nothing new yet</Text>
                  <Text style={styles.emptyText}>
                    When a booking is accepted, a visit starts, or a service completes, you will see it here.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContent}
                  style={styles.list}
                  showsVerticalScrollIndicator
                />
              )}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerBtnOutline} onPress={onClose}>
                <Text style={styles.footerBtnOutlineText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              {r && unread > 0 && (
                <TouchableOpacity style={styles.footerBtnPrimary} onPress={() => void markAll()}>
                  <Text style={styles.footerBtnPrimaryText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

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
          <View style={[styles.dialog, styles.detailDialog]}>
            {detailFor && !detailPayload ? (
              <ScrollView contentContainerStyle={styles.centered}>
                <Text style={styles.emptyText}>
                  Booking details are not available for this item. Engagement #
                  {String(detailFor.engagementId || "—")}
                </Text>
                <TouchableOpacity
                  style={styles.footerBtnOutline}
                  onPress={() => {
                    setDetailFor(null);
                    setDetailError(null);
                  }}
                >
                  <Text style={styles.footerBtnOutlineText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
            {detailFor && detailPayload ? (
              <>
                <TouchableOpacity
                  style={styles.detailClose}
                  onPress={() => {
                    setDetailFor(null);
                    setDetailError(null);
                  }}
                >
                  <MaterialIcon name="close" size={22} color="#64748b" />
                </TouchableOpacity>
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
              </>
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
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
    alignItems: "stretch",
    width: "100%",
  },
  dialog: {
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    flexDirection: "column",
  },
  detailDialog: { maxHeight: Math.round(Dimensions.get("window").height * 0.92) },
  sheetTop: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#fff",
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#cbd5e1",
  },
  headerWrap: {
    minHeight: 96,
    position: "relative",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerGradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    zIndex: 1,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
    justifyContent: "center",
  },
  headerEyebrow: {
    color: "rgba(186,230,253,0.95)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    paddingBottom: 2,
  },
  closeHeader: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    flexShrink: 0,
  },
  closeHeaderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: -1,
  },
  body: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
  },
  subHeader: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  list: { flex: 1, width: "100%" },
  listContent: { padding: 12, paddingBottom: 16, flexGrow: 1 },
  itemCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  itemUnread: {
    borderLeftWidth: 4,
    borderLeftColor: "#0284c7",
    backgroundColor: "rgba(37,99,235,0.04)",
  },
  itemRow: { flexDirection: "row", gap: 10 },
  iconWrap: { padding: 8, borderRadius: 10 },
  itemContent: { flex: 1 },
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  itemTitle: { fontSize: 15, color: "#0f172a", flex: 1 },
  itemTitleBold: { fontWeight: "800" },
  newBadge: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  itemBody: { fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 18 },
  metaLine: { fontSize: 12, color: "#64748b", marginTop: 4 },
  metaBold: { fontWeight: "700", color: "#334155" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  smallBtn: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnPrimary: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  smallBtnText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  smallBtnPrimaryText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  itemMeta: { fontSize: 11, color: "#94a3b8", marginTop: 8 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    width: "100%",
  },
  centeredScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 240,
  },
  loadingText: { marginTop: 12, color: "#64748b" },
  errorText: { color: "#dc2626", marginBottom: 12, textAlign: "center" },
  retryBtn: {
    borderWidth: 1,
    borderColor: "#0284c7",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: "#0284c7", fontWeight: "600" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginTop: 12 },
  emptyText: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 8, lineHeight: 20 },
  guestBody: { alignItems: "center", padding: 32 },
  guestTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginTop: 12 },
  guestText: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 8, lineHeight: 22 },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    flexShrink: 0,
  },
  footerBtnOutline: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  footerBtnOutlineText: { color: "#475569", fontWeight: "600" },
  footerBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0284c7",
    alignItems: "center",
  },
  footerBtnPrimaryText: { color: "#fff", fontWeight: "700" },
  detailClose: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 5,
    padding: 4,
  },
});
