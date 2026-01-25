// NotificationClient.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

const SERVICE_PROVIDER_ID = '202'; // ✅ Replace dynamically if needed

const sendWhenReady = (ws: WebSocket, data: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  } else {
    const handleOpen = () => {
      ws.send(JSON.stringify(data));
    };
    ws.addEventListener('open', handleOpen);
    // Remove the listener after it's used
    setTimeout(() => {
      ws.removeEventListener('open', handleOpen);
    }, 5000);
  }
};

const NotificationClient = () => {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    ws.current = new WebSocket('wss://utils-ndt3.onrender.com/');

    // Send IDENTIFY only when ready
    if (ws.current) {
      sendWhenReady(ws.current, {
        type: 'IDENTIFY',
        id: SERVICE_PROVIDER_ID,
      });
    }

    ws.current.onmessage = (event: any) => {
      // Use 'any' type to avoid WebSocketMessageEvent type issues
      const message = event.data;
      console.log('📨 Message received:', message);

      setMessages((prev) => [...prev, message]);
      setPopupMessage(message); // Show popup dialog
    };

    ws.current.onerror = (event: any) => {
      console.error('❌ WebSocket error:', event);
    };

    ws.current.onclose = (event: any) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const handleClosePopup = () => setPopupMessage(null);
  
  const handleView = () => {
    Alert.alert('Notification Details', 'Viewing notification details...');
    setPopupMessage(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📬 Notifications for Service Provider: {SERVICE_PROVIDER_ID}</Text>
      
      {messages.length === 0 ? (
        <Text style={styles.noMessages}>No notifications yet...</Text>
      ) : (
        <ScrollView style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <View key={index} style={styles.messageItem}>
              <Text style={styles.messageText}>{msg}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={!!popupMessage}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePopup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupTitle}>🔔 New Notification</Text>
            <Text style={styles.popupMessage}>{popupMessage}</Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity style={[styles.button, styles.viewButton]} onPress={handleView}>
                <Text style={styles.buttonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={handleClosePopup}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  noMessages: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messageItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  popupMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  popupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  viewButton: {
    backgroundColor: '#007AFF',
  },
  closeButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default NotificationClient;