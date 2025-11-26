import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  useWindowDimensions,
  View
} from 'react-native';
import { getAllClassSections } from '../../src/api/adminApi';
import { assignFeesBulk, CreateFeeRequest, getAdminFeeStats, getClassFeeStatus } from '../../src/api/feesApi';
import { useAuth } from '../../src/context/AuthContext';
import { ClassFeeStatsDTO, StudentFeeStatusDTO } from '../../src/types/fees';

// --- WEB DATE INPUT ---
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

// --- SORTING HELPER ---
const sortClasses = (data: ClassFeeStatsDTO[]) => {
    return data.sort((a, b) => {
        // Extract numbers from Class Name (e.g. "10" from "Class 10")
        const numA = parseInt(a.className.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.className.replace(/\D/g, '')) || 0;

        if (numA !== numB) {
            return numA - numB; // Sort numerically
        }
        
        // If class numbers are same, sort by Section (A, B, C)
        return a.section.localeCompare(b.section);
    });
};

export default function AccountScreen() {
  const { state } = useAuth();
  const user = state.user;
  
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  // Changed to 3 columns for compact view on Web
  const numColumns = isWeb ? 3 : 1;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats Data
  const [classStats, setClassStats] = useState<ClassFeeStatsDTO[]>([]);
  const [totalSchoolStats, setTotalSchoolStats] = useState({ expected: 0, collected: 0, pending: 0 });

  // View Class Modal
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedClassView, setSelectedClassView] = useState<ClassFeeStatsDTO | null>(null);
  const [studentList, setStudentList] = useState<StudentFeeStatusDTO[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Assign Fee Modal
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [classList, setClassList] = useState<any[]>([]);
  const [assignStep, setAssignStep] = useState(1); // 1: Details, 2: Student List customization
  const [assignLoading, setAssignLoading] = useState(false);

  // Assign Form Data
  const [selectedClassId, setSelectedClassId] = useState('');
  const [feeName, setFeeName] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fee Logic
  const [feeType, setFeeType] = useState<'FIXED' | 'PERCENTAGE'>('PERCENTAGE');
  const [fixedAmount, setFixedAmount] = useState('');
  const [percentage, setPercentage] = useState(''); 

  // Custom Student Amounts
  const [studentCustomization, setStudentCustomization] = useState<Record<string, { name: string, totalFee: number, amount: string, selected: boolean }>>({});

  useEffect(() => {
    if (user?.role === 'ADMIN') {
        fetchData();
        fetchClasses();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
        const data = await getAdminFeeStats();
        let exp = 0, col = 0, pen = 0;
        data.forEach(c => {
            exp += c.totalExpectedFee || 0;
            col += c.totalCollectedFee || 0;
            pen += c.totalPendingFee || 0;
        });
        
        // Apply Sorting
        const sortedData = sortClasses(data);

        setClassStats(sortedData);
        setTotalSchoolStats({ expected: exp, collected: col, pending: pen });
    } catch(e) { console.error(e); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchClasses = async () => {
      try {
          const classes = await getAllClassSections();
          // Sort for Dropdown
          const sorted = classes.sort((a, b) => {
             const numA = parseInt(a.className.replace(/\D/g, '')) || 0;
             const numB = parseInt(b.className.replace(/\D/g, '')) || 0;
             if(numA !== numB) return numA - numB;
             return a.section.localeCompare(b.section);
          });
          setClassList(sorted);
      } catch(e) { console.error(e); }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- VIEW CLASS DETAILS ---
  const handleClassPress = async (cls: ClassFeeStatsDTO) => {
      setSelectedClassView(cls);
      setViewModalVisible(true);
      setListLoading(true);
      try {
          const students = await getClassFeeStatus(cls.classSectionId);
          setStudentList(students.sort((a, b) => b.balanceAmount - a.balanceAmount));
      } catch(e) { console.error(e); } 
      finally { setListLoading(false); }
  };

  // --- ASSIGN FEE LOGIC ---
  const handleNextStep = async () => {
      if (!selectedClassId || !feeName) {
          Alert.alert("Error", "Please fill Class and Fee Name");
          return;
      }
      if (feeType === 'FIXED' && !fixedAmount) {
          Alert.alert("Error", "Please enter amount");
          return;
      }
      if (feeType === 'PERCENTAGE' && !percentage) {
          Alert.alert("Error", "Please enter percentage (e.g. 50 for half term)");
          return;
      }

      setAssignLoading(true);
      try {
          const students = await getClassFeeStatus(selectedClassId);
          const initialData: any = {};
          
          students.forEach((s) => {
              let calcAmount = 0;
              if (feeType === 'FIXED') {
                  calcAmount = parseFloat(fixedAmount);
              } else {
                  const total = s.totalFee || 0;
                  const percent = parseFloat(percentage);
                  calcAmount = Math.round((total * percent) / 100);
              }

              initialData[s.studentId] = { 
                  name: s.studentName, 
                  totalFee: s.totalFee || 0,
                  amount: calcAmount.toString(), 
                  selected: true 
              };
          });
          
          setStudentCustomization(initialData);
          setAssignStep(2);
      } catch(e) {
          Alert.alert("Error", "Failed to load students");
      } finally {
          setAssignLoading(false);
      }
  };

  const toggleStudentSelection = (id: string) => {
      setStudentCustomization(prev => ({
          ...prev,
          [id]: { ...prev[id], selected: !prev[id].selected }
      }));
  };

  const updateStudentAmount = (id: string, amt: string) => {
      setStudentCustomization(prev => ({
          ...prev,
          [id]: { ...prev[id], amount: amt }
      }));
  };

  const handleSubmitAssignment = async () => {
      const payload: CreateFeeRequest[] = [];
      Object.keys(studentCustomization).forEach(id => {
          const item = studentCustomization[id];
          if (item.selected && item.amount) {
              payload.push({
                  studentId: id,
                  feeName: feeName,
                  amount: parseFloat(item.amount),
                  dueDate: dueDate.toISOString().split('T')[0]
              });
          }
      });

      if (payload.length === 0) {
          Alert.alert("Error", "No students selected");
          return;
      }

      setAssignLoading(true);
      try {
          await assignFeesBulk(payload);
          Alert.alert("Success", `Fee Assigned to ${payload.length} Students!`);
          setAssignModalVisible(false);
          resetAssignForm();
          fetchData();
      } catch(e) {
          Alert.alert("Error", "Failed to assign fees");
      } finally {
          setAssignLoading(false);
      }
  };

  const resetAssignForm = () => {
      setAssignStep(1);
      setSelectedClassId('');
      setFeeName('');
      setFixedAmount('');
      setPercentage('');
      setFeeType('PERCENTAGE');
      setDueDate(new Date());
      setStudentCustomization({});
  };

  // --- RENDERERS ---

  const renderOverviewCard = (title: string, amount: number, color: string, icon: any) => (
      <View style={[styles.statCard, {borderLeftColor: color}]}>
          <View style={[styles.iconBox, {backgroundColor: color + '15'}]}>
              <Ionicons name={icon} size={24} color={color} />
          </View>
          <View>
              <Text style={styles.statLabel}>{title}</Text>
              <Text style={[styles.statValue, {color: color}]}>₹{amount.toLocaleString()}</Text>
          </View>
      </View>
  );

  const renderClassItem = ({ item }: { item: ClassFeeStatsDTO }) => {
      const percentage = item.totalExpectedFee > 0 
        ? (item.totalCollectedFee / item.totalExpectedFee) * 100 
        : 0;
      
      const progressColor = percentage >= 80 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444';

      return (
        <TouchableOpacity 
            style={styles.modernCard} 
            onPress={() => handleClassPress(item)}
            activeOpacity={0.9}
        >
            <View style={styles.cardTop}>
                <View style={styles.avatarWrapper}>
                    <View style={[styles.modernAvatar, {backgroundColor: '#EEF2FF'}]}>
                        <Text style={styles.avatarText}>{item.className}</Text>
                    </View>
                </View>
                <View style={styles.infoColumn}>
                    <Text style={styles.cardTitle}>Class {item.className}-{item.section}</Text>
                    {item.totalPendingFee > 0 ? (
                        <View style={[styles.badge, {backgroundColor: '#FEF3C7'}]}>
                            <Text style={[styles.badgeText, {color: '#D97706'}]}>
                                Due: ₹{item.totalPendingFee.toLocaleString()}
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.badge, {backgroundColor: '#D1FAE5'}]}>
                            <Text style={[styles.badgeText, {color: '#059669'}]}>
                                All Clear
                            </Text>
                        </View>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.progressContainer}>
                <View style={styles.rowBetween}>
                    <Text style={styles.progressLabel}>Collection</Text>
                    <Text style={[styles.progressValue, {color: progressColor}]}>{percentage.toFixed(0)}%</Text>
                </View>
                <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
                </View>
                <View style={styles.rowBetween}>
                    <Text style={styles.miniValue}>₹{item.totalCollectedFee.toLocaleString()} Paid</Text>
                    <Text style={styles.miniValue}>Total: ₹{item.totalExpectedFee.toLocaleString()}</Text>
                </View>
            </View>
        </TouchableOpacity>
      );
  };

  const renderAssignModal = () => (
      <Modal visible={assignModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContentLarge}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Assign Fee {assignStep === 2 && `(Review)`}</Text>
                      <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#374151" />
                      </TouchableOpacity>
                  </View>

                  {assignStep === 1 ? (
                      <ScrollView>
                          <Text style={styles.label}>Fee Name</Text>
                          <TextInput style={styles.input} value={feeName} onChangeText={setFeeName} placeholder="e.g. Term 1 Fee" />

                          <Text style={styles.label}>Select Class</Text>
                          <ScrollView horizontal style={styles.chipScroll}>
                              {classList.map(cls => (
                                  <TouchableOpacity 
                                      key={cls.classSectionId}
                                      style={[styles.chip, selectedClassId === cls.classSectionId && styles.chipActive]}
                                      onPress={() => setSelectedClassId(cls.classSectionId)}
                                  >
                                      <Text style={[styles.chipText, selectedClassId === cls.classSectionId && styles.chipTextActive]}>
                                          {cls.className}-{cls.section}
                                      </Text>
                                  </TouchableOpacity>
                              ))}
                          </ScrollView>

                          <Text style={styles.label}>Calculation Method</Text>
                          <View style={styles.radioRow}>
                              <TouchableOpacity 
                                style={[styles.radioBtn, feeType === 'PERCENTAGE' && styles.radioActive]} 
                                onPress={() => setFeeType('PERCENTAGE')}
                              >
                                  <Text style={[styles.radioText, feeType === 'PERCENTAGE' && styles.radioTextActive]}>% of Total Fee</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[styles.radioBtn, feeType === 'FIXED' && styles.radioActive]} 
                                onPress={() => setFeeType('FIXED')}
                              >
                                  <Text style={[styles.radioText, feeType === 'FIXED' && styles.radioTextActive]}>Fixed Amount</Text>
                              </TouchableOpacity>
                          </View>

                          {feeType === 'FIXED' ? (
                              <>
                                <Text style={styles.label}>Amount (₹)</Text>
                                <TextInput style={styles.input} value={fixedAmount} onChangeText={setFixedAmount} placeholder="e.g. 2000 (Uniform/Books)" keyboardType="numeric" />
                              </>
                          ) : (
                              <>
                                <Text style={styles.label}>Percentage of Total Fee (%)</Text>
                                <TextInput style={styles.input} value={percentage} onChangeText={setPercentage} placeholder="e.g. 33.3 (For 1st Term)" keyboardType="numeric" />
                                <Text style={styles.hintText}>* Calculates based on each student's admission fee.</Text>
                              </>
                          )}

                          <Text style={styles.label}>Due Date</Text>
                          {Platform.OS === 'web' ? (
                              <WebDateInput value={dueDate} onChange={setDueDate} />
                          ) : (
                              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                                  <Text>{dueDate.toISOString().split('T')[0]}</Text>
                                  <Ionicons name="calendar" size={20} color="#6B7280" />
                              </TouchableOpacity>
                          )}
                          {showDatePicker && (
                              <DateTimePicker value={dueDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setDueDate(d); }} />
                          )}

                          <TouchableOpacity style={styles.primaryBtn} onPress={handleNextStep} disabled={assignLoading}>
                              {assignLoading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Next: Review Students</Text>}
                          </TouchableOpacity>
                      </ScrollView>
                  ) : (
                      <View style={{flex: 1}}>
                          <View style={styles.infoBanner}>
                              <Ionicons name="information-circle" size={20} color="#2563EB" />
                              <Text style={styles.infoText}>Review amounts. Uncheck to exclude students.</Text>
                          </View>
                          
                          <View style={styles.tableHeader}>
                              <Text style={[styles.th, {flex: 1.5}]}>Student</Text>
                              <Text style={[styles.th, {flex: 1, textAlign: 'right'}]}>Total Fee</Text>
                              <Text style={[styles.th, {width: 90, textAlign: 'center'}]}>Assign</Text>
                          </View>

                          <FlatList 
                              data={Object.keys(studentCustomization)}
                              keyExtractor={id => id}
                              contentContainerStyle={{paddingBottom: 20}}
                              renderItem={({item: id}) => {
                                  const data = studentCustomization[id];
                                  return (
                                      <View style={[styles.studentRow, !data.selected && {opacity: 0.5}]}>
                                          <TouchableOpacity style={styles.checkbox} onPress={() => toggleStudentSelection(id)}>
                                              <Ionicons name={data.selected ? "checkbox" : "square-outline"} size={24} color={data.selected ? "#2563EB" : "#9CA3AF"} />
                                          </TouchableOpacity>
                                          <View style={{flex: 1.5, paddingRight: 5}}>
                                              <Text style={styles.rowTitle} numberOfLines={1}>{data.name}</Text>
                                              <Text style={styles.rowSub}>{id}</Text>
                                          </View>
                                          <View style={{flex: 1, alignItems: 'flex-end', paddingRight: 10}}>
                                              <Text style={styles.totalFeeText}>₹{data.totalFee.toLocaleString()}</Text>
                                          </View>
                                          <TextInput 
                                              style={styles.amountInput} 
                                              value={data.amount} 
                                              onChangeText={t => updateStudentAmount(id, t)}
                                              keyboardType="numeric"
                                              editable={data.selected}
                                          />
                                      </View>
                                  );
                              }}
                          />
                          
                          <View style={styles.footerBtns}>
                              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAssignStep(1)}>
                                  <Text style={styles.secondaryBtnText}>Back</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.primaryBtn, {flex: 1, marginTop: 0}]} onPress={handleSubmitAssignment} disabled={assignLoading}>
                                  {assignLoading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.btnText}>Confirm Assignment</Text>}
                              </TouchableOpacity>
                          </View>
                      </View>
                  )}
              </View>
          </View>
      </Modal>
  );

  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB"/></View>;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Accounts & Fee</Text>
          <TouchableOpacity style={styles.assignBtn} onPress={() => { resetAssignForm(); setAssignModalVisible(true); }}>
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.btnText}>Assign Fee</Text>
          </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
          {/* OVERVIEW */}
          <View style={[styles.statsContainer, isWeb && styles.statsContainerWeb]}>
              {renderOverviewCard("Total Expected", totalSchoolStats.expected, "#2563EB", "wallet-outline")}
              {renderOverviewCard("Collected", totalSchoolStats.collected, "#10B981", "checkmark-circle-outline")}
              {renderOverviewCard("Pending", totalSchoolStats.pending, "#EF4444", "alert-circle-outline")}
          </View>

          <Text style={styles.sectionTitle}>Class Performance</Text>
          
          {/* GRID LAYOUT */}
          <View style={styles.gridContainer}>
              {classStats.map(item => (
                  <View key={item.classSectionId} style={[styles.gridItem, isWeb && {width: '32%'}]}>
                      {renderClassItem({ item })}
                  </View>
              ))}
          </View>
      </ScrollView>

      {renderAssignModal()}

      {/* DETAILS MODAL */}
      <Modal visible={viewModalVisible} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainerFull}>
              <View style={styles.modalHeader}>
                  <View>
                      <Text style={styles.modalTitle}>
                          Class {selectedClassView?.className}-{selectedClassView?.section}
                      </Text>
                      <Text style={styles.modalSub}>Fee Status Report</Text>
                  </View>
                  <TouchableOpacity onPress={() => setViewModalVisible(false)} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
              </View>

              {listLoading ? (
                  <View style={styles.centered}><ActivityIndicator size="large" color="#2563EB"/></View>
              ) : (
                  <FlatList
                      data={studentList}
                      keyExtractor={item => item.studentId}
                      contentContainerStyle={{ padding: 16 }}
                      ListEmptyComponent={<Text style={styles.emptyText}>No students found.</Text>}
                      renderItem={({ item }) => (
                          <View style={styles.studentListRow}>
                              <View style={{flex: 1}}>
                                  <Text style={styles.stName}>{item.studentName}</Text>
                                  <Text style={styles.stRoll}>{item.studentId}</Text>
                              </View>
                              <View style={{alignItems: 'flex-end'}}>
                                  <Text style={[
                                      styles.stStatus, 
                                      item.status === 'PAID' ? {color: '#059669'} : {color: '#DC2626'}
                                  ]}>{item.status}</Text>
                                  <Text style={styles.stDue}>Total: ₹{item.totalFee.toLocaleString()}</Text>
                                  {item.balanceAmount > 0 && (
                                      <Text style={[styles.stDue, {color: '#EF4444', fontWeight: 'bold'}]}>Due: ₹{item.balanceAmount.toLocaleString()}</Text>
                                  )}
                              </View>
                          </View>
                      )}
                  />
              )}
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  assignBtn: { flexDirection: 'row', backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center', elevation: 2 },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6, fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 12, marginTop: 8 },

  // Stats
  statsContainer: { flexDirection: 'column', gap: 12, marginBottom: 24 },
  statsContainerWeb: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, borderLeftWidth: 4 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  statLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: 'bold' },

  // Grid System
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '100%', padding: 6 },

  // Modern Card
  modernCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatarWrapper: { marginRight: 12 },
  modernAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  infoColumn: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  
  progressContainer: {},
  progressLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  progressValue: { fontSize: 12, fontWeight: 'bold' },
  progressBg: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, width: '100%', overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  miniValue: { fontSize: 11, color: '#4B5563', fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContentLarge: { backgroundColor: '#FFF', width: '100%', maxWidth: 550, borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalContainerFull: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalSub: { fontSize: 14, color: '#6B7280' },
  closeBtn: { padding: 4 },

  // Form
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' },
  hintText: { fontSize: 11, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  chipScroll: { flexDirection: 'row', marginBottom: 10, maxHeight: 50 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8, backgroundColor: '#FFF' },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#2563EB', fontWeight: 'bold' },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB' },
  radioRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  radioBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, alignItems: 'center', backgroundColor: '#FFF' },
  radioActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  radioText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  radioTextActive: { color: '#2563EB', fontWeight: 'bold' },
  
  primaryBtn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  secondaryBtn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 0, borderWidth: 1, borderColor: '#D1D5DB', width: 80 },
  secondaryBtnText: { color: '#374151', fontWeight: '600' },
  footerBtns: { flexDirection: 'row', gap: 12, marginTop: 20, alignItems: 'center' },

  // Assign List
  infoBanner: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  infoText: { marginLeft: 8, fontSize: 12, color: '#1E40AF', flex: 1 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 8 },
  th: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase' },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  checkbox: { padding: 4 },
  rowTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  rowSub: { fontSize: 12, color: '#9CA3AF' },
  totalFeeText: { fontSize: 12, color: '#4B5563' },
  amountInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 6, width: 90, textAlign: 'center', fontSize: 14, fontWeight: 'bold' },

  // Student View
  studentListRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
  stName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  stRoll: { fontSize: 13, color: '#9CA3AF' },
  stStatus: { fontSize: 13, fontWeight: 'bold' },
  stDue: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontStyle: 'italic' },
});