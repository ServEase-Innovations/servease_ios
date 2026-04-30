import React from 'react';
import { StyleSheet, View } from 'react-native';

type ActionRowProps = {
  children: React.ReactNode;
  style?: any;
};

const ActionRow: React.FC<ActionRowProps> = ({ children, style }) => {
  return <View style={[styles.row, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

export default ActionRow;
