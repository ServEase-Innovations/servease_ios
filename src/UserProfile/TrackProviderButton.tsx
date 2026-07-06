import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { checkTrackingAvailability } from '../services/trackingService';

interface TrackProviderButtonProps {
  engagementId: number;
  customerId: number;
  onPress: () => void;
  compact?: boolean;
  fullWidth?: boolean;
  backgroundColor?: string;
  fontSize?: number;
}

export const TrackProviderButton: React.FC<TrackProviderButtonProps> = ({
  engagementId,
  customerId,
  onPress,
  compact = false,
  fullWidth = false,
  backgroundColor = '#3B82F6',
  fontSize = 14,
}) => {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAvailability();
  }, [engagementId]);

  const checkAvailability = async () => {
    try {
      const result = await checkTrackingAvailability(engagementId);
      setAvailable(result.available);
      console.log('Tracking availability for', engagementId, ':', result);
    } catch (error) {
      console.error('Failed to check tracking availability:', error);
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return compact ? null : (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={backgroundColor} />
      </View>
    );
  }

  if (!available) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor },
        compact && styles.buttonCompact,
        fullWidth && styles.buttonFullWidth,
      ]}
      activeOpacity={0.85}
    >
      <Icon name="map-marker" size={compact ? 14 : 18} color="#fff" />
      <Text style={[styles.buttonText, { fontSize: compact ? 12 : fontSize }, compact && styles.buttonTextCompact]}>
        Track Provider
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 10,
    gap: 10,
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonTextCompact: {
    fontSize: 12,
  },
});

export default TrackProviderButton;
