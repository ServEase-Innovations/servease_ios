// LocationSelector.tsx - Updated version
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  FlatList,
  PermissionsAndroid,
} from "react-native";
import axios from "axios";
import { keys } from "../env";
import Icon from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Geocoder from "react-native-geocoding";
import MapView, { Marker } from "react-native-maps";
import { NativeModules } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { useDispatch, useSelector } from "react-redux";
import { add } from "../features/userSlice";
import { addLocation } from "../features/geoLocationSlice";
import { useAppUser } from "../context/AppUserContext";
import LinearGradient from "react-native-linear-gradient";

Geocoder.init(keys.api_key);

const { width } = Dimensions.get("window");

// Updated interface to include location data
interface LocationData {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address?: any[];
}

interface LocationSelectorProps {
  userPreference: any;
  setUserPreference: (preference: any) => void;
  onLocationChange?: (location: string, locationData?: LocationData) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  userPreference,
  setUserPreference,
  onLocationChange,
}) => {
  console.log("User Preference in LocationSelector:", userPreference);
  const dispatch = useDispatch();
  const locationDispatch = useDispatch();
  const { appUser } = useAppUser(); // Using AppUser context
  
  const [location, setLocation] = useState("");
  const [locationAs, setLocationAs] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([
    { name: "Detect Location", index: 1 },
    { name: "Add Address", index: 2 },
  ]);
  const [dataFromMap, setDataFromMap] = useState<LocationData | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [showGPSButton, setShowGPSButton] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [OpenSaveOptionForSave, setOpenSaveOptionForSave] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [permissionDeniedPermanently, setPermissionDeniedPermanently] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // New states for pin selection
  const [selectedPinLocation, setSelectedPinLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPinAddress, setSelectedPinAddress] = useState("");
  const [isPinSelected, setIsPinSelected] = useState(false);

  // New states for search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = appUser && appUser.customerid;

  // Helper function to create location data object
  const createLocationData = (lat: number, lng: number, addr: string): LocationData => {
    return {
      formatted_address: addr,
      geometry: {
        location: {
          lat: lat,
          lng: lng
        }
      },
      address: [
        {
          formatted_address: addr,
          geometry: {
            location: {
              lat: lat,
              lng: lng
            }
          }
        }
      ]
    };
  };

  // Search location function
  const searchLocation = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            "User-Agent": "ReactNativeApp",
            "Accept-Language": "en",
          },
        }
      );

      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching location:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle location selection from search results
  const handleLocationSelect = async (location: any) => {
    const { lat, lon, display_name } = location;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    setSelectedPinLocation({ latitude, longitude });
    setSelectedPinAddress(display_name);
    setAddress(display_name);
    setIsPinSelected(true);
    setShowSearchResults(false);
    setSearchQuery("");

    // Update map region to show selected location
    setLatitude(latitude);
    setLongitude(longitude);

    // Create location data and notify parent
    const locationData = createLocationData(latitude, longitude, display_name);
    setDataFromMap(locationData);
    onLocationChange?.(display_name, locationData);
  };

  const checkLocationPermission = async (): Promise<boolean> => {
    try {
      
      if (Platform.OS === "android") {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (hasPermission) {
          getCurrentLocation();
          return true;
        }
        return false;
      } else {
        getCurrentLocation();
        return true;
      }
    } catch (err) {
      console.warn("Error checking location permission:", err);
      return false;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (permissionDeniedPermanently) {
      Alert.alert(
        "Permission Denied",
        "Location permission was permanently denied. Please enable it in device settings.",
        [
          {
            text: "Open Settings",
            onPress: () => handleOpenSettings(),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
      return false;
    }

    if (hasRequestedPermission) {
      return checkLocationPermission();
    }

    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "We need access to your location to provide better service",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        setHasRequestedPermission(true);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          setPermissionDeniedPermanently(true);
          Alert.alert(
            "Permission Denied",
            "Location permission is required. Please enable it in device settings.",
            [
              {
                text: "Open Settings",
                onPress: () => handleOpenSettings(),
              },
              {
                text: "Cancel",
                style: "cancel",
              },
            ]
          );
          return false;
        } else {
          return false;
        }
      } else {
        getCurrentLocation();
        return true;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getCurrentLocation = () => {
    if (locationWatchId !== null) {
      Geolocation.clearWatch(locationWatchId);
    }

    const watchId = Geolocation.watchPosition(
      async (position) => {
        if (locationWatchId !== null) {
          Geolocation.clearWatch(locationWatchId);
          setLocationWatchId(null);
        }

        const { latitude, longitude } = position.coords;
        locationDispatch(addLocation(position.coords));
        setLatitude(latitude);
        setLongitude(longitude);
        

        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                "User-Agent": "ReactNativeApp",
                "Accept-Language": "en",
              },
            }
          );

          if (res.data?.display_name) {
            const newLocation = res.data.display_name;
            setLocation(newLocation);
            setAddress(newLocation);
            
            // Create location data object with coordinates
            const locationData = createLocationData(latitude, longitude, newLocation);
            setDataFromMap(locationData);
            onLocationChange?.(newLocation, locationData);
          }
        } catch (error) {
          console.error("Error getting address:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Location error:", error);

        if (locationWatchId !== null) {
          Geolocation.clearWatch(locationWatchId);
          setLocationWatchId(null);
        }

        let errorMessage = "Unable to fetch location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services in settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please check your network connection and try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please ensure you have a clear view of the sky and try again.";
            break;
        }

        Alert.alert("Location Error", errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
        distanceFilter: 10,
      }
    );

    setLocationWatchId(watchId);
  };

  const checkLocationAccuracy = async (): Promise<void> => {
    if (Platform.OS === "android") {
      try {
        const locationMode = await NativeModules.LocationSettings.getLocationMode();

        if (locationMode !== "high_accuracy") {
          Alert.alert(
            "High Accuracy Recommended",
            "For best results, please enable high accuracy location mode in your device settings.",
            [
              {
                text: "Open Settings",
                onPress: () => handleOpenSettings(),
              },
              { text: "Continue Anyway", onPress: () => {} },
            ]
          );
        }
      } catch (err) {
        console.warn("Error checking location accuracy:", err);
      }
    }
  };

  const checkLocationServices = async (): Promise<boolean> => {
    try {
      if (Platform.OS === "android") {
        const locationMode = await NativeModules.LocationSettings.getLocationMode();
        return locationMode !== "off";
      }
      return true;
    } catch (err) {
      console.warn("Error checking location services:", err);
      return false;
    }
  };

  const handleOpenSettings = async () => {
    if (Platform.OS === 'android') {
      try {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      } catch (error) {
        console.warn('Error opening location settings:', error);
        await Linking.openSettings();
      }
    } else {
      await Linking.openSettings();
    }
  };

  const getAddressFromCoords = async (lat: number, lon: number): Promise<string> => {
    try {
      const res = await Geocoder.from(lat, lon);
      const addressComponent = res.results?.[0]?.formatted_address;
      if (addressComponent) {
        return addressComponent;
      }
      return "Address not available";
    } catch (error) {
      console.warn("Geocoder error:", error);
      return "Address not available";
    }
  };

  const fetchLocation = () => {
    setLoading(true);
    setShowGPSButton(false);
    getCurrentLocation();
  };

  const fetchLocationWithChecks = async () => {
    setIsCheckingLocation(true);
    setLoading(true);

    try {
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable device location services to continue.",
          [
            {
              text: "Enable Location",
              onPress: () => handleOpenSettings(),
            },
            { 
              text: "Cancel", 
              style: "cancel",
              onPress: () => {
                setShowGPSButton(true);
                setIsCheckingLocation(false);
                setLoading(false);
              }
            },
          ]
        );
        return;
      }

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setIsCheckingLocation(false);
        setLoading(false);
        return;
      }

      await checkLocationAccuracy();
      fetchLocation();
    } catch (error) {
      console.warn("Location fetch error:", error);
      setShowGPSButton(true);
    } finally {
      setIsCheckingLocation(false);
    }
  };

  const handleLocationRefresh = async () => {
    await fetchLocationWithChecks();
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedPinLocation(coordinate);
    setIsPinSelected(true);
    
    try {
      const address = await getAddressFromCoords(coordinate.latitude, coordinate.longitude);
      setSelectedPinAddress(address);
      setAddress(address);

      // Create location data and notify parent
      const locationData = createLocationData(coordinate.latitude, coordinate.longitude, address);
      setDataFromMap(locationData);
      onLocationChange?.(address, locationData);
    } catch (error) {
      console.warn("Error getting address for selected pin:", error);
      setSelectedPinAddress("Address not available");
    }
  };

  const handleUseCurrentLocation = () => {
    setIsPinSelected(false);
    setSelectedPinLocation(null);
    setSelectedPinAddress("");
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    if (latitude && longitude) {
      getAddressFromCoords(latitude, longitude)
        .then((addr) => {
          setAddress(addr);
          const locationData = createLocationData(latitude, longitude, addr);
          setDataFromMap(locationData);
          onLocationChange?.(addr, locationData);
        })
        .catch(console.error);
    }
  };

  const handleChange = (newValue: string) => {
    console.log("➡️ New Value Selected:", newValue);
    
    if (newValue === "Add Address") {
      setLoading(false);
      setIsCheckingLocation(false);
      setShowGPSButton(false);
      // Check authentication before opening address modal
      if (!isAuthenticated) {
        Alert.alert(
          "Authentication Required",
          "Please login to save locations.",
          [
            { text: "OK", style: "default" }
          ]
        );
        return;
      }
      setOpen(true);
      setIsPinSelected(false);
      setSelectedPinLocation(null);
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    } else if (newValue === "Detect Location") {
      fetchLocationWithChecks();
    } else {
      console.log("➡️ Selected Saved Location:", newValue);
      console.log("🗂️ User Preferences:", userPreference);
      
      // Check if userPreference has data
      if (!userPreference || (Array.isArray(userPreference) && userPreference.length === 0)) {
        console.error("userPreference is empty or undefined");
        Alert.alert("Error", "No saved locations found.");
        return;
      }
      
      // Handle both array and object formats
      let savedLocations = [];
      if (Array.isArray(userPreference) && userPreference[0]?.savedLocations) {
        savedLocations = userPreference[0].savedLocations;
      } else if (userPreference?.savedLocations) {
        savedLocations = userPreference.savedLocations;
      }
      
      console.log("📌 Saved locations from userPreference:", savedLocations);
      
      // Find the location - use exact match first, then case-insensitive
      const savedLocation = savedLocations.find(
        (location: any) => location.name === newValue
      ) || savedLocations.find(
        (location: any) => location.name?.toLowerCase() === newValue.toLowerCase()
      );
      
      if (savedLocation?.location) {
        console.log("✅ Found saved location:", savedLocation.location);
        
        let addressToSet = "";
        let locationData = savedLocation.location;
        
        // Handle different location data structures
        if (locationData.address && Array.isArray(locationData.address) && locationData.address[0]?.formatted_address) {
          addressToSet = locationData.address[0].formatted_address;
        } else if (locationData.formatted_address) {
          addressToSet = locationData.formatted_address;
        } else if (typeof locationData === 'string') {
          addressToSet = locationData;
        }
        
        if (addressToSet) {
          console.log("✅ Setting location to:", addressToSet);
          setLocation(addressToSet);
          dispatch(add(savedLocation.location));
          onLocationChange?.(addressToSet, savedLocation.location);
          
          // Update map coordinates if available
          if (savedLocation.location.geometry?.location) {
            setLatitude(savedLocation.location.geometry.location.lat);
            setLongitude(savedLocation.location.geometry.location.lng);
          }
        } else {
          console.warn("❌ No valid address found in saved location");
          Alert.alert("Error", "Could not retrieve address from saved location.");
        }
      } else {
        console.warn("❌ No matching location found for:", newValue);
        console.log("Available saved locations:", savedLocations);
        Alert.alert("Not Found", `Location "${newValue}" not found in your saved locations.`);
      }
    }
  };

  const handleLocationSave = () => {
    let locationData: LocationData | null = null;

    if (isPinSelected && selectedPinLocation) {
      setLatitude(selectedPinLocation.latitude);
      setLongitude(selectedPinLocation.longitude);
      const newLocation = selectedPinAddress;
      setLocation(newLocation);
      setAddress(newLocation);
      
      locationData = createLocationData(
        selectedPinLocation.latitude, 
        selectedPinLocation.longitude, 
        selectedPinAddress
      );
      
      setDataFromMap(locationData);
      onLocationChange?.(newLocation, locationData);
    } else {
      if (address && latitude && longitude) {
        setLocation(address);
        locationData = createLocationData(latitude, longitude, address);
        setDataFromMap(locationData);
        onLocationChange?.(address, locationData);
      }
    }
    
    setOpen(false);
    
    // Check authentication before showing save options
    if (!isAuthenticated) {
      Alert.alert(
        "Authentication Required",
        "Please login to save locations.",
        [
          { text: "OK", style: "default" }
        ]
      );
      return;
    }
    
    setOpenSaveOptionForSave(true);
    setIsPinSelected(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const locationHandleSave = async () => {
    console.log("Location saved as:", locationAs);
    console.log("User preference:", userPreference);
    console.log("Location data:", dataFromMap);
    
    setIsSaving(true);
    
    try {
      await updateUserSetting();
      
      Alert.alert("Success", "Location saved successfully!");
      
      // Close dialog after a short delay
      setTimeout(() => {
        setOpenSaveOptionForSave(false);
        setLocationAs("");
        setIsSaving(false);
      }, 500);
      
    } catch (error: any) {
      console.error("Error saving location:", error);
      
      Alert.alert("Error", "Failed to save location. Please try again.");
      
      setIsSaving(false);
    }
  };

 const updateUserSetting = async () => {
  // Use appUser for authentication check
  if (!appUser) {
    throw new Error("User authentication required. Please login again.");
  }

  if (!appUser.customerid) {
    throw new Error("User profile not loaded properly. Please try again.");
  }

  if (!locationAs || locationAs.trim() === "") {
    throw new Error("Please enter a name for this location (Home, Office, or custom name).");
  }

  if (!dataFromMap) {
    throw new Error("No valid location data found. Please select a location first.");
  }

  const newLocation = {
    name: locationAs.trim(),
    location: dataFromMap,
  };

  console.log("➕ New location to add:", newLocation);

  // Get existing locations with proper type annotation
  let existingLocations: any[] = [];
  if (Array.isArray(userPreference) && userPreference[0]?.savedLocations) {
    existingLocations = [...userPreference[0].savedLocations];
  } else if (userPreference?.savedLocations) {
    existingLocations = [...userPreference.savedLocations];
  }

  // Check if location with same name already exists
  const existingLocationIndex = existingLocations.findIndex(
    (loc: any) => loc.name.toLowerCase() === locationAs.trim().toLowerCase()
  );

  let updatedLocations;
  if (existingLocationIndex !== -1) {
    // Update existing location
    updatedLocations = [...existingLocations];
    updatedLocations[existingLocationIndex] = newLocation;
  } else {
    // Add new location
    updatedLocations = [...existingLocations, newLocation];
  }

  const payload = {
    customerId: appUser.customerid,
    savedLocations: updatedLocations,
  };

  console.log("📤 Updating user settings with payload:", payload);
  
  const response = await axios.put(
    `https://utils-ndt3.onrender.com/user-settings/${appUser.customerid}`,
    payload
  );

  if (response.status === 200 || response.status === 201) {
    console.log("✅ User settings updated successfully");
    
    // Update local state with proper structure
    const updatedUserPreference = {
      customerId: appUser.customerid,
      savedLocations: updatedLocations
    };
    
    setUserPreference(updatedUserPreference);
    
    // Update suggestions
    const baseSuggestions = [
      { name: "Detect Location", index: 1 },
      { name: "Add Address", index: 2 },
    ];
    const savedLocationSuggestions = updatedLocations.map((loc: any, i: number) => ({
      name: loc.name,
      index: i + 3,
    }));
    
    const newSuggestions = [...baseSuggestions, ...savedLocationSuggestions];
    console.log("🔄 Updated suggestions:", newSuggestions);
    setSuggestions(newSuggestions);
    
    return response.data;
  } else {
    throw new Error(`Unexpected response: ${response.status}`);
  }
};

  const handleUserPreference = (preference?: string) => {
    console.log("User preference selected: ", preference);

    if (!preference) {
      setShowInput(true);
      setLocationAs("");
    } else {
      setShowInput(false);
      setLocationAs(preference);
    }
  };

  useEffect(() => {
    requestLocationPermission();
    return () => {
      if (locationWatchId !== null) {
        Geolocation.clearWatch(locationWatchId);
      }
    };
  }, []);

  // Function to update suggestions based on userPreference
  const updateSuggestions = () => {
    console.log("🔄 Updating suggestions based on userPreference:", userPreference);
    
    const baseSuggestions = [
      { name: "Detect Location", index: 1 },
      { name: "Add Address", index: 2 },
    ];

    let savedLocationSuggestions = [];
    
    // Handle different userPreference structures
    if (Array.isArray(userPreference) && userPreference[0]?.savedLocations) {
      savedLocationSuggestions = userPreference[0].savedLocations.map((loc: any, i: number) => ({
        name: loc.name,
        index: i + 3,
      }));
    } else if (userPreference?.savedLocations) {
      savedLocationSuggestions = userPreference.savedLocations.map((loc: any, i: number) => ({
        name: loc.name,
        index: i + 3,
      }));
    }
    
    console.log("📌 Saved location suggestions:", savedLocationSuggestions);
    
    const finalSuggestions = [...baseSuggestions, ...savedLocationSuggestions];
    setSuggestions(finalSuggestions);
    
    console.log("✅ Final suggestions updated:", finalSuggestions);
  };

  // Update suggestions when userPreference changes
  useEffect(() => {
    updateSuggestions();
  }, [userPreference]);

  // Also update when component mounts
  useEffect(() => {
    if (userPreference) {
      updateSuggestions();
    }
  }, []);

  const renderLocationModalContent = () => {
    if (isCheckingLocation) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.statusText}>Checking location services...</Text>
        </View>
      );
    } else if (loading) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.statusText}>Getting your location...</Text>
        </View>
      );
    } else if (showGPSButton) {
      return (
        <View style={styles.statusContainer}>
          <MaterialIcon name="location-off" size={50} color="red" />
          <Text style={styles.statusText}>Location services are disabled</Text>
          <Text style={[styles.statusText, { fontSize: 14, marginTop: 8 }]}>
            Please enable device location to continue
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleOpenSettings}
            >
              <MaterialIcon name="settings" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Enable Device Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { marginTop: 12 }]}
              onPress={() => {
                setOpen(false);
                setShowGPSButton(false);
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.modalContent}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={16} color="#64748b" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for location..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSearchResults(text.length > 0);
                }}
                onFocus={() => setSearchInputFocused(true)}
                onBlur={() => setTimeout(() => setSearchInputFocused(false), 200)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  style={styles.clearSearchButton}
                >
                  <Icon name="times" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {showSearchResults && (
              <View style={styles.searchResultsContainer}>
                {isSearching ? (
                  <View style={styles.searchLoadingContainer}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={styles.searchLoadingText}>Searching...</Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) => `${item.place_id}-${index}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchResultItem}
                        onPress={() => handleLocationSelect(item)}
                      >
                        <MaterialIcon name="location-on" size={16} color="#3b82f6" />
                        <View style={styles.searchResultText}>
                          <Text style={styles.searchResultTitle} numberOfLines={1}>
                            {item.display_name.split(',')[0]}
                          </Text>
                          <Text style={styles.searchResultSubtitle} numberOfLines={2}>
                            {item.display_name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    style={styles.searchResultsList}
                  />
                ) : searchQuery.length >= 3 ? (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No locations found</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.mapInstructions}>
            <Text style={styles.instructionsText}>
              {isPinSelected 
                ? "📍 Pin location selected. Tap 'Confirm Location' to use this address."
                : "📍 Search for a location above or tap anywhere on the map to select a location."}
            </Text>
          </View>
          
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={{
                latitude: isPinSelected && selectedPinLocation ? selectedPinLocation.latitude : latitude || 0,
                longitude: isPinSelected && selectedPinLocation ? selectedPinLocation.longitude : longitude || 0,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={{
                  latitude: latitude || 0,
                  longitude: longitude || 0,
                }}
                title="Your current location"
                pinColor="blue"
              />
              
              {isPinSelected && selectedPinLocation && (
                <Marker
                  coordinate={selectedPinLocation}
                  title="Selected location"
                  pinColor="red"
                />
              )}
            </MapView>
          </View>

          <View style={styles.locationInfoContainer}>
            <View style={styles.locationInfo}>
              <MaterialIcon name="location-on" size={20} color="#3b82f6" />
              <Text style={styles.addressText} numberOfLines={2}>
                {isPinSelected ? selectedPinAddress : address || "No address available"}
              </Text>
            </View>

            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinateText}>
                Lat: {(isPinSelected && selectedPinLocation ? selectedPinLocation.latitude : latitude)?.toFixed(4) || "N/A"}
              </Text>
              <Text style={styles.coordinateText}>
                Lng: {(isPinSelected && selectedPinLocation ? selectedPinLocation.longitude : longitude)?.toFixed(4) || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.locationSelectionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, !isPinSelected && styles.activeButton]}
              onPress={handleUseCurrentLocation}
            >
              <Text style={styles.secondaryButtonText}>Use Current Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={fetchLocationWithChecks}
            >
              <MaterialIcon name="refresh" size={16} color="#334155" />
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setOpen(false);
                setIsPinSelected(false);
                setSelectedPinLocation(null);
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchResults(false);
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, (!address && !selectedPinAddress) && styles.disabledButton]}
              onPress={handleLocationSave}
              disabled={!address && !selectedPinAddress}
            >
              <Text style={styles.buttonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  return (
    <View style={styles.locationSection}>
      <TouchableOpacity
        style={styles.locationContainer}
        onPress={() =>{ 
          setShowDropdown(!showDropdown);
          updateSuggestions();
        }}
      >
        <MaterialIcon
          name="location-on"
          size={16}
          color="#3b82f6"
          style={styles.locationIcon}
        />
        <Text
          style={styles.locationText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {location || "Searching ..."}
        </Text> 
        <MaterialIcon name="arrow-drop-down" size={18} color="#3b82f6" />
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdownContainer}>
          {loadingLocations ? (
            <View style={styles.dropdownItem}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={[styles.dropdownItemText, { marginLeft: 8 }]}>Loading...</Text>
            </View>
          ) : (
            suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownItem}
                onPress={() => {
                  console.log(`📍 ${suggestion.name} clicked`);
                  console.log("📊 Current suggestions:", suggestions);
                  console.log("📊 Current userPreference:", userPreference);
                  handleChange(suggestion.name);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{suggestion.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Location Modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setOpen(false);
          setIsPinSelected(false);
          setSelectedPinLocation(null);
          setSearchQuery("");
          setSearchResults([]);
          setShowSearchResults(false);
        }}
        onShow={fetchLocationWithChecks}
      >
        <View style={styles.modalContainer}>
           <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.modalHeader}
            >
            <Text style={styles.modalTitle}>Select Your Location</Text>
            <TouchableOpacity onPress={() => {
              setOpen(false);
              setIsPinSelected(false);
              setSelectedPinLocation(null);
              setSearchQuery("");
              setSearchResults([]);
              setShowSearchResults(false);
            }}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            </LinearGradient>

          {renderLocationModalContent()}
        </View>
      </Modal>

      {/* Save Location Modal */}
      <Modal
        visible={OpenSaveOptionForSave}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setOpenSaveOptionForSave(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Save As</Text>
            <TouchableOpacity onPress={() => setOpenSaveOptionForSave(false)}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
          <View style={styles.modalContent}>
            <Text style={styles.saveAsText}>Save As:</Text>
            <View style={styles.saveOptionsContainer}>
              <TouchableOpacity
                style={styles.saveOptionButton}
                onPress={() => handleUserPreference("Home")}
                disabled={isSaving}
              >
                <Icon name="home" size={20} color="#3b82f6" />
                <Text style={styles.saveOptionText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveOptionButton}
                onPress={() => handleUserPreference("Office")}
                disabled={isSaving}
              >
                <Icon name="briefcase" size={20} color="#3b82f6" />
                <Text style={styles.saveOptionText}>Office</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveOptionButton}
                onPress={() => handleUserPreference()}
                disabled={isSaving}
              >
                <Icon name="map-marker" size={20} color="#3b82f6" />
                <Text style={styles.saveOptionText}>Others</Text>
              </TouchableOpacity>
            </View>

            {showInput && (
              <TextInput
                style={styles.locationNameInput}
                placeholder="Enter Location Name"
                value={locationAs}
                onChangeText={setLocationAs}
                editable={!isSaving}
              />
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setOpenSaveOptionForSave(false)}
                disabled={isSaving}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, (!locationAs || locationAs.trim() === "") && styles.disabledButton]}
                onPress={locationHandleSave}
                disabled={!locationAs || locationAs.trim() === "" || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ... (keep all your existing styles the same)
const styles = StyleSheet.create({
  locationSection: {
    flex: 2,
    marginHorizontal: 12,
    position: "relative",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    minWidth: 120,
    maxWidth: 180,
  },
  locationText: {
    fontSize: 14,
    color: "#334155",
    marginHorizontal: 6,
    fontWeight: "500",
    flex: 1,
  },
  locationIcon: {
    marginRight: 4,
  },
  dropdownContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    width: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f1f5f9"
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    height: "50%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  locationInfoContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    color: "#334155",
    marginLeft: 8,
    flex: 1,
  },
  coordinatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coordinateText: {
    fontSize: 14,
    color: "#64748b",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "500",
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  saveAsText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
  },
  saveOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  saveOptionButton: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    flex: 1,
    marginHorizontal: 4,
  },
  saveOptionText: {
    marginTop: 8,
    fontSize: 14,
    color: "#334155",
  },
  locationNameInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  searchContainer: {
    marginBottom: 16,
    position: "relative",
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#334155",
  },
  clearSearchButton: {
    padding: 4,
  },
  searchResultsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 4,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  searchResultsList: {
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchResultText: {
    flex: 1,
    marginLeft: 8,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 2,
  },
  searchResultSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  searchLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  searchLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#64748b",
  },
  noResultsContainer: {
    padding: 16,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#64748b",
  },
  mapInstructions: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  instructionsText: {
    fontSize: 14,
    color: "#0369a1",
    textAlign: "center",
  },
  locationSelectionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  activeButton: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
    borderWidth: 2,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
    opacity: 0.6,
  },
});

export default LocationSelector;