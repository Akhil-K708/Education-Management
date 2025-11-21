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
import { TeacherDTO, createTeacher, deleteTeacher, getAllTeachers } from '../../src/api/adminApi';
import { useAuth } from '../../src/context/AuthContext';

export default function TeachersScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const numColumns = isWeb ? 3 : 1;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<TeacherDTO[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    teacherName: '',
    email: '',
    phone: '',
    qualification: '',
    gender: 'Male',
    experience: '',
    address: ''
  });

  const fetchTeachers = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (e) {
      console.error(e);
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
    fetchTeachers();
  }, [user, state.status]);

  const onRefresh = () => {
      setRefreshing(true);
      fetchTeachers(true);
  };

  const handleCreate = async () => {
    if (!formData.teacherName || !formData.email || !formData.phone) {
      Alert.alert("Error", "Please fill mandatory fields (Name, Email, Phone)");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeacher({
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : 0
      });
      Alert.alert("Success", "Teacher Added Successfully!");
      setModalVisible(false);
      setFormData({ teacherName: '', email: '', phone: '', qualification: '', gender: 'Male', experience: '', address: '' });
      fetchTeachers();
    } catch (e: any) {
      Alert.alert("Error", "Failed to add teacher. Email might be duplicate.");
    } finally {
      setIsSubmitting(false);
    }
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
      fetchTeachers();
    } catch (e) {
      Alert.alert("Error", "Failed to delete teacher");
    }
  };

 const renderItem = ({ item }: { item: TeacherDTO }) => (
    <View style={[
        styles.itemContainer, 
        isWeb && { 
            width: `${100 / numColumns}%`, // FIX 1: Dynamic Width
            paddingHorizontal: 10, // Spacing ni ikkada handle chestunnam
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
                <TouchableOpacity onPress={() => handleDelete(item.teacherId!)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={14} color="#6B7280" />
                <Text style={styles.infoText}>{item.phone}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={14} color="#6B7280" />
                <Text style={styles.infoText}>{item.email}</Text>
            </View>
            
            <View style={styles.badgeRow}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.experience} Yrs Exp</Text>
                </View>
            </View>
        </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
        <Text style={styles.title}>Teacher Management</Text>
        <TouchableOpacity style={[styles.addBtn, !isWeb && styles.addBtnMobile]} onPress={() => setModalVisible(true)}>
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
              <Text style={styles.modalTitle}>Add New Teacher</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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

                <Text style={styles.label}>Address</Text>
                <TextInput style={[styles.input, {height: 60}]} multiline value={formData.address} onChangeText={t => setFormData({...formData, address: t})} placeholder="Enter address" />

                <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitBtnText}>Save Teacher</Text>}
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
  badgeRow: { flexDirection: 'row', marginTop: 8 },
  badge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  
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
  submitBtn: { backgroundColor: '#F97316', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});