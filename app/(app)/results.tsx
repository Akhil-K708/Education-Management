import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import AdminResultView from '../../src/components/results/AdminResultView';
import StudentResultView from '../../src/components/results/StudentResultView';
import TeacherResultView from '../../src/components/results/TeacherResultView';
import { useAuth } from '../../src/context/AuthContext';

export default function ResultsScreen() {
  const { state } = useAuth();
  const user = state.user;
  
  if (state.status === 'loading' || !user) {
    return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color="#F97316"/></View>;
  }

  if (user.role === 'ADMIN') {
      return <AdminResultView />;
  }

  if (user.role === 'TEACHER') {
      return <TeacherResultView />;
  }

  return <StudentResultView />;
}