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
  TimeSliderWithDisabledRanges: React.FC<any>;
  DisabledRangesIndicator: React.FC<any>;
  getDisabledRangesForSlot: (slots: number[][], currentIndex: number) => number[][];
  formatDisplayTime: (value: number) => string;
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
  TimeSliderWithDisabledRanges,
  DisabledRangesIndicator,
  getDisabledRangesForSlot,
  formatDisplayTime,
}) => {
  const serviceTypes = [
    { value: "COOK", label: "Cook" },
    { value: "NANNY", label: "Nanny"},
    { value: "MAID", label: "Maid" },
  ];

  const dietOptions = ["VEG", "NONVEG", "BOTH"];
  const nannyCareOptions = [
    { value: "BABY_CARE", label: "Baby Care" },
    { value: "ELDERLY_CARE", label: "Elderly Care" },
    { value: "BOTH", label: "Both" },
  ];

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
    <ScrollView style={styles.container}>
      <View style={styles.spacing}>
        {/* Combined Services Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerContainer}>
              <Icon name="home" size={24} color="#1976d2" />
              <Text style={styles.headerTitle}>Service Details</Text>
            </View>
            
            <View style={styles.sectionSpacing}>
              {/* Service Type Selection */}
              <View>
                <Text style={styles.label}>
                  Select Service Type(s) <Text style={styles.asterisk}>*</Text>
                </Text>
                
                <View style={styles.optionsContainer}>
                  {serviceTypes.map((service) => (
                    <TouchableOpacity
                      key={service.value}
                      style={[
                        styles.optionCard,
                        formData.housekeepingRole.includes(service.value) && styles.selectedOption,
                      ]}
                      onPress={() => handleServiceTypePress(service.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.housekeepingRole.includes(service.value) && styles.selectedOptionText,
                        ]}
                      >
                        {service.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {errors.housekeepingRole && (
                  <View style={styles.errorAlert}>
                    <Text style={styles.errorText}>{errors.housekeepingRole}</Text>
                  </View>
                )}
              </View>

              {/* Cooking Speciality - Only show when Cook is selected */}
              {isCookSelected && (
                <View style={styles.subSection}>
                  <Text style={styles.label}>
                    Cooking Speciality <Text style={styles.asterisk}>*</Text>
                  </Text>
                  
                  <View style={styles.optionsContainer}>
                    {['VEG', 'NONVEG', 'BOTH'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionCard,
                          formData.cookingSpeciality === option && styles.selectedOption,
                        ]}
                        onPress={() => handleCookingSpecialityPress(option)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            formData.cookingSpeciality === option && styles.selectedOptionText,
                          ]}
                        >
                          {option === 'VEG' ? 'Veg' : 
                           option === 'NONVEG' ? 'Non-Veg' : 
                           'Both'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {errors.cookingSpeciality && (
                    <HelperText type="error" visible={!!errors.cookingSpeciality}>
                      {errors.cookingSpeciality}
                    </HelperText>
                  )}
                </View>
              )}

              {/* Nanny Care Type */}
              {isNannySelected && (
                <View style={styles.subSection}>
                  <Text style={styles.label}>
                    Care Type <Text style={styles.asterisk}>*</Text>
                  </Text>
                  
                  <View style={styles.optionsContainer}>
                    {nannyCareOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionCard,
                          formData.nannyCareType === option.value && styles.selectedOption,
                        ]}
                        onPress={() => handleNannyCareTypePress(option)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            formData.nannyCareType === option.value && styles.selectedOptionText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {errors.nannyCareType && (
                    <HelperText type="error" visible={!!errors.nannyCareType}>
                      {errors.nannyCareType}
                    </HelperText>
                  )}
                </View>
              )}

              {/* Diet Section */}
              <View style={styles.subSection}>
                <Text style={styles.label}>
                  Diet Preference <Text style={styles.asterisk}>*</Text>
                </Text>
                
                <View style={styles.optionsContainer}>
                  {dietOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.optionCard,
                        formData.diet === option && styles.selectedOption,
                      ]}
                      onPress={() => handleDietPress(option)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          formData.diet === option && styles.selectedOptionText,
                        ]}
                      >
                        {option === 'VEG' ? 'Veg' : 
                         option === 'NONVEG' ? 'Non-Veg' : 
                         'Both'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {errors.diet && (
                  <HelperText type="error" visible={!!errors.diet}>
                    {errors.diet}
                  </HelperText>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textArea}
          placeholder="Description"
          value={formData.description}
          onChangeText={(text) => onDescriptionChange({ target: { value: text } })}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.rowContainer}>
        <View style={styles.halfWidth}>
          <TextInput
            style={[styles.input, errors.experience && styles.inputError]}
            placeholder="Experience *"
            value={formData.experience}
            onChangeText={(text) => onExperienceChange({ target: { value: text } })}
          />
          {errors.experience && (
            <HelperText type="error" visible={!!errors.experience}>
              {errors.experience}
            </HelperText>
          )}
          {!errors.experience && (
            <Text style={styles.helperText}>Years in business or relevant experience</Text>
          )}
        </View>
        
        <View style={styles.halfWidth}>
          <TextInput
            style={styles.input}
            placeholder="Referral Code (Optional)"
            value={formData.referralCode || ""}
            onChangeText={(text) => onReferralCodeChange({ target: { value: text } })}
          />
        </View>
      </View>
      
      {/* Time slot section */}
      <View style={styles.spacing}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Select Your Available Time Slots</Text>
            
            <View>
              <TouchableOpacity
                style={[styles.fullTimeCard, isFullTime && styles.fullTimeSelected]}
                onPress={() => onFullTimeToggle(!isFullTime)}
              >
                <View style={styles.checkboxContainer}>
                  <Checkbox
                    status={isFullTime ? 'checked' : 'unchecked'}
                    onPress={() => onFullTimeToggle(!isFullTime)}
                    color="#1976d2"
                  />
                  <View style={styles.fullTimeTextContainer}>
                    <Text style={styles.fullTimeTitle}>Full Time Availability</Text>
                    <Text style={styles.fullTimeSubtitle}>6:00 AM - 8:00 PM (All slots covered)</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {!isFullTime && (
                <View>
                  {/* Morning Slots Section */}
                  <View style={styles.slotSection}>
                    <View style={styles.slotHeader}>
                      <View style={styles.slotTitleContainer}>
                        <Icon name="access-time" size={20} color="#1976d2" />
                        <Text style={styles.slotTitle}>Morning Availability</Text>
                        <Chip
                          style={styles.slotChip}
                          textStyle={styles.slotChipText}
                        >
                          {morningSlots.length === 0 ? "Not Available" : `${morningSlots.length} slot(s)`}
                        </Chip>
                      </View>
                      <View style={styles.slotActions}>
                        {morningSlots.length > 0 && morningSlots.length < 12 && (
                          <Button
                            mode="outlined"
                            onPress={onAddMorningSlot}
                            style={styles.slotButton}
                            labelStyle={styles.slotButtonLabel}
                          >
                            Add Slot
                          </Button>
                        )}
                        {morningSlots.length === 0 ? (
                          <Button
                            mode="contained"
                            onPress={onAddMorningSlot}
                            style={styles.slotButton}
                            labelStyle={styles.slotButtonLabel}
                          >
                            Add Slots
                          </Button>
                        ) : (
                          <Button
                            mode="outlined"
                            onPress={onClearMorningSlots}
                            style={[styles.slotButton, styles.errorButton]}
                            labelStyle={[styles.slotButtonLabel, styles.errorButtonText]}
                          >
                            Clear All
                          </Button>
                        )}
                      </View>
                    </View>

                    {morningSlots.length === 0 ? (
                      <View style={styles.emptySlotCard}>
                        <Text style={styles.emptySlotTitle}>
                          Not available in the morning
                        </Text>
                        <Text style={styles.emptySlotSubtitle}>
                          Click "Add Morning Slots" if you want to add morning availability
                        </Text>
                      </View>
                    ) : (
                      morningSlots.map((slot, index) => {
                        const disabledRanges = getDisabledRangesForSlot(morningSlots, index);
                        
                        return (
                          <Card
                            key={`morning-${index}`}
                            style={styles.slotItemCard}
                          >
                            <View style={styles.slotItemHeader}>
                              <Text style={styles.slotItemTitle}>
                                Time Slot {index + 1}
                              </Text>
                              {morningSlots.length > 1 && (
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  onPress={() => onRemoveMorningSlot(index)}
                                  style={styles.deleteButton}
                                />
                              )}
                            </View>
                            
                            <Text style={styles.slotTimeText}>
                              Selected: {formatDisplayTime(slot[0])} - {formatDisplayTime(slot[1])}
                            </Text>
                            
                            {disabledRanges.length > 0 && (
                              <>
                                <Text style={styles.warningText}>
                                  ⚠️ Gray areas are already selected in other slots
                                </Text>
                                <DisabledRangesIndicator 
                                  ranges={disabledRanges}
                                  min={6}
                                  max={12}
                                />
                              </>
                            )}
                            
                            <View style={styles.sliderContainer}>
                              <TimeSliderWithDisabledRanges
                                value={slot}
                                onChange={(newValue: number[]) => onMorningSlotChange(index, newValue)}
                                min={6}
                                max={12}
                                marks={[
                                  { value: 6, label: "6:00 AM" },
                                  { value: 8, label: "8:00 AM" },
                                  { value: 10, label: "10:00 AM" },
                                  { value: 12, label: "12:00 PM" },
                                ]}
                                disabledRanges={disabledRanges}
                              />
                            </View>
                          </Card>
                        );
                      })
                    )}
                  </View>

                  {/* Evening Slots Section */}
                  <View style={styles.slotSection}>
                    <View style={styles.slotHeader}>
                      <View style={styles.slotTitleContainer}>
                        <Icon name="access-time" size={20} color="#1976d2" />
                        <Text style={styles.slotTitle}>Evening Availability</Text>
                        <Chip
                          style={styles.slotChip}
                          textStyle={styles.slotChipText}
                        >
                          {eveningSlots.length === 0 ? "Not Available" : `${eveningSlots.length} slot(s)`}
                        </Chip>
                      </View>
                      <View style={styles.slotActions}>
                        {eveningSlots.length > 0 && eveningSlots.length < 16 && (
                          <Button
                            mode="outlined"
                            onPress={onAddEveningSlot}
                            style={styles.slotButton}
                            labelStyle={styles.slotButtonLabel}
                          >
                            Add Slot
                          </Button>
                        )}
                        {eveningSlots.length === 0 ? (
                          <Button
                            mode="contained"
                            onPress={onAddEveningSlot}
                            style={styles.slotButton}
                            labelStyle={styles.slotButtonLabel}
                          >
                            Add Slots
                          </Button>
                        ) : (
                          <Button
                            mode="outlined"
                            onPress={onClearEveningSlots}
                            style={[styles.slotButton, styles.errorButton]}
                            labelStyle={[styles.slotButtonLabel, styles.errorButtonText]}
                          >
                            Clear All
                          </Button>
                        )}
                      </View>
                    </View>

                    {eveningSlots.length === 0 ? (
                      <View style={styles.emptySlotCard}>
                        <Text style={styles.emptySlotTitle}>
                          Not available in the evening
                        </Text>
                        <Text style={styles.emptySlotSubtitle}>
                          Click "Add Evening Slots" if you want to add evening availability
                        </Text>
                      </View>
                    ) : (
                      eveningSlots.map((slot, index) => {
                        const disabledRanges = getDisabledRangesForSlot(eveningSlots, index);
                        
                        return (
                          <Card
                            key={`evening-${index}`}
                            style={styles.slotItemCard}
                          >
                            <View style={styles.slotItemHeader}>
                              <Text style={styles.slotItemTitle}>
                                Time Slot {index + 1}
                              </Text>
                              {eveningSlots.length > 1 && (
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  onPress={() => onRemoveEveningSlot(index)}
                                  style={styles.deleteButton}
                                />
                              )}
                            </View>
                            
                            <Text style={styles.slotTimeText}>
                              Selected: {formatDisplayTime(slot[0])} - {formatDisplayTime(slot[1])}
                            </Text>
                            
                            {disabledRanges.length > 0 && (
                              <>
                                <Text style={styles.warningText}>
                                  ⚠️ Gray areas are already selected in other slots
                                </Text>
                                <DisabledRangesIndicator 
                                  ranges={disabledRanges}
                                  min={12}
                                  max={20}
                                />
                              </>
                            )}
                            
                            <View style={styles.sliderContainer}>
                              <TimeSliderWithDisabledRanges
                                value={slot}
                                onChange={(newValue: number[]) => onEveningSlotChange(index, newValue)}
                                min={12}
                                max={20}
                                marks={[
                                  { value: 12, label: "12:00 PM" },
                                  { value: 14, label: "2:00 PM" },
                                  { value: 16, label: "4:00 PM" },
                                  { value: 18, label: "6:00 PM" },
                                  { value: 20, label: "8:00 PM" },
                                ]}
                                disabledRanges={disabledRanges}
                              />
                            </View>
                          </Card>
                        );
                      })
                    )}
                  </View>

                  {/* Summary Card */}
                  {selectedTimeSlots && (
                    <Card style={styles.summaryCard}>
                      <Card.Content>
                        <Text style={styles.summaryTitle}>
                          Your Selected Time Slots:
                        </Text>
                        <Text style={styles.summaryText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  spacing: {
    marginBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginLeft: 8,
  },
  sectionSpacing: {
    gap: 24,
  },
  subSection: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  asterisk: {
    color: '#d32f2f',
    fontSize: 14,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  optionText: {
    fontSize: 13,
    color: '#000',
  },
  selectedOptionText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  errorAlert: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
  },
  fullTimeCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fullTimeSelected: {
    backgroundColor: '#e3f2fd',
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  fullTimeSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  slotSection: {
    marginBottom: 32,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  slotTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginLeft: 4,
    marginRight: 8,
  },
  slotChip: {
    backgroundColor: '#1976d2',
  },
  slotChipText: {
    color: '#fff',
    fontSize: 12,
  },
  slotActions: {
    flexDirection: 'row',
  },
  slotButton: {
    marginLeft: 4,
    borderRadius: 4,
  },
  slotButtonLabel: {
    fontSize: 12,
    marginHorizontal: 8,
  },
  errorButton: {
    borderColor: '#d32f2f',
  },
  errorButtonText: {
    color: '#d32f2f',
  },
  emptySlotCard: {
    padding: 24,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptySlotTitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  emptySlotSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  slotItemCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
    borderRadius: 8,
  },
  slotItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  deleteButton: {
    margin: 0,
    padding: 0,
  },
  slotTimeText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 11,
    color: '#ed6c02',
    marginBottom: 4,
  },
  sliderContainer: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  summaryCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#1976d2',
  },
});

export default ServiceDetails;