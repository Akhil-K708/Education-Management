import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { getAllExams, getTeacherClassExamTimetable, getTeacherSubjectExamTimetable } from '../../api/examApi';
import { ExamMaster } from '../../types/exam';

// Corrected Interface based on Backend Response
interface ExtendedSubject {
  subjectId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  className?: string;
  sectionName?: string; 
}

interface ExtendedDaySchedule {
  examDate: string;
  dayName: string;
  subjects: ExtendedSubject[];
}

export default function TeacherExamScheduleView() {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [examsList, setExamsList] = useState<ExamMaster[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamMaster | null>(null);
  const [scheduleData, setScheduleData] = useState<ExtendedDaySchedule[]>([]);
  
  const [activeTab, setActiveTab] = useState<'SUBJECT' | 'CLASS'>('SUBJECT');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const exams = await getAllExams();
      // Sort exams by date (latest first)
      const sortedExams = exams.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setExamsList(sortedExams);
      
      if (sortedExams.length > 0) {
        setSelectedExam(sortedExams[0]);
        await fetchSchedule(sortedExams[0].examId, activeTab);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchSchedule = async (examId: string, tab: 'SUBJECT' | 'CLASS') => {
    setLoading(true);
    setScheduleData([]); 
    try {
      let data: any[] = [];
      if (tab === 'SUBJECT') {
        data = await getTeacherSubjectExamTimetable(examId);
      } else {
        data = await getTeacherClassExamTimetable(examId);
      }

      // --- FIX: Sort Data by Date (Down-by-Down order) ---
      if (data) {
          data.sort((a: ExtendedDaySchedule, b: ExtendedDaySchedule) => {
              return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
          });
      }

      setScheduleData(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedExam) {
      fetchSchedule(selectedExam.examId, activeTab);
    } else {
      fetchInitialData();
    }
  };

  const handleExamSelect = (exam: ExamMaster) => {
    setSelectedExam(exam);
    setIsDropdownVisible(false);
    fetchSchedule(exam.examId, activeTab);
  };

  const handleTabChange = (tab: 'SUBJECT' | 'CLASS') => {
    setActiveTab(tab);
    if (selectedExam) {
      fetchSchedule(selectedExam.examId, tab);
    }
  };

  // --- RENDER ITEM ---
  const renderDaySchedule = ({ item }: { item: ExtendedDaySchedule }) => (
    <View style={styles.dayContainer}>
        <View style={styles.dateHeader}>
            <Ionicons name="calendar" size={18} color="#C2410C" />
            <Text style={styles.dateText}>{item.dayName}, {item.examDate}</Text>
        </View>
        
        {item.subjects.map((sub, index) => (
            <View key={index} style={styles.subjectCard}>
                <View style={styles.subjectRow}>
                    
                    {/* LEFT: TIME */}
                    <View style={[styles.timeBox, isWeb && styles.timeBoxWeb]}>
                        <Text style={styles.timeText}>{sub.startTime}</Text>
                        {isWeb ? (
                             <Text style={styles.toTextWeb}> - </Text>
                        ) : (
                             <Text style={styles.toText}>to</Text>
                        )}
                        <Text style={styles.timeText}>{sub.endTime}</Text>
                    </View>
                    
                    {/* Divider only for Mobile */}
                    {!isWeb && <View style={styles.dividerVertical} />}

                    {/* MIDDLE: SUBJECT */}
                    <View style={[styles.detailsBox, isWeb && styles.detailsBoxWeb]}>
                        <Text style={[styles.subjectName, isWeb && styles.subjectNameWeb]}>{sub.subjectName}</Text>
                        {sub.roomNumber && (
                             <View style={[styles.metaRow, isWeb && {justifyContent: 'center'}]}>
                                <Ionicons name="location-outline" size={12} color="#6B7280" />
                                <Text style={styles.metaText}>Room: {sub.roomNumber}</Text>
                             </View>
                        )}
                    </View>

                    {/* RIGHT: CLASS & SECTION */}
                    <View style={[styles.classBox, isWeb && styles.classBoxWeb]}>
                        <View style={styles.classBadge}>
                            <Text style={styles.classText}>
                                {sub.className ? `${sub.className} - ${sub.sectionName}` : 'N/A'}
                            </Text>
                        </View>
                    </View>

                </View>
            </View>
        ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
        <Text style={styles.pageTitle}>Exam Schedule</Text>
        
        <TouchableOpacity 
            style={styles.dropdownButton} 
            onPress={() => setIsDropdownVisible(true)}
            disabled={examsList.length === 0}
        >
            <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedExam ? selectedExam.examName : "Select Exam"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#4B5563" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'SUBJECT' && styles.tabActive]} 
            onPress={() => handleTabChange('SUBJECT')}
          >
              <Text style={[styles.tabText, activeTab === 'SUBJECT' && styles.activeTabText]}>My Subjects</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'CLASS' && styles.tabActive]} 
            onPress={() => handleTabChange('CLASS')}
          >
              <Text style={[styles.tabText, activeTab === 'CLASS' && styles.activeTabText]}>My Class</Text>
          </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>
      ) : (
        <FlatList
            data={scheduleData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderDaySchedule}
            contentContainerStyle={{ paddingBottom: 20 }}
            
            // --- FIX: Always 1 column (Down-by-down layout) ---
            key={isWeb ? 'web-list' : 'mobile-list'}
            numColumns={1}
            
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>
                        {activeTab === 'SUBJECT' 
                            ? "No exams scheduled for your subjects." 
                            : "No exams scheduled for your class."
                        }
                    </Text>
                </View>
            }
        />
      )}

      <Modal visible={isDropdownVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={[styles.modalContent, isWeb && {width: 400}]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerRowMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 12 },
  
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  dropdownButton: {
      minWidth: 180, 
      backgroundColor: '#FFFFFF', 
      borderRadius: 10, 
      paddingVertical: 10,
      paddingHorizontal: 14,
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderWidth: 1, 
      borderColor: '#E5E7EB',
  },
  dropdownText: { fontSize: 14, color: '#111827', fontWeight: '500', marginRight: 8, maxWidth: 160 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#F97316', fontWeight: 'bold' },

  dayContainer: { 
      backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, 
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
      overflow: 'hidden',
      width: '100%',
      // Removed grid styling to force full width vertical list
  },
  dateHeader: { 
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', 
      padding: 12, borderBottomWidth: 1, borderBottomColor: '#FED7AA' 
  },
  dateText: { marginLeft: 8, fontSize: 15, fontWeight: 'bold', color: '#9A3412' },

  subjectCard: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  
  subjectRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between' 
  },

  // --- TIME COLUMN ---
  timeBox: { 
      alignItems: 'center', 
      minWidth: 70,
      justifyContent: 'center'
  },
  timeBoxWeb: {
      flexDirection: 'row', 
      minWidth: 150,
      justifyContent: 'flex-start', 
      gap: 8
  },
  timeText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  toText: { fontSize: 10, color: '#9CA3AF', marginVertical: 2 },
  toTextWeb: { fontSize: 14, fontWeight: 'bold', color: '#9CA3AF' },
  
  dividerVertical: { width: 1, height: 40, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  
  // --- SUBJECT COLUMN ---
  detailsBox: { 
      flex: 1, 
      justifyContent: 'center',
      paddingRight: 8 
  },
  detailsBoxWeb: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
  },
  subjectName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  subjectNameWeb: { textAlign: 'center' }, 
  
  metaRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // --- CLASS COLUMN ---
  classBox: { 
      justifyContent: 'center', 
      alignItems: 'flex-end',
      minWidth: 60
  },
  classBoxWeb: {
      minWidth: 100,
      alignItems: 'flex-end'
  },
  classBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  classText: { color: '#4F46E5', fontWeight: 'bold', fontSize: 13 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', marginTop: 10, textAlign: 'center', fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 350, borderRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemSelected: { backgroundColor: '#FFF7ED' },
  modalItemText: { fontSize: 16, color: '#374151' },
  modalItemTextSelected: { color: '#F97316', fontWeight: 'bold' },
});