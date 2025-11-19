// src/api/timetableApi.ts

import { StudentTimetableResponse } from '../types/timetable';
import { studentApi } from './axiosInstance';

// స్టూడెంట్ టైమ్‌టేబుల్ తెచ్చుకోవడానికి API కాల్
export const getStudentTimetable = async (studentId: string): Promise<StudentTimetableResponse> => {
  try {
    // Endpoint: /api/student/{studentId}/timetable
    const response = await studentApi.get<StudentTimetableResponse>(`/${studentId}/timetable`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student timetable:", error);
    throw error;
  }
};