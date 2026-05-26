import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import { useAppUser } from '../context/AppUserContext';
import { BRAND, GRADIENTS } from '../theme/brandColors';

const ENDPOINT = 'https://chat-b3wl.onrender.com';
const ADMIN_ID = '698ace8b8ea84c91bdc93678';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SHEET_MIN = SCREEN_H * 0.46;
const SHEET_DEFAULT = SCREEN_H * 0.72;
const SHEET_MAX = SCREEN_H * 0.9;
const DISMISS_DRAG = 100;

interface MessageType {
  _id?: string;
  content: string;
  sender: 'user' | 'admin' | 'bot';
}

interface ChatbotProps {
  open: boolean;
  onClose: () => void;
}

const generalFaqData = [
  { question: 'What services do you offer?', answer: 'We offer Home Cook, Cleaning Help, and Caregiver services.' },
  { question: 'How do I book a service?', answer: 'Choose a provider, pick a time slot, and confirm payment.' },
  { question: 'Are providers verified?', answer: 'Yes — every provider completes our verification process.' },
  { question: 'Can I cancel a booking?', answer: 'Yes, from My Bookings in your profile.' },
  { question: 'How do I contact support?', answer: 'Use live chat below, email, or phone.' },
];

const customerFaqData = [
  { question: 'How do I track my booking?', answer: "Open My Bookings to see today's visit and status." },
  { question: 'Can I reschedule?', answer: 'Yes — open the booking and tap Modify (where available).' },
  { question: 'How do I pay?', answer: 'Card, UPI, and wallet options appear at checkout.' },
];

const Chatbot: React.FC<ChatbotProps> = ({ open, onClose }) => {
  const { appUser } = useAppUser();
  const insets = useSafeAreaInsets();

  const [chatOpen, setChatOpen] = useState(false);
  const [isLiveChat, setIsLiveChat] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([
    { content: 'Namaste! Welcome to ServEaso. How can we help you today?', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [showAccordion, setShowAccordion] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [mongoUser, setMongoUser] = useState<any>(null);
  const [startingChat, setStartingChat] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sheetHeight = useRef(new Animated.Value(0)).current;
  const dragStartHeight = useRef(SHEET_DEFAULT);
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const allFaqs =
    appUser?.role === 'CUSTOMER' ? [...generalFaqData, ...customerFaqData] : generalFaqData;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => {
    socketRef.current = io(ENDPOINT, { transports: ['websocket'] });
    socketRef.current.on('message recieved', (newMessage: any) => {
      setMessages((prev) => [...prev, { content: newMessage.content, sender: 'admin' }]);
    });
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, showAccordion, expandedFaq, scrollToEnd]);

  const resetChat = useCallback(() => {
    setChatOpen(false);
    setIsLiveChat(false);
    setShowAccordion(true);
    setExpandedFaq(null);
    setMessages([
      { content: 'Namaste! Welcome to ServEaso. How can we help you today?', sender: 'bot' },
    ]);
    setInputText('');
  }, []);

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetHeight, {
          toValue: SHEET_DEFAULT,
          friction: 9,
          tension: 65,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetHeight, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
      resetChat();
    }
  }, [open, backdropOpacity, sheetHeight, resetChat]);

  const animateSheetTo = (height: number, onDone?: () => void) => {
    Animated.spring(sheetHeight, {
      toValue: height,
      friction: 9,
      tension: 70,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(sheetHeight, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        sheetHeight.stopAnimation((value) => {
          dragStartHeight.current = typeof value === 'number' ? value : SHEET_DEFAULT;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(SHEET_MAX, Math.max(80, dragStartHeight.current - g.dy));
        sheetHeight.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const current = dragStartHeight.current - g.dy;
        if (current < SHEET_MIN - DISMISS_DRAG || g.vy > 1.5) {
          closeSheet();
          return;
        }
        if (current < (SHEET_MIN + SHEET_DEFAULT) / 2) {
          animateSheetTo(SHEET_MIN);
        } else if (current > (SHEET_DEFAULT + SHEET_MAX) / 2) {
          animateSheetTo(SHEET_MAX);
        } else {
          animateSheetTo(SHEET_DEFAULT);
        }
      },
    })
  ).current;

  const showBackButton = isLiveChat || chatOpen;

  const handleBackClick = () => {
    setIsLiveChat(false);
    setChatOpen(false);
    setShowAccordion(true);
    setExpandedFaq(null);
    setSelectedChat(null);
    setMessages([
      { content: 'Namaste! Welcome to ServEaso. How can we help you today?', sender: 'bot' },
    ]);
    setInputText('');
  };

  const startLiveChat = async () => {
    if (!appUser || startingChat) return;
    setStartingChat(true);
    try {
      const { data: userData } = await axios.post(`${ENDPOINT}/api/user/find-or-create`, {
        name: appUser.name,
        email: appUser.email,
      });
      setMongoUser(userData);

      const { data: chatData } = await axios.post(`${ENDPOINT}/api/chat`, {
        userId: ADMIN_ID,
        currentUserId: userData._id,
      });
      setSelectedChat(chatData);
      socketRef.current?.emit('join chat', chatData._id);

      const messageData = await axios.get(`${ENDPOINT}/api/message/${chatData._id}`);
      const formatted = messageData.data.map((m: any) => ({
        content: m.content,
        sender: m.sender._id === userData._id ? 'user' : 'admin',
      }));

      setMessages((prev) => [...prev, ...formatted]);
      setIsLiveChat(true);
      setChatOpen(true);
      setShowAccordion(false);
      setExpandedFaq(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to start live chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!isLiveChat) {
      setMessages((prev) => [...prev, { content: inputText.trim(), sender: 'user' }]);
      setInputText('');
      return;
    }

    try {
      const { data } = await axios.post(`${ENDPOINT}/api/message`, {
        content: inputText.trim(),
        chatId: selectedChat._id,
        senderId: mongoUser._id,
      });
      socketRef.current?.emit('new message', data);
      setMessages((prev) => [...prev, { content: data.content, sender: 'user' }]);
      setInputText('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = (msg: MessageType, index: number) => {
    const isUser = msg.sender === 'user';
    const isAdmin = msg.sender === 'admin';
    return (
      <View
        key={`msg-${index}`}
        style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowOther]}
      >
        {!isUser && (
          <View style={[styles.avatar, isAdmin ? styles.avatarAdmin : styles.avatarBot]}>
            <Icon
              name={isAdmin ? 'headset' : 'robot-outline'}
              size={16}
              color={isAdmin ? BRAND.accent : BRAND.textMuted}
            />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : isAdmin ? styles.adminBubble : styles.botBubble,
          ]}
        >
          {!isUser && (
            <Text style={styles.senderLabel}>{isAdmin ? 'Support' : 'ServEaso'}</Text>
          )}
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>{msg.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={closeSheet}>
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
          <View style={styles.sheetColumn}>
            <LinearGradient
              colors={[...GRADIENTS.bookingHeader]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <View style={styles.dragZone} {...panResponder.panHandlers}>
                <View style={styles.dragHandle} />
              </View>
              <View style={styles.headerRow}>
                {showBackButton ? (
                  <TouchableOpacity
                    onPress={handleBackClick}
                    style={styles.headerIconBtn}
                    hitSlop={12}
                    accessibilityLabel="Back to help options"
                    accessibilityRole="button"
                  >
                    <Icon name="arrow-left" size={24} color="#ffffff" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.headerIconSpacer} />
                )}
                <View style={styles.headerTitles}>
                  <Text style={styles.headerText} numberOfLines={1}>
                    {isLiveChat ? 'Live support' : 'Chat Support'}
                  </Text>
                  <Text style={styles.headerSubtext} numberOfLines={1}>
                    {isLiveChat ? 'Chat with our team' : 'FAQs & live assistance'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeSheet}
                  style={styles.headerIconBtn}
                  hitSlop={12}
                  accessibilityLabel="Close chat"
                  accessibilityRole="button"
                >
                  <Icon name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <KeyboardAvoidingView
              style={styles.body}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(renderMessage)}

              {!isLiveChat && (
                <>
                  {showAccordion && (
                    <View style={styles.faqBlock}>
                      <Text style={styles.faqHeading}>Quick answers</Text>
                      {allFaqs.map((faq, index) => (
                        <View key={index} style={styles.faqItem}>
                          <TouchableOpacity
                            style={styles.faqQuestionRow}
                            onPress={() =>
                              setExpandedFaq(expandedFaq === index ? null : index)
                            }
                          >
                            <Text style={styles.faqQuestion}>{faq.question}</Text>
                            <Icon
                              name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={BRAND.textMuted}
                            />
                          </TouchableOpacity>
                          {expandedFaq === index && (
                            <Text style={styles.faqAnswer}>{faq.answer}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => setShowAccordion((v) => !v)}
                    style={styles.faqToggle}
                  >
                    <Text style={styles.faqToggleText}>
                      {showAccordion ? 'Hide quick answers' : 'Show quick answers'}
                    </Text>
                  </TouchableOpacity>

                  {appUser ? (
                    <TouchableOpacity
                      style={[styles.liveChatBtn, startingChat && styles.liveChatBtnDisabled]}
                      onPress={startLiveChat}
                      disabled={startingChat}
                    >
                      <Icon name="message-processing-outline" size={20} color="#fff" />
                      <Text style={styles.liveChatBtnText}>
                        {startingChat ? 'Connecting…' : 'Chat with support'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.loginHint}>Sign in to start a live chat with our team.</Text>
                  )}

                  <View style={styles.contactRow}>
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => Linking.openURL('mailto:support@serveaso.com')}
                    >
                      <Icon name="email-outline" size={18} color={BRAND.accent} />
                      <Text style={styles.contactChipText}>Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => Linking.openURL('tel:080123456789')}
                    >
                      <Icon name="phone-outline" size={18} color={BRAND.accent} />
                      <Text style={styles.contactChipText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isLiveChat ? 'Type a message…' : 'Ask a question…'}
                placeholderTextColor={BRAND.textMuted}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                multiline
                maxLength={2000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handleSendMessage}
                disabled={!inputText.trim()}
              >
                <Icon name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    width: SCREEN_W,
    backgroundColor: BRAND.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    width: '100%',
    flexShrink: 0,
    backgroundColor: BRAND.bookingNavy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragZone: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    minHeight: 48,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerIconSpacer: {
    width: 40,
    height: 40,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  body: {
    flex: 1,
    minHeight: 0,
    backgroundColor: BRAND.canvas,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 14,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '92%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarBot: {
    backgroundColor: BRAND.accentSoft,
  },
  avatarAdmin: {
    backgroundColor: '#e0e7ff',
  },
  messageBubble: {
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  botBubble: {
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderBottomLeftRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: BRAND.accent,
    borderBottomRightRadius: 4,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND.textMuted,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    color: BRAND.text,
  },
  userMessageText: {
    color: '#fff',
  },
  faqBlock: {
    marginTop: 8,
    marginBottom: 8,
  },
  faqHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  faqItem: {
    backgroundColor: BRAND.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.text,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 19,
    color: BRAND.textMuted,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  faqToggle: {
    alignSelf: 'center',
    paddingVertical: 6,
    marginBottom: 10,
  },
  faqToggleText: {
    color: BRAND.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  liveChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BRAND.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  liveChatBtnDisabled: {
    opacity: 0.7,
  },
  liveChatBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  loginHint: {
    textAlign: 'center',
    color: BRAND.textMuted,
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  contactChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  contactChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND.accent,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
    backgroundColor: BRAND.surface,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: BRAND.canvas,
    borderWidth: 1,
    borderColor: BRAND.line,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: BRAND.text,
    marginRight: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});

export default Chatbot;
