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
  View,
  useWindowDimensions
} from 'react-native';
import {
  ClassSectionDTO,
  SubjectDTO,
  TeacherDTO,
  createClassSection,
  deleteClassSection,
  getAllClassSections,
  getAllSubjects,
  getAllTeachers,
  updateClassSection
} from '../../src/api/adminApi';
import { studentApi } from '../../src/api/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';

// --- SORTING HELPER ---
const getClassSortRank = (name: string) => {
  const n = name.toLowerCase().trim();
  
  // 1. Pre-Primary Priority
  if (n.includes('nurs')) return 0; // Nursery
  if (n === 'lkg' || n === 'pp1') return 1;
  if (n === 'ukg' || n === 'pp2') return 2;
  
  // 2. Numeric Classes (1 to 12)
  // Check if it starts with a number (e.g., "1", "10")
  const num = parseInt(n);
  if (!isNaN(num)) {
      return 10 + num; // Offset by 10 to keep after pre-primary
  }

  // 3. Departments / Others (CSE, ECE etc.) -> High Rank to put at bottom or sort alphabetically among themselves
  return 1000; 
};

export default function ClassScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  
  const { width } = useWindowDimensions();
  const CONTAINER_PADDING = 20;
  const GAP = 16; 

  const numColumns = width > 1200 ? 4 : (width > 768 ? 3 : 1);
  const isWeb = width > 768;

  const availableWidth = width - (CONTAINER_PADDING * 2);
  const cardWidth = (availableWidth - ((numColumns - 1) * GAP)) / numColumns;

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSectionDTO[]>([]);
  
  const [teachersList, setTeachersList] = useState<TeacherDTO[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectDTO[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [capacity, setCapacity] = useState('40');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  
  // UI Toggles
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [cls, tch, sub] = await Promise.all([
          getAllClassSections(),
          getAllTeachers(),
          getAllSubjects()
      ]);

      // --- SORTING LOGIC APPLIED HERE ---
      const sortedClasses = cls.sort((a, b) => {
          const rankA = getClassSortRank(a.className);
          const rankB = getClassSortRank(b.className);

          // If ranks are different, sort by rank
          if (rankA !== rankB) {
              // If both are departments (Rank 1000), sort alphabetically (CSE < ECE)
              if (rankA === 1000 && rankB === 1000) {
                  return a.className.localeCompare(b.className);
              }
              return rankA - rankB;
          }

          // If Class Name is same (e.g., both "1"), sort by Section (A < B)
          return (a.section || '').localeCompare(b.section || '');
      });

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
        const timer = setTimeout(() => {
            router.replace('/(app)');
        }, 0);
        return () => clearTimeout(timer);
    }
    fetchAllData();
  }, [user, state.status]);

  const handleCreateOrUpdate = async () => {
    if (!className || !section || !academicYear) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const classData = {
        className,
        section,
        academicYear,
        capacity: parseInt(capacity),
        classTeacherId: selectedTeacherId || undefined,
        subjectIds: selectedSubjectIds 
      };

      if (isEditMode && editingClassId) {
          // --- UPDATE MODE ---
          await updateClassSection(editingClassId, classData);
          
          if (selectedSubjectIds.length > 0) {
             try {
                await studentApi.put('/subject/assign', {
                    classSectionId: editingClassId,
                    subjectIds: selectedSubjectIds,
                    teacherId: null 
                });
             } catch (err) { console.log("Subject update error (optional)", err); }
          }

          Alert.alert("Success", "Class Updated Successfully!");
      } else {
          // --- CREATE MODE ---
          const newClass = await createClassSection(classData);

          if (selectedSubjectIds.length > 0 && newClass.classSectionId) {
              try {
                await studentApi.post('/subject/assign', {
                    classSectionId: newClass.classSectionId,
                    subjectIds: selectedSubjectIds,
                    teacherId: null 
                });
              } catch (err) {
                 console.log("Subject assignment skipped or handled by backend");
              }
          }
          Alert.alert("Success", "Class Created Successfully!");
      }

      setModalVisible(false);
      resetForm();
      fetchAllData(); 
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || (isEditMode ? "Failed to update class" : "Failed to create class"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: ClassSectionDTO) => {
      setIsEditMode(true);
      setEditingClassId(item.classSectionId!);
      
      setClassName(item.className);
      setSection(item.section);
      setAcademicYear(item.academicYear);
      setCapacity(item.capacity ? item.capacity.toString() : '40');
      setSelectedTeacherId(item.classTeacherId || '');
      setSelectedSubjectIds(item.subjectIds || []);
      
      setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to delete this class?")) {
        await processDelete(id);
      }
    } else {
      Alert.alert("Confirm", "Delete this class?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
      ]);
    }
  };

  const processDelete = async (id: string) => {
    try {
      await deleteClassSection(id);
      fetchAllData();
    } catch (e) {
      Alert.alert("Error", "Failed to delete class");
    }
  };

  const resetForm = () => {
    setClassName('');
    setSection('');
    setCapacity('40');
    setSelectedTeacherId('');
    setSelectedSubjectIds([]);
    setShowTeacherDropdown(false);
    setShowSubjectDropdown(false);
    setIsEditMode(false);
    setEditingClassId(null);
  };

  const toggleSubjectSelection = (id: string) => {
      if (selectedSubjectIds.includes(id)) {
          setSelectedSubjectIds(prev => prev.filter(sid => sid !== id));
      } else {
          setSelectedSubjectIds(prev => [...prev, id]);
      }
  };

  const getTeacherName = (id: string) => {
      const t = teachersList.find(t => t.teacherId === id);
      return t ? t.teacherName : 'Select Teacher';
  };

  if (state.status === 'loading' || loading && classes.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  const renderItem = ({ item }: { item: ClassSectionDTO }) => (
    <View style={[
        styles.itemContainer, 
        isWeb && { 
            width: `${100 / numColumns}%`, 
            paddingHorizontal: 10, 
            marginBottom: 20 
        }
    ]}>
        <View style={styles.card}>
            {/* Header Row: Icon + Name + Actions */}
            <View style={styles.cardHeader}>
                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <View style={styles.cardIcon}>
                        <Ionicons name="easel-outline" size={24} color="#FFF" />
                    </View>
                    <View>
                        <Text style={styles.className}>{item.className} - {item.section}</Text>
                        <Text style={styles.classDetails}>Year: {item.academicYear}</Text>
                    </View>
                </View>

                {/* Actions (Edit & Delete) at Top Right */}
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.classSectionId!)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardContent}>
                <Text style={styles.classDetails}>
                Strength: {item.currentStrength || 0} / {item.capacity}
                </Text>
                <Text style={[styles.teacherText, item.classTeacherName ? {color:'#059669'} : {color:'#EF4444'}]}>
                Teacher: {item.classTeacherName || 'Not Assigned'}
                </Text>
            </View>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
        <Text style={styles.title}>Class Management</Text>
        <TouchableOpacity style={[styles.addBtn, !isWeb && styles.addBtnMobile]} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add Class</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.classSectionId || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        key={numColumns}
        numColumns={numColumns}
        columnWrapperStyle={isWeb ? null : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No classes found. Create one!</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? "Edit Class" : "Create New Class"}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Class Name (Grade)</Text>
                <TextInput 
                style={styles.input} 
                placeholder="e.g. 10" 
                value={className}
                onChangeText={setClassName}
                />

                <Text style={styles.label}>Section</Text>
                <TextInput 
                style={styles.input} 
                placeholder="e.g. A" 
                value={section}
                onChangeText={setSection}
                />

                <Text style={styles.label}>Academic Year</Text>
                <TextInput 
                style={styles.input} 
                placeholder="e.g. 2025-2026" 
                value={academicYear}
                onChangeText={setAcademicYear}
                />

                <Text style={styles.label}>Capacity</Text>
                <TextInput 
                style={styles.input} 
                placeholder="e.g. 40" 
                keyboardType="numeric"
                value={capacity}
                onChangeText={setCapacity}
                />

                {/* TEACHER DROPDOWN */}
                <Text style={styles.label}>Assign Class Teacher</Text>
                <TouchableOpacity 
                    style={styles.dropdownBtn} 
                    onPress={() => {
                        setShowTeacherDropdown(!showTeacherDropdown);
                        setShowSubjectDropdown(false);
                    }}
                >
                    <Text style={styles.dropdownText}>{selectedTeacherId ? getTeacherName(selectedTeacherId) : "Select Teacher"}</Text>
                    <Ionicons name={showTeacherDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                </TouchableOpacity>
                
                {showTeacherDropdown && (
                    <View style={styles.dropdownList}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                            {teachersList.map(t => (
                                <TouchableOpacity 
                                    key={t.teacherId} 
                                    style={[styles.dropdownItem, selectedTeacherId === t.teacherId && styles.dropdownItemSelected]}
                                    onPress={() => {
                                        setSelectedTeacherId(t.teacherId || ''); 
                                        setShowTeacherDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownItemText}>{t.teacherName}</Text>
                                    {selectedTeacherId === t.teacherId && <Ionicons name="checkmark" size={16} color="#F97316" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* SUBJECT DROPDOWN (MULTI) */}
                <Text style={[styles.label, {marginTop: 12}]}>Assign Subjects ({selectedSubjectIds.length})</Text>
                <TouchableOpacity 
                    style={styles.dropdownBtn} 
                    onPress={() => {
                        setShowSubjectDropdown(!showSubjectDropdown);
                        setShowTeacherDropdown(false);
                    }}
                >
                    <Text style={styles.dropdownText}>{selectedSubjectIds.length > 0 ? `${selectedSubjectIds.length} Selected` : "Select Subjects"}</Text>
                    <Ionicons name={showSubjectDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                </TouchableOpacity>

                {showSubjectDropdown && (
                    <View style={styles.dropdownList}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                            {subjectsList.map(s => (
                                <TouchableOpacity 
                                    key={s.subjectId} 
                                    style={[styles.dropdownItem, selectedSubjectIds.includes(s.subjectId!) && styles.dropdownItemSelected]}
                                    onPress={() => toggleSubjectSelection(s.subjectId!)}
                                >
                                    <Text style={styles.dropdownItemText}>{s.subjectName}</Text>
                                    {selectedSubjectIds.includes(s.subjectId!) ? (
                                        <Ionicons name="checkbox" size={20} color="#F97316" />
                                    ) : (
                                        <Ionicons name="square-outline" size={20} color="#D1D5DB" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleCreateOrUpdate}
                disabled={isSubmitting}
                >
                {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.submitBtnText}>{isEditMode ? "Update Class" : "Create Class"}</Text>
                )}
                </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerRowMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 15 },
  
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  addBtn: { flexDirection: 'row', backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  addBtnMobile: { alignSelf: 'flex-start' },
  addBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },
  
  // --- GRID SYSTEM STYLES ---
  itemContainer: {
    width: '100%', 
    marginBottom: 16,
  },
  
  card: { 
    flex: 1,
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 16, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  
  cardContent: { marginTop: 10 },
  
  className: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  classDetails: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  teacherText: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  
  actionRow: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 4 },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 450, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#F9FAFB' },
  
  dropdownBtn: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#FFF'
  },
  dropdownText: { fontSize: 14, color: '#374151' },
  dropdownList: { 
      borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: 4, backgroundColor: '#FFF',
      maxHeight: 150 
  },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemSelected: { backgroundColor: '#FFF7ED' },
  dropdownItemText: { fontSize: 14, color: '#374151' },

  submitBtn: { backgroundColor: '#F97316', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});