import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Icon from 'react-native-vector-icons/MaterialIcons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TimeSlot {
  id: string;
  start: number;
  end: number;
  type: 'morning' | 'evening';
}

interface TimeSlotSelectorProps {
  title?: string;
  morningSlots: TimeSlot[];
  eveningSlots: TimeSlot[];
  minTime: number;
  maxTime: number;
  morningMarks: { value: number; label: string }[];
  eveningMarks: { value: number; label: string }[];
  notAvailableMessage: string;
  addSlotMessage: string;
  slotLabel: string;
  addButtonLabel: string;
  clearButtonLabel: string;
  duplicateErrorKey: string;
  onAddMorningSlot: () => void;
  onAddEveningSlot: () => void;
  onRemoveSlot: (id: string, type: 'morning' | 'evening') => void;
  onClearSlots: (type: 'morning' | 'evening') => void;
  onSlotChange: (id: string, newValue: number[], type: 'morning' | 'evening') => void;
  formatDisplayTime: (value: number) => string;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  title = "Time Slots",
  morningSlots,
  eveningSlots,
  minTime,
  maxTime,
  morningMarks,
  eveningMarks,
  notAvailableMessage,
  addSlotMessage,
  slotLabel,
  addButtonLabel,
  clearButtonLabel,
  duplicateErrorKey,
  onAddMorningSlot,
  onAddEveningSlot,
  onRemoveSlot,
  onClearSlots,
  onSlotChange,
  formatDisplayTime,
}) => {
  const [duplicateErrors, setDuplicateErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [isFullAvailability, setIsFullAvailability] = useState(true); // Changed to true for default selection

  useEffect(() => {
    setDuplicateErrors({});
  }, [morningSlots, eveningSlots]);

  // Animate when slots change
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [morningSlots.length, eveningSlots.length]);

  // Initialize with full availability if no slots are present
  useEffect(() => {
    // If there are no custom slots and full availability is true, ensure it's properly set
    if (isFullAvailability && morningSlots.length === 0 && eveningSlots.length === 0) {
      // Full availability is already selected by default
      // No need to clear slots as they're already empty
    }
  }, []);

  const handleSlotChange = (id: string, values: number[], type: 'morning' | 'evening') => {
    const [start, end] = values;
    const newValue = [start, end];
    
    const slots = type === 'morning' ? morningSlots : eveningSlots;
    const exists = slots.some(
      (slot: TimeSlot) =>
        slot.id !== id && slot.start === newValue[0] && slot.end === newValue[1]
    );
    
    if (exists) {
      setDuplicateErrors((prev) => ({ ...prev, [`${type}-${id}`]: true }));
      return;
    }
    setDuplicateErrors((prev) => ({ ...prev, [`${type}-${id}`]: false }));
    onSlotChange(id, newValue, type);
  };

  const handleClearSlots = (type: 'morning' | 'evening') => {
    Alert.alert(
      "Clear Slots",
      `Are you sure you want to clear all ${type} ${slotLabel}s?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", onPress: () => onClearSlots(type), style: "destructive" }
      ]
    );
  };

  const handleFullAvailabilityToggle = () => {
    if (isFullAvailability) {
      // Unselecting full availability
      Alert.alert(
        "Custom Time Slots",
        "You can now set your own custom time slots. Do you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Continue", 
            onPress: () => {
              setIsFullAvailability(false);
            }
          }
        ]
      );
    } else {
      // Selecting full availability
      Alert.alert(
        "Full Time Availability",
        "This will select all time slots from 6:00 AM to 8:00 PM. Any custom slots you've created will be cleared. Do you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Confirm", 
            onPress: () => {
              setIsFullAvailability(true);
              onClearSlots('morning');
              onClearSlots('evening');
            }
          }
        ]
      );
    }
  };

  const renderMarks = (marks: { value: number; label: string }[], min: number, max: number) => {
    return marks.map((mark: { value: number; label: string }, index: number) => {
      const position = ((mark.value - min) / (max - min)) * 100;
      return (
        <View key={index} style={[styles.markContainer, { left: `${position}%` }]}>
          <View style={styles.markLine} />
          <Text style={styles.markLabel}>{mark.label}</Text>
        </View>
      );
    });
  };

  // Function to merge overlapping time ranges
  const mergeOverlappingRanges = (slots: TimeSlot[]): string => {
    if (slots.length === 0) return '';
    
    const sortedSlots = [...slots].sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    let current = { start: sortedSlots[0].start, end: sortedSlots[0].end };
    
    for (let i = 1; i < sortedSlots.length; i++) {
      if (sortedSlots[i].start <= current.end) {
        current.end = Math.max(current.end, sortedSlots[i].end);
      } else {
        merged.push(current);
        current = { start: sortedSlots[i].start, end: sortedSlots[i].end };
      }
    }
    merged.push(current);
    
    return merged.map(range => 
      `${formatDisplayTime(range.start)} - ${formatDisplayTime(range.end)}`
    ).join(', ');
  };

  const renderSlotSection = (
    type: 'morning' | 'evening',
    slots: TimeSlot[],
    marks: { value: number; label: string }[],
    sectionTitle: string,
    primaryColor: string,
    onAddSlot: () => void
  ) => {
    const sectionMinTime = type === 'morning' ? 6 : 12;
    const sectionMaxTime = type === 'morning' ? 12 : 20;

    return (
      <View style={styles.sectionContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Icon name="access-time" size={20} color={primaryColor} />
            <Text style={[styles.sectionTitle, { color: primaryColor }]}>{sectionTitle}</Text>
            <View style={[styles.sectionChip, { backgroundColor: primaryColor + '15' }]}>
              <Text style={[styles.sectionChipText, { color: primaryColor }]}>
                {slots.length} {slots.length === 1 ? 'Time Slot' : 'Time Slots'}
              </Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: primaryColor }]}
              onPress={onAddSlot}
            >
              <Icon name="add" size={18} color="#fff" />
              <Text style={styles.buttonText}>{addButtonLabel}</Text>
            </TouchableOpacity>
            {slots.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleClearSlots(type)}
              >
                <Text style={styles.clearButtonText}>{clearButtonLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        

        {/* Section Content - No ScrollView, just render all slots */}
        {slots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="schedule" size={32} color="#ccc" />
            <Text style={styles.emptyText}>{notAvailableMessage}</Text>
            <Text style={styles.emptySubtext}>{addSlotMessage}</Text>
          </View>
        ) : (
          <View style={styles.slotsContainer}>
            {slots.map((slot: TimeSlot, index: number) => {
              const hasError = duplicateErrors[`${type}-${slot.id}`];
              return (
                <View key={slot.id} style={styles.slotCard}>
                  <View style={styles.slotHeader}>
                    <Text style={[styles.slotTitle, { backgroundColor: primaryColor + '10', color: primaryColor }]}>
                      {slotLabel} {index + 1}
                    </Text>
                    {slots.length > 1 && (
                      <TouchableOpacity
                        onPress={() => onRemoveSlot(slot.id, type)}
                        style={styles.deleteButton}
                      >
                        <Icon name="delete" size={20} color="#f44336" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.selectedTimeContainer}>
                    <Icon name="access-time" size={14} color={primaryColor} />
                    <Text style={styles.selectedTime}>
                      Selected: {formatDisplayTime(slot.start)} - {formatDisplayTime(slot.end)}
                    </Text>
                  </View>

                  <View style={styles.sliderWrapper}>
                    <View style={styles.sliderContainer}>
                      <MultiSlider
                        values={[slot.start, slot.end]}
                        min={sectionMinTime}
                        max={sectionMaxTime}
                        step={0.5}
                        onValuesChange={(values) => handleSlotChange(slot.id, values, type)}
                        selectedStyle={{
                          backgroundColor: primaryColor,
                        }}
                        unselectedStyle={{
                          backgroundColor: '#e0e0e0',
                        }}
                        trackStyle={{
                          height: 4,
                          borderRadius: 2,
                        }}
                        markerStyle={{
                          height: 24,
                          width: 24,
                          borderRadius: 12,
                          backgroundColor: primaryColor,
                          borderWidth: 3,
                          borderColor: '#fff',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 2,
                          elevation: 3,
                        }}
                        containerStyle={{
                          height: 40,
                        }}
                      />
                      <View style={styles.marksContainer}>
                        {renderMarks(marks, sectionMinTime, sectionMaxTime)}
                      </View>
                    </View>
                  </View>

                  {hasError && (
                    <View style={styles.errorContainer}>
                      <Icon name="error" size={16} color="#f44336" />
                      <Text style={styles.errorText}>{duplicateErrorKey}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  // Get merged selected time slots for display
  const getMergedSelectedSlots = () => {
    if (isFullAvailability) {
      return `${formatDisplayTime(6)} - ${formatDisplayTime(20)}`;
    }
    const allSlots = [...morningSlots, ...eveningSlots];
    if (allSlots.length === 0) return '';
    return mergeOverlappingRanges(allSlots);
  };

  return (
    <View style={styles.mainContainer}>
      {/* AVAILABILITY Title */}
      <Text style={styles.mainTitle}>AVAILABILITY</Text>

      {/* Full Time Availability Card */}
      <TouchableOpacity 
        style={[styles.fullAvailabilityCard, isFullAvailability && styles.fullAvailabilityCardActive]}
        onPress={handleFullAvailabilityToggle}
        activeOpacity={0.7}
      >
        <View style={styles.fullAvailabilityHeader}>
          <View style={styles.radioContainer}>
            <View style={[styles.radioOuter, isFullAvailability && styles.radioOuterSelected]}>
              {isFullAvailability && <View style={styles.radioInner} />}
            </View>
            <Icon name="schedule" size={24} color="#2196f3" />
            <Text style={styles.fullAvailabilityTitle}>Full Time Availability</Text>
          </View>
        </View>
        {isFullAvailability && (
          <Text style={styles.fullAvailabilityText}>
            {formatDisplayTime(6)} - {formatDisplayTime(20)} (All slots covered)
          </Text>
        )}
      </TouchableOpacity>

      {/* Show Morning and Evening sections only if full availability is NOT selected */}
      {!isFullAvailability && (
        <>
          {/* Morning Section */}
          {renderSlotSection(
            'morning',
            morningSlots,
            morningMarks,
            'Morning Availability',
            '#2196f3',
            onAddMorningSlot
          )}

          {/* Evening Section */}
          {renderSlotSection(
            'evening',
            eveningSlots,
            eveningMarks,
            'Evening Availability',
            '#2196f3',
            onAddEveningSlot
          )}
        </>
      )}

      {/* Selected Time Slots Summary - Shows merged ranges */}
      {(morningSlots.length > 0 || eveningSlots.length > 0 || isFullAvailability) && (
        <View style={styles.selectedSummaryContainer}>
          <Text style={styles.selectedSummaryTitle}>Your Selected Time Slots:</Text>
          <Text style={styles.selectedSummaryText}>
            {getMergedSelectedSlots()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2196f3',
    marginBottom: 16,
    letterSpacing: 1,
  },
  fullAvailabilityCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbdef5',
  },
  fullAvailabilityCardActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  fullAvailabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#2196f3',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196f3',
  },
  fullAvailabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  fullAvailabilityText: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
    marginTop: 12,
    marginLeft: 34,
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  clearButtonText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 32,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9e9e9e',
    textAlign: 'center',
  },
  slotsContainer: {
    width: '100%',
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#fff5f5',
    borderRadius: 20,
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#f5f7fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  selectedTime: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  sliderWrapper: {
    marginTop: 8,
    marginBottom: 8,
  },
  sliderContainer: {
    position: 'relative',
    paddingHorizontal: 4,
  },
  marksContainer: {
    position: 'relative',
    width: '100%',
    height: 30,
    marginTop: 8,
  },
  markContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -12 }],
  },
  markLine: {
    width: 1,
    height: 8,
    backgroundColor: '#bdbdbd',
    marginBottom: 4,
  },
  markLabel: {
    fontSize: 10,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    flex: 1,
  },
  selectedSummaryContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  selectedSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  selectedSummaryText: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 20,
  },
});

export default TimeSlotSelector;