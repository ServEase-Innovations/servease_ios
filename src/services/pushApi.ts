import type { PushUserContext } from "../types/push";

/** Lazy-load push module so Firebase/Notifee never break App startup */
export async function setupPushNotifications(
  user: PushUserContext | null | undefined
): Promise<void> {
  try {
    const mod = await import("./pushNotifications");
    if (typeof mod?.setupPushNotifications !== "function") {
      console.warn("[push] setupPushNotifications export missing");
      return;
    }
    await mod.setupPushNotifications(user);
  } catch (err) {
    console.warn("[push] setup failed to load", err);
  }
}

export async function refreshPushRegistration(
  user: PushUserContext | null | undefined
): Promise<boolean> {
  try {
    const mod = await import("./pushNotifications");
    if (typeof mod?.refreshPushRegistration === "function") {
      return mod.refreshPushRegistration(user);
    }
  } catch (err) {
    console.warn("[push] refresh failed to load", err);
  }
  return false;
}

export async function unregisterPushNotifications(): Promise<void> {
  try {
    const mod = await import("./pushNotifications");
    if (typeof mod?.unregisterPushNotifications === "function") {
      await mod.unregisterPushNotifications();
    }
  } catch (err) {
    console.warn("[push] unregister failed to load", err);
  }
}
