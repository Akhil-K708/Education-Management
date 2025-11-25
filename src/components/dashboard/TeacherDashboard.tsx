import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { getTeacherAssignments } from '../../api/assignmentApi';
import { getClassStudents } from '../../api/attendanceApi';
import { studentApi } from '../../api/axiosInstance';
import { getTeacherTimetable } from '../../api/timetableApi';
import { useAuth } from '../../context/AuthContext';
import { DashboardStatCard } from './DashboardStatCard';
import { EventCalendar } from './EventCalendar';
import { NoticeBoard } from './NoticeBoard';

export const TeacherDashboard = () => {
  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState<string>('');
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  
  // Stats State
  const [myClass, setMyClass] = useState<string>('N/A');
  const [studentCount, setStudentCount] = useState<number>(0);
  const [pendingReviews, setPendingReviews] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.username) return;
      setLoading(true);
      try {
        const timetableData = await getTeacherTimetable(user.username);
        
        if (timetableData) {
            setTeacherName(timetableData.teacherName || user.username);
            if (timetableData.weeklyTimetable) {
                const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
                const todaySchedule = timetableData.weeklyTimetable.find((d: any) => d.day === todayName);
                const periods = todaySchedule ? todaySchedule.periods : [];
                periods.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
                setTodaysClasses(periods);
            }
        }

        const classesRes = await studentApi.get(`/teacher/assigned-classes/${user.username}`);
        const assignedClasses = classesRes.data;

        if (assignedClasses && assignedClasses.length > 0) {
            const mainClass = assignedClasses[0]; 
            setMyClass(`${mainClass.className}-${mainClass.sectionName}`);
            const studentsRes = await getClassStudents(mainClass.classSectionId);
            setStudentCount(studentsRes.length);
        } else {
            setMyClass('Not Assigned');
            setStudentCount(0);
        }

        const assignments = await getTeacherAssignments(user.username);
        setPendingReviews(assignments.length);

      } catch (e) {
        console.error("Failed to load teacher dashboard", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  // --- Class Item Component ---
  const renderClassItem = ({ item }: { item: any }) => (
    <View style={styles.classItem}>
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{item.startTime}</Text>
        <View style={styles.verticalLine} />
        <Text style={styles.timeText}>{item.endTime}</Text>
      </View>
      
      <View style={styles.classInfoCard}>
        <View style={styles.classContent}>
            <Text style={styles.subjectName}>{item.subjectName}</Text>
            <View style={styles.rowMeta}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Class {item.className}-{item.section}</Text>
                </View>
                {item.roomNumber && (
                    <Text style={styles.roomText}>
                        <Ionicons name="location-outline" size={12} /> Room {item.roomNumber}
                    </Text>
                )}
            </View>
        </View>
        <View style={styles.statusIndicator} />
      </View>
    </View>
  );

  // 1. Welcome Section (Full Width)
  const WelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <View>
          <Text style={styles.welcomeTitle}>Hello, {teacherName}</Text>
          <Text style={styles.subTitle}>Here's your daily overview</Text>
      </View>
      {isWeb && <Text style={styles.dateText}>{new Date().toDateString()}</Text>}
    </View>
  );

  // 2. Left Column Content (Stats -> Quick Actions -> Schedule)
  const LeftColumnContent = () => (
    <View style={styles.leftContentContainer}>
      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statCardWrapper}>
            <DashboardStatCard
            title="My Class"
            value={myClass}
            iconName="easel-outline"
            color="#2563EB"
            />
        </View>
        <View style={styles.statCardWrapper}>
            <DashboardStatCard
            title="My Students"
            value={studentCount}
            iconName="people-outline"
            color="#10B981"
            />
        </View>
        <View style={styles.statCardWrapper}>
            <DashboardStatCard
            title="Active Assignments"
            value={pendingReviews}
            iconName="documents-outline"
            color="#F59E0B"
            />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(app)/attendance')}>
                <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                </View>
                <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(app)/assignments')}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="create-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.actionText}>Work</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(app)/results')}>
                <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="ribbon-outline" size={20} color="#059669" />
                </View>
                <Text style={styles.actionText}>Marks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(app)/examschedule')}>
                <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="time-outline" size={20} color="#DC2626" />
                </View>
                <Text style={styles.actionText}>Exams</Text>
            </TouchableOpacity>
          </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleCard}>
            {todaysClasses.length > 0 ? (
                <FlatList
                    data={todaysClasses}
                    renderItem={renderClassItem}
                    keyExtractor={(item, index) => index.toString()}
                    style={isWeb ? { height: 300 } : { maxHeight: 300 }} 
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingRight: isWeb ? 8 : 0 }}
                    nestedScrollEnabled={true}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="happy-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No classes today!</Text>
                </View>
            )}
        </View>
      </View>
    </View>
  );

  // 3. Right Column Content (Calendar -> Notice Board)
  const RightColumnContent = () => (
    <View style={styles.rightContentContainer}>
      <View style={styles.calendarWrapper}>
          <EventCalendar />
      </View>
      <View style={styles.noticeWrapper}>
          <NoticeBoard />
      </View>
    </View>
  );

  // --- WEB LAYOUT ---
  if (isWeb) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
            {/* Full Width Header */}
            <WelcomeSection />

            <View style={styles.webGrid}>
                {/* LEFT COLUMN (Flex 2.5) */}
                <View style={styles.leftColumn}>
                    <LeftColumnContent />
                </View>

                {/* RIGHT COLUMN (Flex 1) - Starts aligned with Stats */}
                <View style={styles.rightColumn}>
                    <RightColumnContent />
                </View>
            </View>
        </ScrollView>
      );
  }

  // --- MOBILE LAYOUT ---
  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      <WelcomeSection />
      
      {/* Stack everything vertically for mobile */}
      <LeftColumnContent />
      
      <View style={{marginTop: 20}}>
        <EventCalendar />
      </View>

      <View style={{marginTop: 20}}>
        <NoticeBoard />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Layout
  webGrid: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  leftColumn: { flex: 2.5 }, // Increased flex for wider left content
  rightColumn: { flex: 1, minWidth: 320 },
  leftContentContainer: { gap: 20 },
  rightContentContainer: { gap: 20 },

  // Welcome
  welcomeSection: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subTitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#4B5563', backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },

  // Stats
  statsContainer: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: 16,
  },
  statCardWrapper: {
      flex: 1,
      minWidth: 200, 
  },

  // Quick Actions
  quickActionSection: {},
  quickActionsRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      backgroundColor: '#FFF', 
      paddingVertical: 16, 
      paddingHorizontal: 12, 
      borderRadius: 16, 
      elevation: 2, 
      shadowColor: '#000', 
      shadowOpacity: 0.05, 
      shadowRadius: 5,
      width: '100%'
  },
  actionBtn: { alignItems: 'center', flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionText: { fontSize: 11, fontWeight: '600', color: '#374151' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },

  // Schedule
  scheduleSection: {},
  scheduleCard: { 
      backgroundColor: '#FFF', 
      borderRadius: 16, 
      padding: 16, 
      elevation: 3, 
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
      overflow: 'hidden' 
  },
  
  classItem: { flexDirection: 'row', marginBottom: 16 },
  timeBox: { alignItems: 'center', marginRight: 12, minWidth: 50 },
  timeText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  verticalLine: { width: 1, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  
  classInfoCard: { 
      flex: 1, 
      flexDirection: 'row',
      backgroundColor: '#F9FAFB', 
      borderRadius: 12, 
      padding: 12, 
      borderLeftWidth: 4, 
      borderLeftColor: '#F97316',
      alignItems: 'center'
  },
  classContent: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#4B5563' },
  roomText: { fontSize: 12, color: '#6B7280' },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginLeft: 10 },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 16 },

  // Right Column
  calendarWrapper: { width: '100%' },
  noticeWrapper: { width: '100%' },
});