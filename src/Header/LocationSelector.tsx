// LocationSelector.tsx - Only fixing button issues and save option selection feedback
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ScrollView,
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
import { useTheme } from "../../src/Settings/ThemeContext";
import { useTranslation } from 'react-i18next';

Geocoder.init(keys.api_key);

const { width } = Dimensions.get("window");

interface LocationData {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address?: any[];
  lat?: number;
  lng?: number;
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
  const { t } = useTranslation();
  const { colors, fontSize, isDarkMode } = useTheme();
  
  const dispatch = useDispatch();
  const locationDispatch = useDispatch();
  const { appUser } = useAppUser();
  
  const [location, setLocation] = useState("");
  const [locationAs, setLocationAs] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([
    { name: t('locationSelector.detectLocation'), index: 1 },
    { name: t('locationSelector.addAddress'), index: 2 },
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
  const [selectedSaveOption, setSelectedSaveOption] = useState<string | null>(null); // NEW: Track selected save option

  const [selectedPinLocation, setSelectedPinLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedPinAddress, setSelectedPinAddress] = useState("");
  const [isPinSelected, setIsPinSelected] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  const [locationMethod, setLocationMethod] = useState<'auto' | 'manual' | null>(null);

  const isAuthenticated = appUser && appUser.customerid;

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          locationText: 13,
          dropdownItemText: 13,
          modalTitle: 16,
          methodTitle: 15,
          methodDescription: 11,
          sectionTitle: 13,
          addressText: 14,
          coordinateText: 12,
          instructionsText: 13,
          buttonText: 13,
          statusText: 14,
          saveAsText: 15,
          saveOptionText: 13,
          searchResultTitle: 13,
          searchResultSubtitle: 11,
          iconSize: 18,
          buttonHeight: 40,
        };
      case 'large':
        return {
          locationText: 16,
          dropdownItemText: 16,
          modalTitle: 20,
          methodTitle: 18,
          methodDescription: 14,
          sectionTitle: 16,
          addressText: 18,
          coordinateText: 16,
          instructionsText: 16,
          buttonText: 16,
          statusText: 18,
          saveAsText: 18,
          saveOptionText: 16,
          searchResultTitle: 16,
          searchResultSubtitle: 14,
          iconSize: 24,
          buttonHeight: 52,
        };
      default:
        return {
          locationText: 14,
          dropdownItemText: 14,
          modalTitle: 18,
          methodTitle: 16,
          methodDescription: 12,
          sectionTitle: 14,
          addressText: 16,
          coordinateText: 14,
          instructionsText: 14,
          buttonText: 14,
          statusText: 16,
          saveAsText: 16,
          saveOptionText: 14,
          searchResultTitle: 14,
          searchResultSubtitle: 12,
          iconSize: 20,
          buttonHeight: 44,
        };
    }
  };

  const fontSizes = getFontSizes();

  // Helper function to validate coordinates
  const isValidCoordinates = (lat: number | null, lng: number | null): boolean => {
    return lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  };

  // Helper function to create standardized location data
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
      ],
      lat: lat,
      lng: lng
    };
  };

  // CRITICAL: Function to update location in Redux and notify parent
  const updateLocationInStore = useCallback((lat: number, lng: number, addr: string) => {
    console.log("📍 Updating location in Redux:", { lat, lng, addr });
    
    const locationData = createLocationData(lat, lng, addr);
    
    // Update both Redux stores
    dispatch(add(locationData));
    locationDispatch(addLocation(locationData));
    
    // Store in AsyncStorage or similar for persistence if needed
    setDataFromMap(locationData);
    
    // Notify parent component
    if (onLocationChange) {
      onLocationChange(addr, locationData);
    }
    
    return locationData;
  }, [dispatch, locationDispatch, onLocationChange]);

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
    setLocationMethod('manual');

    setLatitude(latitude);
    setLongitude(longitude);

    // Update Redux store immediately
    updateLocationInStore(latitude, longitude, display_name);
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
        t('common.permissionRequired'),
        t('locationSelector.permissionDeniedMessage'),
        [
          {
            text: t('common.openSettings'),
            onPress: () => handleOpenSettings(),
          },
          {
            text: t('common.cancel'),
            style: "cancel",
          },
        ]
      );
      return false;
    }

    if (hasRequestedPermission) {
      getCurrentLocation();
      return true;
    }

    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('common.permissionRequired'),
            message: t('locationSelector.locationPermissionMessage'),
            buttonNeutral: t('common.askMeLater'),
            buttonNegative: t('common.cancel'),
            buttonPositive: t('common.ok'),
          }
        );

        setHasRequestedPermission(true);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          setPermissionDeniedPermanently(true);
          Alert.alert(
            t('common.permissionRequired'),
            t('locationSelector.permissionRequiredMessage'),
            [
              {
                text: t('common.openSettings'),
                onPress: () => handleOpenSettings(),
              },
              {
                text: t('common.cancel'),
                style: "cancel",
              },
            ]
          );
          return false;
        } else {
          setLoading(false);
          setShowGPSButton(true);
          return false;
        }
      } else {
        getCurrentLocation();
        return true;
      }
    } catch (err) {
      console.warn(err);
      setLoading(false);
      setShowGPSButton(true);
      return false;
    }
  };

  const checkLocationAccuracy = async (): Promise<void> => {
    if (Platform.OS === "android") {
      try {
        const locationMode = await NativeModules.LocationSettings.getLocationMode();

        if (locationMode !== "high_accuracy") {
          Alert.alert(
            t('locationSelector.highAccuracyRecommended'),
            t('locationSelector.highAccuracyMessage'),
            [
              {
                text: t('common.openSettings'),
                onPress: () => handleOpenSettings(),
              },
              { text: t('common.continue'), onPress: () => {} },
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
      return t('locationSelector.addressNotAvailable');
    } catch (error) {
      console.warn("Geocoder error:", error);
      return t('locationSelector.addressNotAvailable');
    }
  };

  const getCurrentLocation = useCallback(() => {
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
        
        if (!isValidCoordinates(latitude, longitude)) {
          console.warn("Invalid coordinates received:", { latitude, longitude });
          setLoading(false);
          setShowGPSButton(true);
          return;
        }
        
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
            setLocationMethod('auto');
            
            // CRITICAL: Update Redux store with auto-detected location
            updateLocationInStore(latitude, longitude, newLocation);
          }
        } catch (error) {
          console.error("Error getting address:", error);
          // Still update Redux with coordinates even if address lookup fails
          const fallbackAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          updateLocationInStore(latitude, longitude, fallbackAddress);
        } finally {
          setLoading(false);
          setShowGPSButton(false);
        }
      },
      (error) => {
        console.error("Location error:", error);

        if (locationWatchId !== null) {
          Geolocation.clearWatch(locationWatchId);
          setLocationWatchId(null);
        }

        let errorMessage = t('locationSelector.unableToFetchLocation');

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t('locationSelector.permissionDeniedMessage');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = t('locationSelector.positionUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage = t('locationSelector.timeoutMessage');
            break;
        }

        Alert.alert(t('common.error'), errorMessage);
        setLoading(false);
        setShowGPSButton(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
        distanceFilter: 10,
      }
    );

    setLocationWatchId(watchId);
  }, [updateLocationInStore]);

  const fetchLocation = () => {
    setLoading(true);
    setShowGPSButton(false);
    getCurrentLocation();
  };

  const fetchLocationWithChecks = async () => {
    setIsCheckingLocation(true);
    setLoading(true);
    setLocationMethod('auto');
    setShowGPSButton(false);

    try {
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        Alert.alert(
          t('locationSelector.locationServicesDisabled'),
          t('locationSelector.pleaseEnableLocation'),
          [
            {
              text: t('common.enable'),
              onPress: () => handleOpenSettings(),
            },
            { 
              text: t('common.cancel'), 
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
    setLocationMethod('manual');
    
    try {
      const address = await getAddressFromCoords(coordinate.latitude, coordinate.longitude);
      setSelectedPinAddress(address);
      setAddress(address);
      
      // CRITICAL: Update Redux store when map is pressed
      updateLocationInStore(coordinate.latitude, coordinate.longitude, address);
    } catch (error) {
      console.warn("Error getting address for selected pin:", error);
      setSelectedPinAddress(t('locationSelector.addressNotAvailable'));
      updateLocationInStore(coordinate.latitude, coordinate.longitude, t('locationSelector.addressNotAvailable'));
    }
  };

  const handleUseCurrentLocation = () => {
    setIsPinSelected(false);
    setSelectedPinLocation(null);
    setSelectedPinAddress("");
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setLocationMethod('auto');
    if (latitude && longitude) {
      getAddressFromCoords(latitude, longitude)
        .then((addr) => {
          setAddress(addr);
          // CRITICAL: Update Redux store when using current location
          updateLocationInStore(latitude, longitude, addr);
        })
        .catch(console.error);
    } else {
      fetchLocationWithChecks();
    }
  };

  const handleChange = (newValue: string) => {
    if (newValue === t('locationSelector.addAddress')) {
      setLoading(false);
      setIsCheckingLocation(false);
      setShowGPSButton(false);
      setLocationMethod(null);
      if (!isAuthenticated) {
        Alert.alert(
          t('common.authenticationRequired'),
          t('locationSelector.loginToSaveLocations'),
          [
            { text: t('common.ok'), style: "default" }
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
    } else if (newValue === t('locationSelector.detectLocation')) {
      fetchLocationWithChecks();
    } else {
      if (!userPreference || (Array.isArray(userPreference) && userPreference.length === 0)) {
        Alert.alert(t('common.error'), t('locationSelector.noSavedLocations'));
        return;
      }
      
      let savedLocations = [];
      if (Array.isArray(userPreference) && userPreference[0]?.savedLocations) {
        savedLocations = userPreference[0].savedLocations;
      } else if (userPreference?.savedLocations) {
        savedLocations = userPreference.savedLocations;
      }
      
      const savedLocation = savedLocations.find(
        (location: any) => location.name === newValue
      ) || savedLocations.find(
        (location: any) => location.name?.toLowerCase() === newValue.toLowerCase()
      );
      
      if (savedLocation?.location) {
        let addressToSet = "";
        let lat = null;
        let lng = null;
        let locationData = savedLocation.location;
        
        if (locationData.address && Array.isArray(locationData.address) && locationData.address[0]?.formatted_address) {
          addressToSet = locationData.address[0].formatted_address;
          if (locationData.address[0]?.geometry?.location) {
            lat = locationData.address[0].geometry.location.lat;
            lng = locationData.address[0].geometry.location.lng;
          }
        } else if (locationData.formatted_address) {
          addressToSet = locationData.formatted_address;
          if (locationData.geometry?.location) {
            lat = locationData.geometry.location.lat;
            lng = locationData.geometry.location.lng;
          }
        } else if (typeof locationData === 'string') {
          addressToSet = locationData;
        }
        
        if (addressToSet && lat && lng) {
          setLocation(addressToSet);
          setAddress(addressToSet);
          setLatitude(lat);
          setLongitude(lng);
          
          // CRITICAL: Update Redux store when saved location is selected
          updateLocationInStore(lat, lng, addressToSet);
        } else if (addressToSet) {
          setLocation(addressToSet);
          setAddress(addressToSet);
          // If we have address but no coordinates, try to geocode
          Geocoder.from(addressToSet)
            .then(json => {
              const location = json.results[0].geometry.location;
              if (location) {
                setLatitude(location.lat);
                setLongitude(location.lng);
                updateLocationInStore(location.lat, location.lng, addressToSet);
              }
            })
            .catch(error => {
              console.error("Geocoding error:", error);
              Alert.alert(t('common.error'), t('locationSelector.couldNotRetrieveAddress'));
            });
        } else {
          Alert.alert(t('common.error'), t('locationSelector.couldNotRetrieveAddress'));
        }
      } else {
        Alert.alert(t('common.notFound'), t('locationSelector.locationNotFound'));
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
      
      // CRITICAL: Update Redux store when saving location
      updateLocationInStore(selectedPinLocation.latitude, selectedPinLocation.longitude, selectedPinAddress);
    } else {
      if (address && latitude && longitude) {
        setLocation(address);
        locationData = createLocationData(latitude, longitude, address);
        setDataFromMap(locationData);
        
        // CRITICAL: Update Redux store when confirming location
        updateLocationInStore(latitude, longitude, address);
      }
    }
    
    setOpen(false);
    
    if (!isAuthenticated) {
      Alert.alert(
        t('common.authenticationRequired'),
        t('locationSelector.loginToSaveLocations'),
        [
          { text: t('common.ok'), style: "default" }
        ]
      );
      return;
    }
    
    setOpenSaveOptionForSave(true);
    setIsPinSelected(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSelectedSaveOption(null); // Reset selection
    setShowInput(false); // Reset input visibility
    setLocationAs(""); // Reset location name
  };

  const locationHandleSave = async () => {
    setIsSaving(true);
    
    try {
      await updateUserSetting();
      
      Alert.alert(t('common.success'), t('locationSelector.locationSaved'));
      
      setTimeout(() => {
        setOpenSaveOptionForSave(false);
        setLocationAs("");
        setIsSaving(false);
        setSelectedSaveOption(null);
        setShowInput(false);
      }, 500);
      
    } catch (error: any) {
      console.error("Error saving location:", error);
      Alert.alert(t('common.error'), error.message || t('locationSelector.saveFailed'));
      setIsSaving(false);
    }
  };

  const updateUserSetting = async () => {
    if (!appUser) {
      throw new Error(t('errors.authenticationRequired'));
    }

    if (!appUser.customerid) {
      throw new Error(t('errors.profileNotLoaded'));
    }

    if (!locationAs || locationAs.trim() === "") {
      throw new Error(t('locationSelector.enterLocationName'));
    }

    if (!dataFromMap && (!latitude || !longitude)) {
      throw new Error(t('locationSelector.selectLocationFirst'));
    }

    const locationToSave = dataFromMap || createLocationData(latitude!, longitude!, address);
    
    const newLocation = {
      name: locationAs.trim(),
      location: locationToSave,
    };

    let existingLocations: any[] = [];
    if (Array.isArray(userPreference) && userPreference[0]?.savedLocations) {
      existingLocations = [...userPreference[0].savedLocations];
    } else if (userPreference?.savedLocations) {
      existingLocations = [...userPreference.savedLocations];
    }

    const existingLocationIndex = existingLocations.findIndex(
      (loc: any) => loc.name.toLowerCase() === locationAs.trim().toLowerCase()
    );

    let updatedLocations;
    if (existingLocationIndex !== -1) {
      updatedLocations = [...existingLocations];
      updatedLocations[existingLocationIndex] = newLocation;
    } else {
      updatedLocations = [...existingLocations, newLocation];
    }

    const payload = {
      customerId: appUser.customerid,
      savedLocations: updatedLocations,
    };
    
    const response = await axios.put(
      `https://utils-ndt3.onrender.com/user-settings/${appUser.customerid}`,
      payload
    );

    if (response.status === 200 || response.status === 201) {
      const updatedUserPreference = {
        customerId: appUser.customerid,
        savedLocations: updatedLocations
      };
      
      setUserPreference(updatedUserPreference);
      
      const baseSuggestions = [
        { name: t('locationSelector.detectLocation'), index: 1 },
        { name: t('locationSelector.addAddress'), index: 2 },
      ];
      const savedLocationSuggestions = updatedLocations.map((loc: any, i: number) => ({
        name: loc.name,
        index: i + 3,
      }));
      
      const newSuggestions = [...baseSuggestions, ...savedLocationSuggestions];
      setSuggestions(newSuggestions);
      
      return response.data;
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
  };

  const handleUserPreference = (preference?: string) => {
    setSelectedSaveOption(preference || "others");
    if (!preference) {
      setShowInput(true);
      setLocationAs("");
    } else {
      setShowInput(false);
      setLocationAs(preference);
    }
  };

  useEffect(() => {
    // Initial location fetch
    fetchLocationWithChecks();
    
    return () => {
      if (locationWatchId !== null) {
        Geolocation.clearWatch(locationWatchId);
      }
    };
  }, []);

  const updateSuggestions = () => {
    const baseSuggestions = [
      { name: t('locationSelector.detectLocation'), index: 1 },
      { name: t('locationSelector.addAddress'), index: 2 },
    ];

    let savedLocationSuggestions = [];
    
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
    
    const finalSuggestions = [...baseSuggestions, ...savedLocationSuggestions];
    setSuggestions(finalSuggestions);
  };

  useEffect(() => {
    updateSuggestions();
  }, [userPreference]);

  useEffect(() => {
    if (userPreference) {
      updateSuggestions();
    }
  }, []);

  const renderLocationMethodSelector = () => {
    return (
      <View style={styles.methodSelectorContainer}>
        <TouchableOpacity
          style={[
            styles.methodCard,
            locationMethod === 'auto' && styles.methodCardActive,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
          onPress={() => {
            setLocationMethod('auto');
            fetchLocationWithChecks();
          }}
        >
          <View style={styles.methodIconContainer}>
            <MaterialIcon 
              name="my-location" 
              size={fontSizes.iconSize} 
              color={locationMethod === 'auto' ? colors.primary : colors.textSecondary} 
            />
          </View>
          <Text style={[
            styles.methodTitle,
            { fontSize: fontSizes.methodTitle, color: colors.text },
            locationMethod === 'auto' && { color: colors.primary }
          ]}>
            {t('locationSelector.autoDetect')}
          </Text>
          <Text style={[styles.methodDescription, { fontSize: fontSizes.methodDescription, color: colors.textSecondary }]}>
            {t('locationSelector.useYourCurrentLocation')}
          </Text>
          {locationMethod === 'auto' && (
            <View style={styles.activeIndicator}>
              <MaterialIcon name="check-circle" size={20} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodCard,
            locationMethod === 'manual' && styles.methodCardActive,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
          onPress={() => setLocationMethod('manual')}
        >
          <View style={styles.methodIconContainer}>
            <MaterialIcon 
              name="search" 
              size={fontSizes.iconSize} 
              color={locationMethod === 'manual' ? colors.primary : colors.textSecondary} 
            />
          </View>
          <Text style={[
            styles.methodTitle,
            { fontSize: fontSizes.methodTitle, color: colors.text },
            locationMethod === 'manual' && { color: colors.primary }
          ]}>
            {t('locationSelector.searchManually')}
          </Text>
          <Text style={[styles.methodDescription, { fontSize: fontSizes.methodDescription, color: colors.textSecondary }]}>
            {t('locationSelector.searchOrTapOnMap')}
          </Text>
          {locationMethod === 'manual' && (
            <View style={styles.activeIndicator}>
              <MaterialIcon name="check-circle" size={20} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderAutoDetectContent = () => {
    if (isCheckingLocation) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.text, fontSize: fontSizes.statusText }]}>
            {t('locationSelector.checkingLocationServices')}
          </Text>
        </View>
      );
    } else if (loading) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.text, fontSize: fontSizes.statusText }]}>
            {t('locationSelector.gettingYourLocation')}
          </Text>
          <Text style={[styles.statusText, { fontSize: 14, marginTop: 8, color: colors.textSecondary }]}>
            {t('locationSelector.thisMayTakeFewSeconds')}
          </Text>
        </View>
      );
    } else if (showGPSButton) {
      return (
        <View style={styles.statusContainer}>
          <MaterialIcon name="location-off" size={50} color={colors.error} />
          <Text style={[styles.statusText, { color: colors.error, fontWeight: '600', fontSize: fontSizes.statusText }]}>
            {t('locationSelector.locationServicesDisabled')}
          </Text>
          <Text style={[styles.statusText, { fontSize: 14, marginTop: 8, color: colors.textSecondary }]}>
            {t('locationSelector.pleaseEnableLocation')}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, width: '100%', height: fontSizes.buttonHeight }]}
              onPress={handleOpenSettings}
            >
              <MaterialIcon name="settings" size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={[styles.buttonText, { color: '#ffffff', fontSize: fontSizes.buttonText }]}>
                {t('locationSelector.enableDeviceLocation')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { marginTop: 12, width: '100%', height: fontSizes.buttonHeight, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => {
                setLocationMethod('manual');
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text, fontSize: fontSizes.buttonText }]}>
                {t('locationSelector.switchToManualSearch')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.autoLocationContent}>
          <View style={[styles.mapInstructions, { backgroundColor: colors.infoLight, borderLeftColor: colors.primary }]}>
            <Text style={[styles.instructionsText, { color: colors.primary, fontSize: fontSizes.instructionsText }]}>
              {t('locationSelector.yourCurrentLocation')}
            </Text>
          </View>
          
          <View style={styles.autoMapContainer}>
            <MapView
              style={styles.map}
              region={{
                latitude: latitude || 37.7749,
                longitude: longitude || -122.4194,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {latitude && longitude && (
                <Marker
                  coordinate={{
                    latitude: latitude,
                    longitude: longitude,
                  }}
                  title={t('locationSelector.yourCurrentLocation')}
                  pinColor={colors.primary}
                />
              )}
            </MapView>
            
            <TouchableOpacity
              style={[styles.smallRefreshButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={fetchLocationWithChecks}
            >
              <MaterialIcon name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.locationInfoContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.locationInfo}>
              <MaterialIcon name="location-on" size={fontSizes.iconSize} color={colors.primary} />
              <Text style={[styles.addressText, { color: colors.text, fontSize: fontSizes.addressText }]} numberOfLines={2}>
                {address || t('locationSelector.fetchingLocation')}
              </Text>
            </View>
            {latitude && longitude && (
              <View style={styles.coordinatesContainer}>
                <Text style={[styles.coordinateText, { color: colors.textSecondary, fontSize: fontSizes.coordinateText }]}>
                  Lat: {latitude.toFixed(4)}
                </Text>
                <Text style={[styles.coordinateText, { color: colors.textSecondary, fontSize: fontSizes.coordinateText }]}>
                  Lng: {longitude.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }
  };

 const renderManualDetectContent = () => {
  return (
    <ScrollView 
      style={styles.methodContentContainer}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={styles.scrollContentContainer}
    >
      <View style={styles.searchSection}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
          {t('locationSelector.searchForLocation')}
        </Text>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon name="search" size={fontSizes.iconSize - 4} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontSize: fontSizes.addressText }]}
            placeholder={t('locationSelector.enterAddressOrPlace')}
            placeholderTextColor={colors.placeholder}
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
              <Icon name="times" size={fontSizes.iconSize - 4} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {showSearchResults && (
          <View style={[styles.searchResultsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {isSearching ? (
              <View style={styles.searchLoadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.searchLoadingText, { color: colors.textSecondary, fontSize: fontSizes.searchResultSubtitle }]}>
                  {t('locationSelector.searching')}
                </Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => `${item.place_id}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <MaterialIcon name="location-on" size={fontSizes.iconSize - 4} color={colors.primary} />
                    <View style={styles.searchResultText}>
                      <Text style={[styles.searchResultTitle, { color: colors.text, fontSize: fontSizes.searchResultTitle }]} numberOfLines={1}>
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={[styles.searchResultSubtitle, { color: colors.textSecondary, fontSize: fontSizes.searchResultSubtitle }]} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.searchResultsList}
              />
            ) : searchQuery.length >= 3 ? (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsText, { color: colors.textSecondary, fontSize: fontSizes.searchResultSubtitle }]}>
                  {t('locationSelector.noLocationsFound')}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      <View style={[styles.mapInstructions, { backgroundColor: colors.infoLight, borderLeftColor: colors.primary }]}>
        <Text style={[styles.instructionsText, { color: colors.primary, fontSize: fontSizes.instructionsText }]}>
          {isPinSelected 
            ? t('locationSelector.pinLocationSelected')
            : t('locationSelector.tapOnMapToSelect')}
        </Text>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={{
            latitude: isPinSelected && selectedPinLocation ? selectedPinLocation.latitude : latitude || 37.7749,
            longitude: isPinSelected && selectedPinLocation ? selectedPinLocation.longitude : longitude || -122.4194,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={handleMapPress}
        >
          {latitude && longitude && (
            <Marker
              coordinate={{
                latitude: latitude,
                longitude: longitude,
              }}
              title={t('locationSelector.yourCurrentLocation')}
              pinColor={colors.primary}
            />
          )}
          
          {isPinSelected && selectedPinLocation && (
            <Marker
              coordinate={selectedPinLocation}
              title={t('locationSelector.selectedLocation')}
              pinColor={colors.error}
            />
          )}
        </MapView>
      </View>

      <View style={[styles.locationInfoContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.locationInfo}>
          <MaterialIcon name="location-on" size={fontSizes.iconSize} color={colors.primary} />
          <Text style={[styles.addressText, { color: colors.text, fontSize: fontSizes.addressText }]} numberOfLines={2}>
            {isPinSelected ? selectedPinAddress : (address || t('locationSelector.noAddressSelected'))}
          </Text>
        </View>
        {selectedPinLocation && (
          <View style={styles.coordinatesContainer}>
            <Text style={[styles.coordinateText, { color: colors.textSecondary, fontSize: fontSizes.coordinateText }]}>
              Lat: {selectedPinLocation.latitude.toFixed(4)}
            </Text>
            <Text style={[styles.coordinateText, { color: colors.textSecondary, fontSize: fontSizes.coordinateText }]}>
              Lng: {selectedPinLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.locationSelectionButtons}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flex: 1, height: fontSizes.buttonHeight }]}
          onPress={handleUseCurrentLocation}
        >
          <MaterialIcon name="my-location" size={fontSizes.iconSize - 4} color={colors.text} style={{ marginRight: 4 }} />
          <Text style={[styles.secondaryButtonText, { color: colors.text, fontSize: fontSizes.buttonText }]}>
            {t('locationSelector.useCurrent')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

  const renderLocationModalContent = () => {
    return (
      <View style={styles.modalContent}>
        {renderLocationMethodSelector()}
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        {locationMethod === 'auto' && renderAutoDetectContent()}
        {locationMethod === 'manual' && renderManualDetectContent()}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flex: 1, height: fontSizes.buttonHeight }]}
            onPress={() => {
              setOpen(false);
              setIsPinSelected(false);
              setSelectedPinLocation(null);
              setSearchQuery("");
              setSearchResults([]);
              setShowSearchResults(false);
              setLocationMethod(null);
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text, fontSize: fontSizes.buttonText }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button, 
              { backgroundColor: colors.primary, flex: 1, height: fontSizes.buttonHeight },
              (!address && !selectedPinAddress && !(locationMethod === 'auto' && address)) && { backgroundColor: colors.disabled }
            ]}
            onPress={handleLocationSave}
            disabled={!address && !selectedPinAddress}
          >
            <Text style={[styles.buttonText, { color: '#ffffff', fontSize: fontSizes.buttonText }]}>
              {t('locationSelector.confirmLocation')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const dynamicStyles = StyleSheet.create({
    locationContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      borderColor: colors.border,
      minWidth: 140,
      width: "100%",
      height: "100%",
      justifyContent: "space-between",
    },
    locationText: {
      fontSize: fontSizes.locationText,
      color: colors.text,
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
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 8,
      shadowColor: colors.shadow,
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
      fontSize: fontSizes.dropdownItemText,
      color: colors.text,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.modalTitle,
      fontWeight: "bold",
      color: "#ffffff"
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },
    methodSelectorContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    },
    methodCard: {
      flex: 1,
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      alignItems: 'center',
      position: 'relative',
    },
    methodCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    methodIconContainer: {
      marginBottom: 8,
    },
    methodTitle: {
      fontWeight: '600',
      marginBottom: 4,
    },
    methodDescription: {
      textAlign: 'center',
    },
    activeIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    divider: {
      height: 1,
      marginVertical: 16,
    },
    methodContentContainer: {
      flex: 1,
    },
    sectionTitle: {
      fontWeight: '600',
      marginBottom: 8,
    },
    autoLocationContent: {
      flex: 1,
    },
    autoMapContainer: {
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 16,
      height: "45%",
      position: "relative",
    },
    mapContainer: {
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 16,
      height: "45%",
    },
    map: {
      width: "100%",
      height: "100%",
    },
    smallRefreshButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      borderRadius: 20,
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
    },
    searchSection: {
      marginBottom: 16,
      position: 'relative',
      zIndex: 1000,
    },
    locationInfoContainer: {
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
      marginLeft: 8,
      flex: 1,
    },
    coordinatesContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    coordinateText: {},
    buttonGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginTop: 16,
      marginBottom: 16,
    },
    buttonContainer: {
      width: "100%",
      paddingHorizontal: 24,
    },
    button: {
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    buttonText: {
      fontWeight: "500",
    },
    secondaryButtonText: {
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
      textAlign: "center",
    },
    saveAsText: {
      fontSize: fontSizes.saveAsText,
      fontWeight: "500",
      marginBottom: 16,
      color: colors.text,
    },
    saveOptionsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 8,
    },
    saveOptionButton: {
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      flex: 1,
    },
    saveOptionButtonActive: {
      backgroundColor: colors.primary + '20',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    saveOptionText: {
      marginTop: 8,
      fontSize: fontSizes.saveOptionText,
      color: colors.text,
    },
    saveOptionTextActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    locationNameInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      fontSize: fontSizes.addressText,
      color: colors.text,
      backgroundColor: colors.card,
    },
    searchContainer: {
      marginBottom: 16,
      position: "relative",
      zIndex: 1000,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
    },
    clearSearchButton: {
      padding: 4,
    },
    searchResultsContainer: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      borderRadius: 8,
      borderWidth: 1,
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
    },
    searchResultText: {
      flex: 1,
      marginLeft: 8,
    },
    searchResultTitle: {
      fontWeight: "500",
      marginBottom: 2,
    },
    searchResultSubtitle: {},
    searchLoadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    searchLoadingText: {
      marginLeft: 8,
    },
    noResultsContainer: {
      padding: 16,
      alignItems: "center",
    },
    noResultsText: {},
    mapInstructions: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    instructionsText: {
      textAlign: "center",
    },
    locationSelectionButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 16,
    },
    activeButton: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
      borderWidth: 2,
    },
    disabledButton: {
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.locationSection}>
      <TouchableOpacity
        style={dynamicStyles.locationContainer}
        onPress={() =>{ 
          setShowDropdown(!showDropdown);
          updateSuggestions();
        }}
      >
        <MaterialIcon
          name="location-on"
          size={16}
          color={colors.primary}
          style={dynamicStyles.locationIcon}
        />
        <Text
          style={dynamicStyles.locationText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {address || location || t('locationSelector.searching')}
        </Text> 
        <MaterialIcon name="arrow-drop-down" size={18} color={colors.primary} />
      </TouchableOpacity>

      {showDropdown && (
        <View style={dynamicStyles.dropdownContainer}>
          {loadingLocations ? (
            <View style={dynamicStyles.dropdownItem}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[dynamicStyles.dropdownItemText, { marginLeft: 8 }]}>
                {t('common.loading')}
              </Text>
            </View>
          ) : (
            suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={dynamicStyles.dropdownItem}
                onPress={() => {
                  handleChange(suggestion.name);
                  setShowDropdown(false);
                }}
              >
                <Text style={dynamicStyles.dropdownItemText}>{suggestion.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

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
          setLocationMethod(null);
        }}
      >
        <View style={dynamicStyles.modalContainer}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={dynamicStyles.modalTitle}>{t('locationSelector.selectYourLocation')}</Text>
            <TouchableOpacity onPress={() => {
              setOpen(false);
              setIsPinSelected(false);
              setSelectedPinLocation(null);
              setSearchQuery("");
              setSearchResults([]);
              setShowSearchResults(false);
              setLocationMethod(null);
            }}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {renderLocationModalContent()}
        </View>
      </Modal>

      <Modal
        visible={OpenSaveOptionForSave}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setOpenSaveOptionForSave(false)}
      >
        <View style={dynamicStyles.modalContainer}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={dynamicStyles.modalTitle}>{t('locationSelector.saveAs')}</Text>
            <TouchableOpacity onPress={() => setOpenSaveOptionForSave(false)}>
              <Icon name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.saveAsText}>{t('locationSelector.saveAs')}:</Text>
            <View style={styles.saveOptionsContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.saveOptionButton,
                  selectedSaveOption === "Home" && dynamicStyles.saveOptionButtonActive
                ]}
                onPress={() => handleUserPreference("Home")}
                disabled={isSaving}
              >
                <Icon name="home" size={fontSizes.iconSize} color={selectedSaveOption === "Home" ? colors.primary : colors.textSecondary} />
                <Text style={[
                  dynamicStyles.saveOptionText,
                  selectedSaveOption === "Home" && dynamicStyles.saveOptionTextActive
                ]}>
                  {t('common.home')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.saveOptionButton,
                  selectedSaveOption === "Office" && dynamicStyles.saveOptionButtonActive
                ]}
                onPress={() => handleUserPreference("Office")}
                disabled={isSaving}
              >
                <Icon name="briefcase" size={fontSizes.iconSize} color={selectedSaveOption === "Office" ? colors.primary : colors.textSecondary} />
                <Text style={[
                  dynamicStyles.saveOptionText,
                  selectedSaveOption === "Office" && dynamicStyles.saveOptionTextActive
                ]}>
                  {t('common.office')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.saveOptionButton,
                  selectedSaveOption === "others" && dynamicStyles.saveOptionButtonActive
                ]}
                onPress={() => handleUserPreference()}
                disabled={isSaving}
              >
                <Icon name="map-marker" size={fontSizes.iconSize} color={selectedSaveOption === "others" ? colors.primary : colors.textSecondary} />
                <Text style={[
                  dynamicStyles.saveOptionText,
                  selectedSaveOption === "others" && dynamicStyles.saveOptionTextActive
                ]}>
                  {t('common.others')}
                </Text>
              </TouchableOpacity>
            </View>

            {showInput && (
              <TextInput
                style={dynamicStyles.locationNameInput}
                placeholder={t('locationSelector.enterLocationName')}
                placeholderTextColor={colors.placeholder}
                value={locationAs}
                onChangeText={setLocationAs}
                editable={!isSaving}
              />
            )}

            <View style={dynamicStyles.buttonGroup}>
              <TouchableOpacity
                style={[dynamicStyles.button, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flex: 1, height: fontSizes.buttonHeight }]}
                onPress={() => setOpenSaveOptionForSave(false)}
                disabled={isSaving}
              >
                <Text style={[dynamicStyles.secondaryButtonText, { fontSize: fontSizes.buttonText }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  dynamicStyles.button, 
                  { backgroundColor: colors.primary, flex: 1, height: fontSizes.buttonHeight },
                  (!locationAs || locationAs.trim() === "") && dynamicStyles.disabledButton
                ]}
                onPress={locationHandleSave}
                disabled={!locationAs || locationAs.trim() === "" || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[dynamicStyles.buttonText, { color: '#ffffff', fontSize: fontSizes.buttonText }]}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  locationSection: {
    flex: 2,
    marginHorizontal: 12,
    position: "relative",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  saveOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  methodCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  methodCardActive: {
    borderWidth: 2,
  },
  methodSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  methodIconContainer: {
    marginBottom: 8,
  },
  methodTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  methodDescription: {
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  methodContentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  autoLocationContent: {
    flex: 1,
  },
  autoMapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    height: "45%",
    position: "relative",
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    height: "45%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  smallRefreshButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  searchSection: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1000,
  },
  locationInfoContainer: {
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
    marginLeft: 8,
    flex: 1,
  },
  coordinatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coordinateText: {},
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 24,
  },
  buttonText: {
    fontWeight: "500",
  },
  secondaryButtonText: {
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
    textAlign: "center",
  },
  saveOptionButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  saveOptionText: {
    marginTop: 8,
  },
  locationNameInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
  },
  clearSearchButton: {
    padding: 4,
  },
  searchResultsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
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
  },
  searchResultText: {
    flex: 1,
    marginLeft: 8,
  },
  searchResultTitle: {
    fontWeight: "500",
    marginBottom: 2,
  },
  searchResultSubtitle: {},
  searchLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  searchLoadingText: {
    marginLeft: 8,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: "center",
  },
  noResultsText: {},
  mapInstructions: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  instructionsText: {
    textAlign: "center",
  },
  locationSelectionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  activeButton: {
    borderWidth: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Add this to the styles object
scrollContentContainer: {
  paddingBottom: 20,
},
});

export default LocationSelector;