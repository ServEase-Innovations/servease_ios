// components/Registration/ServiceDetails.tsx (Fully Responsive Version)
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import TimeSlotSelector from "../common/TimeSlotSelector/TimeSlotSelector";

const { width: screenWidth } = Dimensions.get('window');

interface ServiceDetailsProps {
  formData: any;
  errors: any;
  isCookSelected: boolean;
  isNannySelected: boolean;
  morningSlots: number[][];
  eveningSlots: number[][];
  isFullTime: boolean;
  selectedTimeSlots: string;
  onServiceTypeChange: (value: string) => void;
  onCookingSpecialityChange: (value: string) => void;
  onNannyCareTypeChange: (value: string) => void;
  onDietChange: (value: string) => void;
  onExperienceChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onReferralCodeChange: (text: string) => void;
  onAgentReferralIdChange: (text: string) => void;
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
  onAgentReferralIdChange,
  formatDisplayTime,
  selectedLanguages = [],
  onLanguagesChange,
}) => {
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  const defaultFormatDisplayTime = (value: number): string => {
    const hours = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
    return `${displayHours}${displayMinutes} ${period}`;
  };

  const safeFormatDisplayTime = formatDisplayTime || defaultFormatDisplayTime;
  
  const availableLanguages = [
    "Assamese", "Bengali", "Gujarati", "Hindi", "Kannada",
    "Kashmiri", "Marathi", "Malayalam", "Oriya", "Punjabi",
    "Sanskrit", "Tamil", "Telugu", "Urdu", "Sindhi",
    "Konkani", "Nepali", "Manipuri", "Bodo", "Dogri",
    "Maithili", "Santhali", "English"
  ];

  const mergeTimeSlots = (
    slots: number[][],
    format: (value: number) => string
  ): string => {
    if (!slots.length) return "";

    const sorted = [...slots].sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [];

    for (const slot of sorted) {
      if (merged.length === 0) {
        merged.push([slot[0], slot[1]]);
      } else {
        const last = merged[merged.length - 1];
        if (slot[0] <= last[1]) {
          last[1] = Math.max(last[1], slot[1]);
        } else {
          merged.push([slot[0], slot[1]]);
        }
      }
    }

    return merged
      .map(([start, end]) => `${format(start)} - ${format(end)}`)
      .join(", ");
  };

  const mergedTimeSlotsString = useMemo(() => {
    const allSlots = [...morningSlots, ...eveningSlots];
    return mergeTimeSlots(allSlots, safeFormatDisplayTime);
  }, [morningSlots, eveningSlots, safeFormatDisplayTime]);

  const serviceTypes = [
    { value: "COOK", label: "Cook", icon: "restaurant" },
    { value: "NANNY", label: "Nanny", icon: "child-care" },
    { value: "MAID", label: "Maid", icon: "cleaning-services" },
  ];

  const dietOptions = [
    { value: "VEG", label: "Veg" },
    { value: "NONVEG", label: "Non-Veg" },
    { value: "BOTH", label: "Both" },
  ];

  const nannyCareOptions = [
    { value: "BABY_CARE", label: "Baby Care" },
    { value: "ELDERLY_CARE", label: "Elderly Care" },
    { value: "BOTH", label: "Both" },
  ];

  const handleLanguageSelect = (language: string) => {
    if (selectedLanguages.includes(language)) {
      const newLanguages = selectedLanguages.filter(l => l !== language);
      if (onLanguagesChange) onLanguagesChange(newLanguages);
    } else {
      if (onLanguagesChange) onLanguagesChange([...selectedLanguages, language]);
    }
  };

  const ServiceTypeCard = ({ service, isSelected, onPress }: any) => (
    <TouchableOpacity
      style={[
        styles.serviceCard,
        isSelected && styles.serviceCardSelected
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Icon name={service.icon} size={24} color={isSelected ? "#1976d2" : "#666"} />
      <Text style={[
        styles.serviceCardText,
        isSelected && styles.serviceCardTextSelected
      ]}>
        {service.label}
      </Text>
      {isSelected && (
        <Icon name="check-circle" size={18} color="#1976d2" style={styles.checkIcon} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Service Type Selection */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Service Type *</Text>
        <View style={styles.serviceTypesContainer}>
          {serviceTypes.map((service) => (
            <ServiceTypeCard
              key={service.value}
              service={service}
              isSelected={formData.housekeepingRole?.includes(service.value)}
              onPress={() => onServiceTypeChange(service.value)}
            />
          ))}
        </View>
        {errors.housekeepingRole && (
          <Text style={styles.errorText}>{errors.housekeepingRole}</Text>
        )}
      </View>

      {/* Cooking Speciality */}
      {isCookSelected && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cooking Speciality *</Text>
          <View style={styles.optionsContainer}>
            {dietOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  formData.cookingSpeciality === option.value && styles.optionButtonSelected
                ]}
                onPress={() => onCookingSpecialityChange(option.value)}
              >
                <Text style={[
                  styles.optionButtonText,
                  formData.cookingSpeciality === option.value && styles.optionButtonTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.cookingSpeciality && (
            <Text style={styles.errorText}>{errors.cookingSpeciality}</Text>
          )}
        </View>
      )}

      {/* Nanny Care Type */}
      {isNannySelected && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Care Type *</Text>
          <View style={styles.optionsContainer}>
            {nannyCareOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  formData.nannyCareType === option.value && styles.optionButtonSelected
                ]}
                onPress={() => onNannyCareTypeChange(option.value)}
              >
                <Text style={[
                  styles.optionButtonText,
                  formData.nannyCareType === option.value && styles.optionButtonTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.nannyCareType && (
            <Text style={styles.errorText}>{errors.nannyCareType}</Text>
          )}
        </View>
      )}

      {/* Diet Preference */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Diet Preference *</Text>
        <View style={styles.optionsContainer}>
          {dietOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                formData.diet === option.value && styles.optionButtonSelected
              ]}
              onPress={() => onDietChange(option.value)}
            >
              <Text style={[
                styles.optionButtonText,
                formData.diet === option.value && styles.optionButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.diet && (
          <Text style={styles.errorText}>{errors.diet}</Text>
        )}
      </View>

      {/* Description */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Tell us about your skills and experience..."
          placeholderTextColor="#999"
          value={formData.description}
          onChangeText={onDescriptionChange}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      {/* Languages */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Languages Spoken</Text>
        
        <TouchableOpacity
          style={styles.languageSelector}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Text style={styles.languageSelectorText}>
            {selectedLanguages.length > 0 
              ? `${selectedLanguages.length} language${selectedLanguages.length > 1 ? 's' : ''} selected`
              : "Select languages you speak"}
          </Text>
          <Icon name="arrow-drop-down" size={24} color="#666" />
        </TouchableOpacity>

        {selectedLanguages.length > 0 && (
          <View style={styles.languageChipsContainer}>
            {selectedLanguages.map((language, index) => (
              <TouchableOpacity
                key={index}
                style={styles.languageChip}
                onPress={() => handleLanguageSelect(language)}
              >
                <Text style={styles.languageChipText}>{language}</Text>
                <Icon name="close" size={14} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Modal
          visible={languageModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Languages</Text>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={availableLanguages}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.languageItem,
                      selectedLanguages.includes(item) && styles.languageItemSelected
                    ]}
                    onPress={() => handleLanguageSelect(item)}
                  >
                    <Text style={[
                      styles.languageItemText,
                      selectedLanguages.includes(item) && styles.languageItemTextSelected
                    ]}>
                      {item}
                    </Text>
                    {selectedLanguages.includes(item) && (
                      <Icon name="check" size={20} color="#1976d2" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>

      {/* Experience and Referral Row */}
      <View style={styles.rowContainer}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.sectionTitle}>Experience (years)</Text>
          <TextInput
            style={styles.input}
            placeholder="Years"
            placeholderTextColor="#999"
            value={formData.experience}
            onChangeText={onExperienceChange}
            keyboardType="numeric"
          />
          {errors.experience && (
            <Text style={styles.errorText}>{errors.experience}</Text>
          )}
        </View>

        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.sectionTitle}>Referral Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter code"
            placeholderTextColor="#999"
            value={formData.referralCode || ""}
            onChangeText={onReferralCodeChange}
          />
        </View>
      </View>

      {/* Agent Referral ID */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Agent Referral ID (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter agent referral ID"
          placeholderTextColor="#999"
          value={formData.agentReferralId || ""}
          onChangeText={onAgentReferralIdChange}
        />
      </View>

      {/* Time Slots Section - REDUCED PADDING FOR MORE SPACE */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Available Time Slots</Text>

        {/* Full Time Switch */}
        <View style={styles.switchContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Full Time Availability</Text>
            <Switch
              value={isFullTime}
              onValueChange={onFullTimeToggle}
              trackColor={{ false: "#767577", true: "#1976d2" }}
              thumbColor={isFullTime ? "#fff" : "#f4f3f4"}
            />
          </View>
          <Text style={styles.switchHelper}>Enable if you're available for full-time work</Text>
        </View>

        {!isFullTime && (
          <>
            {/* Morning Slots - COMPACT BUT READABLE */}
            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotTitle}>Morning Availability</Text>
              <TimeSlotSelector
                title=""
                slots={morningSlots}
                minTime={6}
                maxTime={12}
                marks={[
                  { value: 6, label: "6" },
                  { value: 8, label: "8" },
                  { value: 10, label: "10" },
                  { value: 12, label: "12" },
                ]}
                notAvailableMessage="Not available in mornings"
                addSlotMessage="+ Add Morning Slot"
                slotLabel="Slot"
                clearButtonLabel="Clear All"
                duplicateErrorKey="Duplicate time slot"
                onAddSlot={onAddMorningSlot}
                onRemoveSlot={onRemoveMorningSlot}
                onClearSlots={onClearMorningSlots}
                onSlotChange={onMorningSlotChange}
                formatDisplayTime={safeFormatDisplayTime}
              />
            </View>

            {/* Evening Slots - COMPACT BUT READABLE */}
            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotTitle}>Evening Availability</Text>
              <TimeSlotSelector
                title=""
                slots={eveningSlots}
                minTime={12}
                maxTime={20}
                marks={[
                  { value: 12, label: "12" },
                  { value: 14, label: "14" },
                  { value: 16, label: "16" },
                  { value: 18, label: "18" },
                  { value: 20, label: "20" },
                ]}
                notAvailableMessage="Not available in evenings"
                addSlotMessage="+ Add Evening Slot"
                slotLabel="Slot"
                clearButtonLabel="Clear All"
                duplicateErrorKey="Duplicate time slot"
                onAddSlot={onAddEveningSlot}
                onRemoveSlot={onRemoveEveningSlot}
                onClearSlots={onClearEveningSlots}
                onSlotChange={onEveningSlotChange}
                formatDisplayTime={safeFormatDisplayTime}
              />
            </View>
          </>
        )}

        {/* Summary */}
        {!isFullTime && mergedTimeSlotsString && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Selected Time Slots:</Text>
            <Text style={styles.summaryValue}>{mergedTimeSlotsString}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  serviceTypesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    position: 'relative',
  },
  serviceCardSelected: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  serviceCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  serviceCardTextSelected: {
    color: '#1976d2',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  optionButtonTextSelected: {
    color: '#1976d2',
    fontWeight: '600',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 6,
  },
  rowContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
  },
  halfCard: {
    flex: 1,
    marginHorizontal: 0,
  },
  languageSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  languageSelectorText: {
    fontSize: 14,
    color: '#666',
  },
  languageChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  languageChipText: {
    fontSize: 12,
    color: '#1976d2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  languageItemText: {
    fontSize: 16,
    color: '#333',
  },
  languageItemTextSelected: {
    color: '#1976d2',
    fontWeight: '500',
  },
  switchContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  switchHelper: {
    fontSize: 12,
    color: '#999',
  },
  timeSlotSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  timeSlotTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  summaryBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 13,
    color: '#1976d2',
  },
});

export default ServiceDetails;