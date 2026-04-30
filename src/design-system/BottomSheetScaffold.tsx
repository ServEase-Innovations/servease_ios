import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

type BottomSheetScaffoldProps = {
  children: React.ReactNode;
  backgroundColor: string;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
};

const BottomSheetScaffold: React.FC<BottomSheetScaffoldProps> = ({ children, backgroundColor, borderColor, style }) => {
  return <View style={[styles.container, { backgroundColor, borderColor }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default BottomSheetScaffold;
