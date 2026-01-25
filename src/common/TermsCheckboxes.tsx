/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, ScrollView } from 'react-native';

export interface TermsCheckboxesProps {
  onChange?: (allAccepted: boolean) => void;
}

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  style?: object;
}

export const TermsCheckboxes: React.FC<TermsCheckboxesProps> = ({ onChange }) => {
  const [termsAccepted, setTermsAccepted] = useState({
    keyFacts: false,
    termsConditions: false,
    privacyPolicy: false,
  });

  // Debug: Log state changes
  useEffect(() => {
    console.log('Terms state changed:', termsAccepted);
  }, [termsAccepted]);

  // Check if all terms are accepted
  const allAccepted = termsAccepted.keyFacts && termsAccepted.termsConditions && termsAccepted.privacyPolicy;

  // Notify parent when acceptance changes
  useEffect(() => {
    console.log('All terms accepted:', allAccepted);
    if (onChange) {
      onChange(allAccepted);
    }
  }, [allAccepted, onChange]);

  const handleCheckboxChange = (term: keyof typeof termsAccepted) => {
    setTermsAccepted((prev) => ({
      ...prev,
      [term]: !prev[term],
    }));
  };

  const handleMasterCheckboxChange = () => {
    const newState = !allAccepted;
    setTermsAccepted({
      keyFacts: newState,
      termsConditions: newState,
      privacyPolicy: newState,
    });
  };

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const Checkbox: React.FC<CheckboxProps> = ({ checked, onPress, style = {} }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          width: 20,
          height: 20,
          borderWidth: 2,
          borderColor: '#4a5568',
          borderRadius: 3,
          marginRight: 8,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: checked ? '#3182ce' : 'transparent',
        },
        style,
      ]}
    >
      {checked && (
        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ marginTop: 16 }}>
      <ScrollView>
        {/* Master Checkbox */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Checkbox
            checked={allAccepted}
            onPress={handleMasterCheckboxChange}
          />
          <Text style={{ color: '#4a5568', fontWeight: '500', fontSize: 14, flex: 1 }}>
            Please review and agree to the following policies before proceeding.
          </Text>
        </View>

        {/* Key Facts */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 8 }}>
          <Checkbox
            checked={termsAccepted.keyFacts}
            onPress={() => handleCheckboxChange('keyFacts')}
          />
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => handleCheckboxChange('keyFacts')}
          >
            <Text style={{ color: '#4a5568', fontSize: 14 }}>
              I agree to the ServEaso{' '}
              <Text
                style={{ color: '#3182ce', textDecorationLine: 'underline' }}
                onPress={() => handleLinkPress('/KeyFactsStatement')}
              >
                Key Facts Statement
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms & Conditions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 8 }}>
          <Checkbox
            checked={termsAccepted.termsConditions}
            onPress={() => handleCheckboxChange('termsConditions')}
          />
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => handleCheckboxChange('termsConditions')}
          >
            <Text style={{ color: '#4a5568', fontSize: 14 }}>
              I agree to the ServEaso{' '}
              <Text
                style={{ color: '#3182ce', textDecorationLine: 'underline' }}
                onPress={() => handleLinkPress('/TnC')}
              >
                Terms and Conditions
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 8 }}>
          <Checkbox
            checked={termsAccepted.privacyPolicy}
            onPress={() => handleCheckboxChange('privacyPolicy')}
          />
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => handleCheckboxChange('privacyPolicy')}
          >
            <Text style={{ color: '#4a5568', fontSize: 14 }}>
              I agree to the ServEaso{' '}
              <Text
                style={{ color: '#3182ce', textDecorationLine: 'underline' }}
                onPress={() => handleLinkPress('/Privacy')}
              >
                Privacy Statement
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};