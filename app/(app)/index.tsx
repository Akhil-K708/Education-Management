import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AdminDashboard } from '../../src/components/dashboard/AdminDashboard';
import { StudentDashboard } from '../../src/components/dashboard/StudentDashboard';
import { TeacherDashboard } from '../../src/components/dashboard/TeacherDashboard';
import { useAuth } from '../../src/context/AuthContext';

export default function DashboardScreen() {
  const { state } = useAuth();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      return <StudentDashboard />;
  }
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});