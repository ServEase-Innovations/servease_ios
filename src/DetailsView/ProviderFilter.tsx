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
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../Settings/ThemeContext';

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
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();

  // Get font size styles
  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 14, headingSize: 18, smallText: 12 };
      case 'large':
        return { textSize: 18, headingSize: 24, smallText: 16 };
      default:
        return { textSize: 16, headingSize: 20, smallText: 14 };
    }
  };

  const fontStyles = getFontSizeStyles();
  const spacingMultiplier = compactMode ? 0.8 : 1;

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
            color={colors.rating}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderLanguageChips = () => {
    return (
      <View style={[styles.languageChipsContainer, { gap: 8 * spacingMultiplier }]}>
        {tempFilters.language.map((lang) => (
          <View key={lang} style={[styles.chip, { 
            backgroundColor: isDarkMode ? colors.surface2 : '#e3f2fd',
            paddingHorizontal: 8 * spacingMultiplier,
            paddingVertical: 4 * spacingMultiplier,
            gap: 4 * spacingMultiplier
          }]}>
            <Text style={[styles.chipText, { 
              color: isDarkMode ? colors.primary : '#1976d2',
              fontSize: fontStyles.smallText
            }]}>{lang}</Text>
            <TouchableOpacity
              onPress={() => handleLanguageToggle(lang)}
              style={styles.chipDelete}
            >
              <Icon name="close" size={16} color={isDarkMode ? colors.textSecondary : '#666'} />
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
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.drawer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={isDarkMode ? ['#1e293b', '#0f172a'] : ["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { padding: 16 * spacingMultiplier }]}
          >
            <View style={styles.headerTitle}>
              <Icon name="filter-list" size={24} color={colors.headerText} />
              <Text style={[styles.headerText, { 
                color: colors.headerText, 
                fontSize: fontStyles.headingSize,
                marginLeft: 8 * spacingMultiplier
              }]}>
                Filter Providers
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={colors.headerText} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ScrollView style={[styles.content, { padding: 16 * spacingMultiplier }]}>
            {/* Experience Filter */}
            <View style={[styles.section, { marginBottom: 24 * spacingMultiplier }]}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text, 
                fontSize: fontStyles.textSize,
                marginBottom: 12 * spacingMultiplier
              }]}>
                Experience (years)
              </Text>
              <View style={[styles.sliderContainer, { paddingHorizontal: 8 * spacingMultiplier }]}>
                <Slider
                  value={tempFilters.experience[1]}
                  onValueChange={(value) => 
                    setTempFilters(prev => ({ ...prev, experience: [0, value] }))
                  }
                  minimumValue={0}
                  maximumValue={30}
                  step={1}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <View style={[styles.sliderLabels, { marginTop: 8 * spacingMultiplier }]}>
                  <Text style={[styles.sliderLabel, { 
                    color: colors.textSecondary,
                    fontSize: fontStyles.smallText
                  }]}>0</Text>
                  <Text style={[styles.sliderValue, { 
                    color: colors.primary,
                    fontSize: fontStyles.textSize
                  }]}>{tempFilters.experience[1]} years</Text>
                  <Text style={[styles.sliderLabel, { 
                    color: colors.textSecondary,
                    fontSize: fontStyles.smallText
                  }]}>30</Text>
                </View>
              </View>
            </View>

            {/* Rating Filter */}
            <View style={[styles.section, { marginBottom: 24 * spacingMultiplier }]}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text, 
                fontSize: fontStyles.textSize,
                marginBottom: 12 * spacingMultiplier
              }]}>
                Minimum Rating
              </Text>
              <View style={[styles.ratingContainer, { gap: 8 * spacingMultiplier }]}>
                <View style={styles.starsContainer}>
                  {renderRatingStars()}
                </View>
                {tempFilters.rating && (
                  <View style={[styles.ratingChip, { 
                    backgroundColor: isDarkMode ? colors.surface2 : '#e3f2fd',
                    paddingHorizontal: 8 * spacingMultiplier,
                    paddingVertical: 4 * spacingMultiplier,
                    gap: 4 * spacingMultiplier
                  }]}>
                    <Text style={[styles.ratingChipText, { 
                      color: colors.primary,
                      fontSize: fontStyles.smallText
                    }]}>{tempFilters.rating}+</Text>
                    <TouchableOpacity
                      onPress={() => setTempFilters(prev => ({ ...prev, rating: null }))}
                    >
                      <Icon name="close" size={16} color={isDarkMode ? colors.textSecondary : '#666'} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Distance Filter */}
            <View style={[styles.section, { marginBottom: 24 * spacingMultiplier }]}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text, 
                fontSize: fontStyles.textSize,
                marginBottom: 12 * spacingMultiplier
              }]}>
                Distance (km)
              </Text>
              <View style={[styles.sliderContainer, { paddingHorizontal: 8 * spacingMultiplier }]}>
                <Slider
                  value={tempFilters.distance[1]}
                  onValueChange={(value) => 
                    setTempFilters(prev => ({ ...prev, distance: [0, value] }))
                  }
                  minimumValue={0}
                  maximumValue={50}
                  step={1}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
                <View style={[styles.sliderLabels, { marginTop: 8 * spacingMultiplier }]}>
                  <Text style={[styles.sliderLabel, { 
                    color: colors.textSecondary,
                    fontSize: fontStyles.smallText
                  }]}>0</Text>
                  <Text style={[styles.sliderValue, { 
                    color: colors.primary,
                    fontSize: fontStyles.textSize
                  }]}>{tempFilters.distance[1]} km</Text>
                  <Text style={[styles.sliderLabel, { 
                    color: colors.textSecondary,
                    fontSize: fontStyles.smallText
                  }]}>50</Text>
                </View>
              </View>
            </View>

            {/* Gender Filter */}
            <View style={[styles.section, { marginBottom: 24 * spacingMultiplier }]}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text, 
                fontSize: fontStyles.textSize,
                marginBottom: 12 * spacingMultiplier
              }]}>
                Gender
              </Text>
              <View style={[styles.chipGroup, { gap: 8 * spacingMultiplier }]}>
                {genderOptions.map(gender => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.filterChip,
                      tempFilters.gender.includes(gender) && styles.filterChipSelected,
                      { 
                        borderColor: colors.border,
                        backgroundColor: tempFilters.gender.includes(gender) 
                          ? colors.primary 
                          : isDarkMode ? colors.surface : colors.card,
                        paddingHorizontal: 12 * spacingMultiplier,
                        paddingVertical: 6 * spacingMultiplier,
                      }
                    ]}
                    onPress={() => handleGenderChange(gender)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { 
                        color: tempFilters.gender.includes(gender) 
                          ? '#ffffff' 
                          : colors.textSecondary,
                        fontSize: fontStyles.smallText
                      }
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Diet Filter */}
            <View style={[styles.section, { marginBottom: 24 * spacingMultiplier }]}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text, 
                fontSize: fontStyles.textSize,
                marginBottom: 12 * spacingMultiplier
              }]}>
                Diet Preference
              </Text>
              <View style={[styles.chipGroup, { gap: 8 * spacingMultiplier }]}>
                {dietOptions.map(diet => (
                  <TouchableOpacity
                    key={diet}
                    style={[
                      styles.filterChip,
                      tempFilters.diet.includes(diet) && styles.filterChipSelected,
                      { 
                        borderColor: colors.border,
                        backgroundColor: tempFilters.diet.includes(diet) 
                          ? colors.primary 
                          : isDarkMode ? colors.surface : colors.card,
                        paddingHorizontal: 12 * spacingMultiplier,
                        paddingVertical: 6 * spacingMultiplier,
                      }
                    ]}
                    onPress={() => handleDietChange(diet)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { 
                        color: tempFilters.diet.includes(diet) 
                          ? '#ffffff' 
                          : colors.textSecondary,
                        fontSize: fontStyles.smallText
                      }
                    ]}>
                      {diet}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Language Filter */}
            <View style={[styles.section, { marginBottom: 24 * spacingMultiplier }]}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text, 
                fontSize: fontStyles.textSize,
                marginBottom: 12 * spacingMultiplier
              }]}>
                Languages
              </Text>
              <TouchableOpacity
                style={[styles.languageSelector, { 
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? colors.surface : colors.card,
                  padding: 12 * spacingMultiplier,
                  marginBottom: 8 * spacingMultiplier
                }]}
                onPress={() => setShowLanguagePicker(!showLanguagePicker)}
              >
                <Text style={[styles.languageSelectorText, { 
                  color: colors.textSecondary,
                  fontSize: fontStyles.smallText
                }]}>
                  {tempFilters.language.length === 0 
                    ? 'Select Languages' 
                    : `${tempFilters.language.length} language(s) selected`}
                </Text>
                <Icon 
                  name={showLanguagePicker ? 'arrow-drop-up' : 'arrow-drop-down'} 
                  size={24} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>

              {renderLanguageChips()}

              {showLanguagePicker && (
                <View style={[styles.languagePickerContainer, { 
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? colors.surface : colors.card,
                  maxHeight: 300 * spacingMultiplier,
                  marginBottom: 8 * spacingMultiplier
                }]}>
                  <ScrollView style={[styles.languageList, { padding: 8 * spacingMultiplier }]}>
                    {LANGUAGES.map((language) => (
                      <TouchableOpacity
                        key={language}
                        style={[styles.languageItem, { 
                          padding: 12 * spacingMultiplier,
                          borderBottomColor: colors.border
                        }]}
                        onPress={() => handleLanguageToggle(language)}
                      >
                        <Text style={[styles.languageItemText, { 
                          color: colors.text,
                          fontSize: fontStyles.smallText
                        }]}>{language}</Text>
                        {tempFilters.language.includes(language) && (
                          <Icon name="check" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {tempFilters.language.length > 0 && (
                <TouchableOpacity
                  style={[styles.clearButton, { padding: 8 * spacingMultiplier }]}
                  onPress={() => setTempFilters(prev => ({ ...prev, language: [] }))}
                >
                  <Text style={[styles.clearButtonText, { 
                    color: colors.primary,
                    fontSize: fontStyles.smallText
                  }]}>Clear languages</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Availability Filter */}
            <View style={[styles.section, { marginBottom: 24 * spacingMultiplier }]}>
              <Text style={[styles.sectionTitle, { 
                color: colors.text, 
                fontSize: fontStyles.textSize,
                marginBottom: 12 * spacingMultiplier
              }]}>
                Availability Status
              </Text>
              <View style={[styles.chipGroup, { gap: 8 * spacingMultiplier }]}>
                {availabilityOptions.map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      tempFilters.availability.includes(status) && styles.filterChipSelected,
                      { 
                        borderColor: colors.border,
                        backgroundColor: tempFilters.availability.includes(status) 
                          ? colors.primary 
                          : isDarkMode ? colors.surface : colors.card,
                        paddingHorizontal: 12 * spacingMultiplier,
                        paddingVertical: 6 * spacingMultiplier,
                      }
                    ]}
                    onPress={() => handleAvailabilityChange(status)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { 
                        color: tempFilters.availability.includes(status) 
                          ? '#ffffff' 
                          : colors.textSecondary,
                        fontSize: fontStyles.smallText
                      }
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.footer, { 
            gap: 16 * spacingMultiplier,
            padding: 16 * spacingMultiplier
          }]}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton, { 
                borderColor: colors.primary,
                backgroundColor: isDarkMode ? colors.surface : '#fff',
                paddingVertical: 12 * spacingMultiplier
              }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetButtonText, { 
                color: colors.primary,
                fontSize: fontStyles.textSize
              }]}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton, { 
                backgroundColor: colors.primary,
                paddingVertical: 12 * spacingMultiplier
              }]}
              onPress={handleApply}
            >
              <Text style={[styles.applyButtonText, { 
                color: '#ffffff',
                fontSize: fontStyles.textSize
              }]}>Apply Filters</Text>
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
    justifyContent: 'flex-end',
  },
  drawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
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
  },
  sliderLabel: {
    fontSize: 12,
  },
  sliderValue: {
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
  },
  ratingChipText: {},
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipSelected: {},
  filterChipText: {},
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  languageSelectorText: {},
  languageChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
  },
  chipText: {},
  chipDelete: {
    padding: 2,
  },
  languagePickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  languageList: {},
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  languageItemText: {},
  clearButton: {
    alignSelf: 'flex-end',
  },
  clearButtonText: {},
  footer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    borderWidth: 1,
  },
  resetButtonText: {
    fontWeight: '500',
  },
  applyButton: {},
  applyButtonText: {
    fontWeight: '500',
  },
});

export default ProviderFilter;