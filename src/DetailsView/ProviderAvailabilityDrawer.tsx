/* eslint-disable */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Modal,
  StyleSheet,
  TouchableOpacity,
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
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/Settings/ThemeContext';

interface ProviderAvailabilityDrawerProps {
  open: boolean;
  onClose: () => void;
  provider: ServiceProviderDTO | null;
}

const formatDateTime = (dateString: string) => {
  return moment(dateString).format('MMM D, YYYY • hh:mm A');
};

const ProviderAvailabilityDrawer: React.FC<ProviderAvailabilityDrawerProps> = ({
  open,
  onClose,
  provider,
}) => {
  const { t } = useTranslation();
  const { colors, isDarkMode, fontSize } = useTheme();
  
  const [previousBookingExpanded, setPreviousBookingExpanded] = useState(false);
  const [scheduleExceptionsExpanded, setScheduleExceptionsExpanded] = useState(false);

  if (!provider) return null;

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

  const renderHeader = () => (
    <LinearGradient
      colors={["#0a2a66ff", "#004aadff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>
          {t('availabilityDrawer.availabilityDetails')}
        </Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>
            {provider.firstName} {provider.lastName}
          </Text>
          {provider.bestMatch && (
            <View style={styles.bestMatchBadge}>
              <MaterialCommunityIcons name="fire" size={14} color="#FFD700" />
              <Text style={styles.bestMatchText}>{t('provider.bestMatch')}</Text>
            </View>
          )}
          {provider.previouslyBooked && (
            <View style={styles.previouslyBookedBadge}>
              <MaterialCommunityIcons name="history" size={14} color="#ffffff" />
              <Text style={styles.previouslyBookedText}>{t('availabilityDrawer.previouslyBooked')}</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={28} color="#fcf7f7" />
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderBestMatchAlert = () => {
    if (provider.bestMatch) {
      return (
        <View style={[styles.alert, styles.successAlert]}>
          <View style={styles.alertIconContainer}>
            <MaterialCommunityIcons 
              name="fire" 
              size={24} 
              color="#4caf50"
            />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>
              {t('availabilityDrawer.bestMatchProvider')}
            </Text>
            <Text style={styles.alertMessage}>
              {getBestMatchMessage()}
            </Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={[styles.alert, styles.infoAlert]}>
          <View style={styles.alertIconContainer}>
            <Icon name="info" size={24} color="#2196f3" />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>
              {t('availabilityDrawer.goodMatch')}
            </Text>
            <Text style={styles.alertMessage}>
              {getBestMatchMessage()}
            </Text>
          </View>
        </View>
      );
    }
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
        <View style={[styles.alert, styles.successAlert, styles.noticeAlert, { backgroundColor: colors.successLight }]}>
          <View style={styles.alertIconContainer}>
            <Icon name="check-circle" size={24} color={colors.success} />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {t('availabilityDrawer.perfectAvailability')}
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {t('availabilityDrawer.perfectAvailabilityMessage')}
            </Text>
          </View>
        </View>
      )}

      {!provider.bestMatch && provider.monthlyAvailability?.fullyAvailable === false && (
        <View style={[styles.alert, styles.warningAlert, styles.noticeAlert, { backgroundColor: colors.warningLight }]}>
          <View style={styles.alertIconContainer}>
            <Icon name="info" size={24} color={colors.warning} />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {t('availabilityDrawer.whyThisIsntBestMatch')}
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {t('availabilityDrawer.hasScheduleVariations')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Get font sizes based on theme
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

  return (
    <Portal>
      <Modal
        visible={open}
        onRequestClose={onClose}
        animationType="slide"
        presentationStyle="pageSheet"
        style={styles.modal}
      >
        <PaperProvider>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            {renderHeader()}
            <Divider style={{ backgroundColor: colors.border }} />
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderBestMatchAlert()}
              {renderPreviousBooking()}
              {renderMonthlyAvailability()}
              {renderExceptions()}
              {renderNotices()}
            </ScrollView>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 8,
    color: '#ffffff',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#ffffff',
  },
  bestMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestMatchText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
  },
  previouslyBookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previouslyBookedText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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