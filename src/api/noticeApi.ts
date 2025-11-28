import { Notice } from '../types/notice';
import { studentApi } from './axiosInstance';

// Get All Notices (For Admin, Teacher, Student)
export const getAllNotices = async (): Promise<Notice[]> => {
  try {
    const response = await studentApi.get<Notice[]>('/notice/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching notices:", error);
    return [];
  }
};

// Create Notice (Only Admin)
export const createNotice = async (data: Notice): Promise<Notice> => {
  try {
    const response = await studentApi.post<Notice>('/notice/create', data);
    return response.data;
  } catch (error) {
    console.error("Error creating notice:", error);
    throw error;
  }
};

// Update Notice (Only Admin)
export const updateNotice = async (id: string, data: Notice): Promise<Notice> => {
  try {
    const response = await studentApi.put<Notice>(`/notice/update/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating notice:", error);
    throw error;
  }
};

// Delete Notice (Only Admin)
export const deleteNotice = async (id: string): Promise<string> => {
  try {
    const response = await studentApi.delete(`/notice/delete/${id}`);
    return response.data; 
  } catch (error) {
    console.error("Error deleting notice:", error);
    throw error;
  }
};