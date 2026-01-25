/* eslint-disable */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';

interface Booking {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "in-progress" | "completed" | "cancelled";
  amount: string;
  contact: string;
}

interface BookingCardProps {
  booking: Booking;
  onContactClient?: (booking: Booking) => void;
}

export function BookingCard({ booking, onContactClient }: BookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return { backgroundColor: '#3b82f6', color: '#ffffff' };
      case "in-progress":
        return { backgroundColor: '#f59e0b', color: '#ffffff' };
      case "completed":
        return { backgroundColor: '#10b981', color: '#ffffff' };
      case "cancelled":
        return { backgroundColor: '#ef4444', color: '#ffffff' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151' };
    }
  };

  const statusColors = getStatusColor(booking.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.clientName}>{booking.clientName}</Text>
            <Text style={styles.service}>{booking.service}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.badge, { backgroundColor: statusColors.backgroundColor }]}>
              <Text style={[styles.badgeText, { color: statusColors.color }]}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.amount}>{booking.amount}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{booking.date}</Text>
            <Icon name="clock-o" size={16} color="#6b7280" style={styles.iconMargin} />
            <Text style={styles.detailText}>{booking.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <FeatherIcon name="map-pin" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{booking.location}</Text>
          </View>
        </View>

        {booking.status === "upcoming" && onContactClient && (
          <View style={styles.contactSection}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => onContactClient(booking)}
            >
              <MaterialIcon name="phone" size={16} color="#000000" style={styles.buttonIcon} />
              <Text style={styles.contactButtonText}>Contact Client</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0,
  },
  cardContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  service: {
    color: '#6b7280',
    fontWeight: '500',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  iconMargin: {
    marginLeft: 8,
  },
  contactSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: '100%',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  buttonIcon: {
    marginRight: 8,
  },
});