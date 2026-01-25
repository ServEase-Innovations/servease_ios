import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { add } from '../features/userSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface UserProfileProps {
  goBack: () => void;
}

type FormSection = 'account' | 'location' | 'additional';

interface FormData {
  account: {
    firstName: string;
    lastName: string;
    mobileNo: string;
    emailId: string;
    age: string;
  };
  location: {
    buildingName: string;
    locality: string;
    street: string;
    pincode: string;
    nearbyLocation: string;
    currentLocation: string;
  };
  additional: {
    idNo: string;
    languageKnown: string;
    housekeepingRole: string;
    cookingSpeciality: string;
    diet: string;
  };
}

const UserProfile: React.FC<UserProfileProps> = ({ goBack }) => {
  const dispatch = useDispatch();
  const userData = useSelector((state: any) => state.user.value);
  const [expandedSections, setExpandedSections] = useState({
    account: true,
    location: false,
    additional: false,
  });

  const [formData, setFormData] = useState<FormData>({
    account: {
      firstName: '',
      lastName: '',
      mobileNo: '',
      emailId: '',
      age: '',
    },
    location: {
      buildingName: '',
      locality: '',
      street: '',
      pincode: '',
      nearbyLocation: '',
      currentLocation: '',
    },
    additional: {
      idNo: '',
      languageKnown: '',
      housekeepingRole: '',
      cookingSpeciality: '',
      diet: '',
    },
  });

  // Populate formData from Redux store
  useEffect(() => {
    if (userData) {
      console.log('user Data ===> ', userData);
      let userInfo;
      if (userData.role === 'SERVICE_PROVIDER') {
        userInfo = userData.serviceProviderDetails;
      } else if (userData.role === 'CUSTOMER') {
        userInfo = userData.customerDetails;
      }
      setFormData({
        account: {
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          mobileNo: userInfo.mobileNo || '',
          emailId: userInfo.emailId || '',
          age: userInfo.age || '',
        },
        location: {
          buildingName: userInfo.buildingName || '',
          locality: userInfo.locality || '',
          street: userInfo.street || '',
          pincode: userInfo.pincode || '',
          nearbyLocation: userInfo.nearbyLocation || '',
          currentLocation: userInfo.currentLocation || '',
        },
        additional: {
          idNo: userInfo.idNo || '',
          languageKnown: userInfo.languageKnown || '',
          housekeepingRole: userInfo.housekeepingRole || '',
          cookingSpeciality: userInfo.cookingSpeciality || '',
          diet: userInfo.diet || '',
        },
      });
    }
  }, [userData]);

  const handleChange = <T extends FormSection>(
    section: T,
    field: keyof FormData[T],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const toggleSection = (section: FormSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = () => {
    const updatedData = {
      ...formData.account,
      ...formData.location,
      ...formData.additional,
    };

    dispatch(add(updatedData));
    Alert.alert('Success', 'Form data updated successfully!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('account')}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Icon
            name={expandedSections.account ? 'expand-less' : 'expand-more'}
            size={24}
          />
        </TouchableOpacity>
        {expandedSections.account && (
          <View style={styles.sectionContent}>
            <TextInput
              placeholder="First Name"
              style={styles.input}
              value={formData.account.firstName}
              onChangeText={(text) => handleChange('account', 'firstName', text)}
            />
            <TextInput
              placeholder="Last Name"
              style={styles.input}
              value={formData.account.lastName}
              onChangeText={(text) => handleChange('account', 'lastName', text)}
            />
            <TextInput
              placeholder="Mobile Number"
              style={styles.input}
              value={formData.account.mobileNo}
              onChangeText={(text) => handleChange('account', 'mobileNo', text)}
              keyboardType="phone-pad"
            />
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={formData.account.emailId}
              onChangeText={(text) => handleChange('account', 'emailId', text)}
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Age"
              style={styles.input}
              value={formData.account.age}
              onChangeText={(text) => handleChange('account', 'age', text)}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('location')}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <Icon
            name={expandedSections.location ? 'expand-less' : 'expand-more'}
            size={24}
          />
        </TouchableOpacity>
        {expandedSections.location && (
          <View style={styles.sectionContent}>
            <TextInput
              placeholder="Building Name"
              style={styles.input}
              value={formData.location.buildingName}
              onChangeText={(text) =>
                handleChange('location', 'buildingName', text)
              }
            />
            <TextInput
              placeholder="Locality"
              style={styles.input}
              value={formData.location.locality}
              onChangeText={(text) =>
                handleChange('location', 'locality', text)
              }
            />
            <TextInput
              placeholder="Street"
              style={styles.input}
              value={formData.location.street}
              onChangeText={(text) => handleChange('location', 'street', text)}
            />
            <TextInput
              placeholder="Pin Code"
              style={styles.input}
              value={formData.location.pincode}
              onChangeText={(text) =>
                handleChange('location', 'pincode', text)
              }
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Nearby Location"
              style={styles.input}
              value={formData.location.nearbyLocation}
              onChangeText={(text) =>
                handleChange('location', 'nearbyLocation', text)
              }
            />
            <TextInput
              placeholder="Current Location"
              style={styles.input}
              value={formData.location.currentLocation}
              onChangeText={(text) =>
                handleChange('location', 'currentLocation', text)
              }
            />
          </View>
        )}
      </View>

      {/* Additional Details Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('additional')}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <Icon
            name={expandedSections.additional ? 'expand-less' : 'expand-more'}
            size={24}
          />
        </TouchableOpacity>
        {expandedSections.additional && (
          <View style={styles.sectionContent}>
            <TextInput
              placeholder="Aadhaar Card Number"
              style={styles.input}
              value={formData.additional.idNo}
              onChangeText={(text) => handleChange('additional', 'idNo', text)}
            />
            <TextInput
              placeholder="Languages"
              style={styles.input}
              value={formData.additional.languageKnown}
              onChangeText={(text) =>
                handleChange('additional', 'languageKnown', text)
              }
            />
            <TextInput
              placeholder="Housekeeping Role"
              style={styles.input}
              value={formData.additional.housekeepingRole}
              onChangeText={(text) =>
                handleChange('additional', 'housekeepingRole', text)
              }
            />
            <TextInput
              placeholder="Cooking Speciality"
              style={styles.input}
              value={formData.additional.cookingSpeciality}
              onChangeText={(text) =>
                handleChange('additional', 'cookingSpeciality', text)
              }
            />
            <TextInput
              placeholder="Diet"
              style={styles.input}
              value={formData.additional.diet}
              onChangeText={(text) => handleChange('additional', 'diet', text)}
            />
          </View>
        )}
      </View>

      {/* Save Button */}
      <Button title="Save" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'beige',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
});

export default UserProfile;