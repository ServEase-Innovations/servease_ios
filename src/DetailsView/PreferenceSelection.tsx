import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface Service {
  Type: string;
  Categories: string;
  'Price /Month (INR)': number;
  'Price /Day (INR)': number;
  [key: string]: any; // For any additional dynamic properties
}

interface BookingType {
  service?: string;
  bookingPreference?: string;
  morningSelection?: boolean;
  eveningSelection?: boolean;
  [key: string]: any;
}

interface PricingState {
  cook?: Service[];
  groupedServices?: {
    cook?: Service[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface RootState {
  pricing: PricingState;
  bookingType: {
    value: BookingType;
    [key: string]: any;
  };
  [key: string]: any;
}

const PreferenceSelection = () => {
  const pricing = useSelector((state: RootState) => state.pricing?.groupedServices);
  const bookingType = useSelector((state: RootState) => state.bookingType?.value);
  const [selecteditem, setSelectedItems] = useState<Service[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [personCount, setPersonCount] = useState<string>('');

  const cookServices: Service[] =
    pricing?.cook?.filter((service: Service) => service.Type === "Regular") || [];

  console.log("cookServices", cookServices);

  const getText = () => {
    if (bookingType?.service?.toLowerCase() === "cook") {
      return "Meal Type";
    } else {
      return "Meal Type";
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handlePersonCountChange = (text: string) => {
    setPersonCount(text);
  };

  useEffect(() => {
    console.log("Selected Categories Updated:", selectedCategories);
    console.log("Person Count Updated:", personCount);
    console.log("cook pricning", cookServices);
    calculatePriceAndEntry();
  }, [selectedCategories, personCount]);

  const calculatePriceAndEntry = () => {
    let totalPrice = 0;
    const count = parseInt(personCount) || 0;
    
    selectedCategories.forEach((category) => {
      const categoryData = cookServices.find((item: Service) => item.Categories === category);
      console.log("categoryData", categoryData);
      if (categoryData) {
        console.log("categoryData found ", categoryData);
        totalPrice += getPeopleCount(categoryData, count);
        setSelectedItems((prevState: Service[]) => 
          prevState.includes(categoryData) 
            ? prevState.filter(item => item === categoryData)
            : [...prevState, categoryData]
        );
      }
    });

    console.log("Total Price:", selecteditem);
    console.log("total Price , ", totalPrice);
  };

  const getPeopleCount = (data: Service, paxToNumber: number) => {
    let field = "";
    if (bookingType?.bookingPreference != "Date") {
      field = "Price /Month (INR)";
    } else {
      field = "Price /Day (INR)";
    }

    const basePrice = data[field];
  
    if (paxToNumber <= 3) {
      return basePrice;
    } else if (paxToNumber > 3 && paxToNumber <= 6) {
      const extraPeople = paxToNumber - 3;
      const increasedPrice = basePrice + basePrice * 0.2 * extraPeople;
      return increasedPrice;
    } else if (paxToNumber > 6 && paxToNumber <= 9) {
      const extraPeopleTier1 = 3;
      const priceForTier1 = basePrice + basePrice * 0.2 * extraPeopleTier1;
      const extraPeopleTier2 = paxToNumber - 6;
      const increasedPrice = priceForTier1 + priceForTier1 * 0.1 * extraPeopleTier2;
      return increasedPrice;
    } else if (paxToNumber > 9) {
      const extraPeopleTier1 = 3;
      const priceForTier1 = basePrice + basePrice * 0.2 * extraPeopleTier1;
      const extraPeopleTier2 = 3;
      const priceForTier2 = priceForTier1 + priceForTier1 * 0.1 * extraPeopleTier2;
      const extraPeopleTier3 = paxToNumber - 9;
      const increasedPrice = priceForTier2 + priceForTier2 * 0.05 * extraPeopleTier3;
      return increasedPrice;
    }
    return 0;
  };

  const handleCheckout = () => {
    console.log("Selected Categories:", selectedCategories);
    console.log("Person Count:", personCount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{getText()}:</Text>
      <View style={styles.optionsContainer}>
        {cookServices.map((service: Service, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedCategories.includes(service.Categories) && styles.selectedOption
            ]}
            onPress={() => handleCategoryChange(service.Categories)}
          >
            <Text style={styles.optionText}>{service.Categories}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.personCountContainer}>
          <Text style={styles.label}>No. of Persons :</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={personCount}
            onChangeText={handlePersonCountChange}
            placeholder="Enter number"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionsContainer: {
    marginTop: 8,
  },
  option: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  selectedOption: {
    backgroundColor: '#d0e0ff',
  },
  optionText: {
    fontSize: 14,
  },
  personCountContainer: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
});

export default PreferenceSelection;