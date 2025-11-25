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

// --- MOBILE STAT CARD COMPONENT (Full Width) ---
const MobileStatCard = ({ title, value, iconName, color }: { title: string, value: string | number, iconName: any, color: string }) => (
  <View style={[styles.mobileStatCard, { borderLeftColor: color }]}>
    <View style={[styles.mobileIconBox, { backgroundColor: color + '20' }]}>
      <Ionicons name={iconName} size={24} color={color} />
    </View>
    <View>
      <Text style={styles.mobileStatLabel}>{title}</Text>
      <Text style={[styles.mobileStatValue, { color: color }]}>{value}</Text>
    </View>
  </View>
);

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
        // 1. Get Timetable
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

        // 2. Get Assigned Class
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

        // 3. Get Assignments Count
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

  // --- COMPONENTS ---

  const WelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <View>
          <Text style={styles.welcomeTitle}>Hello, {teacherName}</Text>
          <Text style={styles.subTitle}>Here's your daily overview</Text>
      </View>
      {isWeb && <Text style={styles.dateText}>{new Date().toDateString()}</Text>}
    </View>
  );

  const QuickActions = () => (
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
  );

  const ScheduleSection = () => (
    <View style={styles.scheduleSection}>
      <Text style={styles.sectionTitle}>Today's Schedule</Text>
      <View style={styles.scheduleCard}>
          {todaysClasses.length > 0 ? (
              <FlatList
                  data={todaysClasses}
                  renderItem={renderClassItem}
                  keyExtractor={(item, index) => index.toString()}
                  style={{ maxHeight: 300 }} 
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
  );

  // --- MOBILE SPECIFIC LAYOUT ---
  const MobileLayout = () => (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 80}}>
      <WelcomeSection />

      {/* 1. My Class Card */}
      <View style={styles.mobileCardWrapper}>
         <MobileStatCard
            title="My Class"
            value={myClass}
            iconName="easel-outline"
            color="#2563EB"
         />
      </View>

      {/* 2. My Students (Down-by-Down) */}
      <View style={styles.mobileCardWrapper}>
         <MobileStatCard
            title="My Students"
            value={studentCount}
            iconName="people-outline"
            color="#10B981"
         />
      </View>

      {/* 3. Assignments (Down-by-Down) */}
      <View style={styles.mobileCardWrapper}>
         <MobileStatCard
            title="Active Assignments"
            value={pendingReviews}
            iconName="documents-outline"
            color="#F59E0B"
         />
      </View>

      {/* 4. Quick Actions (Below stats) */}
      <QuickActions />

      {/* 5. Schedule */}
      <ScheduleSection />

      {/* 6. Calendar & Notices */}
      <View style={{marginTop: 20}}>
        <EventCalendar />
      </View>
      <View style={{marginTop: 20}}>
        <NoticeBoard />
      </View>
    </ScrollView>
  );

  // --- WEB SPECIFIC LAYOUT ---
  if (isWeb) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
            <WelcomeSection />

            <View style={styles.webGrid}>
                {/* LEFT COLUMN */}
                <View style={styles.leftColumn}>
                    
                    {/* Stats Row */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCardWrapper}>
                            <DashboardStatCard title="My Class" value={myClass} iconName="easel-outline" color="#2563EB"/>
                        </View>
                        <View style={styles.statCardWrapper}>
                            <DashboardStatCard title="My Students" value={studentCount} iconName="people-outline" color="#10B981"/>
                        </View>
                        <View style={styles.statCardWrapper}>
                            <DashboardStatCard title="Active Assignments" value={pendingReviews} iconName="documents-outline" color="#F59E0B"/>
                        </View>
                    </View>

                    <QuickActions />
                    <ScheduleSection />
                </View>

                {/* RIGHT COLUMN */}
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
  }

  return <MobileLayout />;
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Layout
  webGrid: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  leftColumn: { flex: 2.5, gap: 20 }, 
  rightColumn: { flex: 1, minWidth: 320, gap: 20 },

  // Welcome
  welcomeSection: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subTitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#4B5563', backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },

  // Web Stats
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCardWrapper: { flex: 1, minWidth: 200 },

  // Mobile Stats
  mobileCardWrapper: { marginBottom: 12 },
  mobileStatCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    borderLeftWidth: 4, 
    height: 80, 
  },
  mobileIconBox: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  mobileStatLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  mobileStatValue: { fontSize: 18, fontWeight: 'bold' },

  // Quick Actions
  quickActionSection: { marginBottom: 20, marginTop: 8 },
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
  scheduleSection: { marginBottom: 0 },
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

  // Layout Wrappers
  calendarWrapper: { width: '100%' },
  noticeWrapper: { width: '100%' },
});