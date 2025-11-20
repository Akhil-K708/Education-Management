import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import AdminExamScheduleView from '../../src/components/exams/AdminExamScheduleView';
import StudentExamScheduleView from '../../src/components/exams/StudentExamScheduleView';
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

  // --- TEACHER VIEW (View All Exams) ---
  // Teachers can also view what Admins created or use the Student view structure to see schedules
  // Currently, using Student View logic (which fetches based on class) might be empty for teacher.
  // For now, let's show Admin View (without edit rights) or a simple list.
  // Or simple text: "View Exam Schedule feature coming for teachers"
  if (user.role === 'TEACHER') {
     // Reusing Admin view but maybe hide 'Schedule' button or just show list
     // For simplicity now:
     return <AdminExamScheduleView />; 
  }

  return <StudentExamScheduleView />;
}