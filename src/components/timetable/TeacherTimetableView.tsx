import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions // For Responsive Layout
} from 'react-native';
import { studentApi } from '../../api/axiosInstance';
import { getTeacherTimetable } from '../../api/timetableApi';
import { useAuth } from '../../context/AuthContext';

export default function TeacherTimetableView() {
  const { state } = useAuth();
  const user = state.user;
  
  // Check for Web view
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<any[]>([]); 
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'TEACHING' | 'CLASS'>('TEACHING');

  const fetchData = async () => {
    if (!user?.username) return;
    setLoading(true);
    try {
      let data;
      
      if (activeTab === 'TEACHING') {
        data = await getTeacherTimetable(user.username);
      } else {
        const response = await studentApi.get(`/teacher/${user.username}/class-timetable`);
        data = response.data;
      }

      if (data && data.weeklyTimetable) {
        setTimetable(data.weeklyTimetable);
      } else {
        setTimetable([]);
      }
    } catch (e) {
      console.error(e);
      setTimetable([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Schedule</Text>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'TEACHING' && styles.tabActive]}
            onPress={() => setActiveTab('TEACHING')}
        >
            <Text style={[styles.tabText, activeTab === 'TEACHING' && styles.tabTextActive]}>My Teaching</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'CLASS' && styles.tabActive]}
            onPress={() => setActiveTab('CLASS')}
        >
            <Text style={[styles.tabText, activeTab === 'CLASS' && styles.tabTextActive]}>My Class</Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
         <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>
      ) : (
        <FlatList
            data={timetable}
            keyExtractor={(item) => item.day}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
            <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>
                    {activeTab === 'TEACHING' ? "No teaching classes scheduled." : "No class timetable found."}
                </Text>
            </View>
            }
            renderItem={({ item }) => (
            <View style={styles.dayCard}>
                <View style={styles.dayHeader}>
                    <Text style={styles.dayText}>{item.day}</Text>
                </View>

                {item.periods && item.periods.length > 0 ? (
                item.periods.map((p: any, index: number) => (
                    <View key={index} style={styles.periodRow}>
                        
                        {/* LEFT: Time */}
                        {/* Web Fix: Give flex 1.5 to Left */}
                        <View style={[styles.colLeft, isWeb && { flex: 1.5 }]}>
                            <View style={[styles.timeBadge, isWeb && styles.timeBadgeWeb]}>
                                <Text style={styles.timeText}>{p.startTime}</Text>
                                <Text style={[styles.toText, isWeb && styles.toTextWeb]}>to</Text>
                                <Text style={styles.timeText}>{p.endTime}</Text>
                            </View>
                        </View>

                        {/* MIDDLE: Class Name */}
                        {/* Web Fix: Give flex 1 to Center */}
                        <View style={[styles.colCenter, isWeb && { flex: 1 }]}>
                            <View style={styles.classBadge}>
                                <Text style={styles.classText}>
                                    {p.className ? `${p.className}-${p.section || ''}` : 'Class'}
                                </Text> 
                            </View>
                        </View>

                        {/* RIGHT: Subject */}
                        {/* Web Fix: Give flex 1.5 to Right (Matches Left, so Center stays exactly in middle) */}
                        <View style={[styles.colRight, isWeb && { flex: 1.5 }]}>
                            <Text style={styles.subjectText} numberOfLines={1} ellipsizeMode="tail">
                                {p.subjectName}
                            </Text>
                        </View>

                    </View>
                ))
                ) : (
                <Text style={styles.freeText}>No classes (Free Day)</Text>
                )}
            </View>
            )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#F97316', fontWeight: 'bold' },

  dayCard: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  dayHeader: { backgroundColor: '#FFF7ED', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', alignItems: 'center' },
  dayText: { color: '#C2410C', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  
  periodRow: { 
      flexDirection: 'row', 
      paddingVertical: 14, 
      paddingHorizontal: 12, 
      borderBottomWidth: 1, 
      borderBottomColor: '#F3F4F6', 
      alignItems: 'center',
      justifyContent: 'space-between'
  },

  // Mobile Defaults (Asymmetric to fit content)
  colLeft: { flex: 1, alignItems: 'flex-start' },
  colCenter: { flex: 0.8, alignItems: 'center' },
  colRight: { flex: 1.2, alignItems: 'flex-end' },

  // Time Badge Styles
  timeBadge: { alignItems: 'center' },
  timeBadgeWeb: { flexDirection: 'row', alignItems: 'center' }, // Side-by-side on Web

  timeText: { fontWeight: '700', color: '#374151', fontSize: 13 },
  toText: { fontSize: 10, color: '#9CA3AF', marginVertical: 1 },
  toTextWeb: { marginVertical: 0, marginHorizontal: 6, fontSize: 12 },

  classBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  classText: { fontSize: 13, fontWeight: 'bold', color: '#4B5563' },

  subjectText: { fontSize: 15, fontWeight: 'bold', color: '#111827', textTransform: 'capitalize', textAlign: 'right' },

  freeText: { padding: 20, textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', fontSize: 16, marginTop: 10 }
});