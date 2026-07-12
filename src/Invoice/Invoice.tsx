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
  InteractionManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Feather';
import { useAppUser } from '../context/AppUserContext';
import { useAuth0 } from 'react-native-auth0';
import providerInstance from '../services/providerInstance';
import preferenceInstance from '../services/preferenceInstance';
import { resolveCustomerId } from '../services/couponService';
import { generateInvoicePdfBase64 } from './generateInvoicePdf';

interface InvoiceProps {
  booking: any;
  onClose?: () => void;
  /** inline = download button only (web parity). full = preview screen with header. */
  variant?: 'inline' | 'full';
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

const Invoice: React.FC<InvoiceProps> = ({ booking, onClose, variant = 'full' }) => {
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { appUser } = useAppUser();
  const { user: auth0User } = useAuth0();
  
  // State for customer addresses
  const [customerAddresses, setCustomerAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  
  // State for service provider details
  const [serviceProviderData, setServiceProviderData] = useState<any>(null);
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);

  // Load saved addresses and provider details for the invoice preview.
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
    const customerId = resolveCustomerId(appUser) || booking.customerId;
    if (customerId) {
      fetchCustomerAddresses(Number(customerId));
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
    const rawType = String(booking.bookingType || '').toUpperCase();
    if (rawType === 'MONTHLY') return 'Monthly';
    if (rawType === 'SHORT_TERM') return 'Short-term';
    return 'One Time';
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

  const toNumber = (value: unknown): number => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const buildInvoicePdfInput = () => {
    const bookingId = booking.id;
    const startDate = booking.startDate ?? booking.bookingDate ?? new Date().toISOString();
    const endDate = booking.endDate ?? startDate;
    const startTime = booking.start_time ?? booking.startTime ?? '09:00';
    const endTime = booking.end_time ?? booking.endTime ?? '17:00';

    return {
      invoiceNumber: `INV-${bookingId}-${dayjs().format('YYYYMMDD')}`,
      invoiceDate: dayjs().format('DD MMM YYYY'),
      customerName: getCustomerFullName(),
      customerAddress: getFormattedCustomerAddress(),
      serviceAddress: getServiceAddress(),
      bookingId,
      serviceType: getServiceTitle(booking.service_type || booking.serviceType || 'service'),
      taskType: booking.service_type === 'cook' ? getTaskType() : undefined,
      schedule: `${dayjs(startDate).format('MMMM D, YYYY')} - ${dayjs(endDate).format('MMMM D, YYYY')}`,
      bookingType: getBookingType(),
      timeSlot: `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`,
      providerName: getServiceProviderName(),
      baseAmount: toNumber(booking.payment?.base_amount),
      couponDiscount: toNumber(
        booking.payment?.coupon_discount ?? booking.payment?.discount ?? getCouponDiscount()
      ),
      platformFee: toNumber(booking.payment?.platform_fee),
      gst: toNumber(booking.payment?.gst),
      totalAmount: toNumber(booking.payment?.total_amount),
      paymentStatus: String(booking.payment?.status || 'Completed'),
      paymentMode: String(booking.payment?.payment_mode || 'online').toUpperCase(),
      transactionId: booking.payment?.transaction_id || undefined,
    };
  };

  const handleDownload = async (): Promise<void> => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);

      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is needed to save invoices. Please grant permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openAppSettings() },
          ]
        );
        return;
      }

      const pdfBase64 = await generateInvoicePdfBase64(buildInvoicePdfInput());
      if (!pdfBase64) {
        throw new Error('Invoice PDF was empty');
      }

      const fileName = `invoice-${booking.id}-${dayjs().format('YYYYMMDD')}.pdf`;
      const savePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

      await ReactNativeBlobUtil.fs.writeFile(savePath, pdfBase64, 'base64');
      const fileExists = await ReactNativeBlobUtil.fs.exists(savePath);
      if (!fileExists) {
        throw new Error('Could not save invoice PDF on this device');
      }

      if (Platform.OS === 'ios') {
        const fileUrl = `file://${savePath}`;
        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(resolve, 400);
          });
        });
        ReactNativeBlobUtil.ios.previewDocument(fileUrl);
        return;
      }

      // Android: use FileProvider-backed intent (Share sheet often fails for Downloads paths).
      try {
        await ReactNativeBlobUtil.android.actionViewIntent(
          savePath,
          'application/pdf',
          `Invoice #${booking.id}`
        );
      } catch (viewError) {
        console.warn('Invoice actionViewIntent failed, trying share sheet', viewError);
        await Share.open({
          url: `file://${savePath}`,
          type: 'application/pdf',
          filename: fileName,
          title: `Invoice #${booking.id}`,
          subject: `Invoice #${booking.id}`,
          failOnCancel: false,
          showAppsToView: true,
        });
      }

      // Best-effort: also register in Downloads so user can find it later.
      try {
        const downloadPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;
        await ReactNativeBlobUtil.fs.writeFile(downloadPath, pdfBase64, 'base64');
        await ReactNativeBlobUtil.android.addCompleteDownload({
          title: fileName,
          description: 'ServEaso booking invoice',
          mime: 'application/pdf',
          path: downloadPath,
          showNotification: true,
        });
      } catch (downloadError) {
        console.warn('Invoice download registration skipped', downloadError);
      }
    } catch (error: any) {
      const message = String(error?.message || '');
      if (
        message === 'User did not share' ||
        message.includes('User did not share') ||
        error?.dismissedAction
      ) {
        return;
      }
      console.error('Invoice download error:', error);
      Alert.alert(
        'Error',
        message || 'Failed to generate invoice. Please try again.'
      );
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

  if (variant === 'inline') {
    return (
      <View style={styles.inlineWrap}>
        <TouchableOpacity
          style={styles.inlineButton}
          onPress={handleDownload}
          disabled={isGenerating}
          accessibilityRole="button"
          accessibilityLabel="Download Invoice PDF"
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <>
              <Icon name="download" size={20} color="#2563eb" />
              <Text style={styles.inlineButtonText}>
                {isGenerating ? 'Generating PDF…' : 'Download Invoice (PDF)'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.inlineHint}>
          Open the invoice preview for sharing or saving.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <LinearGradient
        colors={["#062a61", "#3680f8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: Math.max(insets.top, 12) }]}
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
                <Text style={styles.downloadButtonText}>
                  {isGenerating ? 'Generating…' : 'Download PDF'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
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
            {Platform.OS === 'android'
              ? 'Tap "Download PDF" to open the invoice. You can share it or save it from your PDF app or Downloads.'
              : 'Tap "Download PDF" to save or share the invoice. On iPhone you can save it to Files or share via Mail.'}
          </Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  inlineWrap: {
    marginTop: 16,
  },
  inlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#335baf',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  inlineButtonText: {
    color: '#335baf',
    fontSize: 15,
    fontWeight: '700',
  },
  inlineHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  headerGradient: {
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