import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const performanceData = [
  { month: "Jan", earnings: 2400, bookings: 12 },
  { month: "Feb", earnings: 1398, bookings: 8 },
  { month: "Mar", earnings: 9800, bookings: 18 },
  { month: "Apr", earnings: 3908, bookings: 15 },
  { month: "May", earnings: 4800, bookings: 22 },
  { month: "Jun", earnings: 3800, bookings: 19 },
];

export function PerformanceChart() {
  const earningsData = performanceData.map(item => ({
    value: item.earnings,
    label: item.month,
    dataPointText: `$${item.earnings}`,
  }));

  const bookingsData = performanceData.map(item => ({
    value: item.bookings,
    label: item.month,
    dataPointText: `${item.bookings}`,
  }));

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>Performance Overview</Title>
          <Icon name="chart-line" size={24} color="#6c757d" />
        </View>
        <View style={styles.chartContainer}>
          <LineChart
            data={earningsData}
            data2={bookingsData}
            height={200}
            width={Dimensions.get('window').width - 32}
            color1="#007bff"
            color2="#28a745"
            dataPointsColor1="#007bff"
            dataPointsColor2="#28a745"
            textColor1="black"
            hideDataPoints={false}
            yAxisThickness={0}
            xAxisThickness={0}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, borderRadius: 8, elevation: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
  chartContainer: { alignItems: 'center' },
});