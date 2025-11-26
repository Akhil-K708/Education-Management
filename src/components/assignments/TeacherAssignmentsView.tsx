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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
 
import {
  createAssignment,
  getAssignmentSubmissions,
  getTeacherAssignments,
  reviewSubmission,
} from "../../api/assignmentApi";
import { studentApi } from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { Assignment, AssignmentSubmission } from "../../types/assignment";
 
export default function TeacherAssignmentsView() {
  const { state } = useAuth();
  const user = state.user;
 
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
 
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [subjectsForClass, setSubjectsForClass] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
 
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("2025-11-30");
 
  const [selectedFile, setSelectedFile] = useState<any>(null);
 
  const [submissionsModalVisible, setSubmissionsModalVisible] = useState(false);
  const [currentSubmissions, setCurrentSubmissions] = useState<
    AssignmentSubmission[]
  >([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
 
  // -------- OPEN SERVER FILE --------
  const openAttachment = async (fileUrl: string) => {
    try {
      const fullUrl = `http://192.168.0.113:8080${fileUrl}`;
      await Linking.openURL(fullUrl);
    } catch (e) {
      Alert.alert("Error", "Could not open file");
    }
  };
 
  // -------- PICK DOCUMENT --------
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
      });
 
      if (result.canceled) return;
 
      const file = result.assets[0];
      setSelectedFile(file);
    } catch (err) {
      console.log("Document pick error", err);
    }
  };
 
  const fetchAssignments = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getTeacherAssignments(user.username);
 
      const sortedData = data.sort(
        (a, b) =>
          new Date(b.assignedDate).getTime() -
          new Date(a.assignedDate).getTime()
      );
 
      setAssignments(sortedData);
    } finally {
      setLoading(false);
    }
  };
 
  const fetchClasses = async () => {
    try {
      const res = await studentApi.get(
        `/teacher/assigned-classes/${user?.username}`
      );
      setAssignedClasses(res.data);
 
      if (res.data.length > 0) {
        fetchSubjects(res.data[0].classSectionId);
      }
    } catch (e) {
      console.log(e);
    }
  };
 
  const fetchSubjects = async (classId: string) => {
    try {
      setSelectedClass(classId);
 
      const res = await studentApi.get(`/subject/assign/${classId}`);
      setSubjectsForClass(res.data);
 
      if (res.data.length > 0) {
        setSelectedSubject(res.data[0].subjectId);
      }
    } catch (e) {
      console.log(e);
    }
  };
 
  useEffect(() => {
    fetchAssignments();
    fetchClasses();
  }, [user]);
 
  const handleCreate = async () => {
    if (!newTitle || !selectedClass || !selectedSubject) {
      Alert.alert("Error", "All required fields must be filled!");
      return;
    }
 
    try {
      const formData = new FormData();
 
      // -------- JSON PART (IMPORTANT FIX) --------
      const payload = {
        title: newTitle,
        description: newDesc,
        dueDate: newDueDate,
        priority: "MEDIUM",
      };
 
      if (Platform.OS === "web") {
        // Web needs Blob
        formData.append(
          "data",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } else {
        // Mobile needs { string: ... }
        formData.append("data", {
          name: "data.json",
          type: "application/json",
          string: JSON.stringify(payload),
        } as any);
      }
 
      // -------- FILE PART --------
      if (selectedFile) {
        if (Platform.OS === "web") {
          // On web, convert file to Blob
          const fileBlob = await fetch(selectedFile.uri).then((r) => r.blob());
 
          formData.append("file", fileBlob, selectedFile.name);
        } else {
          // Mobile
          formData.append("file", {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.mimeType || "application/octet-stream",
          } as any);
        }
      }
 
      // -------- SEND REQUEST --------
      await createAssignment(
        user?.username!,
        selectedSubject,
        selectedClass,
        formData
      );
 
      Alert.alert("Success", "Assignment created!");
 
      setCreateModalVisible(false);
      setSelectedFile(null);
      fetchAssignments();
    } catch (e) {
      console.log("Create assignment error:", e);
      Alert.alert("Error", "Failed to create assignment");
    }
  };
 
  // -------- VIEW SUBMISSIONS --------
  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignmentId(assignment.assignmentId);
    setSelectedSubjectId(assignment.subjectId);
 
    try {
      const subs = await getAssignmentSubmissions(
        assignment.assignmentId,
        assignment.subjectId
      );
      setCurrentSubmissions(subs);
      setSubmissionsModalVisible(true);
    } catch (e) {
      Alert.alert("Error", "Could not load submissions");
    }
  };
 
  const handleReview = async (
    sub: AssignmentSubmission,
    status: "APPROVED" | "REJECTED"
  ) => {
    try {
      await reviewSubmission(
        selectedAssignmentId,
        selectedSubjectId,
        sub.submissionNumber!,
        {
          status,
          remark: status === "APPROVED" ? "Good Job" : "Please redo",
          reviewedBy: user?.username!,
        }
      );
 
      const updated = currentSubmissions.map((s) =>
        s.submissionNumber === sub.submissionNumber ? { ...s, status } : s
      );
 
      setCurrentSubmissions(updated);
    } catch (e) {
      Alert.alert("Error", "Failed to update status");
    }
  };
 
  // -------- LOADING SCREEN --------
  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
 
  // ======================================================================
  //                                 UI
  // ======================================================================
 
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Assignments</Text>
 
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
 
      {/* ASSIGNMENTS LIST */}
      <FlatList
        data={assignments}
        keyExtractor={(item) => item.assignmentId}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
 
            {/* FILE VIEW */}
            {item.attachedFiles ? (
              <TouchableOpacity
                style={styles.fileButton}
                onPress={() => openAttachment(item.attachedFiles!)}
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color="#2563EB"
                />
                <Text style={styles.fileButtonText}>View Attachment</Text>
              </TouchableOpacity>
            ) : null}
 
            <Text style={styles.subtitle}>
              Class: {item.assignedTo} • Subject: {item.subjectId}
            </Text>
 
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
 
            <View style={styles.divider} />
 
            <TouchableOpacity
              style={styles.viewSubBtn}
              onPress={() => handleViewSubmissions(item)}
            >
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
 
            {/* CLASS PICK */}
            <Text style={styles.label}>Select Class:</Text>
            <View style={styles.pillContainer}>
              {assignedClasses.map((c) => (
                <TouchableOpacity
                  key={c.classSectionId}
                  style={[
                    styles.pill,
                    selectedClass === c.classSectionId && styles.pillActive,
                  ]}
                  onPress={() => fetchSubjects(c.classSectionId)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedClass === c.classSectionId &&
                        styles.pillTextActive,
                    ]}
                  >
                    {c.className}-{c.sectionName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
 
            {/* SUBJECT PICK */}
            <Text style={styles.label}>Select Subject:</Text>
            <View style={styles.pillContainer}>
              {subjectsForClass.map((s) => (
                <TouchableOpacity
                  key={s.subjectId}
                  style={[
                    styles.pill,
                    selectedSubject === s.subjectId && styles.pillActive,
                  ]}
                  onPress={() => setSelectedSubject(s.subjectId)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedSubject === s.subjectId && styles.pillTextActive,
                    ]}
                  >
                    {s.subjectName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
 
            {/* TITLE */}
            <Text style={styles.label}>Title:</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Ex: Chapter 1 Homework"
            />
 
            {/* DESCRIPTION */}
            <Text style={styles.label}>Description:</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Details..."
            />
 
            {/* FILE PICK */}
            <Text style={styles.label}>Attach File:</Text>
            <TouchableOpacity style={styles.filePickBtn} onPress={pickFile}>
              <Ionicons name="attach" size={18} color="#F97316" />
              <Text style={styles.filePickText}>
                {selectedFile ? selectedFile.name : "Choose File"}
              </Text>
            </TouchableOpacity>
 
            {/* BUTTONS */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => {
                  setCreateModalVisible(false);
                  setSelectedFile(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
 
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
                <Text style={styles.saveText}>Post Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
 
      {/* STUDENT SUBMISSIONS MODAL */}
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
            keyExtractor={(item) =>
              item.submissionNumber?.toString() || Math.random().toString()
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No submissions yet.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.subCard}>
                <View>
                  <Text style={styles.studentId}>
                    Student: {item.studentId}
                  </Text>
                  <Text style={styles.subNote}>{item.note}</Text>
 
                  {item.relatedLinks?.map((l, i) => (
                    <Text key={i} style={styles.linkText}>
                      {l}
                    </Text>
                  ))}
                </View>
 
                <View style={styles.actionCol}>
                  <Text
                    style={[
                      styles.statusBadge,
                      item.status === "APPROVED"
                        ? { color: "green" }
                        : item.status === "REJECTED"
                        ? { color: "red" }
                        : { color: "orange" },
                    ]}
                  >
                    {item.status}
                  </Text>
 
                  {item.status === "SUBMITTED" && (
                    <View
                      style={{ flexDirection: "row", gap: 10, marginTop: 8 }}
                    >
                      <TouchableOpacity
                        onPress={() => handleReview(item, "APPROVED")}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={28}
                          color="green"
                        />
                      </TouchableOpacity>
 
                      <TouchableOpacity
                        onPress={() => handleReview(item, "REJECTED")}
                      >
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
 
// ========================= STYLES =========================
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F3F4F6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
 
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
 
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
 
  addButton: {
    flexDirection: "row",
    backgroundColor: "#F97316",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
 
  addButtonText: { color: "#FFF", marginLeft: 4, fontWeight: "600" },
 
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { fontSize: 16, fontWeight: "bold" },
 
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  fileButtonText: {
    marginLeft: 6,
    color: "#2563EB",
    fontWeight: "600",
  },
 
  status: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "#FFF7ED",
    color: "#F97316",
    fontWeight: "bold",
  },
 
  subtitle: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  desc: { fontSize: 14, color: "#374151" },
 
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
 
  viewSubBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewSubText: { color: "#2563EB", fontWeight: "600" },
 
  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#FFF", padding: 20, borderRadius: 12 },
 
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  label: { marginTop: 10, fontWeight: "600" },
 
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
 
  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#999",
  },
  pillActive: { backgroundColor: "#F97316", borderColor: "#F97316" },
  pillText: { color: "#333" },
  pillTextActive: { color: "#FFF" },
 
  filePickBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F97316",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  filePickText: { marginLeft: 10, color: "#F97316" },
 
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelText: { marginRight: 20, color: "#555" },
  saveBtn: {
    backgroundColor: "#F97316",
    padding: 10,
    borderRadius: 8,
  },
  saveText: { color: "#FFF", fontWeight: "600" },
 
  // SUBMISSIONS
  fullScreenModal: { flex: 1, backgroundColor: "#F3F4F6" },
  fsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
  },
  fsTitle: { fontSize: 20, marginLeft: 10 },
 
  subCard: {
    backgroundColor: "#FFF",
    padding: 16,
    margin: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  studentId: { fontWeight: "bold" },
  subNote: { color: "#555", maxWidth: 220 },
  linkText: {
    color: "#2563EB",
    textDecorationLine: "underline",
  },
  actionCol: { alignItems: "flex-end" },
  statusBadge: { fontWeight: "bold", marginBottom: 6 },
 
  emptyText: { textAlign: "center", marginTop: 40, color: "#777" },
});