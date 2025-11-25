import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import {
  SubjectDTO,
  TeacherDTO,
  createTeacher,
  deleteTeacher,
  getAllSubjects,
  getAllTeachers,
  updateTeacher
} from '../../src/api/adminApi';
import { useAuth } from '../../src/context/AuthContext';

// Extending TeacherDTO locally to ensure subjectIds are recognized 
// (assuming the backend DTO includes subjectIds list)
interface ExtendedTeacherDTO extends TeacherDTO {
  subjectIds?: string[];
}

export default function TeachersScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const numColumns = isWeb ? 3 : 1;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data States
  const [teachers, setTeachers] = useState<ExtendedTeacherDTO[]>([]);
  const [subjectsList, setSubjectsList] = useState<SubjectDTO[]>([]);

  // Form & UI States
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  
  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    teacherName: '',
    email: '',
    phone: '',
    qualification: '',
    gender: 'Male',
    experience: '',
    address: ''
  });
  
  // Selected Subjects State
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const loadInitialData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // Fetch both Teachers and Subjects
      const [teachersData, subjectsData] = await Promise.all([
        getAllTeachers(),
        getAllSubjects()
      ]);
      setTeachers(teachersData);
      setSubjectsList(subjectsData);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (state.status === 'loading') return;
    if (!user || user.role !== 'ADMIN') {
        const timer = setTimeout(() => router.replace('/(app)'), 0);
        return () => clearTimeout(timer);
    }
    loadInitialData();
  }, [user, state.status]);

  const onRefresh = () => {
      setRefreshing(true);
      loadInitialData(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.teacherName || !formData.email || !formData.phone) {
      Alert.alert("Error", "Please fill mandatory fields (Name, Email, Phone)");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload including subjectIds
      const teacherData = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : 0,
        subjectIds: selectedSubjectIds // Adding the selected subjects logic
      };

      if (isEditMode && editingTeacherId) {
          // Update Logic
          await updateTeacher(editingTeacherId, teacherData);
          Alert.alert("Success", "Teacher Updated Successfully!");
      } else {
          // Create Logic
          await createTeacher(teacherData);
          Alert.alert("Success", "Teacher Added Successfully!");
      }
      
      setModalVisible(false);
      resetForm();
      loadInitialData();
    } catch (e: any) {
      Alert.alert("Error", isEditMode ? "Failed to update teacher." : "Failed to add teacher. Email might be duplicate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (teacher: ExtendedTeacherDTO) => {
      setIsEditMode(true);
      setEditingTeacherId(teacher.teacherId!);
      setFormData({
          teacherName: teacher.teacherName,
          email: teacher.email,
          phone: teacher.phone,
          qualification: teacher.qualification,
          gender: teacher.gender || 'Male',
          experience: teacher.experience ? teacher.experience.toString() : '',
          address: teacher.address
      });
      // Populate selected subjects from the teacher object
      setSelectedSubjectIds(teacher.subjectIds || []);
      setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm("Delete this teacher?")) await processDelete(id);
    } else {
      Alert.alert("Confirm", "Delete this teacher?", [
        { text: "Cancel" },
        { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
      ]);
    }
  };

  const processDelete = async (id: string) => {
    try {
      await deleteTeacher(id);
      loadInitialData();
    } catch (e) {
      Alert.alert("Error", "Failed to delete teacher");
    }
  };

  const resetForm = () => {
      setFormData({ teacherName: '', email: '', phone: '', qualification: '', gender: 'Male', experience: '', address: '' });
      setSelectedSubjectIds([]);
      setShowSubjectDropdown(false);
      setIsEditMode(false);
      setEditingTeacherId(null);
  };

  const toggleSubjectSelection = (id: string) => {
    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds(prev => prev.filter(sid => sid !== id));
    } else {
      setSelectedSubjectIds(prev => [...prev, id]);
    }
  };

  const renderItem = ({ item }: { item: ExtendedTeacherDTO }) => (
    <View style={[
        styles.itemContainer, 
        isWeb && { 
            width: `${100 / numColumns}%`, 
            paddingHorizontal: 10, 
            marginBottom: 20 
        }
    ]}>
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.teacherName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{flex: 1}}>
                    <Text style={styles.name}>{item.teacherName}</Text>
                    <Text style={styles.subText}>{item.qualification}</Text>
                </View>
            </View>
            
            <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={14} color="#6B7280" />
                <Text style={styles.infoText}>{item.phone}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={14} color="#6B7280" />
                <Text style={styles.infoText}>{item.email}</Text>
            </View>
            
            {/* Display Subject Count if any */}
            {item.subjectIds && item.subjectIds.length > 0 && (
               <View style={styles.infoRow}>
                  <Ionicons name="book-outline" size={14} color="#6B7280" />
                  <Text style={styles.infoText}>{item.subjectIds.length} Subjects Assigned</Text>
               </View>
            )}
            
            <View style={styles.cardFooter}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.experience} Yrs Exp</Text>
                </View>

                <View style={styles.actionIcons}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.teacherId!)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
        <Text style={styles.title}>Teacher Management</Text>
        <TouchableOpacity style={[styles.addBtn, !isWeb && styles.addBtnMobile]} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add Teacher</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>
      ) : (
        <FlatList
            data={teachers}
            keyExtractor={(item) => item.teacherId || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            key={numColumns}
            numColumns={numColumns}
            columnWrapperStyle={isWeb ? null : undefined}
            ListEmptyComponent={<Text style={styles.emptyText}>No teachers found.</Text>}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput style={styles.input} value={formData.teacherName} onChangeText={t => setFormData({...formData, teacherName: t})} placeholder="e.g. Rajesh Kumar" />

                <Text style={styles.label}>Email *</Text>
                <TextInput style={styles.input} value={formData.email} onChangeText={t => setFormData({...formData, email: t})} placeholder="email@example.com" autoCapitalize="none" />

                <Text style={styles.label}>Phone *</Text>
                <TextInput style={styles.input} value={formData.phone} onChangeText={t => setFormData({...formData, phone: t})} placeholder="9876543210" keyboardType="phone-pad" />

                <View style={{flexDirection: 'row', gap: 10}}>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Qualification</Text>
                        <TextInput style={styles.input} value={formData.qualification} onChangeText={t => setFormData({...formData, qualification: t})} placeholder="e.g. M.Sc, B.Ed" />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Experience (Yrs)</Text>
                        <TextInput style={styles.input} value={formData.experience} onChangeText={t => setFormData({...formData, experience: t})} placeholder="e.g. 5" keyboardType="numeric" />
                    </View>
                </View>

                <Text style={styles.label}>Gender</Text>
                <View style={styles.radioRow}>
                    {['Male', 'Female'].map(g => (
                        <TouchableOpacity key={g} style={[styles.radioBtn, formData.gender === g && styles.radioBtnActive]} onPress={() => setFormData({...formData, gender: g})}>
                            <Text style={[styles.radioText, formData.gender === g && styles.radioTextActive]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* SUBJECT MULTI-SELECT DROPDOWN */}
                <Text style={[styles.label, { marginTop: 12 }]}>Assign Subjects ({selectedSubjectIds.length})</Text>
                <TouchableOpacity 
                    style={styles.dropdownBtn} 
                    onPress={() => setShowSubjectDropdown(!showSubjectDropdown)}
                >
                    <Text style={styles.dropdownText}>
                        {selectedSubjectIds.length > 0 ? `${selectedSubjectIds.length} Selected` : "Select Subjects"}
                    </Text>
                    <Ionicons name={showSubjectDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                </TouchableOpacity>

                {showSubjectDropdown && (
                    <View style={styles.dropdownList}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                            {subjectsList.length > 0 ? subjectsList.map(s => (
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
                            )) : (
                                <Text style={styles.emptyText}>No subjects available. Add subjects first.</Text>
                            )}
                        </ScrollView>
                    </View>
                )}

                <Text style={styles.label}>Address</Text>
                <TextInput style={[styles.input, {height: 60}]} multiline value={formData.address} onChangeText={t => setFormData({...formData, address: t})} placeholder="Enter address" />

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateOrUpdate} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitBtnText}>{isEditMode ? 'Update Teacher' : 'Save Teacher'}</Text>}
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
  
  itemContainer: { width: '100%', marginBottom: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#2563EB', fontWeight: 'bold', fontSize: 16 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  subText: { fontSize: 12, color: '#6B7280' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { marginLeft: 8, fontSize: 13, color: '#4B5563' },
  
  // Footer Styling
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  badge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  
  actionIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 4 },
  
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' },
  radioRow: { flexDirection: 'row', gap: 10 },
  radioBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  radioBtnActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  radioText: { color: '#4B5563' },
  radioTextActive: { color: '#F97316', fontWeight: 'bold' },
  
  // Dropdown Styles
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