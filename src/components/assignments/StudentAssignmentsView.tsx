import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
 
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
  View,
} from "react-native";
 
import {
  getMySubmissions,
  getStudentAssignments,
  submitStudentAssignment,
} from "../../api/assignmentApi";
import { getStudentProfile } from "../../api/studentService";
import { useAuth } from "../../context/AuthContext";
import { Assignment, AssignmentCombined } from "../../types/assignment";

const API_BASE_URL = 'http://192.168.0.113:8080'; 

// Helper to open files
const openFileUrl = (fileUrl: string) => {
  try {
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${API_BASE_URL}${fileUrl}`;
      if (Platform.OS === 'web') {
          window.open(fullUrl, '_blank');
      } else {
          Linking.openURL(fullUrl);
      }
  } catch (e) {
      Alert.alert("Error", "Could not open file.");
  }
};
 
export default function StudentAssignmentsView() {
  const { state } = useAuth();
  const user = state.user;
 
  const [assignmentsList, setAssignmentsList] = useState<AssignmentCombined[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "COMPLETED">(
    "PENDING"
  );
 
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
 
  const [note, setNote] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const fetchData = async () => {
    if (!user?.username) return;
 
    try {
      setLoading(true);
      const profile = await getStudentProfile(user.username);
      if (!profile.classSectionId) {
        setLoading(false);
        return;
      }
 
      const [allAssignments, mySubmissions] = await Promise.all([
        getStudentAssignments(profile.classSectionId),
        getMySubmissions(user.username),
      ]);
 
      const combined = allAssignments.map((a) => {
        const sub = mySubmissions.find(
          (s) =>
            s.assignmentId === a.assignmentId && s.subjectId === a.subjectId
        );
        return { assignment: a, submission: sub || null };
      });
 
      setAssignmentsList(combined);
    } catch (err) {
      console.log("Error loading assignments:", err);
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
 
  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        setSelectedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {
      console.log("File picker error:", err);
    }
  };
 
  const handleSubmit = async () => {
    if (!selectedAssignment || !user?.username) return;
    if (!note && selectedFiles.length === 0) {
      Alert.alert("Error", "Please add a note or attach files.");
      return;
    }
 
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const payload = {
        studentId: user.username,
        note: note,
        relatedLinks: [],
      };
 
      if (Platform.OS === "web") {
        formData.append(
          "data",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } else {
        formData.append("data", JSON.stringify(payload));
      }
 
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (Platform.OS === "web") {
          const blobFile = await fetch(file.uri).then((r) => r.blob());
          formData.append("files", blobFile, file.name);
        } else {
          formData.append("files", {
            uri: file.uri,
            name: file.name || `file_${i}`,
            type: file.mimeType || "application/octet-stream",
          } as any);
        }
      }
 
      await submitStudentAssignment(
        selectedAssignment.assignmentId,
        selectedAssignment.subjectId,
        formData
      );
 
      Alert.alert("Success", "Assignment submitted!");
      setSubmissionModalVisible(false);
      setSelectedFiles([]);
      fetchData();
    } catch (err) {
      console.log("Upload error:", err);
      Alert.alert("Error", "Upload failed!");
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const openSubmissionModal = (assignment: Assignment, submission: AssignmentCombined['submission']) => {
    setSelectedAssignment(assignment);
    if (submission) {
        setNote(submission.note || '');
    } else {
        setNote("");
        setSelectedFiles([]);
    }
    setSubmissionModalVisible(true);
  };
 
  const renderItem = ({ item }: { item: AssignmentCombined }) => {
    const { assignment, submission } = item;
    const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
 
    return (
      <TouchableOpacity
        style={[styles.card, isOverdue && styles.cardOverdue]}
        onPress={() => openSubmissionModal(assignment, submission)} 
      >
        <View style={styles.cardHeader}>
          <Text style={styles.subjectTag}>{assignment.subjectId}</Text>
          <Text style={[styles.statusTag, submission ? styles.statusSubmitted : isOverdue ? styles.statusOverdue : styles.statusPending]}>
            {submission ? submission.status : isOverdue ? "OVERDUE" : "PENDING"}
          </Text>
        </View>
        
        <Text style={styles.cardTitle}>{assignment.title}</Text>
        
        {assignment.attachedFiles && (
            <TouchableOpacity style={styles.fileButton} onPress={() => openFileUrl(assignment.attachedFiles!)}>
                <Ionicons name="document-text-outline" size={18} color="#2563EB" style={{marginRight: 6}}/>
                <Text style={styles.fileButtonText}>View Teacher Attachment</Text>
            </TouchableOpacity>
        )}

        <Text style={styles.cardDesc} numberOfLines={2}>{assignment.description}</Text>
 
        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.dateText}> Due: {assignment.dueDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
 
  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
 
  // Filter assignments
  const pendingList = assignmentsList.filter(
    (a) => !a.submission || a.submission.status === "REJECTED"
  );
  const completedList = assignmentsList.filter(
    (a) => a.submission && a.submission.status !== "REJECTED"
  );

  // 🔥 BUG FIX: Sort Pending by Assigned Date (Newest First)
  pendingList.sort((a, b) => new Date(b.assignment.assignedDate).getTime() - new Date(a.assignment.assignedDate).getTime());

  // 🔥 BUG FIX: Sort Completed by Submitted Date (Latest Submission Top)
  completedList.sort((a, b) => {
      const dateA = a.submission?.submittedDate ? new Date(a.submission.submittedDate).getTime() : 0;
      const dateB = b.submission?.submittedDate ? new Date(b.submission.submittedDate).getTime() : 0;
      return dateB - dateA;
  });
  
  const currentAssignmentCombined = assignmentsList.find(a => 
      a.assignment.assignmentId === selectedAssignment?.assignmentId
  );
  const currentSubmission = currentAssignmentCombined?.submission;
  const currentList = activeTab === "PENDING" ? pendingList : completedList;
 
  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Assignments</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === "PENDING" && styles.tabActive]} onPress={() => setActiveTab("PENDING")}>
          <Text style={[styles.tabText, activeTab === "PENDING" && styles.tabTextActive]}>Pending</Text>
          {pendingList.length > 0 && (
            <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{pendingList.length}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === "COMPLETED" && styles.tabActive]} onPress={() => setActiveTab("COMPLETED")}>
          <Text style={[styles.tabText, activeTab === "COMPLETED" && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>
 
      <FlatList
        data={currentList}
        renderItem={renderItem}
        keyExtractor={(item) => item.assignment.assignmentId}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
 
      <Modal visible={submissionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{currentSubmission ? "Submission Details" : "Submit Assignment"}</Text>
              <TouchableOpacity onPress={() => setSubmissionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
 
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.label}>Assignment</Text>
              <Text style={styles.value}>{selectedAssignment?.title}</Text>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.descText}>{selectedAssignment?.description}</Text>
              
              {currentSubmission && (
                  <View style={[styles.reviewBox, currentSubmission.status === 'APPROVED' ? styles.reviewApproved : styles.reviewPending]}>
                      <Text style={styles.reviewLabel}>Status: {currentSubmission.status}</Text>
                      {currentSubmission.remark && <Text style={styles.reviewRemark}>"{currentSubmission.remark}"</Text>}
                  </View>
              )}
              
              {/* 🔥 BUG FIX: Display Student's Uploaded Files properly */}
              {currentSubmission && (
                  <View style={{ marginTop: 15, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                      <Text style={[styles.label, {marginTop: 0}]}>Your Submitted Files:</Text>
                      {(currentSubmission.relatedLinks && currentSubmission.relatedLinks.length > 0) ? (
                          currentSubmission.relatedLinks.map((link, index) => (
                              <TouchableOpacity key={index} style={styles.submittedFileBtn} onPress={() => openFileUrl(link)}>
                                  <Ionicons name="document-attach" size={20} color="#2563EB" />
                                  <Text style={styles.submittedFileText}>
                                      {link.substring(link.lastIndexOf('/') + 1)}
                                  </Text>
                              </TouchableOpacity>
                          ))
                      ) : (
                          <Text style={styles.descText}>No files attached.</Text>
                      )}
                  </View>
              )}
 
              <Text style={[styles.label, { marginTop: 15 }]}>Your Note</Text>
              <TextInput
                style={styles.inputArea}
                placeholder="Type your notes..."
                value={currentSubmission ? currentSubmission.note : note}
                multiline
                onChangeText={setNote}
                editable={!currentSubmission} 
              />
              
              {!currentSubmission && (
                  <>
                      <TouchableOpacity style={styles.filePickBtn} onPress={pickFiles}>
                        <Ionicons name="attach" size={20} color="#F97316" />
                        <Text style={styles.filePickText}>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : "Upload Files"}</Text>
                      </TouchableOpacity>
                      {selectedFiles.map((file, index) => (
                        <Text key={index} style={styles.selectedFile}>• {file.name}</Text>
                      ))}
                  </>
              )}
            </ScrollView>
 
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setSubmissionModalVisible(false)}>
                <Text style={styles.cancelButtonText}>{currentSubmission ? "Close" : "Cancel"}</Text>
              </TouchableOpacity>
              {!currentSubmission && (
                  <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Submit</Text>}
                  </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F3F4F6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  tabContainer: { flexDirection: "row", padding: 4, marginBottom: 20, backgroundColor: "#E5E7EB", borderRadius: 12 },
  tabButton: { flex: 1, paddingVertical: 10, flexDirection: "row", justifyContent: "center" },
  tabActive: { backgroundColor: "#FFF", borderRadius: 8 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#F97316" },
  badgeCount: { backgroundColor: "#EF4444", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeCountText: { color: "#FFF", fontSize: 10 },
  card: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#2563EB" },
  cardOverdue: { borderLeftColor: "#DC2626" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  subjectTag: { fontWeight: "bold", color: "#555" },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 11 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  statusPending: { backgroundColor: "#FEF3C7", color: "#D97706" },
  statusSubmitted: { backgroundColor: "#D1FAE5", color: "#059669" },
  statusOverdue: { backgroundColor: "#FEE2E2", color: "#DC2626" },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  cardDesc: { fontSize: 14, color: "#555", marginVertical: 4 },
  dateRow: { flexDirection: "row", gap: 6 },
  dateText: { color: "#666" },
  fileButton: { flexDirection: "row", alignItems: "center", marginVertical: 6, padding: 4, backgroundColor: '#EEF2FF', borderRadius: 6, alignSelf: 'flex-start' },
  fileButtonText: { marginLeft: 6, color: "#2563EB", fontWeight: "600", fontSize: 13 },
  submittedFileBtn: { flexDirection: "row", alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#EFF6FF', borderRadius: 8, marginBottom: 6, borderColor: '#BFDBFE', borderWidth: 1 },
  submittedFileText: { marginLeft: 8, color: "#2563EB", fontWeight: "600", fontSize: 14, textDecorationLine: 'underline', flex: 1 },
  reviewBox: { padding: 12, borderRadius: 8, marginBottom: 12 },
  reviewApproved: { backgroundColor: '#D1FAE5', borderLeftWidth: 4, borderLeftColor: '#059669' },
  reviewPending: { backgroundColor: '#FEF3C7', borderLeftWidth: 4, borderLeftColor: '#D97706' },
  reviewLabel: { fontWeight: 'bold', fontSize: 14, color: '#111827', marginBottom: 4 },
  reviewRemark: { fontStyle: 'italic', fontSize: 13, color: '#4B5563' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4 },

  value: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  descText: { fontSize: 14, color: '#555', marginBottom: 12 },
  inputArea: { borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 12, minHeight: 100, marginBottom: 12 },
  filePickBtn: { borderWidth: 1, borderColor: "#F97316", padding: 10, borderRadius: 8, flexDirection: "row", alignItems: "center", marginTop: 10 },
  filePickText: { marginLeft: 8, color: "#F97316", fontWeight: "600" },
  selectedFile: { marginTop: 6, color: "#555" },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, gap: 12 },
  cancelButton: { padding: 10 },
  cancelButtonText: { color: "#555" },
  submitButton: { backgroundColor: "#F97316", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#FFF", fontWeight: "700" },
});