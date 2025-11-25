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
    deleteStudent,
    getAllClassSections,
    getAllStudents,
    getPendingAdmissions,
    rejectAdmission,
    StudentDTO,
    submitAdmission,
    updateStudent
} from '../../src/api/adminApi';
import { useAuth } from '../../src/context/AuthContext';

const API_BASE_URL = 'http://192.168.0.113:8080'; // Backend URL for Images

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
  const [deletedStudents, setDeletedStudents] = useState<StudentDTO[]>([]); // Local state for deleted items
  const [classList, setClassList] = useState<ClassSectionDTO[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'ADMISSIONS' | 'DELETED'>('STUDENTS');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [showClassModal, setShowClassModal] = useState(false);
  
  // Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Edit Mode State
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

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
    totalFee: '', // ✅ Added Total Fee Field
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
      
      // Sort Students by ID (Ascending: 001, 002...)
      const sortedStudents = students.sort((a, b) => a.studentId.localeCompare(b.studentId));
      setAllStudents(sortedStudents);
      
      // Initial Filter (Defaults to ALL)
      if (selectedClassId === 'ALL') {
          setFilteredStudents(sortedStudents);
      } else {
          const filtered = sortedStudents.filter(s => s.classSectionId === selectedClassId);
          setFilteredStudents(filtered);
      }
      
      // Sort Admissions: Latest First (Date Descending)
      const sortedAdmissions = admissions.sort((a, b) => {
          const dateA = new Date(a.admissionDate).getTime();
          const dateB = new Date(b.admissionDate).getTime();
          return dateB - dateA; 
      });
      setPendingAdmissions(sortedAdmissions);
      
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
    let filtered = [];
    if (selectedClassId === 'ALL') {
      filtered = [...allStudents];
    } else {
      filtered = allStudents.filter(s => s.classSectionId === selectedClassId);
    }
    // Ensure filtering maintains ID Sort Order
    filtered.sort((a, b) => a.studentId.localeCompare(b.studentId));
    setFilteredStudents(filtered);
  }, [selectedClassId, allStudents]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleFormSubmit = async () => {
    if (!admissionForm.applicantName || !admissionForm.fatherName) {
        Alert.alert("Error", "Please fill mandatory fields (Name, Father's Name)");
        return;
    }

    setIsSubmitting(true);
    try {
        if (isEditMode && editingStudentId) {
            // --- UPDATE MODE ---
            const updateData = {
                fullName: admissionForm.applicantName,
                dateOfBirth: admissionForm.dateOfBirth,
                gender: admissionForm.gender,
                bloodGroup: admissionForm.bloodGroup,
                nationality: admissionForm.nationality,
                religion: admissionForm.religion,
                category: admissionForm.category,
                aadhaarNumber: admissionForm.aadhaarNumber,
                totalFee: admissionForm.totalFee ? parseFloat(admissionForm.totalFee) : null, // ✅ Update Fee
                fatherName: admissionForm.fatherName,
                fatherContact: admissionForm.fatherContact,
                motherName: admissionForm.motherName,
                motherContact: admissionForm.motherContact,
                guardianName: admissionForm.guardianName,
                guardianContact: admissionForm.guardianContact,
                address: admissionForm.address,
                city: admissionForm.city,
                state: admissionForm.state,
                pincode: admissionForm.pincode,
                contactNumber: admissionForm.fatherContact,
                email: '', 
                emergencyContactName: admissionForm.emergencyContactName,
                emergencyContactNumber: admissionForm.emergencyContactNumber,
                active: true
            };

            await updateStudent(editingStudentId, updateData, selectedImage || undefined);
            Alert.alert("Success", "Student Updated Successfully!");
        } else {
            // --- CREATE MODE ---
            const payload = {
                ...admissionForm,
                totalFee: admissionForm.totalFee ? parseFloat(admissionForm.totalFee) : null // ✅ Create Fee
            };
            await submitAdmission(payload, selectedImage || undefined);
            Alert.alert("Success", "Admission Submitted! Pending for Approval.");
        }
        
        setModalVisible(false);
        resetForm();
        fetchData(); 
    } catch (e: any) {
        console.error("❌ Submission Failed:", e);
        Alert.alert("Error", isEditMode ? "Failed to update student" : "Failed to submit admission");
    } finally {
        setIsSubmitting(false);
    }
  };

  const openEditModal = (student: StudentDTO) => {
      setIsEditMode(true);
      setEditingStudentId(student.studentId);
      
      setAdmissionForm({
          ...admissionForm,
          applicantName: student.fullName || '',
          dateOfBirth: student.dateOfBirth || new Date().toISOString().split('T')[0],
          gender: student.gender || 'Male',
          bloodGroup: student.bloodGroup || '',
          nationality: student.nationality || 'Indian',
          religion: student.religion || '',
          category: student.category || '',
          aadhaarNumber: student.aadhaarNumber || '',
          // ✅ Load existing Fee (Safely accessing dynamic property)
          totalFee: (student as any).totalFee ? (student as any).totalFee.toString() : '', 
          gradeApplied: student.grade || '',
          academicYear: student.academicYear || '2025-2026',
          fatherName: student.fatherName || '',
          fatherContact: student.fatherContact || student.contactNumber || '',
          fatherOccupation: '',
          motherName: student.motherName || '',
          motherContact: student.motherContact || '',
          motherOccupation: '',
          guardianName: student.guardianName || '',
          guardianContact: student.guardianContact || '',
          guardianRelation: '',
          address: student.address || '',
          city: student.city || '',
          state: student.state || '',
          pincode: student.pincode || '',
          emergencyContactName: student.emergencyContactName || '',
          emergencyContactNumber: student.emergencyContactNumber || '',
          previousSchool: '',
          previousClass: '',
          mediumOfInstruction: '',
          birthCertificateUrl: '',
          transferCertificateUrl: '',
          aadhaarCardUrl: '',
          photoUrl: student.profileImageUrl || '',
          aadhaarCardNumber: student.aadhaarNumber || ''
      });
      
      setDobDate(student.dateOfBirth ? new Date(student.dateOfBirth) : new Date());
      setSelectedImage(student.profileImageUrl ? getFullImageUrl(student.profileImageUrl) : null);
      setModalVisible(true);
  };

  const handleDelete = async (student: StudentDTO) => {
      if (Platform.OS === 'web') {
          if (confirm(`Are you sure you want to delete ${student.fullName}?`)) {
              await processDelete(student);
          }
      } else {
          Alert.alert(
              "Confirm Delete",
              `Are you sure you want to delete ${student.fullName}?`,
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => processDelete(student) }
              ]
          );
      }
  };

  const processDelete = async (student: StudentDTO) => {
      try {
          await deleteStudent(student.studentId);
          setDeletedStudents(prev => [student, ...prev]);
          setAllStudents(prev => prev.filter(s => s.studentId !== student.studentId));
          Alert.alert("Success", "Student deleted successfully.");
      } catch (e) {
          Alert.alert("Error", "Failed to delete student.");
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
    setAdmissionForm({
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
        totalFee: '', // ✅ Reset Fee
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
    setDobDate(new Date());
    setSelectedImage(null);
    setIsEditMode(false);
    setEditingStudentId(null);
  };

  const getClassName = (id: string) => {
    if (id === 'ALL') return 'All Classes';
    const c = classList.find(c => c.classSectionId === id);
    return c ? `${c.className}-${c.section}` : 'Unknown';
  };

  const getFullImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('https')) return url;
    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  // --- RENDERERS ---

  const renderStudentItem = ({ item }: { item: StudentDTO }) => {
    const imageUrl = getFullImageUrl(item.profileImageUrl || '');
    
    return (
        <View style={[
            styles.itemContainer,
            isWeb && { width: `${100 / numColumns}%`, paddingHorizontal: 10, marginBottom: 20 }
        ]}>
            <View style={styles.modernCard}>
                {/* Top Row: Content + Icons */}
                <View style={styles.cardTop}>
                    {/* Avatar & Info */}
                    <View style={styles.cardContentRow}>
                        <View style={styles.avatarWrapper}>
                            {imageUrl ? (
                                <Image source={{ uri: imageUrl }} style={styles.modernAvatar} />
                            ) : (
                                <View style={[styles.modernAvatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarInitials}>{item.fullName ? item.fullName.charAt(0).toUpperCase() : '?'}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.infoColumn}>
                            <Text style={styles.studentName} numberOfLines={1}>{item.fullName}</Text>
                            <Text style={styles.studentIdText}>ID: {item.studentId}</Text>
                            
                            <View style={styles.badgeRow}>
                                <View style={styles.classBadge}>
                                    <Text style={styles.classBadgeText}>{item.grade}-{item.section}</Text>
                                </View>
                                <View style={[styles.classBadge, {backgroundColor: '#ECFDF5'}]}>
                                    <Text style={[styles.classBadgeText, {color: '#059669'}]}>Active</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Edit/Delete Icons (Top Right) */}
                    <View style={styles.topActionIcons}>
                        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                            <Ionicons name="create-outline" size={20} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Footer: Father & Contact (Left & Right) */}
                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <Ionicons name="people-outline" size={14} color="#6B7280" />
                        <Text style={styles.footerText} numberOfLines={1}>{item.fatherName || 'N/A'}</Text>
                    </View>
                    
                    <View style={styles.footerItem}>
                        <Ionicons name="call-outline" size={14} color="#6B7280" />
                        <Text style={styles.footerText}>{item.contactNumber || 'N/A'}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
  };

  const renderDeletedItem = ({ item }: { item: StudentDTO }) => {
    const imageUrl = getFullImageUrl(item.profileImageUrl || '');
    
    return (
        <View style={[
            styles.itemContainer,
            isWeb && { width: `${100 / numColumns}%`, paddingHorizontal: 10, marginBottom: 20 }
        ]}>
            <View style={[styles.modernCard, {opacity: 0.7, backgroundColor: '#F3F4F6'}]}>
                <View style={styles.cardContentRow}>
                    <View style={styles.avatarWrapper}>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={[styles.modernAvatar, { opacity: 0.5 }]} />
                        ) : (
                            <View style={[styles.modernAvatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarInitials}>{item.fullName ? item.fullName.charAt(0).toUpperCase() : '?'}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.infoColumn}>
                        <Text style={[styles.studentName, {textDecorationLine: 'line-through'}]} numberOfLines={1}>{item.fullName}</Text>
                        <Text style={styles.studentIdText}>ID: {item.studentId}</Text>
                        <View style={[styles.badge, {backgroundColor: '#EF4444'}]}>
                            <Text style={styles.badgeText}>DELETED</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
  };

  const renderAdmissionItem = ({ item }: { item: AdmissionDTO }) => {
    const imageUrl = getFullImageUrl(item.photoUrl || '');

    return (
        <View style={[
            styles.itemContainer,
            isWeb && { width: `${100 / numColumns}%`, paddingHorizontal: 10, marginBottom: 20 }
        ]}>
            <View style={styles.modernCard}>
                {/* Pending Status Banner */}
                <View style={styles.pendingBanner}>
                    <Text style={styles.pendingText}>Pending Approval</Text>
                    <Text style={styles.dateText}>{item.admissionDate}</Text>
                </View>

                <View style={styles.cardContentRow}>
                    <View style={styles.avatarWrapper}>
                        {imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.modernAvatar} />
                        ) : (
                            <View style={[styles.modernAvatar, styles.avatarPlaceholder, {backgroundColor: '#FEF3C7'}]}>
                                <Ionicons name="time" size={24} color="#D97706" />
                            </View>
                        )}
                    </View>

                    <View style={styles.infoColumn}>
                        <Text style={styles.studentName} numberOfLines={1}>{item.applicantName}</Text>
                        <Text style={styles.studentIdText}>Apply for: Class {item.gradeApplied}</Text>
                        <Text style={styles.studentIdText}>Father: {item.fatherName}</Text>
                    </View>
                </View>

                <View style={styles.cardDivider} />

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(item)}>
                        <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                        <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <View style={{width: 10}} />
                    <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(item)}>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
  };

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
            {activeTab === 'STUDENTS' ? 'Students Directory' : activeTab === 'ADMISSIONS' ? 'Admission Requests' : 'Deleted Students'}
        </Text>
        
        <View style={styles.headerActions}>
            <TouchableOpacity 
                style={[styles.addBtn, {backgroundColor: '#EF4444'}]} 
                onPress={() => setActiveTab('DELETED')}
            >
                <Ionicons name="trash-bin-outline" size={18} color="#FFF" />
                <Text style={styles.addBtnText}>Deleted Students</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
                <Ionicons name="add" size={20} color="#FFF" />
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
        ) : activeTab === 'ADMISSIONS' ? (
            <FlatList
                data={pendingAdmissions}
                keyExtractor={(item) => item.admissionNumber}
                renderItem={renderAdmissionItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                key={`adm-${numColumns}`} 
                numColumns={numColumns}
                ListEmptyComponent={<Text style={styles.emptyText}>No pending admission requests.</Text>}
            />
        ) : (
            <FlatList
                data={deletedStudents}
                keyExtractor={(item) => item.studentId}
                renderItem={renderDeletedItem}
                contentContainerStyle={{ paddingBottom: 20 }}
                key={`del-${numColumns}`}
                numColumns={numColumns}
                ListEmptyComponent={<Text style={styles.emptyText}>No deleted students in this session.</Text>}
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

      {/* --- NEW ADMISSION / EDIT FORM --- */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={styles.fullScreenModal}>
          <View style={styles.fsHeader}>
             <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity>
             <Text style={styles.fsTitle}>{isEditMode ? 'Edit Student' : 'New Admission'}</Text>
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
                            <Text style={styles.photoText}>Add Photo</Text>
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
            
            {/* ✅ TOTAL FEE FIELD ADDED */}
            <View style={styles.formRow}>
                <InputField 
                    label="Total Fee" 
                    value={admissionForm.totalFee} 
                    onChange={(t:string) => setAdmissionForm({...admissionForm, totalFee: t})} 
                    placeholder="e.g. 25000" 
                    keyboardType="numeric"
                />
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Medium of Instruction</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setActiveDropdown('MEDIUM')}><Text>{admissionForm.mediumOfInstruction || 'Select'}</Text></TouchableOpacity>
                </View>
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

            <TouchableOpacity style={styles.submitBtn} onPress={handleFormSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{isEditMode ? "Update Student" : "Submit Application"}</Text>}
            </TouchableOpacity>
            <View style={{height: 50}} />
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerRowMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  
  headerActions: { flexDirection: 'row', gap: 10 },
  
  addBtn: { flexDirection: 'row', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignItems: 'center', elevation: 2 },
  addBtnText: { color: '#FFF', fontWeight: '600', marginLeft: 6 },

  // Tabs
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#FFF', borderRadius: 12, padding: 4, elevation: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, flexDirection: 'row', justifyContent: 'center' },
  activeTab: { backgroundColor: '#EFF6FF' },
  tabText: { fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#2563EB' },
  badge: { backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 8, marginLeft: 6, paddingVertical: 2 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  // Filter
  filterContainer: { marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  filterLabel: { marginRight: 10, fontWeight: '500', color: '#6B7280' },
  dropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 140, justifyContent: 'space-between' },
  dropdownText: { color: '#1F2937', fontSize: 14 },

  // --- MODERN CARD STYLES ---
  itemContainer: { width: '100%', marginBottom: 16 },
  modernCard: { 
      backgroundColor: '#FFF', borderRadius: 16, padding: 16, 
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, 
      borderWidth: 1, borderColor: '#F3F4F6', position: 'relative' 
  },
  
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardContentRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  
  avatarWrapper: { marginRight: 16 },
  modernAvatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 22, fontWeight: 'bold', color: '#6B7280' },
  
  infoColumn: { flex: 1 },
  studentName: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  studentIdText: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  
  badgeRow: { flexDirection: 'row', gap: 8 },
  classBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  classBadgeText: { color: '#4F46E5', fontSize: 11, fontWeight: '600' },

  // Top Right Icons
  topActionIcons: { flexDirection: 'row', gap: 10, marginLeft: 10 },
  iconBtn: { padding: 4 },

  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  
  // Footer: Justify space between for Mobile on right
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: '#4B5563' },

  // --- ADMISSION CARD STYLES ---
  pendingBanner: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginBottom: 12 },
  pendingText: { color: '#D97706', fontSize: 12, fontWeight: 'bold' },
  dateText: { color: '#D97706', fontSize: 12 },
  
  actionButtonsRow: { flexDirection: 'row', marginTop: 12 },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  rejectText: { color: '#DC2626', fontWeight: '600', marginLeft: 6 },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, backgroundColor: '#10B981' },
  approveText: { color: '#FFF', fontWeight: '600', marginLeft: 6 },

  // Modal & Form
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownItemText: { fontSize: 16 },

  fullScreenModal: { flex: 1, backgroundColor: '#F3F4F6' },
  fsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  fsTitle: { fontSize: 18, fontWeight: 'bold' },
  formContainer: { padding: 20 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#2563EB', marginTop: 10, marginBottom: 10 },
  subHeader: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', marginBottom: 8, marginTop: 8 },
  
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

  photoSection: { alignItems: 'center', marginBottom: 20 },
  photoUploadBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center' },
  photoText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  uploadedPhoto: { width: '100%', height: '100%' },
  
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});