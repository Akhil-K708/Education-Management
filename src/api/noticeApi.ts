import { Notice } from '../types/notice';
import { studentApi } from './axiosInstance';

// 1. Get All Notices (For Admin, Teacher, Student)
export const getAllNotices = async (): Promise<Notice[]> => {
  try {
    // Backend Endpoint: GET /api/student/notice/all
    const response = await studentApi.get<Notice[]>('/notice/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching notices:", error);
    return [];
  }
};

// 2. Create Notice (Only Admin)
export const createNotice = async (data: Notice): Promise<Notice> => {
  try {
    // Backend Endpoint: POST /api/student/notice/create
    const response = await studentApi.post<Notice>('/notice/create', data);
    return response.data;
  } catch (error) {
    console.error("Error creating notice:", error);
    throw error;
  }
};

// 3. Update Notice (Only Admin)
export const updateNotice = async (id: string, data: Notice): Promise<Notice> => {
  try {
    // Backend Endpoint: PUT /api/student/notice/update/{id}
    const response = await studentApi.put<Notice>(`/notice/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating notice:", error);
    throw error;
  }
};

// 4. Delete Notice (Only Admin)
export const deleteNotice = async (id: string): Promise<string> => {
  try {
    // Backend Endpoint: DELETE /api/student/notice/delete/{id}
    const response = await studentApi.delete(`/notice/delete/${id}`);
    return response.data; // Returns success message
  } catch (error) {
    console.error("Error deleting notice:", error);
    throw error;
  }
};