import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';

interface DashboardMetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: "rupee" | "calendar" | "star" | "trending-up" | "users" | "clock" | "home" | "bell";
  description?: string;
}

export function DashboardMetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description
}: DashboardMetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return { backgroundColor: '#10b981', color: '#ffffff' };
      case "negative":
        return { backgroundColor: '#ef4444', color: '#ffffff' };
      default:
        return { backgroundColor: '#e5e7eb', color: '#374151' };
    }
  };

  const renderIcon = () => {
    switch (icon) {
      case 'rupee':
        return <Icon name="rupee" size={24} color="#ffffff" />;
      case 'calendar':
        return <Icon name="calendar" size={24} color="#ffffff" />;
      case 'star':
        return <Icon name="star" size={24} color="#ffffff" />;
      case 'trending-up':
        return <MaterialIcon name="trending-up" size={24} color="#ffffff" />;
      case 'users':
        return <Icon name="users" size={24} color="#ffffff" />;
      case 'clock':
        return <Icon name="clock-o" size={24} color="#ffffff" />;
      case 'home':
        return <Icon name="home" size={24} color="#ffffff" />;
      case 'bell':
        return <Icon name="bell" size={24} color="#ffffff" />;
      default:
        return <Icon name="info-circle" size={24} color="#ffffff" />;
    }
  };

  const changeColors = getChangeColor();

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.value}>{value}</Text>
              {change && (
                <View style={[styles.changeBadge, { backgroundColor: changeColors.backgroundColor }]}>
                  <Text style={[styles.changeText, { color: changeColors.color }]}>
                    {change}
                  </Text>
                </View>
              )}
            </View>
            {description && (
              <Text style={styles.description}>{description}</Text>
            )}
          </View>
          <View style={styles.iconContainer}>
            {renderIcon()}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0,
    marginBottom: 16,
    width: '48%', // For grid layout
  },
  cardContent: {
    padding: 24,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  changeBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
  },
  iconContainer: {
    padding: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
});