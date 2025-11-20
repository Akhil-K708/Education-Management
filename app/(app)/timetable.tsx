import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import AdminTimetableView from '../../src/components/timetable/AdminTimetableView';
import StudentTimetableView from '../../src/components/timetable/StudentTimetableView';
import TeacherTimetableView from '../../src/components/timetable/TeacherTimetableView';
import { useAuth } from '../../src/context/AuthContext';

export default function TimetableScreen() {
  const { state } = useAuth();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F97316" />
        </View>
    );
  }

  if (user.role === 'ADMIN') {
      return <AdminTimetableView />;
  } 
  
  if (user.role === 'TEACHER') {
      return <TeacherTimetableView />;
  }
  
  if (user.role === 'STUDENT') {
      return <StudentTimetableView />;
  }

  return null;
}