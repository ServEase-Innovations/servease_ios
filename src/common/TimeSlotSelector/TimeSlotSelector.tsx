import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

interface TimeSlotSelectorProps {
  title: string;
  slots: number[][];
  minTime: number;
  maxTime: number;
  marks: { value: number; label: string }[];
  notAvailableMessage: string;
  addSlotMessage: string;
  slotLabel: string;
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

  useEffect(() => {
    setDuplicateErrors({});
  }, [slots]);

  const handleSlotChange = (index: number, values: number[]) => {
    const [start, end] = values;
    // Ensure start is less than end and minimum 1 hour difference
    if (end - start < 0.5) return;
    
    const newValue = [start, end];
    
    const exists = slots.some(
      (slot: number[], i: number) =>
        i !== index && slot[0] === newValue[0] && slot[1] === newValue[1]
    );
    if (exists) {
      setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: true }));
      return;
    }
    setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: false }));
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="access-time" size={20} color="#1976d2" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={onAddSlot}
          >
            <Icon name="add" size={18} color="#fff" />
          </TouchableOpacity>
          {slots.length > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClearSlots}
            >
              <Icon name="delete" size={18} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {slots.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="schedule" size={32} color="#ccc" />
          <Text style={styles.emptyText}>{notAvailableMessage}</Text>
          <Text style={styles.emptySubtext}>{addSlotMessage}</Text>
        </View>
      ) : (
        <ScrollView style={styles.slotsContainer} showsVerticalScrollIndicator={false}>
          {slots.map((slot: number[], index: number) => {
            const hasError = duplicateErrors[`slot-${index}`];
            return (
              <View key={`slot-${index}`} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotTitle}>
                    {slotLabel} {index + 1}
                  </Text>
                  {slots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => onRemoveSlot(index)}
                      style={styles.deleteButton}
                    >
                      <Icon name="delete" size={20} color="#f44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.selectedTimeContainer}>
                  <Icon name="access-time" size={14} color="#666" />
                  <Text style={styles.selectedTime}>
                    Selected: {formatDisplayTime(slot[0])} - {formatDisplayTime(slot[1])}
                  </Text>
                </View>

                <View style={styles.sliderWrapper}>
                  <View style={styles.sliderContainer}>
                    <MultiSlider
                      values={[slot[0], slot[1]]}
                      min={minTime}
                      max={maxTime}
                      step={0.5}
                      onValuesChange={(values) => handleSlotChange(index, values)}
                      selectedStyle={{
                        backgroundColor: '#1976d2',
                        height: 4,
                      }}
                      unselectedStyle={{
                        backgroundColor: '#e0e0e0',
                        height: 4,
                      }}
                      trackStyle={{
                        height: 4,
                        borderRadius: 2,
                      }}
                      markerStyle={{
                        height: 22,
                        width: 22,
                        borderRadius: 11,
                        backgroundColor: '#fff',
                        borderWidth: 2,
                        borderColor: '#1976d2',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                      pressedMarkerStyle={{
                        height: 24,
                        width: 24,
                        borderRadius: 12,
                        backgroundColor: '#fff',
                        borderWidth: 2,
                        borderColor: '#1565c0',
                      }}
                      containerStyle={{
                        height: 40,
                        paddingHorizontal: 8,
                      }}
                    />
                  </View>
                  
                  {/* Marks Container - Fixed positioning */}
                  <View style={styles.marksWrapper}>
                    {marks.map((mark: { value: number; label: string }, index: number) => (
                      <View key={index} style={[styles.markContainer, { left: `${((mark.value - minTime) / (maxTime - minTime)) * 100}%` }]}>
                        <View style={styles.markLine} />
                        <Text style={styles.markLabel}>{mark.label}</Text>
                      </View>
                    ))}
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
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
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
    color: '#999',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
  },
  slotsContainer: {
    maxHeight: 400,
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
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    color: '#1976d2',
  },
  deleteButton: {
    padding: 4,
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedTime: {
    fontSize: 13,
    color: '#666',
  },
  sliderWrapper: {
    marginTop: 8,
    marginBottom: 8,
    position: 'relative',
  },
  sliderContainer: {
    width: '100%',
  },
  marksWrapper: {
    position: 'relative',
    width: '100%',
    height: 30,
    marginTop: 4,
  },
  markContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -12 }],
    width: 24,
  },
  markLine: {
    width: 1,
    height: 8,
    backgroundColor: '#bdbdbd',
    marginBottom: 4,
  },
  markLabel: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
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
    fontSize: 11,
    color: '#f44336',
    flex: 1,
  },
});

export default TimeSlotSelector;