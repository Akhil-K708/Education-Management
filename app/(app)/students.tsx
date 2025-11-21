import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import {
  AdmissionDTO,
  approveAdmission,
  ClassSectionDTO,
  getAllClassSections,
  getAllStudents,
  getPendingAdmissions,
  rejectAdmission,
  StudentDTO,
  submitAdmission
} from '../../src/api/adminApi';
import { useAuth } from '../../src/context/AuthContext';

// --- HELPER COMPONENTS ---
const InputField = ({ label, value, onChange, placeholder, keyboardType = 'default' }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      keyboardType={keyboardType}
    />
  </View>
);

const WebDateInput = ({ value, onChange }: { value: Date, onChange: (d: string) => void }) => {
  return React.createElement('input', {
    type: 'date',
    value: value.toISOString().split('T')[0],
    style: {
      borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10,
      backgroundColor: '#FFF', fontSize: 14, width: '100%', height: 50,
      fontFamily: 'System', boxSizing: 'border-box'
    },
    onChange: (e: any) => onChange(e.target.value)
  });
};

export default function StudentsScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;

  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const numColumns = isWeb ? 3 : 1;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data States
  const [allStudents, setAllStudents] = useState<StudentDTO[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDTO[]>([]);
  const [pendingAdmissions, setPendingAdmissions] = useState<AdmissionDTO[]>([]);
  const [classList, setClassList] = useState<ClassSectionDTO[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ADMISSIONS'>('STUDENTS');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [showClassModal, setShowClassModal] = useState(false);
  
  // Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Full DTO State
  const [admissionForm, setAdmissionForm] = useState({
    admissionNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    applicantName: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
    nationality: 'Indian',
    religion: '',
    category: '',
    aadhaarNumber: '',
    gradeApplied: '',
    academicYear: '2025-2026',
    previousSchool: '',
    previousClass: '',
    mediumOfInstruction: '',
    fatherName: '',
    fatherOccupation: '',
    fatherContact: '',
    motherName: '',
    motherOccupation: '',
    motherContact: '',
    guardianName: '',
    guardianRelation: '',
    guardianContact: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    birthCertificateUrl: '',
    transferCertificateUrl: '',
    aadhaarCardUrl: '',
    photoUrl: '',
    aadhaarCardNumber: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [students, admissions, classes] = await Promise.all([
        getAllStudents(),
        getPendingAdmissions(),
        getAllClassSections()
      ]);
      setAllStudents(students);
      setFilteredStudents(students);
      setPendingAdmissions(admissions);
      setClassList(classes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (state.status === 'loading') return;
    if (!user || user.role !== 'ADMIN') {
      const timer = setTimeout(() => router.replace('/(app)'), 0);
      return () => clearTimeout(timer);
    }
    fetchData();
  }, [user, state.status]);

  useEffect(() => {
    if (selectedClassId === 'ALL') {
      setFilteredStudents(allStudents);
    } else {
      setFilteredStudents(allStudents.filter(s => s.classSectionId === selectedClassId));
    }
  }, [selectedClassId, allStudents]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      console.log("📷 Image Selected URI:", result.assets[0].uri); 
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmitAdmission = async () => {
    // VALIDATION REMOVED FOR TESTING
    // if (!admissionForm.applicantName...)

    setIsSubmitting(true);
    
    // --- DEBUG LOGS ---
    console.log("🚀 Submitting Admission...");
    console.log("📝 Form Data:", JSON.stringify(admissionForm, null, 2));
    console.log("🖼️ Photo URI:", selectedImage);
    // ------------------

    try {
      // Calling API
      await submitAdmission(admissionForm, selectedImage || undefined);
      
      Alert.alert("Success", "Admission Submitted! Pending for Approval.");
      setModalVisible(false);
      resetForm();
      fetchData(); 
    } catch (e: any) {
      console.error("❌ Submission Failed:", e);
      Alert.alert("Error", "Failed to submit admission. Check network/logs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (admission: AdmissionDTO) => {
      try {
          setLoading(true);
          await approveAdmission(admission.admissionNumber, user?.username || 'Admin');
          Alert.alert("Success", "Student Approved and Added!");
          fetchData(); 
      } catch(e) {
          Alert.alert("Error", "Failed to approve.");
      } finally {
          setLoading(false);
      }
  };

  const handleReject = async (admission: AdmissionDTO) => {
      try {
          setLoading(true);
          await rejectAdmission(admission.admissionNumber);
          Alert.alert("Success", "Admission Rejected.");
          fetchData();
      } catch(e) {
          Alert.alert("Error", "Failed to reject.");
      } finally {
          setLoading(false);
      }
  };

  const resetForm = () => {
    setAdmissionForm({ ...admissionForm, applicantName: '', fatherName: '', fatherContact: '' }); 
    setDobDate(new Date());
    setSelectedImage(null);
  };

  const getClassName = (id: string) => {
    if (id === 'ALL') return 'All Classes';
    const c = classList.find(c => c.classSectionId === id);
    return c ? `${c.className}-${c.section}` : 'Unknown';
  };

  // --- RENDERERS ---

  const renderStudentItem = ({ item }: { item: StudentDTO }) => (
    <View style={[
      styles.itemContainer,
      isWeb && { width: `${100 / numColumns}%`, paddingHorizontal: 10, marginBottom: 20 }
    ]}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
             {item.profileImageUrl ? (
                 <Image source={{ uri: item.profileImageUrl.startsWith('http') ? item.profileImageUrl : `http://192.168.0.136:8080${item.profileImageUrl}` }} style={{width: 40, height: 40, borderRadius: 20}} />
             ) : (
                 <Ionicons name="person" size={20} color="#FFF" />
             )}
          </View>
          <View>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.roll}>ID: {item.studentId}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Class:</Text>
          <Text style={styles.detailValue}>{item.grade}-{item.section}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Parent:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{item.fatherName}</Text>
        </View>
      </View>
    </View>
  );

  const renderAdmissionItem = ({ item }: { item: AdmissionDTO }) => (
    <View style={[
        styles.itemContainer,
        isWeb && { width: `${100 / numColumns}%`, paddingHorizontal: 10, marginBottom: 20 }
    ]}>
        <View style={[styles.card, {borderLeftColor: '#F59E0B', borderLeftWidth: 4}]}>
            <View style={styles.cardHeader}>
                <View style={[styles.avatar, {backgroundColor: '#FDE68A'}]}>
                    {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl.startsWith('http') ? item.photoUrl : `http://192.168.0.136:8080${item.photoUrl}` }} style={{width: 40, height: 40, borderRadius: 20}} />
                    ) : (
                        <Ionicons name="time" size={20} color="#D97706" />
                    )}
                </View>
                <View>
                    <Text style={styles.name}>{item.applicantName}</Text>
                    <Text style={styles.roll}>No: {item.admissionNumber}</Text>
                </View>
            </View>
            
            <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Applied Grade:</Text>
                <Text style={styles.detailValue}>{item.gradeApplied}</Text>
            </View>
            <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Father:</Text>
                <Text style={styles.detailValue}>{item.fatherName}</Text>
            </View>
            <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailValue}>{item.fatherContact}</Text>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                    <Text style={styles.btnTextWhite}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                    <Text style={styles.btnTextWhite}>Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
  );

  // --- MODALS RENDER ---
  const renderSelectionModal = () => {
    if(!activeDropdown) return null;
    let data: string[] = [];
    let onSelect: (val: string) => void = () => {};
    
    if(activeDropdown === 'BLOOD') { data = ['A+','B+','O+','AB+','A-','B-','O-','AB-']; onSelect = (v) => setAdmissionForm({...admissionForm, bloodGroup: v}); }
    if(activeDropdown === 'RELIGION') { data = ['Hindu','Muslim','Christian','Sikh','Other']; onSelect = (v) => setAdmissionForm({...admissionForm, religion: v}); }
    if(activeDropdown === 'CATEGORY') { data = ['General','OBC','SC','ST']; onSelect = (v) => setAdmissionForm({...admissionForm, category: v}); }
    if(activeDropdown === 'MEDIUM') { data = ['English','Telugu','Hindi']; onSelect = (v) => setAdmissionForm({...admissionForm, mediumOfInstruction: v}); }

    return (
        <Modal visible={!!activeDropdown} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setActiveDropdown(null)}>
                <View style={[styles.modalContent, {maxHeight: 300}]}>
                    <ScrollView>
                        {data.map(d => (
                            <TouchableOpacity key={d} style={styles.dropdownItem} onPress={() => { onSelect(d); setActiveDropdown(null); }}>
                                <Text style={styles.dropdownItemText}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* TITLE ROW */}
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
        <Text style={styles.title}>
            {activeTab === 'STUDENTS' ? 'All Students' : 'Admission Requests'}
        </Text>
        
        <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={20} color="#FFF" />
                <Text style={styles.addBtnText}>New Admission</Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'STUDENTS' && styles.activeTab]} 
            onPress={() => setActiveTab('STUDENTS')}
          >
              <Text style={[styles.tabText, activeTab === 'STUDENTS' && styles.activeTabText]}>Active Students</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'ADMISSIONS' && styles.activeTab]} 
            onPress={() => setActiveTab('ADMISSIONS')}
          >
              <Text style={[styles.tabText, activeTab === 'ADMISSIONS' && styles.activeTabText]}>Pending Admissions</Text>
              {pendingAdmissions.length > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{pendingAdmissions.length}</Text></View>
              )}
          </TouchableOpacity>
      </View>

      {/* FILTERS (Only for Students Tab) */}
      {activeTab === 'STUDENTS' && (
        <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by Class:</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowClassModal(true)}>
            <Text style={styles.dropdownText}>{getClassName(selectedClassId)}</Text>
            <Ionicons name="chevron-down" size={18} color="#4B5563" />
            </TouchableOpacity>
        </View>
      )}

      {/* CONTENT LIST */}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>
      ) : (
        // FIX: Use Separate FlatLists
        activeTab === 'STUDENTS' ? (
            <FlatList
                data={filteredStudents}
                keyExtractor={(item) => item.studentId}
                renderItem={renderStudentItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                key={numColumns}
                numColumns={numColumns}
                ListEmptyComponent={<Text style={styles.emptyText}>No active students found.</Text>}
            />
        ) : (
            <FlatList
                data={pendingAdmissions}
                keyExtractor={(item) => item.admissionNumber}
                renderItem={renderAdmissionItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                key={`adm-${numColumns}`} 
                numColumns={numColumns}
                ListEmptyComponent={<Text style={styles.emptyText}>No pending admission requests.</Text>}
            />
        )
      )}

      {/* --- CLASS MODAL --- */}
      <Modal visible={showClassModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowClassModal(false)}>
          <View style={[styles.modalContent, {maxHeight: 400}]}>
             <ScrollView>
                 <TouchableOpacity style={styles.dropdownItem} onPress={() => {setSelectedClassId('ALL'); setShowClassModal(false)}}>
                     <Text style={styles.dropdownItemText}>All Classes</Text>
                 </TouchableOpacity>
                 {classList.map(c => (
                     <TouchableOpacity key={c.classSectionId} style={styles.dropdownItem} onPress={() => {setSelectedClassId(c.classSectionId!); setShowClassModal(false)}}>
                         <Text style={styles.dropdownItemText}>{c.className} - {c.section}</Text>
                     </TouchableOpacity>
                 ))}
             </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- DROPDOWN MODAL --- */}
      {renderSelectionModal()}

      {/* --- NEW ADMISSION FORM --- */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.fullScreenModal}>
          <View style={styles.fsHeader}>
             <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
             <Text style={styles.fsTitle}>New Admission</Text>
             <View style={{width: 24}} /> 
          </View>

          <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.sectionHeader}>Student Information</Text>
            
            {/* Photo */}
            <View style={styles.photoSection}>
                <TouchableOpacity style={styles.photoUploadBtn} onPress={pickImage}>
                    {selectedImage ? (
                        <Image source={{ uri: selectedImage }} style={styles.uploadedPhoto} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="camera" size={30} color="#9CA3AF" />
                            <Text style={styles.photoText}>Add Photo *</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <InputField label="Applicant Name" value={admissionForm.applicantName} onChange={(t:string) => setAdmissionForm({...admissionForm, applicantName: t})} placeholder="Full Name" />
            
            <View style={styles.formRow}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date of Birth</Text>
                    {Platform.OS === 'web' ? (
                        <WebDateInput value={dobDate} onChange={(d) => { setAdmissionForm({...admissionForm, dateOfBirth: d}); setDobDate(new Date(d)); }} />
                    ) : (
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
                            <Text>{admissionForm.dateOfBirth}</Text>
                            <Ionicons name="calendar" size={18} color="gray" />
                        </TouchableOpacity>
                    )}
                    {showDatePicker && <DateTimePicker value={dobDate} onChange={(e, d) => { setShowDatePicker(false); if(d) { setDobDate(d); setAdmissionForm({...admissionForm, dateOfBirth: d.toISOString().split('T')[0]}) } }} />}
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gender</Text>
                    <View style={{flexDirection: 'row', gap: 10}}>
                        {['Male', 'Female'].map(g => (
                            <TouchableOpacity key={g} style={[styles.radioBtn, admissionForm.gender === g && styles.radioBtnActive]} onPress={() => setAdmissionForm({...admissionForm, gender: g})}>
                                <Text style={admissionForm.gender === g ? {color:'#F97316', fontWeight:'bold'} : {color:'#333'}}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>

            <View style={styles.formRow}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Blood Group</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setActiveDropdown('BLOOD')}><Text>{admissionForm.bloodGroup || 'Select'}</Text></TouchableOpacity>
                </View>
                <InputField label="Nationality" value={admissionForm.nationality} onChange={(t:string) => setAdmissionForm({...admissionForm, nationality: t})} placeholder="Indian" />
            </View>

            <View style={styles.formRow}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Religion</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setActiveDropdown('RELIGION')}><Text>{admissionForm.religion || 'Select'}</Text></TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Category</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setActiveDropdown('CATEGORY')}><Text>{admissionForm.category || 'Select'}</Text></TouchableOpacity>
                </View>
            </View>

            <InputField label="Aadhaar Number" value={admissionForm.aadhaarNumber} onChange={(t:string) => setAdmissionForm({...admissionForm, aadhaarNumber: t})} placeholder="12-digit UID" keyboardType="numeric" />

            {/* Academic */}
            <Text style={styles.sectionHeader}>Academic</Text>
            <View style={styles.formRow}>
                <InputField label="Grade Applied" value={admissionForm.gradeApplied} onChange={(t:string) => setAdmissionForm({...admissionForm, gradeApplied: t})} placeholder="e.g. 10" />
                <InputField label="Academic Year" value={admissionForm.academicYear} onChange={(t:string) => setAdmissionForm({...admissionForm, academicYear: t})} placeholder="2025-2026" />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Medium of Instruction</Text>
                <TouchableOpacity style={styles.selectBtn} onPress={() => setActiveDropdown('MEDIUM')}><Text>{admissionForm.mediumOfInstruction || 'Select'}</Text></TouchableOpacity>
            </View>

            <View style={styles.formRow}>
                <InputField label="Previous School" value={admissionForm.previousSchool} onChange={(t:string) => setAdmissionForm({...admissionForm, previousSchool: t})} placeholder="School Name" />
                <InputField label="Previous Class" value={admissionForm.previousClass} onChange={(t:string) => setAdmissionForm({...admissionForm, previousClass: t})} placeholder="Class" />
            </View>

            {/* Parents */}
            <Text style={styles.sectionHeader}>Parents</Text>
            <View style={styles.parentCard}>
                <Text style={styles.subHeader}>Father</Text>
                <InputField label="Name" value={admissionForm.fatherName} onChange={(t:string) => setAdmissionForm({...admissionForm, fatherName: t})} placeholder="Name" />
                <View style={styles.formRow}>
                    <InputField label="Occupation" value={admissionForm.fatherOccupation} onChange={(t:string) => setAdmissionForm({...admissionForm, fatherOccupation: t})} placeholder="Occupation" />
                    <InputField label="Contact" value={admissionForm.fatherContact} onChange={(t:string) => setAdmissionForm({...admissionForm, fatherContact: t})} placeholder="Phone" keyboardType="phone-pad" />
                </View>
            </View>

            <View style={styles.parentCard}>
                <Text style={styles.subHeader}>Mother</Text>
                <InputField label="Name" value={admissionForm.motherName} onChange={(t:string) => setAdmissionForm({...admissionForm, motherName: t})} placeholder="Name" />
                <View style={styles.formRow}>
                    <InputField label="Occupation" value={admissionForm.motherOccupation} onChange={(t:string) => setAdmissionForm({...admissionForm, motherOccupation: t})} placeholder="Occupation" />
                    <InputField label="Contact" value={admissionForm.motherContact} onChange={(t:string) => setAdmissionForm({...admissionForm, motherContact: t})} placeholder="Phone" keyboardType="phone-pad" />
                </View>
            </View>

            <View style={styles.parentCard}>
                <Text style={styles.subHeader}>Guardian (Optional)</Text>
                <InputField label="Name" value={admissionForm.guardianName} onChange={(t:string) => setAdmissionForm({...admissionForm, guardianName: t})} placeholder="Guardian Name" />
                <View style={styles.formRow}>
                    <InputField label="Relation" value={admissionForm.guardianRelation} onChange={(t:string) => setAdmissionForm({...admissionForm, guardianRelation: t})} placeholder="e.g. Uncle" />
                    <InputField label="Contact" value={admissionForm.guardianContact} onChange={(t:string) => setAdmissionForm({...admissionForm, guardianContact: t})} placeholder="Phone" keyboardType="phone-pad" />
                </View>
            </View>

            {/* Address */}
            <Text style={styles.sectionHeader}>Address & Emergency</Text>
            <InputField label="Address" value={admissionForm.address} onChange={(t:string) => setAdmissionForm({...admissionForm, address: t})} placeholder="Street, Area" />
            <View style={styles.formRow}>
                <InputField label="City" value={admissionForm.city} onChange={(t:string) => setAdmissionForm({...admissionForm, city: t})} placeholder="City" />
                <InputField label="State" value={admissionForm.state} onChange={(t:string) => setAdmissionForm({...admissionForm, state: t})} placeholder="State" />
            </View>
            <InputField label="Pincode" value={admissionForm.pincode} onChange={(t:string) => setAdmissionForm({...admissionForm, pincode: t})} placeholder="Pincode" keyboardType="numeric" />
            
            <View style={styles.formRow}>
                <InputField label="Emergency Contact Name" value={admissionForm.emergencyContactName} onChange={(t:string) => setAdmissionForm({...admissionForm, emergencyContactName: t})} placeholder="Name" />
                <InputField label="Emergency Number" value={admissionForm.emergencyContactNumber} onChange={(t:string) => setAdmissionForm({...admissionForm, emergencyContactNumber: t})} placeholder="Phone" keyboardType="phone-pad" />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitAdmission} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Application</Text>}
            </TouchableOpacity>
            <View style={{height: 50}} />
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerRowMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  
  addBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },

  // Tabs
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#E5E7EB', borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6, flexDirection: 'row', justifyContent: 'center' },
  activeTab: { backgroundColor: '#FFF', elevation: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 1 },
  tabText: { fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#111827' },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 6, marginLeft: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Filter
  filterContainer: { marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  filterLabel: { marginRight: 10, fontWeight: '600', color: '#4B5563' },
  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 150, justifyContent: 'space-between' },
  dropdownText: { color: '#1F2937' },

  // Cards
  itemContainer: { width: '100%', marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow:'hidden' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  roll: { fontSize: 12, color: '#6B7280' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 12 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#374151' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveBtn: { flex: 1, backgroundColor: '#10B981', padding: 10, borderRadius: 8, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: '#EF4444', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnTextWhite: { color: '#FFF', fontWeight: 'bold' },

  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 16 },

  // Full Screen Form
  fullScreenModal: { flex: 1, backgroundColor: '#F3F4F6' },
  fsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  fsTitle: { fontSize: 18, fontWeight: 'bold' },
  formContainer: { padding: 20 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#2563EB', marginTop: 10, marginBottom: 10 },
  subHeader: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', marginBottom: 8, marginTop: 8 },
  
  // Inputs
  formRow: { flexDirection: 'row', gap: 10 },
  inputGroup: { flex: 1, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#FFF', fontSize: 14, height: 50 },
  
  datePickerBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#FFF', height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectBtn: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#FFF', height: 50, justifyContent: 'center' },
  selectBtnText: { fontSize: 14, color: '#111827' },
  
  radioBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF', flex: 1, alignItems: 'center' },
  radioBtnActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },

  parentCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },

  submitBtn: { backgroundColor: '#F97316', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Photo
  photoSection: { alignItems: 'center', marginBottom: 20 },
  photoUploadBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center' },
  photoText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  uploadedPhoto: { width: '100%', height: '100%' },
});