import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { getDashboardData } from '../../api/dashboardApi';
import { DashboardData } from '../../types/dashboard';
import { DashboardStatCard } from './DashboardStatCard';
import { EarningsChart } from './EarningsChart';
import { EventCalendar } from './EventCalendar';
import { NoticeBoard } from './NoticeBoard';
import { StudentDemographicsChart } from './StudentDemographicsChart';

export const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>Failed to load data. Please try again.</Text>
      </View>
    );
  }

  const { stats, earningsChart, studentDemographics, notices } = data;

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <DashboardStatCard
        title="Students"
        value={stats.students}
        iconName="people-outline"
        color="#2563EB"
      />
      <DashboardStatCard
        title="Teachers"
        value={stats.teachers}
        iconName="person-outline"
        color="#10B981"
      />
      <DashboardStatCard
        title="Pass Percentage"
        value={`${stats.passPercentage}%`}
        iconName="ribbon-outline"
        color="#F59E0B"
      />
      <DashboardStatCard
        title="Earnings"
        value={`₹${stats.earnings.toLocaleString()}`}
        iconName="cash-outline"
        color="#EF4444"
      />
    </View>
  );

  if (isMobile) {
    return (
      <View style={styles.container}> 
        {renderStats()}
        <EarningsChart data={earningsChart} />
        <EventCalendar />
        <StudentDemographicsChart data={studentDemographics} />
        <NoticeBoard notices={notices} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderStats()}
      <View style={styles.webContainer}>
        <View style={styles.leftColumn}>
          <EarningsChart data={earningsChart} />
          <NoticeBoard notices={notices} />
        </View>
        <View style={styles.rightColumn}>
          <EventCalendar />
          <StudentDemographicsChart data={studentDemographics} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftColumn: {
    flex: 2,
    minWidth: 300,
    marginRight: 8,
    flexDirection: 'column',
  },
  rightColumn: {
    flex: 1,
    minWidth: 300,
    marginLeft: 8,
    flexDirection: 'column',
  },
});