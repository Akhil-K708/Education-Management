import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { createNotice, deleteNotice, getAllNotices, updateNotice } from '../../src/api/noticeApi';
import { useAuth } from '../../src/context/AuthContext';
import { Notice } from '../../src/types/notice';

// --- WEB DATE INPUT COMPONENT ---
const WebDateInput = ({ value, onChange }: { value: Date, onChange: (d: Date) => void }) => {
  return React.createElement('input', {
    type: 'date',
    value: value.toISOString().split('T')[0],
    style: {
      borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10,
      backgroundColor: '#F9FAFB', fontSize: 14, width: '100%', height: 50,
      fontFamily: 'System', boxSizing: 'border-box', outline: 'none'
    },
    onChange: (e: any) => {
      const val = e.target.value;
      if (val) onChange(new Date(val));
    }
  });
};

export default function NoticeScreen() {
  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  
  // Responsive Layout
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const numColumns = isWeb ? 2 : 1; // Web lo 2 columns, Mobile lo 1

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [noticeName, setNoticeName] = useState('');
  const [noticeDescription, setNoticeDescription] = useState('');
  const [noticeType, setNoticeType] = useState('GENERAL'); // Default type
  const [noticeDate, setNoticeDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- 1. FETCH DATA ---
  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await getAllNotices();
      // Sort by Date (Latest First)
      const sorted = data.sort((a, b) => new Date(b.noticeDate).getTime() - new Date(a.noticeDate).getTime());
      setNotices(sorted);
    } catch (e) {
      console.error("Failed to load notices");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (state.status === 'loading') return;
    fetchNotices();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotices();
  };

  // --- 2. HANDLE FORM SUBMIT (CREATE / UPDATE) ---
  const handleSubmit = async () => {
    if (!noticeName || !noticeDescription) {
      Alert.alert("Error", "Please fill title and description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Notice = {
        noticeName,
        noticeDescription,
        noticeType,
        noticeDate: noticeDate.toISOString().split('T')[0]
      };

      if (isEditMode && editingId) {
        await updateNotice(editingId, payload);
        Alert.alert("Success", "Notice Updated Successfully!");
      } else {
        await createNotice(payload);
        Alert.alert("Success", "Notice Posted Successfully!");
      }

      setModalVisible(false);
      resetForm();
      fetchNotices();
    } catch (e) {
      Alert.alert("Error", "Operation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. HANDLE DELETE ---
  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm("Are you sure you want to delete this notice?")) processDelete(id);
    } else {
      Alert.alert("Confirm", "Delete this notice?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => processDelete(id) }
      ]);
    }
  };

  const processDelete = async (id: string) => {
    try {
      await deleteNotice(id);
      fetchNotices();
    } catch (e) {
      Alert.alert("Error", "Failed to delete notice.");
    }
  };

  // --- 4. OPEN MODAL HELPERS ---
  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: Notice) => {
    setIsEditMode(true);
    setEditingId(item.id!);
    setNoticeName(item.noticeName);
    setNoticeDescription(item.noticeDescription);
    setNoticeType(item.noticeType);
    setNoticeDate(new Date(item.noticeDate));
    setModalVisible(true);
  };

  const resetForm = () => {
    setNoticeName('');
    setNoticeDescription('');
    setNoticeType('GENERAL');
    setNoticeDate(new Date());
    setIsEditMode(false);
    setEditingId(null);
  };

  // --- 5. RENDER ITEM ---
  const renderItem = ({ item }: { item: Notice }) => (
    <View style={[
      styles.cardContainer,
      isWeb && { width: `${100 / numColumns}%`, paddingHorizontal: 10 }
    ]}>
      <View style={[styles.card, getCardStyleByType(item.noticeType)]}>
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.noticeType}</Text>
          </View>
          <Text style={styles.dateText}>{item.noticeDate}</Text>
        </View>

        <Text style={styles.title}>{item.noticeName}</Text>
        <Text style={styles.desc}>{item.noticeDescription}</Text>

        {/* Admin Actions */}
        {user?.role === 'ADMIN' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
              <Ionicons name="create-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id!)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const getCardStyleByType = (type: string) => {
    switch (type) {
      case 'HOLIDAY': return { borderLeftColor: '#EF4444' }; // Red
      case 'EVENT': return { borderLeftColor: '#F59E0B' };   // Orange
      default: return { borderLeftColor: '#3B82F6' };        // Blue
    }
  };

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
        <Text style={styles.pageTitle}>Notice Board</Text>
        
        {/* ONLY ADMIN CAN SEE ADD BUTTON */}
        {user?.role === 'ADMIN' && (
          <TouchableOpacity style={[styles.addBtn, !isWeb && styles.addBtnMobile]} onPress={openCreateModal}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addBtnText}>Post Notice</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notices}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        key={isWeb ? 'web' : 'mobile'}
        numColumns={numColumns}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No notices available.</Text>
          </View>
        }
      />

      {/* --- MODAL (ADMIN ONLY) --- */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditMode ? "Edit Notice" : "New Notice"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Summer Vacation" 
              value={noticeName} 
              onChangeText={setNoticeName} 
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {['GENERAL', 'EVENT', 'HOLIDAY'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.chip, noticeType === type && styles.chipActive]}
                  onPress={() => setNoticeType(type)}
                >
                  <Text style={[styles.chipText, noticeType === type && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Date</Text>
            {Platform.OS === 'web' ? (
              <WebDateInput value={noticeDate} onChange={setNoticeDate} />
            ) : (
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text>{noticeDate.toISOString().split('T')[0]}</Text>
                <Ionicons name="calendar" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            {showDatePicker && (
              <DateTimePicker 
                value={noticeDate} 
                mode="date" 
                onChange={(e, d) => { setShowDatePicker(false); if (d) setNoticeDate(d); }} 
              />
            )}

            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
              placeholder="Details..." 
              multiline 
              value={noticeDescription} 
              onChangeText={setNoticeDescription} 
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{isEditMode ? "Update" : "Post Notice"}</Text>}
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
  headerRowMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 12 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  addBtn: { flexDirection: 'row', backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  addBtnMobile: { alignSelf: 'flex-start' },
  addBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },

  cardContainer: { width: '100%', marginBottom: 16 },
  card: { 
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, 
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    borderLeftWidth: 5, borderLeftColor: '#3B82F6' // Default Color
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 11, fontWeight: 'bold', color: '#4B5563' },
  dateText: { fontSize: 12, color: '#6B7280' },
  
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
  desc: { fontSize: 14, color: '#374151', lineHeight: 20 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, gap: 12 },
  actionBtn: { padding: 4 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', marginTop: 10 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 450, borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB' },
  
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB' },
  
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  chipActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  chipText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  chipTextActive: { color: '#C2410C' },

  submitBtn: { backgroundColor: '#F97316', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});