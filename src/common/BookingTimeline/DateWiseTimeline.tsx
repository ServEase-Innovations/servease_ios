/**
 * DateWiseTimeline Component (iOS/React Native)
 * 
 * Displays comprehensive date-by-date timeline for MONTHLY and SHORT_TERM bookings
 * Shows service history with actual start/end times for each day
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import dayjs from 'dayjs';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URLS } from '../../config/apiUrls';

export interface ServiceDayData {
  service_day_id: number;
  service_date: string;
  status: string;
  scheduled: {
    start_time: string;
    end_time: string;
    start_epoch: number;
    end_epoch: number;
  };
  actual?: {
    start_epoch: number;
    end_epoch?: number;
    start_time: string;
    end_time?: string;
  };
  early_start_minutes: number;
  started_at?: string;
  completed_at?: string;
}

export interface DateWiseTimelineProps {
  engagementId: number;
  bookingType: string;
  authToken?: string;
}

const formatDate = (dateStr: string): string => {
  return dayjs(dateStr).format('MMM D, YYYY');
};

const formatDateShort = (dateStr: string): string => {
  return dayjs(dateStr).format('MMM D');
};

const formatDay = (dateStr: string): string => {
  return dayjs(dateStr).format('ddd');
};

const isToday = (dateStr: string): boolean => {
  return dayjs(dateStr).isSame(dayjs(), 'day');
};

const isPast = (dateStr: string): boolean => {
  return dayjs(dateStr).isBefore(dayjs(), 'day');
};

const isFuture = (dateStr: string): boolean => {
  return dayjs(dateStr).isAfter(dayjs(), 'day');
};

const DateWiseTimeline: React.FC<DateWiseTimelineProps> = ({
  engagementId,
  bookingType,
  authToken,
}) => {
  const [serviceDays, setServiceDays] = useState<ServiceDayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const fetchServiceDays = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from AsyncStorage
        const token = authToken || await AsyncStorage.getItem('token');
        
        // Use the same base URL as PaymentInstance
        const apiUrl = API_URLS.payments;
        
        const response = await axios.get(
          `${apiUrl}/api/engagements/${engagementId}/service-days`,
          {
            headers: token ? {
              Authorization: `Bearer ${token}`,
            } : {},
          }
        );

        if (response.data.success) {
          setServiceDays(response.data.service_days || []);
        } else {
          setError('Failed to load service days');
        }
      } catch (err: any) {
        console.error('Error fetching service days:', err);
        setError(err.response?.data?.error || 'Failed to load service days');
      } finally {
        setLoading(false);
      }
    };

    if (engagementId) {
      fetchServiceDays();
    }
  }, [engagementId, authToken]);

  const completedCount = serviceDays.filter(sd => sd.status.toUpperCase() === 'COMPLETED').length;
  const upcomingCount = serviceDays.filter(sd => sd.status.toUpperCase() === 'SCHEDULED' && isFuture(sd.service_date)).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (error) {
    // Silently skip if endpoint doesn't exist (404) or other errors
    // This allows the rest of the timeline to work even if this feature isn't deployed yet
    console.log('DateWiseTimeline: Endpoint not available or error occurred:', error);
    return null;
  }

  if (serviceDays.length === 0) {
    // Don't show anything if there are no service days
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Icon name="calendar" size={20} color="#6B7280" />
          <Text style={styles.headerTitle}>Date-Wise Service History</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.statsText}>
            {completedCount} completed • {upcomingCount} upcoming • {serviceDays.length} total
          </Text>
          <Icon 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6B7280" 
          />
        </View>
      </TouchableOpacity>

      {/* Timeline */}
      {expanded && (
        <ScrollView style={styles.timeline} nestedScrollEnabled>
          {serviceDays.map((serviceDay, index) => {
            const isLast = index === serviceDays.length - 1;
            const dayIsToday = isToday(serviceDay.service_date);
            const statusUpper = serviceDay.status.toUpperCase();
            const isCompleted = statusUpper === 'COMPLETED';
            const isActive = statusUpper === 'IN_PROGRESS';
            const hasActual = !!serviceDay.actual;
            const isEarly = serviceDay.early_start_minutes > 0;

            return (
              <View key={serviceDay.service_day_id} style={styles.timelineItem}>
                {/* Timeline dot */}
                <View style={styles.dotContainer}>
                  <View style={[
                    styles.dot,
                    isCompleted && styles.dotCompleted,
                    isActive && styles.dotActive,
                  ]} />
                  {!isLast && <View style={[
                    styles.connector,
                    isCompleted && styles.connectorCompleted,
                    isActive && styles.connectorActive,
                  ]} />}
                </View>

                {/* Service card */}
                <View style={[
                  styles.serviceCard,
                  dayIsToday && styles.serviceCardToday,
                  isCompleted && styles.serviceCardCompleted,
                  isActive && styles.serviceCardActive,
                ]}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.dateInfo}>
                      <Text style={styles.dateText}>
                        {formatDateShort(serviceDay.service_date)}
                      </Text>
                      <Text style={styles.dayText}>
                        {formatDay(serviceDay.service_date)}
                      </Text>
                      {dayIsToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>Today</Text>
                        </View>
                      )}
                    </View>
                    <View style={[
                      styles.statusBadge,
                      isCompleted && styles.statusBadgeCompleted,
                      isActive && styles.statusBadgeActive,
                    ]}>
                      <Icon 
                        name={isCompleted ? "check-circle" : isActive ? "clock" : "clock"} 
                        size={12} 
                        color={isCompleted ? "#10B981" : isActive ? "#3B82F6" : "#6B7280"}
                      />
                      <Text style={[
                        styles.statusText,
                        isCompleted && styles.statusTextCompleted,
                        isActive && styles.statusTextActive,
                      ]}>
                        {isCompleted ? 'Completed' : isActive ? 'Active' : 'Scheduled'}
                      </Text>
                    </View>
                  </View>

                  {/* Early Start Alert */}
                  {isEarly && hasActual && (
                    <View style={styles.earlyAlert}>
                      <Text style={styles.earlyAlertText}>
                        ✓ Started {serviceDay.early_start_minutes} minutes early
                      </Text>
                    </View>
                  )}

                  {/* Times Grid */}
                  <View style={styles.timesGrid}>
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeLabel}>Start Time</Text>
                      <Text style={styles.timeValue}>
                        {serviceDay.scheduled.start_time}
                      </Text>
                    </View>
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeLabel}>End Time</Text>
                      <Text style={styles.timeValue}>
                        {serviceDay.scheduled.end_time}
                      </Text>
                    </View>
                  </View>

                  {/* Actual Times */}
                  {hasActual && serviceDay.actual && (
                    <View style={styles.timesGrid}>
                      <View style={styles.timeColumn}>
                        <Text style={styles.timeLabelActual}>Started At</Text>
                        <View style={styles.actualTimeContainer}>
                          <Text style={styles.timeValueActualStart}>
                            {serviceDay.actual.start_time}
                          </Text>
                          <Icon name="check-circle" size={14} color="#10B981" />
                        </View>
                      </View>
                      {serviceDay.actual.end_time && (
                        <View style={styles.timeColumn}>
                          <Text style={styles.timeLabelActual}>Ended At</Text>
                          <View style={styles.actualTimeContainer}>
                            <Text style={styles.timeValueActualEnd}>
                              {serviceDay.actual.end_time}
                            </Text>
                            <Icon name="check-circle" size={14} color="#3B82F6" />
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  emptyContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 8,
  },
  timeline: {
    maxHeight: 600,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dotContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  dotActive: {
    backgroundColor: '#3B82F6',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  connectorCompleted: {
    backgroundColor: '#A7F3D0',
  },
  connectorActive: {
    backgroundColor: '#93C5FD',
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  serviceCardToday: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  serviceCardCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  serviceCardActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginRight: 6,
  },
  dayText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
  },
  todayBadge: {
    backgroundColor: '#FDE047',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#854D0E',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusTextCompleted: {
    color: '#047857',
  },
  statusTextActive: {
    color: '#1E40AF',
  },
  earlyAlert: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderRadius: 4,
    padding: 6,
    marginBottom: 8,
  },
  earlyAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  timesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  timeLabelActual: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actualTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValueActualStart: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginRight: 4,
  },
  timeValueActualEnd: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 4,
  },
});

export default DateWiseTimeline;
