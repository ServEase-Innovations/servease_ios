import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

interface CustomCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selectedDate,
  onDateSelect,
  maxDate,
  minDate,
}) => {
  const [currentDate, setCurrentDate] = useState(moment(selectedDate));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.clone().startOf('month').day();
  const monthName = currentDate.format('MMMM');
  const year = currentDate.year();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  // Generate years from 100 years ago to current year
  const currentYear = moment().year();
  const startYear = currentYear - 100;
  const years = Array.from({ length: 101 }, (_, i) => startYear + i);

  const generateCalendarDays = () => {
    const calendarDays = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push({ day: 0, date: null, isCurrentMonth: false });
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentDate.clone().date(i).toDate();
      calendarDays.push({ day: i, date, isCurrentMonth: true });
    }
    
    return calendarDays;
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.clone().add(1, 'month'));
  };

  const handlePrevYear = () => {
    setCurrentDate(prev => prev.clone().subtract(1, 'year'));
  };

  const handleNextYear = () => {
    setCurrentDate(prev => prev.clone().add(1, 'year'));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(prev => prev.clone().month(monthIndex));
    setShowMonthPicker(false);
  };

  const handleYearSelect = (selectedYear: number) => {
    setCurrentDate(prev => prev.clone().year(selectedYear));
    setShowYearPicker(false);
  };

  const isDateSelectable = (date: Date | null) => {
    if (!date) return false;
    if (maxDate && date > maxDate) return false;
    if (minDate && date < minDate) return false;
    return true;
  };

  const isSelectedDate = (date: Date | null) => {
    if (!date) return false;
    return moment(date).isSame(selectedDate, 'day');
  };

  const renderDay = ({ item }: { item: { day: number; date: Date | null; isCurrentMonth: boolean } }) => {
    if (item.day === 0 || !item.date) {
      return <View style={styles.dayCell} />;
    }

    const selectable = isDateSelectable(item.date);
    const selected = isSelectedDate(item.date);

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          selected && styles.selectedDay,
          !selectable && styles.disabledDay,
        ]}
        onPress={() => selectable && onDateSelect(item.date!)}
        disabled={!selectable}
      >
        <Text
          style={[
            styles.dayText,
            selected && styles.selectedDayText,
            !selectable && styles.disabledDayText,
          ]}
        >
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMonthItem = ({ item, index }: { item: string; index: number }) => {
    const isSelected = currentDate.month() === index;
    
    return (
      <TouchableOpacity
        style={[styles.monthItem, isSelected && styles.selectedMonth]}
        onPress={() => handleMonthSelect(index)}
      >
        <Text style={[styles.monthItemText, isSelected && styles.selectedMonthText]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderYearItem = ({ item }: { item: number }) => {
    const isSelected = currentDate.year() === item;
    const isDisabled = (maxDate && item > moment(maxDate).year()) || 
                      (minDate && item < moment(minDate).year());
    
    return (
      <TouchableOpacity
        style={[
          styles.yearItem,
          isSelected && styles.selectedYear,
          isDisabled && styles.disabledYear,
        ]}
        onPress={() => !isDisabled && handleYearSelect(item)}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.yearItemText,
            isSelected && styles.selectedYearText,
            isDisabled && styles.disabledYearText,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Month, Year and Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Icon name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={styles.headerText}>{monthName}</Text>
            <Icon name="arrow-drop-down" size={20} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowYearPicker(true)}
          >
            <Text style={styles.headerText}>{year}</Text>
            <Icon name="arrow-drop-down" size={20} color="#333" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleNextMonth}>
          <Icon name="chevron-right" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={styles.weekDays}>
        {days.map(day => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>
      
      {/* Calendar Days */}
      <FlatList
        data={generateCalendarDays()}
        renderItem={renderDay}
        keyExtractor={(item, index) => index.toString()}
        numColumns={7}
        scrollEnabled={false}
      />

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.monthGrid}>
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthGridItem,
                    currentDate.month() === index && styles.selectedMonthGridItem
                  ]}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Text style={[
                    styles.monthGridText,
                    currentDate.month() === index && styles.selectedMonthGridText
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={[styles.modalContent, styles.yearModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Year Navigation in Modal */}
            <View style={styles.yearModalNavigation}>
              <TouchableOpacity onPress={() => setCurrentDate(prev => prev.clone().subtract(20, 'year'))}>
                <Icon name="keyboard-arrow-left" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.yearRangeText}>
                {years[0]} - {years[years.length - 1]}
              </Text>
              <TouchableOpacity onPress={() => setCurrentDate(prev => prev.clone().add(20, 'year'))}>
                <Icon name="keyboard-arrow-right" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={years}
              renderItem={renderYearItem}
              keyExtractor={(item) => item.toString()}
              numColumns={3}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.yearList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerCenter: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#1976d2',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#999',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  yearModalContent: {
    height: '70%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  // Month Grid Styles
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthGridItem: {
    width: '30%',
    padding: 12,
    margin: '1.5%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedMonthGridItem: {
    backgroundColor: '#1976d2',
  },
  monthGridText: {
    fontSize: 14,
    color: '#333',
  },
  selectedMonthGridText: {
    color: '#fff',
    fontWeight: '500',
  },
  // Year Picker Styles
  yearModalNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  yearRangeText: {
    fontSize: 14,
    color: '#666',
  },
  yearList: {
    paddingHorizontal: 8,
  },
  yearItem: {
    flex: 1,
    margin: 6,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedYear: {
    backgroundColor: '#1976d2',
  },
  disabledYear: {
    opacity: 0.3,
    backgroundColor: '#e0e0e0',
  },
  yearItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedYearText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledYearText: {
    color: '#999',
  },
  monthItem: {
    padding: 8,
    margin: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  selectedMonth: {
    backgroundColor: '#1976d2',
  },
  monthItemText: {
    fontSize: 14,
    color: '#333',
  },
  selectedMonthText: {
    color: '#fff',
  },
});

export default CustomCalendar;