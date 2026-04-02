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
  Checkbox,
  Chip,
  Card,
  IconButton,
  Button,
  HelperText,
} from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from "../../src/Settings/ThemeContext";
import TimeSlotSelector from "../common/TimeSlotSelector/TimeSlotSelector";

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
  onAgentReferralIdChange: (e: any) => void;
  onFullTimeToggle: (checked: boolean) => void;
  onAddMorningSlot: () => void;
  onRemoveMorningSlot: (index: number) => void;
  onClearMorningSlots: () => void;
  onAddEveningSlot: () => void;
  onRemoveEveningSlot: (index: number) => void;
  onClearEveningSlots: () => void;
  onMorningSlotChange: (index: number, newValue: number[]) => void;
  onEveningSlotChange: (index: number, newValue: number[]) => void;
  formatDisplayTime?: (value: number) => string;
  selectedLanguages?: string[];
  onLanguagesChange?: (languages: string[]) => void;
}

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
  onAgentReferralIdChange,
  onFullTimeToggle,
  onAddMorningSlot,
  onRemoveMorningSlot,
  onClearMorningSlots,
  onAddEveningSlot,
  onRemoveEveningSlot,
  onClearEveningSlots,
  onMorningSlotChange,
  onEveningSlotChange,
  formatDisplayTime: formatDisplayTimeFn = formatDisplayTime,
  selectedLanguages = [],
  onLanguagesChange,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();

  // Language selection - 20+ Indian languages
  const [availableLanguages] = useState<string[]>([
    "Hindi",
    "Bengali", 
    "Telugu",
    "Marathi",
    "Tamil",
    "Urdu",
    "Gujarati",
    "Kannada",
    "Malayalam",
    "Odia",
    "Punjabi",
    "Assamese",
    "Maithili",
    "Santali",
    "Kashmiri",
    "Nepali",
    "Sindhi",
    "Konkani",
    "Dogri",
    "Manipuri",
    "Bodo",
    "Sanskrit"
  ]);

  // Search state for languages
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Filter languages based on search query
  const filteredLanguages = availableLanguages.filter(lang =>
    lang.toLowerCase().includes(languageSearchQuery.toLowerCase())
  );

  // Handler for language changes
  const handleLanguageChange = (language: string) => {
    if (onLanguagesChange) {
      if (selectedLanguages.includes(language)) {
        onLanguagesChange(selectedLanguages.filter(l => l !== language));
      } else {
        onLanguagesChange([...selectedLanguages, language]);
      }
    }
  };

  const serviceTypes = [
    { value: "COOK", label: "Cook", icon: "restaurant", description: "Professional cooking services" },
    { value: "NANNY", label: "Nanny", icon: "child-care", description: "Child care services" },
    { value: "MAID", label: "Maid", icon: "cleaning-services", description: "Household cleaning services" },
  ];

  const dietOptions = [
    { value: "VEG", label: "Vegetarian", icon: "leaf", description: "Only vegetarian food" },
    { value: "NONVEG", label: "Non-Vegetarian", icon: "restaurant-menu", description: "Includes meat dishes" },
    { value: "BOTH", label: "Both", icon: "restaurant", description: "Both vegetarian and non-vegetarian" },
  ];

  const cookingSpecialityOptions = [
    { value: "VEG", label: "Vegetarian", icon: "leaf", description: "Specialize in vegetarian cuisine" },
    { value: "NONVEG", label: "Non-Vegetarian", icon: "restaurant-menu", description: "Specialize in non-vegetarian cuisine" },
    { value: "BOTH", label: "Both", icon: "restaurant", description: "Expertise in both cuisines" },
  ];

  const nannyCareOptions = [
    { value: "BABY_CARE", label: "Baby Care", icon: "child-care", description: "Infant and toddler care" },
    { value: "ELDERLY_CARE", label: "Elderly Care", icon: "elderly", description: "Senior citizen care" },
    { value: "BOTH", label: "Both", icon: "favorite", description: "Both baby and elderly care" },
  ];

  const getDietLabel = (option: string) => {
    switch(option) {
      case "VEG": return "Vegetarian";
      case "NONVEG": return "Non-Vegetarian";
      case "BOTH": return "Both";
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
      elevation: 2,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
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
      width: 40,
      height: 40,
      borderRadius: 20,
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
    languageSection: {
      marginTop: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: fontSizes.input,
      color: colors.text,
    },
    languageDropdown: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    languageOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageOptionSelected: {
      backgroundColor: isDarkMode ? colors.primary + '20' : '#e3f2fd',
    },
    languageOptionContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    languageOptionText: {
      fontSize: fontSizes.optionText,
      color: colors.text,
    },
    languageOptionTextSelected: {
      color: colors.primary,
      fontWeight: '500',
    },
    noResultsContainer: {
      padding: 20,
      alignItems: 'center',
    },
    noResultsText: {
      fontSize: fontSizes.labelHelper,
      color: colors.textSecondary,
    },
    showAllButton: {
      marginTop: 12,
      paddingVertical: 10,
      alignItems: 'center',
    },
    showAllButtonText: {
      fontSize: fontSizes.labelHelper,
      fontWeight: '500',
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
      color: colors.text,
      lineHeight: 20,
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

  // Define marks for time sliders
  const morningMarks = [
    { value: 6, label: '6 AM' },
    { value: 7, label: '7 AM' },
    { value: 8, label: '8 AM' },
    { value: 9, label: '9 AM' },
    { value: 10, label: '10 AM' },
    { value: 11, label: '11 AM' },
    { value: 12, label: '12 PM' },
  ];

  const eveningMarks = [
    { value: 12, label: '12 PM' },
    { value: 13, label: '1 PM' },
    { value: 14, label: '2 PM' },
    { value: 15, label: '3 PM' },
    { value: 16, label: '4 PM' },
    { value: 17, label: '5 PM' },
    { value: 18, label: '6 PM' },
    { value: 19, label: '7 PM' },
    { value: 20, label: '8 PM' },
  ];

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
                    Select Service Type <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>
                  Choose the type of service you provide
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
                          name={service.icon} 
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
                      Cooking Speciality <Text style={dynamicStyles.asterisk}>*</Text>
                    </Text>
                  </View>
                  <Text style={dynamicStyles.labelHelper}>
                    What type of cuisine do you specialize in?
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
                    What type of care do you provide?
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
                    Diet Preference <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>
                  What type of food do you prefer to cook?
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
              <Text style={dynamicStyles.label}>Description</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              Tell us more about your experience and skills
            </Text>
            <TextInput
              style={dynamicStyles.textArea}
              placeholder="Describe your experience, skills, and what makes you unique..."
              placeholderTextColor={colors.placeholder}
              value={formData.description}
              onChangeText={(text) => onDescriptionChange({ target: { value: text } })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card.Content>
        </Card>

        {/* Languages Section - 20+ Indian Languages with Search */}
        <Card style={dynamicStyles.card}>
          <Card.Content>
            <View style={dynamicStyles.labelContainer}>
              <Icon name="language" size={20} color={colors.primary} />
              <Text style={dynamicStyles.label}>Languages Spoken</Text>
            </View>
            <Text style={dynamicStyles.labelHelper}>
              Select the languages you speak (you can select multiple)
            </Text>
            
            <View style={dynamicStyles.languageSection}>
              {/* Search Input */}
              <View style={dynamicStyles.searchContainer}>
                <Icon name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={dynamicStyles.searchInput}
                  placeholder="Search languages..."
                  placeholderTextColor={colors.placeholder}
                  value={languageSearchQuery}
                  onChangeText={setLanguageSearchQuery}
                  onFocus={() => setShowLanguageDropdown(true)}
                />
                {languageSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setLanguageSearchQuery("")}>
                    <Icon name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected Languages Summary */}
              {selectedLanguages.length > 0 && (
                <View style={[dynamicStyles.summaryCard, { marginTop: 12, padding: 12 }]}>
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

              {/* Language Options Dropdown */}
              {(showLanguageDropdown || languageSearchQuery.length > 0) && (
                <View style={dynamicStyles.languageDropdown}>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredLanguages.length > 0 ? (
                      filteredLanguages.map((language) => (
                        <TouchableOpacity
                          key={language}
                          style={[
                            dynamicStyles.languageOption,
                            selectedLanguages.includes(language) && dynamicStyles.languageOptionSelected
                          ]}
                          onPress={() => {
                            handleLanguageChange(language);
                            // Keep dropdown open to allow multiple selections
                          }}
                        >
                          <View style={dynamicStyles.languageOptionContent}>
                            <Text 
                              style={[
                                dynamicStyles.languageOptionText,
                                selectedLanguages.includes(language) && dynamicStyles.languageOptionTextSelected
                              ]}
                            >
                              {language}
                            </Text>
                            {selectedLanguages.includes(language) && (
                              <Icon name="check" size={18} color={colors.primary} />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={dynamicStyles.noResultsContainer}>
                        <Text style={dynamicStyles.noResultsText}>No languages found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Show All Languages Button (when dropdown is closed and no search) */}
              {!showLanguageDropdown && languageSearchQuery.length === 0 && selectedLanguages.length < availableLanguages.length && (
                <TouchableOpacity 
                  style={dynamicStyles.showAllButton}
                  onPress={() => setShowLanguageDropdown(true)}
                >
                  <Text style={[dynamicStyles.showAllButtonText, { color: colors.primary }]}>
                    + Browse all {availableLanguages.length} languages
                  </Text>
                </TouchableOpacity>
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
                    Years of Experience <Text style={dynamicStyles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>How many years of experience do you have?</Text>
                <TextInput
                  style={[dynamicStyles.input, errors.experience && dynamicStyles.inputError]}
                  placeholder="e.g., 5"
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
                  <Text style={dynamicStyles.label}>Referral Code</Text>
                </View>
                <Text style={dynamicStyles.labelHelper}>Enter referral code if you have one</Text>
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Enter referral code"
                  placeholderTextColor={colors.placeholder}
                  value={formData.referralCode || ""}
                  onChangeText={(text) => onReferralCodeChange({ target: { value: text } })}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Agent Referral ID */}
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
                    <TimeSlotSelector
                      title="Morning Slots"
                      slots={morningSlots}
                      minTime={6}
                      maxTime={12}
                      marks={morningMarks}
                      notAvailableMessage="No morning slots added"
                      addSlotMessage="Click + Add Morning Slots to add your available time slots"
                      slotLabel="Morning Slot"
                      addButtonLabel="+ Add Morning Slots"
                      clearButtonLabel="Clear All"
                      duplicateErrorKey="This time slot already exists. Please select a different time range."
                      onAddSlot={onAddMorningSlot}
                      onRemoveSlot={onRemoveMorningSlot}
                      onClearSlots={onClearMorningSlots}
                      onSlotChange={onMorningSlotChange}
                      formatDisplayTime={formatDisplayTimeFn}
                    />
                  </View>

                  {/* Evening Slots Section */}
                  <View style={dynamicStyles.slotSection}>
                    <TimeSlotSelector
                      title="Evening Slots"
                      slots={eveningSlots}
                      minTime={12}
                      maxTime={20}
                      marks={eveningMarks}
                      notAvailableMessage="No evening slots added"
                      addSlotMessage="Click + Add Evening Slots to add your available time slots"
                      slotLabel="Evening Slot"
                      addButtonLabel="+ Add Evening Slots"
                      clearButtonLabel="Clear All"
                      duplicateErrorKey="This time slot already exists. Please select a different time range."
                      onAddSlot={onAddEveningSlot}
                      onRemoveSlot={onRemoveEveningSlot}
                      onClearSlots={onClearEveningSlots}
                      onSlotChange={onEveningSlotChange}
                      formatDisplayTime={formatDisplayTimeFn}
                    />
                  </View>

                  {/* Summary Card */}
                  {selectedTimeSlots && (
                    <Card style={dynamicStyles.summaryCard}>
                      <Card.Content>
                        <View style={dynamicStyles.summaryHeader}>
                          <Icon name="schedule" size={20} color={colors.primary} />
                          <Text style={dynamicStyles.summaryTitle}>
                            Your Selected Time Slots
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