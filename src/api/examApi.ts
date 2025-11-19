// src/api/examApi.ts

import { ExamDaySchedule, ExamMaster } from '../types/exam';
import { studentApi } from './axiosInstance';

// 1. Get All Exams (No Filtering - Backend handles logic via ClassID in next step)
export const getAllExams = async (): Promise<ExamMaster[]> => {
  try {
    // Endpoint: /api/exams/all
    const response = await studentApi.get<ExamMaster[]>('/exams/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
};

// 2. Get Timetable for specific Exam and Class
export const getExamTimetable = async (examId: string, classSectionId: string): Promise<ExamDaySchedule[]> => {
  try {
    // Endpoint: /api/exams/{examId}/timetable/{classSectionId}
    const response = await studentApi.get<ExamDaySchedule[]>(`/exams/${examId}/timetable/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching exam timetable:", error);
    return [];
  }
};