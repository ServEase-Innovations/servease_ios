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
  onFullTimeToggle: (checked: boolean) => void;
  onAddMorningSlot: () => void;
  onRemoveMorningSlot: (index: number) => void;
  onClearMorningSlots: () => void;
  onAddEveningSlot: () => void;
  onRemoveEveningSlot: (index: number) => void;
  onClearEveningSlots: () => void;
  onMorningSlotChange: (index: number, newValue: number[]) => void;
  onEveningSlotChange: (index: number, newValue: number[]) => void;
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
          <Text style={dynamicStyles.timeLabelSmall}>Start</Text>
          <Text style={dynamicStyles.timeLabelValue}>{formatTime(value[0])}</Text>
        </View>
        <View style={dynamicStyles.timeLabelBox}>
          <Text style={dynamicStyles.timeLabelSmall}>End</Text>
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
        <Text style={dynamicStyles.sliderLabel}>Start Time</Text>
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
        <Text style={dynamicStyles.sliderLabel}>End Time</Text>
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
}

const DisabledRangesLegend: React.FC<DisabledRangesLegendProps> = ({ ranges }) => {
  const { colors, fontSize } = useTheme();
  
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
      <Text style={dynamicStyles.legendTitle}>Time slots already taken:</Text>
      {ranges.map((range, index) => (
        <View key={index} style={dynamicStyles.legendItem}>
          <View style={dynamicStyles.legendColorBox} />
          <Text style={dynamicStyles.legendText}>{formatTimeRange(range)}</Text>
        </View>
      ))}
    </View>
  );
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
  onFullTimeToggle,
  onAddMorningSlot,
  onRemoveMorningSlot,
  onClearMorningSlots,
  onAddEveningSlot,
  onRemoveEveningSlot,
  onClearEveningSlots,
  onMorningSlotChange,
  onEveningSlotChange,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();

  const serviceTypes = [
    { value: "COOK", label: "Cook", icon: "restaurant", description: "Prepare meals for the household" },
    { value: "NANNY", label: "Nanny", icon: "child-care", description: "Care for children or elderly" },
    { value: "MAID", label: "Maid", icon: "cleaning-services", description: "Household cleaning and maintenance" },
  ];

  const dietOptions = [
    { value: "VEG", label: "Veg", icon: "leaf", description: "Only vegetarian cooking" },
    { value: "NONVEG", label: "Non-Veg", icon: "restaurant-menu", description: "Can cook non-vegetarian food" },
    { value: "BOTH", label: "Both", icon: "restaurant", description: "Can cook both veg and non-veg" },
  ];

  const cookingSpecialityOptions = [
    { value: "VEG", label: "Veg", icon: "leaf", description: "Specialize in vegetarian cuisine" },
    { value: "NONVEG", label: "Non-Veg", icon: "restaurant-menu", description: "Specialize in non-vegetarian cuisine" },
    { value: "BOTH", label: "Both", icon: "restaurant", description: "Can cook all types of cuisine" },
  ];

  const nannyCareOptions = [
    { value: "BABY_CARE", label: "Baby Care", icon: "child-care", description: "Care for infants and toddlers" },
    { value: "ELDERLY_CARE", label: "Elderly Care", icon: "elderly", description: "Care for senior citizens" },
    { value: "BOTH", label: "Both", icon: "favorite", description: "Can care for both babies and elderly" },
  ];

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
  });

  const getDisabledRangesForSlot = (slots: number[][], currentIndex: number): number[][] => {
    return slots.filter((_, index) => index !== currentIndex);
  };

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

  return (
    <ScrollView style={dynamicStyles.container}>
      <View style={dynamicStyles.spacing}>
        {/* Combined Services Card */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.headerContainer}>
              <Icon name="home" size={24} color={colors.primary} />
              <Text style={dynamicStyles.headerTitle}>Service Details</Text>
            </View>
            
            <View style={dynamicStyles.sectionSpacing}>
              {/* Service Type Selection */}
              <View>
                <View style={dynamicStyles.labelContainer}>
                  <Icon name="work" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.label}>
                    Select Service Type(s) <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>
                  Choose the type of services you want to offer
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

              {/* Diet Section - Always visible */}
              <View style={dynamicStyles.subSection}>
                <View style={dynamicStyles.labelContainer}>
                  <Icon name="restaurant" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.label}>
                    Diet Preference <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>
                  What type of food can you cook?
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
                          {option.label}
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

              {/* Cooking Speciality - Only show when Cook is selected */}
              {isCookSelected && (
                <View style={dynamicStyles.subSection}>
                  <View style={dynamicStyles.labelContainer}>
                    <Icon name="restaurant" size={20} color={colors.primary} />
                    <Text style={dynamicStyles.label}>
                      Cooking Speciality <Text style={dynamicStyles.asterisk}>*</Text>
                    </Text>
                  </View>
                  <Text style={dynamicStyles.labelHelper}>
                    Select your area of expertise in cooking
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
                      Care Type <Text style={dynamicStyles.asterisk}>*</Text>
                    </Text>
                  </View>
                  <Text style={dynamicStyles.labelHelper}>
                    What type of care services do you provide?
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
            </View>
          </Card.Content>
        </Card>
      
        {/* Description Section */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.labelContainer}>
              <Icon name="description" size={20} color={colors.primary} />
              <Text style={dynamicStyles.label}>Description</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              Describe your experience, skills, and why you'd be a great service provider
            </Text>
            <TextInput
              style={dynamicStyles.textArea}
              placeholder="e.g., 5 years of experience in household management, specialized in..."
              placeholderTextColor={colors.placeholder}
              value={formData.description}
              onChangeText={(text) => onDescriptionChange({ target: { value: text } })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
                    Experience <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>Years of experience</Text>
                <TextInput
                  style={[dynamicStyles.input, errors.experience && dynamicStyles.inputError]}
                  placeholder="e.g., 3"
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
                  <Text style={dynamicStyles.label}>Referral Code (Optional)</Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>If someone referred you</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="e.g., REF123"
                  placeholderTextColor={colors.placeholder}
                  value={formData.referralCode || ""}
                  onChangeText={(text) => onReferralCodeChange({ target: { value: text } })}
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      
        {/* Time slot section */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.headerContainer}>
              <Icon name="access-time" size={24} color={colors.primary} />
              <Text style={dynamicStyles.headerTitle}>Select Your Available Time Slots</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              Choose when you are available to work (6:00 AM to 8:00 PM)
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
                    <Text style={dynamicStyles.fullTimeTitle}>Full Time Availability</Text>
                    <Text style={dynamicStyles.fullTimeSubtitle}>6:00 AM - 8:00 PM (All slots covered)</Text>
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
                        <Text style={dynamicStyles.slotTitle}>Morning Availability (6 AM - 12 PM)</Text>
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
                            Add Morning Slots
                          </Button>
                        ) : (
                          <View style={dynamicStyles.slotActionsInner}>
                            <Chip
                              style={dynamicStyles.slotChip}
                              textStyle={dynamicStyles.slotChipText}
                            >
                              {morningSlots.length} slot(s)
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
                          No morning slots selected
                        </Text>
                        <Text style={dynamicStyles.emptySlotSubtitle}>
                          Click "Add Morning Slots" to set your morning availability
                        </Text>
                      </View>
                    ) : (
                      morningSlots.map((slot, index) => {
                        const disabledRanges = getDisabledRangesForSlot(morningSlots, index);
                        
                        return (
                          <Card
                            key={`morning-${index}`}
                            style={dynamicStyles.slotItemCard}
                          >
                            <View style={dynamicStyles.slotItemHeader}>
                              <View style={dynamicStyles.slotItemTitleContainer}>
                                <Icon name="access-time" size={18} color={colors.primary} />
                                <Text style={dynamicStyles.slotItemTitle}>
                                  Morning Slot {index + 1}
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
                            
                            {disabledRanges.length > 0 && (
                              <DisabledRangesLegend ranges={disabledRanges} />
                            )}
                            
                            <TimeSlider
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
                        <Text style={dynamicStyles.slotTitle}>Evening Availability (12 PM - 8 PM)</Text>
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
                            Add Evening Slots
                          </Button>
                        ) : (
                          <View style={dynamicStyles.slotActionsInner}>
                            <Chip
                              style={dynamicStyles.slotChip}
                              textStyle={dynamicStyles.slotChipText}
                            >
                              {eveningSlots.length} slot(s)
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
                          No evening slots selected
                        </Text>
                        <Text style={dynamicStyles.emptySlotSubtitle}>
                          Click "Add Evening Slots" to set your evening availability
                        </Text>
                      </View>
                    ) : (
                      eveningSlots.map((slot, index) => {
                        const disabledRanges = getDisabledRangesForSlot(eveningSlots, index);
                        
                        return (
                          <Card
                            key={`evening-${index}`}
                            style={dynamicStyles.slotItemCard}
                          >
                            <View style={dynamicStyles.slotItemHeader}>
                              <View style={dynamicStyles.slotItemTitleContainer}>
                                <Icon name="access-time" size={18} color={colors.primary} />
                                <Text style={dynamicStyles.slotItemTitle}>
                                  Evening Slot {index + 1}
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
                            
                            {disabledRanges.length > 0 && (
                              <DisabledRangesLegend ranges={disabledRanges} />
                            )}
                            
                            <TimeSlider
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
                            Your Selected Time Slots:
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