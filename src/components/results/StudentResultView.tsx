import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { getAvailableExams, getExamResult } from '../../api/resultsApi';
import { useAuth } from '../../context/AuthContext';
import { ExamResultData } from '../../types/results';

export default function StudentResultView() {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isMobile = width < 768; 

  const [loading, setLoading] = useState(true);
  const [examsList, setExamsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [resultData, setResultData] = useState<ExamResultData | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const exams = await getAvailableExams();
      setExamsList(exams);
      if (exams.length > 0) {
        setSelectedExamId(exams[0].id);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    const fetchResult = async () => {
      setLoading(true);
      const data = await getExamResult(selectedExamId);
      setResultData(data);
      setLoading(false);
    };
    fetchResult();
  }, [selectedExamId]);

  if (loading && !resultData) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  const selectedExamName = examsList.find(e => e.id === selectedExamId)?.name || 'Select Exam';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.pageTitle}>My Results</Text>

      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Examination:</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setIsDropdownVisible(true)}
        >
          <Text style={styles.dropdownButtonText}>{selectedExamName}</Text>
          <Ionicons name="chevron-down" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <Modal visible={isDropdownVisible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            {examsList.map((exam) => (
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
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {resultData && (
        <>
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>No. of Subjects</Text>
              <Text style={styles.summaryValue}>{resultData.stats.noOfSubjects}</Text>
            </View>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>Total Marks</Text>
              <Text style={styles.summaryValue}>{resultData.stats.totalMarksObtained}</Text>
            </View>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>Percentage</Text>
              <Text style={styles.summaryValue}>{resultData.stats.percentage}</Text>
            </View>
            <View style={[styles.summaryCard, !isMobile && styles.summaryCardWeb]}>
              <Text style={styles.summaryLabel}>Rank</Text>
              <Text style={styles.summaryValue}>{resultData.stats.rank}</Text>
            </View>
          </View>

          <View style={styles.tableWrapper}>
            <ScrollView 
              horizontal={isMobile} 
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={!isMobile ? { width: '100%' } : {}}
            >
              <View style={!isMobile ? { width: '100%' } : {}}>
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
                      <Text style={[
                        styles.statusText,
                        sub.status === 'Pass' ? styles.passText : styles.failText
                      ]}>
                        {sub.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerMessage}>
              {resultData.finalMessage}
            </Text>
            
            <View style={styles.footerScore}>
              <Text style={styles.footerScoreText}>
                {resultData.stats.totalMarksObtained} / {resultData.stats.maxTotalMarks}
              </Text>
              <Text style={styles.footerScoreLabel}>Obtained / Total</Text>
            </View>
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
  dropdownButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', minWidth: 150, justifyContent: 'space-between' },
  dropdownButtonText: { fontSize: 16, color: '#111827' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', maxWidth: 300, borderRadius: 12, padding: 10, elevation: 5 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontSize: 16, color: '#374151' },
  modalItemTextSelected: { color: '#F97316', fontWeight: 'bold' },
  summaryContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  summaryCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  summaryCardWeb: { width: '23.5%', marginBottom: 0 },
  summaryLabel: { fontSize: 13, color: '#6B7280', marginBottom: 5, textAlign: 'center' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  tableWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, elevation: 2, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  headerCell: { padding: 12, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  cell: { padding: 12, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  headerText: { fontSize: 12, fontWeight: 'bold', color: '#374151', textAlign: 'center' },
  cellText: { fontSize: 13, color: '#1F2937' },
  cellTextSubject: { fontSize: 14, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  colSubject: { width: 120 }, colNum: { width: 80 }, colStatus: { width: 90, borderRightWidth: 0 },
  webColSubject: { flex: 2 }, webColNum: { flex: 1 }, webColStatus: { flex: 1, borderRightWidth: 0 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  passText: { color: '#10B981' }, failText: { color: '#EF4444' },
  footerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  footerMessage: { flex: 1, fontSize: 14, color: '#4B5563', fontStyle: 'italic', marginRight: 10 },
  footerScore: { alignItems: 'center', borderWidth: 1, borderColor: '#111827', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  footerScoreText: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  footerScoreLabel: { fontSize: 10, color: '#6B7280' },
});