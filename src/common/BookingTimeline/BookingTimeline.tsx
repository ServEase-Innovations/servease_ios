/**
 * BookingTimeline Component (iOS/React Native)
 * 
 * Displays timeline for ON_DEMAND bookings with actual start/end times
 * Matches the web version functionality
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import dayjs from 'dayjs';

export interface TimelineData {
  scheduled?: {
    start_time?: string | null;
    end_time?: string | null;
    start_epoch?: number | null;
    end_epoch?: number | null;
  };
  actual?: {
    start_epoch: number;
    end_epoch?: number | null;
  };
  duration_minutes?: number;
  is_recalculated?: boolean;
  early_start_minutes?: number;
}

export interface BookingTimelineProps {
  timeline: TimelineData;
  status?: string;
  showEarlyStartBadge?: boolean;
}

const formatEpochToTime = (epoch: number | null | undefined): string => {
  if (!epoch) return '--:--';
  return dayjs.unix(epoch).format('HH:mm');
};

const BookingTimeline: React.FC<BookingTimelineProps> = ({
  timeline,
  status,
  showEarlyStartBadge = true,
}) => {
  const isEarly = (timeline.early_start_minutes ?? 0) > 0;
  const hasActual = !!timeline.actual;
  const isActive = status === 'IN_PROGRESS';
  const isCompleted = status === 'COMPLETED';

  const getDisplayStartTime = (): string => {
    if (hasActual) {
      return formatEpochToTime(timeline.actual?.start_epoch);
    }
    return timeline.scheduled?.start_time || formatEpochToTime(timeline.scheduled?.start_epoch);
  };

  const getDisplayEndTime = (): string => {
    if (hasActual && timeline.actual?.end_epoch) {
      return formatEpochToTime(timeline.actual.end_epoch);
    }
    return timeline.scheduled?.end_time || formatEpochToTime(timeline.scheduled?.end_epoch);
  };

  const scheduledStartTime = timeline.scheduled?.start_time || formatEpochToTime(timeline.scheduled?.start_epoch);
  const scheduledEndTime = timeline.scheduled?.end_time || formatEpochToTime(timeline.scheduled?.end_epoch);

  return (
    <View style={styles.container}>
      {/* Early Start Banner */}
      {isEarly && showEarlyStartBadge && (
        <View style={styles.earlyStartBanner}>
          <Icon name="alert-circle" size={18} color="#047857" />
          <Text style={styles.earlyStartText}>
            Service Started Early
          </Text>
        </View>
      )}

      {/* Timeline Header */}
      <View style={styles.header}>
        <Icon name="clock" size={20} color="#6B7280" />
        <Text style={styles.headerText}>Service Timeline</Text>
        {hasActual && (
          <View style={styles.actualBadge}>
            <Text style={styles.actualBadgeText}>Actual Times</Text>
          </View>
        )}
      </View>

      {/* Timeline Content */}
      <View style={styles.timelineContent}>
        {/* Start Time */}
        <View style={styles.timelineRow}>
          <View style={styles.iconContainer}>
            <View style={[styles.dot, isActive && styles.dotActive, isCompleted && styles.dotCompleted]} />
          </View>
          <View style={styles.timelineInfo}>
            <Text style={styles.timeLabel}>
              {hasActual ? 'Started At' : 'Start Time'}
            </Text>
            <View style={styles.timeValueContainer}>
              <Text style={[styles.timeValue, hasActual && styles.timeValueActual]}>
                {getDisplayStartTime()}
              </Text>
              {hasActual && <Icon name="check-circle" size={16} color="#10B981" />}
            </View>
            {isEarly && hasActual && (
              <Text style={styles.scheduledLabel}>
                Scheduled: {scheduledStartTime}
              </Text>
            )}
          </View>
        </View>

        {/* Connecting Line */}
        <View style={styles.connectingLine} />

        {/* End Time */}
        <View style={styles.timelineRow}>
          <View style={styles.iconContainer}>
            <View style={[styles.dot, isCompleted && styles.dotCompleted]} />
          </View>
          <View style={styles.timelineInfo}>
            <Text style={styles.timeLabel}>
              {hasActual && timeline.actual?.end_epoch ? 'Ended At' : 'End Time'}
            </Text>
            <View style={styles.timeValueContainer}>
              <Text style={[
                styles.timeValue, 
                hasActual && timeline.actual?.end_epoch && styles.timeValueActual
              ]}>
                {getDisplayEndTime()}
              </Text>
              {hasActual && timeline.actual?.end_epoch && (
                <Icon name="check-circle" size={16} color="#3B82F6" />
              )}
            </View>
            {isEarly && hasActual && isCompleted && (
              <Text style={styles.scheduledLabel}>
                Originally: {scheduledEndTime}
              </Text>
            )}
          </View>
        </View>

        {/* Duration */}
        {timeline.duration_minutes && (
          <View style={styles.durationContainer}>
            <Icon name="clock" size={14} color="#6B7280" />
            <Text style={styles.durationText}>
              Duration: {timeline.duration_minutes} minutes
            </Text>
          </View>
        )}

        {/* Early Start Badge */}
        {isEarly && (
          <View style={styles.earlyBadgeContainer}>
            <View style={styles.earlyBadge}>
              <Text style={styles.earlyBadgeText}>
                Started {timeline.early_start_minutes} min early
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earlyStartBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  earlyStartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  actualBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actualBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  timelineContent: {
    position: 'relative',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
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
  },
  dotActive: {
    backgroundColor: '#3B82F6',
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  connectingLine: {
    position: 'absolute',
    left: 15,
    top: 28,
    bottom: 72,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineInfo: {
    flex: 1,
    marginBottom: 24,
  },
  timeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  timeValueActual: {
    color: '#059669',
    fontSize: 18,
  },
  scheduledLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 32,
  },
  durationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  earlyBadgeContainer: {
    paddingLeft: 32,
    marginTop: 12,
  },
  earlyBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  earlyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
});

export default BookingTimeline;
