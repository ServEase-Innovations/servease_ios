// components/Invoice/Invoice.tsx
import React from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Feather';

interface InvoiceProps {
  booking: any;
  onClose?: () => void;
}

const Invoice: React.FC<InvoiceProps> = ({ booking, onClose }) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

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

  // Check if Android version is 13 or above
  const isAndroid13OrAbove = () => {
    return Platform.OS === 'android' && Platform.Version >= 33;
  };

  // Open app settings
  const openAppSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  };

  // Check if we have permission to write files
  const hasStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    
    try {
      if (isAndroid13OrAbove()) {
        // For Android 13+, we don't need explicit storage permission for Downloads folder
        // We can write to Downloads without permission
        return true;
      } else {
        // For Android 12 and below, check WRITE_EXTERNAL_STORAGE
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        return granted;
      }
    } catch (err) {
      console.warn('Error checking permission:', err);
      return false;
    }
  };

  // Request storage permission (only for Android 12 and below)
  const requestStoragePermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    
    try {
      if (isAndroid13OrAbove()) {
        // On Android 13+, no need to request storage permission for Downloads
        return true;
      } else {
        // For Android 12 and below, request WRITE_EXTERNAL_STORAGE
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
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${booking.id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
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
            .content {
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 32px;
              font-weight: bold;
              color: #0A7CFF;
              margin: 0 0 5px 0;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: 600;
              margin: 10px 0;
              color: #666;
            }
            .company-tagline {
              color: #666;
              font-size: 14px;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
              flex-wrap: wrap;
            }
            .detail-group {
              flex: 1;
              min-width: 200px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #0A7CFF;
              color: #0A7CFF;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: 600;
              color: #666;
              margin-bottom: 5px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-value {
              font-size: 16px;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e0e0e0;
            }
            th {
              background: #f8f9fa;
              font-weight: 600;
              color: #666;
            }
            .total-row {
              font-weight: bold;
              background: #f8f9fa;
            }
            .total-row td {
              border-top: 2px solid #0A7CFF;
            }
            .payment-status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 14px;
              font-weight: 500;
            }
            .status-success {
              background: #d4edda;
              color: #155724;
            }
            .status-pending {
              background: #fff3cd;
              color: #856404;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              text-align: center;
              border-top: 1px solid #e0e0e0;
              font-size: 12px;
              color: #666;
            }
            .tasks-list {
              list-style: none;
              padding-left: 0;
            }
            .tasks-list li {
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .invoice-container {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="content">
              <div class="header">
                <h1 class="company-name">Serveaso</h1>
                <div class="invoice-title">INVOICE</div>
                <div class="company-tagline">Professional Service Solutions</div>
              </div>

              <div class="invoice-details">
                <div class="detail-group">
                  <div class="info-label">Invoice Number:</div>
                  <div class="info-value">INV-${booking.id}</div>
                  <div class="info-label" style="margin-top: 10px;">Invoice Date:</div>
                  <div class="info-value">${dayjs().format('MMMM D, YYYY')}</div>
                </div>
                <div class="detail-group">
                  <div class="info-label">Booking ID:</div>
                  <div class="info-value">#${booking.id}</div>
                  <div class="info-label" style="margin-top: 10px;">Booking Date:</div>
                  <div class="info-value">${dayjs(booking.bookingDate).format('MMMM D, YYYY')}</div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-grid">
                  <div>
                    <div class="info-label">Name:</div>
                    <div class="info-value">${booking.customerName || 'Customer'}</div>
                  </div>
                  <div>
                    <div class="info-label">Service Type:</div>
                    <div class="info-value">${getServiceTitle(booking.service_type)}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Service Details</div>
                <div class="info-grid">
                  <div>
                    <div class="info-label">Start Date:</div>
                    <div class="info-value">${dayjs(booking.startDate).format('MMMM D, YYYY')}</div>
                  </div>
                  <div>
                    <div class="info-label">End Date:</div>
                    <div class="info-value">${dayjs(booking.endDate).format('MMMM D, YYYY')}</div>
                  </div>
                  <div>
                    <div class="info-label">Time Slot:</div>
                    <div class="info-value">${formatTimeToAMPM(booking.start_time)} - ${formatTimeToAMPM(booking.end_time)}</div>
                  </div>
                  ${booking.serviceProviderName ? `
                  <div>
                    <div class="info-label">Service Provider:</div>
                    <div class="info-value">${booking.serviceProviderName}</div>
                  </div>
                  ` : ''}
                </div>
              </div>

              ${booking.responsibilities?.tasks?.length > 0 ? `
              <div class="section">
                <div class="section-title">Tasks & Responsibilities</div>
                <ul class="tasks-list">
                  ${booking.responsibilities.tasks.map((task: any) => `
                    <li>• ${task.taskType} ${Object.entries(task).filter(([key]) => key !== 'taskType').map(([key, value]) => `${value} ${key}`).join(', ')}</li>
                  `).join('')}
                </ul>
                ${booking.responsibilities.add_ons?.length > 0 ? `
                <div style="margin-top: 15px;">
                  <div class="info-label">Add-ons:</div>
                  <ul class="tasks-list">
                    ${booking.responsibilities.add_ons.map((addon: any) => `
                      <li>• ${addon.taskType}</li>
                    `).join('')}
                  </ul>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <div class="section">
                <div class="section-title">Payment Summary</div>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Base Amount</td>
                      <td>₹${booking.payment?.base_amount || 0}</td>
                    </tr>
                    <tr>
                      <td>Platform Fee</td>
                      <td>₹${booking.payment?.platform_fee || 0}</td>
                    </tr>
                    <tr>
                      <td>GST (18%)</td>
                      <td>₹${booking.payment?.gst || 0}</td>
                    </tr>
                    <tr class="total-row">
                      <td><strong>Total Amount</strong></td>
                      <td><strong>₹${booking.payment?.total_amount || 0}</strong></td>
                    </tr>
                  </tbody>
                </table>
                <div style="margin-top: 15px;">
                  <div class="info-label">Payment Status:</div>
                  <div class="payment-status ${booking.payment?.status === 'SUCCESS' ? 'status-success' : 'status-pending'}">
                    ${booking.payment?.status || 'N/A'}
                  </div>
                </div>
                <div style="margin-top: 10px;">
                  <div class="info-label">Payment Mode:</div>
                  <div class="info-value">${booking.payment?.payment_mode?.toUpperCase() || 'N/A'}</div>
                </div>
                ${booking.payment?.transaction_id ? `
                <div style="margin-top: 10px;">
                  <div class="info-label">Transaction ID:</div>
                  <div class="info-value">${booking.payment.transaction_id}</div>
                </div>
                ` : ''}
              </div>

              <div class="footer">
                <p>Thank you for choosing Serveaso!</p>
                <p>For any queries, please contact support@serveaso.com | +91 1234567890</p>
                <p>This is a computer-generated invoice and does not require a physical signature.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Request storage permission if needed (only for Android 12 and below)
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Storage permission is needed to save invoices on Android 12 and below. Please grant permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => openAppSettings()
            },
          ]
        );
        setIsGenerating(false);
        return;
      }

      const htmlContent = generateHTMLContent();
      const fileName = `Invoice_${booking.id}_${dayjs().format('YYYYMMDD_HHmmss')}.html`;
      
      // Choose appropriate directory based on platform
      let savePath;
      if (Platform.OS === 'android') {
        // For Android, save to Downloads folder (no permission needed for Android 13+)
        savePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        // For iOS, save to Documents directory
        savePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }
      
      console.log('Saving invoice to:', savePath);
      
      // Save HTML file
      await RNFS.writeFile(savePath, htmlContent, 'utf8');
      
      // Verify file was created
      const fileExists = await RNFS.exists(savePath);
      if (!fileExists) {
        throw new Error('File was not created successfully');
      }
      
      console.log('File saved successfully');
      
      // Share the file
      await Share.open({
        url: `file://${savePath}`,
        type: 'text/html',
        title: `Invoice #${booking.id}`,
        message: Platform.OS === 'android' 
          ? `Invoice saved to Downloads folder. You can find it in your device's Downloads folder.`
          : `Invoice generated.`,
      });
      
      Alert.alert(
        'Success', 
        `Invoice saved successfully!\n\nLocation: ${Platform.OS === 'android' ? 'Downloads folder' : 'Documents folder'}`
      );
      
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      
      // Handle specific errors
      if (error.message?.includes('EACCES') || error.message?.includes('permission')) {
        Alert.alert(
          'Permission Error',
          'Unable to save invoice due to storage permission. Please check app permissions in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => openAppSettings()
            },
          ]
        );
      } else if (error.message?.includes('ENOSPC')) {
        Alert.alert(
          'Storage Full',
          'Not enough storage space to save the invoice. Please free up some space and try again.'
        );
      } else {
        Alert.alert(
          'Error', 
          'Failed to generate invoice. Please try again.\n\nError: ' + (error.message || 'Unknown error')
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'FAILED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header with Linear Gradient */}
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

        {/* Invoice Summary Preview */}
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
            <Text style={styles.previewLabel}>Total Amount:</Text>
            <Text style={styles.previewAmount}>₹{booking.payment?.total_amount || 0}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Payment Status:</Text>
            <Text style={[
              styles.previewStatus,
              { color: getPaymentStatusColor(booking.payment?.status) }
            ]}>
              {booking.payment?.status || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Service Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service Type:</Text>
            <Text style={styles.detailValue}>{getServiceTitle(booking.service_type)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer Name:</Text>
            <Text style={styles.detailValue}>{booking.customerName || 'Customer'}</Text>
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
          {booking.serviceProviderName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service Provider:</Text>
              <Text style={styles.detailValue}>{booking.serviceProviderName}</Text>
            </View>
          )}
        </View>

        {/* Payment Breakdown */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Payment Breakdown</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Base Amount</Text>
            <Text style={styles.paymentValue}>₹{booking.payment?.base_amount || 0}</Text>
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

        {/* Tasks List */}
        {booking.responsibilities?.tasks?.length > 0 && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Tasks & Responsibilities</Text>
            {booking.responsibilities.tasks.map((task: any, index: number) => {
              const taskDetails = Object.entries(task)
                .filter(([key]) => key !== 'taskType')
                .map(([key, value]) => `${value} ${key}`)
                .join(', ');
              return (
                <View key={index} style={styles.taskItem}>
                  <Text style={styles.taskText}>
                    • {task.taskType} {taskDetails && `- ${taskDetails}`}
                  </Text>
                </View>
              );
            })}
            {booking.responsibilities.add_ons?.length > 0 && (
              <>
                <Text style={styles.addonsTitle}>Add-ons:</Text>
                {booking.responsibilities.add_ons.map((addon: any, index: number) => (
                  <View key={index} style={styles.taskItem}>
                    <Text style={styles.taskText}>• {addon.taskType}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Note */}
        <View style={styles.noteCard}>
          <Icon name="info" size={16} color="#666" />
          <Text style={styles.noteText}>
            Tap "Download" to save invoice as HTML file. The file will be saved in your device's Downloads folder. You can then open it in any browser and use "Save as PDF" option to convert to PDF.
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
    marginTop: 16,
    marginBottom: 16,
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
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
  taskItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskText: {
    fontSize: 14,
    color: '#333',
  },
  addonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
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