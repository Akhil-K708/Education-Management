import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { ChartData } from '../../types/dashboard';

const screenWidth = Dimensions.get('window').width;

interface EarningsChartProps {
  data: ChartData;
}

export const EarningsChart = ({ data }: EarningsChartProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Earnings</Text>
      <BarChart
        data={data}
        width={screenWidth > 500 ? 500 : screenWidth - 60}
        height={250}
        yAxisLabel="₹"
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1, index) => {
            const colors = ['rgba(37, 99, 235,', 'rgba(245, 158, 11,'];
            return `${colors[index % colors.length]} ${opacity})`;
          },
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
        }}
        verticalLabelRotation={0}
        fromZero
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});