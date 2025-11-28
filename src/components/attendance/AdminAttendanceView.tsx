import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { getAllClassSections } from '../../api/adminApi';
import { getClassStudents, getDailyClassAttendance } from '../../api/attendanceApi';

// --- WEB DATE INPUT COMPONENT ---
const WebDateInput = ({ value, onChange }: { value: Date, onChange: (d: Date) => void }) => {
  return React.createElement('input', {
    type: 'date',
    value: value.toISOString().split('T')[0],
    style: {
      borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10,
      backgroundColor: '#F9FAFB', fontSize: 14, width: '100%', height: 50,
      fontFamily: 'System', boxSizing: 'border-box', outline: 'none'
    },
    onChange: (e: any) => {
      const val = e.target.value;
      if (val) onChange(new Date(val));
    }
  });
};

export default function AdminAttendanceView() {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Merged Data (Students + Status)
  const [mergedList, setMergedList] = useState<any[]>([]);
  const [isMarked, setIsMarked] = useState(false);
  
  // Date State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Stats
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchAttendanceData();
    }
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await getAllClassSections();
      
      // Sort Classes: 1-A, 1-B, 2-A... (Numeric then Alphabetical)
      const sorted = data.sort((a, b) => {
        const numA = parseInt(a.className.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.className.replace(/\D/g, '')) || 0;
        
        if (numA !== numB) return numA - numB;
        return a.section.localeCompare(b.section);
      });

      setClasses(sorted);
      if (sorted.length > 0) {
        setSelectedClassId(sorted[0].classSectionId!);
      }
    } catch (e) {
      console.error("Failed to fetch classes", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    if (!selectedClassId) return;
    
    setFetchingData(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // 1. Fetch Students (For Names) & Attendance (For Status) in Parallel
      const [studentsData, attendanceData] = await Promise.all([
          getClassStudents(selectedClassId),
          getDailyClassAttendance(selectedClassId, dateStr)
      ]);

      // 2. Create Attendance Map for quick lookup
      const attendanceMap: any = {};
      let markedCount = 0;
      let present = 0;
      let absent = 0;

      if (attendanceData && attendanceData.length > 0) {
          attendanceData.forEach((rec: any) => {
              attendanceMap[rec.studentId] = rec.status; 
              if (rec.status === 'PRESENT' || rec.status === 'P') present++;
              if (rec.status === 'ABSENT' || rec.status === 'A') absent++;
              if (rec.status !== 'N' && rec.status !== 'NOT_MARKED') markedCount++;
          });
      }

      // 3. Merge Data (Combine Student Info with Status)
      const combined = studentsData.map((stu: any) => {
          const status = attendanceMap[stu.studentId] || 'NOT_MARKED';
          return {
              ...stu,
              attendanceStatus: status
          };
      });

      combined.sort((a: any, b: any) => a.fullName.localeCompare(b.fullName));

      setMergedList(combined);
      setStats({ present, absent, total: studentsData.length });
      setIsMarked(markedCount > 0);

    } catch (e) {
      console.error("Error fetching attendance data", e);
      setIsMarked(false);
      setMergedList([]);
    } finally {
      setFetchingData(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
    if (selectedClassId) fetchAttendanceData();
  };

  // --- RENDERERS ---

  const renderStatCard = (title: string, value: number, color: string, icon: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }, isWeb ? { flex: 1 } : styles.statCardMobile]}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.statLabel} numberOfLines={1}>{title}</Text>
        <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      </View>
    </View>
  );

  const renderStudentRow = ({ item }: { item: any }) => {
    const status = item.attendanceStatus; 
    
    let badgeStyle = styles.statusNeutral;
    let textStyle = styles.textNeutral;
    let displayStatus = '-';

    if (status === 'PRESENT' || status === 'P') {
        badgeStyle = styles.statusPresent;
        textStyle = styles.textPresent;
        displayStatus = 'P';
    } else if (status === 'ABSENT' || status === 'A') {
        badgeStyle = styles.statusAbsent;
        textStyle = styles.textAbsent;
        displayStatus = 'A';
    } else if (status === 'N') {
        badgeStyle = styles.statusNeutral;
        textStyle = styles.textNeutral;
        displayStatus = 'N'; 
    }

    return (
        <View style={styles.studentRow}>
          <View style={styles.studentInfo}>
            <View style={[styles.avatar, {backgroundColor: getRandomColor(item.fullName)}]}>
              <Text style={styles.avatarText}>{item.fullName ? item.fullName.charAt(0).toUpperCase() : '?'}</Text>
            </View>
            <View style={{flex: 1, paddingRight: 8}}>
              <Text style={styles.studentName} numberOfLines={1} ellipsizeMode='tail'>{item.fullName}</Text>
              <Text style={styles.studentId}>{item.rollNumber ? `Roll: ${item.rollNumber}` : item.studentId}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, badgeStyle]}>
              <Text style={[styles.statusText, textStyle]}>{displayStatus}</Text>
          </View>
        </View>
    );
  };

  const getRandomColor = (name: string) => {
      const colors = ['#DBEAFE', '#FEF3C7', '#D1FAE5', '#FCE7F3', '#F3F4F6'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
  };

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Attendance Monitor</Text>

        {/* --- 1. FILTERS (DATE & CLASS) --- */}
        <View style={styles.filtersContainer}>
          {/* Date Picker */}
          <View style={styles.dateSection}>
            <Text style={styles.label}>Select Date:</Text>
            {Platform.OS === 'web' ? (
              <WebDateInput value={selectedDate} onChange={setSelectedDate} />
            ) : (
              <>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(e, d) => { setShowDatePicker(false); if (d) setSelectedDate(d); }}
                  />
                )}
              </>
            )}
          </View>

          {/* Class Selector (Horizontal Scroll) */}
          <View style={{ marginTop: 15 }}>
            <Text style={styles.label}>Select Class:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.classSectionId}
                  style={[
                    styles.classChip,
                    selectedClassId === cls.classSectionId && styles.classChipActive
                  ]}
                  onPress={() => setSelectedClassId(cls.classSectionId)}
                >
                  <Text style={[
                    styles.classChipText,
                    selectedClassId === cls.classSectionId && styles.classChipTextActive
                  ]}>
                    {cls.className}-{cls.section}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* --- 2. MAIN CONTENT AREA --- */}
        {fetchingData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingText}>Fetching attendance records...</Text>
          </View>
        ) : isMarked ? (
          <>
            {/* Stats Overview */}
            {/* Logic: Web - Row with spacing. Mobile - Wrap so they stack if needed */}
            <View style={[styles.statsRow, isWeb ? styles.statsRowWeb : styles.statsRowMobile]}>
              {renderStatCard("Total Students", stats.total, "#3B82F6", "people")}
              {renderStatCard("Present", stats.present, "#10B981", "checkmark-circle")}
              {renderStatCard("Absent", stats.absent, "#EF4444", "close-circle")}
            </View>

            {/* Student List */}
            <View style={styles.listContainer}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Student List</Text>
                <View style={styles.legend}>
                  <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#10B981'}]}/><Text style={styles.legendText}>P</Text></View>
                  <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#EF4444'}]}/><Text style={styles.legendText}>A</Text></View>
                </View>
              </View>

              <FlatList
                data={mergedList}
                keyExtractor={(item) => item.studentId}
                renderItem={renderStudentRow}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              />
            </View>
          </>
        ) : (
          // --- 3. NOT MARKED STATE ---
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="alert-circle-outline" size={64} color="#F59E0B" />
            </View>
            <Text style={styles.emptyTitle}>Attendance Not Marked</Text>
            <Text style={styles.emptySub}>
              Attendance for Class {classes.find(c => c.classSectionId === selectedClassId)?.className}-{classes.find(c => c.classSectionId === selectedClassId)?.section} has not been submitted for {selectedDate.toDateString()}.
            </Text>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },

  // Filters
  filtersContainer: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
  dateSection: {},
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB' },
  dateText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  
  classScroll: { flexDirection: 'row' },
  classChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  classChipActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  classChipText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  classChipTextActive: { color: '#C2410C', fontWeight: 'bold' },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statsRowWeb: { justifyContent: 'space-between', gap: 20 },
  statsRowMobile: { flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }, // Added Wrap for Mobile

  statCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 0 },
  
  // Mobile specific Stat Card style to fit 2 in a row
  statCardMobile: { width: '48%', marginBottom: 10 }, 

  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: 'bold' },

  // List
  listContainer: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 12, color: '#6B7280' },

  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  studentId: { fontSize: 12, color: '#9CA3AF' },
  
  statusBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  statusPresent: { backgroundColor: '#D1FAE5' },
  statusAbsent: { backgroundColor: '#FEE2E2' },
  statusNeutral: { backgroundColor: '#F3F4F6' },
  
  statusText: { fontWeight: 'bold', fontSize: 14 },
  textPresent: { color: '#059669' },
  textAbsent: { color: '#DC2626' },
  textNeutral: { color: '#6B7280' },

  // Empty State
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#D97706', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' }
});