// components/Invoice/Invoice.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
  Linking,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Feather';
import { useAppUser } from '../context/AppUserContext';
import { useAuth0 } from 'react-native-auth0';
import providerInstance from '../services/providerInstance';
import preferenceInstance from '../services/preferenceInstance';

interface InvoiceProps {
  booking: any;
  onClose?: () => void;
}

interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  rawData?: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
}

const Invoice: React.FC<InvoiceProps> = ({ booking, onClose }) => {
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const [logoBase64, setLogoBase64] = React.useState<string>('');
  const { appUser } = useAppUser();
  const { user: auth0User } = useAuth0();
  
  // State for customer addresses
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  
  // State for service provider details
  const [serviceProviderData, setServiceProviderData] = useState<any>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);

  // Load logo image and convert to base64
  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Try to load the logo from assets
        const imagePath = Platform.OS === 'android' 
          ? 'assets/src/assets/images/serveasologo.png'
          : '../assets/images/serveasologo.png';
        
        // Alternative: Use a data URI with a simple SVG fallback
        const logoSvg = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="#0A7CFF" />
          <text x="30" y="38" text-anchor="middle" fill="white" font-size="20" font-weight="bold">S</text>
        </svg>`;
        
        const base64Logo = await toBase64(logoSvg);
        setLogoBase64(`data:image/svg+xml;base64,${base64Logo}`);
      } catch (error) {
        console.error('Error loading logo:', error);
        // Fallback to SVG logo
        const fallbackSvg = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="28" fill="#0A7CFF" />
          <text x="30" y="38" text-anchor="middle" fill="white" font-size="20" font-weight="bold">S</text>
        </svg>`;
        const fallbackBase64 = await toBase64(fallbackSvg);
        setLogoBase64(`data:image/svg+xml;base64,${fallbackBase64}`);
      }
    };
    
    loadLogo();
  }, []);

  const toBase64 = (str: string): string => {
    if (global.btoa) {
      return global.btoa(str);
    }
    const chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output: string = '';
    let i: number = 0;
    while (i < str.length) {
      const byte1: number = str.charCodeAt(i++);
      const byte2: number = str.charCodeAt(i++);
      const byte3: number = str.charCodeAt(i++);
      const enc1: number = byte1 >> 2;
      const enc2: number = ((byte1 & 3) << 4) | (byte2 >> 4);
      let enc3: number = ((byte2 & 15) << 2) | (byte3 >> 6);
      let enc4: number = byte3 & 63;
      if (isNaN(byte2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(byte3)) {
        enc4 = 64;
      }
      output = output + 
        chars.charAt(enc1) + chars.charAt(enc2) + 
        chars.charAt(enc3) + chars.charAt(enc4);
    }
    return output;
  };

  const getServiceTitle = (type: string): string => {
    switch (type) {
      case 'maid':
        return 'Maid Service';
      case 'cook':
        return 'Cook Service';
      case 'nanny':
        return 'Nanny Service';
      default:
        return 'Service';
    }
  };

  const formatTimeToAMPM = (timeString: string): string => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      const displayMinute = minute.toString().padStart(2, '0');
      return `${displayHour}:${displayMinute} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  const escapeHtml = (text: string): string => {
    if (!text) return '';
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m: string): string => map[m]);
  };

  // Fetch customer addresses from API
  const fetchCustomerAddresses = async (customerId: number) => {
    setIsLoadingAddresses(true);
    try {
      const response = await preferenceInstance.get(`/api/user-settings/${customerId}`);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const allSavedLocations = data.flatMap((doc: any) => doc.savedLocations || []);
        const uniqueAddresses = new Map();

        allSavedLocations
          .filter((loc: any) => loc.location?.address?.[0]?.formatted_address)
          .forEach((loc: any, idx: number) => {
            const primaryAddress = loc.location.address[0];
            const addressComponents = primaryAddress.address_components || [];

            const getComponent = (type: string) => {
              const component = addressComponents.find((c: any) => c.types.includes(type));
              return component?.long_name || '';
            };

            const locationKey =
              loc.location.lat && loc.location.lng
                ? `${loc.location.lat},${loc.location.lng}`
                : primaryAddress.formatted_address;

            if (!uniqueAddresses.has(locationKey)) {
              uniqueAddresses.set(locationKey, {
                id: loc._id || `addr_${idx}`,
                type: loc.name || 'Other',
                street: primaryAddress.formatted_address,
                city: getComponent('locality') || '',
                country: getComponent('country') || '',
                postalCode: getComponent('postal_code') || '',
                rawData: {
                  formattedAddress: primaryAddress.formatted_address,
                  latitude: loc.location.lat,
                  longitude: loc.location.lng,
                  placeId: primaryAddress.place_id,
                },
              });
            }
          });

        const mappedAddresses = Array.from(uniqueAddresses.values());
        setCustomerAddresses(mappedAddresses);
      }
    } catch (err) {
      console.error('Failed to fetch customer addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Fetch service provider data
  const fetchServiceProviderData = async (providerId: number) => {
    setIsLoadingProvider(true);
    try {
      const response = await providerInstance.get(`/api/service-providers/serviceprovider/${providerId}`);
      const data = response.data.data;
      setServiceProviderData(data);
    } catch (error) {
      console.error('Failed to fetch service provider data:', error);
    } finally {
      setIsLoadingProvider(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    const customerId = appUser?.customerid || booking.customerId;
    if (customerId) {
      fetchCustomerAddresses(customerId);
    }
    
    const providerId = booking.serviceProviderId || booking.providerId;
    if (providerId) {
      fetchServiceProviderData(providerId);
    }
  }, [appUser, booking]);

  // Get customer first name
  const getCustomerFirstName = (): string => {
    if (appUser?.firstName) return appUser.firstName;
    if (appUser?.firstname) return appUser.firstname;
    if (auth0User?.given_name) return auth0User.given_name;
    if (booking.firstName) return booking.firstName;
    if (booking.firstname) return booking.firstname;
    if (booking.customer?.firstName) return booking.customer.firstName;
    if (booking.customer?.firstname) return booking.customer.firstname;
    return '';
  };

  // Get customer last name
  const getCustomerLastName = (): string => {
    if (appUser?.lastName) return appUser.lastName;
    if (appUser?.lastname) return appUser.lastname;
    if (auth0User?.family_name) return auth0User.family_name;
    if (booking.lastName) return booking.lastName;
    if (booking.lastname) return booking.lastname;
    if (booking.customer?.lastName) return booking.customer.lastName;
    if (booking.customer?.lastname) return booking.customer.lastname;
    return '';
  };

  // Get customer full name
  const getCustomerFullName = (): string => {
    const firstName = getCustomerFirstName();
    const lastName = getCustomerLastName();
    
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    if (appUser?.name) return appUser.name;
    if (auth0User?.name) return auth0User.name;
    return 'Customer';
  };

  // Get customer email
  const getCustomerEmail = (): string => {
    if (appUser?.email) return appUser.email;
    if (auth0User?.email) return auth0User.email;
    if (booking.email) return booking.email;
    return '';
  };

  // Get customer phone
  const getCustomerPhone = (): string => {
    if (appUser?.mobileno) return appUser.mobileno;
    if (booking.mobileno) return booking.mobileno;
    if (booking.customer?.mobileno) return booking.customer.mobileno;
    return '';
  };

  // Get formatted customer address (only primary/home address)
  const getFormattedCustomerAddress = (): string => {
    if (customerAddresses.length > 0) {
      // Return the home address or first address
      const homeAddress = customerAddresses.find(addr => addr.type === 'Home') || customerAddresses[0];
      if (homeAddress) {
        return `${homeAddress.street}, ${homeAddress.city}, ${homeAddress.country} - ${homeAddress.postalCode}`;
      }
    }
    
    // Fallback to booking data
    if (booking.customerAddress && booking.customerAddress !== 'Customer Address') {
      return booking.customerAddress;
    }
    if (booking.address && booking.address !== 'Address') {
      return booking.address;
    }
    
    return 'Address not available';
  };

  // Get service provider name
  const getServiceProviderName = (): string => {
    if (serviceProviderData?.firstName || serviceProviderData?.lastName) {
      return `${serviceProviderData.firstName || ''} ${serviceProviderData.lastName || ''}`.trim();
    }
    if (booking.serviceProviderName) return booking.serviceProviderName;
    if (booking.service_provider_name) return booking.service_provider_name;
    if (booking.provider_name) return booking.provider_name;
    return 'Not assigned';
  };

  // Get service provider address
  const getServiceProviderFullAddress = (): string => {
    if (serviceProviderData) {
      // Check for permanent address first
      if (serviceProviderData.permanentAddress) {
        const addr = serviceProviderData.permanentAddress;
        const parts = [addr.field1, addr.field2, addr.ctarea, addr.state, addr.country, addr.pinno].filter(Boolean);
        if (parts.length) return parts.join(', ');
      }
      // Check for correspondence address
      if (serviceProviderData.correspondenceAddress) {
        const addr = serviceProviderData.correspondenceAddress;
        const parts = [addr.field1, addr.field2, addr.ctarea, addr.state, addr.country, addr.pinno].filter(Boolean);
        if (parts.length) return parts.join(', ');
      }
      // Use individual fields
      const parts = [
        serviceProviderData.street,
        serviceProviderData.locality,
        serviceProviderData.currentLocation,
        serviceProviderData.pincode
      ].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
    
    // Fallback to booking data
    if (booking.serviceProviderAddress) return booking.serviceProviderAddress;
    if (booking.provider_address) return booking.provider_address;
    return 'Address not available';
  };

  const getServiceAddress = (): string => {
    if (booking.serviceAddress && booking.serviceAddress !== 'Service Address') {
      return booking.serviceAddress;
    }
    if (booking.service_location) {
      return booking.service_location;
    }
    if (booking.address) {
      return booking.address;
    }
    return getFormattedCustomerAddress();
  };

  const getTaskType = (): string => {
    if (booking.taskType) return booking.taskType;
    if (booking.mealType) return booking.mealType;
    return 'Breakfast, Lunch, Dinner';
  };

  const getBookingType = (): string => {
    if (booking.bookingType) {
      if (booking.bookingType === 'MONTHLY') return 'Monthly';
      if (booking.bookingType === 'ON_DEMAND') return 'On Demand';
      if (booking.bookingType === 'SHORT_TERM') return 'Short Term';
      return booking.bookingType;
    }
    return 'Regular';
  };

  const getCouponDiscount = (): number => {
    if (booking.payment?.coupon_discount) return booking.payment.coupon_discount;
    if (booking.coupon_discount) return booking.coupon_discount;
    return 0;
  };

  const isAndroid13OrAbove = (): boolean => {
    return Platform.OS === 'android' && Platform.Version >= 33;
  };

  const openAppSettings = (): void => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    
    try {
      if (isAndroid13OrAbove()) {
        return true;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission Required',
            message: 'App needs access to your storage to save invoices',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  const generateHTMLContent = (): string => {
    const customerFirstName = getCustomerFirstName();
    const customerLastName = getCustomerLastName();
    const customerFullName = getCustomerFullName();
    const customerEmail = getCustomerEmail();
    const customerPhone = getCustomerPhone();
    const customerAddress = getFormattedCustomerAddress();
    const serviceAddress = getServiceAddress();
    const taskType = getTaskType();
    const scheduleType = getBookingType();
    const couponDiscount = getCouponDiscount();
    const serviceProviderName = getServiceProviderName();
    const serviceProviderAddress = getServiceProviderFullAddress();
    
    console.log('=== INVOICE DETAILS ===');
    console.log('Customer Name:', customerFullName);
    console.log('Customer Address:', customerAddress);
    console.log('Service Provider:', serviceProviderName);
    
    // Use the base64 logo (either loaded from assets or fallback SVG)
    const logoDataUrl = logoBase64 || `data:image/svg+xml;base64,${toBase64(`<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" fill="#0A7CFF" />
      <text x="30" y="38" text-anchor="middle" fill="white" font-size="20" font-weight="bold">S</text>
    </svg>`)}`;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${booking.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: ${Platform.OS === 'ios' ? '-apple-system' : 'Roboto'}, Arial, sans-serif;
              margin: 0;
              padding: 40px 20px;
              color: #333;
              background: #f5f5f5;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .content { padding: 40px; }
            .header-section {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e0e0e0;
            }
            .logo-area { display: flex; align-items: center; gap: 15px; }
            .logo { width: 60px; height: 60px; object-fit: contain; }
            .company-name-large { font-size: 24px; font-weight: bold; color: #0A7CFF; }
            .tax-invoice { text-align: right; }
            .tax-invoice-title { font-size: 28px; font-weight: bold; color: #0A7CFF; }
            .tax-invoice-sub { font-size: 14px; color: #666; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #0A7CFF;
              color: #0A7CFF;
            }
            .info-card {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
              line-height: 1.5;
            }
            .info-label {
              font-weight: 600;
              width: 140px;
              color: #555;
            }
            .info-value { flex: 1; color: #333; }
            .address-block {
              background: #f0f7ff;
              border-radius: 8px;
              padding: 15px;
              margin-top: 10px;
              border-left: 4px solid #0A7CFF;
            }
            .address-title {
              font-weight: 600;
              margin-bottom: 8px;
              color: #0A7CFF;
            }
            .payment-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .payment-table tr { border-bottom: 1px solid #e0e0e0; }
            .payment-table td { padding: 12px; }
            .payment-table td:first-child { text-align: left; }
            .payment-table td:last-child { text-align: right; }
            .total-row { font-weight: bold; background: #f8f9fa; }
            .total-row td { border-top: 2px solid #0A7CFF; }
            .payment-status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 500;
            }
            .status-success { background: #d4edda; color: #155724; }
            .status-pending { background: #fff3cd; color: #856404; }
            .company-footer {
              margin-top: 40px;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .company-name-footer { font-size: 18px; font-weight: bold; color: #0A7CFF; margin-bottom: 10px; }
            .company-address { font-size: 13px; color: #666; margin-bottom: 10px; }
            .company-details { font-size: 12px; color: #666; margin-bottom: 5px; }
            .gst-details { font-size: 12px; color: #666; margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0; }
            .disclaimer { font-size: 11px; color: #999; font-style: italic; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="content">
              
              <!-- Header with Logo -->
              <div class="header-section">
                <div class="logo-area">
                  <img src="${logoDataUrl}" alt="ServEaso Logo" class="logo" />
                  <div class="company-name-large">ServEaso</div>
                </div>
                <div class="tax-invoice">
                  <div class="tax-invoice-title">TAX INVOICE</div>
                  <div class="tax-invoice-sub">Invoice #: INV-${booking.id}</div>
                  <div class="tax-invoice-sub">Date: ${dayjs().format('MMMM D, YYYY')}</div>
                </div>
              </div>

              <!-- Customer Information -->
              <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-card">
                  <div class="info-row">
                    <div class="info-label">Name:</div>
                    <div class="info-value">${escapeHtml(customerFullName)}</div>
                  </div>
                  ${customerEmail ? `
                  <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value">${escapeHtml(customerEmail)}</div>
                  </div>
                  ` : ''}
                  ${customerPhone ? `
                  <div class="info-row">
                    <div class="info-label">Phone:</div>
                    <div class="info-value">${escapeHtml(customerPhone)}</div>
                  </div>
                  ` : ''}
                </div>
                <div class="address-block">
                  <div class="address-title">📍 Customer Address</div>
                  <div class="info-value">${escapeHtml(customerAddress)}</div>
                </div>
              </div>

              <!-- Service Information -->
              <div class="section">
                <div class="section-title">Service Information</div>
                <div class="info-card">
                  <div class="info-row">
                    <div class="info-label">Service Type:</div>
                    <div class="info-value">${getServiceTitle(booking.service_type)}</div>
                  </div>
                  ${booking.service_type === 'cook' ? `
                  <div class="info-row">
                    <div class="info-label">Task Type:</div>
                    <div class="info-value">${escapeHtml(taskType)}</div>
                  </div>
                  ` : ''}
                  <div class="info-row">
                    <div class="info-label">Schedule:</div>
                    <div class="info-value">${dayjs(booking.startDate).format('MMMM D, YYYY')} - ${dayjs(booking.endDate).format('MMMM D, YYYY')}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Type:</div>
                    <div class="info-value">${escapeHtml(scheduleType)}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Time Slot:</div>
                    <div class="info-value">${formatTimeToAMPM(booking.start_time)} - ${formatTimeToAMPM(booking.end_time)}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Service Provider:</div>
                    <div class="info-value"><strong>${escapeHtml(serviceProviderName)}</strong></div>
                  </div>
                </div>
                <div class="address-block">
                  <div class="address-title">📍 Service Address</div>
                  <div class="info-value">${escapeHtml(serviceAddress)}</div>
                </div>
                ${serviceProviderAddress !== 'Address not available' ? `
                <div class="address-block" style="margin-top: 10px;">
                  <div class="address-title">👤 Service Provider Address</div>
                  <div class="info-value">${escapeHtml(serviceProviderAddress)}</div>
                </div>
                ` : ''}
              </div>

              <!-- Payment Information -->
              <div class="section">
                <div class="section-title">Payment Information</div>
                <table class="payment-table">
                  <tr><td>Base Amount</td><td>₹${booking.payment?.base_amount || 0}</td></tr>
                  <tr><td>Coupon Applied</td><td>₹${couponDiscount}</td></tr>
                  <tr><td>Platform Fee</td><td>₹${booking.payment?.platform_fee || 0}</td></tr>
                  <tr><td>Tax (GST 18%)</td><td>₹${booking.payment?.gst || 0}</td></tr>
                  <tr class="total-row"><td><strong>Total Amount</strong></td><td><strong>₹${booking.payment?.total_amount || 0}</strong></td></tr>
                </table>
                <div style="margin-top: 15px;">
                  <div style="font-weight: 600; margin-bottom: 5px;">Payment Status:</div>
                  <div class="payment-status ${booking.payment?.status === 'SUCCESS' ? 'status-success' : 'status-pending'}">
                    ${booking.payment?.status || 'N/A'}
                  </div>
                </div>
                <div style="margin-top: 10px;">
                  <div style="font-weight: 600; margin-bottom: 5px;">Payment Mode:</div>
                  <div style="text-transform: capitalize;">${booking.payment?.payment_mode || 'N/A'}</div>
                </div>
                ${booking.payment?.transaction_id ? `
                <div style="margin-top: 10px;">
                  <div style="font-weight: 600; margin-bottom: 5px;">Transaction ID:</div>
                  <div>${booking.payment.transaction_id}</div>
                </div>
                ` : ''}
              </div>

              <!-- Company Footer -->
              <div class="company-footer">
                <div class="company-name-footer">ServEaso</div>
                <div class="company-address">#45, 2nd Cross, Indiranagar, Bengaluru - 560038</div>
                <div class="company-details">📞 +91 80 1234 5678 | ✉️ support@serveaso.com</div>
                <div class="gst-details">
                  <strong>GST Details:</strong><br/>
                  PAN: AAICS1234E | GST: 29AAICS1234E1Z | TAN: BLR S1234F<br/>
                  CIN: U74999KA2023PTC123456
                </div>
                <div class="disclaimer">
                  This is a system generated invoice and does not require a physical signature.<br/>
                  For any queries, please contact our support team.
                </div>
              </div>

            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async (): Promise<void> => {
    try {
      setIsGenerating(true);
      
      const hasPermission: boolean = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is needed to save invoices. Please grant permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openAppSettings() },
          ]
        );
        setIsGenerating(false);
        return;
      }

      const htmlContent: string = generateHTMLContent();
      const fileName: string = `Invoice_${booking.id}_${dayjs().format('YYYYMMDD_HHmmss')}.html`;
      
      let savePath: string;
      if (Platform.OS === 'android') {
        savePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        savePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }
      
      await RNFS.writeFile(savePath, htmlContent, 'utf8');
      
      await Share.open({
        url: `file://${savePath}`,
        type: 'text/html',
        title: `Invoice #${booking.id}`,
      });
      
      Alert.alert('Success', `Invoice saved to ${Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder!`);
      
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'SUCCESS': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'FAILED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <LinearGradient
          colors={["#0a2a66ff", "#004aadff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {onClose && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>Invoice</Text>
            </View>
            <TouchableOpacity 
              style={styles.downloadButton} 
              onPress={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="download" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Invoice Number:</Text>
            <Text style={styles.previewValue}>INV-{booking.id}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Invoice Date:</Text>
            <Text style={styles.previewValue}>{dayjs().format('MMMM D, YYYY')}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Customer Name:</Text>
            <Text style={styles.previewValue}>{getCustomerFullName()}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Service Provider:</Text>
            <Text style={styles.previewValue}>{getServiceProviderName()}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Total Amount:</Text>
            <Text style={styles.previewAmount}>₹{booking.payment?.total_amount || 0}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Payment Status:</Text>
            <Text style={[styles.previewStatus, { color: getPaymentStatusColor(booking.payment?.status) }]}>
              {booking.payment?.status || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Loading indicator for addresses */}
        {(isLoadingAddresses || isLoadingProvider) && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#0A7CFF" />
            <Text style={styles.loadingText}>Loading address details...</Text>
          </View>
        )}

        {/* Service Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Service Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type:</Text>
            <Text style={styles.detailValue}>{getServiceTitle(booking.service_type)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer Name:</Text>
            <Text style={styles.detailValue}>{getCustomerFullName()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer Address:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{getFormattedCustomerAddress()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Provider:</Text>
            <Text style={styles.detailValue}>{getServiceProviderName()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {dayjs(booking.startDate).format('MMM D, YYYY')} - {dayjs(booking.endDate).format('MMM D, YYYY')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {formatTimeToAMPM(booking.start_time)} - {formatTimeToAMPM(booking.end_time)}
            </Text>
          </View>
        </View>

        {/* Payment Breakdown Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Payment Breakdown</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Base Amount</Text>
            <Text style={styles.paymentValue}>₹{booking.payment?.base_amount || 0}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Coupon Applied</Text>
            <Text style={styles.paymentValue}>₹{getCouponDiscount()}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Platform Fee</Text>
            <Text style={styles.paymentValue}>₹{booking.payment?.platform_fee || 0}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>GST (18%)</Text>
            <Text style={styles.paymentValue}>₹{booking.payment?.gst || 0}</Text>
          </View>
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{booking.payment?.total_amount || 0}</Text>
          </View>
        </View>

        {/* Note Card */}
        <View style={styles.noteCard}>
          <Icon name="info" size={16} color="#666" />
          <Text style={styles.noteText}>
            Tap "Download" to save invoice as HTML file. The file will be saved in your device's Downloads folder.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  downloadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  previewAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A7CFF',
  },
  previewStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#0A7CFF',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: '35%',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    width: '60%',
    textAlign: 'right',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A7CFF',
  },
  noteCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
});

export default Invoice;