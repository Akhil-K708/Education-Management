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
import { getStudentAttendance, getStudentYearlyAttendance, StudentAttendanceViewDTO } from '../../api/attendanceApi';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendanceView() {
  const { state } = useAuth();
  const user = state.user;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceViewDTO | null>(null);
  const [yearlyAttendance, setYearlyAttendance] = useState<StudentAttendanceViewDTO | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDateInfo, setSelectedDateInfo] = useState<{date: string, status: string} | null>(null);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); 

  const fetchData = async (year: number, month: number) => {
    if (!user?.username) return;
    setLoading(true);
    try {
      const [monthData, yearData] = await Promise.all([
          getStudentAttendance(user.username, year, month),
          getStudentYearlyAttendance(user.username, year)
      ]);

      setAttendanceData(monthData);
      setYearlyAttendance(yearData);
      processCalendarDates(monthData.dailyRecords);

      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      const todayRecord = monthData.dailyRecords.find((r: any) => r.date === todayStr);
      
      setSelectedDateInfo({
          date: todayStr,
          status: todayRecord ? todayRecord.status : 'NOT MARKED'
      });

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
      let color = '#E5E7EB'; 
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
          status: record ? record.status : 'NOT MARKED'
      });
  };

  const getStatusColor = (status: string) => {
      const s = status.toUpperCase();
      if (s === 'PRESENT' || s === 'P') return '#10B981';
      if (s === 'ABSENT' || s === 'A') return '#EF4444';
      if (s === 'HOLIDAY' || s === 'H') return '#8B5CF6';
      return '#F59E0B';
  };

  if (loading && !attendanceData) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;

  return (
    <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>My Attendance</Text>

      {/* STATS CARD */}
      {attendanceData && (
        <View style={styles.card}>
            <View style={styles.statsHeader}>
                
                {/* 🔥 Updated UI: Yearly Left, Monthly Right with Divider */}
                <View style={styles.percentageContainer}>
                    
                    {/* Yearly Stats (Left) */}
                    <View style={styles.percentageBlock}>
                        <Text style={styles.statsLabel}>Yearly</Text>
                        <Text style={styles.percentageText}>{yearlyAttendance?.percentage.toFixed(1) || '0.0'}%</Text>
                    </View>

                    {/* Vertical Divider */}
                    <View style={styles.verticalDivider} />

                    {/* Monthly Stats (Right) */}
                    <View style={styles.percentageBlock}>
                        <Text style={styles.statsLabel}>Monthly</Text>
                        <Text style={styles.percentageText}>{attendanceData.percentage.toFixed(1)}%</Text>
                    </View>

                </View>

                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="pie-chart" size={40} color="#F97316" />
                </View>

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

      {/* SELECTED DAY INFO */}
      {selectedDateInfo && (
          <View style={[styles.infoCard, { borderLeftColor: getStatusColor(selectedDateInfo.status) }]}>
              <View>
                  <Text style={styles.infoDate}>{selectedDateInfo.date}</Text>
                  <Text style={styles.infoLabel}>Day Status</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedDateInfo.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(selectedDateInfo.status) }]}>
                      {selectedDateInfo.status}
                  </Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  
  card: { 
      backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2,
      shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 2
  },
  
  // Stats Styles
  statsHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: 20 
  },
  percentageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
  },
  percentageBlock: {
      justifyContent: 'center',
  },
  verticalDivider: {
      width: 1,
      height: 40,
      backgroundColor: '#E5E7EB',
      marginHorizontal: 24, // 🔥 Increased Distance
  },
  iconContainer: {
      marginLeft: 16,
  },
  statsLabel: { 
      color: '#6B7280', 
      fontSize: 12, 
      textTransform: 'uppercase', 
      fontWeight: '700',
      marginBottom: 2
  },
  percentageText: { 
      fontSize: 26, 
      fontWeight: '800', 
      color: '#111827' 
  },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statTitle: { fontSize: 12, color: '#6B7280' },

  // Calendar Legend
  legend: { flexDirection: 'row', marginTop: 16, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: '#4B5563' },

  // Highlight Card Styles
  infoCard: { 
      backgroundColor: '#FFF', 
      padding: 16, 
      borderRadius: 12, 
      borderLeftWidth: 4, 
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between', 
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.05, shadowRadius: 2
  },
  infoDate: { fontWeight: 'bold', fontSize: 18, color: '#111827' },
  infoLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  
  statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
  },
  statusText: {
      fontWeight: 'bold',
      fontSize: 14,
      textTransform: 'uppercase'
  }
});