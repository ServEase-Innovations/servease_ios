/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable */

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  RefreshControl,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import providerInstance, { resolveProviderRequestUrl } from "../services/providerInstance";
import ProviderDetailsComponent from "../DetailsView/ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { usePricingFilterService } from '../utils/PricingFilter';
import { ServiceProviderDTO } from "../types/ProviderDetailsType";
import { resolveProviderId } from "../utils/providerId";
import ProviderFilter, { FilterCriteria } from "./ProviderFilter";
import { useTheme } from '../Settings/ThemeContext';
import { SkeletonLoader } from '../common/SkeletonLoader';
import dayjs, { Dayjs } from 'dayjs';
import { useAppUser } from '../context/AppUserContext';
import { formatDateOnly, getBookingTypeFromPreference } from '../utils/maidPricingUtils';
import { resolveScheduleTimeFields } from '../utils/bookingSchedulePatch';
import { buildLocationSearchKey, resolveLocationCoords } from '../utils/bookingLocation';
import { isBookingScheduleComplete } from '../ServiceDialogs/serviceBookingConfig';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DetailsViewProps {
  sendDataToParent: (data: string) => void;
  selected?: string;
  checkoutItem?: (data: any) => void;
  selectedProvider?: (data: any) => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({
  sendDataToParent,
  selected,
  checkoutItem,
  selectedProvider,
}) => {
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const { appUser } = useAppUser();
  const { t } = useTranslation();
  
  const customerId = appUser?.role === "CUSTOMER" ? appUser?.customerid : null;
  
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  
  const lastLocationSearchKeyRef = useRef("");
  const isFetchingRef = useRef(false);
  
  // Infinite scroll state
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allProviders, setAllProviders] = useState<ServiceProviderDTO[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<null | 'timeout' | 'network' | 'generic'>(null);
  
  const flatListRef = useRef<FlatList>(null);
  
  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 13, headingSize: 17, smallText: 11, badgeText: 10 };
      case 'large':
        return { textSize: 17, headingSize: 23, smallText: 15, badgeText: 13 };
      default:
        return { textSize: 15, headingSize: 20, smallText: 13, badgeText: 11 };
    }
  };

  const fontStyles = getFontSizeStyles();
  const spacingMultiplier = compactMode ? 0.8 : 1;

  const { getBookingType, getPricingData, getFilteredPricing } = usePricingFilterService();
  const bookingType = getBookingType();

  const providerSearchCriteria = useMemo(
    () => ({
      startDate: bookingType?.startDate,
      endDate: bookingType?.endDate,
      startTime: bookingType?.startTime,
      endTime: bookingType?.endTime,
      timeRange: bookingType?.timeRange,
      timeSlot: bookingType?.timeSlot,
      housekeepingRole: bookingType?.housekeepingRole,
      bookingPreference: bookingType?.bookingPreference,
    }),
    [
      bookingType?.startDate,
      bookingType?.endDate,
      bookingType?.startTime,
      bookingType?.endTime,
      bookingType?.timeRange,
      bookingType?.timeSlot,
      bookingType?.housekeepingRole,
      bookingType?.bookingPreference,
    ]
  );

  const providerSearchKey = useMemo(
    () => JSON.stringify(providerSearchCriteria),
    [providerSearchCriteria]
  );

  const canSearchProviders = useMemo(() => {
    const bookingTypeCode = getBookingTypeFromPreference(
      providerSearchCriteria.bookingPreference
    );
    return isBookingScheduleComplete(
      providerSearchCriteria as Record<string, unknown>,
      bookingTypeCode
    );
  }, [providerSearchCriteria]);

  const scheduleRevision = useSelector(
    (state: { bookingType?: { scheduleRevision?: number } }) =>
      state.bookingType?.scheduleRevision ?? 0
  );

  const providerSearchTriggerKey = useMemo(
    () =>
      canSearchProviders ? `${providerSearchKey}:${scheduleRevision}` : "",
    [canSearchProviders, providerSearchKey, scheduleRevision]
  );
  
  const dispatch = useDispatch();
  const location = useSelector((state: any) => state?.geoLocation?.value);
  const locationSearchKey = useMemo(
    () => buildLocationSearchKey(location),
    [location]
  );

  const filteredProviders = allProviders;

  const formatDisplayTime = (hhmm?: string) => {
    if (!hhmm) return "";
    const parsed = dayjs(hhmm.trim(), ["HH:mm", "H:mm", "hh:mm A", "h:mm A"], true);
    return parsed.isValid() ? parsed.format("h:mm A") : hhmm;
  };

  const formatDisplayDate = (value?: string) => {
    const ymd = formatDateOnly(value);
    return ymd ? dayjs(ymd).format("MMM D, YYYY") : "";
  };

  const searchContextSummary = useMemo(() => {
    const pref = providerSearchCriteria.bookingPreference;
    const bookingTypeCode = getBookingTypeFromPreference(pref);
    const role = String(providerSearchCriteria.housekeepingRole || "COOK").toUpperCase();
    const serviceLabel =
      role === "MAID"
        ? t("home.services.cleaningHelp") || "Maid"
        : role === "NANNY"
          ? t("home.services.caregiver") || "Nanny"
          : t("home.services.homeCook") || "Cook";
    const modeLabel =
      bookingTypeCode === "ON_DEMAND"
        ? "On demand"
        : bookingTypeCode === "SHORT_TERM"
          ? "Short term"
          : "Monthly";

    const start = formatDisplayDate(providerSearchCriteria.startDate);
    const end = formatDisplayDate(providerSearchCriteria.endDate);
    let dateLine = "";
    if (bookingTypeCode === "SHORT_TERM" && start && end && start !== end) {
      dateLine = `${start} – ${end}`;
    } else if (start) {
      dateLine = start;
    } else if (end) {
      dateLine = end;
    }

    const { startTime: resolvedStart, endTime: resolvedEnd } = resolveScheduleTimeFields(
      providerSearchCriteria as Record<string, unknown>
    );
    const startT = formatDisplayTime(resolvedStart || providerSearchCriteria.startTime);
    const endT = formatDisplayTime(resolvedEnd || providerSearchCriteria.endTime);
    let timeLine = "";
    if (startT && endT) {
      timeLine = `${startT} – ${endT}`;
    } else if (startT) {
      timeLine = startT;
    }

    return { serviceLabel, modeLabel, dateLine, timeLine };
  }, [providerSearchCriteria, t]);

  useEffect(() => {
    if (selected) {
      setSelectedProviderType(selected);
    }
  }, [selected]);

  const handleBackClick = () => {
    sendDataToParent("");
  };

  const handleSelectedProvider = useCallback((provider: any) => {
    if (selectedProvider) {
      selectedProvider(provider);
    }
  }, [selectedProvider]);

  const formatTimeToHHMM = (time?: Dayjs | string | null): string => {
    if (!time) return "09:00";
    
    if (typeof time === 'string') {
      const trimmedTime = time.trim();
      if (/^\d{2}:\d{2}$/.test(trimmedTime)) {
        return trimmedTime;
      }
      const parsed = dayjs(trimmedTime, ['HH:mm', 'h:mm A', 'h:mm a']);
      if (parsed.isValid()) {
        return parsed.format('HH:mm');
      }
      return "09:00";
    }
    
    if (time && typeof time === 'object' && 'format' in time) {
      return (time as Dayjs).format('HH:mm');
    }
    
    return "09:00";
  };

  const calculateDurationInMinutes = (startTime?: string, endTime?: string): number => {
    if (!startTime || !endTime) return 60;

    try {
      const startTimeStr = startTime.trim();
      const endTimeStr = endTime.trim();

      const today = new Date();
      const startDateTime = new Date(today);
      const endDateTime = new Date(today);

      const startParts = startTimeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
      const endParts = endTimeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);

      if (startParts && endParts) {
        let startHour = parseInt(startParts[1]);
        let startMinute = parseInt(startParts[2]);
        let endHour = parseInt(endParts[1]);
        let endMinute = parseInt(endParts[2]);

        if (startParts[3]) {
          const startPeriod = startParts[3].toUpperCase();
          if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
          if (startPeriod === 'AM' && startHour === 12) startHour = 0;
        }

        if (endParts[3]) {
          const endPeriod = endParts[3].toUpperCase();
          if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
          if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        }

        startDateTime.setHours(startHour, startMinute, 0, 0);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        const diffInMilliseconds = endDateTime.getTime() - startDateTime.getTime();
        const diffInMinutes = Math.round(diffInMilliseconds / (1000 * 60));

        if (diffInMinutes < 0) {
          return diffInMinutes + (24 * 60);
        }
        return diffInMinutes > 0 ? diffInMinutes : 60;
      }
    } catch (error) {
      console.error("Error calculating duration:", error);
    }
    return 60;
  };

  const fetchProviders = async (
    page: number,
    reset: boolean = false,
    preserveList: boolean = false
  ) => {
    if (isFetchingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }
    
    try {
      isFetchingRef.current = true;
      
      if (reset) {
        setIsLoadingMore(false);
        if (!preserveList) {
          setLoading(true);
        }
      } else {
        setIsLoadingMore(true);
      }

      const coords = resolveLocationCoords(location);
      const latitude = coords?.lat ?? 0;
      const longitude = coords?.lng ?? 0;

      if (latitude === 0 || longitude === 0 || isNaN(latitude) || isNaN(longitude)) {
        Alert.alert(
          'Location Required',
          'Please enable location services to find providers near you.',
          [{ text: 'OK' }]
        );
        setAllProviders([]);
        setHasFetchedOnce(true);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const { startTime: resolvedStart, endTime: resolvedEnd } = resolveScheduleTimeFields(
        providerSearchCriteria as Record<string, unknown>
      );

      const serviceDurationMinutes = calculateDurationInMinutes(
        resolvedStart || providerSearchCriteria.startTime,
        resolvedEnd || providerSearchCriteria.endTime
      );

      const payload: any = {
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: 10,
        startDate:
          formatDateOnly(providerSearchCriteria.startDate) ||
          dayjs().format("YYYY-MM-DD"),
        endDate:
          formatDateOnly(providerSearchCriteria.endDate) ||
          formatDateOnly(providerSearchCriteria.startDate) ||
          dayjs().format("YYYY-MM-DD"),
        preferredStartTime:
          String(resolvedStart || providerSearchCriteria.startTime || "").trim() ||
          (providerSearchCriteria.timeRange
            ? providerSearchCriteria.timeRange.split("-")[0]?.trim()
            : "") ||
          "09:00",
        role: providerSearchCriteria.housekeepingRole || "COOK",
        serviceDurationMinutes: serviceDurationMinutes
      };

      if (activeFilters) {
        const [minExp, maxExp] = activeFilters.experience;
        if (minExp > 0 || maxExp < 30) {
          payload.experienceRange = `${minExp}-${maxExp}`;
        }
        if (activeFilters.rating) {
          payload.minRating = activeFilters.rating;
        }
        if (activeFilters.distance && activeFilters.distance[1] < 50) {
          payload.radius = activeFilters.distance[1];
        }
        if (activeFilters.gender !== null && activeFilters.gender !== "") {
          payload.gender = activeFilters.gender;
        }
        if (activeFilters.diet !== null && activeFilters.diet !== "") {
          payload.diet = activeFilters.diet;
        }
        if (activeFilters.language && activeFilters.language.length > 0) {
          payload.languages = activeFilters.language;
        }
      }

      if (appUser?.role === "CUSTOMER" && customerId && customerId !== 0 && customerId !== null && customerId !== undefined) {
        payload.customerID = Number(customerId);
      }
      
      const searchPath = `/api/service-providers/nearby-monthly?page=${page}&limit=10`;
      const searchFullUrl = resolveProviderRequestUrl({ url: searchPath });

      console.log('[DetailsView] nearby-monthly search', {
        fullUrl: searchFullUrl,
        page,
        reset,
        payload,
      });

      const response = await providerInstance.post(
        searchPath,
        payload,
        { timeout: 90000 }
      );

      console.log("API Response:", response.data);
      setFetchError(null);

      const rawProviders = response.data.providers || [];
      const newProviders: ServiceProviderDTO[] = rawProviders.map((p: ServiceProviderDTO) => {
        const id = resolveProviderId(p as unknown as Record<string, unknown>);
        return {
          ...p,
          serviceproviderid: id ?? "",
          serviceProviderId: id ?? (p as { serviceProviderId?: string }).serviceProviderId,
        };
      });
      const total = response.data.count || 0;
      setTotalCount(total);

      if (reset) {
        setAllProviders(newProviders);
        setHasFetchedOnce(true);
      } else {
        setAllProviders(prev => [...prev, ...newProviders]);
      }

      const loadedCount = reset ? newProviders.length : allProviders.length + newProviders.length;
      setHasMore(loadedCount < total);
      setCurrentPage(page);

    } catch (error: any) {
      const message = String(error?.message || '');
      const isTimeout =
        error?.code === 'ECONNABORTED' || message.toLowerCase().includes('timeout');
      const isNetwork = !error?.response && (error?.code === 'ERR_NETWORK' || message.includes('Network'));

      if (isTimeout) {
        setFetchError('timeout');
      } else if (isNetwork) {
        setFetchError('network');
      } else {
        setFetchError('generic');
      }

      if (reset) {
        setAllProviders([]);
        setTotalCount(0);
        setHasFetchedOnce(true);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  const performSearch = useCallback(async (reset: boolean = true) => {
    const preserveList =
      reset &&
      allProviders.length > 0 &&
      lastLocationSearchKeyRef.current === locationSearchKey;

    if (reset) {
      setCurrentPage(1);
      setHasMore(true);
      setFetchError(null);
      if (!preserveList) {
        setAllProviders([]);
        setHasFetchedOnce(false);
      }
    }

    lastLocationSearchKeyRef.current = locationSearchKey;

    await fetchProviders(reset ? 1 : currentPage + 1, reset, preserveList);
  }, [
    allProviders.length,
    locationSearchKey,
    location,
    providerSearchCriteria,
    activeFilters,
    customerId,
    appUser,
    currentPage,
  ]);

  useEffect(() => {
    if (
      selectedProviderType !== undefined &&
      locationSearchKey &&
      canSearchProviders &&
      providerSearchTriggerKey
    ) {
      performSearch(true);
    }
  }, [
    selectedProviderType,
    locationSearchKey,
    canSearchProviders,
    providerSearchTriggerKey,
    activeFilters,
    performSearch,
  ]);

  const resetAndSearch = useCallback(() => {
    performSearch(true);
  }, [performSearch]);

  const fetchMoreData = useCallback(() => {
    if (isLoadingMore || !hasMore || loading || isFetchingRef.current) {
      return;
    }
    
    if (allProviders.length > 0 && hasMore) {
      fetchProviders(currentPage + 1, false);
    }
  }, [isLoadingMore, hasMore, loading, allProviders.length, currentPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    resetAndSearch();
  };

  const handleApplyFilters = (filters: FilterCriteria) => {
    setActiveFilters(filters);
    
    let count = 0;
    if (filters.experience[0] > 0 || filters.experience[1] < 30) count++;
    if (filters.rating) count++;
    if (filters.distance[0] > 0 || filters.distance[1] < 50) count++;
    if (filters.gender !== null && filters.gender !== "") count++;
    if (filters.diet !== null && filters.diet !== "") count++;
    if (filters.language && filters.language.length > 0) count++;
    
    setActiveFilterCount(count);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setActiveFilterCount(0);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={[styles.footerLoader, { paddingVertical: 20 }]}>
        <ActivityIndicator size="large" color="#0b5bd3" />
        <Text style={[styles.loadingMoreText, { color: '#64748B', fontSize: fontStyles.smallText }]}>
          Loading more providers...
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    const showResultsHeader =
      totalCount > 0 || activeFilters || (hasFetchedOnce && Boolean(searchContextSummary));

    if (!showResultsHeader && !(canSearchProviders && searchContextSummary)) return null;
    
    const resultsLabel = fetchError
      ? fetchError === 'timeout'
        ? 'Search timed out — try again'
        : fetchError === 'network'
          ? 'Connection problem'
          : 'Could not load providers'
      : totalCount === 1
        ? '1 service provider found'
        : `${totalCount} service providers found`;
    
    return (
      <>
        <View style={[styles.headerShell, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.surface : "#ffffff" }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={handleBackClick}
              style={[styles.backButton, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.card : "#F8FAFC" }]}
            >
              <Icon name="arrow-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text, fontSize: fontStyles.smallText }]}>Back</Text>
            </TouchableOpacity>
            <View
              style={[
                styles.resultsPill,
                {
                  borderColor: fetchError ? colors.error + '40' : colors.border,
                  backgroundColor: fetchError
                    ? colors.error + '12'
                    : isDarkMode
                      ? colors.card
                      : '#F8FAFC',
                },
              ]}
            >
              <Text
                style={[
                  styles.resultsCountText,
                  {
                    fontSize: fontStyles.smallText,
                    color: fetchError ? colors.error : colors.textSecondary,
                  },
                ]}
                numberOfLines={2}
              >
                {resultsLabel}
              </Text>
            </View>
          </View>

          {(canSearchProviders && searchContextSummary) ? (
            <View style={[styles.searchContextBanner, { borderTopColor: colors.border, backgroundColor: isDarkMode ? colors.card : '#F8FAFC' }]}>
              <View style={styles.searchContextRow}>
                <View style={[styles.searchContextPill, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.searchContextPillText, { color: colors.primary, fontSize: fontStyles.smallText }]}>
                    {searchContextSummary.serviceLabel}
                  </Text>
                </View>
                <View style={[styles.searchContextPill, { backgroundColor: isDarkMode ? colors.surface : '#FFFFFF', borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.searchContextPillText, { color: colors.text, fontSize: fontStyles.smallText }]}>
                    {searchContextSummary.modeLabel}
                  </Text>
                </View>
              </View>
              {(searchContextSummary.dateLine || searchContextSummary.timeLine) ? (
                <Text style={[styles.searchContextMeta, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>
                  {[searchContextSummary.dateLine, searchContextSummary.timeLine].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.headerBottomRow}>
            <Text
              style={[styles.sectionTitle, { color: colors.text, fontSize: fontStyles.headingSize }]}
              numberOfLines={2}
            >
              Available Providers
            </Text>
            <View style={[styles.filterContainer, { gap: 8 * spacingMultiplier }]}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                    paddingHorizontal: 12 * spacingMultiplier,
                    paddingVertical: 8 * spacingMultiplier,
                  },
                ]}
                onPress={() => setFilterOpen(true)}
                activeOpacity={0.8}
              >
                <Icon name="tune" size={18} color={colors.text} />
                <Text style={[styles.filterButtonText, { color: colors.text, fontSize: fontStyles.smallText }]}>
                  Filter
                </Text>
                {activeFilterCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { fontSize: fontStyles.badgeText, color: '#FFFFFF' }]}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={[styles.clearButton, { padding: 8 * spacingMultiplier }]}
                  onPress={handleClearFilters}
                >
                  <Text style={[styles.clearButtonText, { color: colors.primary, fontSize: fontStyles.smallText }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border, marginBottom: 16 }]} />
      </>
    );
  };

  const renderEmptyComponent = () => {
    if (loading && !hasFetchedOnce) {
      return renderSkeletonLoader();
    }

    if (hasFetchedOnce && filteredProviders.length === 0 && !loading) {
      const isLoadError = Boolean(fetchError);

      return (
        <View style={styles.emptyStateWrap}>
          <View
            style={[
              styles.emptyGradientContainer,
              { backgroundColor: isDarkMode ? colors.card : '#FFFFFF', borderColor: colors.border },
            ]}
          >
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
              {isLoadError ? (
                <Icon name="wifi-off" size={40} color={colors.primary} />
              ) : activeFilters ? (
                <FontAwesome name="sliders" size={40} color={colors.primary} />
              ) : (
                <Icon name="location-off" size={40} color={colors.primary} />
              )}
            </View>
            <Text
              style={[styles.emptyTitle, { color: colors.text, fontSize: fontStyles.headingSize }]}
              numberOfLines={3}
            >
              {isLoadError
                ? fetchError === 'timeout'
                  ? 'Search Timed Out'
                  : fetchError === 'network'
                    ? 'Connection Problem'
                    : 'Unable to Load Providers'
                : activeFilters
                  ? 'No Providers Match Your Filters'
                  : 'Service Not Available in Your Area'}
            </Text>
            <Text
              style={[styles.emptyMessage, { color: colors.textSecondary, fontSize: fontStyles.textSize }]}
            >
              {isLoadError
                ? 'The provider search is taking longer than usual. Check your connection and try again.'
                : activeFilters
                  ? 'Try adjusting your filters to see more providers.'
                  : 'Currently, we are unable to provide services in your location. We hope to be available in your area soon.'}
            </Text>

            <View style={styles.emptyActions}>
              {isLoadError && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={resetAndSearch}
                >
                  <Text style={[styles.emptyButtonText, { fontSize: fontStyles.textSize, color: '#FFFFFF' }]}>
                    Try Again
                  </Text>
                </TouchableOpacity>
              )}
              {activeFilters && !isLoadError && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={handleClearFilters}
                >
                  <Text style={[styles.emptyButtonText, { fontSize: fontStyles.textSize, color: '#FFFFFF' }]}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.emptyButtonOutline, { borderColor: colors.primary }]}
                onPress={() => sendDataToParent('')}
              >
                <Text style={[styles.emptyButtonOutlineText, { fontSize: fontStyles.textSize, color: colors.primary }]}>
                  Go Back
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderSkeletonLoader = () => {
    return (
      <View style={styles.skeletonContainer}>
        <View style={[styles.skeletonHeader, { marginBottom: 16 * spacingMultiplier }]}>
          <SkeletonLoader width={80} height={40} variant="rectangular" />
          <SkeletonLoader width={100} height={40} variant="rectangular" />
        </View>
        
        <SkeletonLoader width="100%" height={40} style={{ marginBottom: 12 * spacingMultiplier }} />
        
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.skeletonCard, { marginBottom: 16 * spacingMultiplier }]}>
            <View style={styles.skeletonCardHeader}>
              <SkeletonLoader width={60} height={60} variant="circular" />
              <View style={styles.skeletonCardHeaderText}>
                <SkeletonLoader width={120} height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={80} height={16} />
              </View>
            </View>
            <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="90%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="95%" height={16} style={{ marginBottom: 12 }} />
            <View style={styles.skeletonCardFooter}>
              <SkeletonLoader width={100} height={36} />
              <SkeletonLoader width={100} height={36} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderProviderItem = ({ item, index }: { item: ServiceProviderDTO; index: number }) => {
    return (
      <View key={index} style={[styles.providerContainer, { marginBottom: 14 * spacingMultiplier }]}>
        <ProviderDetailsComponent
          {...item}
          selectedProvider={handleSelectedProvider}
          sendDataToParent={sendDataToParent}
        />
      </View>
    );
  };

  const renderIncompleteSchedule = () => (
    <View style={styles.emptyStateWrap}>
      <View
        style={[
          styles.emptyGradientContainer,
          { backgroundColor: isDarkMode ? colors.card : '#FFFFFF', borderColor: colors.border },
        ]}
      >
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Icon name="event-busy" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text, fontSize: fontStyles.headingSize }]}>
          Complete your booking schedule
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary, fontSize: fontStyles.textSize }]}>
          Choose a service, booking type (monthly or short term), dates, and time from the home screen to search for providers.
        </Text>
        <TouchableOpacity
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={() => sendDataToParent('')}
        >
          <Text style={[styles.emptyButtonText, { fontSize: fontStyles.textSize, color: '#FFFFFF' }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={isDarkMode ? ['#0F172A', '#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF', '#F1F5F9']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {!canSearchProviders ? (
          <View style={[styles.container]}>
            {renderHeader()}
            {renderIncompleteSchedule()}
          </View>
        ) : loading && !hasFetchedOnce ? (
          <View style={[styles.container]}>
            {renderSkeletonLoader()}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredProviders}
            renderItem={renderProviderItem}
            keyExtractor={(item, index) => `provider-${item.serviceproviderid || index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.contentContainer,
              filteredProviders.length === 0 && styles.contentContainerEmpty,
            ]}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooter}
            onEndReached={fetchMoreData}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#0b5bd3']}
                tintColor="#0b5bd3"
              />
            }
          />
        )}

        <ProviderFilter
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={activeFilters || undefined}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingBottom: 130,
  },
  contentContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerShell: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  searchContextBanner: {
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: 4,
    marginBottom: 8,
  },
  searchContextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  searchContextPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchContextPillText: {
    fontWeight: '600',
  },
  searchContextMeta: {
    lineHeight: 18,
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  resultsPill: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  resultsCountText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: "700",
    flex: 1,
    flexShrink: 1,
    marginRight: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  filterButtonText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontWeight: 'bold',
  },
  clearButton: {},
  clearButtonText: {
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  providerContainer: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateWrap: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  emptyGradientContainer: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    width: '100%',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 28,
  },
  emptyMessage: {
    width: '100%',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyActions: {
    width: '100%',
    marginTop: 20,
    gap: 12,
    alignItems: 'center',
  },
  emptyButton: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyButtonOutline: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  emptyButtonText: {
    fontWeight: '600',
  },
  emptyButtonOutlineText: {
    fontWeight: '600',
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonCardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadingMoreText: {
    marginTop: 8,
  },
});

export default DetailsView;