/* eslint-disable */
import React from 'react';
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

interface ProviderAvailabilityDrawerProps {
  open: boolean;
  onClose: () => void;
  provider: ServiceProviderDTO | null;
}

const ProviderAvailabilityDrawer: React.FC<ProviderAvailabilityDrawerProps> = ({
  open,
  onClose,
  provider,
}) => {
  if (!provider) return null;

  const formatTime = (timeString: string) => {
    if (!timeString) return '08:00 AM';
    return moment(timeString, 'HH:mm').format('hh:mm A');
  };

  const getAvailabilityStatus = () => {
    const availability = provider.monthlyAvailability;
    if (!availability) return 'Unknown';
    
    if (availability.fullyAvailable) return 'Fully Available';
    return 'Partially Available';
  };

  const getBestMatchMessage = () => {
    if (provider.bestMatch) {
      return "This provider perfectly matches all your requirements and preferences.";
    } else {
      if (provider.monthlyAvailability?.fullyAvailable === false) {
        return "This provider has some schedule variations. Check availability details below.";
      }
      return "This provider matches most of your requirements.";
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Availability Details
        </Text>
        <View style={styles.providerInfo}>
          <Text variant="titleMedium" style={styles.providerName}>
            {provider.firstName} {provider.lastName}
          </Text>
          {provider.bestMatch && (
            <View style={styles.bestMatchBadge}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.bestMatchText}>Best Match</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={28} color="#000" />
      </TouchableOpacity>
    </View>
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
              Best Match Provider!
            </Text>
            <Text style={styles.alertMessage}>
              This provider perfectly matches all your requirements and preferences.
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
              Good Match
            </Text>
            <Text style={styles.alertMessage}>
              {getBestMatchMessage()}
            </Text>
          </View>
        </View>
      );
    }
  };

  const renderMonthlyAvailability = () => {
    const isFullyAvailable = provider.monthlyAvailability?.fullyAvailable === true;
    
    return (
      <Card style={styles.mainCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="calendar-month" size={24} color="#333" />
            <Text style={styles.sectionTitle}>Monthly Availability</Text>
            <View style={[
              styles.statusBadge,
              isFullyAvailable ? styles.statusBadgeSuccess : styles.statusBadgeWarning
            ]}>
              <Text style={styles.statusBadgeText}>
                {getAvailabilityStatus()}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Preferred Working Time</Text>
            <View style={styles.timeInfo}>
              <Icon name="access-time" size={20} color="#666" />
              <Text style={styles.timeText}>
                {formatTime(provider.monthlyAvailability?.preferredTime)}
              </Text>
              <View style={styles.dailyBadge}>
                <Text style={styles.dailyBadgeText}>Daily</Text>
              </View>
            </View>
          </View>

          {provider.monthlyAvailability?.summary && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Availability Summary (Next 30 days)</Text>
              
              <View style={styles.summaryItem}>
                <View style={styles.summaryLabel}>
                  <Icon name="event-available" size={20} color="#4caf50" />
                  <Text style={styles.summaryText}>Days at preferred time</Text>
                </View>
                <View style={styles.summaryValue}>
                  <Text style={styles.daysCount}>
                    {provider.monthlyAvailability.summary.daysAtPreferredTime} days
                  </Text>
                </View>
              </View>

              {provider.monthlyAvailability.summary.daysWithDifferentTime > 0 && (
                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabel}>
                    <Icon name="access-time" size={20} color="#ff9800" />
                    <Text style={styles.summaryText}>Days with different time</Text>
                  </View>
                  <View style={styles.summaryValue}>
                    <Text style={styles.daysCount}>
                      {provider.monthlyAvailability.summary.daysWithDifferentTime} days
                    </Text>
                  </View>
                </View>
              )}

              {provider.monthlyAvailability.summary.unavailableDays > 0 && (
                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabel}>
                    <Icon name="event-busy" size={20} color="#f44336" />
                    <Text style={styles.summaryText}>Unavailable days</Text>
                  </View>
                  <View style={styles.summaryValue}>
                    <Text style={styles.daysCount}>
                      {provider.monthlyAvailability.summary.unavailableDays} days
                    </Text>
                  </View>
                </View>
              )}

              <Divider style={styles.summaryDivider} />

              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Total available days</Text>
                <View style={styles.totalValue}>
                  <Text style={styles.totalDays}>
                    {provider.monthlyAvailability.summary.totalDays} days
                  </Text>
                </View>
              </View>
            </View>
          )}

          {!provider.monthlyAvailability?.summary && (
            <View style={styles.noDataSection}>
              <Icon name="info" size={20} color="#666" />
              <Text style={styles.noDataText}>
                Detailed availability information is not available for this provider.
              </Text>
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
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.exceptionsHeader}>
            <Icon name="warning" size={24} color="#ff9800" />
            <Text style={styles.sectionTitle}>Schedule Exceptions</Text>
            <View style={styles.exceptionCountBadge}>
              <Text style={styles.exceptionCountText}>
                {provider.monthlyAvailability.exceptions.length} exception(s)
              </Text>
            </View>
          </View>

          {provider.monthlyAvailability.exceptions.map((exception, index) => (
            <View key={index} style={styles.exceptionItem}>
              <View style={styles.exceptionHeaderRow}>
                <Text style={styles.exceptionDate}>
                  {moment(exception.date).format('ddd, MMM D, YYYY')}
                </Text>
                <View style={styles.exceptionReasonBadge}>
                  <Text style={styles.exceptionReasonText}>
                    {exception.reason?.replace('_', ' ') || 'Exception'}
                  </Text>
                </View>
              </View>
              <Text style={styles.exceptionDescription}>
                {exception.reason === 'ON_DEMAND' 
                  ? 'Available on demand at different time'
                  : 'Not available at preferred time'}
              </Text>
              {exception.suggestedTime && (
                <View style={styles.suggestedTime}>
                  <Icon name="access-time" size={16} color="#666" />
                  <Text style={styles.suggestedTimeText}>
                    Suggested time: {formatTime(exception.suggestedTime)}
                  </Text>
                </View>
              )}
            </View>
          ))}

          <View style={[styles.alert, styles.infoAlert, styles.exceptionAlert]}>
            <Text style={styles.exceptionNote}>
              These dates have different availability. You can still book for these dates,
              but the timing might vary.
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderNotices = () => (
    <View style={styles.notices}>
      {provider.monthlyAvailability?.fullyAvailable && (
        <View style={[styles.alert, styles.successAlert, styles.noticeAlert]}>
          <View style={styles.alertIconContainer}>
            <Icon name="check-circle" size={24} color="#4caf50" />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>
              Perfect Availability!
            </Text>
            <Text style={styles.alertMessage}>
              This provider is fully available at their preferred time for the entire month.
              No schedule conflicts or exceptions.
            </Text>
          </View>
        </View>
      )}

      {!provider.bestMatch && provider.monthlyAvailability?.fullyAvailable === false && (
        <View style={[styles.alert, styles.warningAlert, styles.noticeAlert]}>
          <View style={styles.alertIconContainer}>
            <Icon name="info" size={24} color="#ff9800" />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>
              Why this isn't a Best Match?
            </Text>
            <Text style={styles.alertMessage}>
              This provider has some schedule variations during the month which prevents 
              them from being marked as a "Best Match". However, they're still highly 
              available and can accommodate your needs on most days.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

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
          <View style={styles.container}>
            {renderHeader()}
            <Divider />
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderBestMatchAlert()}
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 8,
    color: '#000',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  providerName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  bestMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestMatchText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#FF8F00',
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
    color: '#000',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  successAlert: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoAlert: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  warningAlert: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  mainCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#000',
    marginLeft: 12,
    marginRight: 'auto',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeWarning: {
    backgroundColor: '#FF9800',
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeText: {
    fontWeight: '700',
    fontSize: 18,
    color: '#000',
    marginLeft: 12,
    marginRight: 'auto',
  },
  dailyBadge: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyBadgeText: {
    color: '#2196F3',
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
    color: '#333',
    marginLeft: 12,
  },
  summaryValue: {
    alignItems: 'flex-end',
  },
  daysCount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  summaryDivider: {
    marginVertical: 16,
    backgroundColor: '#E0E0E0',
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
    color: '#000',
  },
  totalValue: {
    alignItems: 'flex-end',
  },
  totalDays: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  noDataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  noDataText: {
    marginLeft: 12,
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  exceptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  exceptionCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  exceptionCountText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '600',
  },
  exceptionItem: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
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
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  exceptionReasonBadge: {
    backgroundColor: '#FF9800',
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
    color: '#666',
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
    color: '#333',
  },
  exceptionAlert: {
    marginTop: 16,
  },
  exceptionNote: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  notices: {
    marginTop: 8,
  },
  noticeAlert: {
    marginBottom: 16,
  },
});

export default ProviderAvailabilityDrawer;