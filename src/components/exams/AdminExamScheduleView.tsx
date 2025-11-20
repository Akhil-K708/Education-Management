import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { createExam, getAllExams, scheduleExamComprehensive } from '../../api/examApi';
import { getAllClasses, getAllSubjects } from '../../api/timetableApi';
import { useAuth } from '../../context/AuthContext';
import { ExamMaster } from '../../types/exam';

// --- WEB INPUT COMPONENT ---
const WebInput = ({ mode, value, onChange }: { mode: 'date'|'time', value: Date, onChange: (d: Date)=>void }) => {
    return React.createElement('input', {
       type: mode,
       value: mode === 'date' ? value.toISOString().split('T')[0] : value.toTimeString().slice(0, 5),
       style: {
           border: '1px solid #D1D5DB',
           borderRadius: '8px',
           padding: '8px 12px',
           backgroundColor: '#F9FAFB',
           width: '100%',
           height: '45px',
           fontSize: '14px',
           color: '#111827',
           outline: 'none',
           boxSizing: 'border-box',
           fontFamily: 'System'
       },
       onChange: (e: any) => {
           const val = e.target.value;
           if(!val) return;
           
           if (mode === 'date') {
               onChange(new Date(val));
           } else {
               const [h, m] = val.split(':');
               const newDate = new Date();
               newDate.setHours(parseInt(h), parseInt(m), 0);
               onChange(newDate);
           }
       }
    });
 };

// --- TYPE FOR SCHEDULE ITEM ---
interface ScheduleItem {
    id: string; 
    subjectId: string;
    subjectName: string;
    examDate: string;
    startTime: string;
    endTime: string;
}

export default function AdminExamScheduleView() {
  const { state } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [examsList, setExamsList] = useState<ExamMaster[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // --- CREATE EXAM STATE ---
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState('OFFLINE');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // --- SCHEDULE STATE ---
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // The Preview List
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([]);

  const [showDate, setShowDate] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false); 
  const [showEndDate, setShowEndDate] = useState(false);     

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
        const [exams, cls, subs] = await Promise.all([
            getAllExams(),
            getAllClasses(),
            getAllSubjects()
        ]);
        setExamsList(exams.reverse());
        setClassesList(cls);
        setSubjectsList(subs);
        
        const st = new Date(); st.setHours(10, 0, 0);
        const et = new Date(); et.setHours(13, 0, 0);
        setStartTime(st);
        setEndTime(et);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0]; 
  const formatTime = (date: Date) => date.toTimeString().slice(0, 5); 
  const displayTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // --- 1. HANDLE CREATE EXAM ---
  const handleCreateExam = async () => {
      if(!newExamName) {
          Alert.alert("Error", "Please enter exam name");
          return;
      }
      setSubmitting(true);
      try {
          const created = await createExam({
              examName: newExamName,
              examType: newExamType,
              academicYear,
              startDate: formatDate(startDate),
              endDate: formatDate(endDate)
          });
          setExamsList([created, ...examsList]);
          Alert.alert("Success", "Exam Created Successfully!");
          setIsCreateMode(false);
          setNewExamName('');
      } catch(e) {
          Alert.alert("Error", "Failed to create exam");
      } finally {
          setSubmitting(false);
      }
  };

  // --- 2. ADD TO PREVIEW LIST ---
  const handleAddToPreview = () => {
      if(!selectedSubjectId) {
          Alert.alert("Info", "Please select a subject first");
          return;
      }

      const subjectObj = subjectsList.find(s => s.subjectId === selectedSubjectId);
      const newItem: ScheduleItem = {
          id: Math.random().toString(),
          subjectId: selectedSubjectId,
          subjectName: subjectObj?.subjectName || 'Unknown',
          examDate: formatDate(scheduleDate),
          startTime: formatTime(startTime),
          endTime: formatTime(endTime)
      };

      // Add to list
      setScheduleList([...scheduleList, newItem]);
      
      // Reset subject selection (Optional, keeps flow fast)
      setSelectedSubjectId('');
  };

  const removeFromPreview = (id: string) => {
      setScheduleList(scheduleList.filter(item => item.id !== id));
  };

  // --- 3. PUBLISH (FINAL SUBMIT) ---
  const handlePublish = async () => {
      if(!selectedExamId) { Alert.alert("Error", "Select Exam"); return; }
      if(selectedClassIds.length === 0) { Alert.alert("Error", "Select at least one Class"); return; }
      if(scheduleList.length === 0) { Alert.alert("Error", "Add at least one subject to the schedule list"); return; }

      setSubmitting(true);
      try {
          // Prepare payload for Comprehensive Endpoint
          const payload = {
              examId: selectedExamId,
              classSectionIds: selectedClassIds,
              schedules: scheduleList.map(item => ({
                  subjectId: item.subjectId,
                  examDate: item.examDate,
                  startTime: item.startTime,
                  endTime: item.endTime
              }))
          };

          await scheduleExamComprehensive(payload);
          
          Alert.alert("Success", "Exam Schedule Published Successfully!");
          
          // Clear Form
          setSelectedClassIds([]);
          setScheduleList([]);
      } catch(e) {
          Alert.alert("Error", "Failed to publish schedule. Check conflicts.");
      } finally {
          setSubmitting(false);
      }
  };

  const toggleClassSelection = (classId: string) => {
      if(selectedClassIds.includes(classId)) {
          setSelectedClassIds(selectedClassIds.filter(id => id !== classId));
      } else {
          setSelectedClassIds([...selectedClassIds, classId]);
      }
  };

  const renderDatePicker = (
    label: string, 
    value: Date, 
    mode: 'date' | 'time', 
    show: boolean, 
    setShow: (v: boolean) => void, 
    onChange: (e: DateTimePickerEvent, d?: Date) => void
  ) => {
    return (
      <View style={{flex: 1, minWidth: 140}}>
         <Text style={styles.label}>{label}</Text>
         {Platform.OS === 'web' ? (
            <View style={styles.webInputWrapper}>
               <WebInput 
                  mode={mode} 
                  value={value} 
                  onChange={(d) => onChange({ type: 'set', nativeEvent: {} as any }, d)} 
               />
            </View>
         ) : (
            <>
              <TouchableOpacity style={styles.input} onPress={() => setShow(true)}>
                  <Text style={styles.inputText}>{mode === 'date' ? formatDate(value) : displayTime(value)}</Text>
                  <Ionicons name={mode === 'date' ? "calendar" : "time"} size={20} color="#6B7280" style={{marginLeft: 'auto'}}/>
              </TouchableOpacity>
              {show && (
                <DateTimePicker
                   value={value}
                   mode={mode}
                   display="default"
                   onChange={(e, d) => {
                      setShow(false);
                      if(d) onChange(e, d);
                   }}
                />
              )}
            </>
         )}
      </View>
    );
  };

  const renderExamItem = (item: ExamMaster) => (
    <View key={item.examId} style={styles.historyCard}>
        <View>
            <Text style={styles.historyTitle}>{item.examName}</Text>
            <Text style={styles.historySub}>{item.examType} • {item.academicYear}</Text>
        </View>
        <View style={styles.statusTag}>
            <Text style={styles.statusText}>{item.status || 'CREATED'}</Text>
        </View>
    </View>
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316"/></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
        
        {/* 1. CREATE EXAM HEADER */}
        <TouchableOpacity 
            style={styles.accordionHeader} 
            onPress={() => setIsCreateMode(!isCreateMode)}
        >
            <Text style={styles.sectionTitle}>+ Create New Exam</Text>
            <Ionicons name={isCreateMode ? "chevron-up" : "chevron-down"} size={20} color="#F97316"/>
        </TouchableOpacity>

        {isCreateMode && (
            <View style={styles.formCard}>
                <Text style={styles.label}>Exam Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Unit Test 1" 
                    value={newExamName} 
                    onChangeText={setNewExamName} 
                />
                <View style={styles.row}>
                    {renderDatePicker("Start Date", startDate, "date", showStartDate, setShowStartDate, (e, d) => d && setStartDate(d))}
                    <View style={{width: 12}} />
                    {renderDatePicker("End Date", endDate, "date", showEndDate, setShowEndDate, (e, d) => d && setEndDate(d))}
                </View>
                <TouchableOpacity style={styles.createBtn} onPress={handleCreateExam} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Create Exam Master</Text>}
                </TouchableOpacity>
            </View>
        )}

        {/* 2. SCHEDULER */}
        <Text style={[styles.sectionTitle, {marginTop: 24, marginBottom: 12}]}>Comprehensive Scheduler</Text>
        <View style={styles.formCard}>
            
            {/* Global Selections */}
            <Text style={styles.label}>1. Select Exam (Common)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}}>
                {examsList.map(ex => (
                    <TouchableOpacity 
                        key={ex.examId} 
                        style={[styles.chip, selectedExamId === ex.examId && styles.chipActive]}
                        onPress={() => setSelectedExamId(ex.examId)}
                    >
                        <Text style={[styles.chipText, selectedExamId === ex.examId && styles.chipTextActive]}>{ex.examName}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.label}>2. Select Classes (Multi-Select)</Text>
            <View style={styles.multiSelectContainer}>
                {classesList.map(cls => {
                    const isSelected = selectedClassIds.includes(cls.classSectionId);
                    return (
                        <TouchableOpacity 
                            key={cls.classSectionId}
                            style={[styles.classBox, isSelected && styles.classBoxActive]}
                            onPress={() => toggleClassSelection(cls.classSectionId)}
                        >
                            <Text style={[styles.classBoxText, isSelected && styles.classBoxTextActive]}>
                                {cls.className}-{cls.section}
                            </Text>
                            {isSelected && <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{marginLeft:4}}/>}
                        </TouchableOpacity>
                    )
                })}
            </View>
            
            <View style={styles.divider} />

            {/* Subject Entry */}
            <Text style={styles.subHeader}>Add Subject to Schedule</Text>
            <Text style={styles.label}>Select Subject</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}}>
                {subjectsList.map(sub => (
                    <TouchableOpacity 
                        key={sub.subjectId} 
                        style={[styles.chip, selectedSubjectId === sub.subjectId && styles.chipActive]}
                        onPress={() => setSelectedSubjectId(sub.subjectId)}
                    >
                        <Text style={[styles.chipText, selectedSubjectId === sub.subjectId && styles.chipTextActive]}>{sub.subjectName}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.row}>
                {renderDatePicker("Exam Date", scheduleDate, "date", showDate, setShowDate, (e, d) => d && setScheduleDate(d))}
            </View>

            <View style={styles.row}>
                {renderDatePicker("Start Time", startTime, "time", showStart, setShowStart, (e, d) => d && setStartTime(d))}
                <View style={{width: 12}} />
                {renderDatePicker("End Time", endTime, "time", showEnd, setShowEnd, (e, d) => d && setEndTime(d))}
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={handleAddToPreview}>
                 <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{marginRight: 6}} />
                 <Text style={styles.btnText}>Add to List</Text>
            </TouchableOpacity>
        </View>

        {/* 3. PREVIEW TABLE */}
        {scheduleList.length > 0 && (
            <View style={styles.previewContainer}>
                <Text style={styles.subHeader}>Preview Schedule ({scheduleList.length})</Text>
                <View style={styles.tableHeader}>
                    <Text style={[styles.th, {flex:2}]}>Subject</Text>
                    <Text style={[styles.th, {flex:2}]}>Date</Text>
                    <Text style={[styles.th, {flex:2}]}>Time</Text>
                    <Text style={[styles.th, {flex:0.5}]}></Text>
                </View>
                {scheduleList.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                        <Text style={[styles.td, {flex:2, fontWeight:'bold'}]}>{item.subjectName}</Text>
                        <Text style={[styles.td, {flex:2}]}>{item.examDate}</Text>
                        <Text style={[styles.td, {flex:2, fontSize: 12}]}>{item.startTime} - {item.endTime}</Text>
                        <TouchableOpacity style={{flex:0.5}} onPress={() => removeFromPreview(item.id)}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#FFF"/> : (
                        <Text style={styles.publishText}>
                            Publish Schedule for {selectedClassIds.length} Classes
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        )}

        <Text style={[styles.sectionTitle, {marginTop: 24, marginBottom: 12}]}>Exam History</Text>
        {examsList.map(renderExamItem)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  subHeader: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 10, marginTop: 5 },
  
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 1, marginBottom: 8 },
  formCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 10 },
  
  input: { 
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, 
    paddingHorizontal: 12, paddingVertical: 10, 
    backgroundColor: '#F9FAFB', fontSize: 14, 
    flexDirection: 'row', alignItems: 'center', height: 45 
  },
  inputText: { color: '#111827', fontSize: 14 },
  webInputWrapper: { width: '100%' },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },

  // Buttons
  createBtn: { backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  addBtn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center' },
  publishBtn: { backgroundColor: '#F97316', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  publishText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8, backgroundColor: '#F9FAFB' },
  chipActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#F97316', fontWeight: 'bold' },

  multiSelectContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  classBoxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  classBoxText: { fontSize: 13, color: '#374151' },
  classBoxTextActive: { color: '#FFF', fontWeight: 'bold' },

  // Preview Table
  previewContainer: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 16 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8, marginBottom: 8 },
  th: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  td: { fontSize: 13, color: '#374151' },

  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#8B5CF6' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  historySub: { fontSize: 12, color: '#6B7280' },
  statusTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#4B5563' }
});