import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { StudentDemographics } from '../../types/dashboard';

interface DemographicsProps {
  data: StudentDemographics;
}

export const StudentDemographicsChart = ({ data }: DemographicsProps) => {
  const [chartAreaWidth, setChartAreaWidth] = useState(300);

  const chartData = {
    labels: ['Male', 'Female'],
    data: [data.male / 100, data.female / 100],
    colors: ['#2563EB', '#F472B6'],
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Students</Text>
      
      <View 
        style={styles.contentContainer}
        onLayout={(event) => {
          setChartAreaWidth(event.nativeEvent.layout.width);
        }}
      >
        <View style={styles.chartWrapper}>
          <ProgressChart
            data={chartData}
            width={chartAreaWidth * 0.65}
            height={180}
            strokeWidth={14}
            radius={55}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              color: (opacity = 1, index: any) => chartData.colors[index] || `rgba(0, 0, 0, ${opacity})`,
            }}
            hideLegend={true}
          />
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: chartData.colors[0] }]} />
            <Text style={styles.legendText}>Male {data.male}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: chartData.colors[1] }]} />
            <Text style={styles.legendText}>Female {data.female}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
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
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  chartWrapper: {
    flex: 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flex: 0.3,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
  },
});