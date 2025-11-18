import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function ClassScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  // --- ప్రొటెక్షన్ గార్డ్ ---
  if (user.role !== 'ADMIN') {
    return router.replace('/(app)');
  }

  // --- అడ్మిన్ కంటెంట్ ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Class Management</Text>
      <Text style={styles.subtitle}>Your class and section details will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6B7280' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});