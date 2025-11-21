import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getClassStudents, getDailyClassAttendance, getStudentAttendance, getTeacherClasses, markAttendance } from '../../api/attendanceApi';
import { useAuth } from '../../context/AuthContext';

// --- WEB INPUT COMPONENT ---
const WebInput = ({ value, onChange }: { value: Date, onChange: (d: Date)=>void }) => {
    return React.createElement('input', {
       type: 'date',
       value: value.toISOString().split('T')[0],
       style: {
           border: '1px solid #FED7AA', 
           borderRadius: '12px',
           padding: '12px 16px',
           backgroundColor: '#FFF7ED', 
           width: '100%',
           height: '55px',
           fontSize: '18px',
           fontWeight: 'bold',
           color: '#C2410C', 
           outline: 'none',
           boxSizing: 'border-box',
           fontFamily: 'System',
           cursor: 'pointer'
       },
       onChange: (e: any) => {
           const val = e.target.value;
           if(val) {
               onChange(new Date(val));
           }
       }
    });
 };

export default function TeacherAttendanceView() {
  const { state } = useAuth();
  const user = state.user;

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  
  // Logic Fix: Always store explicit 'PRESENT' or 'ABSENT'
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({}); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedStudentStats, setSelectedStudentStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  // Re-fetch attendance when Class, Date, OR Student list changes
  useEffect(() => {
    if (selectedClass && selectedDate && students.length > 0) {
        fetchExistingAttendance();
    }
  }, [selectedDate, selectedClass, students]);

  const fetchClasses = async () => {
    if (!user?.username) return;
    setLoading(true);
    try {
        const data = await getTeacherClasses(user.username);
        setClasses(data);
        if (data.length > 0) {
            handleClassSelect(data[0].classSectionId);
        } else {
            setLoading(false);
        }
    } catch (e) {
        setLoading(false);
    }
  };

  const handleClassSelect = async (classId: string) => {
      setSelectedClass(classId);
      try {
        setLoading(true);
        const studentList = await getClassStudents(classId);
        setStudents(studentList);
        // Note: attendanceMap will be built by the useEffect triggered by students change
      } catch(e) { console.error(e); setLoading(false); }
  };

  const fetchExistingAttendance = async () => {
      if(!selectedClass) return;
      
      // Don't show full loading, just update state quietly or small loader if needed
      // Building initial map with ALL PRESENT
      const newMap: Record<string, string> = {};
      students.forEach(s => {
          newMap[s.studentId] = 'PRESENT';
      });

      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const existingRecords = await getDailyClassAttendance(selectedClass, formattedDate);
        
        if (existingRecords && existingRecords.length > 0) {
            existingRecords.forEach((rec: any) => {
                // Update only valid statuses
                if (rec.status === 'ABSENT') {
                    newMap[rec.studentId] = 'ABSENT';
                }
            });
        } 
        setAttendanceMap(newMap);

      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  // --- BUG FIX: Simple Toggle Logic ---
  const toggleStatus = (studentId: string) => {
      setAttendanceMap(prev => ({
          ...prev,
          [studentId]: prev[studentId] === 'ABSENT' ? 'PRESENT' : 'ABSENT'
      }));
  };

  const handleSubmit = async () => {
      if(!selectedClass || students.length === 0) return;
      setLoading(true);
      try {
          const formattedDate = selectedDate.toISOString().split('T')[0];
          const entries = students.map(s => ({
              studentId: s.studentId,
              // Ensure we send the exact status from map
              status: attendanceMap[s.studentId] || 'PRESENT'
          }));

          await markAttendance(selectedClass, user?.username!, formattedDate, entries);
          Alert.alert("Success", `Attendance Updated for ${formattedDate}!`);
      } catch(e) {
          Alert.alert("Error", "Failed to save attendance.");
      } finally {
          setLoading(false);
      }
  };

  const viewStudentHistory = async (studentId: string, studentName: string) => {
      setHistoryModalVisible(true);
      setStatsLoading(true);
      setSelectedStudentStats({ name: studentName }); 
      try {
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          const data = await getStudentAttendance(studentId, currentYear, currentMonth);
          setSelectedStudentStats({ ...data, name: studentName });
      } catch(e) {
          setSelectedStudentStats(null);
      } finally {
          setStatsLoading(false);
      }
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
      setShowDatePicker(false);
      if(date) setSelectedDate(date);
  };

  if (loading && classes.length === 0) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316"/></View>;

  const absentCount = Object.values(attendanceMap).filter(s => s === 'ABSENT').length;
  const presentCount = students.length - absentCount;

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Mark Attendance</Text>
        
        {/* DATE SELECTOR */}
        {Platform.OS === 'web' ? (
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.dateLabel}>SELECT DATE:</Text>
                <WebInput value={selectedDate} onChange={setSelectedDate} />
            </View>
        ) : (
            <View style={styles.dateCardWrapper}>
                <TouchableOpacity 
                    style={styles.dateCard} 
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                >
                    <View>
                        <Text style={styles.dateLabel}>Select Date:</Text>
                        <View style={styles.dateRow}>
                            <Text style={styles.dateText}>{selectedDate.toISOString().split('T')[0]}</Text>
                            <Ionicons name="chevron-down" size={20} color="#C2410C" />
                        </View>
                    </View>
                    <View style={styles.calendarIconBox}>
                        <Ionicons name="calendar" size={24} color="#FFF" />
                    </View>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        maximumDate={new Date()}
                    />
                )}
            </View>
        )}

        {/* CLASS SELECTOR */}
        <View style={styles.classRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {classes.map(c => (
                    <TouchableOpacity 
                        key={c.classSectionId} 
                        style={[styles.chip, selectedClass === c.classSectionId && styles.chipActive]}
                        onPress={() => handleClassSelect(c.classSectionId)}
                    >
                        <Text style={[styles.chipText, selectedClass === c.classSectionId && styles.chipTextActive]}>
                            {c.className}-{c.sectionName}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* STUDENT LIST */}
        <FlatList
            data={students}
            keyExtractor={item => item.studentId}
            contentContainerStyle={{paddingBottom: 100}}
            extraData={attendanceMap} 
            renderItem={({item}) => {
                const status = attendanceMap[item.studentId] || 'PRESENT';
                const isAbsent = status === 'ABSENT';
                const isPresent = !isAbsent;

                // Dynamic Style Construction to prevent glitches
                const cardStyle = {
                    ...styles.studentCard,
                    ...(isAbsent ? styles.cardAbsent : {})
                };

                return (
                    <View style={cardStyle}>
                        <TouchableOpacity 
                            style={styles.cardMainClick} 
                            onPress={() => toggleStatus(item.studentId)}
                            activeOpacity={0.9} // Less transparency on click to keep content visible
                        >
                            <View style={[styles.avatar, isAbsent && {backgroundColor: '#FECACA'}]}>
                                <Text style={[styles.avatarText, isAbsent && {color: '#DC2626'}]}>
                                    {item.fullName ? item.fullName.charAt(0).toUpperCase() : '?'}
                                </Text>
                            </View>
                            
                            <View style={{flex: 1}}>
                                <Text style={styles.name}>{item.fullName}</Text>
                                <Text style={styles.roll}>Roll: {item.rollNumber}</Text>
                            </View>

                            <View style={[styles.statusBadge, isPresent ? styles.badgePresent : styles.badgeAbsent]}>
                                <Text style={[styles.statusText, isPresent ? {color:'#059669'} : {color:'#DC2626'}]}>
                                    {isPresent ? 'P' : 'A'}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.infoBtn}
                            onPress={() => viewStudentHistory(item.studentId, item.fullName)}
                        >
                            <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                );
            }}
        />

        {/* FOOTER */}
        <View style={styles.footer}>
            <View style={styles.summary}>
                <Text style={styles.summaryText}>
                    Present: {presentCount} / {students.length}
                </Text>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitText}>Submit</Text>}
            </TouchableOpacity>
        </View>

        {/* HISTORY MODAL */}
        <Modal visible={historyModalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Attendance Report</Text>
                        <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>
                    
                    {statsLoading ? (
                        <ActivityIndicator size="large" color="#F97316" style={{marginVertical: 20}} />
                    ) : selectedStudentStats ? (
                        <>
                            <Text style={styles.studentNameTitle}>{selectedStudentStats.name}</Text>
                            <Text style={styles.monthTitle}>Current Month Stats</Text>
                            <View style={styles.statGrid}>
                                <View style={[styles.statBox, {backgroundColor: '#D1FAE5'}]}>
                                    <Text style={[styles.statNum, {color: '#059669'}]}>{selectedStudentStats.present}</Text>
                                    <Text style={styles.statLabel}>Present</Text>
                                </View>
                                <View style={[styles.statBox, {backgroundColor: '#FEE2E2'}]}>
                                    <Text style={[styles.statNum, {color: '#DC2626'}]}>{selectedStudentStats.absent}</Text>
                                    <Text style={styles.statLabel}>Absent</Text>
                                </View>
                                <View style={[styles.statBox, {backgroundColor: '#DBEAFE'}]}>
                                    <Text style={[styles.statNum, {color: '#2563EB'}]}>{selectedStudentStats.percentage.toFixed(1)}%</Text>
                                    <Text style={styles.statLabel}>Percent</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <Text>No data found.</Text>
                    )}
                </View>
            </View>
        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  dateCardWrapper: { position: 'relative', marginBottom: 20 },
  dateCard: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: '#FFF7ED', borderRadius: 12, padding: 16,
      borderWidth: 1, borderColor: '#FED7AA'
  },
  dateLabel: { fontSize: 12, color: '#9A3412', fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#C2410C', marginRight: 6 },
  calendarIconBox: { backgroundColor: '#F97316', padding: 10, borderRadius: 12 },

  classRow: { marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  chipText: { color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  
  // Consolidated Student Card Style
  studentCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#FFF', 
      borderRadius: 12, 
      marginBottom: 10, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 2, 
      elevation: 2, 
      overflow: 'hidden',
      borderLeftWidth: 0 
  },
  cardAbsent: { 
      backgroundColor: '#FEF2F2', 
      borderLeftWidth: 4, 
      borderLeftColor: '#EF4444' 
  },
  cardMainClick: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16 },
  
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontWeight: 'bold', color: '#6B7280', fontSize: 16 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  roll: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  badgePresent: { backgroundColor: '#D1FAE5' },
  badgeAbsent: { backgroundColor: '#FEE2E2' },
  statusText: { fontWeight: 'bold', fontSize: 16 },
  
  infoBtn: { padding: 16, borderLeftWidth: 1, borderLeftColor: '#F3F4F6' },

  footer: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  summary: { flex: 1 },
  summaryText: { fontWeight: 'bold', color: '#374151', fontSize: 16 },
  submitBtn: { backgroundColor: '#F97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', borderRadius: 16, padding: 24, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  studentNameTitle: { fontSize: 22, fontWeight: 'bold', color: '#F97316', marginBottom: 8, textAlign: 'center' },
  monthTitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  statGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { width: '31%', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  statNum: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#374151', fontWeight: '500' }
});