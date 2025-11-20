import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import StudentAssignmentsView from '../../src/components/assignments/StudentAssignmentsView';
import TeacherAssignmentsView from '../../src/components/assignments/TeacherAssignmentsView';
import { useAuth } from '../../src/context/AuthContext';

export default function AssignmentsScreen() {
  const { state } = useAuth();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F97316" />
        </View>
    );
  }

  if (user.role === 'TEACHER') {
      return <TeacherAssignmentsView />;
  } 
  
  if (user.role === 'STUDENT') {
      return <StudentAssignmentsView />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Admin Assignment View Coming Soon...</Text>
    </View>
  );
}