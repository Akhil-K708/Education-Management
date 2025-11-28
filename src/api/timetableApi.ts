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

export const getTeacherTimetable = async (teacherId: string) => {
  try {
    const response = await studentApi.get(`/teacher/${teacherId}/weekly-timetable`); 
    return response.data;
  } catch (error) {
    console.error("Error fetching teacher timetable:", error);
    return null;
  }
};

export const getAllClasses = async () => {
  const response = await studentApi.get('/class-sections');
  return response.data;
};

export const getAllSubjects = async () => {
  const response = await studentApi.get('/subject/allSubjects');
  return response.data;
};

export const getAllTeachers = async () => {
  const response = await studentApi.get('/teacher/all');
  return response.data;
};

export const getStudentIdByClass = async (classSectionId: string): Promise<string | null> => {
  try {
    const response = await studentApi.get(`/class/${classSectionId}/students`);
    if (response.data && response.data.length > 0) {
      return response.data[0].studentId;
    }
    return null;
  } catch (error: any) {
    if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        return null;
    }
    return null;
  }
};

export const saveTimetable = async (classSectionId: string, periods: any[], isUpdate: boolean = false) => {
  const endpoint = isUpdate ? '/update/timetable' : '/create/timetable';
  const payload = { classSectionId, periods };
  try {
    if (isUpdate) { await studentApi.put(endpoint, payload); } 
    else { await studentApi.post(endpoint, payload); }
    return "Success";
  } catch (error) {
    console.error("Error saving timetable:", error);
    throw error;
  }
};