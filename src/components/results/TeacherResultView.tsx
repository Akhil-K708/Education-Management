import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getClassStudents, getTeacherClasses } from '../../api/attendanceApi';
import { getAllExams } from '../../api/examApi';
import { enterMarks, getSubjectsByClass } from '../../api/resultsApi';
import { useAuth } from '../../context/AuthContext';
import { MarksEntryItem } from '../../types/results';

export default function TeacherResultView() {
  const { state } = useAuth();
  const user = state.user;

  const [loading, setLoading] = useState(false);
  
  // Dropdown Data
  const [examsList, setExamsList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // Selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Student Data
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [marksInput, setMarksInput] = useState<Record<string, string>>({}); // studentId -> marks

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch Exams & Teacher's Classes
      const [exams, classes] = await Promise.all([
        getAllExams(),
        getTeacherClasses(user?.username!)
      ]);
      setExamsList(exams);
      setClassesList(classes);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId(''); // Reset Subject
    setStudentsData([]); // Reset Students
    
    // Fetch Subjects for this Class
    try {
        setLoading(true);
        const mappings = await getSubjectsByClass(classId);
        const subs = mappings.map((m: any) => ({
            id: m.subjectId,
            name: m.subjectName
        }));
        setSubjectsList(subs);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
      if(!selectedExamId || !selectedClassId || !selectedSubjectId) {
          Alert.alert("Info", "Please select Exam, Class and Subject.");
          return;
      }

      setLoading(true);
      try {
          // 1. Get Students in Class
          const students = await getClassStudents(selectedClassId);
          
          setStudentsData(students);
          
          // Initialize inputs with empty
          const initialMarks: any = {};
          students.forEach((s: any) => initialMarks[s.studentId] = '');
          setMarksInput(initialMarks);

      } catch(e) {
          Alert.alert("Error", "Failed to fetch students.");
      } finally {
          setLoading(false);
      }
  };

  const handleSaveMarks = async () => {
      setLoading(true);
      try {
          const entries: MarksEntryItem[] = studentsData.map(s => {
             const val = marksInput[s.studentId];
             return {
                 studentId: s.studentId,
                 marksObtained: val ? parseFloat(val) : 0,
                 attendanceStatus: val ? 'PRESENT' : 'ABSENT', // Logic: No marks = Absent
                 remarks: val ? '' : 'Absent' 
             };
          });

          await enterMarks(selectedSubjectId, {
              examId: selectedExamId,
              classSectionId: selectedClassId,
              subjectId: selectedSubjectId,
              entries: entries
          });

          Alert.alert("Success", "Marks saved successfully!");
      } catch(e) {
          Alert.alert("Error", "Failed to save marks.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      <Text style={styles.pageTitle}>Enter Exam Marks</Text>

      {/* FILTERS CARD */}
      <View style={styles.card}>
          {/* Exam Selector */}
          <Text style={styles.label}>Select Exam</Text>
          <ScrollView horizontal style={styles.chipScroll} showsHorizontalScrollIndicator={false}>
             {examsList.map(ex => (
                 <TouchableOpacity 
                    key={ex.examId} 
                    style={[styles.chip, selectedExamId === ex.examId && styles.chipActive]}
                    onPress={() => setSelectedExamId(ex.examId)}
                 >
                     <Text style={[styles.chipText, selectedExamId === ex.examId && styles.chipTextActive]}>
                        {ex.examName}
                     </Text>
                 </TouchableOpacity>
             ))}
          </ScrollView>

          {/* Class Selector */}
          <Text style={styles.label}>Select Class</Text>
          <ScrollView horizontal style={styles.chipScroll} showsHorizontalScrollIndicator={false}>
             {classesList.map(c => (
                 <TouchableOpacity 
                    key={c.classSectionId} 
                    style={[styles.chip, selectedClassId === c.classSectionId && styles.chipActive]}
                    onPress={() => handleClassChange(c.classSectionId)}
                 >
                     <Text style={[styles.chipText, selectedClassId === c.classSectionId && styles.chipTextActive]}>
                        {c.className}-{c.sectionName}
                     </Text>
                 </TouchableOpacity>
             ))}
          </ScrollView>

          {/* Subject Selector */}
          <Text style={styles.label}>Select Subject</Text>
          <ScrollView horizontal style={styles.chipScroll} showsHorizontalScrollIndicator={false}>
             {subjectsList.length > 0 ? subjectsList.map(s => (
                 <TouchableOpacity 
                    key={s.id} 
                    style={[styles.chip, selectedSubjectId === s.id && styles.chipActive]}
                    onPress={() => setSelectedSubjectId(s.id)}
                 >
                     <Text style={[styles.chipText, selectedSubjectId === s.id && styles.chipTextActive]}>
                        {s.name}
                     </Text>
                 </TouchableOpacity>
             )) : (
                 <Text style={styles.noDataText}>Select a class first</Text>
             )}
          </ScrollView>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Text style={styles.btnText}>Fetch Students</Text>
          </TouchableOpacity>
      </View>

      {/* STUDENTS LIST */}
      {studentsData.length > 0 && (
          <View style={styles.listContainer}>
              <View style={styles.tableHeader}>
                  <Text style={[styles.th, {flex: 2}]}>Student Name</Text>
                  <Text style={[styles.th, {flex: 1, textAlign: 'center'}]}>Marks</Text>
              </View>
              
              {studentsData.map((stu, index) => (
                  <View key={index} style={styles.tableRow}>
                      <View style={{flex: 2}}>
                        <Text style={styles.stuName}>{stu.fullName}</Text>
                        <Text style={styles.stuId}>{stu.rollNumber || stu.studentId}</Text>
                      </View>
                      <View style={{flex: 1, alignItems: 'center'}}>
                          <TextInput 
                            style={styles.marksInput} 
                            placeholder="-" 
                            value={marksInput[stu.studentId]}
                            onChangeText={(t) => setMarksInput({...marksInput, [stu.studentId]: t})}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                      </View>
                  </View>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMarks}>
                  {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Save Marks</Text>}
              </TouchableOpacity>
          </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 20, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 10 },
  
  chipScroll: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  chipText: { color: '#4B5563', fontWeight: '500' },
  chipTextActive: { color: '#C2410C', fontWeight: 'bold' },

  searchBtn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  noDataText: { color: '#9CA3AF', fontStyle: 'italic', marginLeft: 5 },

  listContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 2 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 10, marginBottom: 10 },
  th: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  stuName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  stuId: { fontSize: 12, color: '#9CA3AF' },
  marksInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, width: 70, height: 45, textAlign: 'center', fontSize: 16, fontWeight: 'bold', backgroundColor: '#F9FAFB' },
  
  saveBtn: { backgroundColor: '#10B981', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
});