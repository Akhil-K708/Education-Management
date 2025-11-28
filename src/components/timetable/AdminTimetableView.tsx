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
    TouchableOpacity,
    View
} from 'react-native';
import {
    getAllClasses,
    getAllSubjects,
    getAllTeachers,
    getStudentIdByClass,
    getStudentTimetable,
    saveTimetable
} from '../../api/timetableApi';

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

// --- WEB TIME INPUT HELPER ---
const WebTimeInput = ({ value, onChange }: { value: string, onChange: (time: string) => void }) => {
    return React.createElement('input', {
       type: 'time',
       value: value,
       style: {
           borderWidth: 1, 
           borderColor: '#E5E7EB', 
           borderRadius: 8, 
           padding: 10,
           backgroundColor: '#F9FAFB', 
           width: '100%', 
           height: 45,
           fontSize: 14,
           fontFamily: 'System', 
           boxSizing: 'border-box',
           outline: 'none',
           flex: 1
       },
       onChange: (e: any) => onChange(e.target.value)
    });
 };

export default function AdminTimetableView() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [activeDay, setActiveDay] = useState<string>('MONDAY');
  
  const [timetablePeriods, setTimetablePeriods] = useState<any[]>([]);
  const [isExisting, setIsExisting] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
      startTime: '09:00',
      endTime: '10:00',
      subjectId: '',
      teacherId: ''
  });

  // Time Picker States
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
      try {
          const [cls, sub, tch] = await Promise.all([getAllClasses(), getAllSubjects(), getAllTeachers()]);
          setClasses(cls);
          setSubjects(sub);
          setTeachers(tch);
      } catch(e) { console.error(e); }
  };

  const handleClassChange = async (classId: string) => {
      setSelectedClass(classId);
      setLoading(true);
      setTimetablePeriods([]);
      setIsExisting(false);

      try {
          // 🔥 FIX: getStudentIdByClass now handles 403 internally and returns null
          const studentId = await getStudentIdByClass(classId);
          
          if (studentId) {
              const data = await getStudentTimetable(studentId);
              if (data && data.weeklyTimetable) {
                  const flatList: any[] = [];
                  data.weeklyTimetable.forEach(dayEntry => {
                      dayEntry.periods.forEach(p => {
                          flatList.push({
                              day: dayEntry.day,
                              startTime: convertTime12to24(p.startTime), 
                              endTime: convertTime12to24(p.endTime),
                              subjectId: p.subjectId,
                              teacherId: p.teacherId,
                              subjectName: p.subjectName, 
                              teacherName: p.teacherName  
                          });
                      });
                  });
                  setTimetablePeriods(flatList);
                  setIsExisting(true);
              }
          } else {
              // 🔥 If no student found (e.g., 403), treat as new timetable
              console.log("No student or timetable found for class - Creating new");
              setIsExisting(false);
          }
      } catch (e) {
          // Fallback catch
          console.log("Error loading timetable, starting fresh");
          setIsExisting(false);
      } finally {
          setLoading(false);
      }
  };

  const convertTime12to24 = (time12h: string) => {
      if(!time12h) return "09:00";
      return time12h.replace(' AM', '').replace(' PM', '');
  };

  // Helper: Convert "HH:mm" string to Date object
  const parseTimeStr = (timeStr: string) => {
      const [h, m] = timeStr.split(':');
      const d = new Date();
      d.setHours(parseInt(h || '0'), parseInt(m || '0'), 0);
      return d;
  };

  // Helper: Convert Date object to "HH:mm" string
  const formatTimeStr = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleAddPeriod = () => {
      if(!newPeriod.subjectId || !newPeriod.teacherId || !newPeriod.startTime || !newPeriod.endTime) {
          Alert.alert("Error", "Please fill all fields");
          return;
      }
      
      const sub = subjects.find(s => s.subjectId === newPeriod.subjectId);
      const tch = teachers.find(t => t.teacherId === newPeriod.teacherId);

      const periodToAdd = {
          day: activeDay,
          ...newPeriod,
          subjectName: sub?.subjectName || 'Unknown',
          teacherName: tch?.teacherName || 'Unknown'
      };

      setTimetablePeriods([...timetablePeriods, periodToAdd]);
      setModalVisible(false);
  };

  const handleSave = async () => {
      if (!selectedClass) return;
      setLoading(true);
      try {
          const payload = timetablePeriods.map(p => ({
              day: p.day,
              subjectId: p.subjectId,
              teacherId: p.teacherId,
              startTime: p.startTime,
              endTime: p.endTime
          }));

          await saveTimetable(selectedClass, payload, isExisting);
          Alert.alert("Success", "Timetable Saved Successfully!");
          setIsExisting(true);
      } catch (e) {
          Alert.alert("Error", "Failed to save timetable");
      } finally {
          setLoading(false);
      }
  };

  const currentPeriods = timetablePeriods.filter(p => p.day === activeDay).sort((a,b) => a.startTime.localeCompare(b.startTime));

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Manage Timetable</Text>

        <View style={styles.selectorContainer}>
            <Text style={styles.label}>Select Class:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {classes.map(cls => (
                    <TouchableOpacity 
                        key={cls.classSectionId}
                        style={[styles.classBadge, selectedClass === cls.classSectionId && styles.classBadgeActive]}
                        onPress={() => handleClassChange(cls.classSectionId)}
                    >
                        <Text style={[styles.classText, selectedClass === cls.classSectionId && styles.classTextActive]}>
                            {cls.className}-{cls.section}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {selectedClass ? (
            <>
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {DAYS.map(day => (
                            <TouchableOpacity 
                                key={day} 
                                style={[styles.tab, activeDay === day && styles.tabActive]}
                                onPress={() => setActiveDay(day)}
                            >
                                <Text style={[styles.tabText, activeDay === day && styles.tabTextActive]}>
                                    {day.substring(0,3)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#F97316" style={{marginTop: 20}} />
                ) : (
                    <FlatList
                        data={currentPeriods}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{ paddingBottom: 80 }}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No classes on {activeDay}. Add one below.</Text>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.card}>
                                <View style={styles.timeBox}>
                                    <Text style={styles.time}>{item.startTime}</Text>
                                    <Text style={styles.timeTo}>to</Text>
                                    <Text style={styles.time}>{item.endTime}</Text>
                                </View>
                                <View style={styles.detailsBox}>
                                    <Text style={styles.subject}>{item.subjectName}</Text>
                                    <Text style={styles.teacher}>{item.teacherName}</Text>
                                </View>
                                <TouchableOpacity onPress={() => {
                                    const updated = timetablePeriods.filter(p => p !== item);
                                    setTimetablePeriods(updated);
                                }}>
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={20} color="#FFF" />
                        <Text style={styles.btnText}>Add Class</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Ionicons name="save-outline" size={20} color="#FFF" />
                        <Text style={styles.btnText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </>
        ) : (
            <View style={styles.placeholder}>
                <Ionicons name="calendar-outline" size={60} color="#E5E7EB" />
                <Text style={styles.placeholderText}>Select a class to manage timetable</Text>
            </View>
        )}

        {/* Add Period Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Add Class ({activeDay})</Text>
                    
                    <Text style={styles.inputLabel}>Time (HH:mm)</Text>
                    <View style={styles.row}>
                        {Platform.OS === 'web' ? (
                            <WebTimeInput 
                                value={newPeriod.startTime} 
                                onChange={(t) => setNewPeriod({...newPeriod, startTime: t})} 
                            />
                        ) : (
                            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartPicker(true)}>
                                <Text>{newPeriod.startTime}</Text>
                                <Ionicons name="time-outline" size={18} color="gray" />
                            </TouchableOpacity>
                        )}

                        <Text>-</Text>

                        {Platform.OS === 'web' ? (
                            <WebTimeInput 
                                value={newPeriod.endTime} 
                                onChange={(t) => setNewPeriod({...newPeriod, endTime: t})} 
                            />
                        ) : (
                            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowEndPicker(true)}>
                                <Text>{newPeriod.endTime}</Text>
                                <Ionicons name="time-outline" size={18} color="gray" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Native Time Pickers */}
                    {showStartPicker && (
                        <DateTimePicker
                            value={parseTimeStr(newPeriod.startTime)}
                            mode="time"
                            display="default"
                            onChange={(e: DateTimePickerEvent, d?: Date) => {
                                setShowStartPicker(false);
                                if (d) setNewPeriod({...newPeriod, startTime: formatTimeStr(d)});
                            }}
                        />
                    )}
                    {showEndPicker && (
                        <DateTimePicker
                            value={parseTimeStr(newPeriod.endTime)}
                            mode="time"
                            display="default"
                            onChange={(e: DateTimePickerEvent, d?: Date) => {
                                setShowEndPicker(false);
                                if (d) setNewPeriod({...newPeriod, endTime: formatTimeStr(d)});
                            }}
                        />
                    )}

                    <Text style={styles.inputLabel}>Subject</Text>
                    <ScrollView style={styles.dropdown} nestedScrollEnabled>
                        {subjects.map(s => (
                            <TouchableOpacity 
                                key={s.subjectId} 
                                style={[styles.ddItem, newPeriod.subjectId === s.subjectId && styles.ddItemActive]}
                                onPress={() => setNewPeriod({...newPeriod, subjectId: s.subjectId})}
                            >
                                <Text style={styles.ddText}>{s.subjectName}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.inputLabel}>Teacher</Text>
                    <ScrollView style={styles.dropdown} nestedScrollEnabled>
                        {teachers.map(t => (
                            <TouchableOpacity 
                                key={t.teacherId} 
                                style={[styles.ddItem, newPeriod.teacherId === t.teacherId && styles.ddItemActive]}
                                onPress={() => setNewPeriod({...newPeriod, teacherId: t.teacherId})}
                            >
                                <Text style={styles.ddText}>{t.teacherName}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddPeriod}>
                            <Text style={styles.modalAddText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  selectorContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  classBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  classBadgeActive: { backgroundColor: '#F97316', borderColor: '#F97316' },
  classText: { color: '#374151', fontWeight: '500' },
  classTextActive: { color: '#FFF' },

  tabsContainer: { marginBottom: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, backgroundColor: '#E5E7EB', borderRadius: 8 },
  tabActive: { backgroundColor: '#2563EB' },
  tabText: { fontWeight: '600', color: '#4B5563' },
  tabTextActive: { color: '#FFF' },

  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 1 },
  timeBox: { alignItems: 'center', marginRight: 16, minWidth: 50 },
  time: { fontWeight: 'bold', color: '#1F2937' },
  timeTo: { fontSize: 10, color: '#9CA3AF' },
  detailsBox: { flex: 1 },
  subject: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  teacher: { fontSize: 14, color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  footer: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  addBtn: { flex: 1, backgroundColor: '#2563EB', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12 },
  saveBtn: { flex: 1, backgroundColor: '#10B981', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: 'bold', marginLeft: 6 },

  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.6 },
  placeholderText: { marginTop: 10, fontSize: 16, color: '#4B5563' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 10, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  
  timeBtn: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  dropdown: { maxHeight: 120, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8 },
  ddItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  ddItemActive: { backgroundColor: '#FFF7ED' },
  ddText: { fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, alignItems: 'center' },
  cancelText: { marginRight: 20, fontWeight: '600', color: '#6B7280' },
  modalAddBtn: { backgroundColor: '#F97316', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  modalAddText: { color: '#FFF', fontWeight: 'bold' }
});