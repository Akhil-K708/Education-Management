import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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
 
  // ----------------------------------------------------
  // FETCH ASSIGNMENTS + SUBMISSIONS
  // ----------------------------------------------------
  const fetchData = async () => {
    if (!user?.username) return;
 
    try {
      setLoading(true);
 
      const profile = await getStudentProfile(user.username);
      if (!profile.classSectionId) {
        console.warn("No class section found for student");
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
 
  // ----------------------------------------------------
  // FILE PICKER (MOBILE + WEB)
  // ----------------------------------------------------
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
 
  // ----------------------------------------------------
  // SUBMIT ASSIGNMENT
  // ----------------------------------------------------
  const handleSubmit = async () => {
    if (!selectedAssignment || !user?.username) return;
 
    if (!note && selectedFiles.length === 0) {
      Alert.alert("Error", "Please add a note or attach files.");
      return;
    }
 
    setIsSubmitting(true);
 
    try {
      const formData = new FormData();
 
      // ---------------------------------------------------
      // JSON PART — SAME STYLE AS TEACHER handleCreate()
      // ---------------------------------------------------
 
      const payload = {
        studentId: user.username,
        note: note,
        relatedLinks: [], // we removed link as you requested
      };
 
      if (Platform.OS === "web") {
        // Web browser requires Blob for JSON
        formData.append(
          "data",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } else {
        // Mobile (Android/iOS) JSON must be appended as string
        formData.append("data", {
          name: "data.json",
          type: "application/json",
          string: JSON.stringify(payload),
        } as any);
      }
 
      // ---------------------------------------------------
      // FILE PART — MULTIPLE FILES (mobile + web)
      // ---------------------------------------------------
 
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
 
        if (Platform.OS === "web") {
          // Convert file URI → Blob
          const blobFile = await fetch(file.uri).then((r) => r.blob());
 
          formData.append("files", blobFile, file.name);
        } else {
          // Mobile file upload
          formData.append("files", {
            uri: file.uri,
            name: file.name || `file_${i}`,
            type: file.mimeType || "application/octet-stream",
          } as any);
        }
      }
 
      // ---------------------------------------------------
      // SEND REQUEST
      // ---------------------------------------------------
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
 
  // ----------------------------------------------------
  // RENDER ASSIGNMENT CARD
  // ----------------------------------------------------
  const openSubmissionModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setNote("");
    setSelectedFiles([]);
    setSubmissionModalVisible(true);
  };
 
  const renderItem = ({ item }: { item: AssignmentCombined }) => {
    const { assignment, submission } = item;
    const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
 
    return (
      <TouchableOpacity
        style={[styles.card, isOverdue && styles.cardOverdue]}
        disabled={!!submission}
        onPress={() => !submission && openSubmissionModal(assignment)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.subjectTag}>{assignment.subjectId}</Text>
          <Text
            style={[
              styles.statusTag,
              submission
                ? styles.statusSubmitted
                : isOverdue
                ? styles.statusOverdue
                : styles.statusPending,
            ]}
          >
            {submission ? submission.status : isOverdue ? "OVERDUE" : "PENDING"}
          </Text>
        </View>
 
        <Text style={styles.cardTitle}>{assignment.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {assignment.description}
        </Text>
 
        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text style={styles.dateText}> Due: {assignment.dueDate}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
 
  // ----------------------------------------------------
  // UI RENDER
  // ----------------------------------------------------
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }
 
  const pendingList = assignmentsList.filter(
    (a) => !a.submission || a.submission.status === "REJECTED"
  );
  const completedList = assignmentsList.filter(
    (a) => a.submission && a.submission.status !== "REJECTED"
  );
 
  const currentList = activeTab === "PENDING" ? pendingList : completedList;
 
  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Assignments</Text>
 
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "PENDING" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("PENDING")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "PENDING" && styles.tabTextActive,
            ]}
          >
            Pending
          </Text>
          {pendingList.length > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{pendingList.length}</Text>
            </View>
          )}
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "COMPLETED" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("COMPLETED")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "COMPLETED" && styles.tabTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>
 
      {/* List */}
      <FlatList
        data={currentList}
        renderItem={renderItem}
        keyExtractor={(item) => item.assignment.assignmentId}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
 
      {/* MODAL */}
      <Modal visible={submissionModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Assignment</Text>
              <TouchableOpacity
                onPress={() => setSubmissionModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
 
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.label}>Assignment</Text>
              <Text style={styles.value}>{selectedAssignment?.title}</Text>
 
              <Text style={styles.label}>Description</Text>
              <Text style={styles.descText}>
                {selectedAssignment?.description}
              </Text>
 
              <Text style={[styles.label, { marginTop: 15 }]}>Your Note</Text>
              <TextInput
                style={styles.inputArea}
                placeholder="Type your notes..."
                value={note}
                multiline
                onChangeText={setNote}
              />
 
              {/* Upload Files */}
              <TouchableOpacity style={styles.filePickBtn} onPress={pickFiles}>
                <Ionicons name="attach" size={20} color="#F97316" />
                <Text style={styles.filePickText}>
                  {selectedFiles.length > 0
                    ? `${selectedFiles.length} file(s) selected`
                    : "Upload Files"}
                </Text>
              </TouchableOpacity>
 
              {/* File List */}
              {selectedFiles.map((file, index) => (
                <Text key={index} style={styles.selectedFile}>
                  • {file.name}
                </Text>
              ))}
            </ScrollView>
 
            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSubmissionModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
 
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
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
 
// --------------------------------------------------
// STYLES
// --------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F3F4F6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  pageTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  tabContainer: {
    flexDirection: "row",
    padding: 4,
    marginBottom: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#FFF", borderRadius: 8 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#F97316" },
  badgeCount: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: { color: "#FFF", fontSize: 10 },
 
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },
  cardOverdue: { borderLeftColor: "#DC2626" },
 
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  subjectTag: { fontWeight: "bold", color: "#555" },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  statusPending: { backgroundColor: "#FEF3C7", color: "#D97706" },
  statusSubmitted: { backgroundColor: "#D1FAE5", color: "#059669" },
  statusOverdue: { backgroundColor: "#FEE2E2", color: "#DC2626" },
 
  cardTitle: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  cardDesc: { fontSize: 14, color: "#555", marginVertical: 4 },
 
  dateRow: { flexDirection: "row", gap: 6 },
  dateText: { color: "#666" },
 
  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  value: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  descText: { fontSize: 14, marginBottom: 12 },
 
  inputArea: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 12,
  },
 
  filePickBtn: {
    borderWidth: 1,
    borderColor: "#F97316",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  filePickText: { marginLeft: 8, color: "#F97316", fontWeight: "600" },
 
  selectedFile: { marginTop: 6, color: "#555" },
 
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 12,
  },
  cancelButton: { padding: 10 },
  cancelButtonText: { color: "#555" },
 
  submitButton: {
    backgroundColor: "#F97316",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#FFF", fontWeight: "700" },
});