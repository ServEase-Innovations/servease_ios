/* eslint-disable */
import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Portal,
  Text,
  Chip,
  IconButton,
  Divider,
  PaperProvider,
  Surface,
  Card,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { ServiceProviderDTO } from '../types/ProviderDetailsType';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/Settings/ThemeContext';
import BottomSheetScaffold from '../design-system/BottomSheetScaffold';
import { BRAND } from '../theme/brandColors';
import { readProviderLanguages } from '../utils/providerLanguages';

interface ProviderAvailabilityDrawerProps {
  open: boolean;
  onClose: () => void;
  onBookNow?: () => void;
  provider: ServiceProviderDTO | null;
}

const formatDateTime = (dateString: string) => {
  return moment(dateString).format('MMM D, YYYY • hh:mm A');
};

const ProviderAvailabilityDrawer: React.FC<ProviderAvailabilityDrawerProps> = ({
  open,
  onClose,
  onBookNow,
  provider,
}) => {
  const { t } = useTranslation();
  const { colors, isDarkMode, fontSize } = useTheme();
  
  const [previousBookingExpanded, setPreviousBookingExpanded] = useState(false);
  const [scheduleExceptionsExpanded, setScheduleExceptionsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'availability' | 'history'>('overview');
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (open) {
      sheetTranslateY.setValue(0);
      setActiveTab('overview');
    }
  }, [open, sheetTranslateY]);

  const handleSheetClose = () => {
    sheetTranslateY.setValue(0);
    onClose();
  };

  if (!provider || !open) {
    return null;
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return '08:00 AM';
    return moment(timeString, 'HH:mm').format('hh:mm A');
  };

  const formatDate = (dateString: string) => {
    return moment(dateString).format('MMMM D, YYYY');
  };

  const getAvailabilityStatus = () => {
    const availability = provider.monthlyAvailability;
    if (!availability) return t('provider.availability.notSpecified');
    
    if (availability.fullyAvailable) return t('provider.availability.fullyAvailable');
    return t('provider.availability.partiallyAvailable');
  };

  const getAvailabilityColor = () => {
    const availability = provider.monthlyAvailability;
    if (!availability) return 'default';
    if (availability.fullyAvailable) return 'success';
    return 'warning';
  };

  const getBestMatchMessage = () => {
    if (provider.bestMatch) {
      return t('availabilityDrawer.bestMatchMessage');
    } else {
      if (provider.monthlyAvailability?.fullyAvailable === false) {
        return t('availabilityDrawer.hasScheduleVariations');
      }
      return t('availabilityDrawer.matchesMostRequirements');
    }
  };

  const getBookingTypeLabel = (bookingType: string) => {
    switch(bookingType) {
      case 'MONTHLY':
        return t('common.monthly');
      case 'WEEKLY':
        return t('common.weekly');
      case 'DAILY':
        return t('common.daily');
      default:
        return bookingType;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch(serviceType) {
      case 'COOK':
        return t('profile.page.cook');
      case 'MAID':
        return t('profile.page.maid');
      case 'NANNY':
        return t('profile.page.nanny');
      default:
        return serviceType;
    }
  };

  const getEngagementStatusLabel = (status: string) => {
    switch(status) {
      case 'ASSIGNED':
        return t('booking.status.active');
      case 'COMPLETED':
        return t('booking.status.completed');
      case 'CANCELLED':
        return t('booking.status.cancelled');
      default:
        return status;
    }
  };

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return { title: 20, subtitle: 14, text: 12, small: 11 };
      case 'large':
        return { title: 28, subtitle: 18, text: 16, small: 14 };
      default:
        return { title: 24, subtitle: 16, text: 14, small: 12 };
    }
  };

  const fontSizes = getFontSizes();

  const getInitials = () => {
    const f = provider?.firstName?.charAt(0) || '';
    const l = provider?.lastName?.charAt(0) || '';
    return `${f}${l}`.toUpperCase() || 'SP';
  };

  const getRatingLine = () => {
    const rating = provider?.rating ? provider.rating.toFixed(1) : '0.0';
    return `${rating} (120+ reviews)`;
  };

  const getSpecialtyLabel = () => {
    const languages = readProviderLanguages(provider!);
    if (languages.length > 0) return languages[0];
    if (provider?.cookingspeciality) return String(provider.cookingspeciality);
    if (provider?.diet) return String(provider.diet);
    return '—';
  };

  const getServiceDisplayLabel = () => {
    const role = String(provider?.housekeepingRole || '').toUpperCase();
    if (role === 'COOK') return t('home.services.homeCook', { defaultValue: 'Home Cook' });
    if (role === 'MAID') return t('home.services.cleaningHelp', { defaultValue: 'Maid' });
    if (role === 'NANNY') return t('home.services.caregiver', { defaultValue: 'Nanny' });
    return getServiceTypeLabel(role);
  };

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      <View style={styles.profileHeaderLeft}>
        <Text style={[styles.profileName, { fontSize: fontSizes.title }]}>
          {provider.firstName} {provider.lastName}
        </Text>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{getServiceTypeLabel(provider.housekeepingRole)}</Text>
        </View>
        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={16} color="#FBBF24" />
          <Text style={styles.ratingText}>{getRatingLine()}</Text>
        </View>
      </View>
      <View style={styles.avatarWrap}>
        <View style={styles.avatarSquare}>
          <Text style={styles.avatarInitials}>{getInitials()}</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <MaterialCommunityIcons name="check" size={10} color="#ffffff" />
        </View>
      </View>
    </View>
  );

  const renderBestMatchAlert = () => {
    if (!provider.bestMatch) {
      return (
        <View style={[styles.matchCard, styles.matchCardInfo]}>
          <View style={[styles.matchIconBox, styles.matchIconBoxInfo]}>
            <Icon name="info" size={22} color={BRAND.accent} />
          </View>
          <View style={styles.matchCardText}>
            <Text style={[styles.matchCardTitle, { color: colors.text }]}>
              {t('availabilityDrawer.goodMatch')}
            </Text>
            <Text style={[styles.matchCardMessage, { color: colors.textSecondary }]}>
              {getBestMatchMessage()}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.matchCard, styles.matchCardSuccess]}>
        <View style={[styles.matchIconBox, styles.matchIconBoxSuccess]}>
          <MaterialCommunityIcons name="fire" size={22} color="#16a34a" />
        </View>
        <View style={styles.matchCardText}>
          <Text style={[styles.matchCardTitle, { color: colors.text }]}>
            {t('availabilityDrawer.bestMatchProvider')}
          </Text>
          <Text style={[styles.matchCardMessage, { color: colors.textSecondary }]}>
            {getBestMatchMessage()}
          </Text>
        </View>
      </View>
    );
  };

  const renderPreviousBooking = () => {
    if (!provider.previouslyBooked || !provider.previousBookingDetails) {
      return null;
    }

    const details = provider.previousBookingDetails;

    return (
      <Card style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Content>
          <TouchableOpacity 
            onPress={() => setPreviousBookingExpanded(!previousBookingExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeader}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="history" size={24} color="#2196f3" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('availabilityDrawer.previousBooking')}
                </Text>
                <View style={styles.expandBadge}>
                  <Text style={styles.expandBadgeText}>
                    {t('availabilityDrawer.clickToExpand')}
                  </Text>
                </View>
              </View>
              <Icon 
                name={previousBookingExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color={colors.textSecondary} 
              />
            </View>
          </TouchableOpacity>

          {previousBookingExpanded && (
            <View style={styles.collapsibleContent}>
              <Divider style={[styles.contentDivider, { backgroundColor: colors.border }]} />

              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <MaterialCommunityIcons name="receipt" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                    {t('engagementDetails.bookingId')}:
                  </Text>
                </View>
                <Text style={[styles.detailValue, { color: colors.text }]}>#{details.engagementId}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                    {t('booking.bookingType')}:
                  </Text>
                </View>
                <View style={[styles.chip, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {getBookingTypeLabel(details.bookingType)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <MaterialCommunityIcons name="silverware" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                    {t('booking.serviceType')}:
                  </Text>
                </View>
                <View style={[styles.chip, styles.secondaryChip, { backgroundColor: colors.infoLight }]}>
                  <Text style={[styles.chipText, { color: colors.primary }]}>
                    {getServiceTypeLabel(details.serviceType)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <MaterialCommunityIcons name="calendar-today" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                    {t('booking.duration')}:
                  </Text>
                </View>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatDate(details.startDate)} - {formatDate(details.endDate)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <MaterialCommunityIcons name="information" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                    {t('common.status')}:
                  </Text>
                </View>
                <View style={[
                  styles.chip, 
                  details.engagementStatus === 'ASSIGNED' ? styles.successChip : styles.defaultChip,
                  { backgroundColor: details.engagementStatus === 'ASSIGNED' ? colors.successLight : colors.surface }
                ]}>
                  <Text style={[
                    styles.chipText, 
                    { color: details.engagementStatus === 'ASSIGNED' ? colors.success : colors.textSecondary }
                  ]}>
                    {getEngagementStatusLabel(details.engagementStatus)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <MaterialCommunityIcons name="currency-inr" size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailLabelText, { color: colors.textSecondary }]}>
                    {t('common.amount')}:
                  </Text>
                </View>
                <Text style={[styles.detailValue, styles.amountValue, { color: colors.success }]}>
                  ₹{details.baseAmount}
                </Text>
              </View>

              <Divider style={[styles.contentDivider, { backgroundColor: colors.border }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.captionText, { color: colors.textTertiary }]}>
                  {t('availabilityDrawer.bookedOn')}:
                </Text>
                <Text style={[styles.captionText, { color: colors.textTertiary }]}>
                  {formatDateTime(details.createdAt)}
                </Text>
              </View>

              <View style={[styles.alert, styles.infoAlert, styles.smallAlert, { backgroundColor: colors.infoLight }]}>
                <Text style={[styles.alertMessageSmall, { color: colors.textSecondary }]}>
                  {t('availabilityDrawer.previouslyBookedMessage')}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderMonthlyAvailability = () => {
    const isFullyAvailable = provider.monthlyAvailability?.fullyAvailable === true;
    
    return (
      <Card style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="calendar-month" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('availabilityDrawer.monthlyAvailability')}
            </Text>
            <View style={[
              styles.statusBadge,
              isFullyAvailable ? styles.statusBadgeSuccess : styles.statusBadgeWarning,
              { backgroundColor: isFullyAvailable ? colors.successLight : colors.warningLight }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: isFullyAvailable ? colors.success : colors.warning }
              ]}>
                {getAvailabilityStatus()}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              {t('availabilityDrawer.preferredWorkingTime')}
            </Text>
            <View style={[styles.timeInfo, { backgroundColor: colors.surface }]}>
              <Icon name="access-time" size={20} color={colors.textSecondary} />
              <Text style={[styles.timeText, { color: colors.text }]}>
                {formatTime(provider.monthlyAvailability?.preferredTime)}
              </Text>
              <View style={[styles.dailyBadge, { borderColor: colors.primary }]}>
                <Text style={[styles.dailyBadgeText, { color: colors.primary }]}>
                  {t('common.daily')}
                </Text>
              </View>
            </View>
          </View>

          {provider.monthlyAvailability?.summary && (
            <View style={styles.infoSection}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t('availabilityDrawer.availabilitySummaryNext30Days')}
              </Text>
              
              <View style={styles.summaryItem}>
                <View style={styles.summaryLabel}>
                  <Icon name="event-available" size={20} color={colors.success} />
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    {t('availabilityDrawer.daysAtPreferredTime')}
                  </Text>
                </View>
                <View style={styles.summaryValue}>
                  <Text style={[styles.daysCount, { color: colors.text }]}>
                    {provider.monthlyAvailability.summary.daysAtPreferredTime} {t('common.days')}
                  </Text>
                </View>
              </View>

              {provider.monthlyAvailability.summary.daysWithDifferentTime > 0 && (
                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabel}>
                    <Icon name="access-time" size={20} color={colors.warning} />
                    <Text style={[styles.summaryText, { color: colors.text }]}>
                      {t('availabilityDrawer.daysWithDifferentTime')}
                    </Text>
                  </View>
                  <View style={styles.summaryValue}>
                    <Text style={[styles.daysCount, { color: colors.text }]}>
                      {provider.monthlyAvailability.summary.daysWithDifferentTime} {t('common.days')}
                    </Text>
                  </View>
                </View>
              )}

              {provider.monthlyAvailability.summary.unavailableDays > 0 && (
                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabel}>
                    <Icon name="event-busy" size={20} color={colors.error} />
                    <Text style={[styles.summaryText, { color: colors.text }]}>
                      {t('availabilityDrawer.unavailableDays')}
                    </Text>
                  </View>
                  <View style={styles.summaryValue}>
                    <Text style={[styles.daysCount, { color: colors.text }]}>
                      {provider.monthlyAvailability.summary.unavailableDays} {t('common.days')}
                    </Text>
                  </View>
                </View>
              )}

              <Divider style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

              <View style={styles.totalItem}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  {t('availabilityDrawer.totalAvailableDays')}
                </Text>
                <View style={styles.totalValue}>
                  <Text style={[styles.totalDays, { color: colors.primary }]}>
                    {provider.monthlyAvailability.summary.totalDays} {t('common.days')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderExceptions = () => {
    if (!provider.monthlyAvailability?.exceptions || 
        provider.monthlyAvailability.exceptions.length === 0) {
      return null;
    }

    return (
      <Card style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Card.Content>
          <TouchableOpacity 
            onPress={() => setScheduleExceptionsExpanded(!scheduleExceptionsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleHeader}>
              <View style={styles.exceptionsHeader}>
                <Icon name="warning" size={24} color={colors.warning} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('availabilityDrawer.scheduleExceptions')}
                </Text>
                <View style={[styles.exceptionCountBadge, { backgroundColor: colors.warningLight }]}>
                  <Text style={[styles.exceptionCountText, { color: colors.warning }]}>
                    {provider.monthlyAvailability.exceptions.length} {t('availabilityDrawer.exception')}(s)
                  </Text>
                </View>
                <View style={styles.expandBadge}>
                  <Text style={styles.expandBadgeText}>
                    {t('availabilityDrawer.clickToExpand')}
                  </Text>
                </View>
              </View>
              <Icon 
                name={scheduleExceptionsExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color={colors.textSecondary} 
              />
            </View>
          </TouchableOpacity>

          {scheduleExceptionsExpanded && (
            <View style={styles.collapsibleContent}>
              {provider.monthlyAvailability.exceptions.map((exception, index) => (
                <View key={index} style={[styles.exceptionItem, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
                  <View style={styles.exceptionHeaderRow}>
                    <Text style={[styles.exceptionDate, { color: colors.text }]}>
                      {moment(exception.date).format('ddd, MMM D, YYYY')}
                    </Text>
                    <View style={[styles.exceptionReasonBadge, { backgroundColor: colors.warning }]}>
                      <Text style={styles.exceptionReasonText}>
                        {exception.reason?.replace('_', ' ') || t('availabilityDrawer.exception')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.exceptionDescription, { color: colors.textSecondary }]}>
                    {exception.reason === 'ON_DEMAND' 
                      ? t('availabilityDrawer.availableOnDemand')
                      : t('availabilityDrawer.notAvailableAtPreferredTime')}
                  </Text>
                  {exception.suggestedTime && (
                    <View style={styles.suggestedTime}>
                      <Icon name="access-time" size={16} color={colors.textSecondary} />
                      <Text style={[styles.suggestedTimeText, { color: colors.text }]}>
                        {t('availabilityDrawer.suggestedTime')}: {formatTime(exception.suggestedTime)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              <View style={[styles.alert, styles.infoAlert, styles.exceptionAlert, { backgroundColor: colors.infoLight }]}>
                <Text style={[styles.exceptionNote, { color: colors.textSecondary }]}>
                  {t('availabilityDrawer.exceptionNote')}
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderNotices = () => (
    <View style={styles.notices}>
      {provider.monthlyAvailability?.fullyAvailable && (
        <View style={[styles.matchCard, styles.availabilityCard]}>
          <View style={[styles.matchIconBox, styles.availabilityIconBox]}>
            <Icon name="check-circle" size={22} color={BRAND.accent} />
          </View>
          <View style={styles.matchCardText}>
            <Text style={[styles.matchCardTitle, { color: colors.text }]}>
              {t('availabilityDrawer.perfectAvailability')}
            </Text>
            <Text style={[styles.matchCardMessage, { color: colors.textSecondary }]}>
              {t('availabilityDrawer.perfectAvailabilityMessage')}
            </Text>
          </View>
        </View>
      )}

      {!provider.bestMatch && provider.monthlyAvailability?.fullyAvailable === false && (
        <View style={[styles.matchCard, styles.matchCardWarning]}>
          <View style={[styles.matchIconBox, styles.matchIconBoxWarning]}>
            <Icon name="info" size={22} color="#d97706" />
          </View>
          <View style={styles.matchCardText}>
            <Text style={[styles.matchCardTitle, { color: colors.text }]}>
              {t('availabilityDrawer.whyThisIsntBestMatch')}
            </Text>
            <Text style={[styles.matchCardMessage, { color: colors.textSecondary }]}>
              {t('availabilityDrawer.hasScheduleVariations')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderExpertise = () => (
    <View style={styles.expertiseSection}>
      <Text style={[styles.expertiseHeading, { color: colors.text }]}>Expertise</Text>
      <View style={styles.expertiseGrid}>
        <View style={[styles.expertiseCard, { backgroundColor: isDarkMode ? colors.surface : '#F1F5F9' }]}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.textSecondary} />
          <Text style={[styles.expertiseLabel, { color: colors.textSecondary }]}>Service</Text>
          <Text style={[styles.expertiseValue, { color: colors.text }]}>{getServiceDisplayLabel()}</Text>
        </View>
        <View style={[styles.expertiseCard, { backgroundColor: isDarkMode ? colors.surface : '#F1F5F9' }]}>
          <MaterialCommunityIcons name="earth" size={20} color={colors.textSecondary} />
          <Text style={[styles.expertiseLabel, { color: colors.textSecondary }]}>Specialty</Text>
          <Text style={[styles.expertiseValue, { color: colors.text }]} numberOfLines={1}>
            {getSpecialtyLabel()}
          </Text>
        </View>
        <View style={[styles.expertiseCard, { backgroundColor: isDarkMode ? colors.surface : '#F1F5F9' }]}>
          <MaterialCommunityIcons name="briefcase-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.expertiseLabel, { color: colors.textSecondary }]}>Experience</Text>
          <Text style={[styles.expertiseValue, { color: colors.text }]}>
            {provider.experience || 1} Years Exp
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabRow, { borderBottomColor: colors.border, backgroundColor: isDarkMode ? colors.card : '#ffffff' }]}>
      {[
        { key: 'overview', label: 'Overview' },
        { key: 'availability', label: 'Availability' },
        { key: 'history', label: 'History' },
      ].map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              selected && [styles.tabButtonActive, { borderBottomColor: BRAND.bookingNavy }],
            ]}
            onPress={() => setActiveTab(tab.key as 'overview' | 'availability' | 'history')}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: selected ? BRAND.bookingNavy : colors.textSecondary },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <>
          {renderBestMatchAlert()}
          {renderNotices()}
          {renderExpertise()}
        </>
      );
    }

    if (activeTab === 'availability') {
      return (
        <>
          {renderMonthlyAvailability()}
          {renderExceptions()}
        </>
      );
    }

    return (
      <>
        {renderPreviousBooking()}
        {!provider.previouslyBooked && (
          <View style={[styles.alert, styles.infoAlert, { backgroundColor: colors.infoLight }]}>
            <View style={styles.alertTextContainer}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>No booking history yet</Text>
              <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                This provider has no previous booking record with your account.
              </Text>
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <Portal>
      <Modal
        visible
        onRequestClose={handleSheetClose}
        animationType="slide"
        transparent
        style={styles.modal}
      >
        <PaperProvider>
          <View style={styles.backdrop}>
            <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
              <BottomSheetScaffold
                backgroundColor={isDarkMode ? colors.background : '#ffffff'}
                borderColor={colors.border}
                style={styles.container}
              >
              {renderHeader()}
              {renderTabs()}
              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {renderTabContent()}
              </ScrollView>
              <View style={[styles.footerBar, { borderTopColor: colors.border, backgroundColor: isDarkMode ? colors.card : '#ffffff' }]}>
                <TouchableOpacity
                  style={[styles.footerGhostButton, { borderColor: colors.text }]}
                  onPress={handleSheetClose}
                >
                  <Text style={[styles.footerGhostText, { color: colors.text }]}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerPrimaryButton, { backgroundColor: BRAND.bookingNavy }]}
                  onPress={() => onBookNow?.()}
                >
                  <Text style={styles.footerPrimaryText}>Book Now</Text>
                  <Icon name="chevron-right" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              </BottomSheetScaffold>
            </Animated.View>
          </View>
        </PaperProvider>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 6, 23, 0.42)',
  },
  container: {
    minHeight: '70%',
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: BRAND.bookingNavy,
  },
  profileHeaderLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  profileName: {
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  rolePillText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatarSquare: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: BRAND.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: BRAND.bookingNavy,
    fontWeight: '800',
    fontSize: 18,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EAB308',
    borderWidth: 2,
    borderColor: BRAND.bookingNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {},
  tabButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  matchCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  matchCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: BRAND.accent,
  },
  matchCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  availabilityCard: {
    backgroundColor: BRAND.accentSoft,
    borderColor: '#BFDBFE',
    borderLeftWidth: 0,
  },
  matchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  matchIconBoxSuccess: {
    backgroundColor: '#DCFCE7',
  },
  matchIconBoxInfo: {
    backgroundColor: BRAND.accentSoft,
  },
  matchIconBoxWarning: {
    backgroundColor: '#FEF3C7',
  },
  availabilityIconBox: {
    backgroundColor: '#DBEAFE',
  },
  matchCardText: {
    flex: 1,
    minWidth: 0,
  },
  matchCardTitle: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  matchCardMessage: {
    fontSize: 13,
    lineHeight: 19,
  },
  expertiseSection: {
    marginTop: 8,
  },
  expertiseHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  expertiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  expertiseCard: {
    width: '31%',
    minWidth: 100,
    flexGrow: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    gap: 4,
  },
  expertiseLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  expertiseValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  footerBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  footerGhostButton: {
    flex: 0.9,
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  footerGhostText: {
    fontWeight: '700',
    fontSize: 15,
  },
  footerPrimaryButton: {
    flex: 1.4,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  footerPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  alert: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  alertMessageSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  successAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  warningAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  mainCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 12,
    marginRight: 'auto',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsibleContent: {
    marginTop: 16,
  },
  contentDivider: {
    marginVertical: 12,
    height: 1,
  },
  expandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginLeft: 8,
  },
  expandBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeSuccess: {},
  statusBadgeWarning: {},
  statusBadgeText: {
    fontWeight: '700',
    fontSize: 12,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeText: {
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 12,
    marginRight: 'auto',
  },
  dailyBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  summaryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryText: {
    fontSize: 15,
    marginLeft: 12,
  },
  summaryValue: {
    alignItems: 'flex-end',
  },
  daysCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryDivider: {
    marginVertical: 16,
    height: 1,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    alignItems: 'flex-end',
  },
  totalDays: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabelText: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  captionText: {
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  secondaryChip: {},
  successChip: {},
  defaultChip: {},
  smallAlert: {
    marginTop: 12,
    padding: 12,
  },
  exceptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exceptionCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  exceptionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exceptionItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  exceptionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  exceptionDate: {
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  exceptionReasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exceptionReasonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  exceptionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  suggestedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  suggestedTimeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  exceptionAlert: {
    marginTop: 16,
  },
  exceptionNote: {
    fontSize: 14,
    lineHeight: 20,
  },
  notices: {
    marginTop: 8,
  },
  noticeAlert: {
    marginBottom: 16,
  },
});

export default ProviderAvailabilityDrawer;