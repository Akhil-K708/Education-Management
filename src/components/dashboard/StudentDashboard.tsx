import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { getStudentDashboardData } from '../../api/dashboardApi';
import {
  AttendanceChartData,
  ClassStats,
  NoticeItem,
  StudentProfileInfo,
} from '../../types/dashboard';
import { AttendanceChart } from './AttendanceChart';
import { ClassStatsCard } from './ClassStatsCard';
import { DashboardStatCard } from './DashboardStatCard';
import { EventCalendar } from './EventCalendar';
import { NoticeBoard } from './NoticeBoard';
import { ProfileCard } from './ProfileCard';

export const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfileInfo | null>(null);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [attendanceChart, setAttendanceChart] = useState<AttendanceChartData | null>(null);
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768; 

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getStudentDashboardData();

        setProfile(data.profile);
        setClassStats(data.classStats);
        setNotices(data.notices);
        setAttendanceChart(data.attendanceChart);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !profile || !classStats || !attendanceChart) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (isMobile) {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.welcomeTitle}>Welcome, {profile.name}!</Text>
        <View style={styles.mobileGap}>
          <ProfileCard profile={profile} />
          <DashboardStatCard
            title="Attendance"
            value="92.5%"
            iconName="checkmark-done-outline"
            color="#2563EB"
          />

          <DashboardStatCard
            title="Marks"
            value="85.0%"
            iconName="star-outline"
            color="#10B981"
          />
          <EventCalendar />
          <ClassStatsCard stats={classStats} />
          <AttendanceChart data={attendanceChart} />
          <NoticeBoard notices={notices} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcomeTitle}>Welcome, {profile.name}!</Text>
      
      <View style={styles.webGrid}>
        <View style={styles.leftColumn}>
          <View style={styles.profileRow}>
             <View style={styles.profileWrapper}>
               <ProfileCard profile={profile} />
             </View>
             
             <View style={styles.statsWrapper}>
                <View style={{ marginBottom: 16, flex: 1 }}>
                  <DashboardStatCard
                    title="Attendance"
                    value="92.5%"
                    iconName="checkmark-done-outline"
                    color="#2563EB"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DashboardStatCard
                    title="Overall Marks"
                    value="85.0%"
                    iconName="star-outline"
                    color="#10B981"
                  />
                </View>
             </View>
          </View>

          <View style={styles.totalMembersWrapper}>
             <ClassStatsCard stats={classStats} />
          </View>

          <View style={styles.graphWrapper}>
            <AttendanceChart data={attendanceChart} />
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.calendarWrapper}>
            <EventCalendar />
          </View>
          
          <View style={styles.noticeWrapper}>
            <NoticeBoard notices={notices} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  mobileGap: {
    gap: 12,
    paddingBottom: 20,
  },
  mobileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  webGrid: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'flex-start', 
  },
  leftColumn: {
    flex: 2,
    flexDirection: 'column',
    gap: 24,
  },
  rightColumn: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 300,
  },
  profileRow: {
    flexDirection: 'row',
    height: 260,
    gap: 24,
  },
  profileWrapper: {
    flex: 1.5,
    height: '100%', 
  },
  statsWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  totalMembersWrapper: {
    width: '100%',
  },
  graphWrapper: {
    width: '100%',
  },
  calendarWrapper: {
    marginBottom: 24, 
    width: '100%',
  },
  noticeWrapper: {
    width: '100%',
  },
});