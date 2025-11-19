import { StudentDTO } from '../types/student';
import { studentApi } from './axiosInstance';

export const getStudentProfile = async (studentId: string): Promise<StudentDTO> => {
  try {
    const response = await studentApi.get<StudentDTO>(`/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student profile:", error);
    throw error;
  }
};