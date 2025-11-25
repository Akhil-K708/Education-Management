import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import { getAllStudents, StudentDTO } from '../../api/adminApi';
import {
    assignTransportToStudent,
    createTransportRoute,
    getAllTransportRoutes,
    getStudentsByRoute,
    updateStudentTransport
} from '../../api/transportApi';
import { TransportRoute } from '../../types/transport';

// --- WEB TIME INPUT COMPONENT ---
const WebTimeInput = ({ value, onChange }: { value: Date, onChange: (d: Date) => void }) => {
    return React.createElement('input', {
       type: 'time',
       value: value.toTimeString().slice(0, 5),
       style: {
           borderWidth: 1, 
           borderColor: '#E5E7EB', 
           borderRadius: 8, 
           padding: 12,
           backgroundColor: '#F9FAFB', 
           width: '100%', 
           height: 50,
           fontSize: 14,
           fontFamily: 'System', 
           boxSizing: 'border-box',
           outline: 'none'
       },
       onChange: (e: any) => {
           const val = e.target.value;
           if(!val) return;
           const [h, m] = val.split(':');
           const newDate = new Date();
           newDate.setHours(parseInt(h), parseInt(m), 0);
           onChange(newDate);
       }
    });
 };

export default function AdminTransportView() {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal States
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  
  // Data Lists
  const [studentsList, setStudentsList] = useState<StudentDTO[]>([]);
  const [routesList, setRoutesList] = useState<TransportRoute[]>([]);
  const [routeStudents, setRouteStudents] = useState<any[]>([]);

  // Search States
  const [studentSearch, setStudentSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  
  // Selection Modals
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false); 
  const [showFilterRouteModal, setShowFilterRouteModal] = useState(false);

  // --- EDIT MODE STATE ---
  const [isEditMode, setIsEditMode] = useState(false);

  // --- DATE STATE FOR PICKERS ---
  const [createPickupDate, setCreatePickupDate] = useState(new Date());
  const [createDropDate, setCreateDropDate] = useState(new Date());
  const [assignPickupDate, setAssignPickupDate] = useState(new Date());
  const [assignDropDate, setAssignDropDate] = useState(new Date());

  const [showCreatePickupPicker, setShowCreatePickupPicker] = useState(false);
  const [showCreateDropPicker, setShowCreateDropPicker] = useState(false);
  const [showAssignPickupPicker, setShowAssignPickupPicker] = useState(false);
  const [showAssignDropPicker, setShowAssignDropPicker] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    routeName: '', pickupStartTime: '', dropStartTime: '',
    vehicleName: '', vehicleNumber: '', driverName: '', driverPhone: ''
  });

  const [assignForm, setAssignForm] = useState({
    studentId: '', studentName: '', routeId: '', routeName: '',
    pickupStop: '', dropStop: '', pickupTime: '', dropTime: '', feeStatus: 'PENDING'
  });

  const [selectedRouteFilter, setSelectedRouteFilter] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
      const p = new Date(); p.setHours(8, 0, 0);
      const d = new Date(); d.setHours(16, 0, 0);
      setCreatePickupDate(p); setCreateDropDate(d);
      setAssignPickupDate(p); setAssignDropDate(d);

      setCreateForm(prev => ({...prev, pickupStartTime: formatTime(p), dropStartTime: formatTime(d)}));
      setAssignForm(prev => ({...prev, pickupTime: formatTime(p), dropTime: formatTime(d)}));
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if(selectedRouteFilter?.id) {
        fetchRouteStudents(selectedRouteFilter.id);
    }
  }, [selectedRouteFilter]);

  const fetchInitialData = async () => {
    try {
        const [students, routes] = await Promise.all([getAllStudents(), getAllTransportRoutes()]);
        setStudentsList(students);
        setRoutesList(routes);
    } catch (e) { console.log("Failed to load data"); }
  };

  const fetchRouteStudents = async (routeId: string) => {
      try {
          const data = await getStudentsByRoute(routeId);
          setRouteStudents(data);
      } catch(e) { setRouteStudents([]); }
  };

  const parseTime = (timeStr: string) => {
      const d = new Date();
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
      d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      return d;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // --- HANDLERS ---

  const handleCreateRoute = async () => {
    if (!createForm.routeName || !createForm.vehicleNumber) {
      Alert.alert("Error", "Please fill mandatory fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createTransportRoute(createForm);
      Alert.alert("Success", "Transport Route Created Successfully!");
      setCreateModalVisible(false);
      fetchInitialData(); 
      setCreateForm({
        routeName: '', pickupStartTime: formatTime(createPickupDate), dropStartTime: formatTime(createDropDate),
        vehicleName: '', vehicleNumber: '', driverName: '', driverPhone: ''
      });
    } catch (e) { Alert.alert("Error", "Failed to create route."); } 
    finally { setIsSubmitting(false); }
  };

  const handleAssignOrUpdate = async () => {
      if (!assignForm.studentId || !assignForm.routeId) {
          Alert.alert("Error", "Please select a student and a route.");
          return;
      }
      setIsSubmitting(true);
      try {
          const payload = {
              routeId: assignForm.routeId,
              pickupStop: assignForm.pickupStop,
              dropStop: assignForm.dropStop,
              pickupTime: assignForm.pickupTime,
              dropTime: assignForm.dropTime,
              feeStatus: assignForm.feeStatus
          };

          if (isEditMode) {
              await updateStudentTransport(assignForm.studentId, payload);
              Alert.alert("Success", "Transport Updated Successfully!");
          } else {
              await assignTransportToStudent(assignForm.studentId, payload);
              Alert.alert("Success", "Transport Assigned Successfully!");
          }
          
          setAssignModalVisible(false); 
          
          setAssignForm({
             studentId: '', studentName: '', routeId: '', routeName: '',
             pickupStop: '', dropStop: '', pickupTime: formatTime(new Date()), dropTime: formatTime(new Date()), feeStatus: 'PENDING'
          });
          setIsEditMode(false);
          
          if(selectedRouteFilter?.id === assignForm.routeId) {
              fetchRouteStudents(assignForm.routeId);
          }
      } catch (e) { Alert.alert("Error", isEditMode ? "Failed to update." : "Failed to assign."); } 
      finally { setIsSubmitting(false); }
  };

  const openAssignModal = () => {
      setIsEditMode(false);
      setAssignForm({
        studentId: '', studentName: '', routeId: '', routeName: '',
        pickupStop: '', dropStop: '', pickupTime: formatTime(assignPickupDate), dropTime: formatTime(assignDropDate), feeStatus: 'PENDING'
      });
      setAssignModalVisible(true);
  };

  const onEditClick = async (item: any) => {
      setIsEditMode(true);
      setAssignForm({
          studentId: item.studentId,
          studentName: item.name || item.studentId,
          routeId: selectedRouteFilter?.id || '',
          routeName: selectedRouteFilter?.name || '',
          pickupStop: item.pickupStop || '',
          dropStop: item.dropStop || '',
          pickupTime: item.pickupTime || '',
          dropTime: item.dropTime || '',
          feeStatus: item.feeStatus || 'PENDING'
      });
      
      if(item.pickupTime) setAssignPickupDate(parseTime(item.pickupTime));
      if(item.dropTime) setAssignDropDate(parseTime(item.dropTime));

      setAssignModalVisible(true);
  };

  // --- TIME PICKER ---
  const renderTimePickerField = (
    label: string,
    dateValue: Date,
    setDateValue: (d: Date) => void,
    showPicker: boolean,
    setShowPicker: (v: boolean) => void,
    onTimeUpdate: (timeStr: string) => void
  ) => (
    <View style={styles.halfInput}>
        <Text style={styles.label}>{label}</Text>
        {Platform.OS === 'web' ? (
            <WebTimeInput 
                value={dateValue} 
                onChange={(d) => {
                    setDateValue(d);
                    onTimeUpdate(formatTime(d));
                }} 
            />
        ) : (
            <>
                <TouchableOpacity 
                    style={styles.timeBtn} 
                    onPress={() => setShowPicker(true)}
                >
                    <Text style={styles.timeBtnText}>{formatTime(dateValue)}</Text>
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {showPicker && (
                    <DateTimePicker
                        value={dateValue}
                        mode="time"
                        display="default"
                        onChange={(e: DateTimePickerEvent, d?: Date) => {
                            setShowPicker(false);
                            if (d) {
                                setDateValue(d);
                                onTimeUpdate(formatTime(d));
                            }
                        }}
                    />
                )}
            </>
        )}
    </View>
  );

  // --- MODALS RENDERER ---
  const renderStudentModal = () => (
    <Modal visible={showStudentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.searchModalContent}>
                <View style={styles.searchHeader}>
                    <Text style={styles.modalTitle}>Select Student</Text>
                    <TouchableOpacity onPress={() => setShowStudentModal(false)}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
                <TextInput 
                    style={styles.searchInput} placeholder="Search by Name or ID..." 
                    value={studentSearch} onChangeText={setStudentSearch}
                />
                <FlatList
                    data={studentsList.filter(s => s.fullName.toLowerCase().includes(studentSearch.toLowerCase()))}
                    keyExtractor={item => item.studentId}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.listItem} onPress={() => {
                            setAssignForm({...assignForm, studentId: item.studentId, studentName: item.fullName});
                            setShowStudentModal(false);
                            setStudentSearch('');
                        }}>
                            <Text style={styles.itemTitle}>{item.fullName}</Text>
                            <Text style={styles.itemSub}>{item.studentId} • Class {item.grade}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    </Modal>
  );

  const renderRouteModal = (isFilter: boolean) => (
    <Modal visible={isFilter ? showFilterRouteModal : showRouteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.searchModalContent}>
                <View style={styles.searchHeader}>
                    <Text style={styles.modalTitle}>Select Route</Text>
                    <TouchableOpacity onPress={() => isFilter ? setShowFilterRouteModal(false) : setShowRouteModal(false)}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                </View>
                <TextInput 
                    style={styles.searchInput} placeholder="Search Route..." 
                    value={routeSearch} onChangeText={setRouteSearch}
                />
                <FlatList
                    data={routesList.filter(r => r.routeName.toLowerCase().includes(routeSearch.toLowerCase()))}
                    keyExtractor={item => item.routeId || Math.random().toString()}
                    renderItem={({item}) => (
                        <TouchableOpacity style={styles.listItem} onPress={() => {
                            if (isFilter) {
                                setSelectedRouteFilter({id: item.routeId!, name: item.routeName});
                                setShowFilterRouteModal(false);
                            } else {
                                setAssignForm({...assignForm, routeId: item.routeId!, routeName: item.routeName});
                                setShowRouteModal(false);
                            }
                            setRouteSearch('');
                        }}>
                            <Text style={styles.itemTitle}>{item.routeName}</Text>
                            <Text style={styles.itemSub}>{item.routeId}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No routes found. Create one first.</Text>}
                />
            </View>
        </View>
    </Modal>
  );


  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      
      {/* HEADER ROW */}
      <View style={[styles.headerRow, !isWeb && styles.headerRowMobile]}>
          <Text style={styles.headerTitle}>Transport Management</Text>
          <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity 
                style={[styles.createBtn, {backgroundColor: '#2563EB'}]} 
                onPress={openAssignModal}
              >
                  <Ionicons name="person-add-outline" size={18} color="#FFF" />
                  <Text style={styles.btnText}>Assign Transport</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.createBtn} 
                onPress={() => setCreateModalVisible(true)}
              >
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.btnText}>Create Route</Text>
              </TouchableOpacity>
          </View>
      </View>
      
      {/* --- VIEW ASSIGNED STUDENTS SECTION --- */}
      <View style={styles.card}>
          <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={24} color="#059669" />
              <Text style={styles.cardTitle}>Route Allocations</Text>
          </View>
          
          <Text style={styles.label}>Select Route to View</Text>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowFilterRouteModal(true)}>
            <Text style={selectedRouteFilter ? styles.dropdownTextSelected : styles.dropdownText}>
                {selectedRouteFilter ? selectedRouteFilter.name : "Select Route..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {selectedRouteFilter && (
              <View style={{marginTop: 15}}>
                  <Text style={styles.subHeader}>Students in {selectedRouteFilter.name}:</Text>
                  {routeStudents.length === 0 ? (
                      <Text style={styles.emptyText}>No students assigned to this route yet.</Text>
                  ) : (
                      routeStudents.map((item, index) => (
                          <View key={index} style={styles.studentRow}>
                              <View>
                                  <Text style={styles.studentName}>{item.name || item.studentId}</Text>
                                  <Text style={styles.studentStop}>{item.pickupStop} - {item.dropStop}</Text>
                              </View>
                              <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                  <View style={[styles.feeBadge, item.feeStatus === 'PAID' ? styles.feePaid : styles.feePending]}>
                                      <Text style={styles.feeText}>{item.feeStatus}</Text>
                                  </View>
                                  <TouchableOpacity onPress={() => onEditClick(item)}>
                                      <Ionicons name="create-outline" size={20} color="#2563EB" />
                                  </TouchableOpacity>
                              </View>
                          </View>
                      ))
                  )}
              </View>
          )}
      </View>

      {/* --- ASSIGN TRANSPORT MODAL --- */}
      <Modal visible={assignModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{isEditMode ? "Update Transport" : "Assign Transport"}</Text>
                      <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                          <Ionicons name="close" size={24} color="#374151" />
                      </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                      <Text style={styles.label}>Student (Read Only in Edit)</Text>
                        <TouchableOpacity 
                            style={[styles.dropdownBtn, isEditMode && {backgroundColor: '#F3F4F6'}]} 
                            onPress={() => !isEditMode && setShowStudentModal(true)}
                            disabled={isEditMode}
                        >
                            <Text style={assignForm.studentName ? styles.dropdownTextSelected : styles.dropdownText}>
                                {assignForm.studentName || "Search Student..."}
                            </Text>
                            {!isEditMode && <Ionicons name="search" size={18} color="#6B7280" />}
                        </TouchableOpacity>

                        <Text style={styles.label}>Route</Text>
                        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowRouteModal(true)}>
                            <Text style={assignForm.routeName ? styles.dropdownTextSelected : styles.dropdownText}>
                                {assignForm.routeName || "Search Route..."}
                            </Text>
                            <Ionicons name="search" size={18} color="#6B7280" />
                        </TouchableOpacity>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Pickup Stop</Text>
                                <TextInput style={styles.input} placeholder="e.g. Kothaguda" value={assignForm.pickupStop} onChangeText={(t) => setAssignForm({...assignForm, pickupStop: t})} />
                            </View>
                            <View style={styles.halfInput}>
                                <Text style={styles.label}>Drop Stop</Text>
                                <TextInput style={styles.input} placeholder="e.g. School Gate" value={assignForm.dropStop} onChangeText={(t) => setAssignForm({...assignForm, dropStop: t})} />
                            </View>
                        </View>

                        <View style={styles.row}>
                            {renderTimePickerField("Pickup Time", assignPickupDate, setAssignPickupDate, showAssignPickupPicker, setShowAssignPickupPicker, (t) => setAssignForm({...assignForm, pickupTime: t}))}
                            {renderTimePickerField("Drop Time", assignDropDate, setAssignDropDate, showAssignDropPicker, setShowAssignDropPicker, (t) => setAssignForm({...assignForm, dropTime: t}))}
                        </View>

                        <Text style={styles.label}>Fee Status</Text>
                        <View style={styles.radioRow}>
                            {['PAID', 'PENDING'].map(status => (
                                <TouchableOpacity key={status} style={[styles.radioBtn, assignForm.feeStatus === status && styles.radioBtnActive]} onPress={() => setAssignForm({...assignForm, feeStatus: status})}>
                                    <Text style={[styles.radioText, assignForm.feeStatus === status && styles.radioTextActive]}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.submitBtn} onPress={handleAssignOrUpdate} disabled={isSubmitting}>
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>{isEditMode ? "Update Changes" : "Assign Transport"}</Text>}
                        </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>

      {/* --- CREATE ROUTE MODAL --- */}
      <Modal visible={createModalVisible} transparent animationType="slide">
         <View style={styles.modalOverlay}>
             <View style={styles.modalContent}>
                 <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Create New Route</Text>
                     <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                         <Ionicons name="close" size={24} color="#374151" />
                     </TouchableOpacity>
                 </View>
                 
                 <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.label}>Route Name</Text>
                    <TextInput style={styles.input} placeholder="e.g. Route A" value={createForm.routeName} onChangeText={(t) => setCreateForm({...createForm, routeName: t})} />
                    <View style={styles.row}>
                        {renderTimePickerField("Start Time", createPickupDate, setCreatePickupDate, showCreatePickupPicker, setShowCreatePickupPicker, (t) => setCreateForm({...createForm, pickupStartTime: t}))}
                        {renderTimePickerField("End Time", createDropDate, setCreateDropDate, showCreateDropPicker, setShowCreateDropPicker, (t) => setCreateForm({...createForm, dropStartTime: t}))}
                    </View>
                    <Text style={styles.sectionHeader}>Vehicle & Driver</Text>
                    <TextInput style={styles.input} placeholder="Vehicle Name" value={createForm.vehicleName} onChangeText={(t) => setCreateForm({...createForm, vehicleName: t})} />
                    <TextInput style={styles.input} placeholder="Vehicle Number" value={createForm.vehicleNumber} onChangeText={(t) => setCreateForm({...createForm, vehicleNumber: t})} />
                    <TextInput style={styles.input} placeholder="Driver Name" value={createForm.driverName} onChangeText={(t) => setCreateForm({...createForm, driverName: t})} />
                    <TextInput style={styles.input} placeholder="Driver Phone" keyboardType="phone-pad" value={createForm.driverPhone} onChangeText={(t) => setCreateForm({...createForm, driverPhone: t})} />
                    <TouchableOpacity style={styles.submitBtn} onPress={handleCreateRoute} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Route</Text>}
                    </TouchableOpacity>
                 </ScrollView>
             </View>
         </View>
      </Modal>
      
      {/* --- FIXED: Moved Selection Modals to Bottom (Stacking Order Fix) --- */}
      {renderStudentModal()}
      {renderRouteModal(false)}
      {renderRouteModal(true)}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerRowMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  createBtn: { flexDirection: 'row', backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },

  card: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 2, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginLeft: 10 },

  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB', marginBottom: 5 },
  row: { flexDirection: 'row', gap: 16 },
  halfInput: { flex: 1 },
  timeBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB', height: 50 },
  timeBtnText: { fontSize: 14, color: '#111827' },

  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#FFF' },
  dropdownText: { fontSize: 14, color: '#9CA3AF' },
  dropdownTextSelected: { fontSize: 14, color: '#111827', fontWeight: '500' },

  radioRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  radioBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFF' },
  radioBtnActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  radioText: { color: '#4B5563', fontWeight: '600' },
  radioTextActive: { color: '#F97316' },

  submitBtn: { backgroundColor: '#2563EB', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelText: { color: '#6B7280', fontWeight: '600' },

  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  studentName: { fontWeight: 'bold', color: '#1F2937' },
  studentStop: { fontSize: 12, color: '#6B7280' },
  feeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  feePaid: { backgroundColor: '#D1FAE5' },
  feePending: { backgroundColor: '#FEE2E2' },
  feeText: { fontSize: 10, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 500, borderRadius: 16, padding: 24, maxHeight: '90%' },
  searchModalContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 400, borderRadius: 16, padding: 20, height: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  sectionHeader: { fontSize: 15, fontWeight: 'bold', color: '#2563EB', marginTop: 16, marginBottom: 8 },
  searchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  searchInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB', marginBottom: 10 },
  listItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemTitle: { fontWeight: 'bold', color: '#374151' },
  itemSub: { fontSize: 12, color: '#9CA3AF' },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#9CA3AF' },
  
  // NEW: Missing Style Added
  subHeader: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginTop: 10, marginBottom: 8 },
});