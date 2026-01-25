import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet, Animated, PanResponder } from 'react-native';
import MessageCircle from 'react-native-vector-icons/Feather';

interface ChatbotButtonProps {
  open: boolean;
  onToggle: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ open, onToggle }) => {
  const [buttonPosition, setButtonPosition] = useState({
    x: screenWidth - 80,
    y: screenHeight - 80,
  });

  const pan = useRef(new Animated.ValueXY(buttonPosition)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.extractOffset(); // Reset the offset when gesture starts
      },
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dx: pan.x,
            dy: pan.y,
          },
        ],
        { useNativeDriver: false } // Must be false for PanResponder
      ),
      onPanResponderRelease: (e, gesture) => {
        const currentX = buttonPosition.x + gesture.dx;
        const currentY = buttonPosition.y + gesture.dy;

        // Boundary constraints
        const newX = Math.max(0, Math.min(currentX, screenWidth - 60));
        const newY = Math.max(0, Math.min(currentY, screenHeight - 60));

        setButtonPosition({ x: newX, y: newY });
        
        // Animate to final position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false, // Must be false
        }).start(() => {
          // After animation, set the base position and reset the animated values
          pan.flattenOffset();
        });
      },
    })
  ).current;

  const animatedStyle = {
    transform: [
      { translateX: Animated.add(pan.x, new Animated.Value(buttonPosition.x)) },
      { translateY: Animated.add(pan.y, new Animated.Value(buttonPosition.y)) },
    ],
  };

  return (
    <Animated.View
      style={[styles.draggableContainer, animatedStyle]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={onToggle}
        style={styles.chatButton}
        activeOpacity={0.8}
        accessibilityLabel="Need Help? Chat with us"
        accessibilityRole="button"
      >
        <MessageCircle name="message-circle" size={28} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  draggableContainer: {
    position: 'absolute',
    zIndex: 50,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ChatbotButton;