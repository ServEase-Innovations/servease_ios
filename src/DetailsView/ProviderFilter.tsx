/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface FilterProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriteria) => void;
  initialFilters?: FilterCriteria;
}

export interface FilterCriteria {
  experience: number[];
  rating: number | null;
  gender: string[];
  diet: string[];
  language: string[];
  distance: number[];
  availability: string[];
}

// Language options - expanded list
const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Tamil', 
  'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Punjabi',
  'Odia', 'Assamese', 'Urdu', 'Sanskrit', 'Nepali',
  'French', 'German', 'Spanish', 'Arabic', 'Japanese',
  'Chinese', 'Russian', 'Portuguese', 'Italian', 'Dutch'
];

const dietOptions = ['VEG', 'NONVEG', 'BOTH'];
const genderOptions = ['MALE', 'FEMALE', 'OTHER'];
const availabilityOptions = ['Fully Available', 'Partially Available', 'Limited'];

const { width } = Dimensions.get('window');

const ProviderFilter: React.FC<FilterProps> = ({
  open,
  onClose,
  onApplyFilters,
  initialFilters
}) => {
  const [filters, setFilters] = useState<FilterCriteria>(
    initialFilters || {
      experience: [0, 30],
      rating: null,
      gender: [],
      diet: [],
      language: [],
      distance: [0, 50],
      availability: []
    }
  );

  const [tempFilters, setTempFilters] = useState<FilterCriteria>(filters);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const handleGenderChange = (gender: string) => {
    setTempFilters(prev => ({
      ...prev,
      gender: prev.gender.includes(gender)
        ? prev.gender.filter(g => g !== gender)
        : [...prev.gender, gender]
    }));
  };

  const handleDietChange = (diet: string) => {
    setTempFilters(prev => ({
      ...prev,
      diet: prev.diet.includes(diet)
        ? prev.diet.filter(d => d !== diet)
        : [...prev.diet, diet]
    }));
  };

  const handleAvailabilityChange = (status: string) => {
    setTempFilters(prev => ({
      ...prev,
      availability: prev.availability.includes(status)
        ? prev.availability.filter(a => a !== status)
        : [...prev.availability, status]
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setTempFilters(prev => ({
      ...prev,
      language: prev.language.includes(language)
        ? prev.language.filter(l => l !== language)
        : [...prev.language, language]
    }));
  };

  const handleApply = () => {
    setFilters(tempFilters);
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      experience: [0, 30],
      rating: null,
      gender: [],
      diet: [],
      language: [],
      distance: [0, 50],
      availability: []
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const renderRatingStars = () => {
    const stars = [];
    const rating = tempFilters.rating || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setTempFilters(prev => ({ ...prev, rating: i }))}
        >
          <Icon
            name={i <= rating ? 'star' : 'star-border'}
            size={30}
            color="#FFD700"
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderLanguageChips = () => {
    return (
      <View style={styles.languageChipsContainer}>
        {tempFilters.language.map((lang) => (
          <View key={lang} style={styles.chip}>
            <Text style={styles.chipText}>{lang}</Text>
            <TouchableOpacity
              onPress={() => handleLanguageToggle(lang)}
              style={styles.chipDelete}
            >
              <Icon name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.drawer}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Icon name="filter-list" size={24} color="#000" />
              <Text style={styles.headerText}>Filter Providers</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.content}>
            {/* Experience Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience (years)</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  value={tempFilters.experience[1]}
                  onValueChange={(value) => 
                    setTempFilters(prev => ({ ...prev, experience: [0, value] }))
                  }
                  minimumValue={0}
                  maximumValue={30}
                  step={1}
                  minimumTrackTintColor="#1976d2"
                  maximumTrackTintColor="#ddd"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>0</Text>
                  <Text style={styles.sliderValue}>{tempFilters.experience[1]} years</Text>
                  <Text style={styles.sliderLabel}>30</Text>
                </View>
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              <View style={styles.ratingContainer}>
                <View style={styles.starsContainer}>
                  {renderRatingStars()}
                </View>
                {tempFilters.rating && (
                  <View style={styles.ratingChip}>
                    <Text style={styles.ratingChipText}>{tempFilters.rating}+</Text>
                    <TouchableOpacity
                      onPress={() => setTempFilters(prev => ({ ...prev, rating: null }))}
                    >
                      <Icon name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Distance Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance (km)</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  value={tempFilters.distance[1]}
                  onValueChange={(value) => 
                    setTempFilters(prev => ({ ...prev, distance: [0, value] }))
                  }
                  minimumValue={0}
                  maximumValue={50}
                  step={1}
                  minimumTrackTintColor="#1976d2"
                  maximumTrackTintColor="#ddd"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>0</Text>
                  <Text style={styles.sliderValue}>{tempFilters.distance[1]} km</Text>
                  <Text style={styles.sliderLabel}>50</Text>
                </View>
              </View>
            </View>

            {/* Gender Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <View style={styles.chipGroup}>
                {genderOptions.map(gender => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.filterChip,
                      tempFilters.gender.includes(gender) && styles.filterChipSelected
                    ]}
                    onPress={() => handleGenderChange(gender)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      tempFilters.gender.includes(gender) && styles.filterChipTextSelected
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Diet Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Diet Preference</Text>
              <View style={styles.chipGroup}>
                {dietOptions.map(diet => (
                  <TouchableOpacity
                    key={diet}
                    style={[
                      styles.filterChip,
                      tempFilters.diet.includes(diet) && styles.filterChipSelected
                    ]}
                    onPress={() => handleDietChange(diet)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      tempFilters.diet.includes(diet) && styles.filterChipTextSelected
                    ]}>
                      {diet}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Language Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <TouchableOpacity
                style={styles.languageSelector}
                onPress={() => setShowLanguagePicker(!showLanguagePicker)}
              >
                <Text style={styles.languageSelectorText}>
                  {tempFilters.language.length === 0 
                    ? 'Select Languages' 
                    : `${tempFilters.language.length} language(s) selected`}
                </Text>
                <Icon 
                  name={showLanguagePicker ? 'arrow-drop-up' : 'arrow-drop-down'} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>

              {renderLanguageChips()}

              {showLanguagePicker && (
                <View style={styles.languagePickerContainer}>
                  <ScrollView style={styles.languageList}>
                    {LANGUAGES.map((language) => (
                      <TouchableOpacity
                        key={language}
                        style={styles.languageItem}
                        onPress={() => handleLanguageToggle(language)}
                      >
                        <Text style={styles.languageItemText}>{language}</Text>
                        {tempFilters.language.includes(language) && (
                          <Icon name="check" size={20} color="#1976d2" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {tempFilters.language.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setTempFilters(prev => ({ ...prev, language: [] }))}
                >
                  <Text style={styles.clearButtonText}>Clear languages</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Availability Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability Status</Text>
              <View style={styles.chipGroup}>
                {availabilityOptions.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      tempFilters.availability.includes(status) && styles.filterChipSelected
                    ]}
                    onPress={() => handleAvailabilityChange(status)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      tempFilters.availability.includes(status) && styles.filterChipTextSelected
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sliderContainer: {
    paddingHorizontal: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  sliderValue: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ratingChipText: {
    color: '#1976d2',
    fontSize: 14,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterChipSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  languageSelectorText: {
    fontSize: 14,
    color: '#666',
  },
  languageChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: '#1976d2',
  },
  chipDelete: {
    padding: 2,
  },
  languagePickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 300,
    marginBottom: 8,
  },
  languageList: {
    padding: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageItemText: {
    fontSize: 14,
  },
  clearButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  clearButtonText: {
    color: '#1976d2',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
  },
  resetButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#1976d2',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProviderFilter;