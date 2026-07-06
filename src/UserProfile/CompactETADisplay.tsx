import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateETA } from '../services/trackingService';

interface CompactETADisplayProps {
  engagementId: number;
  customerId: number;
  fontSize?: number;
}

interface ETAData {
  duration_seconds: number;
  distance_meters: number;
  traffic_aware: boolean;
  calculated_at: number;
  confidence: string;
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
 * Compact ETA Display matching the design image
 * Shows large "ARRIVING IN" badge + "ON WAY" and distance badges
 */
export const CompactETADisplay: React.FC<CompactETADisplayProps> = ({
  engagementId,
}) => {
  const [eta, setEta] = useState<ETAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentETA, setCurrentETA] = useState<number>(0);

  // Fetch ETA on mount
  useEffect(() => {
    let mounted = true;

    const fetchETA = async () => {
      try {
        setLoading(true);
        const etaData = await calculateETA(engagementId);
        
        if (mounted && etaData) {
          setEta(etaData);
          setCurrentETA(etaData.duration_seconds);
        }
      } catch (error: any) {
        // Silently fail - provider might not have started journey yet
        if (mounted) {
          setEta(null);
        }
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

  // Don't show anything if loading or no ETA available
  if (loading || !eta) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Row container for badges and arriving badge */}
      <View style={styles.mainRow}>
        {/* Status badges on the left */}
        <View style={styles.statusRow}>
          <View style={styles.onWayBadge}>
            <Text style={styles.onWayText}>ON WAY</Text>
          </View>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{formatDistance(eta.distance_meters)}</Text>
          </View>
        </View>

        {/* Large ARRIVING IN badge on the right */}
        <View style={styles.arrivingBadge}>
          <Text style={styles.arrivingLabel}>ARRIVING IN</Text>
          <Text style={styles.arrivingTime}>{formatTime(currentETA)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  onWayBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    paddingHorizontal: 14,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  distanceText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  arrivingBadge: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 8,
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
    fontSize: 28,
    fontWeight: '700',
  },
});

export default CompactETADisplay;
