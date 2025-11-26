import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { getAllClassSections } from '../../api/adminApi';
import { getAllExams } from '../../api/examApi';
import { getClassExamResults, publishResult } from '../../api/resultsApi';

export default function AdminResultView() {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const numColumns = isWeb ? 3 : 1;

  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Detailed View Modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [viewClass, setViewClass] = useState<any>(null);
  const [classResults, setClassResults] = useState<any[]>([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
        const [examData, classData] = await Promise.all([
            getAllExams(),
            getAllClassSections()
        ]);
        // Sort exams (latest first) and classes (by name)
        setExams(examData.reverse());
        setClasses(classData.sort((a, b) => a.className.localeCompare(b.className, undefined, {numeric: true})));
        
        if (examData.length > 0) setSelectedExamId(examData[0].examId);
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  // --- ACTIONS ---

  const toggleClassSelection = (classId: string) => {
      if (selectedClassIds.includes(classId)) {
          setSelectedClassIds(prev => prev.filter(id => id !== classId));
      } else {
          setSelectedClassIds(prev => [...prev, classId]);
      }
  };

  const handleBulkPublish = async () => {
      if (!selectedExamId) { Alert.alert("Error", "Select an Exam"); return; }
      if (selectedClassIds.length === 0) { Alert.alert("Error", "Select at least one class"); return; }

      setPublishing(true);
      try {
          // Loop through selected classes and publish
          for (const classId of selectedClassIds) {
              await publishResult(selectedExamId, classId);
          }
          Alert.alert("Success", `Results Announced for ${selectedClassIds.length} Classes!`);
          setSelectedClassIds([]);
      } catch(e) {
          Alert.alert("Error", "Failed to publish results.");
      } finally {
          setPublishing(false);
      }
  };

  const handleViewClassResults = async (cls: any) => {
      if (!selectedExamId) { Alert.alert("Error", "Select an Exam first"); return; }
      
      setViewClass(cls);
      setDetailModalVisible(true);
      setResultLoading(true);
      try {
          const results = await getClassExamResults(selectedExamId, cls.classSectionId);
          setClassResults(results);
      } catch(e) {
          Alert.alert("Error", "Failed to fetch results");
      } finally {
          setResultLoading(false);
      }
  };

  const handleSinglePublish = async () => {
      if (!viewClass || !selectedExamId) return;
      setPublishing(true);
      try {
          await publishResult(selectedExamId, viewClass.classSectionId);
          Alert.alert("Success", `Results Announced for Class ${viewClass.className}-${viewClass.section}!`);
          setDetailModalVisible(false);
      } catch(e) {
          Alert.alert("Error", "Failed to publish.");
      } finally {
          setPublishing(false);
      }
  };

  // --- RENDERERS ---

  const renderClassItem = ({ item }: { item: any }) => {
      const isSelected = selectedClassIds.includes(item.classSectionId);
      return (
          <View style={[styles.itemContainer, isWeb && { width: `${100 / numColumns}%` }]}>
              <TouchableOpacity 
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => toggleClassSelection(item.classSectionId)}
                  activeOpacity={0.7}
              >
                  <View style={styles.cardHeader}>
                      <View style={styles.iconCircle}>
                          <Text style={styles.gradeText}>{item.className}</Text>
                      </View>
                      <View style={{flex: 1, marginLeft: 12}}>
                          <Text style={styles.cardTitle}>Class {item.className}-{item.section}</Text>
                          <Text style={styles.cardSub}>{item.classTeacherName || 'No CT'}</Text>
                      </View>
                      {isSelected ? (
                          <Ionicons name="checkbox" size={24} color="#2563EB" />
                      ) : (
                          <Ionicons name="square-outline" size={24} color="#D1D5DB" />
                      )}
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.cardActions}>
                      <Text style={styles.countText}>{item.currentStrength || 0} Students</Text>
                      <TouchableOpacity style={styles.viewBtn} onPress={() => handleViewClassResults(item)}>
                          <Text style={styles.viewBtnText}>View Results</Text>
                          <Ionicons name="eye-outline" size={16} color="#2563EB" />
                      </TouchableOpacity>
                  </View>
              </TouchableOpacity>
          </View>
      );
  };

  // Helper to get unique subjects from result list for table header
  const getUniqueSubjects = (): string[] => {
      if (classResults.length === 0) return [];
      // Assume first student has all subjects (or collect all unique)
      return classResults[0].subjects.map((s: any) => s.subjectName);
  };

  const uniqueSubjects = getUniqueSubjects();

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Result Management</Text>

      {/* --- 1. EXAM SELECTOR --- */}
      <View style={styles.filterCard}>
          <Text style={styles.label}>Select Examination:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.examScroll}>
              {exams.map(ex => (
                  <TouchableOpacity 
                      key={ex.examId} 
                      style={[styles.examChip, selectedExamId === ex.examId && styles.examChipActive]}
                      onPress={() => setSelectedExamId(ex.examId)}
                  >
                      <Text style={[styles.examText, selectedExamId === ex.examId && styles.examTextActive]}>
                          {ex.examName}
                      </Text>
                  </TouchableOpacity>
              ))}
          </ScrollView>
      </View>

      {/* --- 2. CLASSES GRID --- */}
      <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Select Classes to Publish</Text>
          <View style={{flexDirection:'row', gap: 10}}>
              {selectedClassIds.length > 0 && (
                  <TouchableOpacity 
                      style={styles.publishBtn} 
                      onPress={handleBulkPublish}
                      disabled={publishing}
                  >
                      {publishing ? <ActivityIndicator color="#FFF"/> : (
                          <>
                              <Ionicons name="megaphone-outline" size={18} color="#FFF" style={{marginRight: 6}}/>
                              <Text style={styles.publishBtnText}>Announce ({selectedClassIds.length})</Text>
                          </>
                      )}
                  </TouchableOpacity>
              )}
          </View>
      </View>

      {loading ? <ActivityIndicator size="large" color="#F97316" style={{marginTop: 20}}/> : (
          <FlatList
              data={classes}
              keyExtractor={item => item.classSectionId}
              renderItem={renderClassItem}
              numColumns={numColumns}
              key={numColumns} // Force re-render on layout change
              contentContainerStyle={{paddingBottom: 40}}
          />
      )}

      {/* --- 3. DETAILED RESULT MODAL --- */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, isWeb && { width: '90%', height: '90%' }]}>
                  
                  {/* Header */}
                  <View style={styles.modalHeader}>
                      <View>
                          <Text style={styles.modalTitle}>
                              Results: Class {viewClass?.className}-{viewClass?.section}
                          </Text>
                          <Text style={styles.modalSub}>{exams.find(e=>e.examId===selectedExamId)?.examName}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                          <Ionicons name="close-circle" size={30} color="#EF4444" />
                      </TouchableOpacity>
                  </View>

                  {/* Content */}
                  {resultLoading ? <ActivityIndicator size="large" color="#F97316" style={{flex:1}}/> : (
                      classResults.length === 0 ? (
                          <View style={styles.emptyState}>
                              <Ionicons name="document-text-outline" size={50} color="#D1D5DB" />
                              <Text style={styles.emptyText}>No marks entered for this class yet.</Text>
                          </View>
                      ) : (
                          <ScrollView horizontal>
                              <View>
                                  {/* Table Header */}
                                  <View style={[styles.row, styles.headerRow]}>
                                      <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Student Name</Text>
                                      {uniqueSubjects.map((sub: string, i: number) => (
                                          <Text key={i} style={[styles.cell, styles.subCell, styles.headerText]}>{sub}</Text>
                                      ))}
                                      <Text style={[styles.cell, styles.totalCell, styles.headerText]}>Total</Text>
                                      <Text style={[styles.cell, styles.rankCell, styles.headerText]}>Rank</Text>
                                  </View>
                                  
                                  {/* Table Body */}
                                  <ScrollView>
                                      {classResults.map((res, idx) => (
                                          <View key={idx} style={styles.row}>
                                              <Text style={[styles.cell, styles.nameCell]}>{res.studentName}</Text>
                                              {/* Map subjects to columns ensuring order */}
                                              {uniqueSubjects.map((subName: string) => {
                                                  const subResult = res.subjects.find((s: any) => s.subjectName === subName);
                                                  return (
                                                      <View key={subName} style={[styles.cell, styles.subCell]}>
                                                          <Text style={styles.marksText}>{subResult ? subResult.subjectTotalObtained : '-'}</Text>
                                                          <Text style={[styles.statusText, subResult?.status === 'FAIL' ? {color:'red'} : {color:'green'}]}>
                                                              {subResult ? subResult.status.charAt(0) : ''}
                                                          </Text>
                                                      </View>
                                                  );
                                              })}
                                              <Text style={[styles.cell, styles.totalCell, {fontWeight: 'bold'}]}>
                                                  {res.totalMarksObtained} / {res.totalMarksMax}
                                              </Text>
                                              <Text style={[styles.cell, styles.rankCell, {color: '#F97316', fontWeight: 'bold'}]}>
                                                  #{res.rank}
                                              </Text>
                                          </View>
                                      ))}
                                  </ScrollView>
                              </View>
                          </ScrollView>
                      )
                  )}

                  {/* Footer Actions */}
                  <View style={styles.modalFooter}>
                      <TouchableOpacity 
                          style={styles.publishFullBtn} 
                          onPress={handleSinglePublish}
                          disabled={publishing || classResults.length === 0}
                      >
                          {publishing ? <ActivityIndicator color="#FFF"/> : (
                              <Text style={styles.publishBtnText}>Announce Results for this Class</Text>
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
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  // Filters
  filterCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 20, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  examScroll: { flexDirection: 'row' },
  examChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  examChipActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  examText: { color: '#4B5563', fontWeight: '500' },
  examTextActive: { color: '#C2410C', fontWeight: 'bold' },

  // List Header
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  publishBtn: { backgroundColor: '#F97316', flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  publishBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  // Class Grid
  itemContainer: { padding: 6, marginBottom: 6 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2, borderWidth: 2, borderColor: 'transparent' },
  cardSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  cardSub: { fontSize: 12, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  countText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  viewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  viewBtnText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold', marginRight: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', height: '100%', borderRadius: 16, padding: 0, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalSub: { fontSize: 14, color: '#6B7280' },
  
  // Table
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', alignItems: 'center' },
  headerRow: { backgroundColor: '#F9FAFB' },
  cell: { padding: 12, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#F3F4F6' },
  headerText: { fontWeight: 'bold', color: '#374151' },
  
  nameCell: { width: 150, fontWeight: '600', color: '#1F2937' },
  subCell: { width: 80, alignItems: 'center' },
  totalCell: { width: 100, alignItems: 'center' },
  rankCell: { width: 60, alignItems: 'center' },
  
  marksText: { fontSize: 14, fontWeight: 'bold' },
  statusText: { fontSize: 10, fontWeight: 'bold' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 16 },

  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', alignItems: 'flex-end' },
  publishFullBtn: { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
});