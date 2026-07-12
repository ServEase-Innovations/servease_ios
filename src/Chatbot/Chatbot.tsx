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
  Keyboard,
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
import { HOME_HERO_GRADIENT, HOME_M3 } from '../theme/brandColors';
import { fetchMyTickets } from '../services/ticketsService';

const ENDPOINT = 'https://chat-b3wl.onrender.com';
const ADMIN_ID = '698ace8b8ea84c91bdc93678';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SHEET_MIN = SCREEN_H * 0.58;
const SHEET_DEFAULT = SCREEN_H * 0.88;
const SHEET_MAX = SCREEN_H * 0.96;
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
  { question: 'How do I book a home cook?', answer: 'Simply go to the Home tab, select Home Cook, choose your preferences, pick an available provider and confirm your booking.' },
  { question: 'Can I cancel my booking?', answer: 'Yes, cancellations are free up to 2 hours before the scheduled visit. Open My Bookings and choose the booking you want to cancel.' },
  { question: 'How are service providers verified?', answer: 'All our partners undergo rigorous identity, document, and service quality checks before they can accept bookings.' },
];

const customerFaqData = [
  { question: 'Where can I see my bookings?', answer: 'Open your profile and tap My Bookings to view upcoming, ongoing, and completed services.' },
  { question: 'How do I raise a complaint?', answer: 'Open the booking, tap Report issue, and our support team will track it as a ticket.' },
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
  const [loadingTickets, setLoadingTickets] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sheetHeight = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextOffset = Math.max(0, event.endCoordinates.height - insets.bottom);
      Animated.timing(keyboardOffset, {
        toValue: -nextOffset,
        duration: event.duration ?? 250,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: event.duration ?? 200,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, keyboardOffset]);

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
    if (!appUser) {
      Alert.alert('Sign in required', 'Please sign in to start a live support chat.');
      return;
    }
    if (startingChat) return;
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

  const getCustomerId = () => {
    const raw = appUser?.customerId ?? appUser?.customerid ?? appUser?.id;
    const parsed = raw != null && raw !== '' ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleOpenTickets = async () => {
    const customerId = getCustomerId();
    if (!customerId) {
      Alert.alert('Sign in required', 'Please sign in to view your support tickets.');
      return;
    }
    if (loadingTickets) return;
    setLoadingTickets(true);
    try {
      const tickets = await fetchMyTickets(customerId);
      if (!tickets.length) {
        Alert.alert('Your tickets', 'No tickets yet. Use Report issue on a booking to raise a complaint.');
        return;
      }
      const lines = tickets
        .slice(0, 8)
        .map(
          (ticket) =>
            `${ticket.ticket_number}: ${ticket.subject}\n${ticket.status}${ticket.is_overdue ? ' (overdue)' : ''}`
        )
        .join('\n\n');
      Alert.alert('Your tickets', lines);
    } catch {
      Alert.alert('Error', 'Could not load tickets. Please try again.');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    if (!isLiveChat) {
      setMessages((prev) => [...prev, { content: inputText.trim(), sender: 'user' }]);
      setChatOpen(true);
      setShowAccordion(false);
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
              color={isAdmin ? HOME_M3.secondary : HOME_M3.onSurfaceVariant}
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

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY: keyboardOffset }],
            },
          ]}
        >
          <View style={styles.sheetColumn}>
            <LinearGradient
              colors={[...HOME_HERO_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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
                    <Icon name="arrow-left" size={22} color={HOME_M3.onPrimary} />
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
                  <Icon name="close" size={24} color={HOME_M3.onPrimary} />
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
              {(chatOpen || isLiveChat) && messages.map(renderMessage)}

              {!isLiveChat && !chatOpen && (
                <>
                  <View style={styles.supportActions}>
                    <TouchableOpacity
                      style={[styles.supportActionCard, styles.liveSupportCard]}
                      onPress={startLiveChat}
                      disabled={startingChat}
                      accessibilityRole="button"
                      accessibilityLabel="Start live support"
                    >
                      <Icon name="headset" size={22} color={HOME_M3.onPrimary} />
                      <Text style={styles.liveSupportTitle}>
                        {startingChat ? 'Connecting...' : 'Live Support'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.supportActionCard, styles.ticketCard]}
                      onPress={() => void handleOpenTickets()}
                      disabled={loadingTickets}
                      accessibilityRole="button"
                      accessibilityLabel="View your tickets"
                    >
                      <Icon name="history" size={22} color={HOME_M3.onSecondaryContainer} />
                      <Text style={styles.ticketTitle}>
                        {loadingTickets ? 'Loading...' : 'Your Tickets'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showAccordion && (
                    <View style={styles.faqBlock}>
                      <Text style={styles.faqHeading}>Frequently Asked Questions</Text>
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
                              color={HOME_M3.outline}
                            />
                          </TouchableOpacity>
                          {expandedFaq === index && (
                            <Text style={styles.faqAnswer}>{faq.answer}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.connectHeading}>Other ways to connect</Text>
                  <View style={styles.contactList}>
                    <TouchableOpacity
                      style={styles.contactCard}
                      onPress={() => Linking.openURL('mailto:support@serveaso.com')}
                      accessibilityRole="button"
                      accessibilityLabel="Email support"
                    >
                      <View style={styles.contactIconWrap}>
                        <Icon name="email-outline" size={19} color={HOME_M3.secondary} />
                      </View>
                      <View style={styles.contactTextBlock}>
                        <Text style={styles.contactTitle}>Email Us</Text>
                        <Text style={styles.contactSubtitle}>support@serveaso.com</Text>
                      </View>
                      <Icon name="chevron-right" size={20} color={HOME_M3.outline} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactCard}
                      onPress={() => Linking.openURL('tel:+918792827744')}
                      accessibilityRole="button"
                      accessibilityLabel="Call helpline"
                    >
                      <View style={styles.contactIconWrap}>
                        <Icon name="phone-outline" size={19} color={HOME_M3.secondary} />
                      </View>
                      <View style={styles.contactTextBlock}>
                        <Text style={styles.contactTitle}>Call Helpline</Text>
                        <Text style={styles.contactSubtitle}>+91 87928 27744</Text>
                      </View>
                      <Icon name="chevron-right" size={20} color={HOME_M3.outline} />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <Icon name="message-outline" size={18} color={HOME_M3.outline} style={styles.queryIcon} />
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={isLiveChat ? 'Type a message...' : 'Type your query here...'}
                placeholderTextColor={HOME_M3.outline}
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
                <Icon name="send" size={22} color={HOME_M3.onPrimary} />
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
    backgroundColor: HOME_M3.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    backgroundColor: HOME_M3.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    paddingBottom: 14,
    minHeight: 56,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerIconSpacer: {
    width: 42,
    height: 42,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: HOME_M3.onPrimary,
  },
  headerSubtext: {
    fontSize: 13,
    color: HOME_M3.onPrimaryContainer,
    fontWeight: '500',
    marginTop: 2,
  },
  body: {
    flex: 1,
    minHeight: 0,
    backgroundColor: HOME_M3.surface,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '92%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarBot: {
    backgroundColor: HOME_M3.secondaryFixed,
  },
  avatarAdmin: {
    backgroundColor: HOME_M3.secondaryFixed,
  },
  messageBubble: {
    flexShrink: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    maxWidth: '100%',
  },
  botBubble: {
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    borderBottomLeftRadius: 4,
  },
  adminBubble: {
    backgroundColor: HOME_M3.secondaryFixed,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: HOME_M3.secondary,
    borderBottomRightRadius: 4,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: HOME_M3.onSurfaceVariant,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 23,
    color: HOME_M3.onSurface,
  },
  userMessageText: {
    color: '#fff',
  },
  supportActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  supportActionCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  liveSupportCard: {
    backgroundColor: HOME_M3.primary,
  },
  ticketCard: {
    backgroundColor: HOME_M3.secondaryContainer,
  },
  liveSupportTitle: {
    color: HOME_M3.onPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  ticketTitle: {
    color: HOME_M3.onSecondaryContainer,
    fontSize: 12,
    fontWeight: '700',
  },
  faqBlock: {
    marginBottom: 12,
  },
  faqHeading: {
    fontSize: 13,
    fontWeight: '500',
    color: HOME_M3.onSurface,
    marginBottom: 8,
  },
  faqItem: {
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: HOME_M3.onSurface,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 17,
    color: HOME_M3.onSurfaceVariant,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  connectHeading: {
    fontSize: 13,
    fontWeight: '500',
    color: HOME_M3.onSurface,
    marginBottom: 8,
  },
  contactList: {
    gap: 10,
    marginBottom: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    shadowColor: '#001630',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  contactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HOME_M3.secondaryFixed,
    marginRight: 12,
  },
  contactTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: HOME_M3.onSurface,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: HOME_M3.onSurfaceVariant,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: HOME_M3.outlineVariant,
    backgroundColor: HOME_M3.surfaceContainerLowest,
  },
  queryIcon: {
    marginLeft: 2,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 86,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontSize: 12,
    color: HOME_M3.onSurface,
    marginRight: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: HOME_M3.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});

export default Chatbot;
