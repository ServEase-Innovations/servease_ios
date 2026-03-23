/* eslint-disable */

// components/Registration/ServiceDetails.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import {
  RadioButton,
  Checkbox,
  Chip,
  Card,
  IconButton,
  Button,
  HelperText,
} from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { useTheme } from "../../src/Settings/ThemeContext";
import { useTranslation } from 'react-i18next';

interface ServiceDetailsProps {
  formData: any;
  errors: any;
  isCookSelected: boolean;
  isNannySelected: boolean;
  morningSlots: number[][];
  eveningSlots: number[][];
  isFullTime: boolean;
  selectedTimeSlots: string;
  onServiceTypeChange: (e: any) => void;
  onCookingSpecialityChange: (e: any) => void;
  onNannyCareTypeChange: (e: any) => void;
  onDietChange: (e: any) => void;
  onExperienceChange: (e: any) => void;
  onDescriptionChange: (e: any) => void;
  onReferralCodeChange: (e: any) => void;
  onAgentReferralIdChange: (e: any) => void; // Add this new prop
  onFullTimeToggle: (checked: boolean) => void;
  onAddMorningSlot: () => void;
  onRemoveMorningSlot: (index: number) => void;
  onClearMorningSlots: () => void;
  onAddEveningSlot: () => void;
  onRemoveEveningSlot: (index: number) => void;
  onClearEveningSlots: () => void;
  onMorningSlotChange: (index: number, newValue: number[]) => void;
  onEveningSlotChange: (index: number, newValue: number[]) => void;
  TimeSliderWithDisabledRanges?: React.FC<any>; // Optional
  DisabledRangesIndicator?: React.FC<any>; // Optional
  getDisabledRangesForSlot?: (slots: number[][], currentIndex: number) => number[][];
  formatDisplayTime?: (value: number) => string;
  // Add language props
  selectedLanguages?: string[];
  onLanguagesChange?: (languages: string[]) => void;
}

// Custom Time Slider Component
interface TimeSliderProps {
  value: number[];
  onChange: (newValue: number[]) => void;
  min: number;
  max: number;
  disabledRanges: number[][];
}

const TimeSlider: React.FC<TimeSliderProps> = ({ 
  value, 
  onChange, 
  min, 
  max, 
  disabledRanges 
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const formatTime = (value: number): string => {
    const hour = Math.floor(value);
    const minute = value % 1 === 0.5 ? "30" : "00";
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour;
    const displayHourFormatted = displayHour === 0 ? 12 : displayHour;
    return `${displayHourFormatted}:${minute} ${period}`;
  };

  const isTimeDisabled = (time: number): boolean => {
    return disabledRanges.some(range => time >= range[0] && time <= range[1]);
  };

  const getNearestAllowedTime = (time: number, isStart: boolean): number => {
    let newTime = time;
    
    // Check if current time is in disabled range
    for (const range of disabledRanges) {
      if (time > range[0] && time < range[1]) {
        // If in disabled range, move to nearest allowed edge
        if (isStart) {
          newTime = range[1]; // Move start to end of disabled range
        } else {
          newTime = range[0]; // Move end to start of disabled range
        }
        break;
      }
    }
    
    // Ensure start <= end
    if (isStart && newTime >= value[1]) {
      newTime = value[1] - 0.5;
    } else if (!isStart && newTime <= value[0]) {
      newTime = value[0] + 0.5;
    }
    
    // Round to nearest 0.5
    return Math.round(newTime * 2) / 2;
  };

  const handleStartChange = (newStart: number) => {
    const allowedStart = getNearestAllowedTime(newStart, true);
    onChange([allowedStart, value[1]]);
  };

  const handleEndChange = (newEnd: number) => {
    const allowedEnd = getNearestAllowedTime(newEnd, false);
    onChange([value[0], allowedEnd]);
  };

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          timeLabelSmall: 10,
          timeLabelValue: 13,
          sliderLabel: 11,
        };
      case 'large':
        return {
          timeLabelSmall: 13,
          timeLabelValue: 16,
          sliderLabel: 14,
        };
      default:
        return {
          timeLabelSmall: 11,
          timeLabelValue: 14,
          sliderLabel: 12,
        };
    }
  };

  const fontSizes = getFontSizes();

  const dynamicStyles = StyleSheet.create({
    timeSliderContainer: {
      marginTop: 8,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    timeLabelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    timeLabelBox: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 8,
      borderRadius: 6,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeLabelSmall: {
      fontSize: fontSizes.timeLabelSmall,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    timeLabelValue: {
      fontSize: fontSizes.timeLabelValue,
      fontWeight: '600',
      color: colors.primary,
    },
    disabledRangesTrack: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden',
    },
    trackBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.border,
    },
    disabledRangeOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      backgroundColor: colors.warning,
      opacity: 0.5,
    },
    sliderWrapper: {
      marginBottom: 16,
    },
    sliderLabel: {
      fontSize: fontSizes.sliderLabel,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    slider: {
      width: '100%',
      height: 40,
    },
  });

  return (
    <View style={dynamicStyles.timeSliderContainer}>
      {/* Time Labels */}
      <View style={dynamicStyles.timeLabelsRow}>
        <View style={dynamicStyles.timeLabelBox}>
          <Text style={dynamicStyles.timeLabelSmall}>{t('registration.service.start')}</Text>
          <Text style={dynamicStyles.timeLabelValue}>{formatTime(value[0])}</Text>
        </View>
        <View style={dynamicStyles.timeLabelBox}>
          <Text style={dynamicStyles.timeLabelSmall}>{t('registration.service.end')}</Text>
          <Text style={dynamicStyles.timeLabelValue}>{formatTime(value[1])}</Text>
        </View>
      </View>

      {/* Disabled Ranges Indicator */}
      <View style={dynamicStyles.disabledRangesTrack}>
        <View style={dynamicStyles.trackBackground} />
        {disabledRanges.map((range, index) => {
          const left = ((range[0] - min) / (max - min)) * 100;
          const width = ((range[1] - range[0]) / (max - min)) * 100;
          return (
            <View
              key={index}
              style={[
                dynamicStyles.disabledRangeOverlay,
                {
                  left: `${left}%`,
                  width: `${width}%`,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Start Slider */}
      <View style={dynamicStyles.sliderWrapper}>
        <Text style={dynamicStyles.sliderLabel}>{t('registration.service.startTime')}</Text>
        <Slider
          style={dynamicStyles.slider}
          value={value[0]}
          minimumValue={min}
          maximumValue={max}
          step={0.5}
          onValueChange={handleStartChange}
          onSlidingStart={() => setIsDraggingStart(true)}
          onSlidingComplete={() => setIsDraggingStart(false)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
      </View>

      {/* End Slider */}
      <View style={dynamicStyles.sliderWrapper}>
        <Text style={dynamicStyles.sliderLabel}>{t('registration.service.endTime')}</Text>
        <Slider
          style={dynamicStyles.slider}
          value={value[1]}
          minimumValue={min}
          maximumValue={max}
          step={0.5}
          onValueChange={handleEndChange}
          onSlidingStart={() => setIsDraggingEnd(true)}
          onSlidingComplete={() => setIsDraggingEnd(false)}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
        />
      </View>
    </View>
  );
};

// Disabled Ranges Legend Component
interface DisabledRangesLegendProps {
  ranges: number[][];
  min?: number;
  max?: number;
}

const DisabledRangesIndicator: React.FC<DisabledRangesLegendProps> = ({ ranges, min = 0, max = 24 }) => {
  const { colors, fontSize } = useTheme();
  const { t } = useTranslation();
  
  if (ranges.length === 0) return null;

  const formatTimeRange = (range: number[]): string => {
    const startHour = Math.floor(range[0]);
    const startMinute = range[0] % 1 === 0.5 ? "30" : "00";
    const endHour = Math.floor(range[1]);
    const endMinute = range[1] % 1 === 0.5 ? "30" : "00";
    
    const startPeriod = startHour >= 12 ? "PM" : "AM";
    const endPeriod = endHour >= 12 ? "PM" : "AM";
    
    const displayStartHour = startHour > 12 ? startHour - 12 : startHour;
    const displayEndHour = endHour > 12 ? endHour - 12 : endHour;
    
    return `${displayStartHour}:${startMinute} ${startPeriod} - ${displayEndHour}:${endMinute} ${endPeriod}`;
  };

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          legendTitle: 11,
          legendText: 10,
        };
      case 'large':
        return {
          legendTitle: 14,
          legendText: 13,
        };
      default:
        return {
          legendTitle: 12,
          legendText: 11,
        };
    }
  };

  const fontSizes = getFontSizes();

  const dynamicStyles = StyleSheet.create({
    legendContainer: {
      marginBottom: 12,
      padding: 8,
      backgroundColor: colors.warningLight,
      borderRadius: 6,
    },
    legendTitle: {
      fontSize: fontSizes.legendTitle,
      fontWeight: '600',
      color: colors.warning,
      marginBottom: 6,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    legendColorBox: {
      width: 12,
      height: 12,
      backgroundColor: colors.warning,
      opacity: 0.5,
      borderRadius: 2,
      marginRight: 6,
    },
    legendText: {
      fontSize: fontSizes.legendText,
      color: colors.textSecondary,
      flex: 1,
    },
  });

  return (
    <View style={dynamicStyles.legendContainer}>
      <Text style={dynamicStyles.legendTitle}>{t('registration.service.timeSlotsTaken')}</Text>
      {ranges.map((range, index) => (
        <View key={index} style={dynamicStyles.legendItem}>
          <View style={dynamicStyles.legendColorBox} />
          <Text style={dynamicStyles.legendText}>{formatTimeRange(range)}</Text>
        </View>
      ))}
    </View>
  );
};

// Helper function to get disabled ranges for a slot
const getDisabledRangesForSlot = (slots: number[][], currentIndex: number): number[][] => {
  return slots.filter((_, index) => index !== currentIndex);
};

// Helper function to format display time
const formatDisplayTime = (value: number): string => {
  const hour = Math.floor(value);
  const minute = value % 1 === 0.5 ? "30" : "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  const displayHourFormatted = displayHour === 0 ? 12 : displayHour;
  return `${displayHourFormatted}:${minute} ${period}`;
};

const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  formData,
  errors,
  isCookSelected,
  isNannySelected,
  morningSlots,
  eveningSlots,
  isFullTime,
  selectedTimeSlots,
  onServiceTypeChange,
  onCookingSpecialityChange,
  onNannyCareTypeChange,
  onDietChange,
  onExperienceChange,
  onDescriptionChange,
  onReferralCodeChange,
  onAgentReferralIdChange, // Add this new prop
  onFullTimeToggle,
  onAddMorningSlot,
  onRemoveMorningSlot,
  onClearMorningSlots,
  onAddEveningSlot,
  onRemoveEveningSlot,
  onClearEveningSlots,
  onMorningSlotChange,
  onEveningSlotChange,
  TimeSliderWithDisabledRanges = TimeSlider,
  DisabledRangesIndicator: DisabledRangesIndicatorComponent = DisabledRangesIndicator,
  getDisabledRangesForSlot: getDisabledRangesForSlotFn = getDisabledRangesForSlot,
  formatDisplayTime: formatDisplayTimeFn = formatDisplayTime,
  // Add language props with default values
  selectedLanguages = [],
  onLanguagesChange,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();

  // Language selection state (only available languages, selected comes from props)
  const [availableLanguages] = useState<string[]>([
    "Assamese", "Bengali", "Gujarati", "Hindi", "Kannada", 
    "Kashmiri", "Marathi", "Malayalam", "Oriya", "Punjabi", 
    "Sanskrit", "Tamil", "Telugu", "Urdu", "Sindhi", 
    "Konkani", "Nepali", "Manipuri", "Bodo", "Dogri", 
    "Maithili", "Santhali", "English"
  ]);

  // Handler for language changes
  const handleLanguageChange = (language: string) => {
    if (onLanguagesChange) {
      if (selectedLanguages.includes(language)) {
        // Remove language if already selected
        onLanguagesChange(selectedLanguages.filter(l => l !== language));
      } else {
        // Add language if not selected
        onLanguagesChange([...selectedLanguages, language]);
      }
    }
  };

  const serviceTypes = [
    { value: "COOK", label: t('registration.service.cook'), icon: "restaurant", description: t('registration.service.cookDesc') },
    { value: "NANNY", label: t('registration.service.nanny'), icon: "child-care", description: t('registration.service.nannyDesc') },
    { value: "MAID", label: t('registration.service.maid'), icon: "cleaning-services", description: t('registration.service.maidDesc') },
  ];

  const dietOptions = [
    { value: "VEG", label: t('registration.service.veg'), icon: "leaf", description: t('registration.service.vegDesc') },
    { value: "NONVEG", label: t('registration.service.nonVeg'), icon: "restaurant-menu", description: t('registration.service.nonVegDesc') },
    { value: "BOTH", label: t('registration.service.both'), icon: "restaurant", description: t('registration.service.bothDesc') },
  ];

  const cookingSpecialityOptions = [
    { value: "VEG", label: t('registration.service.veg'), icon: "leaf", description: t('registration.service.vegDesc') },
    { value: "NONVEG", label: t('registration.service.nonVeg'), icon: "restaurant-menu", description: t('registration.service.nonVegDesc') },
    { value: "BOTH", label: t('registration.service.both'), icon: "restaurant", description: t('registration.service.bothDesc') },
  ];

  const nannyCareOptions = [
    { value: "BABY_CARE", label: t('registration.service.babyCare'), icon: "child-care", description: t('registration.service.babyCareDesc') },
    { value: "ELDERLY_CARE", label: t('registration.service.elderlyCare'), icon: "elderly", description: t('registration.service.elderlyCareDesc') },
    { value: "BOTH", label: t('registration.service.bothCare'), icon: "favorite", description: t('registration.service.bothCareDesc') },
  ];

  const getDietLabel = (option: string) => {
    switch(option) {
      case "VEG": return t('registration.service.veg');
      case "NONVEG": return t('registration.service.nonVeg');
      case "BOTH": return t('registration.service.both');
      default: return option;
    }
  };

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          headerTitle: 16,
          label: 13,
          labelHelper: 11,
          optionText: 14,
          optionDescription: 11,
          fullTimeTitle: 14,
          fullTimeSubtitle: 11,
          slotTitle: 14,
          slotButtonLabel: 11,
          slotChipText: 10,
          emptySlotTitle: 14,
          emptySlotSubtitle: 12,
          slotItemTitle: 13,
          summaryTitle: 13,
          summaryText: 13,
          input: 13,
          errorText: 11,
        };
      case 'large':
        return {
          headerTitle: 20,
          label: 16,
          labelHelper: 14,
          optionText: 17,
          optionDescription: 14,
          fullTimeTitle: 17,
          fullTimeSubtitle: 14,
          slotTitle: 17,
          slotButtonLabel: 14,
          slotChipText: 13,
          emptySlotTitle: 17,
          emptySlotSubtitle: 15,
          slotItemTitle: 16,
          summaryTitle: 16,
          summaryText: 16,
          input: 16,
          errorText: 14,
        };
      default:
        return {
          headerTitle: 18,
          label: 14,
          labelHelper: 12,
          optionText: 15,
          optionDescription: 12,
          fullTimeTitle: 15,
          fullTimeSubtitle: 12,
          slotTitle: 15,
          slotButtonLabel: 12,
          slotChipText: 11,
          emptySlotTitle: 15,
          emptySlotSubtitle: 13,
          slotItemTitle: 14,
          summaryTitle: 14,
          summaryText: 14,
          input: 14,
          errorText: 12,
        };
    }
  };

  const fontSizes = getFontSizes();

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    spacing: {
      marginBottom: 16,
    },
    card: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerTitle: {
      fontSize: fontSizes.headerTitle,
      fontWeight: 'bold',
      color: colors.primary,
      marginLeft: 8,
    },
    sectionSpacing: {
      gap: 24,
    },
    subSection: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    label: {
      fontSize: fontSizes.label,
      fontWeight: 'bold',
      color: colors.primary,
      marginLeft: 6,
    },
    labelHelper: {
      fontSize: fontSizes.labelHelper,
      color: colors.textSecondary,
      marginBottom: 12,
      marginLeft: 26,
    },
    asterisk: {
      color: colors.error,
      fontSize: fontSizes.label,
    },
    optionsContainer: {
      marginTop: 8,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginBottom: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedOption: {
      backgroundColor: isDarkMode ? colors.primary + '20' : '#e3f2fd',
      borderColor: colors.primary,
    },
    optionIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionText: {
      fontSize: fontSizes.optionText,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    selectedOptionText: {
      color: colors.primary,
    },
    optionDescription: {
      fontSize: fontSizes.optionDescription,
      color: colors.textSecondary,
    },
    errorAlert: {
      marginTop: 8,
      padding: 10,
      backgroundColor: colors.errorLight,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    errorText: {
      color: colors.error,
      fontSize: fontSizes.errorText,
      flex: 1,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: fontSizes.input,
      minHeight: 100,
      textAlignVertical: 'top',
      backgroundColor: colors.card,
      color: colors.text,
      marginTop: 8,
    },
    rowContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    halfWidth: {
      flex: 1,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: fontSizes.input,
      backgroundColor: colors.card,
      color: colors.text,
      marginTop: 4,
    },
    inputError: {
      borderColor: colors.error,
    },
    fullTimeCard: {
      padding: 16,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fullTimeSelected: {
      backgroundColor: isDarkMode ? colors.primary + '20' : '#e3f2fd',
      borderColor: colors.primary,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fullTimeTextContainer: {
      marginLeft: 8,
      flex: 1,
    },
    fullTimeTitle: {
      fontSize: fontSizes.fullTimeTitle,
      fontWeight: 'bold',
      color: colors.text,
    },
    fullTimeSubtitle: {
      fontSize: fontSizes.fullTimeSubtitle,
      color: colors.textSecondary,
      marginTop: 2,
    },
    slotSection: {
      marginBottom: 24,
    },
    slotHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    slotTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    slotTitle: {
      fontSize: fontSizes.slotTitle,
      fontWeight: 'bold',
      color: colors.primary,
      marginLeft: 6,
    },
    slotActions: {
      flexDirection: 'row',
    },
    slotActionsInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    slotButton: {
      borderRadius: 20,
    },
    slotButtonLabel: {
      fontSize: fontSizes.slotButtonLabel,
      marginHorizontal: 4,
    },
    slotChip: {
      backgroundColor: colors.primary,
      height: 30,
      marginRight: 4,
    },
    slotChipText: {
      color: '#fff',
      fontSize: fontSizes.slotChipText,
    },
    slotIconButton: {
      width: 32,
      height: 32,
      margin: 0,
      backgroundColor: isDarkMode ? colors.primary + '20' : '#e3f2fd',
    },
    deleteIconButton: {
      backgroundColor: isDarkMode ? colors.error + '20' : '#ffebee',
    },
    emptySlotCard: {
      padding: 24,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      gap: 8,
    },
    emptySlotTitle: {
      fontSize: fontSizes.emptySlotTitle,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    emptySlotSubtitle: {
      fontSize: fontSizes.emptySlotSubtitle,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    slotItemCard: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
    },
    slotItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    slotItemTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    slotItemTitle: {
      fontSize: fontSizes.slotItemTitle,
      fontWeight: 'bold',
      color: colors.primary,
    },
    deleteButton: {
      margin: 0,
      padding: 0,
    },
    summaryCard: {
      marginTop: 16,
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
    summaryText: {
      fontSize: fontSizes.summaryText,
      color: colors.primary,
      lineHeight: 20,
    },
    languageChip: {
      margin: 4,
      backgroundColor: colors.card,
    },
    selectedLanguageChip: {
      backgroundColor: colors.primary + '20',
    },
    languageChipText: {
      fontSize: fontSizes.optionText,
    },
    selectedLanguageChipText: {
      color: colors.primary,
    },
    languageSection: {
      marginTop: 16,
    },
  });

  const handleServiceTypePress = (serviceValue: string) => {
    const event = {
      target: { value: serviceValue }
    };
    onServiceTypeChange(event);
  };

  const handleCookingSpecialityPress = (option: string) => {
    const event = {
      target: { value: option, name: 'cookingSpeciality' }
    };
    onCookingSpecialityChange(event);
  };

  const handleNannyCareTypePress = (option: any) => {
    const event = {
      target: { value: option.value, name: 'nannyCareType' }
    };
    onNannyCareTypeChange(event);
  };

  const handleDietPress = (option: string) => {
    const event = {
      target: { value: option, name: 'diet' }
    };
    onDietChange(event);
  };

  const handleAddLanguage = () => {
    // This would typically open a modal or picker
    // For now, we'll just cycle through languages as a demo
    if (availableLanguages.length > 0 && onLanguagesChange) {
      const nextLanguage = availableLanguages.find(lang => !selectedLanguages.includes(lang));
      if (nextLanguage) {
        handleLanguageChange(nextLanguage);
      }
    }
  };

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.spacing}>
        {/* Combined Services Card */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.headerContainer}>
              <Icon name="home" size={24} color={colors.primary} />
              <Text style={dynamicStyles.headerTitle}>{t('registration.service.title')}</Text>
            </View>
            
            <View style={dynamicStyles.sectionSpacing}>
              {/* Service Type Selection */}
              <View>
                <View style={dynamicStyles.labelContainer}>
                  <Icon name="work" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.label}>
                    {t('registration.service.selectServiceType')} <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>
                  {t('registration.service.serviceTypeHelper')}
                </Text>
                
                <View style={dynamicStyles.optionsContainer}>
                  {serviceTypes.map((service) => (
                    <TouchableOpacity
                      key={service.value}
                      style={[
                        dynamicStyles.optionCard,
                        formData.housekeepingRole.includes(service.value) && dynamicStyles.selectedOption,
                      ]}
                      onPress={() => handleServiceTypePress(service.value)}
                    >
                      <View style={dynamicStyles.optionIconContainer}>
                        <Icon 
                          name={service.value === "COOK" ? "restaurant" : 
                                service.value === "NANNY" ? "child-care" : 
                                "cleaning-services"} 
                          size={24} 
                          color={formData.housekeepingRole.includes(service.value) ? colors.primary : colors.textSecondary} 
                        />
                      </View>
                      <View style={dynamicStyles.optionTextContainer}>
                        <Text
                          style={[
                            dynamicStyles.optionText,
                            formData.housekeepingRole.includes(service.value) && dynamicStyles.selectedOptionText,
                          ]}
                        >
                          {service.label}
                        </Text>
                        <Text style={dynamicStyles.optionDescription}>
                          {service.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {errors.housekeepingRole && (
                  <View style={dynamicStyles.errorAlert}>
                    <Icon name="error" size={16} color={colors.error} />
                    <Text style={dynamicStyles.errorText}>{errors.housekeepingRole}</Text>
                  </View>
                )}
              </View>

              {/* Cooking Speciality - Only show when Cook is selected */}
              {isCookSelected && (
                <View style={dynamicStyles.subSection}>
                  <View style={dynamicStyles.labelContainer}>
                    <Icon name="restaurant" size={20} color={colors.primary} />
                    <Text style={dynamicStyles.label}>
                      {t('registration.service.cookingSpeciality')} <Text style={dynamicStyles.asterisk}>*</Text>
                    </Text>
                  </View>
                  <Text style={dynamicStyles.labelHelper}>
                    {t('registration.service.cookingSpecialityHelper')}
                  </Text>
                  
                  <View style={dynamicStyles.optionsContainer}>
                    {cookingSpecialityOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          dynamicStyles.optionCard,
                          formData.cookingSpeciality === option.value && dynamicStyles.selectedOption,
                        ]}
                        onPress={() => handleCookingSpecialityPress(option.value)}
                      >
                        <View style={dynamicStyles.optionIconContainer}>
                          <Icon 
                            name={option.icon} 
                            size={24} 
                            color={formData.cookingSpeciality === option.value ? colors.primary : colors.textSecondary} 
                          />
                        </View>
                        <View style={dynamicStyles.optionTextContainer}>
                          <Text
                            style={[
                              dynamicStyles.optionText,
                              formData.cookingSpeciality === option.value && dynamicStyles.selectedOptionText,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={dynamicStyles.optionDescription}>
                            {option.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {errors.cookingSpeciality && (
                    <HelperText type="error" visible={!!errors.cookingSpeciality} style={{ color: colors.error, fontSize: fontSizes.errorText }}>
                      {errors.cookingSpeciality}
                    </HelperText>
                  )}
                </View>
              )}

              {/* Nanny Care Type - Only show when Nanny is selected */}
              {isNannySelected && (
                <View style={dynamicStyles.subSection}>
                  <View style={dynamicStyles.labelContainer}>
                    <Icon name="child-care" size={20} color={colors.primary} />
                    <Text style={dynamicStyles.label}>
                      {t('registration.service.careType')} <Text style={dynamicStyles.asterisk}>*</Text>
                    </Text>
                  </View>
                  <Text style={dynamicStyles.labelHelper}>
                    {t('registration.service.careTypeHelper')}
                  </Text>
                  
                  <View style={dynamicStyles.optionsContainer}>
                    {nannyCareOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          dynamicStyles.optionCard,
                          formData.nannyCareType === option.value && dynamicStyles.selectedOption,
                        ]}
                        onPress={() => handleNannyCareTypePress(option)}
                      >
                        <View style={dynamicStyles.optionIconContainer}>
                          <Icon 
                            name={option.icon} 
                            size={24} 
                            color={formData.nannyCareType === option.value ? colors.primary : colors.textSecondary} 
                          />
                        </View>
                        <View style={dynamicStyles.optionTextContainer}>
                          <Text
                            style={[
                              dynamicStyles.optionText,
                              formData.nannyCareType === option.value && dynamicStyles.selectedOptionText,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={dynamicStyles.optionDescription}>
                            {option.description}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {errors.nannyCareType && (
                    <HelperText type="error" visible={!!errors.nannyCareType} style={{ color: colors.error, fontSize: fontSizes.errorText }}>
                      {errors.nannyCareType}
                    </HelperText>
                  )}
                </View>
              )}

              {/* Diet Section */}
              <View style={dynamicStyles.subSection}>
                <View style={dynamicStyles.labelContainer}>
                  <Icon name="restaurant" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.label}>
                    {t('registration.service.dietPreference')} <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>
                  {t('registration.service.dietHelper')}
                </Text>
                
                <View style={dynamicStyles.optionsContainer}>
                  {dietOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        dynamicStyles.optionCard,
                        formData.diet === option.value && dynamicStyles.selectedOption,
                      ]}
                      onPress={() => handleDietPress(option.value)}
                    >
                      <View style={dynamicStyles.optionIconContainer}>
                        <Icon 
                          name={option.icon} 
                          size={24} 
                          color={formData.diet === option.value ? colors.primary : colors.textSecondary} 
                        />
                      </View>
                      <View style={dynamicStyles.optionTextContainer}>
                        <Text
                          style={[
                            dynamicStyles.optionText,
                            formData.diet === option.value && dynamicStyles.selectedOptionText,
                          ]}
                        >
                          {getDietLabel(option.value)}
                        </Text>
                        <Text style={dynamicStyles.optionDescription}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {errors.diet && (
                  <HelperText type="error" visible={!!errors.diet} style={{ color: colors.error, fontSize: fontSizes.errorText }}>
                    {errors.diet}
                  </HelperText>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      
        {/* Description Section */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.labelContainer}>
              <Icon name="description" size={20} color={colors.primary} />
              <Text style={dynamicStyles.label}>{t('registration.service.description')}</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              {t('registration.service.descriptionHelper')}
            </Text>
            <TextInput
              style={dynamicStyles.textArea}
              placeholder={t('registration.service.descriptionPlaceholder')}
              placeholderTextColor={colors.placeholder}
              value={formData.description}
              onChangeText={(text) => onDescriptionChange({ target: { value: text } })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card.Content>
        </Card>

        {/* Languages Section - New */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.labelContainer}>
              <Icon name="language" size={20} color={colors.primary} />
              <Text style={dynamicStyles.label}>Languages Spoken</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              Select languages you speak (you can select multiple)
            </Text>
            
            <View style={dynamicStyles.languageSection}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {availableLanguages.slice(0, 8).map((language) => (
                  <Chip
                    key={language}
                    mode="outlined"
                    selected={selectedLanguages.includes(language)}
                    onPress={() => handleLanguageChange(language)}
                    style={[
                      dynamicStyles.languageChip,
                      selectedLanguages.includes(language) && dynamicStyles.selectedLanguageChip
                    ]}
                    textStyle={[
                      dynamicStyles.languageChipText,
                      selectedLanguages.includes(language) && dynamicStyles.selectedLanguageChipText
                    ]}
                  >
                    {language}
                  </Chip>
                ))}
              </View>
              
              <Button
                mode="outlined"
                onPress={handleAddLanguage}
                icon="plus"
                style={{ marginTop: 8 }}
              >
                Add More Languages
              </Button>
              
              {/* Selected Languages Summary */}
              {selectedLanguages.length > 0 && (
                <View style={[dynamicStyles.summaryCard, { marginTop: 16, padding: 12 }]}>
                  <View style={dynamicStyles.summaryHeader}>
                    <Icon name="check-circle" size={18} color={colors.primary} />
                    <Text style={dynamicStyles.summaryTitle}>
                      Selected Languages ({selectedLanguages.length}):
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {selectedLanguages.map((language, index) => (
                      <Chip
                        key={index}
                        mode="flat"
                        onClose={() => {
                          if (onLanguagesChange) {
                            onLanguagesChange(selectedLanguages.filter((_, i) => i !== index));
                          }
                        }}
                        style={{ backgroundColor: colors.surface }}
                      >
                        {language}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      
        {/* Experience and Referral Section */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.rowContainer}>
              <View style={dynamicStyles.halfWidth}>
                <View style={dynamicStyles.labelContainer}>
                  <Icon name="work" size={18} color={colors.primary} />
                  <Text style={dynamicStyles.label}>
                    {t('registration.service.experience')} <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>{t('registration.service.experienceHelper')}</Text>
                <TextInput
                  style={[dynamicStyles.input, errors.experience && dynamicStyles.inputError]}
                  placeholder={t('registration.service.experiencePlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  value={formData.experience}
                  onChangeText={(text) => onExperienceChange({ target: { value: text } })}
                  keyboardType="numeric"
                />
                {errors.experience && (
                  <HelperText type="error" visible={!!errors.experience} style={{ color: colors.error, fontSize: fontSizes.errorText }}>
                    {errors.experience}
                  </HelperText>
                )}
              </View>
              
              <View style={dynamicStyles.halfWidth}>
                <View style={dynamicStyles.labelContainer}>
                  <Icon name="card-giftcard" size={18} color={colors.primary} />
                  <Text style={dynamicStyles.label}>{t('registration.service.referralCode')}</Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>{t('registration.service.referralHelper')}</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder={t('registration.service.referralPlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  value={formData.referralCode || ""}
                  onChangeText={(text) => onReferralCodeChange({ target: { value: text } })}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Agent Referral ID - New */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.labelContainer}>
              <Icon name="person" size={18} color={colors.primary} />
              <Text style={dynamicStyles.label}>Agent Referral ID (Optional)</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              If you were referred by an agent, please enter their referral ID
            </Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder="Enter Agent Referral ID"
              placeholderTextColor={colors.placeholder}
              value={formData.agentReferralId || ""}
              onChangeText={(text) => onAgentReferralIdChange({ target: { value: text } })}
            />
          </Card.Content>
        </Card>
      
        {/* Time slot section */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.headerContainer}>
              <Icon name="access-time" size={24} color={colors.primary} />
              <Text style={dynamicStyles.headerTitle}>{t('registration.service.availability')}</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              {t('registration.service.availabilityHelper')}
            </Text>
            
            <View>
              <TouchableOpacity
                style={[dynamicStyles.fullTimeCard, isFullTime && dynamicStyles.fullTimeSelected]}
                onPress={() => onFullTimeToggle(!isFullTime)}
              >
                <View style={dynamicStyles.checkboxContainer}>
                  <Checkbox
                    status={isFullTime ? 'checked' : 'unchecked'}
                    onPress={() => onFullTimeToggle(!isFullTime)}
                    color={colors.primary}
                  />
                  <View style={dynamicStyles.fullTimeTextContainer}>
                    <Text style={dynamicStyles.fullTimeTitle}>{t('registration.service.fullTime')}</Text>
                    <Text style={dynamicStyles.fullTimeSubtitle}>{t('registration.service.fullTimeDesc')}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {!isFullTime && (
                <View>
                  {/* Morning Slots Section */}
                  <View style={dynamicStyles.slotSection}>
                    <View style={dynamicStyles.slotHeader}>
                      <View style={dynamicStyles.slotTitleContainer}>
                        <Icon name="wb-sunny" size={20} color={colors.primary} />
                        <Text style={dynamicStyles.slotTitle}>{t('registration.service.morning')}</Text>
                      </View>
                      <View style={dynamicStyles.slotActions}>
                        {morningSlots.length === 0 ? (
                          <Button
                            mode="contained"
                            onPress={onAddMorningSlot}
                            style={dynamicStyles.slotButton}
                            labelStyle={dynamicStyles.slotButtonLabel}
                            icon="plus"
                          >
                            {t('registration.service.addMorning')}
                          </Button>
                        ) : (
                          <View style={dynamicStyles.slotActionsInner}>
                            <Chip
                              style={dynamicStyles.slotChip}
                              textStyle={dynamicStyles.slotChipText}
                            >
                              {morningSlots.length} {t('registration.service.slot')}
                            </Chip>
                            {morningSlots.length < 12 && (
                              <IconButton
                                icon="plus"
                                size={20}
                                onPress={onAddMorningSlot}
                                style={dynamicStyles.slotIconButton}
                              />
                            )}
                            <IconButton
                              icon="delete"
                              size={20}
                              onPress={onClearMorningSlots}
                              style={[dynamicStyles.slotIconButton, dynamicStyles.deleteIconButton]}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    {morningSlots.length === 0 ? (
                      <View style={dynamicStyles.emptySlotCard}>
                        <Icon name="wb-sunny" size={40} color={colors.border} />
                        <Text style={dynamicStyles.emptySlotTitle}>
                          {t('registration.service.noMorningSlots')}
                        </Text>
                        <Text style={dynamicStyles.emptySlotSubtitle}>
                          {t('registration.service.noMorningSlotsDesc')}
                        </Text>
                      </View>
                    ) : (
                      morningSlots.map((slot, index) => {
                        const disabledRanges = getDisabledRangesForSlotFn(morningSlots, index);
                        
                        return (
                          <Card
                            key={`morning-${index}`}
                            style={dynamicStyles.slotItemCard}
                          >
                            <View style={dynamicStyles.slotItemHeader}>
                              <View style={dynamicStyles.slotItemTitleContainer}>
                                <Icon name="access-time" size={18} color={colors.primary} />
                                <Text style={dynamicStyles.slotItemTitle}>
                                  {t('registration.service.morningSlot', { number: index + 1 })}
                                </Text>
                              </View>
                              {morningSlots.length > 1 && (
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  onPress={() => onRemoveMorningSlot(index)}
                                  style={dynamicStyles.deleteButton}
                                />
                              )}
                            </View>
                            
                            <Text style={[dynamicStyles.labelHelper, { marginBottom: 8 }]}>
                              Selected {formatDisplayTimeFn(slot[0])} - {formatDisplayTimeFn(slot[1])}
                            </Text>
                            
                            {disabledRanges.length > 0 && (
                              <>
                                <Text style={[dynamicStyles.labelHelper, { color: colors.warning }]}>
                                  Warning: Gray areas are already taken
                                </Text>
                                <DisabledRangesIndicatorComponent 
                                  ranges={disabledRanges}
                                  min={6}
                                  max={12}
                                />
                              </>
                            )}
                            
                            <TimeSliderWithDisabledRanges
                              value={slot}
                              onChange={(newValue) => onMorningSlotChange(index, newValue)}
                              min={6}
                              max={12}
                              disabledRanges={disabledRanges}
                            />
                          </Card>
                        );
                      })
                    )}
                  </View>

                  {/* Evening Slots Section */}
                  <View style={dynamicStyles.slotSection}>
                    <View style={dynamicStyles.slotHeader}>
                      <View style={dynamicStyles.slotTitleContainer}>
                        <Icon name="nights-stay" size={20} color={colors.primary} />
                        <Text style={dynamicStyles.slotTitle}>{t('registration.service.evening')}</Text>
                      </View>
                      <View style={dynamicStyles.slotActions}>
                        {eveningSlots.length === 0 ? (
                          <Button
                            mode="contained"
                            onPress={onAddEveningSlot}
                            style={dynamicStyles.slotButton}
                            labelStyle={dynamicStyles.slotButtonLabel}
                            icon="plus"
                          >
                            {t('registration.service.addEvening')}
                          </Button>
                        ) : (
                          <View style={dynamicStyles.slotActionsInner}>
                            <Chip
                              style={dynamicStyles.slotChip}
                              textStyle={dynamicStyles.slotChipText}
                            >
                              {eveningSlots.length} {t('registration.service.slot')}
                            </Chip>
                            {eveningSlots.length < 16 && (
                              <IconButton
                                icon="plus"
                                size={20}
                                onPress={onAddEveningSlot}
                                style={dynamicStyles.slotIconButton}
                              />
                            )}
                            <IconButton
                              icon="delete"
                              size={20}
                              onPress={onClearEveningSlots}
                              style={[dynamicStyles.slotIconButton, dynamicStyles.deleteIconButton]}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    {eveningSlots.length === 0 ? (
                      <View style={dynamicStyles.emptySlotCard}>
                        <Icon name="nights-stay" size={40} color={colors.border} />
                        <Text style={dynamicStyles.emptySlotTitle}>
                          {t('registration.service.noEveningSlots')}
                        </Text>
                        <Text style={dynamicStyles.emptySlotSubtitle}>
                          {t('registration.service.noEveningSlotsDesc')}
                        </Text>
                      </View>
                    ) : (
                      eveningSlots.map((slot, index) => {
                        const disabledRanges = getDisabledRangesForSlotFn(eveningSlots, index);
                        
                        return (
                          <Card
                            key={`evening-${index}`}
                            style={dynamicStyles.slotItemCard}
                          >
                            <View style={dynamicStyles.slotItemHeader}>
                              <View style={dynamicStyles.slotItemTitleContainer}>
                                <Icon name="access-time" size={18} color={colors.primary} />
                                <Text style={dynamicStyles.slotItemTitle}>
                                  {t('registration.service.eveningSlot', { number: index + 1 })}
                                </Text>
                              </View>
                              {eveningSlots.length > 1 && (
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  onPress={() => onRemoveEveningSlot(index)}
                                  style={dynamicStyles.deleteButton}
                                />
                              )}
                            </View>
                            
                            <Text style={[dynamicStyles.labelHelper, { marginBottom: 8 }]}>
                              Selected {formatDisplayTimeFn(slot[0])} - {formatDisplayTimeFn(slot[1])}
                            </Text>
                            
                            {disabledRanges.length > 0 && (
                              <>
                                <Text style={[dynamicStyles.labelHelper, { color: colors.warning }]}>
                                  Warning: Gray areas are already taken
                                </Text>
                                <DisabledRangesIndicatorComponent 
                                  ranges={disabledRanges}
                                  min={12}
                                  max={20}
                                />
                              </>
                            )}
                            
                            <TimeSliderWithDisabledRanges
                              value={slot}
                              onChange={(newValue) => onEveningSlotChange(index, newValue)}
                              min={12}
                              max={20}
                              disabledRanges={disabledRanges}
                            />
                          </Card>
                        );
                      })
                    )}
                  </View>

                  {/* Summary Card */}
                  {selectedTimeSlots && (
                    <Card style={dynamicStyles.summaryCard}>
                      <Card.Content>
                        <View style={dynamicStyles.summaryHeader}>
                          <Icon name="schedule" size={20} color={colors.primary} />
                          <Text style={dynamicStyles.summaryTitle}>
                            {t('registration.service.yourSelectedSlots')}
                          </Text>
                        </View>
                        <Text style={dynamicStyles.summaryText}>
                          {selectedTimeSlots}
                        </Text>
                      </Card.Content>
                    </Card>
                  )}
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

export default ServiceDetails;