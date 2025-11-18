import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import {
    getStudentDailySchedule,
    getStudentInitialData,
    getTeacherDetails,
} from '../../src/api/timetableApi';
import { useAuth } from '../../src/context/AuthContext';
import {
    DailyScheduleItem,
    Subject,
    Teacher,
    WeeklyScheduleItem,
} from '../../src/types/timetable';

type MarkedDatesMap = { [date: string]: { marked: boolean; dotColor: string } };

export default function TimetableScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [classTeacher, setClassTeacher] = useState<Teacher | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [displayTeacher, setDisplayTeacher] = useState<Teacher | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDatesMap>({});
  const [dailySchedule, setDailySchedule] = useState<DailyScheduleItem[]>([]);

  const formatMarkedDates = (attendance: string[]): MarkedDatesMap => {
    return attendance.reduce((acc, date) => {
      acc[date] = { marked: true, dotColor: '#F97316' };
      return acc;
    }, {} as MarkedDatesMap);
  };

  const loadTeacherData = async (teacherId: string) => {
    try {
      setLoadingDetails(true);
      const data = await getTeacherDetails(teacherId);
      setWeeklySchedule(data.weeklySchedule);
      setMarkedDates(formatMarkedDates(data.attendance));
    } catch (error) {
      console.error('Failed to load teacher details:', error);
      setWeeklySchedule([]);
      setMarkedDates({});
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const data = await getStudentInitialData();
        const dailyData = await getStudentDailySchedule();

        setClassTeacher(data.classTeacher);
        setSubjects(data.subjects);
        setDisplayTeacher(data.classTeacher);
        setDailySchedule(dailyData);

        if (data.subjects.length > 0) {
          setSelectedSubjectId(data.subjects[0].id);
          await loadTeacherData(data.subjects[0].teacher.id);
        } else if (data.classTeacher) {
          await loadTeacherData(data.classTeacher.id);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSubjectPress = async (subject: Subject) => {
    setSelectedSubjectId(subject.id);
    setDisplayTeacher(subject.teacher);
    await loadTeacherData(subject.teacher.id);
  };

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (user.role !== 'STUDENT') {
    return router.replace('/(app)');
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[
        styles.subjectButton,
        selectedSubjectId === item.id && styles.subjectButtonActive,
      ]}
      onPress={() => handleSubjectPress(item)}>
      <Text
        style={[
          styles.subjectButtonText,
          selectedSubjectId === item.id && styles.subjectButtonTextActive,
        ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderTimetableItem = ({ item }: { item: WeeklyScheduleItem }) => (
    <View style={styles.timeRow}>
      <Text style={styles.timeDay}>{item.day}</Text>
      <Text style={styles.timeTime}>{item.time}</Text>
      <Text style={styles.timeRoom}>Room: {item.room}</Text>
    </View>
  );

  const renderDailyScheduleItem = ({ item }: { item: DailyScheduleItem }) => (
    <View style={styles.dailyRow}>
      <Text style={[styles.dailyCell, styles.flexSubject]}>{item.subjectName}</Text>
      <Text style={[styles.dailyCell, styles.flexTime]}>{item.time}</Text>
      <Text style={[styles.dailyCell, styles.flexRoom]}>{item.room}</Text>
      <Text style={[styles.dailyCell, styles.flexTeacher]}>{item.teacherName}</Text>
    </View>
  );

  const mainContent = (
    <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
      <View style={[styles.leftColumn, isMobile && styles.leftColumnMobile]}>
        <Text style={styles.sectionTitle}>Weekly Time Table</Text>
        <View style={styles.card}>
          {loadingDetails ? (
            <ActivityIndicator color="#F97316" />
          ) : weeklySchedule.length > 0 ? (
            <FlatList
              data={weeklySchedule}
              renderItem={renderTimetableItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={{ padding: 10, color: '#6B7280' }}>No schedule found for this teacher.</Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Daily Time Table (Today)</Text>
        <View style={styles.card}>
          <View style={styles.dailyHeader}>
            <Text style={[styles.headerCell, styles.flexSubject]}>Subject</Text>
            <Text style={[styles.headerCell, styles.flexTime]}>Time</Text>
            <Text style={[styles.headerCell, styles.flexRoom]}>Class</Text>
            <Text style={[styles.headerCell, styles.flexTeacher]}>Teacher Name</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#F97316" />
          ) : (
            <FlatList
              data={dailySchedule}
              renderItem={renderDailyScheduleItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </View>
      <View style={[styles.rightColumn, isMobile && styles.rightColumnMobile]}>
        <Text style={styles.sectionTitle}>Teacher Attendance</Text>
        <View style={styles.card}>
          {loadingDetails ? (
            <ActivityIndicator color="#F97316" />
          ) : (
            <Calendar
              current={'2025-11-03'}
              markedDates={markedDates}
              monthFormat={'MMMM yyyy'}
              onDayPress={(day: DateData) => console.log('selected day', day)}
              theme={{
                todayTextColor: '#F97316',
                arrowColor: '#F97316',
                selectedDayBackgroundColor: '#F97316',
                dotColor: '#F97316',
              }}
            />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Timetable</Text>

      <View style={styles.teacherCard}>
        <Ionicons name="person-circle-outline" size={40} color="#111827" />
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherLabel}>
            {selectedSubjectId ? 'Subject Teacher' : 'Class Teacher'}
          </Text>
          <Text style={styles.teacherName}>
            {displayTeacher?.name || 'Loading...'}
          </Text>
        </View>
      </View>

      <View style={styles.subjectsContainer}>
        <Text style={styles.sectionTitle}>My Subjects</Text>
        <FlatList
          data={subjects}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
      </View>

      {mainContent}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 20 : 10,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111827',
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  teacherInfo: {
    marginLeft: 12,
  },
  teacherLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subjectsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  subjectButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  subjectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  subjectButtonTextActive: {
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
  },
  mainContentMobile: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 2,
  },
  leftColumnMobile: {
    marginBottom: 20,
  },
  rightColumn: {
    flex: 1,
  },
  rightColumnMobile: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeDay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  timeTime: {
    fontSize: 15,
    color: '#374151',
    flex: 2,
  },
  timeRoom: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  dailyHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
  },
  dailyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dailyCell: {
    fontSize: 14,
    color: '#374151',
  },
  flexSubject: { flex: 1.5, paddingRight: 5 },
  flexTime: { flex: 2, paddingRight: 5 },
  flexRoom: { flex: 1, paddingRight: 5 },
  flexTeacher: { flex: 2 },
});