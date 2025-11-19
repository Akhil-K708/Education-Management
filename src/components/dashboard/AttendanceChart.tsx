import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AttendanceChartData } from '../../types/dashboard';

interface AttendanceChartProps {
  data: AttendanceChartData;
}

export const AttendanceChart = ({ data }: AttendanceChartProps) => {
  const [chartWidth, setChartWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setChartWidth(width);
  };

  return (
    <View style={styles.card} onLayout={handleLayout}>
      <Text style={styles.title}>Monthly Attendance Track</Text>
      {chartWidth > 0 && (
        <LineChart
          data={data}
          width={chartWidth - 40} 
          height={280}
          yAxisSuffix="%"
          yAxisInterval={10}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(17, 24, 39, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#F97316',
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 50, 
    paddingLeft: 50,  
  },
});