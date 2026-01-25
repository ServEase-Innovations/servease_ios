import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Linking,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Button } from './Button'; // Your custom button

interface CheckoutWithAgreementProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const CheckoutWithAgreement: React.FC<CheckoutWithAgreementProps> = ({
  open,
  onClose,
  onProceed
}) => {
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    keyFacts: false
  });

  const toggleCheckbox = (name: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const allAgreed = agreements.terms && agreements.privacy && agreements.keyFacts;

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Before You Continue</Text>
          <ScrollView>
            <Text style={styles.subtitle}>
              Please agree to the following before proceeding with your booking:
            </Text>

            <View style={styles.checkboxGroup}>
              {[
                {
                  key: 'keyFacts',
                  text: 'I agree to the ',
                  linkText: 'ServEaso App Terms and Conditions',
                  url: 'https://www.serveaso.com/tnc'
                },
                {
                  key: 'terms',
                  text: 'I agree to the ',
                  linkText: 'ServEaso App Terms and Conditions',
                  url: 'https://www.serveaso.com/tnc'
                },
                {
                  key: 'privacy',
                  text: 'I agree to the ',
                  linkText: 'ServEaso App Privacy Statement',
                  url: 'https://www.servease.com/privacy'
                }
              ].map(({ key, text, linkText, url }) => (
                <Pressable
                  key={key}
                  style={styles.checkboxContainer}
                  onPress={() => toggleCheckbox(key as keyof typeof agreements)}
                >
                  <Icon
                    name={agreements[key as keyof typeof agreements] ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={agreements[key as keyof typeof agreements] ? '#1d4ed8' : '#aaa'}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.label}>
                    {text}
                    <Text style={styles.link} onPress={() => Linking.openURL(url)}>
                      {linkText}
                    </Text>
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onProceed}
              disabled={!allAgreed}
              style={[
                styles.proceedButton,
                !allAgreed && styles.disabledButton
              ]}
            >
              <Text style={[styles.proceedText, !allAgreed && styles.disabledText]}>
                Proceed to Pay
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CheckoutWithAgreement;

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
    color: '#444'
  },
  checkboxGroup: {
    gap: 15
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  link: {
    color: '#1d4ed8',
    textDecorationLine: 'underline'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  cancelText: {
    color: '#555',
    fontWeight: '500'
  },
  proceedButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  proceedText: {
    color: '#fff',
    fontWeight: '600'
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  disabledText: {
    color: '#bdbdbd'
  }
});
