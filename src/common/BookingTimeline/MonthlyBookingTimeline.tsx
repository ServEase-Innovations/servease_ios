/**
 * MonthlyBookingTimeline Component (iOS/React Native)
 * 
 * Displays timeline for MONTHLY and SHORT_TERM bookings
 * Shows booking period, daily schedule, and today's service with actual times
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import dayjs from 'dayjs';

export interface MonthlyTimelineData {
  booking_period: {
    start_date: string;
    end_date: string;
    total_days: number;
  };
  daily_schedule: {
    scheduled_start_time: string;
    scheduled_end_time: string;
    duration_minutes: number;
  };
  current_service?: {
    date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    actual_start_time?: string;
    actual_start_epoch?: number;
    actual_end_time?: string;
    actual_end_epoch?: number;
    status: string;
    early_start_minutes?: number;
  };
}

export interface MonthlyBookingTimelineProps {
  timeline: MonthlyTimelineData;
  bookingType: string;
}

const formatDate = (dateStr: string): string => {
  return dayjs(dateStr).format('MMM D, YYYY');
};

const getDaysBetween = (startDate: string, endDate: string): number => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return end.diff(start, 'day') + 1;
};

const MonthlyBookingTimeline: React.FC<MonthlyBookingTimelineProps> = ({
  timeline,
  bookingType,
}) => {
  const totalDays = timeline.booking_period?.total_days || 
    getDaysBetween(timeline.booking_period.start_date, timeline.booking_period.end_date);
  
  const hasCurrentService = !!timeline.current_service;
  const isServiceActive = timeline.current_service?.status === 'IN_PROGRESS';
  const isServiceCompleted = timeline.current_service?.status === 'COMPLETED';
  const hasActualStartTime = !!(timeline.current_service?.actual_start_epoch || timeline.current_service?.actual_start_time);
  const hasActualEndTime = !!(timeline.current_service?.actual_end_epoch || timeline.current_service?.actual_end_time);
  const isEarly = timeline.current_service?.early_start_minutes && timeline.current_service.early_start_minutes > 0;

  return (
    <View style={styles.container}>
      {/* Booking Period */}
      <View style={styles.bookingPeriod}>
        <View style={styles.sectionHeader}>
          <Icon name="calendar" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>
            {bookingType === 'MONTHLY' ? 'Monthly Booking Period' : 'Booking Period'}
          </Text>
        </View>
        
        <View style={styles.periodGrid}>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>Start Date</Text>
            <Text style={styles.periodValue}>
              {formatDate(timeline.booking_period.start_date)}
            </Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>End Date</Text>
            <Text style={styles.periodValue}>
              {formatDate(timeline.booking_period.end_date)}
            </Text>
          </View>
        </View>
        
        <View style={styles.durationRow}>
          <Text style={styles.durationLabel}>Total Duration</Text>
          <Text style={styles.durationValue}>
            {totalDays} {totalDays === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      {/* Daily Schedule */}
      <View style={styles.dailySchedule}>
        <View style={styles.sectionHeader}>
          <Icon name="clock" size={20} color="#6B7280" />
          <Text style={styles.sectionTitle}>Daily Service Schedule</Text>
        </View>
        
        <View style={styles.scheduleContent}>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Service Time</Text>
            <Text style={styles.scheduleValue}>
              {timeline.daily_schedule.scheduled_start_time} - {timeline.daily_schedule.scheduled_end_time}
            </Text>
          </View>
          
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Duration</Text>
            <Text style={styles.scheduleValue}>
              {timeline.daily_schedule.duration_minutes} minutes
            </Text>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Service provider will arrive daily at the scheduled time during the booking period
            </Text>
          </View>
        </View>
      </View>

      {/* Today's Service */}
      {hasCurrentService && timeline.current_service && (
        <View style={[
          styles.todayService,
          isServiceActive && styles.todayServiceActive,
          isServiceCompleted && styles.todayServiceCompleted,
        ]}>
          <View style={styles.sectionHeader}>
            {isServiceCompleted ? (
              <Icon name="check-circle" size={20} color="#10B981" />
            ) : (
              <Icon name="clock" size={20} color={isServiceActive ? '#10B981' : '#6B7280'} />
            )}
            <Text style={[
              styles.sectionTitle,
              isServiceActive && styles.todayServiceTitleActive,
              isServiceCompleted && styles.todayServiceTitleCompleted,
            ]}>
              {isServiceActive ? "Today's Service (Active)" : 
               isServiceCompleted ? "Today's Service (Completed)" : 
               "Today's Service"}
            </Text>
            <View style={[
              styles.statusBadge,
              isServiceActive && styles.statusBadgeActive,
              isServiceCompleted && styles.statusBadgeCompleted,
            ]}>
              <Text style={styles.statusBadgeText}>
                {timeline.current_service.status || 'SCHEDULED'}
              </Text>
            </View>
          </View>

          {/* Early Start Alert */}
          {isEarly && (
            <View style={styles.earlyAlert}>
              <Text style={styles.earlyAlertText}>
                ✓ Service started {timeline.current_service.early_start_minutes} minutes early today
              </Text>
            </View>
          )}
          
          <View style={styles.serviceContent}>
            {/* Date */}
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Date</Text>
              <Text style={styles.serviceValue}>
                {formatDate(timeline.current_service.date)}
              </Text>
            </View>
            
            {/* Start Time - Scheduled */}
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>Start Time</Text>
              <Text style={styles.serviceValue}>
                {timeline.current_service.scheduled_start_time}
              </Text>
            </View>
            
            {/* Started At - Actual */}
            {hasActualStartTime && (
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabelBold}>Started At</Text>
                <View style={styles.actualValueContainer}>
                  <Text style={styles.actualValueStart}>
                    {timeline.current_service.actual_start_time}
                  </Text>
                  <Icon name="check-circle" size={16} color="#10B981" />
                </View>
              </View>
            )}
            
            {/* End Time - Scheduled */}
            <View style={styles.serviceRow}>
              <Text style={styles.serviceLabel}>End Time</Text>
              <Text style={styles.serviceValue}>
                {timeline.current_service.scheduled_end_time}
              </Text>
            </View>
            
            {/* Ended At - Actual */}
            {hasActualEndTime && isServiceCompleted && (
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabelBold}>Ended At</Text>
                <View style={styles.actualValueContainer}>
                  <Text style={styles.actualValueEnd}>
                    {timeline.current_service.actual_end_time}
                  </Text>
                  <Icon name="check-circle" size={16} color="#3B82F6" />
                </View>
              </View>
            )}
            
            {/* Duration */}
            <View style={[styles.serviceRow, styles.durationRowBorder]}>
              <Text style={styles.serviceLabel}>Duration</Text>
              <Text style={styles.serviceValue}>
                {timeline.daily_schedule.duration_minutes} minutes
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBoxBottom}>
        <Text style={styles.infoTextBottom}>
          <Text style={styles.infoTextBold}>
            {bookingType === 'MONTHLY' ? 'Monthly Booking' : 'Short-Term Booking'}:
          </Text> Service provider will visit daily at {timeline.daily_schedule.scheduled_start_time} from{' '}
          {dayjs(timeline.booking_period.start_date).format('MMM D')} to{' '}
          {dayjs(timeline.booking_period.end_date).format('MMM D, YYYY')}.
          {hasActualStartTime && ' Actual service times are tracked for each visit.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  bookingPeriod: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  dailySchedule: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  todayService: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  todayServiceActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  todayServiceCompleted: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  todayServiceTitleActive: {
    color: '#047857',
  },
  todayServiceTitleCompleted: {
    color: '#1E40AF',
  },
  statusBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeCompleted: {
    backgroundColor: '#DBEAFE',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  periodItem: {
    flex: 1,
  },
  periodLabel: {
    fontSize: 12,
    color: '#2563EB',
    marginBottom: 4,
  },
  periodValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#BFDBFE',
  },
  durationLabel: {
    fontSize: 14,
    color: '#1E40AF',
  },
  durationValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  scheduleContent: {
    marginTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  infoBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  earlyAlert: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  earlyAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  serviceContent: {
    marginTop: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  serviceLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  serviceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  actualValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actualValueStart: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
    marginRight: 6,
  },
  actualValueEnd: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 6,
  },
  durationRowBorder: {
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  infoBoxBottom: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#60A5FA',
    borderRadius: 6,
    padding: 12,
  },
  infoTextBottom: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  infoTextBold: {
    fontWeight: '600',
  },
});

export default MonthlyBookingTimeline;
