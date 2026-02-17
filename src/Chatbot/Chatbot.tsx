import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import io, { Socket } from 'socket.io-client';
import { useAppUser } from '../context/AppUserContext';

const ENDPOINT = "https://chat-b3wl.onrender.com";
const ADMIN_ID = "698ace8b8ea84c91bdc93678";

interface MessageType {
  _id?: string;
  content: string;
  sender: "user" | "admin" | "bot";
}

interface ChatbotProps {
  open: boolean;
  onClose: () => void;
}

const generalFaqData = [
  { question: "What services do you offer?", answer: "We offer services for HomeCook, Cleanning Help, and Caregiver." },
  { question: "How do I book a service?", answer: "You can book a service by selecting a provider and scheduling a time." },
  { question: "Are the service providers verified?", answer: "Yes, all our service providers go through a verification process." },
  { question: "Can I cancel a booking?", answer: "Yes, you can cancel a booking from your profile under 'My Bookings'." },
  { question: "How do I contact customer support?", answer: "You can reach out to our support team via chat or email." }
];

const customerFaqData = [
  { question: "How do I track my booking?", answer: "You can track your booking status in the 'My Bookings' section." },
  { question: "Can I reschedule my service?", answer: "Yes, you can reschedule your service from the booking details page." },
  { question: "How do I make a payment?", answer: "Payments can be made via credit card, debit card, or UPI." }
];

const Chatbot: React.FC<ChatbotProps> = ({ open, onClose }) => {
  const { appUser } = useAppUser();

  const [chatOpen, setChatOpen] = useState(false);
  const [isLiveChat, setIsLiveChat] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([
    { content: "Namaste! Welcome to ServEaso. How can we assist you today?", sender: "bot" }
  ]);
  const [inputText, setInputText] = useState('');
  const [showAllFaq, setShowAllFaq] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [mongoUser, setMongoUser] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  /* ---------------- SOCKET CONNECT ---------------- */
  useEffect(() => {
    socketRef.current = io(ENDPOINT, { transports: ["websocket"] });

    socketRef.current.on("message recieved", (newMessage: any) => {
      setMessages((prev) => [
        ...prev,
        { content: newMessage.content, sender: "admin" }
      ]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
    
    if (isMinimized && messages.length > 1) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setIsMinimized(false);
      setUnreadCount(0);
      setChatOpen(false);
      setIsLiveChat(false);
      setShowAllFaq(true);
      setMessages([
        { content: "Namaste! Welcome to ServEaso. How can we assist you today?", sender: "bot" }
      ]);
    }
  }, [open]);

  /* ---------------- FAQ CLICK ---------------- */
  const handleQuestionClick = (faq: any) => {
    setMessages((prev) => [
      ...prev,
      { content: faq.question, sender: "user" },
      { content: faq.answer, sender: "bot" }
    ]);
    setShowAllFaq(false);
  };

  /* ---------------- START LIVE CHAT ---------------- */
  const startLiveChat = async () => {
    if (!appUser) return;

    try {
      // find or create Mongo user
      const { data: userData } = await axios.post(
        `${ENDPOINT}/api/user/find-or-create`,
        {
          name: appUser.name,
          email: appUser.email,
        }
      );

      setMongoUser(userData);

      // access chat with admin
      const { data: chatData } = await axios.post(
        `${ENDPOINT}/api/chat`,
        {
          userId: ADMIN_ID,
          currentUserId: userData._id,
        }
      );

      setSelectedChat(chatData);

      socketRef.current?.emit("join chat", chatData._id);

      // load previous messages
      const messageData = await axios.get(
        `${ENDPOINT}/api/message/${chatData._id}`
      );

      const formatted = messageData.data.map((m: any) => ({
        content: m.content,
        sender: m.sender._id === userData._id ? "user" : "admin"
      }));

      setMessages((prev) => [...prev, ...formatted]);

      setIsLiveChat(true);
      setChatOpen(true);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to start live chat. Please try again.');
    }
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // If not in live chat, treat as FAQ conversation
    if (!isLiveChat) {
      setMessages((prev) => [
        ...prev,
        { content: inputText, sender: "user" }
      ]);
      setInputText("");
      return;
    }

    try {
      const { data } = await axios.post(
        `${ENDPOINT}/api/message`,
        {
          content: inputText,
          chatId: selectedChat._id,
          senderId: mongoUser._id,
        }
      );

      socketRef.current?.emit("new message", data);

      setMessages((prev) => [
        ...prev,
        { content: data.content, sender: "user" }
      ]);

      setInputText("");

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setUnreadCount(0);
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@serveaso.com').catch(err => 
      Alert.alert('Error', 'Could not open email client')
    );
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:080123456789').catch(err => 
      Alert.alert('Error', 'Could not make a call')
    );
  };

  if (!open && !isMinimized) return null;

  return (
    <>
      {/* Minimized Chat Button */}
      {isMinimized && (
        <View style={styles.minimizedButton}>
          <TouchableOpacity onPress={toggleMinimize} style={styles.minimizedButtonContent}>
            <Icon name="chat" size={28} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Container */}
      {open && !isMinimized && (
        <Animated.View
          style={[
            styles.chatContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.chatContent}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            {/* Header Section */}
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              {chatOpen && (
                <TouchableOpacity 
                  onPress={() => {
                    setChatOpen(false);
                    setIsLiveChat(false);
                    setMessages([
                      { content: "Namaste! Welcome to ServEaso. How can we assist you today?", sender: "bot" }
                    ]);
                  }} 
                  style={styles.backButton}
                >
                  <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerText}>Chat Support</Text>
              <View style={styles.headerRightButtons}>
                <TouchableOpacity onPress={toggleMinimize} style={styles.minimizeButton}>
                  <Icon name="chevron-down" size={24} color="#ffffff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Messages and FAQ Section */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    msg.sender === 'user' ? styles.userMessage : 
                    msg.sender === 'admin' ? styles.adminMessage : styles.botMessage,
                  ]}
                >
                  <Text 
                    style={
                      msg.sender === 'user' ? styles.userMessageText : 
                      msg.sender === 'admin' ? styles.adminMessageText : styles.botMessageText
                    }
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}

              {/* FAQ SECTION (Only before live chat starts) */}
              {!isLiveChat && (
                <>
                  <View style={styles.faqContainer}>
                    {(appUser?.role === "CUSTOMER"
                      ? [...generalFaqData, ...customerFaqData]
                      : generalFaqData
                    ).map((faq, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.faqButton}
                        onPress={() => handleQuestionClick(faq)}
                      >
                        <Text style={styles.faqButtonText}>{faq.question}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  {/* Live Chat Button */}
                  {appUser ? (
                    <TouchableOpacity
                      style={styles.chatAssistantButton}
                      onPress={startLiveChat}
                    >
                      <FeatherIcon name="message-circle" size={16} color="#fff" />
                      <Text style={styles.chatAssistantButtonText}>Chat with Assistant</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.loginMessage}>
                      <Text style={styles.loginMessageText}>
                        Please login to chat with our support team.
                      </Text>
                    </View>
                  )}

                  {/* Contact Options */}
                  <View style={styles.contactContainer}>
                    <TouchableOpacity
                      style={styles.supportButton}
                      onPress={handleEmailSupport}
                    >
                      <FeatherIcon name="mail" size={18} color="#3b82f6" />
                      <Text style={styles.supportButtonText}>support@serveaso.com</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.supportButton}
                      onPress={handleCallSupport}
                    >
                      <FeatherIcon name="phone" size={18} color="#10b981" />
                      <Text style={styles.supportButtonText}>080-123456789</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Chat Input Section */}
            {chatOpen && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type your message..."
                  placeholderTextColor="#999"
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <FeatherIcon name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  minimizedButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1001,
  },
  minimizedButtonContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: Dimensions.get('window').width * 0.9,
    maxWidth: 380,
    height: Dimensions.get('window').height * 0.7,
    zIndex: 1000,
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizeButton: {
    marginRight: 15,
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botMessage: {
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  adminMessage: {
    backgroundColor: '#d1d5db',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  userMessage: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botMessageText: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  adminMessageText: {
    color: '#1f2937',
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  faqContainer: {
    marginTop: 10,
  },
  faqButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '100%',
  },
  faqButtonText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'left',
  },
  divider: {
    height: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 15,
  },
  chatAssistantButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  chatAssistantButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  loginMessage: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginMessageText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  contactContainer: {
    marginTop: 10,
  },
  supportButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  supportButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default Chatbot;