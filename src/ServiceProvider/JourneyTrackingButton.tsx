import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  startJourney,
  markArrived,
  getTrackingStatus,
  TrackingStatus,
} from '../services/providerTrackingService';
import { BRAND, HOME_M3 } from '../theme/brandColors';
import Geolocation from '@react-native-community/geolocation';

interface Props {
  engagementId: number;
  onStatusChange?: (status: string) => void;
}

export default function JourneyTrackingButton({ engagementId, onStatusChange }: Props) {
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  
  // Dialog states
  const [startJourneyDialogVisible, setStartJourneyDialogVisible] = useState(false);
  const [markArrivedDialogVisible, setMarkArrivedDialogVisible] = useState(false);
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', description: '' });
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadTrackingStatus();
  }, [engagementId]);

  const loadTrackingStatus = async () => {
    try {
      setFetchingStatus(true);
      const status = await getTrackingStatus(engagementId);
      setTrackingStatus(status);
    } catch (error) {
      console.error('Error loading tracking status:', error);
    } finally {
      setFetchingStatus(false);
    }
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Location error:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const handleStartJourney = async () => {
    try {
      setLoading(true);
      setStartJourneyDialogVisible(false);
      
      // Get current location
      let location;
      try {
        location = await getCurrentLocation();
      } catch (error) {
        console.warn('Could not get location, continuing without it');
      }
      
      // Start journey
      const response = await startJourney(engagementId, location);
      
      // Update status
      await loadTrackingStatus();
      
      // Show success dialog
      setSuccessMessage({
        title: 'Journey Started',
        description: 'Customer can now track your location. Remember to mark arrival when you reach!',
      });
      setSuccessDialogVisible(true);
      
      if (onStatusChange) {
        onStatusChange(response.tracking_status);
      }
    } catch (error: any) {
      console.error('Error starting journey:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to start journey. Please try again.');
      setErrorDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkArrived = async () => {
    try {
      setLoading(true);
      setMarkArrivedDialogVisible(false);
      
      // Get current location
      let location;
      try {
        location = await getCurrentLocation();
      } catch (error) {
        console.warn('Could not get location');
      }
      
      // Mark arrived
      const response = await markArrived(engagementId, location);
      
      // Update status
      await loadTrackingStatus();
      
      // Show success dialog
      setSuccessMessage({
        title: 'Arrival Confirmed',
        description: 'Customer tracking has been stopped.',
      });
      setSuccessDialogVisible(true);
      
      if (onStatusChange) {
        onStatusChange(response.tracking_status);
      }
    } catch (error: any) {
      console.error('Error marking arrived:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to mark arrival. Please try again.');
      setErrorDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={HOME_M3.secondary} />
      </View>
    );
  }

  const currentStatus = trackingStatus?.tracking_status || 'not_started';

  // Don't show button if service is already completed
  if (currentStatus === 'service_completed') {
    return null;
  }

  // Show "Start Journey" button if not started
  if (currentStatus === 'not_started') {
    return (
      <>
        <TouchableOpacity
          style={styles.startJourneyBtn}
          onPress={() => setStartJourneyDialogVisible(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <MaterialIcon name="navigation" size={18} color="#ffffff" />
              <Text style={styles.startJourneyText}>Start Journey</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Start Journey Confirmation Dialog */}
        <ConfirmationDialog
          visible={startJourneyDialogVisible}
          onClose={() => setStartJourneyDialogVisible(false)}
          onConfirm={handleStartJourney}
          title="Start Journey?"
          description="This will enable customer tracking so they can see your location in real-time. Continue?"
          icon="navigation"
          confirmText="Start Journey"
          confirmColor="#3b82f6"
          loading={loading}
        />

        {/* Success Dialog */}
        <InfoDialog
          visible={successDialogVisible}
          onClose={() => setSuccessDialogVisible(false)}
          title={successMessage.title}
          description={successMessage.description}
          icon="check-circle"
          iconColor="#10b981"
        />

        {/* Error Dialog */}
        <InfoDialog
          visible={errorDialogVisible}
          onClose={() => setErrorDialogVisible(false)}
          title="Error"
          description={errorMessage}
          icon="error"
          iconColor="#ef4444"
        />
      </>
    );
  }

  // Show "Mark Arrived" button if en route
  if (currentStatus === 'en_route') {
    return (
      <>
        <View style={styles.enRouteContainer}>
          <View style={styles.trackingActiveIndicator}>
            <View style={styles.pulseIndicator} />
            <Text style={styles.trackingActiveText}>Customer Tracking Active</Text>
          </View>
          <TouchableOpacity
            style={styles.arrivedBtn}
            onPress={() => setMarkArrivedDialogVisible(true)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialIcon name="location-on" size={18} color="#ffffff" />
                <Text style={styles.arrivedText}>Mark Arrived</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Mark Arrived Confirmation Dialog */}
        <ConfirmationDialog
          visible={markArrivedDialogVisible}
          onClose={() => setMarkArrivedDialogVisible(false)}
          onConfirm={handleMarkArrived}
          title="Mark Arrival?"
          description="Have you reached the customer location?"
          icon="location-on"
          confirmText="Yes, Arrived"
          confirmColor="#10b981"
          cancelText="Not Yet"
          loading={loading}
        />

        {/* Success Dialog */}
        <InfoDialog
          visible={successDialogVisible}
          onClose={() => setSuccessDialogVisible(false)}
          title={successMessage.title}
          description={successMessage.description}
          icon="check-circle"
          iconColor="#10b981"
        />

        {/* Error Dialog */}
        <InfoDialog
          visible={errorDialogVisible}
          onClose={() => setErrorDialogVisible(false)}
          title="Error"
          description={errorMessage}
          icon="error"
          iconColor="#ef4444"
        />
      </>
    );
  }

  // Show status for arrived/service_started
  if (currentStatus === 'arrived' || currentStatus === 'service_started') {
    return (
      <View style={styles.statusContainer}>
        <MaterialIcon name="check-circle" size={16} color="#10b981" />
        <Text style={styles.statusText}>
          {currentStatus === 'arrived' ? 'Arrived at location' : 'Service in progress'}
        </Text>
      </View>
    );
  }

  return null;
}

// Confirmation Dialog Component
interface ConfirmationDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  icon: string;
  confirmText: string;
  confirmColor: string;
  cancelText?: string;
  loading?: boolean;
}

function ConfirmationDialog({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  confirmText,
  confirmColor,
  cancelText = 'Cancel',
  loading = false,
}: ConfirmationDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.dialogOverlay} onPress={onClose}>
        <Pressable style={styles.dialogContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dialogHeader}>
            <View style={[styles.dialogIcon, { backgroundColor: confirmColor + '15' }]}>
              <MaterialIcon name={icon} size={32} color={confirmColor} />
            </View>
            <Text style={styles.dialogTitle}>{title}</Text>
            <Text style={styles.dialogDescription}>{description}</Text>
          </View>

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={styles.dialogCancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.dialogCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogConfirmButton, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <MaterialIcon name={icon} size={18} color="#ffffff" />
                  <Text style={styles.dialogConfirmText}>{confirmText}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Info Dialog Component (Success/Error)
interface InfoDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
}

function InfoDialog({
  visible,
  onClose,
  title,
  description,
  icon,
  iconColor,
}: InfoDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.dialogOverlay} onPress={onClose}>
        <Pressable style={styles.dialogContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dialogHeader}>
            <View style={[styles.dialogIcon, { backgroundColor: iconColor + '15' }]}>
              <MaterialIcon name={icon} size={32} color={iconColor} />
            </View>
            <Text style={styles.dialogTitle}>{title}</Text>
            <Text style={styles.dialogDescription}>{description}</Text>
          </View>

          <View style={styles.dialogActions}>
            <TouchableOpacity
              style={[styles.dialogOkButton, { backgroundColor: iconColor }]}
              onPress={onClose}
            >
              <Text style={styles.dialogOkText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  startJourneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  startJourneyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  enRouteContainer: {
    gap: 10,
  },
  trackingActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  trackingActiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
    flex: 1,
  },
  arrivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  arrivedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  // Dialog styles
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogHeader: {
    padding: 24,
    alignItems: 'center',
  },
  dialogIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 0,
  },
  dialogCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  dialogConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dialogConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  dialogOkButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogOkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
