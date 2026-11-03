import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { Text } from "../theme/BrandTypography";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useAuth0 } from "react-native-auth0";
import ProviderCalendarBig from "./ProviderCalendarBig";
import { useAppUser } from "../context/AppUserContext";
import HomeHeroChrome from "../HomePage/HomeHeroChrome";
import { BRAND, HOME_HERO_GRADIENT, HOME_M3 } from "../theme/brandColors";

export default function ProviderCalendarScreen() {
  const insets = useSafeAreaInsets();
  const { appUser } = useAppUser();
  const { user: auth0User } = useAuth0();
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);

  const providerName =
    [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ").trim() ||
    appUser?.name ||
    auth0User?.given_name ||
    auth0User?.name ||
    "Provider";

  const providerId = useMemo(() => {
    const id = Number(appUser?.serviceProviderId);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [appUser?.serviceProviderId]);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshToken((t) => t + 1);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[...HOME_HERO_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroGradient}
        >
          <HomeHeroChrome compact />
          <View style={styles.heroGreetingCard}>
            <View style={styles.heroAvatar}>
              <MaterialIcon name="person" size={28} color={BRAND.accentDark} />
            </View>
            <View style={styles.heroGreetingText}>
              <Text style={styles.heroEyebrow}>Namaste,</Text>
              <Text style={styles.heroPageTitle} numberOfLines={2}>
                {providerName}
              </Text>
              <Text style={styles.heroSubtitle}>Your service calendar</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentSheet}>
          {providerId ? (
            <ProviderCalendarBig providerId={providerId} refreshToken={refreshToken} />
          ) : (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={HOME_M3.secondary} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_M3.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroGradient: {
    paddingBottom: 36,
    overflow: "visible",
  },
  heroGreetingCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  heroAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    marginRight: 14,
  },
  heroGreetingText: {
    flex: 1,
  },
  heroEyebrow: {
    color: HOME_M3.onPrimaryContainer,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  heroPageTitle: {
    color: HOME_M3.onPrimary,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  contentSheet: {
    backgroundColor: HOME_M3.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -18,
    paddingTop: 14,
    paddingHorizontal: 20,
    minHeight: 400,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
});
