// NotificationButton.tsx
import React from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const publicVapidKey = 'BO0fj8ZGgK5NOd9lv0T0E273Uh4VptN2d8clBns7aOBusDGbIh_ZIyQ8W8C-WViT1bdJlr0NkEozugQQqj8_nTo';

interface NotificationButtonProps {
  onPress?: () => void;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({ onPress }) => {
  const subscribeUser = async (): Promise<void> => {
    try {
      // Check if service workers are supported (they're not in React Native)
      // In React Native, we typically use push notification services directly
      Alert.alert('Info', 'Push notifications in React Native CLI require native configuration and a push notification service like FCM (Firebase Cloud Messaging)');
      
      // For React Native CLI, you would typically:
      // 1. Configure Firebase Cloud Messaging
      // 2. Request permissions using PushNotificationIOS (iOS) and react-native-push-notification (Android)
      // 3. Get the device token and send it to your server
      
      console.log('Push notification setup required for React Native CLI');
      
      // Call the onPress prop if provided
      if (onPress) {
        onPress();
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      Alert.alert('Error', 'Failed to set up notifications');
    }
  };

  const triggerNotification = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:4000/send-notification', {
        method: 'POST',
        body: JSON.stringify({
          title: "Hello from your App!",
          body: "This is a test push notification from React Native.",
          url: "http://localhost:3000"
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        console.log('Notification triggered!');
        Alert.alert('Success', 'Notification sent!');
      } else {
        console.error('Notification failed');
        Alert.alert('Error', 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      Alert.alert('Error', 'Error sending notification');
    }
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity
        onPress={subscribeUser}
        style={{
          backgroundColor: '#007AFF',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>
          Enable Notifications
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={triggerNotification}>
        <Icon name="bell" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

export default NotificationButton;

