import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { getTeacherTimetable } from '../../api/timetableApi';
import { useAuth } from '../../context/AuthContext';

export default function TeacherTimetableView() {
  const { state } = useAuth();
  const user = state.user;
  
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<any[]>([]); 
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user?.username) return;
    setLoading(true);
    try {
      const data = await getTeacherTimetable(user.username);
      if (data && data.weeklyTimetable) {
        setTimetable(data.weeklyTimetable);
      } else {
        setTimetable([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Class Schedule</Text>
      
      <FlatList
        data={timetable}
        keyExtractor={(item) => item.day}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No classes scheduled.</Text>
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
                    <View style={styles.timeBox}>
                      <Text style={styles.timeText}>{p.startTime}</Text>
                      <Text style={styles.toText}>to</Text>
                      <Text style={styles.timeText}>{p.endTime}</Text>
                    </View>
                    <View style={styles.detailsBox}>
                      <Text style={styles.subject}>{p.subjectName}</Text>
                      <View style={styles.classBadge}>
                        <Ionicons name="people-outline" size={12} color="#4B5563" />
                        <Text style={styles.classText}>Class {p.className || 'Section'}</Text> 
                      </View>
                    </View>
                 </View>
               ))
             ) : (
               <Text style={styles.freeText}>No classes (Free Day)</Text>
             )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  dayCard: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  dayHeader: { backgroundColor: '#FFF7ED', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dayText: { color: '#C2410C', fontWeight: 'bold', fontSize: 16 },
  periodRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  timeBox: { width: 70, alignItems: 'center', marginRight: 12 },
  timeText: { fontWeight: '600', color: '#1F2937', fontSize: 13 },
  toText: { fontSize: 10, color: '#9CA3AF' },
  detailsBox: { flex: 1 },
  subject: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  classBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  classText: { fontSize: 12, color: '#4B5563', marginLeft: 4 },
  freeText: { padding: 20, textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF', fontSize: 16 }
});