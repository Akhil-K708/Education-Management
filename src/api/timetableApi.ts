import { StudentWeeklyTimetableDTO } from '../types/timetable';
import { studentApi } from './axiosInstance';

export const getStudentTimetable = async (studentId: string): Promise<StudentWeeklyTimetableDTO> => {
  try {
    const response = await studentApi.get<StudentWeeklyTimetableDTO>(`/${studentId}/weekly-timetable`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student timetable:", error);
    throw error;
  }
};