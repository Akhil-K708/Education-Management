import { studentApi } from './axiosInstance';

export const getDailyClassAttendance = async (classSectionId: string, date: string) => {
  try {
    const response = await studentApi.get<any[]>(`/attendance/class/${classSectionId}/date/${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching daily attendance:", error);
    return [];
  }
};

export interface AttendanceStats {
  present: number;
  absent: number;
  holidays: number;
  percentage: number;
}
export interface DailyRecord {
  date: string; 
  status: string; 
}
export interface StudentAttendanceViewDTO {
  studentId: string;
  present: number;
  absent: number;
  holidays: number;
  percentage: number;
  dailyRecords: DailyRecord[];
}
export const getStudentAttendance = async (studentId: string, year: number, month: number): Promise<StudentAttendanceViewDTO> => {
  try {
    const response = await studentApi.get<StudentAttendanceViewDTO>(`/attendance/${studentId}/${year}/${month}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    throw error;
  }
};
export const getTeacherClasses = async (teacherId: string) => {
  try {
    const response = await studentApi.get(`/teacher/assigned-classes/${teacherId}`);
    return response.data; 
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return [];
  }
};
export const getClassStudents = async (classSectionId: string) => {
  try {
    const response = await studentApi.get(`/class/${classSectionId}/students`);
    return response.data; 
  } catch (error) {
    console.error("Error fetching class students:", error);
    return [];
  }
};
export const markAttendance = async (
    classSectionId: string,
    teacherId: string,
    date: string, 
    entries: { studentId: string; status: string }[]
) => {
  try {
    const payload = { classSectionId, date, entries };
    const response = await studentApi.post(`/attendance/mark/${classSectionId}/${teacherId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw error;
  }
};

export const getStudentYearlyAttendance = async (studentId: string, year: number): Promise<StudentAttendanceViewDTO> => {
  try {
    const response = await studentApi.get<StudentAttendanceViewDTO>(`/attendance/${studentId}/year/${year}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student yearly attendance:", error);
    throw error;
  }
};