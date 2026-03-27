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
  
  const [showViewAllBtn, setShowViewAllBtn] = useState(false);
  const [showAccordion, setShowAccordion] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [mongoUser, setMongoUser] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  /* ---------------- DETECT MOBILE DEVICE ---------------- */
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = Dimensions.get('window').width <= 768 || 
        Platform.OS !== 'web';
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

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
  }, [messages]);

  /* ---------------- AUTO SCROLL TO ACCORDION ---------------- */
  useEffect(() => {
    if (showAccordion && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [showAccordion]);

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
      setChatOpen(false);
      setIsLiveChat(false);
      setShowAccordion(true);
      setShowViewAllBtn(false);
      setExpandedFaq(null);
      setMessages([
        { content: "Namaste! Welcome to ServEaso. How can we assist you today?", sender: "bot" }
      ]);
    }
  }, [open]);

  /* ---------------- FAQ CLICK ---------------- */
  const handleQuestionClick = (faq: any, index: number) => {
    // Toggle accordion expansion
    setExpandedFaq(expandedFaq === index ? null : index);
    
    // Add question and answer to chat
    setMessages((prev) => [
      ...prev,
      { content: faq.question, sender: "user" },
      { content: faq.answer, sender: "bot" }
    ]);
    setShowViewAllBtn(true);
    setShowAccordion(false);
  };

  /* ---------------- BACK BUTTON HANDLER ---------------- */
  const handleBackClick = () => {
    setChatOpen(false);
    setIsLiveChat(false);
    setShowAccordion(true);
    setShowViewAllBtn(false);
    setExpandedFaq(null);
    setMessages([
      { content: "Namaste! Welcome to ServEaso. How can we assist you today?", sender: "bot" }
    ]);
  };

  /* ---------------- START LIVE CHAT ---------------- */
  const startLiveChat = async () => {
    if (!appUser) return;

    try {
      const { data: userData } = await axios.post(
        `${ENDPOINT}/api/user/find-or-create`,
        {
          name: appUser.name,
          email: appUser.email,
        }
      );

      setMongoUser(userData);

      const { data: chatData } = await axios.post(
        `${ENDPOINT}/api/chat`,
        {
          userId: ADMIN_ID,
          currentUserId: userData._id,
        }
      );

      setSelectedChat(chatData);

      socketRef.current?.emit("join chat", chatData._id);

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
      
      setShowViewAllBtn(false);
      setShowAccordion(false);
      setExpandedFaq(null);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to start live chat. Please try again.');
    }
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

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

  if (!open) return null;

  const allFaqs = appUser?.role === "CUSTOMER" 
    ? [...generalFaqData, ...customerFaqData]
    : generalFaqData;

  return (
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
              onPress={handleBackClick} 
              style={styles.backButton}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerText}>Chat Support</Text>
          <View style={styles.headerRightButtons}>
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
              {showAccordion && (
                <View style={styles.faqContainer}>
                  <Text style={styles.faqTitle}>FAQs:</Text>
                  {allFaqs.map((faq, index) => (
                    <View key={index} style={styles.accordionItem}>
                      <TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() => handleQuestionClick(faq, index)}
                      >
                        <Text style={styles.accordionQuestion}>{faq.question}</Text>
                        <Icon 
                          name={expandedFaq === index ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#666" 
                        />
                      </TouchableOpacity>
                      {expandedFaq === index && (
                        <View style={styles.accordionContent}>
                          <Text style={styles.accordionAnswer}>{faq.answer}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {showViewAllBtn && !showAccordion && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    setShowAccordion(true);
                    setExpandedFaq(null);
                  }}
                >
                  <Text style={styles.viewAllButtonText}>View All FAQs</Text>
                </TouchableOpacity>
              )}

              {showViewAllBtn && showAccordion && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    setShowAccordion(false);
                    setExpandedFaq(null);
                  }}
                >
                  <Text style={styles.viewAllButtonText}>Hide FAQs</Text>
                </TouchableOpacity>
              )}

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
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    position: 'absolute',
    bottom: 20,
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
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messagesContent: {
    padding: 10,
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
  faqTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  accordionItem: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  accordionQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 10,
  },
  accordionContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  accordionAnswer: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  viewAllButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
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