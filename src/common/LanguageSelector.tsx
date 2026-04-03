// components/common/LanguageSelector/LanguageSelector.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Chip, Button, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../src/Settings/ThemeContext';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  error?: string;
}

const AVAILABLE_LANGUAGES = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Urdu",
  "Gujarati", "Kannada", "Malayalam", "Odia", "Punjabi", "Assamese",
  "Maithili", "Santali", "Kashmiri", "Nepali", "Sindhi", "Konkani",
  "Dogri", "Manipuri", "Bodo", "Sanskrit"
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguages,
  onLanguagesChange,
  error
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLanguageSelect = (language: string) => {
    if (!selectedLanguages.includes(language)) {
      onLanguagesChange([...selectedLanguages, language]);
    }
  };

  const handleLanguageRemove = (language: string) => {
    onLanguagesChange(selectedLanguages.filter(l => l !== language));
  };

  const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return { 
          label: 13, 
          labelHelper: 11, 
          chipText: 11, 
          summaryTitle: 13, 
          modalTitle: 16, 
          searchInput: 14,
          buttonText: 12
        };
      case 'large':
        return { 
          label: 16, 
          labelHelper: 14, 
          chipText: 14, 
          summaryTitle: 16, 
          modalTitle: 20, 
          searchInput: 18,
          buttonText: 15
        };
      default:
        return { 
          label: 14, 
          labelHelper: 12, 
          chipText: 12, 
          summaryTitle: 14, 
          modalTitle: 18, 
          searchInput: 16,
          buttonText: 13
        };
    }
  };

  const fontSizes = getFontSizes();

  const styles = StyleSheet.create({
    container: {
      marginTop: 8,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    label: {
      fontSize: fontSizes.label,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 6,
    },
    labelHelper: {
      fontSize: fontSizes.labelHelper,
      color: colors.textSecondary,
      marginBottom: 12,
      marginLeft: 26,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
      padding: 12,
      marginBottom: 12,
    },
    selectButtonText: {
      fontSize: fontSizes.label,
      color: colors.text,
    },
    placeholderText: {
      color: colors.placeholder,
    },
    selectedCount: {
      fontSize: fontSizes.labelHelper,
      color: colors.primary,
      fontWeight: '500',
    },
    summaryCard: {
      marginTop: 12,
      padding: 12,
      backgroundColor: isDarkMode ? colors.primary + '20' : '#e3f2fd',
      borderWidth: 1,
      borderColor: isDarkMode ? colors.primary + '40' : '#90caf9',
      borderRadius: 8,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 6,
    },
    summaryTitle: {
      fontSize: fontSizes.summaryTitle,
      fontWeight: 'bold',
      color: colors.primary,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    errorText: {
      color: colors.error,
      fontSize: fontSizes.labelHelper,
      marginTop: 8,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      minHeight: '50%',
      overflow: 'hidden',
    },
    modalHeader: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: 'hidden',
    },
    gradientHeader: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: fontSizes.modalTitle,
      fontWeight: 'bold',
      color: '#FFFFFF', // White text on gradient background
    },
    closeButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      margin: 16,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: fontSizes.searchInput,
      color: colors.text,
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageItemSelected: {
      backgroundColor: isDarkMode ? colors.primary + '20' : '#e3f2fd',
    },
    languageText: {
      fontSize: fontSizes.label,
      color: colors.text,
    },
    languageTextSelected: {
      color: colors.primary,
      fontWeight: '500',
    },
    noResultsContainer: {
      padding: 40,
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: fontSizes.labelHelper,
      color: colors.textSecondary,
    },
    modalButtons: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalButton: {
      flex: 1,
    },
    doneButton: {
      backgroundColor: '#004aadff',
    },
    doneButtonText: {
      color: '#FFFFFF',
      fontSize: fontSizes.buttonText,
      fontWeight: '600',
    },
    selectedBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginLeft: 8,
    },
    selectedBadgeText: {
      color: '#FFFFFF',
      fontSize: fontSizes.labelHelper,
      fontWeight: 'bold',
    },
  });

  const renderLanguageItem = ({ item }: { item: string }) => {
    const isSelected = selectedLanguages.includes(item);
    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.languageItemSelected]}
        onPress={() => handleLanguageSelect(item)}
      >
        <Text style={[styles.languageText, isSelected && styles.languageTextSelected]}>
          {item}
        </Text>
        {isSelected && <Icon name="check" size={20} color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Icon name="language" size={20} color={colors.primary} />
        <Text style={styles.label}>Languages Spoken</Text>
      </View>
      <Text style={styles.labelHelper}>
        Select the languages you speak (you can select multiple)
      </Text>

      {/* Custom Dropdown Button */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectButtonText,
          selectedLanguages.length === 0 && styles.placeholderText
        ]}>
          {selectedLanguages.length === 0 
            ? "Select languages..." 
            : `${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''} selected`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {selectedLanguages.length > 0 && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selectedLanguages.length}</Text>
            </View>
          )}
          <Icon name="arrow-drop-down" size={24} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      {/* Selected Languages Summary */}
      {selectedLanguages.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Icon name="check-circle" size={18} color={colors.primary} />
            <Text style={styles.summaryTitle}>
              Selected Languages ({selectedLanguages.length}):
            </Text>
          </View>
          <View style={styles.chipsContainer}>
            {selectedLanguages.map((language, index) => (
              <Chip
                key={index}
                mode="flat"
                onClose={() => handleLanguageRemove(language)}
                style={{ backgroundColor: colors.surface }}
                textStyle={{ fontSize: fontSizes.chipText }}
              >
                {language}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* Modal for Language Selection */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
                {/* Gradient Header */}
                <View style={styles.modalHeader}>
                  <LinearGradient
                    colors={["#0a2a66ff", "#004aadff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientHeader}
                  >
                    <Text style={styles.modalTitle}>Select Languages</Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <Icon name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <Icon name="search" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search languages..."
                    placeholderTextColor={colors.placeholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Icon name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Language List */}
                <FlatList
                  data={filteredLanguages}
                  keyExtractor={(item) => item}
                  renderItem={renderLanguageItem}
                  showsVerticalScrollIndicator={true}
                  ListEmptyComponent={
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>No languages found</Text>
                    </View>
                  }
                  initialNumToRender={20}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />

                {/* Action Buttons */}
                <View style={styles.modalButtons}>
                  <Button
                    mode="outlined"
                    onPress={() => setModalVisible(false)}
                    style={styles.modalButton}
                  >
                    Close
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => setModalVisible(false)}
                    style={[styles.modalButton, styles.doneButton]}
                    labelStyle={styles.doneButtonText}
                  >
                    Done ({selectedLanguages.length})
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default LanguageSelector;