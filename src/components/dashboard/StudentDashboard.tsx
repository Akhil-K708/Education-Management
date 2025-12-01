import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';

// API Imports
import { getClassStudents, getStudentAttendance } from '../../api/attendanceApi';
import { getAllExams } from '../../api/examApi';
import { getStudentExamResult } from '../../api/resultsApi';
import { getStudentProfile } from '../../api/studentService';
import { useAuth } from '../../context/AuthContext';

// Components
import { AttendanceChart } from './AttendanceChart';
import { ClassStatsCard } from './ClassStatsCard';
import { DashboardStatCard } from './DashboardStatCard';
import { EventCalendar } from './EventCalendar';
import { NoticeBoard } from './NoticeBoard';
import { ProfileCard } from './ProfileCard';

// Types
import {
  AttendanceChartData,
  ClassStats,
  StudentProfileInfo,
} from '../../types/dashboard';

// 🔥 1. DEFINE BASE URL & HELPER
const API_BASE_URL = 'http://192.168.0.112:8080';

const getFullImageUrl = (url: string | undefined | null) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('https')) return url;
  // Remove leading slash if present
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `${API_BASE_URL}/${cleanPath}`;
};

export const StudentDashboard = () => {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  
  // Data States
  const [profile, setProfile] = useState<StudentProfileInfo | null>(null);
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [attendanceChart, setAttendanceChart] = useState<AttendanceChartData | null>(null);
  
  // Single Value Stats
  const [attendancePercentage, setAttendancePercentage] = useState<string>('0%');
  const [overallMarksPercentage, setOverallMarksPercentage] = useState<string>('0%');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.username) return;
      setLoading(true);

      try {
        // 1. Fetch Profile
        const profileDTO = await getStudentProfile(user.username);
        
        setProfile({
          name: profileDTO.fullName,
          class: profileDTO.grade,
          section: profileDTO.section,
          studentId: profileDTO.studentId,
          fatherName: profileDTO.fatherName,
          // 🔥 2. USE HELPER HERE TO FIX IMAGE URL
          profilePhotoUrl: getFullImageUrl(profileDTO.profileImageUrl),
        });

        // 2. Fetch Class Stats (Boys/Girls Count)
        if (profileDTO.classSectionId) {
          const classmates = await getClassStudents(profileDTO.classSectionId);
          const total = classmates.length;
          const boys = classmates.filter((s: any) => s.gender === 'Male').length;
          const girls = classmates.filter((s: any) => s.gender === 'Female').length;
          
          setClassStats({ total, boys, girls });
        }

        // 3. Fetch Attendance (Current Month + Chart Data)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        // A. Current Month Percentage
        const currAtt = await getStudentAttendance(user.username, currentYear, currentMonth);
        setAttendancePercentage(`${currAtt.percentage.toFixed(1)}%`);

        // B. Last 6 Months Data for Chart
        const monthsLabels: string[] = [];
        const attendanceValues: number[] = [];
        const chartPromises = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const mName = d.toLocaleString('default', { month: 'short' });
          monthsLabels.push(mName);
          
          chartPromises.push(
            getStudentAttendance(user.username, d.getFullYear(), d.getMonth() + 1)
              .then(res => res.percentage || 0)
              .catch(() => 0)
          );
        }

        const chartResults = await Promise.all(chartPromises);
        chartResults.forEach(val => attendanceValues.push(val));

        setAttendanceChart({
          labels: monthsLabels,
          datasets: [{ data: attendanceValues }]
        });

        // 4. Fetch Overall Marks (Latest Published Exam)
        if (profileDTO.classSectionId) {
          const allExams = await getAllExams();
          // Filter Published & Sort by Date (Latest First)
          const publishedExams = allExams
            .filter(e => e.status === 'PUBLISHED')
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

          if (publishedExams.length > 0) {
            const latestExam = publishedExams[0];
            const result = await getStudentExamResult(latestExam.examId, user.username, profileDTO.classSectionId);
            
            if (result && result.stats.percentage) {
              setOverallMarksPercentage(result.stats.percentage);
            }
          }
        }

      } catch (e) {
        console.error("Dashboard Data Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
            value={attendancePercentage}
            iconName="checkmark-done-outline"
            color="#2563EB"
          />

          <DashboardStatCard
            title="Overall Marks"
            value={overallMarksPercentage}
            iconName="star-outline"
            color="#10B981"
          />
          
          <EventCalendar />
          <ClassStatsCard stats={classStats} />
          <AttendanceChart data={attendanceChart} />
          <NoticeBoard />
        </View>
      </ScrollView>
    );
  }

  // WEB VIEW
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
                    value={attendancePercentage}
                    iconName="checkmark-done-outline"
                    color="#2563EB"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DashboardStatCard
                    title="Overall Marks"
                    value={overallMarksPercentage}
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
            <NoticeBoard />
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