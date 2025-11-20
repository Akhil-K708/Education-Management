import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { getStudentAttendance, StudentAttendanceViewDTO } from '../../api/attendanceApi';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendanceView() {
  const { state } = useAuth();
  const user = state.user;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceViewDTO | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDateInfo, setSelectedDateInfo] = useState<{date: string, status: string} | null>(null);

  // Current Month Tracking
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12

  const fetchData = async (year: number, month: number) => {
    if (!user?.username) return;
    setLoading(true);
    try {
      const data = await getStudentAttendance(user.username, year, month);
      setAttendanceData(data);
      processCalendarDates(data.dailyRecords);
    } catch (error) {
      console.error("Failed to load attendance");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(currentYear, currentMonth);
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(currentYear, currentMonth);
  };

  const processCalendarDates = (logs: any[]) => {
    const marks: any = {};
    logs.forEach(log => {
      let color = '#E5E7EB'; // Default
      let status = log.status.toUpperCase();

      if (status === 'PRESENT' || status === 'P') color = '#10B981';
      else if (status === 'ABSENT' || status === 'A') color = '#EF4444';
      else if (status === 'HOLIDAY' || status === 'H') color = '#8B5CF6';

      if (status !== 'NOT_MARKED') {
          marks[log.date] = {
            selected: true,
            selectedColor: color,
            marked: status === 'HOLIDAY', 
          };
      }
    });
    setMarkedDates(marks);
  };

  const handleMonthChange = (date: DateData) => {
      setCurrentYear(date.year);
      setCurrentMonth(date.month);
      fetchData(date.year, date.month);
  };

  const handleDayPress = (day: DateData) => {
      const record = attendanceData?.dailyRecords.find(r => r.date === day.dateString);
      setSelectedDateInfo({
          date: day.dateString,
          status: record ? record.status : 'NO DATA'
      });
  };

  if (loading && !attendanceData) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;

  return (
    <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>My Attendance</Text>

      {/* STATS */}
      {attendanceData && (
        <View style={styles.card}>
            <View style={styles.statsHeader}>
                <View>
                    <Text style={styles.statsLabel}>Month Percentage</Text>
                    <Text style={styles.percentageText}>{attendanceData.percentage.toFixed(1)}%</Text>
                </View>
                <Ionicons name="pie-chart" size={32} color="#F97316" />
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: '#10B981'}]}>{attendanceData.present}</Text>
                    <Text style={styles.statTitle}>Present</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: '#EF4444'}]}>{attendanceData.absent}</Text>
                    <Text style={styles.statTitle}>Absent</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: '#8B5CF6'}]}>{attendanceData.holidays}</Text>
                    <Text style={styles.statTitle}>Holidays</Text>
                </View>
            </View>
        </View>
      )}

      {/* CALENDAR */}
      <View style={styles.card}>
          <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onMonthChange={handleMonthChange}
              theme={{
                  todayTextColor: '#F97316',
                  arrowColor: '#F97316',
                  textDayFontWeight: '600',
                  textMonthFontWeight: 'bold',
                  selectedDayTextColor: '#FFF'
              }}
          />
          <View style={styles.legend}>
              <View style={{flexDirection:'row', alignItems:'center', marginRight: 10}}>
                  <View style={[styles.dot, {backgroundColor:'#10B981'}]}/><Text style={styles.legendText}>Present</Text>
              </View>
              <View style={{flexDirection:'row', alignItems:'center', marginRight: 10}}>
                  <View style={[styles.dot, {backgroundColor:'#EF4444'}]}/><Text style={styles.legendText}>Absent</Text>
              </View>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                  <View style={[styles.dot, {backgroundColor:'#8B5CF6'}]}/><Text style={styles.legendText}>Holiday</Text>
              </View>
          </View>
      </View>

      {/* SELECTED DAY INFO */}
      {selectedDateInfo && (
          <View style={styles.infoCard}>
              <Text style={styles.infoDate}>{selectedDateInfo.date}</Text>
              <Text style={styles.infoStatus}>Status: {selectedDateInfo.status}</Text>
          </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statsLabel: { color: '#6B7280', fontSize: 14 },
  percentageText: { fontSize: 32, fontWeight: 'bold', color: '#111827' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statTitle: { fontSize: 12, color: '#6B7280' },
  legend: { flexDirection: 'row', marginTop: 16, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: '#4B5563' },
  infoCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F97316' },
  infoDate: { fontWeight: 'bold', fontSize: 16 },
  infoStatus: { color: '#4B5563', marginTop: 4 }
});