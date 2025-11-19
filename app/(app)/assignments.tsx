import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getMySubmissions, getStudentAssignments, submitStudentAssignment } from '../../src/api/assignmentApi'; // Step 1 లో క్రియేట్ చేసినవి
import { getStudentProfile } from '../../src/api/studentService'; // క్లాస్ ID కోసం
import { useAuth } from '../../src/context/AuthContext';
import { Assignment, AssignmentCombined, AssignmentSubmission } from '../../src/types/assignment';

export default function AssignmentsScreen() {
  const { state } = useAuth();
  const user = state.user;
  
  // Data States
  const [assignmentsList, setAssignmentsList] = useState<AssignmentCombined[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  
  // Form States
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      // 1. Get Profile to know ClassSectionId
      const profile = await getStudentProfile(user.username);
      if (!profile.classSectionId) {
         console.warn("No class section found for student");
         setLoading(false);
         return;
      }

      // 2. Get Assignments & Submissions in parallel
      const [allAssignments, mySubmissions] = await Promise.all([
        getStudentAssignments(profile.classSectionId),
        getMySubmissions(user.username)
      ]);

      // 3. Combine Data (Check status)
      const combined: AssignmentCombined[] = allAssignments.map(assign => {
        const sub = mySubmissions.find(s => s.assignmentId === assign.assignmentId && s.subjectId === assign.subjectId);
        return {
          assignment: assign,
          submission: sub || null
        };
      });

      setAssignmentsList(combined);

    } catch (error) {
      console.error("Failed to load assignments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- FILTERS ---
  const pendingList = assignmentsList.filter(a => !a.submission || a.submission.status === 'REJECTED');
  const completedList = assignmentsList.filter(a => a.submission && a.submission.status !== 'REJECTED');

  const currentList = activeTab === 'PENDING' ? pendingList : completedList;

  // --- ACTIONS ---
  const openSubmissionModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setNote('');
    setLink('');
    setSubmissionModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !user?.username) return;
    if (!note && !link) {
        Alert.alert("Error", "Please add a note or a link.");
        return;
    }

    try {
      setIsSubmitting(true);
      const submissionData: Partial<AssignmentSubmission> = {
        studentId: user.username,
        note: note,
        relatedLinks: link ? [link] : [],
        // File upload logic can be added here later (relatedFileLinks)
      };

      await submitStudentAssignment(
          selectedAssignment.assignmentId, 
          selectedAssignment.subjectId, 
          submissionData
      );

      Alert.alert("Success", "Assignment submitted successfully!");
      setSubmissionModalVisible(false);
      fetchData(); // Refresh list

    } catch (error) {
      Alert.alert("Error", "Failed to submit assignment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERS ---

  const renderItem = ({ item }: { item: AssignmentCombined }) => {
    const { assignment, submission } = item;
    const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;

    return (
      <TouchableOpacity 
        style={[styles.card, isOverdue && styles.cardOverdue]}
        onPress={() => !submission && openSubmissionModal(assignment)}
        disabled={!!submission} // Disable click if already submitted (unless we want to view details)
      >
        <View style={styles.cardHeader}>
           <Text style={styles.subjectTag}>{assignment.subjectId}</Text> 
           {/* Note: You might want to fetch Subject Name instead of ID if available, or map it */}
           <Text style={[
               styles.statusTag, 
               submission ? styles.statusSubmitted : (isOverdue ? styles.statusOverdue : styles.statusPending)
           ]}>
               {submission ? submission.status : (isOverdue ? 'OVERDUE' : 'PENDING')}
           </Text>
        </View>

        <Text style={styles.cardTitle}>{assignment.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{assignment.description}</Text>

        <View style={styles.cardFooter}>
           <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.dateText}> Due: {assignment.dueDate}</Text>
           </View>
           {assignment.priority === 'HIGH' && (
               <View style={styles.priorityBadge}>
                   <Text style={styles.priorityText}>HIGH PRIORITY</Text>
               </View>
           )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Assignments</Text>

      {/* --- TABS --- */}
      <View style={styles.tabContainer}>
         <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'PENDING' && styles.tabActive]}
            onPress={() => setActiveTab('PENDING')}
         >
            <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>Pending</Text>
            {pendingList.length > 0 && (
                <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{pendingList.length}</Text>
                </View>
            )}
         </TouchableOpacity>
         <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'COMPLETED' && styles.tabActive]}
            onPress={() => setActiveTab('COMPLETED')}
         >
            <Text style={[styles.tabText, activeTab === 'COMPLETED' && styles.tabTextActive]}>Completed</Text>
         </TouchableOpacity>
      </View>

      {/* --- LIST --- */}
      <FlatList
        data={currentList}
        renderItem={renderItem}
        keyExtractor={(item) => item.assignment.assignmentId}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
            <View style={styles.emptyState}>
                <Ionicons name="documents-outline" size={50} color="#D1D5DB" />
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} assignments</Text>
            </View>
        }
      />

      {/* --- SUBMISSION MODAL --- */}
      <Modal
        visible={submissionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSubmissionModalVisible(false)}
      >
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Submit Assignment</Text>
                    <TouchableOpacity onPress={() => setSubmissionModalVisible(false)}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 400 }}>
                    <Text style={styles.label}>Assignment:</Text>
                    <Text style={styles.value}>{selectedAssignment?.title}</Text>

                    <Text style={styles.label}>Description:</Text>
                    <Text style={styles.descText}>{selectedAssignment?.description}</Text>

                    <Text style={[styles.label, {marginTop: 15}]}>Your Work:</Text>
                    
                    <TextInput
                        style={styles.inputArea}
                        placeholder="Type your notes here..."
                        multiline
                        numberOfLines={4}
                        value={note}
                        onChangeText={setNote}
                        textAlignVertical="top"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Paste file link (Google Drive/Dropbox)..."
                        value={link}
                        onChangeText={setLink}
                    />
                    
                    {/* File Upload Placeholder Button */}
                    <TouchableOpacity style={styles.uploadButton} onPress={() => Alert.alert("Info", "File upload feature coming soon!")}>
                        <Ionicons name="cloud-upload-outline" size={20} color="#4B5563" />
                        <Text style={styles.uploadText}>Upload File / Photo</Text>
                    </TouchableOpacity>

                </ScrollView>

                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setSubmissionModalVisible(false)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
         </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16,
  },

  // Tabs
  tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#E5E7EB',
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
  },
  tabButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
  },
  tabActive: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#F97316' },
  badgeCount: {
      backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6,
  },
  badgeCountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Card
  card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
      borderLeftWidth: 4, borderLeftColor: '#2563EB', // Default Blue
  },
  cardOverdue: {
      borderLeftColor: '#EF4444', // Red if overdue
  },
  cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  subjectTag: {
      fontSize: 12, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase',
  },
  statusTag: {
      fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
  },
  statusPending: { backgroundColor: '#FEF3C7', color: '#D97706' },
  statusSubmitted: { backgroundColor: '#D1FAE5', color: '#059669' },
  statusOverdue: { backgroundColor: '#FEE2E2', color: '#DC2626' },

  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#4B5563', marginBottom: 12 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 12, color: '#6B7280' },
  priorityBadge: { backgroundColor: '#FFF1F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, color: '#BE123C', fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', marginTop: 10 },

  // Modal
  modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20,
  },
  modalContent: {
      backgroundColor: '#FFF', borderRadius: 16, padding: 20, maxHeight: '80%',
  },
  modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  value: { fontSize: 16, color: '#111827', marginBottom: 12 },
  descText: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 12 },
  
  inputArea: {
      borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12,
      backgroundColor: '#F9FAFB', minHeight: 100, textAlignVertical: 'top',
  },
  input: {
      borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12,
      backgroundColor: '#F9FAFB',
  },
  uploadButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 8,
      padding: 16, backgroundColor: '#F9FAFB', marginBottom: 20,
  },
  uploadText: { marginLeft: 8, color: '#4B5563' },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelButtonText: { color: '#6B7280', fontWeight: '600' },
  submitButton: {
      backgroundColor: '#F97316', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFF', fontWeight: 'bold' },
});