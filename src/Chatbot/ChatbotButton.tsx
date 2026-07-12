import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, View, PanResponder } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BRAND, GRADIENTS } from '../theme/brandColors';

interface ChatbotButtonProps {
  onPress: () => void;
  bottomInset?: number;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BTN_SIZE = 56;
const EDGE = 16;

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ onPress, bottomInset = 88 }) => {
  const defaultY = SCREEN_H - BTN_SIZE - bottomInset;
  const positionRef = useRef({
    x: SCREEN_W - BTN_SIZE - EDGE,
    y: defaultY,
  });
  const dragStart = useRef({ x: 0, y: 0 });
  const [, forceRender] = React.useState(0);
  const didDrag = useRef(false);

  const clampPosition = (x: number, y: number) => ({
    x: Math.max(EDGE, Math.min(x, SCREEN_W - BTN_SIZE - EDGE)),
    y: Math.max(EDGE + 48, Math.min(y, SCREEN_H - BTN_SIZE - bottomInset)),
  });

  useEffect(() => {
    positionRef.current.y = SCREEN_H - BTN_SIZE - bottomInset;
    forceRender((n) => n + 1);
  }, [bottomInset]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        didDrag.current = false;
        dragStart.current = { ...positionRef.current };
      },
      onPanResponderMove: (_, g) => {
        if (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5) {
          didDrag.current = true;
        }
        positionRef.current = clampPosition(
          dragStart.current.x + g.dx,
          dragStart.current.y + g.dy
        );
        forceRender((n) => n + 1);
      },
      onPanResponderRelease: () => {
        if (!didDrag.current) {
          onPress();
        }
      },
    })
  ).current;

  const pos = positionRef.current;

  return (
    <View
      style={[styles.draggableContainer, { left: pos.x, top: pos.y }]}
      {...panResponder.panHandlers}
    >
      <View accessibilityRole="button" accessibilityLabel="Open chat support">
        <LinearGradient
          colors={[...GRADIENTS.bookingHeader]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chatButton}
        >
          <Icon name="message-text-outline" size={26} color="#ffffff" />
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  draggableContainer: {
    position: 'absolute',
    zIndex: 2000,
  },
  chatButton: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BRAND.bookingNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ChatbotButton;
