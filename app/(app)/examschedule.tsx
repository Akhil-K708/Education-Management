import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function ExamScheduleScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exam Timetable</Text>
      <Text style={styles.subtitle}>Upcoming exam dates and schedules will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#111827' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});