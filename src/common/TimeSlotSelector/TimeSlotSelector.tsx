// components/Registration/TimeSlotSelector.tsx (Fully Optimized)
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
  formatDisplayTime?: (value: number) => string;
  containerStyle?: any;
  slotContainerStyle?: any;
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
  containerStyle,
  slotContainerStyle,
}) => {
  const [duplicateErrors, setDuplicateErrors] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    setDuplicateErrors({});
  }, [slots]);

  const defaultFormatDisplayTime = (value: number): string => {
    const hours = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
    return `${displayHours}${displayMinutes} ${period}`;
  };

  const formatTime = formatDisplayTime || defaultFormatDisplayTime;

  const handleSlotChange = (index: number, values: number[]) => {
    let [start, end] = values;
    
    // Ensure minimum 1 hour difference for better usability
    if (end - start < 1) {
      if (end + 1 <= maxTime) {
        end = start + 1;
      } else if (start - 1 >= minTime) {
        start = end - 1;
      } else {
        return;
      }
    }
    
    const newValue = [start, end];
    
    const exists = slots.some(
      (slot: number[], i: number) =>
        i !== index && slot[0] === newValue[0] && slot[1] === newValue[1]
    );
    if (exists) {
      setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: true }));
      setTimeout(() => {
        setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: false }));
      }, 3000);
      return;
    }
    setDuplicateErrors((prev) => ({ ...prev, [`slot-${index}`]: false }));
    onSlotChange(index, newValue);
  };

  const handleClearSlots = () => {
    Alert.alert(
      "Clear Slots",
      `Are you sure you want to clear all ${slotLabel.toLowerCase()} slots?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", onPress: onClearSlots, style: "destructive" }
      ]
    );
  };

  const getMarkerLabel = (value: number) => {
    const hour = Math.floor(value);
    const minute = value % 1 === 0.5 ? "30" : "00";
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${period}`;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="access-time" size={18} color="#1976d2" />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddSlot}
            activeOpacity={0.7}
          >
            <Icon name="add" size={18} color="#1976d2" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
          {slots.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearSlots}
              activeOpacity={0.7}
            >
              <Icon name="delete-outline" size={18} color="#f44336" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {slots.length === 0 ? (
        <TouchableOpacity 
          style={styles.emptyContainer}
          onPress={onAddSlot}
          activeOpacity={0.6}
        >
          <View style={styles.emptyIconContainer}>
            <Icon name="access-time" size={32} color="#1976d2" />
          </View>
          <Text style={styles.emptyText}>{notAvailableMessage}</Text>
          <Text style={styles.emptySubtext}>Tap here to {addSlotMessage.toLowerCase()}</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView 
          style={styles.slotsContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.slotsContentContainer}
        >
          {slots.map((slot: number[], index: number) => {
            const hasError = duplicateErrors[`slot-${index}`];
            return (
              <View 
                key={`slot-${index}`} 
                style={[styles.slotCard, slotContainerStyle, hasError && styles.slotCardError]}
              >
                <View style={styles.slotHeader}>
                  <View style={styles.slotTitleContainer}>
                    <Icon name="schedule" size={16} color="#1976d2" />
                    <Text style={styles.slotTitle}>
                      {slotLabel} {index + 1}
                    </Text>
                  </View>
                  {slots.length > 1 && (
                    <TouchableOpacity
                      onPress={() => onRemoveSlot(index)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <Icon name="close" size={18} color="#f44336" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.selectedTimeContainer}>
                  <View style={styles.timeBadge}>
                    <Icon name="access-time" size={12} color="#fff" />
                    <Text style={styles.selectedTime}>
                      {formatTime(slot[0])}
                    </Text>
                  </View>
                  <Icon name="arrow-forward" size={14} color="#999" />
                  <View style={styles.timeBadge}>
                    <Icon name="access-time" size={12} color="#fff" />
                    <Text style={styles.selectedTime}>
                      {formatTime(slot[1])}
                    </Text>
                  </View>
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
                        height: 3,
                      }}
                      unselectedStyle={{
                        backgroundColor: '#e0e0e0',
                        height: 3,
                      }}
                      trackStyle={{
                        height: 3,
                        borderRadius: 1.5,
                      }}
                      markerStyle={{
                        height: 20,
                        width: 20,
                        borderRadius: 10,
                        backgroundColor: '#fff',
                        borderWidth: 2,
                        borderColor: '#1976d2',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                      pressedMarkerStyle={{
                        height: 22,
                        width: 22,
                        borderRadius: 11,
                        backgroundColor: '#fff',
                        borderWidth: 2.5,
                        borderColor: '#1565c0',
                      }}
                      containerStyle={{
                        height: 30,
                        paddingHorizontal: 4,
                      }}
                    />
                  </View>
                  
                  {/* Marks */}
                  <View style={styles.marksWrapper}>
                    {marks.map((mark: { value: number; label: string }, idx: number) => (
                      <View 
                        key={idx} 
                        style={[
                          styles.markContainer, 
                          { left: `${((mark.value - minTime) / (maxTime - minTime)) * 100}%` }
                        ]}
                      >
                        <View style={styles.markLine} />
                        <Text style={styles.markLabel}>{mark.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {hasError && (
                  <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={14} color="#f44336" />
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
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
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
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1976d2',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#ffebee',
    gap: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f44336',
  },
  emptyContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 6,
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 11,
    color: '#1976d2',
    textAlign: 'center',
  },
  slotsContainer: {
    maxHeight: 380,
  },
  slotsContentContainer: {
    paddingBottom: 4,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  slotCardError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#1976d2',
  },
  removeButton: {
    padding: 4,
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  selectedTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  sliderWrapper: {
    marginTop: 4,
    marginBottom: 4,
    position: 'relative',
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  marksWrapper: {
    position: 'relative',
    width: '100%',
    height: 28,
    marginTop: 2,
  },
  markContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -10 }],
    width: 20,
  },
  markLine: {
    width: 1,
    height: 6,
    backgroundColor: '#bdbdbd',
    marginBottom: 3,
  },
  markLabel: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
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