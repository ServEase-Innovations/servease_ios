import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../Settings/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.9;

export type UpcomingServiceFilter = 'ALL' | 'cook' | 'maid' | 'nanny';
export type UpcomingDurationFilter = 'ALL' | 'MONTHLY' | 'SHORT_TERM' | 'ON_DEMAND';
export type UpcomingSortOrder = 'newest' | 'oldest';

export interface FilterOptions {
  sortOrder: UpcomingSortOrder;
  serviceFilter: UpcomingServiceFilter;
  durationFilter: UpcomingDurationFilter;
  statusFilter: string;
}

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  count?: number;
}

interface BookingsFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
  onClear: () => void;
  sortOptions: FilterOption[];
  serviceOptions: FilterOption[];
  durationOptions: FilterOption[];
  statusOptions: FilterOption[];
}

const BookingsFilterSheet: React.FC<BookingsFilterSheetProps> = ({
  visible,
  onClose,
  currentFilters,
  onApply,
  onClear,
  sortOptions,
  serviceOptions,
  durationOptions,
  statusOptions,
}) => {
  const { colors, fontSize: fontSizes, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [tempFilters, setTempFilters] = useState<FilterOptions>(currentFilters);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTempFilters(currentFilters);
  }, [currentFilters]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 70,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleApply = () => {
    onApply(tempFilters);
    onClose();
  };

  const handleClear = () => {
    const defaultFilters: FilterOptions = {
      sortOrder: 'newest',
      serviceFilter: 'ALL',
      durationFilter: 'ALL',
      statusFilter: 'ALL',
    };
    setTempFilters(defaultFilters);
    onClear();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: SHEET_MAX_HEIGHT,
              backgroundColor: '#ffffff',
              borderTopColor: '#e2e8f0',
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: '#cbd5e1' }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: '#e2e8f0' }]}>
            <Text style={[styles.headerTitle, { color: '#1e293b', fontSize: fontSizes.pageTitle || 20 }]}>
              Filters
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Filters Content */}
          <ScrollView
            style={{ flex: 1, backgroundColor: '#ffffff' }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={true}
          >
              {/* Sort Section */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="sort" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '600' }}>
                    Sort by
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                  {(sortOptions || []).map((item, index) => {
                    const isSelected = tempFilters.sortOrder === item.value;
                    return (
                      <View key={`sort-${item.value}-${index}`} style={{ width: '50%', padding: 4 }}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            backgroundColor: isSelected ? colors.primary : '#f1f5f9',
                            borderColor: isSelected ? colors.primary : '#cbd5e1',
                          }}
                          onPress={() => {
                            setTempFilters({ ...tempFilters, sortOrder: item.value as UpcomingSortOrder });
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ color: isSelected ? '#fff' : '#1e293b', fontSize: 14, fontWeight: '600' }}>
                            {item.label}
                          </Text>
                          {isSelected && <Icon name="check" size={16} color="#fff" style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Service Section */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="briefcase-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '600' }}>
                    Service
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                  {(serviceOptions || []).map((item, index) => {
                    const isSelected = tempFilters.serviceFilter === item.value;
                    const displayLabel = item.count !== undefined ? `${item.label} (${item.count})` : item.label;
                    return (
                      <View key={`service-${item.value}-${index}`} style={{ width: '50%', padding: 4 }}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            backgroundColor: isSelected ? colors.primary : '#f1f5f9',
                            borderColor: isSelected ? colors.primary : '#cbd5e1',
                          }}
                          onPress={() => setTempFilters({ ...tempFilters, serviceFilter: item.value as UpcomingServiceFilter })}
                          activeOpacity={0.7}
                        >
                          {item.icon && <Icon name={item.icon} size={16} color={isSelected ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />}
                          <Text style={{ color: isSelected ? '#fff' : '#1e293b', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                            {displayLabel}
                          </Text>
                          {isSelected && <Icon name="check" size={16} color="#fff" style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Duration/Type Section */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="calendar-range" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '600' }}>
                    Type
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                  {(durationOptions || []).map((item, index) => {
                    const isSelected = tempFilters.durationFilter === item.value;
                    const displayLabel = item.count !== undefined ? `${item.label} (${item.count})` : item.label;
                    return (
                      <View key={`duration-${item.value}-${index}`} style={{ width: '50%', padding: 4 }}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            backgroundColor: isSelected ? colors.primary : '#f1f5f9',
                            borderColor: isSelected ? colors.primary : '#cbd5e1',
                          }}
                          onPress={() => setTempFilters({ ...tempFilters, durationFilter: item.value as UpcomingDurationFilter })}
                          activeOpacity={0.7}
                        >
                          {item.icon && <Icon name={item.icon} size={16} color={isSelected ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />}
                          <Text style={{ color: isSelected ? '#fff' : '#1e293b', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                            {displayLabel}
                          </Text>
                          {isSelected && <Icon name="check" size={16} color="#fff" style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Status Section */}
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Icon name="filter-variant" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '600' }}>
                    Status
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                  {(statusOptions || []).map((item, index) => {
                    const isSelected = tempFilters.statusFilter === item.value;
                    const displayLabel = item.count !== undefined ? `${item.label} (${item.count})` : item.label;
                    return (
                      <View key={`status-${item.value}-${index}`} style={{ width: '50%', padding: 4 }}>
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            borderRadius: 8,
                            borderWidth: 1.5,
                            backgroundColor: isSelected ? colors.primary : '#f1f5f9',
                            borderColor: isSelected ? colors.primary : '#cbd5e1',
                          }}
                          onPress={() => setTempFilters({ ...tempFilters, statusFilter: item.value })}
                          activeOpacity={0.7}
                        >
                          {item.icon && <Icon name={item.icon} size={16} color={isSelected ? '#fff' : '#64748b'} style={{ marginRight: 6 }} />}
                          <Text style={{ color: isSelected ? '#fff' : '#1e293b', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                            {displayLabel}
                          </Text>
                          {isSelected && <Icon name="check" size={16} color="#fff" style={{ marginLeft: 6 }} />}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.footer, { borderTopColor: '#e2e8f0', backgroundColor: '#ffffff' }]}>
            <TouchableOpacity
              style={[
                styles.clearButton,
                { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
              ]}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Icon name="filter-off-outline" size={18} color="#64748b" />
              <Text style={[styles.clearButtonText, { color: '#64748b', fontSize: fontSizes.buttonText || 15 }]}>
                Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Text style={[styles.applyButtonText, { fontSize: fontSizes.buttonText || 15 }]}>
                Apply Filters
              </Text>
              <Icon name="check" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    maxHeight: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
  },
  filterOptionText: {
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  clearButtonText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default BookingsFilterSheet;
