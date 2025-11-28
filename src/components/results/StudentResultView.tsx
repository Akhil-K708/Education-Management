import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { getAvailableExams, getStudentExamResult } from '../../api/resultsApi';
import { getStudentProfile } from '../../api/studentService';
import { useAuth } from '../../context/AuthContext';
import { ExamResultData } from '../../types/results';

export default function StudentResultView() {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isMobile = width < 768; 

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [examsList, setExamsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [classSectionId, setClassSectionId] = useState<string>('');
  
  const [resultData, setResultData] = useState<ExamResultData | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- 1. INITIAL DATA FETCH ---
  const fetchInitialData = async () => {
    if (!user?.username) return;
    setLoading(true);
    try {
      const profile = await getStudentProfile(user.username);
      if (profile.classSectionId) {
          setClassSectionId(profile.classSectionId);
          const exams = await getAvailableExams();
          setExamsList(exams);
          
          if (exams.length > 0) {
             setSelectedExamId(exams[0].id);
          }
      } else {
          setErrorMsg("Class section not assigned.");
      }
    } catch (e) {
      console.error("Error loading initial data", e);
      setErrorMsg("Failed to load profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  // --- 2. FETCH RESULT WHEN EXAM CHANGES ---
  useEffect(() => {
    if (!selectedExamId || !classSectionId || !user?.username) return;
    
    const fetchResult = async () => {
      setLoading(true);
      setErrorMsg(null);
      setResultData(null);
      
      try {
        const data = await getStudentExamResult(selectedExamId, user.username, classSectionId);
        if (data) {
            setResultData(data);
        } else {
            // 🔥 FIX: If data is null (meaning 403 or empty), show friendly message
            setErrorMsg("Results not yet published for this exam.");
        }
      } catch (e) {
        setErrorMsg("Could not fetch results.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchResult();
  }, [selectedExamId, classSectionId]);

  const onRefresh = () => {
      setRefreshing(true);
      if (selectedExamId && classSectionId) {
          getStudentExamResult(selectedExamId, user!.username, classSectionId)
            .then(data => {
                if (data) setResultData(data);
                else {
                    setResultData(null);
                    setErrorMsg("Results not yet published.");
                }
                setRefreshing(false);
            })
            .catch(() => setRefreshing(false));
      } else {
          fetchInitialData();
      }
  };

  const selectedExamName = examsList.find(e => e.id === selectedExamId)?.name || 'Select Exam';

  if (loading && !refreshing && !resultData) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>My Results</Text>

      {/* EXAM SELECTOR */}
      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Examination:</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsDropdownVisible(true)}
          disabled={examsList.length === 0}
        >
          <Text style={styles.dropdownButtonText}>{selectedExamName}</Text>
          <Ionicons name="chevron-down" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* EXAM SELECTION MODAL */}
      <Modal visible={isDropdownVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            {examsList.length > 0 ? examsList.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedExamId(exam.id);
                  setIsDropdownVisible(false);
                }}
              >
                <Text style={[
                  styles.modalItemText, 
                  selectedExamId === exam.id && styles.modalItemTextSelected
                ]}>
                  {exam.name}
                </Text>
                {selectedExamId === exam.id && (
                  <Ionicons name="checkmark" size={20} color="#F97316" />
                )}
              </TouchableOpacity>
            )) : (
                <Text style={{padding: 20, textAlign: 'center', color: '#6B7280'}}>No exams found</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 🔥 FIX: ERROR MESSAGE DISPLAY */}
      {errorMsg && !resultData && !loading && (
          <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
              <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
      )}

      {/* RESULT DISPLAY */}
      {resultData && (
        <>
          {/* SUMMARY CARDS */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>No. of Subjects</Text>
              <Text style={styles.summaryValue}>{resultData.stats.noOfSubjects}</Text>
            </View>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>Total Marks</Text>
              <Text style={styles.summaryValue}>{resultData.stats.totalMarksObtained} / {resultData.stats.maxTotalMarks}</Text>
            </View>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>Percentage</Text>
              <Text style={[styles.summaryValue, {color: '#2563EB'}]}>{resultData.stats.percentage}</Text>
            </View>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>Rank</Text>
              <Text style={[styles.summaryValue, {color: '#F97316'}]}>{resultData.stats.rank}</Text>
            </View>
          </View>

          {/* MARKS TABLE */}
          <View style={styles.tableWrapper}>
            <ScrollView 
              horizontal={isMobile} 
              showsHorizontalScrollIndicator={isMobile}
              contentContainerStyle={isMobile ? {flexGrow: 1} : {width: '100%'}}
            >
              <View style={{minWidth: isMobile ? 600 : '100%', width: '100%'}}>
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.headerCell, isMobile ? styles.colSubject : styles.webColSubject]}>
                    <Text style={styles.headerText}>Subject</Text>
                  </View>
                  <View style={[styles.headerCell, isMobile ? styles.colNum : styles.webColNum]}>
                    <Text style={styles.headerText}>Paper{'\n'}Obt</Text>
                  </View>
                  <View style={[styles.headerCell, isMobile ? styles.colNum : styles.webColNum]}>
                    <Text style={styles.headerText}>Total{'\n'}Paper</Text>
                  </View>
                  <View style={[styles.headerCell, isMobile ? styles.colNum : styles.webColNum]}>
                    <Text style={styles.headerText}>Assign{'\n'}Obt</Text>
                  </View>
                  <View style={[styles.headerCell, isMobile ? styles.colNum : styles.webColNum]}>
                    <Text style={styles.headerText}>Total{'\n'}Assign</Text>
                  </View>
                  <View style={[styles.headerCell, isMobile ? styles.colNum : styles.webColNum]}>
                    <Text style={styles.headerText}>Total{'\n'}Sub</Text>
                  </View>
                  <View style={[styles.headerCell, isMobile ? styles.colStatus : styles.webColStatus]}>
                    <Text style={styles.headerText}>Pass/{'\n'}Fail</Text>
                  </View>
                </View>

                {resultData.subjects.map((sub) => (
                  <View key={sub.id} style={styles.tableRow}>
                    <View style={[styles.cell, isMobile ? styles.colSubject : styles.webColSubject]}>
                      <Text style={styles.cellTextSubject}>{sub.subjectName}</Text>
                    </View>
                    <View style={[styles.cell, isMobile ? styles.colNum : styles.webColNum]}>
                      <Text style={styles.cellText}>{sub.paperObtained}</Text>
                    </View>
                    <View style={[styles.cell, isMobile ? styles.colNum : styles.webColNum]}>
                      <Text style={styles.cellText}>{sub.paperTotal}</Text>
                    </View>
                    <View style={[styles.cell, isMobile ? styles.colNum : styles.webColNum]}>
                      <Text style={styles.cellText}>{sub.assignmentObtained}</Text>
                    </View>
                    <View style={[styles.cell, isMobile ? styles.colNum : styles.webColNum]}>
                      <Text style={styles.cellText}>{sub.assignmentTotal}</Text>
                    </View>
                    <View style={[styles.cell, isMobile ? styles.colNum : styles.webColNum]}>
                      <Text style={[styles.cellText, { fontWeight: 'bold' }]}>
                        {sub.totalObtained}/{sub.totalMax}
                      </Text>
                    </View>
                    <View style={[styles.cell, isMobile ? styles.colStatus : styles.webColStatus]}>
                      <View style={[
                          styles.statusBadge, 
                          sub.status === 'PASS' ? styles.passBadge : styles.failBadge
                      ]}>
                          <Text style={[
                            styles.statusText,
                            sub.status === 'PASS' ? styles.passText : styles.failText
                          ]}>
                            {sub.status}
                          </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerLabel}>Remarks:</Text>
            <Text style={styles.footerMessage}>
              {resultData.finalMessage}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  
  dropdownContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dropdownLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginRight: 10 },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', minWidth: 180, justifyContent: 'space-between' },
  dropdownButtonText: { fontSize: 16, color: '#111827' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', maxWidth: 300, borderRadius: 12, padding: 10, elevation: 5 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontSize: 16, color: '#374151' },
  modalItemTextSelected: { color: '#F97316', fontWeight: 'bold' },
  
  summaryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  summaryCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  summaryCardWeb: { width: '23%' },
  summaryLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', fontWeight: '600' },
  summaryValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  
  tableWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF', alignItems: 'center' },
  
  headerCell: { padding: 12, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  cell: { padding: 12, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  headerText: { fontSize: 11, fontWeight: 'bold', color: '#374151', textAlign: 'center', textTransform: 'uppercase' },
  cellText: { fontSize: 13, color: '#1F2937' },
  cellTextSubject: { fontSize: 14, fontWeight: '600', color: '#111827', textTransform: 'capitalize', textAlign: 'left' },
  
  colSubject: { width: 140, alignItems: 'flex-start' }, 
  colNum: { width: 70 }, 
  colStatus: { width: 90, borderRightWidth: 0 },

  webColSubject: { flex: 2, alignItems: 'flex-start' },
  webColNum: { flex: 1 },
  webColStatus: { flex: 1, borderRightWidth: 0 },
  
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  passBadge: { backgroundColor: '#D1FAE5' },
  failBadge: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  passText: { color: '#059669' }, 
  failText: { color: '#DC2626' },
  
  footerContainer: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  footerLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  footerMessage: { fontSize: 16, color: '#4B5563', fontStyle: 'italic', lineHeight: 22 },
  
  errorContainer: { alignItems: 'center', marginTop: 50 },
  errorText: { marginTop: 10, color: '#6B7280', fontSize: 16 },
});