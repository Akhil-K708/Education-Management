import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { getStudentAttendance } from '../../src/api/attendanceApi';
import { useAuth } from '../../src/context/AuthContext';
import { AttendanceData, AttendanceLog } from '../../src/types/attendance';

export default function AttendanceScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  // Selected Date Info
  const [selectedDateInfo, setSelectedDateInfo] = useState<{date: string, status: string, reason?: string} | null>(null);

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getStudentAttendance(user.username);
      setAttendanceData(data);
      processCalendarDates(data.logs);
      
      // Default select today
      const today = new Date().toISOString().split('T')[0];
      handleDayPress({ dateString: today } as DateData, data.logs);

    } catch (error) {
      console.error("Failed to load attendance:", error);
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

  const processCalendarDates = (logs: AttendanceLog[]) => {
    const marks: any = {};
    logs.forEach(log => {
      let color = '#10B981'; // Green (Present)
      
      if (log.status === 'ABSENT') {
          color = '#EF4444'; // Red
      } else if (log.status === 'HOLIDAY') {
          color = '#8B5CF6'; // Purple for Holidays (Distinct)
      }

      marks[log.date] = {
        selected: true,
        selectedColor: color,
        marked: log.status === 'HOLIDAY', // Show distinct dot for holidays
        dotColor: 'white'
      };
    });
    setMarkedDates(marks);
  };

  const handleDayPress = (day: DateData, logs = attendanceData?.logs) => {
      if(!logs) return;

      const log = logs.find(l => l.date === day.dateString);
      if (log) {
          setSelectedDateInfo({
              date: day.dateString,
              status: log.status,
              reason: log.holidayReason
          });
      } else {
          // Future date or no data
          setSelectedDateInfo({
              date: day.dateString,
              status: 'NO DATA',
              reason: ''
          });
      }
  };

  if (state.status === 'loading' || !user || (loading && !attendanceData)) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (!attendanceData) return null;

  return (
    <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.pageTitle}>My Attendance</Text>

      {/* --- 1. STATS CARD --- */}
      <View style={styles.card}>
          <View style={styles.statsHeader}>
              <View>
                <Text style={styles.statsLabel}>Overall Attendance</Text>
                <Text style={styles.percentageText}>{attendanceData.stats.percentage}%</Text>
              </View>
              <View style={styles.iconBox}>
                  <Ionicons name="pie-chart" size={28} color="#F97316" />
              </View>
          </View>
          
          <View style={styles.statsRow}>
              <View style={styles.statItem}>
                  <Text style={[styles.statValue, {color: '#10B981'}]}>{attendanceData.stats.present}</Text>
                  <Text style={styles.statTitle}>Present</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.statItem}>
                  <Text style={[styles.statValue, {color: '#EF4444'}]}>{attendanceData.stats.absent}</Text>
                  <Text style={styles.statTitle}>Absent</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.statItem}>
                  <Text style={[styles.statValue, {color: '#8B5CF6'}]}>{attendanceData.stats.holidays}</Text>
                  <Text style={styles.statTitle}>Holidays</Text>
              </View>
          </View>
      </View>

      {/* --- 2. CALENDAR CARD --- */}
      <Text style={styles.sectionHeader}>Monthly Record</Text>
      <View style={styles.card}>
          <Calendar
              markedDates={markedDates}
              onDayPress={(day: DateData) => handleDayPress(day)}
              theme={{
                  todayTextColor: '#F97316',
                  arrowColor: '#F97316',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
              }}
          />
          
          {/* Legend */}
          <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                  <View style={[styles.dot, {backgroundColor: '#10B981'}]} />
                  <Text style={styles.legendText}>Present</Text>
              </View>
              <View style={styles.legendItem}>
                  <View style={[styles.dot, {backgroundColor: '#EF4444'}]} />
                  <Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={styles.legendItem}>
                  <View style={[styles.dot, {backgroundColor: '#8B5CF6'}]} />
                  <Text style={styles.legendText}>Holiday</Text>
              </View>
          </View>
      </View>

      {/* --- 3. SELECTED DATE INFO (Shows Holiday Reason) --- */}
      {selectedDateInfo && (
          <View style={styles.infoCard}>
             <View style={styles.infoRow}>
                <Ionicons name="calendar" size={24} color="#4B5563" />
                <Text style={styles.infoDate}>{selectedDateInfo.date}</Text>
             </View>
             
             <View style={styles.statusBadgeContainer}>
                <View style={[
                    styles.statusBadge, 
                    selectedDateInfo.status === 'PRESENT' ? { backgroundColor: '#D1FAE5' } :
                    selectedDateInfo.status === 'ABSENT' ? { backgroundColor: '#FEE2E2' } :
                    selectedDateInfo.status === 'HOLIDAY' ? { backgroundColor: '#EDE9FE' } : 
                    { backgroundColor: '#F3F4F6' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        selectedDateInfo.status === 'PRESENT' ? { color: '#059669' } :
                        selectedDateInfo.status === 'ABSENT' ? { color: '#DC2626' } :
                        selectedDateInfo.status === 'HOLIDAY' ? { color: '#7C3AED' } : 
                        { color: '#4B5563' }
                    ]}>
                        {selectedDateInfo.status}
                    </Text>
                </View>
             </View>

             {selectedDateInfo.status === 'HOLIDAY' && selectedDateInfo.reason && (
                 <View style={styles.reasonBox}>
                     <Ionicons name="information-circle" size={20} color="#7C3AED" />
                     <Text style={styles.reasonText}>{selectedDateInfo.reason}</Text>
                 </View>
             )}
          </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20,
  },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  
  // Stats
  statsHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  statsLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  percentageText: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  iconBox: {
      width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF7ED',
      alignItems: 'center', justifyContent: 'center'
  },
  statsRow: {
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
      borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  statTitle: { fontSize: 12, color: '#6B7280' },
  separator: { width: 1, height: 30, backgroundColor: '#E5E7EB' },

  // Calendar
  sectionHeader: {
    fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12,
  },
  legendContainer: {
      flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
      marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 16
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },

  // Info Card
  infoCard: {
      backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20,
      borderLeftWidth: 4, borderLeftColor: '#F97316', elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoDate: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  statusBadgeContainer: { flexDirection: 'row', marginBottom: 8 },
  statusBadge: {
      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 14, fontWeight: 'bold' },
  reasonBox: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', 
      padding: 10, borderRadius: 8, marginTop: 8
  },
  reasonText: { marginLeft: 8, fontSize: 14, color: '#5B21B6', fontWeight: '500' },
});