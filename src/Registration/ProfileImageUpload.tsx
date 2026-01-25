import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Define file interface for React Native
interface RNFile {
  name: string;
  type: string;
  uri: string;
  size?: number | null;
}

interface ProfileImageUploadProps {
  onImageSelect: (file: RNFile | null) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ onImageSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  const handleImagePick = async () => {
    try {
      const { launchImageLibrary } = await import('react-native-image-picker');
      
      launchImageLibrary(
        {
          mediaType: 'photo',
          includeBase64: false,
          maxHeight: 2000,
          maxWidth: 2000,
          quality: 0.8,
        },
        (response) => {
          if (response.didCancel) {
            return;
          } else if (response.errorCode) {
            Alert.alert('Error', response.errorMessage || 'Failed to pick image');
          } else if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            setImageSrc(asset.uri || '');
            setIsCropDialogOpen(true);
          }
        }
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCropComplete = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        // In React Native, we'll use a library for image cropping
        // For now, we'll use the original image and pass it directly
        // You can implement proper cropping using react-native-image-crop-tools
        
        const file: RNFile = {
          name: `profile_${Date.now()}.jpg`,
          type: 'image/jpeg',
          uri: imageSrc,
          size: null,
        };

        onImageSelect(file);
        setPreviewUrl(imageSrc);
        setIsCropDialogOpen(false);
        
        // Clean up the previous URL if it exists
        if (previewUrl) {
          // In React Native, we don't need to revoke object URLs
        }
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image');
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageSelect(null);
  };

  // Simple crop component for demonstration
  const SimpleCropView = () => {
    return (
      <View style={styles.cropContainer}>
        <Image 
          source={{ uri: imageSrc || '' }} 
          style={[
            styles.cropImage,
            {
              transform: [
                { translateX: -crop.x },
                { translateY: -crop.y },
                { scale: zoom }
              ]
            }
          ]}
          resizeMode="contain"
        />
        
        {/* Crop overlay */}
        <View style={styles.cropOverlay}>
          <View style={styles.cropFrame} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={handleImagePick}
        activeOpacity={0.7}
      >
        {previewUrl ? (
          <Image source={{ uri: previewUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="camera-alt" size={40} color="#fff" />
          </View>
        )}
        
        {previewUrl && (
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={handleImagePick}
          >
            <Icon name="camera-alt" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      
      <Text style={styles.uploadText}>Upload Profile Picture</Text>

      {/* Crop Modal */}
      <Modal
        visible={isCropDialogOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCropDialogOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crop Image</Text>
            
            <View style={styles.cropPreviewContainer}>
              <SimpleCropView />
            </View>

            {/* Simple zoom controls */}
            <View style={styles.controls}>
              <Text style={styles.controlLabel}>Zoom:</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setZoom(Math.max(1, zoom - 0.1))}
              >
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.zoomValue}>{zoom.toFixed(1)}x</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setZoom(Math.min(3, zoom + 0.1))}
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setIsCropDialogOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleCropConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const avatarSize = 150;
const cropSize = screenWidth - 40;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: avatarSize / 2,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  cropPreviewContainer: {
    height: 300,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cropContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  cropImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropFrame: {
    width: cropSize - 80,
    height: cropSize - 80,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: (cropSize - 80) / 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  zoomValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#1976d2',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default ProfileImageUpload;