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

  return (
    <View style={styles.timeSliderContainer}>
      {/* Time Labels */}
      <View style={styles.timeLabelsRow}>
        <View style={styles.timeLabelBox}>
          <Text style={styles.timeLabelSmall}>Start</Text>
          <Text style={styles.timeLabelValue}>{formatTime(value[0])}</Text>
        </View>
        <View style={styles.timeLabelBox}>
          <Text style={styles.timeLabelSmall}>End</Text>
          <Text style={styles.timeLabelValue}>{formatTime(value[1])}</Text>
        </View>
      </View>

      {/* Disabled Ranges Indicator */}
      <View style={styles.disabledRangesTrack}>
        <View style={styles.trackBackground} />
        {disabledRanges.map((range, index) => {
          const left = ((range[0] - min) / (max - min)) * 100;
          const width = ((range[1] - range[0]) / (max - min)) * 100;
          return (
            <View
              key={index}
              style={[
                styles.disabledRangeOverlay,
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
      <View style={styles.sliderWrapper}>
        <Text style={styles.sliderLabel}>Start Time</Text>
        <Slider
          style={styles.slider}
          value={value[0]}
          minimumValue={min}
          maximumValue={max}
          step={0.5}
          onValueChange={handleStartChange}
          onSlidingStart={() => setIsDraggingStart(true)}
          onSlidingComplete={() => setIsDraggingStart(false)}
          minimumTrackTintColor="#1976d2"
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor="#1976d2"
        />
      </View>

      {/* End Slider */}
      <View style={styles.sliderWrapper}>
        <Text style={styles.sliderLabel}>End Time</Text>
        <Slider
          style={styles.slider}
          value={value[1]}
          minimumValue={min}
          maximumValue={max}
          step={0.5}
          onValueChange={handleEndChange}
          onSlidingStart={() => setIsDraggingEnd(true)}
          onSlidingComplete={() => setIsDraggingEnd(false)}
          minimumTrackTintColor="#1976d2"
          maximumTrackTintColor="#e0e0e0"
          thumbTintColor="#1976d2"
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

  return (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Time slots already taken:</Text>
      {ranges.map((range, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={styles.legendColorBox} />
          <Text style={styles.legendText}>{formatTimeRange(range)}</Text>
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
                <View style={styles.labelContainer}>
                  <Icon name="work" size={20} color="#1976d2" />
                  <Text style={styles.label}>
                    Select Service Type(s) <Text style={styles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={styles.labelHelper}>
                  Choose the type of services you want to offer
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
                      <View style={styles.optionIconContainer}>
                        <Icon 
                          name={service.value === "COOK" ? "restaurant" : 
                                service.value === "NANNY" ? "child-care" : 
                                "cleaning-services"} 
                          size={24} 
                          color={formData.housekeepingRole.includes(service.value) ? "#1976d2" : "#666"} 
                        />
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text
                          style={[
                            styles.optionText,
                            formData.housekeepingRole.includes(service.value) && styles.selectedOptionText,
                          ]}
                        >
                          {service.label}
                        </Text>
                        <Text style={styles.optionDescription}>
                          {service.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {errors.housekeepingRole && (
                  <View style={styles.errorAlert}>
                    <Icon name="error" size={16} color="#d32f2f" />
                    <Text style={styles.errorText}>{errors.housekeepingRole}</Text>
                  </View>
                )}
              </View>

              {/* Diet Section - Always visible */}
              <View style={styles.subSection}>
                <View style={styles.labelContainer}>
                  <Icon name="restaurant" size={20} color="#1976d2" />
                  <Text style={styles.label}>
                    Diet Preference <Text style={styles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={styles.labelHelper}>
                  What type of food can you cook?
                </Text>
                
                <View style={styles.optionsContainer}>
                  {dietOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionCard,
                        formData.diet === option.value && styles.selectedOption,
                      ]}
                      onPress={() => handleDietPress(option.value)}
                    >
                      <View style={styles.optionIconContainer}>
                        <Icon 
                          name={option.icon} 
                          size={24} 
                          color={formData.diet === option.value ? "#1976d2" : "#666"} 
                        />
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text
                          style={[
                            styles.optionText,
                            formData.diet === option.value && styles.selectedOptionText,
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text style={styles.optionDescription}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {errors.diet && (
                  <HelperText type="error" visible={!!errors.diet}>
                    {errors.diet}
                  </HelperText>
                )}
              </View>

              {/* Cooking Speciality - Only show when Cook is selected */}
              {isCookSelected && (
                <View style={styles.subSection}>
                  <View style={styles.labelContainer}>
                    <Icon name="restaurant" size={20} color="#1976d2" />
                    <Text style={styles.label}>
                      Cooking Speciality <Text style={styles.asterisk}>*</Text>
                    </Text>
                  </View>
                  <Text style={styles.labelHelper}>
                    Select your area of expertise in cooking
                  </Text>
                  
                  <View style={styles.optionsContainer}>
                    {cookingSpecialityOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionCard,
                          formData.cookingSpeciality === option.value && styles.selectedOption,
                        ]}
                        onPress={() => handleCookingSpecialityPress(option.value)}
                      >
                        <View style={styles.optionIconContainer}>
                          <Icon 
                            name={option.icon} 
                            size={24} 
                            color={formData.cookingSpeciality === option.value ? "#1976d2" : "#666"} 
                          />
                        </View>
                        <View style={styles.optionTextContainer}>
                          <Text
                            style={[
                              styles.optionText,
                              formData.cookingSpeciality === option.value && styles.selectedOptionText,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={styles.optionDescription}>
                            {option.description}
                          </Text>
                        </View>
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

              {/* Nanny Care Type - Only show when Nanny is selected */}
              {isNannySelected && (
                <View style={styles.subSection}>
                  <View style={styles.labelContainer}>
                    <Icon name="child-care" size={20} color="#1976d2" />
                    <Text style={styles.label}>
                      Care Type <Text style={styles.asterisk}>*</Text>
                    </Text>
                  </View>
                  <Text style={styles.labelHelper}>
                    What type of care services do you provide?
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
                        <View style={styles.optionIconContainer}>
                          <Icon 
                            name={option.icon} 
                            size={24} 
                            color={formData.nannyCareType === option.value ? "#1976d2" : "#666"} 
                          />
                        </View>
                        <View style={styles.optionTextContainer}>
                          <Text
                            style={[
                              styles.optionText,
                              formData.nannyCareType === option.value && styles.selectedOptionText,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text style={styles.optionDescription}>
                            {option.description}
                          </Text>
                        </View>
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
            </View>
          </Card.Content>
        </Card>
      
        {/* Description Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.labelContainer}>
              <Icon name="description" size={20} color="#1976d2" />
              <Text style={styles.label}>Description</Text>
            </View>
            <Text style={styles.labelHelper}>
              Describe your experience, skills, and why you'd be a great service provider
            </Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., 5 years of experience in household management, specialized in..."
              value={formData.description}
              onChangeText={(text) => onDescriptionChange({ target: { value: text } })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </Card.Content>
        </Card>
      
        {/* Experience and Referral Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.rowContainer}>
              <View style={styles.halfWidth}>
                <View style={styles.labelContainer}>
                  <Icon name="work" size={18} color="#1976d2" />
                  <Text style={styles.label}>
                    Experience <Text style={styles.asterisk}>*</Text>
                  </Text>
                </View>
                <Text style={styles.labelHelper}>Years of experience</Text>
                <TextInput
                  style={[styles.input, errors.experience && styles.inputError]}
                  placeholder="e.g., 3"
                  value={formData.experience}
                  onChangeText={(text) => onExperienceChange({ target: { value: text } })}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                {errors.experience && (
                  <HelperText type="error" visible={!!errors.experience}>
                    {errors.experience}
                  </HelperText>
                )}
              </View>
              
              <View style={styles.halfWidth}>
                <View style={styles.labelContainer}>
                  <Icon name="card-giftcard" size={18} color="#1976d2" />
                  <Text style={styles.label}>Referral Code (Optional)</Text>
                </View>
                <Text style={styles.labelHelper}>If someone referred you</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., REF123"
                  value={formData.referralCode || ""}
                  onChangeText={(text) => onReferralCodeChange({ target: { value: text } })}
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      
        {/* Time slot section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerContainer}>
              <Icon name="access-time" size={24} color="#1976d2" />
              <Text style={styles.headerTitle}>Select Your Available Time Slots</Text>
            </View>
            <Text style={styles.labelHelper}>
              Choose when you are available to work (6:00 AM to 8:00 PM)
            </Text>
            
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
                        <Icon name="wb-sunny" size={20} color="#1976d2" />
                        <Text style={styles.slotTitle}>Morning Availability (6 AM - 12 PM)</Text>
                      </View>
                      <View style={styles.slotActions}>
                        {morningSlots.length === 0 ? (
                          <Button
                            mode="contained"
                            onPress={onAddMorningSlot}
                            style={styles.slotButton}
                            labelStyle={styles.slotButtonLabel}
                            icon="plus"
                          >
                            Add Morning Slots
                          </Button>
                        ) : (
                          <View style={styles.slotActionsInner}>
                            <Chip
                              style={styles.slotChip}
                              textStyle={styles.slotChipText}
                            >
                              {morningSlots.length} slot(s)
                            </Chip>
                            {morningSlots.length < 12 && (
                              <IconButton
                                icon="plus"
                                size={20}
                                onPress={onAddMorningSlot}
                                style={styles.slotIconButton}
                              />
                            )}
                            <IconButton
                              icon="delete"
                              size={20}
                              onPress={onClearMorningSlots}
                              style={[styles.slotIconButton, styles.deleteIconButton]}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    {morningSlots.length === 0 ? (
                      <View style={styles.emptySlotCard}>
                        <Icon name="wb-sunny" size={40} color="#ccc" />
                        <Text style={styles.emptySlotTitle}>
                          No morning slots selected
                        </Text>
                        <Text style={styles.emptySlotSubtitle}>
                          Click "Add Morning Slots" to set your morning availability
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
                              <View style={styles.slotItemTitleContainer}>
                                <Icon name="access-time" size={18} color="#1976d2" />
                                <Text style={styles.slotItemTitle}>
                                  Morning Slot {index + 1}
                                </Text>
                              </View>
                              {morningSlots.length > 1 && (
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  onPress={() => onRemoveMorningSlot(index)}
                                  style={styles.deleteButton}
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
                  <View style={styles.slotSection}>
                    <View style={styles.slotHeader}>
                      <View style={styles.slotTitleContainer}>
                        <Icon name="nights-stay" size={20} color="#1976d2" />
                        <Text style={styles.slotTitle}>Evening Availability (12 PM - 8 PM)</Text>
                      </View>
                      <View style={styles.slotActions}>
                        {eveningSlots.length === 0 ? (
                          <Button
                            mode="contained"
                            onPress={onAddEveningSlot}
                            style={styles.slotButton}
                            labelStyle={styles.slotButtonLabel}
                            icon="plus"
                          >
                            Add Evening Slots
                          </Button>
                        ) : (
                          <View style={styles.slotActionsInner}>
                            <Chip
                              style={styles.slotChip}
                              textStyle={styles.slotChipText}
                            >
                              {eveningSlots.length} slot(s)
                            </Chip>
                            {eveningSlots.length < 16 && (
                              <IconButton
                                icon="plus"
                                size={20}
                                onPress={onAddEveningSlot}
                                style={styles.slotIconButton}
                              />
                            )}
                            <IconButton
                              icon="delete"
                              size={20}
                              onPress={onClearEveningSlots}
                              style={[styles.slotIconButton, styles.deleteIconButton]}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    {eveningSlots.length === 0 ? (
                      <View style={styles.emptySlotCard}>
                        <Icon name="nights-stay" size={40} color="#ccc" />
                        <Text style={styles.emptySlotTitle}>
                          No evening slots selected
                        </Text>
                        <Text style={styles.emptySlotSubtitle}>
                          Click "Add Evening Slots" to set your evening availability
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
                              <View style={styles.slotItemTitleContainer}>
                                <Icon name="access-time" size={18} color="#1976d2" />
                                <Text style={styles.slotItemTitle}>
                                  Evening Slot {index + 1}
                                </Text>
                              </View>
                              {eveningSlots.length > 1 && (
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  onPress={() => onRemoveEveningSlot(index)}
                                  style={styles.deleteButton}
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
                    <Card style={styles.summaryCard}>
                      <Card.Content>
                        <View style={styles.summaryHeader}>
                          <Icon name="schedule" size={20} color="#1976d2" />
                          <Text style={styles.summaryTitle}>
                            Your Selected Time Slots:
                          </Text>
                        </View>
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
    marginBottom: 8,
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
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginLeft: 6,
  },
  labelHelper: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    marginLeft: 26,
  },
  asterisk: {
    color: '#d32f2f',
    fontSize: 14,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  selectedOptionText: {
    color: '#1976d2',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  errorAlert: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
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
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  fullTimeCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fullTimeSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  fullTimeSubtitle: {
    fontSize: 12,
    color: '#666',
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
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
    fontSize: 12,
    marginHorizontal: 4,
  },
  slotChip: {
    backgroundColor: '#1976d2',
    height: 30,
    marginRight: 4,
  },
  slotChipText: {
    color: '#fff',
    fontSize: 11,
  },
  slotIconButton: {
    width: 32,
    height: 32,
    margin: 0,
    backgroundColor: '#e3f2fd',
  },
  deleteIconButton: {
    backgroundColor: '#ffebee',
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
    gap: 8,
  },
  emptySlotTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
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
    marginBottom: 12,
  },
  slotItemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  deleteButton: {
    margin: 0,
    padding: 0,
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#90caf9',
    borderRadius: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  summaryText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  // Time Slider Styles
  timeSliderContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeLabelSmall: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  timeLabelValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  disabledRangesTrack: {
    height: 8,
    backgroundColor: '#e0e0e0',
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
    backgroundColor: '#e0e0e0',
  },
  disabledRangeOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#ff9800',
    opacity: 0.5,
  },
  sliderWrapper: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  legendContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderRadius: 6,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ed6c02',
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
    backgroundColor: '#ff9800',
    opacity: 0.5,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
});

export default ServiceDetails;