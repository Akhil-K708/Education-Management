import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import {
    createAssignment,
    getAssignmentSubmissions,
    getTeacherAssignments,
    reviewSubmission
} from '../../api/assignmentApi';
import { studentApi } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { Assignment, AssignmentSubmission } from '../../types/assignment';

export default function TeacherAssignmentsView() {
  const { state } = useAuth();
  const user = state.user;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [subjectsForClass, setSubjectsForClass] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('2025-11-30');
  
  const [submissionsModalVisible, setSubmissionsModalVisible] = useState(false);
  const [currentSubmissions, setCurrentSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const fetchAssignments = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getTeacherAssignments(user.username);
      
      // --- SORTING LOGIC (NEWEST FIRST) ---
      // Assigned Date prakaram reverse sort chesthunnam
      const sortedData = data.sort((a, b) => {
         const dateA = new Date(a.assignedDate).getTime();
         const dateB = new Date(b.assignedDate).getTime();
         return dateB - dateA;
      });

      setAssignments(sortedData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await studentApi.get(`/teacher/assigned-classes/${user?.username}`);
      setAssignedClasses(res.data);
      if (res.data.length > 0) fetchSubjects(res.data[0].classSectionId);
    } catch (e) { console.error(e); }
  };

  const fetchSubjects = async (classId: string) => {
    try {
      setSelectedClass(classId);
      const res = await studentApi.get(`/subject/assign/${classId}`);
      setSubjectsForClass(res.data); 
      if (res.data.length > 0) setSelectedSubject(res.data[0].subjectId);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
  }, [user]);

  const handleCreate = async () => {
    if (!newTitle || !selectedClass || !selectedSubject) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    try {
      await createAssignment(user?.username!, selectedSubject, selectedClass, {
        title: newTitle,
        description: newDesc,
        dueDate: newDueDate,
        priority: 'MEDIUM',
      });
      Alert.alert("Success", "Assignment Posted!");
      setCreateModalVisible(false);
      fetchAssignments();
    } catch (e) {
      Alert.alert("Error", "Failed to create assignment");
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignmentId(assignment.assignmentId);
    setSelectedSubjectId(assignment.subjectId);
    try {
      const subs = await getAssignmentSubmissions(assignment.assignmentId, assignment.subjectId);
      setCurrentSubmissions(subs);
      setSubmissionsModalVisible(true);
    } catch (e) {
      Alert.alert("Error", "Could not load submissions");
    }
  };

  const handleReview = async (sub: AssignmentSubmission, status: 'APPROVED' | 'REJECTED') => {
    try {
      await reviewSubmission(selectedAssignmentId, selectedSubjectId, sub.submissionNumber!, {
        status: status,
        remark: status === 'APPROVED' ? 'Good Job' : 'Please redo',
        reviewedBy: user?.username!
      });
      const updated = currentSubmissions.map(s => 
        s.submissionNumber === sub.submissionNumber ? { ...s, status } : s
      );
      setCurrentSubmissions(updated);
    } catch (e) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {/* Title changed to "Assignments" and added flex: 1 to avoid overlap */}
        <Text style={styles.pageTitle} numberOfLines={1}>Assignments</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={assignments}
        keyExtractor={(item) => item.assignmentId}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.subtitle}>Class: {item.assignedTo} • Subject: {item.subjectId}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.viewSubBtn} onPress={() => handleViewSubmissions(item)}>
               <Text style={styles.viewSubText}>View Student Submissions</Text>
               <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* CREATE MODAL */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Assignment</Text>
            
            <Text style={styles.label}>Select Class:</Text>
            <View style={styles.pillContainer}>
              {assignedClasses.map(c => (
                <TouchableOpacity 
                  key={c.classSectionId} 
                  style={[styles.pill, selectedClass === c.classSectionId && styles.pillActive]}
                  onPress={() => fetchSubjects(c.classSectionId)}
                >
                  <Text style={[styles.pillText, selectedClass === c.classSectionId && styles.pillTextActive]}>
                    {c.className}-{c.sectionName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Select Subject:</Text>
            <View style={styles.pillContainer}>
              {subjectsForClass.map(s => (
                <TouchableOpacity 
                  key={s.subjectId} 
                  style={[styles.pill, selectedSubject === s.subjectId && styles.pillActive]}
                  onPress={() => setSelectedSubject(s.subjectId)}
                >
                  <Text style={[styles.pillText, selectedSubject === s.subjectId && styles.pillTextActive]}>
                    {s.subjectName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Title:</Text>
            <TextInput style={styles.input} value={newTitle} onChangeText={setNewTitle} placeholder="Ex: Chapter 1 Homework"/>

            <Text style={styles.label}>Description:</Text>
            <TextInput style={[styles.input, {height: 80}]} multiline value={newDesc} onChangeText={setNewDesc} placeholder="Details..."/>

            <View style={styles.modalFooter}>
               <TouchableOpacity onPress={() => setCreateModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveText}>Post Assignment</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUBMISSIONS MODAL */}
      <Modal visible={submissionsModalVisible} animationType="slide">
        <View style={styles.fullScreenModal}>
          <View style={styles.fsHeader}>
            <TouchableOpacity onPress={() => setSubmissionsModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.fsTitle}>Submissions</Text>
          </View>

          <FlatList
            data={currentSubmissions}
            keyExtractor={(item) => item.submissionNumber?.toString() || Math.random().toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No submissions yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.subCard}>
                <View>
                   <Text style={styles.studentId}>Student: {item.studentId}</Text>
                   <Text style={styles.subNote}>{item.note}</Text>
                   {item.relatedLinks && item.relatedLinks.map((l, i) => (
                       <Text key={i} style={styles.linkText}>{l}</Text>
                   ))}
                </View>
                <View style={styles.actionCol}>
                   <Text style={[
                     styles.statusBadge, 
                     item.status === 'APPROVED' ? {color:'green'} : item.status === 'REJECTED' ? {color:'red'} : {color:'orange'}
                   ]}>{item.status}</Text>
                   
                   {item.status === 'SUBMITTED' && (
                     <View style={{flexDirection:'row', gap: 10, marginTop: 8}}>
                       <TouchableOpacity onPress={() => handleReview(item, 'APPROVED')}>
                         <Ionicons name="checkmark-circle" size={28} color="green" />
                       </TouchableOpacity>
                       <TouchableOpacity onPress={() => handleReview(item, 'REJECTED')}>
                         <Ionicons name="close-circle" size={28} color="red" />
                       </TouchableOpacity>
                     </View>
                   )}
                </View>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  pageTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#111827', 
    flex: 1, // ADDED: This fixes the text cut-off issue on mobile
    marginRight: 10
  },
  addButton: { 
    flexDirection: 'row', 
    backgroundColor: '#F97316', 
    paddingVertical: 8, 
    paddingHorizontal: 12, // Adjusted padding to fit better
    borderRadius: 8, 
    alignItems: 'center',
    flexShrink: 0 // Prevents button from shrinking
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 4 },
  
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  status: { fontSize: 12, fontWeight: 'bold', color: '#F97316', backgroundColor: '#FFF7ED', padding: 4, borderRadius: 4 },
  subtitle: { fontSize: 12, color: '#6B7280', marginVertical: 4 },
  desc: { fontSize: 14, color: '#374151', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 8 },
  viewSubBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewSubText: { color: '#2563EB', fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { padding: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20 },
  pillActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  pillText: { color: '#374151' },
  pillTextActive: { color: '#FFF', fontWeight: 'bold' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, alignItems: 'center' },
  cancelText: { marginRight: 20, color: '#6B7280', fontWeight: '600' },
  saveBtn: { backgroundColor: '#F97316', padding: 10, borderRadius: 8 },
  saveText: { color: '#FFF', fontWeight: 'bold' },

  // Submissions Screen
  fullScreenModal: { flex: 1, backgroundColor: '#F3F4F6' },
  fsHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  fsTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  subCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 16, marginHorizontal: 16, marginTop: 12, borderRadius: 8, justifyContent: 'space-between', alignItems: 'center' },
  studentId: { fontWeight: 'bold', fontSize: 16 },
  subNote: { color: '#4B5563', marginTop: 4, maxWidth: 200 },
  linkText: { color: '#2563EB', fontSize: 12, textDecorationLine: 'underline' },
  actionCol: { alignItems: 'flex-end' },
  statusBadge: { fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#6B7280' }
}); 