import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import AdminExamScheduleView from '../../src/components/exams/AdminExamScheduleView';
import StudentExamScheduleView from '../../src/components/exams/StudentExamScheduleView';
import TeacherExamScheduleView from '../../src/components/exams/TeacherExamScheduleView'; // <-- Import New Component
import { useAuth } from '../../src/context/AuthContext';

export default function ExamScheduleScreen() {
  const { state } = useAuth();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color="#F97316"/></View>;
  }

  if (user.role === 'ADMIN') {
      return <AdminExamScheduleView />;
  }

  if (user.role === 'TEACHER') {
     return <TeacherExamScheduleView />; 
  }

  return <StudentExamScheduleView />;
}