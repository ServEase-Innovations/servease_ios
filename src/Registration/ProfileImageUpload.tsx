import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
  Text,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RNFile {
  name: string;
  type: string;
  uri: string;
  size?: number | null;
}

interface ProfileImageUploadProps {
  onImageSelect: (file: RNFile | null) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({ onImageSelect }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  // Animation values for smooth gestures
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Store last gesture values using refs
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const lastTouchDistance = useRef<number | null>(null);
  
  const cropSize = Dimensions.get('window').width - 48;
  const screenHeight = Dimensions.get('window').height;
  
  // Calculate image display size maintaining aspect ratio
  const getImageDisplaySize = useCallback(() => {
    if (imageDimensions.width === 0 || imageDimensions.height === 0) {
      return { width: cropSize, height: cropSize };
    }
    
    const imageAspect = imageDimensions.width / imageDimensions.height;
    const cropAspect = 1; // Square crop
    
    let width, height;
    
    if (imageAspect > cropAspect) {
      // Image is wider than crop area
      height = cropSize;
      width = cropSize * imageAspect;
    } else {
      // Image is taller than crop area
      width = cropSize;
      height = cropSize / imageAspect;
    }
    
    return { width, height };
  }, [imageDimensions, cropSize]);

  // Get current animated values
  const getCurrentScale = useCallback(() => {
    // @ts-ignore - Animated.Value has _value but TypeScript doesn't recognize it
    return scale._value || 1;
  }, [scale]);

  const getCurrentTranslateX = useCallback(() => {
    // @ts-ignore - Animated.Value has _value but TypeScript doesn't recognize it
    return translateX._value || 0;
  }, [translateX]);

  const getCurrentTranslateY = useCallback(() => {
    // @ts-ignore - Animated.Value has _value but TypeScript doesn't recognize it
    return translateY._value || 0;
  }, [translateY]);

  // Calculate boundaries for panning
  const getBoundaries = useCallback(() => {
    const displaySize = getImageDisplaySize();
    const currentScale = getCurrentScale();
    const scaledWidth = displaySize.width * currentScale;
    const scaledHeight = displaySize.height * currentScale;
    
    const maxX = Math.max(0, (scaledWidth - cropSize) / 2);
    const maxY = Math.max(0, (scaledHeight - cropSize) / 2);
    
    return { maxX, maxY, scaledWidth, scaledHeight };
  }, [getImageDisplaySize, cropSize, getCurrentScale]);

  // Pan responder for smooth Instagram-like gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState: PanResponderGestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Store current values when gesture starts
        lastScale.current = getCurrentScale();
        lastTranslateX.current = getCurrentTranslateX();
        lastTranslateY.current = getCurrentTranslateY();
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Handle pinch gesture for zoom
        if (event.nativeEvent.touches && event.nativeEvent.touches.length >= 2) {
          const touch1 = event.nativeEvent.touches[0];
          const touch2 = event.nativeEvent.touches[1];
          
          const dx = touch1.pageX - touch2.pageX;
          const dy = touch1.pageY - touch2.pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (lastTouchDistance.current) {
            const scaleFactor = distance / lastTouchDistance.current;
            let newScale = lastScale.current * scaleFactor;
            
            // Limit scale between 1 and 3
            newScale = Math.max(1, Math.min(3, newScale));
            
            // Smooth scale animation
            scale.setValue(newScale);
          }
          
          lastTouchDistance.current = distance;
        } 
        // Handle pan gesture for dragging
        else if (event.nativeEvent.touches.length === 1 && getCurrentScale() > 1) {
          const boundaries = getBoundaries();
          
          // Calculate new position with boundaries
          let newX = lastTranslateX.current + gestureState.dx;
          let newY = lastTranslateY.current + gestureState.dy;
          
          // Apply boundaries with rubber band effect at edges
          if (Math.abs(newX) > boundaries.maxX) {
            const overshoot = Math.abs(newX) - boundaries.maxX;
            newX = newX > 0 ? boundaries.maxX + overshoot * 0.3 : -boundaries.maxX - overshoot * 0.3;
          }
          
          if (Math.abs(newY) > boundaries.maxY) {
            const overshoot = Math.abs(newY) - boundaries.maxY;
            newY = newY > 0 ? boundaries.maxY + overshoot * 0.3 : -boundaries.maxY - overshoot * 0.3;
          }
          
          translateX.setValue(newX);
          translateY.setValue(newY);
          
          lastTouchDistance.current = null;
        }
      },
      onPanResponderRelease: () => {
        // Snap back to boundaries with spring animation
        const boundaries = getBoundaries();
        let finalX = getCurrentTranslateX();
        let finalY = getCurrentTranslateY();
        
        // Constrain to boundaries
        if (Math.abs(finalX) > boundaries.maxX) {
          finalX = finalX > 0 ? boundaries.maxX : -boundaries.maxX;
        }
        
        if (Math.abs(finalY) > boundaries.maxY) {
          finalY = finalY > 0 ? boundaries.maxY : -boundaries.maxY;
        }
        
        // Spring animation for smooth snap
        Animated.spring(translateX, {
          toValue: finalX,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }).start();
        
        Animated.spring(translateY, {
          toValue: finalY,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }).start();
        
        // Update stored values
        lastTranslateX.current = finalX;
        lastTranslateY.current = finalY;
        lastScale.current = getCurrentScale();
        lastTouchDistance.current = null;
      },
    })
  ).current;

  useEffect(() => {
    if (imageSrc) {
      Image.getSize(imageSrc, (width, height) => {
        setImageDimensions({ width, height });
      });
    }
  }, [imageSrc]);

  const handleImagePick = async () => {
    try {
      const { launchImageLibrary } = await import('react-native-image-picker');
      
      launchImageLibrary(
        {
          mediaType: 'photo',
          includeBase64: false,
          maxHeight: 2000,
          maxWidth: 2000,
          quality: 0.9,
        },
        (response) => {
          if (response.didCancel) {
            return;
          } else if (response.errorCode) {
            Alert.alert('Error', response.errorMessage || 'Failed to pick image');
          } else if (response.assets && response.assets[0]) {
            const asset = response.assets[0];
            setImageSrc(asset.uri || '');
            resetCrop();
            setIsCropDialogOpen(true);
          }
        }
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCropConfirm = async () => {
    if (imageSrc) {
      try {
        const file: RNFile = {
          name: `profile_${Date.now()}.jpg`,
          type: 'image/jpeg',
          uri: imageSrc,
          size: null,
        };

        onImageSelect(file);
        setPreviewUrl(imageSrc);
        setIsCropDialogOpen(false);
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

  const resetCrop = () => {
    // Reset all animated values with spring animation
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    // Reset stored values
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    lastTouchDistance.current = null;
  };

  const handleZoomIn = () => {
    const currentScale = getCurrentScale();
    let newScale = Math.min(3, currentScale + 0.5);
    
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    lastScale.current = newScale;
  };

  const handleZoomOut = () => {
    const currentScale = getCurrentScale();
    let newScale = Math.max(1, currentScale - 0.5);
    
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    
    lastScale.current = newScale;
    
    // Reset position if zoom is 1
    if (newScale === 1) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
      
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
      
      lastTranslateX.current = 0;
      lastTranslateY.current = 0;
    }
  };

  const displaySize = getImageDisplaySize();
  const currentScale = getCurrentScale();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.avatarContainer}
        onPress={handleImagePick}
        activeOpacity={0.7}
      >
        {previewUrl ? (
          <Image 
            source={{ uri: previewUrl }} 
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="camera-alt" size={40} color="#fff" />
          </View>
        )}
        
        {previewUrl && (
          <>
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleImagePick}
            >
              <Icon name="camera-alt" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={handleRemoveImage}
            >
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>
      
      <Text style={styles.uploadText}>
        {previewUrl ? 'Change Profile Picture' : 'Upload Profile Picture'}
      </Text>

      {/* Crop Modal - Instagram/Facebook Style */}
      <Modal
        visible={isCropDialogOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsCropDialogOpen(false)}
      >
        <View style={styles.fullScreenModal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsCropDialogOpen(false)}>
              <Icon name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adjust Image</Text>
            <TouchableOpacity onPress={handleCropConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {/* Image Container - Full bleed */}
          <View 
            style={[styles.fullImageContainer, { height: screenHeight * 0.6 }]}
            {...panResponder.panHandlers}
          >
            {imageSrc && (
              <Animated.View
                style={[
                  styles.animatedImageContainer,
                  {
                    transform: [
                      { translateX },
                      { translateY },
                      { scale },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: imageSrc }}
                  style={[
                    styles.cropImage,
                    {
                      width: displaySize.width,
                      height: displaySize.height,
                    },
                  ]}
                  resizeMode="contain"
                  onLoadStart={() => setIsImageLoading(true)}
                  onLoadEnd={() => setIsImageLoading(false)}
                />
              </Animated.View>
            )}
            
            {/* Loading Indicator */}
            {isImageLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
              </View>
            )}
            
            {/* Grid Overlay - Instagram style */}
            <View style={styles.gridOverlay}>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
            </View>
            
            {/* Corner handles */}
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Zoom Percentage */}
            <View style={styles.zoomPercentageContainer}>
              <Text style={styles.zoomPercentageText}>
                {Math.round(currentScale * 100)}%
              </Text>
            </View>

            {/* Zoom Slider - Instagram style */}
            <View style={styles.zoomSliderWrapper}>
              <TouchableOpacity onPress={handleZoomOut} style={styles.zoomIconButton}>
                <Icon name="remove" size={24} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.sliderContainer}>
                <Animated.View 
                  style={[
                    styles.sliderFill,
                    {
                      width: `${((currentScale - 1) / 2) * 100}%`,
                    }
                  ]} 
                />
              </View>
              
              <TouchableOpacity onPress={handleZoomIn} style={styles.zoomIconButton}>
                <Icon name="add" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Reset Button */}
            <TouchableOpacity style={styles.resetButton} onPress={resetCrop}>
              <Icon name="refresh" size={20} color="#1976d2" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const avatarSize = 150;

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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#1976d2',
  },
  // Full screen modal styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976d2',
  },
  // Full bleed image container
  fullImageContainer: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  animatedImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropImage: {
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  // Instagram-style grid overlay
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // Corner handles
  cornerTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 25,
    height: 25,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 25,
    height: 25,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 25,
    height: 25,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#fff',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 25,
    height: 25,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#fff',
  },
  // Bottom controls
  bottomControls: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  zoomPercentageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  zoomPercentageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  zoomSliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  zoomIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderContainer: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#1976d2',
    borderRadius: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileImageUpload;