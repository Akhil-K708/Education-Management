import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { getStudentTimetable } from '../../src/api/timetableApi';
import { useAuth } from '../../src/context/AuthContext';
import {
  StudentSubjectTimetable,
  StudentTimetableResponse,
  TimetableMini,
} from '../../src/types/timetable';

export default function TimetableScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetableData, setTimetableData] = useState<StudentTimetableResponse | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<StudentSubjectTimetable | null>(null);

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getStudentTimetable(user.username);
      setTimetableData(data);
      
      // Default గా మొదటి సబ్జెక్ట్‌ని సెలెక్ట్ చేద్దాం
      if (data.subjects && data.subjects.length > 0) {
        setSelectedSubject(data.subjects[0]);
      }
    } catch (error) {
      console.error('Failed to load timetable:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubjectPress = (subject: StudentSubjectTimetable) => {
    setSelectedSubject(subject);
  };

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (loading && !timetableData) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (!timetableData) {
     return (
         <View style={styles.centered}>
             <Text>No timetable data found.</Text>
             <TouchableOpacity onPress={fetchData} style={{marginTop: 20}}>
                 <Text style={{color: '#F97316'}}>Retry</Text>
             </TouchableOpacity>
         </View>
     );
  }

  // --- RENDER ITEMS ---

  const renderSubjectItem = ({ item }: { item: StudentSubjectTimetable }) => (
    <TouchableOpacity
      style={[
        styles.subjectButton,
        selectedSubject?.subjectId === item.subjectId && styles.subjectButtonActive,
      ]}
      onPress={() => handleSubjectPress(item)}>
      <Text
        style={[
          styles.subjectButtonText,
          selectedSubject?.subjectId === item.subjectId && styles.subjectButtonTextActive,
        ]}>
        {item.subjectName}
      </Text>
    </TouchableOpacity>
  );

  const renderWeeklyItem = ({ item }: { item: TimetableMini }) => (
    <View style={styles.timeRow}>
      <View style={styles.dayContainer}>
         <Text style={styles.timeDay}>{item.day}</Text>
      </View>
      <View style={styles.timeInfo}>
          <Text style={styles.timeTime}>{item.startTime} - {item.endTime}</Text>
          <Text style={styles.teacherText}>{item.teacherName}</Text>
      </View>
    </View>
  );

  const renderTodayItem = ({ item }: { item: TimetableMini }) => (
    <View style={styles.todayRow}>
      <View style={styles.todayTimeBox}>
          <Text style={styles.todayTime}>{item.startTime}</Text>
          <Text style={styles.todayTimeEnd}>{item.endTime}</Text>
      </View>
      <View style={styles.todayContent}>
          <Text style={styles.todaySubject}>{item.subjectName}</Text>
          <Text style={styles.todayTeacher}>{item.teacherName}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>My Timetable</Text>

      {/* Class Teacher Info Card */}
      <View style={styles.teacherCard}>
        <Ionicons name="school-outline" size={40} color="#F97316" />
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherLabel}>Class Teacher</Text>
          <Text style={styles.teacherName}>
            {timetableData.classTeacher?.fullName || 'Not Assigned'}
          </Text>
          <Text style={styles.classInfo}>
             Class: {timetableData.classSection?.className} - {timetableData.classSection?.sectionName}
          </Text>
        </View>
      </View>

      {/* Subjects Horizontal List */}
      <View style={styles.subjectsContainer}>
        <Text style={styles.sectionTitle}>My Subjects</Text>
        <FlatList
          data={timetableData.subjects}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.subjectId}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
      </View>

      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        
        {/* Left Column: Weekly Schedule for Selected Subject */}
        <View style={[styles.leftColumn, isMobile && styles.leftColumnMobile]}>
          <Text style={styles.sectionTitle}>
             {selectedSubject ? `${selectedSubject.subjectName} Schedule` : 'Weekly Schedule'}
          </Text>
          <View style={styles.card}>
            {selectedSubject && selectedSubject.periods.length > 0 ? (
              <FlatList
                data={selectedSubject.periods}
                renderItem={renderWeeklyItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No schedule for this subject</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Column: Today's Schedule */}
        <View style={[styles.rightColumn, isMobile && styles.rightColumnMobile]}>
          <Text style={styles.sectionTitle}>Today's Classes</Text>
          <View style={styles.card}>
             {timetableData.todayTimetable && timetableData.todayTimetable.length > 0 ? (
                <FlatList
                    data={timetableData.todayTimetable}
                    renderItem={renderTodayItem}
                    keyExtractor={(item, index) => `today-${index}`}
                    scrollEnabled={false}
                />
             ) : (
                 <View style={styles.emptyState}>
                     <Ionicons name="happy-outline" size={40} color="#10B981" />
                     <Text style={styles.emptyText}>No classes today!</Text>
                 </View>
             )}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 20 : 16,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#111827',
  },
  
  // Teacher Card
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
    borderLeftWidth: 4, borderLeftColor: '#F97316',
  },
  teacherInfo: { marginLeft: 16 },
  teacherLabel: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  teacherName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  classInfo: { fontSize: 14, color: '#4B5563', marginTop: 2 },

  // Subjects
  subjectsContainer: { marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  subjectButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  subjectButtonActive: {
    backgroundColor: '#F97316', borderColor: '#F97316',
  },
  subjectButtonText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  subjectButtonTextActive: { color: '#FFFFFF' },

  // Layout
  mainContent: { flex: 1, flexDirection: 'row', gap: 20 },
  mainContentMobile: { flexDirection: 'column' },
  leftColumn: { flex: 1.5 },
  leftColumnMobile: { marginBottom: 20 },
  rightColumn: { flex: 1 },
  rightColumnMobile: { flex: 1 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
    minHeight: 200,
  },
  emptyState: {
      alignItems: 'center', justifyContent: 'center', padding: 30,
  },
  emptyText: { color: '#9CA3AF', marginTop: 10 },

  // Weekly Item
  timeRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  dayContainer: {
      width: 50, alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FFF7ED', borderRadius: 8, paddingVertical: 4,
      marginRight: 12,
  },
  timeDay: { fontSize: 14, fontWeight: 'bold', color: '#C2410C' },
  timeInfo: { flex: 1 },
  timeTime: { fontSize: 15, fontWeight: '600', color: '#111827' },
  teacherText: { fontSize: 13, color: '#6B7280' },

  // Today Item
  todayRow: {
      flexDirection: 'row', marginBottom: 12,
      backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10,
  },
  todayTimeBox: {
      alignItems: 'center', justifyContent: 'center',
      borderRightWidth: 1, borderRightColor: '#E5E7EB',
      paddingRight: 10, marginRight: 10,
      minWidth: 60,
  },
  todayTime: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  todayTimeEnd: { fontSize: 12, color: '#6B7280' },
  todayContent: { flex: 1, justifyContent: 'center' },
  todaySubject: { fontSize: 15, fontWeight: '600', color: '#111827' },
  todayTeacher: { fontSize: 13, color: '#6B7280' },
});