import { ExamDaySchedule, ExamMaster } from '../types/exam';
import { studentApi } from './axiosInstance';

export const getAllExams = async (): Promise<ExamMaster[]> => {
  try {
    const response = await studentApi.get<ExamMaster[]>('/exams/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
};

export const createExam = async (data: Partial<ExamMaster>): Promise<ExamMaster> => {
  try {
    const response = await studentApi.post<ExamMaster>('/exams/create', data);
    return response.data;
  } catch (error) {
    console.error("Error creating exam:", error);
    throw error;
  }
};

export const scheduleExamComprehensive = async (payload: {
    examId: string;
    classSectionIds: string[];
    schedules: {
        subjectId: string;
        examDate: string;
        startTime: string;
        endTime: string;
    }[];
}) => {
    try {
        const response = await studentApi.post('/exams/schedule-comprehensive', payload);
        return response.data;
    } catch (error) {
        console.error("Error scheduling exam comprehensive:", error);
        throw error;
    }
};

export const getExamTimetable = async (examId: string, classSectionId: string): Promise<ExamDaySchedule[]> => {
  try {
    const response = await studentApi.get<ExamDaySchedule[]>(`/exams/${examId}/timetable/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching exam timetable:", error);
    return [];
  }
};