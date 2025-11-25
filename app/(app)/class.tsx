import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import {
  assignStudentToClass,
  assignSubjectTeacher,
  ClassSectionDTO,
  ClassSubjectMappingDTO,
  createClassSection,
  deleteClassSection,
  getAllClassSections,
  getAllSubjects,
  getAllTeachers,
  getSubjectMappings,
  getUnassignedStudents,
  StudentDTO,
  SubjectDTO,
  TeacherDTO,
  updateClassSection
} from '../../src/api/adminApi';
import { useAuth } from '../../src/context/AuthContext';

export default function ClassScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const numColumns = isWeb ? 3 : 1;

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSectionDTO[]>([]);
  const [teachersList, setTeachersList] = useState<TeacherDTO[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectDTO[]>([]);

  // --- MANAGEMENT MODAL STATES ---
  const [manageModalVisible, setManageModalVisible] = useState(false);
  const [activeClass, setActiveClass] = useState<ClassSectionDTO | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'SUBJECTS' | 'STUDENTS'>('DETAILS');
  
  // Details Form
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [capacity, setCapacity] = useState('40');
  const [classTeacherId, setClassTeacherId] = useState('');

  // Subject Mapping State
  const [mappings, setMappings] = useState<ClassSubjectMappingDTO[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);

  // Student Assignment State
  const [unassignedStudents, setUnassignedStudents] = useState<StudentDTO[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [cls, tch, sub] = await Promise.all([
          getAllClassSections(),
          getAllTeachers(),
          getAllSubjects()
      ]);
      // Sort classes: 1, 2, ... 10
      const sortedClasses = cls.sort((a, b) => a.className.localeCompare(b.className, undefined, {numeric: true}));
      setClasses(sortedClasses);
      setTeachersList(tch);
      setSubjectsList(sub);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state.status === 'loading') return;
    if (!user || user.role !== 'ADMIN') {
        const timer = setTimeout(() => router.replace('/(app)'), 0);
        return () => clearTimeout(timer);
    }
    fetchAllData();
  }, [user, state.status]);

  // --- OPEN MODAL HANDLERS ---
  
  const openCreateModal = () => {
      setActiveClass(null);
      setClassName(''); setSection(''); setCapacity('40'); setClassTeacherId('');
      setActiveTab('DETAILS');
      setManageModalVisible(true);
  };

  const openManageModal = (cls: ClassSectionDTO) => {
      setActiveClass(cls);
      setClassName(cls.className);
      setSection(cls.section);
      setAcademicYear(cls.academicYear);
      setCapacity(cls.capacity?.toString() || '40');
      setClassTeacherId(cls.classTeacherId || '');
      
      // If opening existing class, default to SUBJECTS view for quick access
      setActiveTab('SUBJECTS'); 
      setManageModalVisible(true);
      
      // Fetch related data immediately
      fetchMappings(cls.classSectionId!);
      fetchUnassignedStudents(cls.className);
  };

  const fetchMappings = async (classId: string) => {
      setMappingLoading(true);
      try {
          const data = await getSubjectMappings(classId);
          setMappings(data);
      } catch(e) { console.error(e); }
      finally { setMappingLoading(false); }
  };

  const fetchUnassignedStudents = async (grade: string) => {
      setStudentLoading(true);
      try {
          const students = await getUnassignedStudents(grade);
          setUnassignedStudents(students);
      } catch(e) { console.error(e); }
      finally { setStudentLoading(false); }
  };

  // --- ACTIONS ---

  const handleSaveDetails = async () => {
      if(!className || !section) { Alert.alert("Error", "Class Name & Section required"); return; }
      setIsSubmitting(true);
      try {
          const payload = { className, section, academicYear, capacity: parseInt(capacity), classTeacherId };
          if(activeClass?.classSectionId) {
              await updateClassSection(activeClass.classSectionId, payload);
              Alert.alert("Success", "Class Updated");
          } else {
              const newClass = await createClassSection(payload);
              setActiveClass(newClass);
              // Move to next step after create
              Alert.alert("Success", "Class Created! Now assign subjects.");
              setActiveTab('SUBJECTS');
          }
          fetchAllData();
      } catch(e) { Alert.alert("Error", "Operation Failed"); }
      finally { setIsSubmitting(false); }
  };

  const handleAssignTeacherToSubject = async (subjectId: string, teacherId: string) => {
      if(!activeClass?.classSectionId) return;
      try {
          await assignSubjectTeacher({
              classSectionId: activeClass.classSectionId,
              subjectId,
              teacherId
          });
          // Refresh mappings
          fetchMappings(activeClass.classSectionId);
      } catch(e) { Alert.alert("Error", "Failed to assign teacher"); }
  };

  const handleAddStudent = async (studentId: string) => {
      if(!activeClass?.classSectionId) return;
      try {
          await assignStudentToClass(activeClass.classSectionId, studentId);
          // Refresh students list
          fetchUnassignedStudents(className);
          fetchAllData(); // Update counts on main screen
      } catch(e) { Alert.alert("Error", "Failed to add student"); }
  };

  const handleDeleteClass = async (id: string) => {
      if (Platform.OS === 'web') {
        if (confirm("Delete this class?")) await processDelete(id);
      } else {
        Alert.alert("Confirm", "Delete this class?", [
          { text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
        ]);
      }
  };

  const processDelete = async (id: string) => {
    try { await deleteClassSection(id); fetchAllData(); } catch (e) { Alert.alert("Error", "Failed to delete"); }
  };

  // --- RENDERERS ---

  const getTeacherName = (id: string) => teachersList.find(t => t.teacherId === id)?.teacherName || 'Select Teacher';

  const renderDetailsTab = () => (
      <ScrollView>
          <Text style={styles.label}>Class (Grade)</Text>
          <TextInput style={styles.input} value={className} onChangeText={setClassName} placeholder="e.g. 4" />
          
          <Text style={styles.label}>Section</Text>
          <TextInput style={styles.input} value={section} onChangeText={setSection} placeholder="e.g. A" />
          
          <Text style={styles.label}>Academic Year</Text>
          <TextInput style={styles.input} value={academicYear} onChangeText={setAcademicYear} />
          
          <Text style={styles.label}>Capacity</Text>
          <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
          
          <Text style={styles.label}>Class Teacher</Text>
          <View style={styles.pickerContainer}>
              <ScrollView nestedScrollEnabled style={{maxHeight: 150}}>
                  {teachersList.map(t => (
                      <TouchableOpacity key={t.teacherId} style={[styles.pickerItem, classTeacherId === t.teacherId && styles.pickerItemSelected]} onPress={() => setClassTeacherId(t.teacherId!)}>
                          <Text style={classTeacherId === t.teacherId ? styles.pickerTextSelected : styles.pickerText}>{t.teacherName}</Text>
                          {classTeacherId === t.teacherId && <Ionicons name="checkmark" size={16} color="#2563EB"/>}
                      </TouchableOpacity>
                  ))}
              </ScrollView>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDetails} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF"/> : <Text style={styles.saveBtnText}>{activeClass ? "Update Details" : "Create Class"}</Text>}
          </TouchableOpacity>
      </ScrollView>
  );

  const renderSubjectsTab = () => (
      <View style={{flex: 1}}>
          <Text style={styles.helperText}>Assign teachers to subjects for Class {className}-{section}</Text>
          
          <ScrollView style={{flex: 1}} nestedScrollEnabled>
              {subjectsList.map(sub => {
                  const currentMapping = mappings.find(m => m.subjectId === sub.subjectId);
                  const currentTeacherId = currentMapping?.teacherId || '';

                  // 🔥 FILTER LOGIC: Only show teachers who have this subject in their profile
                  const qualifiedTeachers = teachersList.filter(t => 
                      t.subjectIds && t.subjectIds.includes(sub.subjectId!)
                  );

                  return (
                      <View key={sub.subjectId} style={styles.subjectRow}>
                          <View style={{flex: 1, justifyContent: 'center'}}>
                              <Text style={styles.subjectName}>{sub.subjectName}</Text>
                              <Text style={styles.subjectCode}>{sub.subjectCode}</Text>
                          </View>
                          
                          <View style={{flex: 2}}>
                              {qualifiedTeachers.length > 0 ? (
                                  isWeb ? (
                                      // WEB LOGIC: Wrap chips (Grid Style) - No Scroll needed
                                      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                                          {qualifiedTeachers.map(t => (
                                              <TouchableOpacity 
                                                  key={t.teacherId}
                                                  // FIX: Added explicit marginBottom for Web
                                                  style={[
                                                      styles.miniChip, 
                                                      currentTeacherId === t.teacherId && styles.miniChipActive,
                                                      { marginBottom: 6 } 
                                                  ]}
                                                  onPress={() => handleAssignTeacherToSubject(sub.subjectId!, t.teacherId!)}
                                              >
                                                  <Text style={[styles.miniChipText, currentTeacherId === t.teacherId && {color:'#FFF'}]}>
                                                      {t.teacherName}
                                                  </Text>
                                              </TouchableOpacity>
                                          ))}
                                      </View>
                                  ) : (
                                      // MOBILE LOGIC: Horizontal Scroll (Swipe Style)
                                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexDirection: 'row'}}>
                                          {qualifiedTeachers.map(t => (
                                              <TouchableOpacity 
                                                  key={t.teacherId}
                                                  style={[styles.miniChip, currentTeacherId === t.teacherId && styles.miniChipActive]}
                                                  onPress={() => handleAssignTeacherToSubject(sub.subjectId!, t.teacherId!)}
                                              >
                                                  <Text style={[styles.miniChipText, currentTeacherId === t.teacherId && {color:'#FFF'}]}>
                                                      {t.teacherName}
                                                  </Text>
                                              </TouchableOpacity>
                                          ))}
                                      </ScrollView>
                                  )
                              ) : (
                                  <Text style={{color: '#EF4444', fontSize: 12, fontStyle: 'italic'}}>
                                      No qualified teachers found for {sub.subjectName}
                                  </Text>
                              )}
                          </View>
                      </View>
                  )
              })}
          </ScrollView>
      </View>
  );

  const renderStudentsTab = () => (
      <View style={{flex: 1}}>
          <Text style={styles.helperText}>Students who applied for Grade "{className}" but have no section.</Text>
          {studentLoading ? <ActivityIndicator color="#F97316"/> : (
              unassignedStudents.length === 0 ? (
                  <Text style={styles.emptyText}>No pending students for Grade {className}</Text>
              ) : (
                  <FlatList
                      data={unassignedStudents}
                      keyExtractor={s => s.studentId}
                      renderItem={({item}) => (
                          <View style={styles.studentRow}>
                              <View>
                                  <Text style={styles.studentName}>{item.fullName}</Text>
                                  <Text style={styles.studentId}>{item.studentId}</Text>
                              </View>
                              <TouchableOpacity style={styles.addStudentBtn} onPress={() => handleAddStudent(item.studentId)}>
                                  <Ionicons name="add" size={18} color="#FFF" />
                                  <Text style={styles.addStudentText}>Add</Text>
                              </TouchableOpacity>
                          </View>
                      )}
                  />
              )
          )}
      </View>
  );

  const renderClassCard = ({ item }: { item: ClassSectionDTO }) => (
    <View style={[styles.cardContainer, isWeb && { width: `${100 / numColumns}%` }]}>
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                    <Text style={styles.gradeText}>{item.className}</Text>
                </View>
                <View style={{flex: 1, marginLeft: 12}}>
                    <Text style={styles.cardTitle}>Class {item.className} - {item.section}</Text>
                    <Text style={styles.cardSub}>CT: {item.classTeacherName || 'None'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteClass(item.classSectionId!)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.cardStat}>
                <Ionicons name="people" size={16} color="#6B7280" />
                <Text style={styles.statText}>{item.currentStrength || 0} / {item.capacity} Students</Text>
            </View>

            <TouchableOpacity style={styles.manageBtn} onPress={() => openManageModal(item)}>
                <Text style={styles.manageBtnText}>Manage Class</Text>
                <Ionicons name="settings-outline" size={16} color="#FFF" />
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
        <View style={styles.headerRow}>
            <Text style={styles.pageTitle}>Classes</Text>
            <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.createBtnText}>Create Class</Text>
            </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#F97316" /> : (
            <FlatList
                data={classes}
                keyExtractor={item => item.classSectionId!}
                renderItem={renderClassCard}
                numColumns={numColumns}
                key={numColumns}
                contentContainerStyle={{paddingBottom: 40}}
            />
        )}

        {/* --- MANAGEMENT MODAL --- */}
        <Modal visible={manageModalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, isWeb && {width: '70%', maxWidth: 800, height: '80%'}]}>
                    
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {activeClass ? `Manage Class ${activeClass.className}-${activeClass.section}` : 'New Class'}
                        </Text>
                        <TouchableOpacity onPress={() => setManageModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* TABS */}
                    <View style={styles.tabs}>
                        <TouchableOpacity style={[styles.tab, activeTab === 'DETAILS' && styles.tabActive]} onPress={() => setActiveTab('DETAILS')}>
                            <Text style={[styles.tabText, activeTab === 'DETAILS' && styles.tabTextActive]}>Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={!activeClass} style={[styles.tab, activeTab === 'SUBJECTS' && styles.tabActive, !activeClass && {opacity: 0.5}]} onPress={() => setActiveTab('SUBJECTS')}>
                            <Text style={[styles.tabText, activeTab === 'SUBJECTS' && styles.tabTextActive]}>Subjects & Teachers</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={!activeClass} style={[styles.tab, activeTab === 'STUDENTS' && styles.tabActive, !activeClass && {opacity: 0.5}]} onPress={() => {setActiveTab('STUDENTS'); fetchUnassignedStudents(className)}}>
                            <Text style={[styles.tabText, activeTab === 'STUDENTS' && styles.tabTextActive]}>Add Students</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabContent}>
                        {activeTab === 'DETAILS' && renderDetailsTab()}
                        {activeTab === 'SUBJECTS' && renderSubjectsTab()}
                        {activeTab === 'STUDENTS' && renderStudentsTab()}
                    </View>

                </View>
            </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  createBtn: { backgroundColor: '#F97316', flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },

  // Card
  cardContainer: { padding: 8, marginBottom: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  cardSub: { fontSize: 12, color: '#6B7280' },
  cardStat: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6 },
  statText: { marginLeft: 6, fontSize: 13, color: '#4B5563', fontWeight: '500' },
  manageBtn: { backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderRadius: 6 },
  manageBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, marginRight: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  
  // Tabs
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#F97316' },
  tabText: { color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#F97316', fontWeight: 'bold' },
  tabContent: { flex: 1 },

  // Forms
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' },
  pickerContainer: { maxHeight: 150, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginTop: 4 },
  pickerItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between' },
  pickerItemSelected: { backgroundColor: '#EFF6FF' },
  pickerText: { color: '#374151' },
  pickerTextSelected: { color: '#2563EB', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },

  // Subjects
  helperText: { fontSize: 13, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  subjectName: { fontWeight: 'bold', color: '#1F2937', fontSize: 15 },
  subjectCode: { fontSize: 12, color: '#9CA3AF' },
  
  miniChip: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12, 
    backgroundColor: '#F3F4F6', 
    marginRight: 6, 
    borderWidth: 1, 
    borderColor: '#E5E7EB'
    // Fixed: Removed isWeb dependency from here to avoid crash
  },
  miniChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  miniChipText: { fontSize: 12, color: '#4B5563' },

  // Students
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', marginBottom: 8, borderRadius: 8 },
  studentName: { fontWeight: 'bold', color: '#1F2937' },
  studentId: { fontSize: 12, color: '#6B7280' },
  addStudentBtn: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addStudentText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#9CA3AF' }
});