import { Platform, Alert, PermissionsAndroid, Linking } from "react-native";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DeviceInfo from "react-native-device-info";
import utilsInstance, { UTILS_BASE_URL } from "./utilsInstance";

const IOS_PERMISSION_KEY = "push_permission_asked_ios_v2";
const ANDROID_PERMISSION_KEY = "push_permission_rationale_android_v2";
const ANDROID_CHANNEL_ID = "serveaso_default";

/** Prevent duplicate onMessage handlers (each extra handler = duplicate notification). */
let listenersAttached = false;
const listenerUnsubs: Array<() => void> = [];
let latestPushUser: PushUserContext | null | undefined;

import type { PushUserContext } from "../types/push";

export type { PushUserContext };

/** Notifee is Android-only; avoid top-level import so iOS never loads the native module */
async function getNotifee() {
  if (Platform.OS !== "android") return null;
  try {
    return await import("@notifee/react-native");
  } catch (err) {
    console.warn("[push] Notifee unavailable on Android", err);
    return null;
  }
}

function androidNeedsRuntimePermission(): boolean {
  return Platform.OS === "android" && Number(Platform.Version) >= 33;
}

async function androidNotificationsAllowed(): Promise<boolean> {
  if (!androidNeedsRuntimePermission()) return true;
  try {
    return await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  } catch {
    return false;
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  const notifeeMod = await getNotifee();
  if (!notifeeMod) return;
  await notifeeMod.default.createChannel({
    id: ANDROID_CHANNEL_ID,
    name: "Serveaso",
    description: "Booking alerts and updates",
    importance: notifeeMod.AndroidImportance.HIGH,
    sound: "default",
  });
}

async function requestAndroidPermissionWithRationale(): Promise<boolean> {
  if (!androidNeedsRuntimePermission()) return true;

  const alreadyAllowed = await androidNotificationsAllowed();
  if (alreadyAllowed) return true;

  const rationaleShown = await AsyncStorage.getItem(ANDROID_PERMISSION_KEY);

  if (!rationaleShown) {
    const userWants = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Enable notifications",
        "Serveaso sends booking alerts and important updates. Allow notifications?",
        [
          { text: "Not now", style: "cancel", onPress: () => resolve(false) },
          { text: "Allow", onPress: () => resolve(true) },
        ],
        { cancelable: false }
      );
    });
    await AsyncStorage.setItem(ANDROID_PERMISSION_KEY, "1");
    if (!userWants) return false;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: "Notification permission",
      message: "Allow Serveaso to send you booking and service alerts.",
      buttonPositive: "Allow",
      buttonNegative: "Deny",
    }
  );

  if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      "Notifications disabled",
      "Open Settings → Serveaso → Notifications to enable alerts.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]
    );
  }

  return false;
}

async function requestIosPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/** Ask the user for notification permission. */
export async function requestPushNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "ios") return requestIosPermission();
  if (Platform.OS === "android") return requestAndroidPermissionWithRationale();
  return false;
}

async function getFcmTokenWithRetry(maxAttempts = 6): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const token = await messaging().getToken();
      if (token && token.length >= 100) return token;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[push] getToken attempt ${attempt + 1}/${maxAttempts}:`, msg);
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  return null;
}

async function registerIosForPush(): Promise<boolean> {
  const permissionOk = await ensureNotificationPermission();
  if (!permissionOk) {
    console.log("[push] iOS notification permission not granted");
    return false;
  }

  await messaging().registerDeviceForRemoteMessages();
  await messaging().setForegroundNotificationPresentationOptions({
    alert: true,
    badge: true,
    sound: true,
  });
  return true;
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    return requestAndroidPermissionWithRationale();
  }

  const alreadyAsked = await AsyncStorage.getItem(IOS_PERMISSION_KEY);
  if (!alreadyAsked) {
    const allowed = await requestIosPermission();
    if (allowed) await AsyncStorage.setItem(IOS_PERMISSION_KEY, "1");
    return allowed;
  }

  const enabled = await messaging().hasPermission();
  const ok =
    enabled === messaging.AuthorizationStatus.AUTHORIZED ||
    enabled === messaging.AuthorizationStatus.PROVISIONAL;
  if (ok) return true;
  return requestIosPermission();
}

async function displayForegroundNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage
): Promise<void> {
  const title =
    remoteMessage.notification?.title ||
    remoteMessage.data?.title ||
    "Serveaso";
  const body =
    remoteMessage.notification?.body ||
    remoteMessage.data?.body ||
    "";

  if (Platform.OS !== "android") return;

  const notificationId =
    remoteMessage.messageId ||
    remoteMessage.data?.collapseId ||
    "serveaso-push-latest";

  const notifeeMod = await getNotifee();
  if (!notifeeMod) return;

  await ensureAndroidChannel();
  await notifeeMod.default.displayNotification({
    id: String(notificationId),
    title: String(title),
    body: String(body),
    android: {
      channelId: ANDROID_CHANNEL_ID,
      smallIcon: "ic_stat_serveaso",
      color: "#0B5BD3",
      pressAction: { id: "default" },
      tag: "serveaso_push",
    },
  });
}

async function registerTokenWithBackend(
  token: string,
  user: PushUserContext | null | undefined
) {
  let deviceName: string | undefined;
  try {
    deviceName = `${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}`.trim();
  } catch {
    deviceName = undefined;
  }

  const payload = {
    token,
    platform:
      Platform.OS === "ios"
        ? "ios"
        : Platform.OS === "android"
          ? "android"
          : "ios",
    email: user?.email ?? undefined,
    role: user?.role ?? undefined,
    userId: user?.userId != null ? String(user.userId) : undefined,
    serviceProviderId:
      user?.serviceProviderId != null ? String(user.serviceProviderId) : undefined,
    customerId: user?.customerId != null ? String(user.customerId) : undefined,
    deviceName,
  };
  const res = await utilsInstance.post("/api/push/register", payload);
  console.log(
    "[push] registered",
    Platform.OS,
    "with utils",
    UTILS_BASE_URL,
    res.status
  );
}

function detachPushListeners(): void {
  listenerUnsubs.forEach((unsub) => {
    try {
      unsub();
    } catch {
      /* ignore */
    }
  });
  listenerUnsubs.length = 0;
  listenersAttached = false;
}

function attachPushListeners(
  user: PushUserContext | null | undefined
): void {
  latestPushUser = user;
  if (listenersAttached) return;
  listenersAttached = true;

  listenerUnsubs.push(
    messaging().onTokenRefresh(async (newToken) => {
      try {
        await registerTokenWithBackend(newToken, latestPushUser);
      } catch (e) {
        console.warn("[push] token refresh register failed", e);
      }
    })
  );

  listenerUnsubs.push(
    messaging().onMessage(async (remoteMessage) => {
      if (Platform.OS === "android") {
        await displayForegroundNotification(remoteMessage);
      }
    })
  );

  listenerUnsubs.push(
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("[push] opened from background", remoteMessage?.messageId);
    })
  );
}

async function registerPushTokenWithBackend(
  user: PushUserContext | null | undefined
): Promise<string | null> {
  if (Platform.OS === "ios") {
    const iosReady = await registerIosForPush();
    if (!iosReady) return null;
  } else {
    const androidReady = await ensureNotificationPermission();
    if (!androidReady) return null;
  }

  const token = await getFcmTokenWithRetry();
  if (!token) {
    console.warn("[push] no FCM token from Firebase after retries");
    return null;
  }

  try {
    await registerTokenWithBackend(token, user);
    console.log("[push] FCM token registered with backend, length:", token.length);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[push] backend token registration failed:", msg);
  }

  return token;
}

/**
 * Initialize FCM: permission → APNs/FCM token → backend registration → message handlers (once).
 */
export async function setupPushNotifications(
  user: PushUserContext | null | undefined
): Promise<void> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;

  try {
    await ensureAndroidChannel();
    latestPushUser = user;
    await registerPushTokenWithBackend(user);
    attachPushListeners(user);

    const initial = await messaging().getInitialNotification();
    if (initial) {
      console.log("[push] opened from quit", initial.messageId);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[push] setup failed:", msg, err);
  }
}

/** Re-run permission + token registration (e.g. after enabling notifications in Settings). */
export async function refreshPushRegistration(
  user: PushUserContext | null | undefined
): Promise<boolean> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;
  try {
    await ensureAndroidChannel();
    const token = await registerPushTokenWithBackend(user);
    if (token) {
      attachPushListeners(user);
      return true;
    }
    return false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[push] refresh failed:", msg, err);
    return false;
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  detachPushListeners();
  try {
    await messaging().deleteToken();
  } catch {
    /* ignore */
  }
}
