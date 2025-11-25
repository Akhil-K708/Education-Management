import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { getClassStudents, getTeacherClasses } from '../../api/attendanceApi';
import { getAllExams } from '../../api/examApi';
import { enterMarks, getSubjectMappings } from '../../api/resultsApi';
import { useAuth } from '../../context/AuthContext';
import { MarksEntryItem } from '../../types/results';

export default function TeacherResultView() {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(false);
  
  // Dropdown Data
  const [examsList, setExamsList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  // Selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  // Max Marks (Defaults)
  const [paperTotal, setPaperTotal] = useState('80');
  const [assignTotal, setAssignTotal] = useState('20');

  // Student Data & Inputs
  const [studentsData, setStudentsData] = useState<any[]>([]);
  // Stores: { studentId: { paper: string, assign: string } }
  const [marksInput, setMarksInput] = useState<Record<string, { paper: string, assign: string }>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (!user?.username) return;
    setLoading(true);
    try {
      const [exams, classes] = await Promise.all([
        getAllExams(),
        getTeacherClasses(user.username)
      ]);
      // Sort exams latest first
      setExamsList(exams.reverse());
      setClassesList(classes);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId(''); 
    setStudentsData([]); 
    
    if (!user?.username) return;

    try {
        setLoading(true);
        // 1. Fetch All Mappings for this Class
        const mappings = await getSubjectMappings(classId);
        
        // 2. FILTER: Only show subjects assigned to THIS Teacher
        const mySubjects = mappings
            .filter((m: any) => m.teacherId === user.username)
            .map((m: any) => ({
                id: m.subjectId,
                name: m.subjectName
            }));

        setSubjectsList(mySubjects);
    } catch(e) { 
        console.error(e);
        Alert.alert("Error", "Failed to load subjects.");
    }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
      if(!selectedExamId || !selectedClassId || !selectedSubjectId) {
          Alert.alert("Info", "Please select Exam, Class and Subject.");
          return;
      }

      setLoading(true);
      try {
          const students = await getClassStudents(selectedClassId);
          // Sort by roll number or name
          students.sort((a: any, b: any) => (a.rollNumber || '').localeCompare(b.rollNumber || ''));
          setStudentsData(students);
          
          // Initialize inputs
          const initial: any = {};
          students.forEach((s: any) => {
              initial[s.studentId] = { paper: '', assign: '' };
          });
          setMarksInput(initial);

      } catch(e) {
          Alert.alert("Error", "Failed to fetch students.");
      } finally {
          setLoading(false);
      }
  };

  const updateMark = (studentId: string, field: 'paper' | 'assign', value: string) => {
      setMarksInput(prev => ({
          ...prev,
          [studentId]: {
              ...prev[studentId],
              [field]: value
          }
      }));
  };

  const handleSaveMarks = async () => {
      if (!paperTotal || !assignTotal) {
          Alert.alert("Error", "Please set Max Marks for Paper and Assignment.");
          return;
      }

      setLoading(true);
      try {
          const entries: MarksEntryItem[] = studentsData.map(s => {
             const input = marksInput[s.studentId];
             const pObt = input?.paper ? parseFloat(input.paper) : 0;
             const aObt = input?.assign ? parseFloat(input.assign) : 0;
             
             // Logic: If marks entered -> PRESENT, else ABSENT
             // Or you can implement explicit Absent checkbox later
             const isPresent = input?.paper !== '' || input?.assign !== '';

             return {
                 studentId: s.studentId,
                 paperObtained: pObt,
                 paperTotal: parseFloat(paperTotal),
                 assignmentObtained: aObt,
                 assignmentTotal: parseFloat(assignTotal),
                 attendanceStatus: isPresent ? 'PRESENT' : 'ABSENT',
                 remarks: isPresent ? '' : 'Absent'
             };
          });

          const payload = {
              examId: selectedExamId,
              classSectionId: selectedClassId,
              subjectId: selectedSubjectId,
              entries: entries
          };

          await enterMarks(selectedSubjectId, payload);

          Alert.alert("Success", "Marks saved successfully!");
          // Optional: Clear Data or Navigate back
      } catch(e) {
          Alert.alert("Error", "Failed to save marks.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 60}}>
      <Text style={styles.pageTitle}>Enter Exam Marks</Text>

      {/* --- FILTERS CARD --- */}
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
          <Text style={styles.label}>Select Subject (Assigned to You)</Text>
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
                 <Text style={styles.noDataText}>{selectedClassId ? "No subjects assigned to you in this class." : "Select a class first"}</Text>
             )}
          </ScrollView>

          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              {loading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Fetch Students</Text>}
          </TouchableOpacity>
      </View>

      {/* --- STUDENTS LIST --- */}
      {studentsData.length > 0 && (
          <View style={styles.listContainer}>
              
              {/* Max Marks Configuration */}
              <View style={styles.maxMarksRow}>
                  <View style={{flex: 1}}>
                      <Text style={styles.maxLabel}>Paper Max Marks</Text>
                      <TextInput 
                          style={styles.maxInput} 
                          value={paperTotal} 
                          onChangeText={setPaperTotal} 
                          keyboardType="numeric"
                      />
                  </View>
                  <View style={{flex: 1}}>
                      <Text style={styles.maxLabel}>Assign. Max Marks</Text>
                      <TextInput 
                          style={styles.maxInput} 
                          value={assignTotal} 
                          onChangeText={setAssignTotal} 
                          keyboardType="numeric"
                      />
                  </View>
              </View>

              <View style={styles.divider}/>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                  <Text style={[styles.th, {flex: 2}]}>Student Name</Text>
                  <Text style={[styles.th, {width: 70, textAlign: 'center'}]}>Paper</Text>
                  <Text style={[styles.th, {width: 70, textAlign: 'center'}]}>Assign.</Text>
                  <Text style={[styles.th, {width: 60, textAlign: 'center'}]}>Total</Text>
              </View>
              
              {/* Student Rows */}
              {studentsData.map((stu, index) => {
                  const input = marksInput[stu.studentId] || { paper: '', assign: '' };
                  const pVal = parseFloat(input.paper) || 0;
                  const aVal = parseFloat(input.assign) || 0;
                  const total = pVal + aVal;

                  return (
                    <View key={index} style={styles.tableRow}>
                        <View style={{flex: 2}}>
                            <Text style={styles.stuName}>{stu.fullName}</Text>
                            <Text style={styles.stuId}>Roll: {stu.rollNumber || '-'}</Text>
                        </View>
                        
                        {/* Paper Marks Input */}
                        <View style={{width: 70, alignItems: 'center'}}>
                            <TextInput 
                                style={styles.marksInput} 
                                placeholder="0" 
                                value={input.paper}
                                onChangeText={(t) => updateMark(stu.studentId, 'paper', t)}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>

                        {/* Assignment Marks Input */}
                        <View style={{width: 70, alignItems: 'center'}}>
                            <TextInput 
                                style={styles.marksInput} 
                                placeholder="0" 
                                value={input.assign}
                                onChangeText={(t) => updateMark(stu.studentId, 'assign', t)}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>

                        {/* Total Display */}
                        <View style={{width: 60, alignItems: 'center'}}>
                            <Text style={styles.totalText}>{total}</Text>
                        </View>
                    </View>
                  );
              })}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMarks}>
                  <Text style={styles.btnText}>Save Marks</Text>
              </TouchableOpacity>
          </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 10 },
  
  chipScroll: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  chipText: { color: '#4B5563', fontWeight: '500', fontSize: 13 },
  chipTextActive: { color: '#C2410C', fontWeight: 'bold' },

  searchBtn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  noDataText: { color: '#EF4444', fontStyle: 'italic', marginLeft: 5, fontSize: 13 },

  listContainer: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, elevation: 2 },
  
  maxMarksRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  maxLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  maxInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 8, backgroundColor: '#F9FAFB', fontWeight: 'bold', color: '#1F2937' },

  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8, marginBottom: 8 },
  th: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
  
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  stuName: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  stuId: { fontSize: 12, color: '#9CA3AF' },
  
  marksInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, width: 50, height: 40, textAlign: 'center', fontSize: 15, fontWeight: 'bold', backgroundColor: '#F9FAFB' },
  totalText: { fontSize: 15, fontWeight: 'bold', color: '#059669' },

  saveBtn: { backgroundColor: '#10B981', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
});