import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getStudentTimetable } from '../../src/api/timetableApi';
import { useAuth } from '../../src/context/AuthContext';
import {
  DayEntry,
  Period,
  StudentWeeklyTimetableDTO,
  UniqueSubject
} from '../../src/types/timetable';

export default function TimetableScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [timetableData, setTimetableData] = useState<StudentWeeklyTimetableDTO | null>(null);
  const [uniqueSubjects, setUniqueSubjects] = useState<UniqueSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<UniqueSubject | null>(null);
  const [calendarMarkedDates, setCalendarMarkedDates] = useState<any>({});

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getStudentTimetable(user.username);
      setTimetableData(data);

      const subjectsMap = new Map<string, UniqueSubject>();
      
      data.weeklyTimetable.forEach((day) => {
        day.periods.forEach((p) => {
          if (!subjectsMap.has(p.subjectId)) {
            subjectsMap.set(p.subjectId, {
              subjectId: p.subjectId,
              subjectName: p.subjectName,
              teacherId: p.teacherId,
              teacherName: p.teacherName
            });
          }
        });
      });
      
      const subjectsList = Array.from(subjectsMap.values());
      setUniqueSubjects(subjectsList);
      
      if (subjectsList.length > 0) {
        const classTeacherId = data.classTeacher?.teacherId;
        const defaultSub = subjectsList.find(s => s.teacherId === classTeacherId) || subjectsList[0];
        handleSubjectPress(defaultSub, data.weeklyTimetable);
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

  const updateCalendarMarks = (subject: UniqueSubject, weeklyData: DayEntry[]) => {
    const todayString = new Date().toISOString().split('T')[0];
    const marked: any = {};

    weeklyData.forEach((dayEntry) => {
      const hasClass = dayEntry.periods.some(p => p.subjectId === subject.subjectId);
      
      if (hasClass && dayEntry.date) {
        marked[dayEntry.date] = {
            marked: true, 
            dotColor: '#F97316', 
            activeOpacity: 0
        };
      }
    });

    marked[todayString] = {
        ...(marked[todayString] || {}),
        selected: true,
        selectedColor: '#F97316'
    };

    setCalendarMarkedDates(marked);
  };

  const handleSubjectPress = (subject: UniqueSubject, data = timetableData?.weeklyTimetable) => {
    setSelectedSubject(subject);
    if (data) {
        updateCalendarMarks(subject, data);
    }
  };

  if (state.status === 'loading' || !user || (loading && !timetableData)) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (!timetableData) return null;

  const isClassTeacher = selectedSubject?.teacherId === timetableData.classTeacher?.teacherId;
  const teacherNameDisplay = selectedSubject?.teacherName + (isClassTeacher ? " (Class Teacher)" : "");

  const subjectSchedule = timetableData.weeklyTimetable.flatMap(day => 
    day.periods
      .filter(p => p.subjectId === selectedSubject?.subjectId)
      .map(p => ({
        day: day.day,
        ...p
      }))
  );

  const todayDateString = new Date().toISOString().split('T')[0];
  const todayEntry = timetableData.weeklyTimetable.find(d => d.date === todayDateString);
  const todayClasses = todayEntry ? todayEntry.periods : [];

  const renderWeeklyItem = (item: Period & { day: string }) => (
    <View style={styles.rowItem}>
       <View style={styles.colLeft}>
          <View style={styles.dayBadge}>
             <Text style={styles.dayText}>{item.day.substring(0, 3)}</Text>
          </View>
       </View>

       <View style={styles.colCenter}>
         <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color="#6B7280" style={{marginRight:4}} />
            <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
         </View>
       </View>

       <View style={styles.colRight}>
         <Text style={styles.infoText}>
             Class: {timetableData.classSection.className}-{timetableData.classSection.sectionName}
         </Text>
       </View>
    </View>
  );

  const renderTodayItem = (item: Period) => (
    <View style={styles.rowItem}>
        <View style={styles.colLeft}>
            <Text style={styles.subjectTextList}>{item.subjectName}</Text>
        </View>

        <View style={styles.colCenter}>
            <View style={styles.timeBadge}>
                <Text style={styles.timeText}>{item.startTime} - {item.endTime}</Text>
            </View>
        </View>

        <View style={styles.colRight}>
            <View style={styles.teacherTag}>
                <Ionicons name="person-circle-outline" size={16} color="#4B5563" style={{marginRight:4}}/>
                <Text style={styles.teacherTextList}>{item.teacherName}</Text>
            </View>
        </View>
    </View>
  );

  return (
    <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.pageTitle}>My Timetable</Text>
      <View style={styles.cardContainer}>
         <View style={styles.teacherRow}>
            <View style={styles.teacherAvatar}>
                <Ionicons name="school" size={24} color="#FFFFFF" />
            </View>
            <View>
                <Text style={styles.teacherLabel}>Subject Teacher</Text>
                <Text style={styles.teacherValue}>
                    {teacherNameDisplay}
                </Text>
            </View>
         </View>
      </View>

      <Text style={styles.sectionHeader}>My Subjects</Text>
      <View style={styles.subjectsRow}>
        {uniqueSubjects.map((sub) => (
             <TouchableOpacity
                key={sub.subjectId}
                style={[
                    styles.subjectPill,
                    selectedSubject?.subjectId === sub.subjectId && styles.subjectPillActive
                ]}
                onPress={() => handleSubjectPress(sub)}
             >
                 <Text style={[
                     styles.subjectText, 
                     selectedSubject?.subjectId === sub.subjectId && styles.subjectTextActive
                 ]}>{sub.subjectName}</Text>
             </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
        <View style={[styles.leftColumn, isWeb && styles.leftColumnWeb]}>
            
            <Text style={styles.subHeader}>
                {selectedSubject ? `${selectedSubject.subjectName} Present Week Schedule` : 'Schedule'}
            </Text>
            
            <View style={styles.cardContainer}>
                {subjectSchedule.length > 0 ? (
                    subjectSchedule.map((item, index) => (
                        <View key={index}>
                             {renderWeeklyItem(item)}
                             {index < subjectSchedule.length - 1 && <View style={styles.separator} />}
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-clear-outline" size={40} color="#E5E7EB" />
                        <Text style={styles.noDataText}>No classes this week</Text>
                    </View>
                )}
            </View>

            <View style={{ marginTop: 24 }}>
                <Text style={styles.subHeader}>Today's Classes</Text>
                <View style={styles.cardContainer}>
                    {todayClasses.length > 0 ? (
                        todayClasses.map((item, index) => (
                            <View key={`today-${index}`}>
                                {renderTodayItem(item)}
                                {index < todayClasses.length - 1 && <View style={styles.separator} />}
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                             <Ionicons name="happy-outline" size={40} color="#E5E7EB" />
                             <Text style={styles.noDataText}>No classes today!</Text>
                        </View>
                    )}
                </View>
            </View>

        </View>

        <View style={[styles.rightColumn, isWeb && styles.rightColumnWeb]}>
            <View style={styles.cardContainer}>
                <Calendar
                    markedDates={calendarMarkedDates}
                    theme={{
                        backgroundColor: '#ffffff',
                        calendarBackground: '#ffffff',
                        textSectionTitleColor: '#9CA3AF',
                        selectedDayBackgroundColor: '#F97316',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#F97316',
                        dayTextColor: '#1F2937',
                        textDisabledColor: '#E5E7EB',
                        dotColor: '#F97316',
                        selectedDotColor: '#ffffff',
                        arrowColor: '#F97316',
                        monthTextColor: '#111827',
                        indicatorColor: '#F97316',
                        textDayFontWeight: '500',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '600',
                    }}
                />
            </View>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F3F4F6', 
  },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  pageTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 5,
    width: '100%',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 12, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6', 
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: '#F97316', 
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#F97316', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4
  },
  teacherLabel: {
    fontSize: 12, color: '#6B7280', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600'
  },
  teacherValue: {
    fontSize: 16, color: '#111827', fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12, marginTop: 16
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  subjectPill: {
    paddingVertical: 8, 
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectPillActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
    shadowColor: '#F97316', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3
  },
  subjectText: {
    fontSize: 14, color: '#4B5563', fontWeight: '600',
  },
  subjectTextActive: {
    color: '#FFFFFF',
  },
  mainGrid: { flexDirection: 'column' },
  mainGridWeb: { flexDirection: 'row', gap: 32 }, 
  leftColumn: { marginBottom: 20 },
  leftColumnWeb: { flex: 1.5 }, 
  rightColumn: { marginBottom: 20 },
  rightColumnWeb: { flex: 1 }, 
  subHeader: {
    fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  separator: {
      height: 1,
      backgroundColor: '#F3F4F6',
      width: '100%',
  },
  colLeft: { flex: 1, alignItems: 'flex-start' },
  dayBadge: {
      backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6
  },
  dayText: {
    fontSize: 13, fontWeight: 'bold', color: '#C2410C', textTransform: 'capitalize'
  },
  subjectTextList: {
      fontSize: 15, fontWeight: 'bold', color: '#111827', textTransform: 'capitalize'
  },
  colCenter: { flex: 1.5, alignItems: 'center' },
  timeBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6
  },
  timeText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  colRight: { flex: 1, alignItems: 'flex-end' },
  infoText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  teacherTag: { flexDirection: 'row', alignItems: 'center' },
  teacherTextList: { fontSize: 13, color: '#374151', fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  noDataText: { textAlign: 'center', color: '#9CA3AF', marginVertical: 10, fontStyle: 'italic' }
});