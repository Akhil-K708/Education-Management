import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { getAllExams, getExamTimetable } from '../../api/examApi';
import { getStudentProfile } from '../../api/studentService';
import { useAuth } from '../../context/AuthContext';
import { ExamDaySchedule, ExamMaster } from '../../types/exam';

export default function StudentExamScheduleView() {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isWeb = width > 768; 

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [examsList, setExamsList] = useState<ExamMaster[]>([]); 
  const [selectedExam, setSelectedExam] = useState<ExamMaster | null>(null); 
  const [studentSchedule, setStudentSchedule] = useState<ExamDaySchedule[]>([]); 
  
  const [classSectionId, setClassSectionId] = useState<string | null>(null); 
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); 

  // --- DATE FORMATTER (YYYY-MM-DD -> DD-MM-YYYY) ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-'); // [2025, 11, 20]
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString; 
  };

  const fetchData = async () => {
    if (!user?.username) return;
    setLoading(true);

    try {
        // Note: Teacher logic is handled in separate component now, 
        // but keeping this check ensures this component works safely if reused.
      if (user.role === 'TEACHER') {
        const allExams = await getAllExams();
        setExamsList(allExams);
      } 
      else if (user.role === 'STUDENT') {
        const profile = await getStudentProfile(user.username);
        if (profile.classSectionId) {
            setClassSectionId(profile.classSectionId);
            
            const allExams = await getAllExams();
            setExamsList(allExams);

            if (allExams.length > 0) {
                const firstExam = allExams[0];
                setSelectedExam(firstExam);
                const timetable = await getExamTimetable(firstExam.examId, profile.classSectionId);
                setStudentSchedule(timetable);
            } else {
                setStudentSchedule([]);
                setSelectedExam(null);
            }
        } else {
            setStudentSchedule([]);
            setSelectedExam(null);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
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

  const handleExamSelect = async (exam: ExamMaster) => {
      setSelectedExam(exam);
      setIsDropdownVisible(false);
      if (classSectionId) {
          setLoading(true);
          try {
            const timetable = await getExamTimetable(exam.examId, classSectionId);
            setStudentSchedule(timetable);
          } catch(e) {
             console.error(e);
             setStudentSchedule([]);
          } finally {
            setLoading(false);
          }
      } else {
          setStudentSchedule([]);
      }
  };

  // --- RENDER: Teacher View (Legacy Support inside this component) ---
  const renderTeacherExamCard = ({ item }: { item: ExamMaster }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View>
                <Text style={styles.examTitle}>{item.examName}</Text>
                <Text style={styles.examType}>{item.examType} • {item.academicYear}</Text>
            </View>
            <View style={[
                styles.statusBadge, 
                item.status === 'PUBLISHED' ? styles.statusPublished : styles.statusDraft
            ]}>
                <Text style={[
                    styles.statusText,
                    item.status === 'PUBLISHED' ? styles.textPublished : styles.textDraft
                ]}>{item.status}</Text>
            </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.dateRow}>
            <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Starts</Text>
                <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
            </View>
            <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Ends</Text>
                <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
            </View>
        </View>
    </View>
  );

  // --- RENDER: Student View (4-Column Table) ---
  const renderStudentScheduleTable = () => (
    <View style={styles.tableCard}>
      {/* Table Header */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={styles.col1}><Text style={styles.headerText}>Date</Text></View>
        <View style={styles.col2}><Text style={styles.headerText}>Subject</Text></View>
        <View style={styles.col3}><Text style={styles.headerText}>Timings</Text></View>
        <View style={styles.col4}><Text style={styles.headerText}>Room</Text></View>
      </View>

      {/* Table Body */}
      {studentSchedule.length > 0 ? (
        studentSchedule.map((dayItem, dayIndex) => (
          dayItem.subjects.map((subjectItem, subIndex) => (
            <View key={`${dayIndex}-${subIndex}`}>
                <View style={styles.tableRow}>
                    {/* 1. Date */}
                    <View style={styles.col1}>
                        <View style={styles.dateBox}>
                            <Text style={styles.cellDateText}>{formatDate(dayItem.examDate)}</Text>
                        </View>
                    </View>
                    
                    {/* 2. Subject */}
                    <View style={styles.col2}>
                        <Text style={[styles.cellText, styles.subjectCell]}>{subjectItem.subjectName}</Text>
                    </View>
                    
                    {/* 3. Timings */}
                    <View style={styles.col3}>
                        <Text style={styles.cellText}>{subjectItem.startTime} - {subjectItem.endTime}</Text>
                    </View>
                    
                    {/* 4. Room */}
                    <View style={styles.col4}>
                        <Text style={styles.cellText}>{subjectItem.roomNumber || 'N/A'}</Text>
                    </View>
                </View>
                {/* Separator line except for last item */}
                {(dayIndex < studentSchedule.length - 1 || subIndex < dayItem.subjects.length - 1) && (
                    <View style={styles.tableSeparator} />
                )}
            </View>
          ))
        ))
      ) : (
        <View style={styles.emptyTable}>
          <Ionicons name="calendar-clear-outline" size={48} color="#E5E7EB" />
          <Text style={styles.noDataText}>No schedule found for this exam.</Text>
        </View>
      )}
    </View>
  );

  if (state.status === 'loading' || !user) {
      return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>
          {user.role === 'TEACHER' ? 'All Examinations' : 'My Exam Schedule'}
      </Text>

      {/* ================= TEACHER VIEW ================= */}
      {user.role === 'TEACHER' && (
          <FlatList
            data={examsList}
            keyExtractor={(item) => item.examId}
            renderItem={renderTeacherExamCard}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={styles.noDataText}>No exams created yet.</Text>
                </View>
            }
          />
      )}

      {/* ================= STUDENT VIEW ================= */}
      {user.role === 'STUDENT' && (
          <ScrollView 
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Exam Selector */}
            <View style={styles.selectorContainer}>
                <Text style={styles.selectorLabel}>Examination:</Text>
                <TouchableOpacity 
                    style={styles.dropdownButton} 
                    onPress={() => setIsDropdownVisible(true)}
                    disabled={examsList.length === 0}
                >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                        {selectedExam ? selectedExam.examName : "Select"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#4B5563" />
                </TouchableOpacity>
            </View>

            {/* Timetable Table */}
            {loading ? (
                <ActivityIndicator size="large" color="#F97316" style={{marginTop: 20}} />
            ) : (
                renderStudentScheduleTable()
            )}

            {/* Dropdown Modal */}
            <Modal visible={isDropdownVisible} transparent animationType="fade">
                <TouchableOpacity 
                style={styles.modalOverlay} 
                onPress={() => setIsDropdownVisible(false)}
                >
                {/* --- FIX FOR WEB MODAL WIDTH --- */}
                <View style={[styles.modalContent, isWeb && styles.modalContentWeb]}>
                    <Text style={styles.modalTitle}>Select Examination</Text>
                    <FlatList
                        data={examsList}
                        keyExtractor={(item) => item.examId}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[
                                    styles.modalItem, 
                                    selectedExam?.examId === item.examId && styles.modalItemSelected
                                ]}
                                onPress={() => handleExamSelect(item)}
                            >
                                <Text style={[
                                    styles.modalItemText,
                                    selectedExam?.examId === item.examId && styles.modalItemTextSelected
                                ]}>{item.examName}</Text>
                                {selectedExam?.examId === item.examId && (
                                    <Ionicons name="checkmark" size={20} color="#F97316" />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
                </TouchableOpacity>
            </Modal>
          </ScrollView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  pageTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20,
  },

  // --- TEACHER STYLES ---
  card: {
      backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  examTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  examType: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPublished: { backgroundColor: '#D1FAE5' }, 
  statusDraft: { backgroundColor: '#F3F4F6' }, 
  statusText: { fontSize: 12, fontWeight: 'bold' },
  textPublished: { color: '#059669' },
  textDraft: { color: '#4B5563' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '600', color: '#111827' },

  // --- STUDENT SELECTOR ---
  selectorContainer: { 
    marginBottom: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-start' 
  },
  selectorLabel: { 
    fontSize: 16, 
    color: '#374151', 
    marginRight: 12, 
    fontWeight: '600' 
  },
  dropdownButton: {
      minWidth: 160, 
      backgroundColor: '#FFFFFF', 
      borderRadius: 10, 
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderWidth: 1, 
      borderColor: '#E5E7EB', 
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  dropdownText: { 
      fontSize: 14, 
      color: '#111827', 
      fontWeight: '500',
      marginRight: 8,
      maxWidth: 140 
  },

  // --- TABLE STYLES ---
  tableCard: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    overflow: 'hidden', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F3F4F6', 
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tableHeader: {
    backgroundColor: '#F9FAFB', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB', 
  },
  tableSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  
  // Columns 
  col1: { flex: 1.2, paddingRight: 4 },    
  col2: { flex: 1.4, paddingRight: 4 },  
  col3: { flex: 1.4, paddingRight: 4 },  
  col4: { flex: 0.8, paddingRight: 0 },  

  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dateBox: {
      backgroundColor: '#FFF7ED', 
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignSelf: 'flex-start'
  },
  cellDateText: {
      fontSize: 13,
      fontWeight: 'bold',
      color: '#C2410C', 
  },
  subjectCell: {
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'capitalize',
    fontSize: 15
  },
  
  emptyTable: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '60%',
    width: '85%', // Default for Mobile
    alignSelf: 'center',
  },
  // --- THIS FIXES THE WEB MODAL WIDTH ---
  modalContentWeb: {
    width: 450, // Fixed width for Web
    maxWidth: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  modalItem: {
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  modalItemSelected: { backgroundColor: '#FFF7ED' },
  modalItemText: { fontSize: 16, color: '#374151' },
  modalItemTextSelected: { color: '#F97316', fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 40 },
  noDataText: { color: '#9CA3AF', fontStyle: 'italic', marginTop: 10 },
});