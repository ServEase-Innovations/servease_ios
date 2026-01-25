/* eslint-disable */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react-native";

// Custom Badge component
const Badge = ({ 
  variant = "default", 
  className, 
  style,
  children 
}: { 
  variant?: string;
  className?: string;
  style?: any;
  children: React.ReactNode;
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.badgeSecondary;
      case "outline":
        return styles.badgeOutline;
      default:
        return styles.badgeDefault;
    }
  };

  return (
    <View style={[styles.badge, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

// ✅ Function to get status badge for service provider dashboard
export const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="secondary" style={styles.activeBadge}>
          <AlertCircle size={12} color="#3b82f6" style={styles.iconMargin} />
          <Text style={styles.activeText}>Active</Text>
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="secondary" style={styles.completedBadge}>
          <CheckCircle size={12} color="#10b981" style={styles.iconMargin} />
          <Text style={styles.completedText}>Completed</Text>
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="secondary" style={styles.cancelledBadge}>
          <XCircle size={12} color="#ef4444" style={styles.iconMargin} />
          <Text style={styles.cancelledText}>Cancelled</Text>
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge variant="secondary" style={styles.inProgressBadge}>
          <Clock size={12} color="#6b7280" style={styles.iconMargin} />
          <Text style={styles.inProgressText}>In Progress</Text>
        </Badge>
      );
    case "NOT_STARTED":
      return (
        <Badge variant="secondary" style={styles.notStartedBadge}>
          <Clock size={12} color="#6b7280" style={styles.iconMargin} />
          <Text style={styles.notStartedText}>Not Started</Text>
        </Badge>
      );
    default:
      return null;
  }
};

// ✅ Function to get booking type badge
export const getBookingTypeBadge = (type: string) => {
  switch (type) {
    case "ON_DEMAND":
      return (
        <Badge variant="outline" style={styles.onDemandBadge}>
          <Text style={styles.onDemandText}>On Demand</Text>
        </Badge>
      );
    case "MONTHLY":
      return (
        <Badge variant="outline" style={styles.monthlyBadge}>
          <Text style={styles.monthlyText}>Monthly</Text>
        </Badge>
      );
    case "SHORT_TERM":
      return (
        <Badge variant="outline" style={styles.shortTermBadge}>
          <Text style={styles.shortTermText}>Short Term</Text>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" style={styles.defaultTypeBadge}>
          <Text style={styles.defaultTypeText}>{type}</Text>
        </Badge>
      );
  }
};

// ✅ Function to get service title
export const getServiceTitle = (type: string) => {
  switch (type?.toLowerCase()) {
    case "cook":
      return "Home Cook";
    case "maid":
      return "Maid Service";
    case "nanny":
      return "Caregiver Service";
    case "cleaning":
      return "Cleaning Service";
    default:
      return "Home Service";
  }
};

const styles = StyleSheet.create({
  // Base badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeDefault: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  badgeSecondary: {
    backgroundColor: 'transparent',
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  iconMargin: {
    marginRight: 4,
  },
  
  // Status badge specific styles
  activeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  activeText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  completedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '500',
  },
  
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cancelledText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  
  inProgressBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
    borderColor: '#6b7280',
  },
  inProgressText: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '500',
  },
  
  notStartedBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.5)',
    borderColor: '#6b7280',
  },
  notStartedText: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Booking type badge styles
  onDemandBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  onDemandText: {
    color: '#9333ea',
    fontSize: 12,
    fontWeight: '500',
  },
  
  monthlyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  monthlyText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '500',
  },
  
  shortTermBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  shortTermText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '500',
  },
  
  defaultTypeBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  defaultTypeText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
});