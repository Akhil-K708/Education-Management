import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function AssignmentsScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (user.role !== 'TEACHER' && user.role !== 'STUDENT') {
    return router.replace('/(app)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {user.role === 'TEACHER' ? 'Manage Assignments' : 'My Assignments'}
      </Text>
      <Text style={styles.subtitle}>
        {user.role === 'TEACHER' 
          ? 'Create and manage assignments here.' 
          : 'View your pending and completed assignments here.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#111827' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});