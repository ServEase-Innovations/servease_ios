import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateETA } from '../services/trackingService';

interface ArrivalInfoBadgeProps {
  engagementId: number;
  fontSize?: number;
}

interface ETAData {
  duration_seconds: number;
  distance_meters: number;
  traffic_aware: boolean;
  calculated_at: number;
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.ceil(seconds / 60)} min`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m away`;
  } else {
    return `${(meters / 1000).toFixed(1)} km away`;
  }
};

/**
 * Arrival Info Badge - Shows "ARRIVING IN" badge and distance like in the image
 * Format: Large badge on right with "ARRIVING IN" + time, plus "ON WAY" and distance badges below
 */
export const ArrivalInfoBadge: React.FC<ArrivalInfoBadgeProps> = ({
  engagementId,
  fontSize = 12,
}) => {
  const [eta, setEta] = useState<ETAData | null>(null);
  const [currentETA, setCurrentETA] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchETA = async () => {
      try {
        const etaData = await calculateETA(engagementId);
        if (mounted && etaData) {
          setEta(etaData);
          setCurrentETA(etaData.duration_seconds);
        }
      } catch (error) {
        console.error('Failed to fetch ETA:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchETA();

    return () => {
      mounted = false;
    };
  }, [engagementId]);

  // Update countdown every second
  useEffect(() => {
    if (!eta) return;

    const startTime = eta.calculated_at;
    const initialDuration = eta.duration_seconds;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const newETA = Math.max(0, initialDuration - elapsed);
      setCurrentETA(newETA);
    }, 1000);

    return () => clearInterval(interval);
  }, [eta]);

  if (loading || !eta) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Top Row: ARRIVING IN badge */}
      <View style={styles.topRow}>
        <View style={styles.arrivingBadge}>
          <Text style={styles.arrivingLabel}>ARRIVING IN</Text>
          <Text style={styles.arrivingTime}>{formatTime(currentETA)}</Text>
        </View>
      </View>

      {/* Bottom Row: Status badges */}
      <View style={styles.statusRow}>
        <View style={styles.onWayBadge}>
          <Text style={styles.onWayText}>ON WAY</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{formatDistance(eta.distance_meters)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  arrivingBadge: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  arrivingLabel: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  arrivingTime: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  onWayBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  onWayText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '600',
  },
  distanceBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  distanceText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ArrivalInfoBadge;
