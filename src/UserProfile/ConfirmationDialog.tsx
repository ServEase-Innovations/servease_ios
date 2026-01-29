import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  severity = 'info'
}) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'warning':
        return {
          backgroundColor: '#0a2a66',
          color: '#ffffff',
          borderColor: '#004aad'
        };
      case 'error':
        return {
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderColor: '#fecaca'
        };
      case 'success':
        return {
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderColor: '#a7f3d0'
        };
      default:
        return {
          backgroundColor: '#dbeafe',
          color: '#1e40af',
          borderColor: '#bfdbfe'
        };
    }
  };

  const getButtonVariant = () => {
    if (severity === 'error') {
      return {
        backgroundColor: '#dc2626',
        color: 'white'
      };
    }
    return {
      backgroundColor: '#2563eb',
      color: 'white'
    };
  };

  const severityColors = getSeverityColor();
  const buttonVariant = getButtonVariant();

  interface ButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'outline';
    disabled?: boolean;
  }

  const Button: React.FC<ButtonProps> = ({ children, onPress, variant = 'primary', disabled = false }) => {
    const isOutline = variant === 'outline';
    
    return (
      <TouchableOpacity
        style={[
          styles.button,
          isOutline ? styles.outlineButton : { backgroundColor: buttonVariant.backgroundColor },
          disabled && styles.disabledButton,
          { minWidth: 96 }
        ]}
        onPress={onPress}
        disabled={disabled || loading}
      >
        {loading && !isOutline ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={[
            styles.buttonText,
            isOutline ? styles.outlineButtonText : { color: buttonVariant.color },
            disabled && styles.disabledText
          ]}>
            {children}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.overlay}>
          <View style={styles.dialogContainer}>
            {/* Header */}
            <View style={[
              styles.header,
              {
                backgroundColor: severityColors.backgroundColor,
                borderColor: severityColors.borderColor
              }
            ]}>
              <Text style={[styles.title, { color: severityColors.color }]}>
                {title}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                disabled={loading}
              >
                <Text style={[styles.closeIcon, { color: severityColors.color }]}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.message}>
                {message}
              </Text>
            </View>
            
            {/* Actions */}
            <View style={styles.actions}>
              <Button
                variant="outline"
                onPress={onClose}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button
                onPress={onConfirm}
                disabled={loading}
              >
                {confirmText}
              </Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  message: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  outlineButtonText: {
    color: '#374151',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
});

export default ConfirmationDialog;