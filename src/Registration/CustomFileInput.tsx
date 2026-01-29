import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../common/Button';
// import Button from '../common/Button';

// Define proper TypeScript interfaces for React Native file objects
interface RNFile {
  name: string;
  type: string;
  uri: string;
  size?: number | null;
}

interface CustomFileInputProps {
  name: string;
  accept?: string;
  required?: boolean;
  disabled?: boolean;
  buttonText?: string;
  previewWidth?: number;
  value: RNFile | null;
  onChange: (file: RNFile | null) => void;
}

const CustomFileInput: React.FC<CustomFileInputProps> = ({
  name,
  accept,
  required,
  disabled,
  buttonText = 'Choose File',
  previewWidth = 300,
  value,
  onChange,
}) => {
  const handleFilePick = async () => {
    try {
      // Use react-native-image-picker for both images and documents
      const { launchImageLibrary } = await import('react-native-image-picker');
      
      const options: any = {
        mediaType: 'mixed', // This allows both images and documents
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
        quality: 0.8,
      };

      // If specific file types are requested, adjust options
      if (accept?.includes('image')) {
        options.mediaType = 'photo';
      }
      
      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          return;
        } else if (response.errorCode) {
          Alert.alert('Error', response.errorMessage || 'Failed to pick file');
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          const file: RNFile = {
            name: asset.fileName || `file_${Date.now()}.${getFileExtension(asset.type)}`,
            type: asset.type || 'application/octet-stream',
            uri: asset.uri || '',
            size: asset.fileSize,
          };
          onChange(file);
        }
      });
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const getFileExtension = (mimeType: string | undefined): string => {
    if (!mimeType) return 'file';
    
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };
    
    return extensions[mimeType] || 'file';
  };

  const handleRemoveFile = () => {
    onChange(null);
  };

  const isImageFile = value?.type?.startsWith('image/');

  return (
    <View style={styles.container}>
      {!value ? (
        <Button
          variant="contained"
          onPress={handleFilePick}
          style={styles.button}
          disabled={disabled}
          title={buttonText}
        />
      ) : (
        <View style={styles.fileContainer}>
          <View style={styles.fileInfoContainer}>
            <View style={styles.fileHeader}>
              <Text style={styles.fileName} numberOfLines={1}>
                Selected File: {value.name}
              </Text>
              <TouchableOpacity
                onPress={handleRemoveFile}
                style={styles.removeButton}
                accessibilityLabel="Remove file"
              >
                <Icon name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {isImageFile && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <Image
                  source={{ uri: value.uri }}
                  style={[
                    styles.previewImage,
                    { width: previewWidth }
                  ]}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
          <Button
            variant="outlined"
            onPress={handleFilePick}
            size="small"
            style={styles.changeButton}
            title="Change File"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    marginBottom: 16,
  },
  fileContainer: {
    width: '100%',
  },
  fileInfoContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    flex: 1,
    color: '#333',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  previewContainer: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  previewImage: {
    height: 200,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  changeButton: {
    marginTop: 8,
  },
});

export default CustomFileInput;