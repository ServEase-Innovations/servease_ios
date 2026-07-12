import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProviderCalendarBig from "./ProviderCalendarBig";
import { useAppUser } from "../context/AppUserContext";
import HomeHeroChrome from "../HomePage/HomeHeroChrome";
import { HOME_HERO_GRADIENT, HOME_M3 } from "../theme/brandColors";

export default function ProviderCalendarScreen() {
  const insets = useSafeAreaInsets();
  const { appUser } = useAppUser();
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshToken, setRefreshToken] = React.useState(0);

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
        <LinearGradient colors={[...HOME_HERO_GRADIENT]} style={styles.heroGradient}>
          <HomeHeroChrome compact />
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>Calendar</Text>
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
    paddingBottom: 10,
    overflow: "visible",
  },
  heroBody: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 0,
  },
  heroTitle: {
    color: HOME_M3.onPrimary,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  contentSheet: {
    backgroundColor: HOME_M3.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
    paddingTop: 14,
    paddingHorizontal: 20,
    minHeight: 400,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: "center",
  },
});
