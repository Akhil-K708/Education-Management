import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function TransportScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (user.role !== 'ADMIN' && user.role !== 'STUDENT') {
    return router.replace('/(app)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transport Details</Text>
      <Text style={styles.subtitle}>
        {user.role === 'ADMIN' 
          ? 'Manage transport vehicles and routes.' 
          : 'View your bus route and driver details here.'}
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