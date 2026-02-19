import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TermsCheckboxesProps {
  onChange: (allAccepted: boolean) => void;
  onIndividualChange?: (values: { keyFacts: boolean; terms: boolean; privacy: boolean }) => void;
  onLinkPress: (type: 'terms' | 'privacy' | 'keyfacts') => void;
  initialValues?: {
    keyFacts: boolean;
    terms: boolean;
    privacy: boolean;
  };
}

export const TermsCheckboxes: React.FC<TermsCheckboxesProps> = ({
  onChange,
  onIndividualChange,
  onLinkPress,
  initialValues = { keyFacts: false, terms: false, privacy: false },
}) => {
  const [checkAll, setCheckAll] = useState(false);
  const [keyFacts, setKeyFacts] = useState(initialValues.keyFacts);
  const [terms, setTerms] = useState(initialValues.terms);
  const [privacy, setPrivacy] = useState(initialValues.privacy);

  // Update local state when initialValues change
  useEffect(() => {
    setKeyFacts(initialValues.keyFacts);
    setTerms(initialValues.terms);
    setPrivacy(initialValues.privacy);
    
    // Update checkAll based on all three checkboxes
    setCheckAll(initialValues.keyFacts && initialValues.terms && initialValues.privacy);
  }, [initialValues]);

  // Handle Check All - toggles all individual checkboxes
  const handleCheckAll = () => {
    const newValue = !checkAll;
    setCheckAll(newValue);
    setKeyFacts(newValue);
    setTerms(newValue);
    setPrivacy(newValue);
    onChange(newValue);
    
    // Notify parent about individual changes
    if (onIndividualChange) {
      onIndividualChange({
        keyFacts: newValue,
        terms: newValue,
        privacy: newValue
      });
    }
  };

  // Handle individual checkbox - toggles single checkbox
  const handleIndividualCheck = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    currentValue: boolean,
    type: 'keyFacts' | 'terms' | 'privacy'
  ) => {
    const newValue = !currentValue;
    setter(newValue);
    
    // Update the specific form field
    let newKeyFacts = keyFacts;
    let newTerms = terms;
    let newPrivacy = privacy;
    
    if (type === 'keyFacts') {
      newKeyFacts = newValue;
    } else if (type === 'terms') {
      newTerms = newValue;
    } else if (type === 'privacy') {
      newPrivacy = newValue;
    }
    
    // Check if all are now checked
    const allChecked = newKeyFacts && newTerms && newPrivacy;
    setCheckAll(allChecked);
    
    // Notify parent component about the change
    onChange(allChecked);
    
    // Notify parent about individual changes
    if (onIndividualChange) {
      onIndividualChange({
        keyFacts: newKeyFacts,
        terms: newTerms,
        privacy: newPrivacy
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Instruction text */}
      <Text style={styles.instructionText}>
        Please review and agree to the following policies before proceeding.
      </Text>

      {/* Check All option - toggles all checkboxes when clicked */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={handleCheckAll}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checkAll && styles.checkboxChecked]}>
          {checkAll && <Icon name="check" size={18} color="#fff" />}
        </View>
        <Text style={[styles.checkboxLabel, styles.checkAllLabel]}>
          I agree to all the terms and policies
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Key Facts Statement - Individual checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => handleIndividualCheck(setKeyFacts, keyFacts, 'keyFacts')}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, keyFacts && styles.checkboxChecked]}>
          {keyFacts && <Icon name="check" size={18} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text
            style={styles.linkText}
            onPress={() => onLinkPress('keyfacts')}
          >
            ServEaso Key Facts Statement
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Terms and Conditions - Individual checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => handleIndividualCheck(setTerms, terms, 'terms')}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, terms && styles.checkboxChecked]}>
          {terms && <Icon name="check" size={18} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text
            style={styles.linkText}
            onPress={() => onLinkPress('terms')}
          >
            ServEaso Terms and Conditions
          </Text>
        </Text>
      </TouchableOpacity>

      {/* Privacy Statement - Individual checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => handleIndividualCheck(setPrivacy, privacy, 'privacy')}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, privacy && styles.checkboxChecked]}>
          {privacy && <Icon name="check" size={18} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text
            style={styles.linkText}
            onPress={() => onLinkPress('privacy')}
          >
            ServEaso Privacy Statement
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1976d2',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  checkAllLabel: {
    fontWeight: '600',
    color: '#1976d2',
  },
  linkText: {
    color: '#1976d2',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
});

export default TermsCheckboxes;