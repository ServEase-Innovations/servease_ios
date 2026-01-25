// components/RadioButton.tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';

interface RadioButtonProps {
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  selectedColor?: string;
  unselectedColor?: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onPress,
  style,
  selectedColor = '#1976d2',
  unselectedColor = '#ccc',
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? selectedColor : unselectedColor,
          },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.selected,
              {
                backgroundColor: selectedColor,
              },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
});

export default RadioButton;