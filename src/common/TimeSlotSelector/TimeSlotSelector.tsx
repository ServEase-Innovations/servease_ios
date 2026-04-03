import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TimeSlotSelectorProps {
  title: string;
  slots: number[][];
  minTime: number;
  maxTime: number;
  marks: { value: number; label: string }[];
  notAvailableMessage: string;
  addSlotMessage: string;
  slotLabel: string;
  addButtonLabel: string;
  clearButtonLabel: string;
  duplicateErrorKey: string;
  onAddSlot: () => void;
  onRemoveSlot: (index: number) => void;
  onClearSlots: () => void;
  onSlotChange: (index: number, newValue: number[]) => void;
  formatDisplayTime: (value: number) => string;
  existingSlots?: number[][];
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  title,
  slots,
  minTime,
  maxTime,
  marks,
  notAvailableMessage,
  addSlotMessage,
  slotLabel,
  addButtonLabel,
  clearButtonLabel,
  duplicateErrorKey,
  onAddSlot,
  onRemoveSlot,
  onClearSlots,
  onSlotChange,
  formatDisplayTime,
  existingSlots = [],
}) => {
  const [duplicateErrors, setDuplicateErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [localSlots, setLocalSlots] = useState<number[][]>(slots);

  // Function to check if a time value is already occupied by any existing slot (excluding current index)
  const isTimeOccupied = (timeValue: number, currentSlotIndex: number | null = null): boolean => {
    for (let i = 0; i < localSlots.length; i++) {
      if (currentSlotIndex !== null && i === currentSlotIndex) continue;
      const slot = localSlots[i];
      if (timeValue >= slot[0] && timeValue <= slot[1]) {
        return true;
      }
    }
    return false;
  };

  // Function to get available time ranges for the current slot
  const getAvailableTimeRanges = (currentSlotIndex: number): { start: number; end: number }[] => {
    const occupiedRanges: { start: number; end: number }[] = [];
    
    // Collect all occupied ranges from other slots
    for (let i = 0; i < localSlots.length; i++) {
      if (i === currentSlotIndex) continue;
      occupiedRanges.push({ start: localSlots[i][0], end: localSlots[i][1] });
    }
    
    // Sort occupied ranges by start time
    occupiedRanges.sort((a, b) => a.start - b.start);
    
    // Find available gaps
    const availableRanges: { start: number; end: number }[] = [];
    let currentStart = minTime;
    
    for (const range of occupiedRanges) {
      if (currentStart < range.start) {
        availableRanges.push({ start: currentStart, end: range.start });
      }
      currentStart = Math.max(currentStart, range.end);
    }
    
    if (currentStart < maxTime) {
      availableRanges.push({ start: currentStart, end: maxTime });
    }
    
    return availableRanges;
  };

  // Get default time range for a new slot
  const getDefaultTimeRange = (): number[] => {
    if (localSlots.length === 0) {
      return [minTime, Math.min(minTime + 2, maxTime)];
    }
    
    // Find the largest gap
    let maxGap = 0;
    let gapStart = minTime;
    let gapEnd = minTime + 2;
    
    const availableRanges = getAvailableTimeRanges(-1);
    
    for (const range of availableRanges) {
      const gapSize = range.end - range.start;
      if (gapSize >= 2 && gapSize > maxGap) {
        maxGap = gapSize;
        gapStart = range.start;
        gapEnd = Math.min(range.start + 2, range.end);
      }
    }
    
    return [gapStart, gapEnd];
  };

  // Update local slots when props change
  useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  useEffect(() => {
    setDuplicateErrors({});
  }, [localSlots]);

  const handleSlotChange = (index: number, values: number[]) => {
    let [start, end] = values;
    
    // Round to nearest 0.5
    start = Math.round(start * 2) / 2;
    end = Math.round(end * 2) / 2;
    
    // Ensure start is less than end
    let newStart = start < end ? start : end;
    let newEnd = start < end ? end : start;
    
    // Ensure minimum duration of 0.5 hours (30 minutes)
    if (newEnd - newStart < 0.5) {
      newEnd = Math.min(newStart + 0.5, maxTime);
    }
    
    // Check if the selected range is valid (not overlapping with other slots)
    let isValid = true;
    for (let i = 0; i < localSlots.length; i++) {
      if (i === index) continue;
      const slot = localSlots[i];
      // Check for overlap
      if (!(newEnd <= slot[0] || newStart >= slot[1])) {
        isValid = false;
        break;
      }
    }
    
    if (!isValid) {
      setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: true }));
      return;
    }
    
    setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: false }));
    
    // Update local state
    const updatedSlots = [...localSlots];
    updatedSlots[index] = [newStart, newEnd];
    setLocalSlots(updatedSlots);
    
    // Notify parent
    onSlotChange(index, [newStart, newEnd]);
  };

  const handleClearSlots = () => {
    Alert.alert(
      "Clear Slots",
      `Are you sure you want to clear all ${slotLabel}s?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", onPress: onClearSlots, style: "destructive" }
      ]
    );
  };

  const handleAddSlot = () => {
    setDuplicateErrors({});
    const defaultRange = getDefaultTimeRange();
    onAddSlot();
    // After adding, update the new slot with default range
    setTimeout(() => {
      if (localSlots.length > 0) {
        const newIndex = localSlots.length;
        onSlotChange(newIndex, defaultRange);
      }
    }, 50);
  };

  const renderMarks = () => {
    return marks.map((mark: { value: number; label: string }, index: number) => {
      const position = ((mark.value - minTime) / (maxTime - minTime)) * 100;
      return (
        <View key={index} style={[styles.markContainer, { left: `${position}%` }]}>
          <View style={styles.markLine} />
          <Text style={styles.markLabel}>{mark.label}</Text>
        </View>
      );
    });
  };

  // Custom marker component to show disabled state for occupied times
  const CustomMarker = ({ currentValue, slotIndex, enabled }: { currentValue: number; slotIndex: number; enabled: boolean }) => {
    return (
      <View style={[
        styles.marker,
        !enabled && styles.markerDisabled
      ]} />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Title and Buttons */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="access-time" size={20} color="#1976d2" />
          <Text style={styles.title}>{title}</Text>
          {localSlots.length > 0 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {localSlots.length} {localSlots.length === 1 ? 'Slot' : 'Slots'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddSlot}
          activeOpacity={0.7}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
        {localSlots.length > 0 && (
          <TouchableOpacity
            style={styles.clearIconButton}
            onPress={handleClearSlots}
            activeOpacity={0.7}
          >
            <Icon name="delete-outline" size={24} color="#f44336" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {localSlots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="schedule" size={32} color="#ccc" />
          <Text style={styles.emptyText}>{notAvailableMessage}</Text>
          <Text style={styles.emptySubtext}>{addSlotMessage}</Text>
        </View>
      ) : (
        <ScrollView style={styles.slotsContainer} showsVerticalScrollIndicator={false}>
          {localSlots.map((slot: number[], index: number) => {
            const hasError = duplicateErrors[`slot-${index}`];
            const availableRanges = getAvailableTimeRanges(index);
            
            return (
              <View key={`slot-${index}`} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <View style={styles.slotTitleContainer}>
                    <Icon name="access-time" size={16} color="#1976d2" />
                    <Text style={styles.slotTitle}>
                      {slotLabel} {index + 1}
                    </Text>
                  </View>
                  {localSlots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => onRemoveSlot(index)}
                      style={styles.deleteButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="delete" size={20} color="#f44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.selectedTimeContainer}>
                  <Icon name="schedule" size={14} color="#666" />
                  <Text style={styles.selectedTime}>
                    Selected: {formatDisplayTime(slot[0])} - {formatDisplayTime(slot[1])}
                  </Text>
                </View>

                <View style={styles.sliderContainer}>
                  <MultiSlider
                    values={[slot[0], slot[1]]}
                    min={minTime}
                    max={maxTime}
                    step={0.5}
                    allowOverlap={false}
                    onValuesChangeStart={() => {
                      if (duplicateErrors[`slot-${index}`]) {
                        setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: false }));
                      }
                    }}
                    onValuesChange={(values) => handleSlotChange(index, values)}
                    selectedStyle={{
                      backgroundColor: '#1976d2',
                    }}
                    unselectedStyle={{
                      backgroundColor: '#bdbdbd',
                    }}
                    trackStyle={{
                      height: 4,
                    }}
                    markerStyle={{
                      height: 20,
                      width: 20,
                      borderRadius: 10,
                      backgroundColor: '#1976d2',
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}
                    containerStyle={{
                      height: 40,
                    }}
                    enabledOne={true}
                    enabledTwo={true}
                  />
                  
                  {/* Visual representation of occupied time ranges */}
                  <View style={styles.occupiedOverlay}>
                    {availableRanges.map((range, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && (
                          <View 
                            style={[
                              styles.occupiedBlock,
                              {
                                left: `${((availableRanges[idx-1].end - minTime) / (maxTime - minTime)) * 100}%`,
                                width: `${((range.start - availableRanges[idx-1].end) / (maxTime - minTime)) * 100}%`,
                              }
                            ]}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                  
                  <View style={styles.marksContainer}>
                    {renderMarks()}
                  </View>
                </View>

                {/* Show available ranges hint */}
                {availableRanges.length > 0 && (
                  <View style={styles.hintContainer}>
                    <Icon name="info" size={12} color="#666" />
                    <Text style={styles.hintText}>
                      Available: {availableRanges.map(range => 
                        `${formatDisplayTime(range.start)}-${formatDisplayTime(range.end)}`
                      ).join(', ')}
                    </Text>
                  </View>
                )}

                {hasError && (
                  <View style={styles.errorContainer}>
                    <Icon name="error" size={16} color="#f44336" />
                    <Text style={styles.errorText}>{duplicateErrorKey}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  chip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#f44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    maxHeight: 500,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  slotTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  deleteButton: {
    padding: 4,
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 6,
  },
  selectedTime: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  sliderContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
    position: 'relative',
  },
  occupiedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  occupiedBlock: {
    position: 'absolute',
    height: 30,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    top: 5,
    borderRadius: 4,
  },
  marksContainer: {
    position: 'relative',
    height: 30,
    marginTop: 16,
    marginHorizontal: -8,
  },
  markContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -4 }],
  },
  markLine: {
    width: 1,
    height: 6,
    backgroundColor: '#bdbdbd',
    marginBottom: 4,
  },
  markLabel: {
    fontSize: 9,
    color: '#9e9e9e',
  },
  marker: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: '#1976d2',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerDisabled: {
    backgroundColor: '#ccc',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f0f7ff',
    borderRadius: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    gap: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#f44336',
    flex: 1,
  },
});

export default TimeSlotSelector;