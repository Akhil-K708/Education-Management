import { ClassFeeStatsDTO, PaymentHistoryItem, StudentFeeDetails, StudentFeeStatusDTO } from '../types/fees';
import { studentApi } from './axiosInstance';

// --- STUDENT ENDPOINTS ---

export const getStudentFeeDetails = async (studentId: string): Promise<StudentFeeDetails | null> => {
  try {
    const response = await studentApi.get<StudentFeeDetails>(`/fee/student/dashboard/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching student fee details:", error);
    return null;
  }
};

// --- ADMIN ENDPOINTS ---

export const getAdminFeeStats = async (): Promise<ClassFeeStatsDTO[]> => {
  try {
    const response = await studentApi.get<ClassFeeStatsDTO[]>('/fee/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error("Error fetching admin fee stats:", error);
    return [];
  }
};

export const getClassFeeStatus = async (classSectionId: string): Promise<StudentFeeStatusDTO[]> => {
  try {
    const response = await studentApi.get<StudentFeeStatusDTO[]>(`/fee/admin/class-status/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching class fee status:", error);
    return [];
  }
};

export const getAllPayments = async (): Promise<PaymentHistoryItem[]> => {
  try {
    const response = await studentApi.get<PaymentHistoryItem[]>('/fee/admin/payments');
    return response.data;
  } catch (error) {
    console.error("Error fetching all payments:", error);
    return [];
  }
};

export interface CreateFeeRequest {
  studentId: string;
  feeName: string;
  amount: number;
  dueDate: string;
  isExtra: boolean;
}

export const assignFeesBulk = async (fees: CreateFeeRequest[]) => {
  try {
    const response = await studentApi.post('/fee/admin/bulk-create', fees);
    return response.data;
  } catch (error) {
    console.error("Error assigning fees:", error);
    throw error;
  }
};