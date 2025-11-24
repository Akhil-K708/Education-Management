import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { createSubject, deleteSubject, getAllSubjects, SubjectDTO, updateSubject } from '../../src/api/adminApi';
import { useAuth } from '../../src/context/AuthContext';

export default function SubjectsScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  
  // Responsive Logic
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const numColumns = isWeb ? 3 : 1;

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await getAllSubjects();
      setSubjects(data);
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
    fetchSubjects();
  }, [user, state.status]);

  const handleCreateOrUpdate = async () => {
    if (!subjectName || !subjectCode) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && editingSubjectId) {
          await updateSubject(editingSubjectId, {
              subjectName,
              subjectCode,
              active: true
          });
          Alert.alert("Success", "Subject Updated Successfully!");
      } else {
          await createSubject({
            subjectName,
            subjectCode,
            active: true
          });
          Alert.alert("Success", "Subject Created Successfully!");
      }
      
      setModalVisible(false);
      resetForm();
      fetchSubjects();
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || (isEditMode ? "Failed to update subject" : "Failed to create subject"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: SubjectDTO) => {
      setIsEditMode(true);
      setEditingSubjectId(item.subjectId!);
      setSubjectName(item.subjectName);
      setSubjectCode(item.subjectCode);
      setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to delete this subject?")) {
        await processDelete(id);
      }
    } else {
      Alert.alert("Confirm", "Delete this subject?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
      ]);
    }
  };

  const processDelete = async (id: string) => {
    try {
      await deleteSubject(id);
      fetchSubjects();
    } catch (e) {
      Alert.alert("Error", "Failed to delete subject");
    }
  };

  const resetForm = () => {
      setSubjectName('');
      setSubjectCode('');
      setIsEditMode(false);
      setEditingSubjectId(null);
  };

  if (state.status === 'loading' || loading && subjects.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  // --- RENDER ITEM ---
 const renderItem = ({ item }: { item: SubjectDTO }) => (
    <View style={[
        styles.itemContainer, 
        isWeb && { 
            width: `${100 / numColumns}%`,
            paddingHorizontal: 10, 
            marginBottom: 20 
        }
    ]}>
        <View style={styles.card}>
            <View style={styles.cardIcon}>
                <Ionicons name="book" size={24} color="#FFF" />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.subjectName}>{item.subjectName}</Text>
                <Text style={styles.subjectCode}>Code: {item.subjectCode}</Text>
            </View>
            
            <View style={styles.actionIcons}>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.subjectId!)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
        <Text style={styles.title}>Subject Management</Text>
        <TouchableOpacity style={[styles.addBtn, !isWeb && styles.addBtnMobile]} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Add Subject</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.subjectId || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        
        key={isWeb ? 'web' : 'mobile'}
        numColumns={numColumns}
        
        columnWrapperStyle={isWeb ? null : undefined}
        
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No subjects found.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? "Edit Subject" : "Create New Subject"}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Subject Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Mathematics" 
              value={subjectName}
              onChangeText={setSubjectName}
            />

            <Text style={styles.label}>Subject Code</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. MATH101" 
              value={subjectCode}
              onChangeText={setSubjectCode}
              autoCapitalize="characters"
            />

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleCreateOrUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>{isEditMode ? "Update Subject" : "Create Subject"}</Text>
              )}
            </TouchableOpacity>
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
  addBtn: { flexDirection: 'row', backgroundColor: '#8B5CF6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  addBtnMobile: { alignSelf: 'flex-start' },
  addBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },
  
  // --- GRID STYLES ---
  itemContainer: {
    width: '100%',
    marginBottom: 16,
  },
  card: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardContent: { flex: 1 },
  subjectName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  subjectCode: { fontSize: 13, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  
  actionIcons: { flexDirection: 'row', gap: 10, marginLeft: 10 },
  iconBtn: { padding: 4 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#F9FAFB' },
  submitBtn: { backgroundColor: '#8B5CF6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});