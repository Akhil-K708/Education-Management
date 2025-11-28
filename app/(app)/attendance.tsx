import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import AdminAttendanceView from '../../src/components/attendance/AdminAttendanceView';
import StudentAttendanceView from '../../src/components/attendance/StudentAttendanceView';
import TeacherAttendanceView from '../../src/components/attendance/TeacherAttendanceView';
import { useAuth } from '../../src/context/AuthContext';

export default function AttendanceScreen() {
  const { state } = useAuth();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (user.role === 'ADMIN') {
      return <AdminAttendanceView />;
  }

  if (user.role === 'TEACHER') {
      return <TeacherAttendanceView />;
  }

  return <StudentAttendanceView />;
}