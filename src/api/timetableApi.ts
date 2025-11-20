import { StudentWeeklyTimetableDTO } from '../types/timetable';
import { studentApi } from './axiosInstance';

// --- SHARED ---
export const getStudentTimetable = async (studentId: string): Promise<StudentWeeklyTimetableDTO> => {
  try {
    const response = await studentApi.get<StudentWeeklyTimetableDTO>(`/${studentId}/weekly-timetable`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student timetable:", error);
    throw error;
  }
};

// --- TEACHER ---
// Note: Backend should have this endpoint. If not, ensure backend adds it.
// Assuming endpoint: /api/student/teacher/{teacherId}/timetable
export const getTeacherTimetable = async (teacherId: string) => {
  try {
    // Assuming the structure is similar to StudentWeeklyTimetableDTO or list of periods
    const response = await studentApi.get(`/teacher/${teacherId}/weekly-timetable`); 
    // NOTE: If this specific endpoint doesn't exist in your current backend, 
    // you might need to ask backend dev to add `getTeacherWeeklyTimetable`.
    // For now, I'm assuming it exists or follows similar pattern.
    return response.data;
  } catch (error) {
    console.error("Error fetching teacher timetable:", error);
    return null;
  }
};

// --- ADMIN HELPER FUNCTIONS ---
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
  } catch (error) {
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