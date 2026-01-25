import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const LoadingIndicator = () => {
  return (
    <View>
      <ActivityIndicator size="large" /> 
      {/* You can customize size (small/large), color, etc. */}
    </View>
  );
};

export default LoadingIndicator;