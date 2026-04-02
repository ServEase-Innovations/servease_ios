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
}) => {
  const [duplicateErrors, setDuplicateErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [localSlots, setLocalSlots] = useState<number[][]>(slots);

  // Update local slots when props change
  useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  useEffect(() => {
    setDuplicateErrors({});
  }, [localSlots]);

  const handleSlotChange = (index: number, values: number[]) => {
    const [start, end] = values;
    // Ensure start is less than end
    const newValue = start < end ? [start, end] : [end, start];
    
    // Check for duplicate
    const exists = localSlots.some(
      (slot: number[], i: number) =>
        i !== index && slot[0] === newValue[0] && slot[1] === newValue[1]
    );
    
    if (exists) {
      setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: true }));
      return;
    }
    
    setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: false }));
    
    // Update local state immediately for responsive UI
    const updatedSlots = [...localSlots];
    updatedSlots[index] = newValue;
    setLocalSlots(updatedSlots);
    
    // Notify parent
    onSlotChange(index, newValue);
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
    onAddSlot();
  };

  const renderMarks = () => {
    return marks.map((mark: { value: number; label: string }, index: number) => (
      <View key={index} style={styles.markContainer}>
        <View style={styles.markLine} />
        <Text style={styles.markLabel}>{mark.label}</Text>
      </View>
    ));
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
          style={[styles.button, styles.addButton]}
          onPress={handleAddSlot}
        >
          <Icon name="add" size={18} color="#fff" />
          <Text style={styles.buttonText}>{addButtonLabel}</Text>
        </TouchableOpacity>
        {localSlots.length > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearSlots}
          >
            <Icon name="delete-outline" size={18} color="#f44336" />
            <Text style={styles.clearButtonText}>{clearButtonLabel}</Text>
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
                    onValuesChangeStart={() => {
                      // Clear error when user starts sliding
                      if (duplicateErrors[`slot-${index}`]) {
                        setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: false }));
                      }
                    }}
                    onValuesChange={(values) => handleSlotChange(index, values)}
                    onValuesChangeFinish={(values) => {
                      // Final validation on slide end
                      handleSlotChange(index, values);
                    }}
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
                  />
                  
                  <View style={styles.marksContainer}>
                    {renderMarks()}
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
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addButton: {
    backgroundColor: '#1976d2',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  clearButtonText: {
    color: '#f44336',
    fontSize: 13,
    fontWeight: '500',
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
  },
  marksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  markContainer: {
    alignItems: 'center',
    flex: 1,
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