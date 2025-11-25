import { StudentTransportDetails, TransportAssignRequest, TransportRoute } from '../types/transport';
import { studentApi } from './axiosInstance';

// --- STUDENT ENDPOINTS ---
export const getStudentTransportDetails = async (studentId: string): Promise<StudentTransportDetails> => {
  try {
    const response = await studentApi.get<StudentTransportDetails>(`/transport/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching transport details:", error);
    throw error;
  }
};

// --- ADMIN ENDPOINTS ---
export const createTransportRoute = async (route: TransportRoute): Promise<TransportRoute> => {
  try {
    const response = await studentApi.post<TransportRoute>('/transport/route', route);
    return response.data;
  } catch (error) {
    console.error("Error creating route:", error);
    throw error;
  }
};

export const updateTransportRoute = async (routeId: string, route: TransportRoute): Promise<TransportRoute> => {
  try {
    const response = await studentApi.put<TransportRoute>(`/transport/${routeId}`, route);
    return response.data;
  } catch (error) {
    console.error("Error updating route:", error);
    throw error;
  }
};

export const assignTransportToStudent = async (studentId: string, data: TransportAssignRequest) => {
  try {
    const response = await studentApi.post(`/transport/assign/${studentId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error assigning transport:", error);
    throw error;
  }
};

export const updateStudentTransport = async (studentId: string, data: TransportAssignRequest) => {
  try {
    // PUT /api/student/transport/assign/{studentId}
    const response = await studentApi.put(`/transport/assign/${studentId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating transport assignment:", error);
    throw error;
  }
};

// NEW: Get All Routes (For Dropdown)
export const getAllTransportRoutes = async (): Promise<TransportRoute[]> => {
  try {
    // Backend needs to implement this: GET /api/student/transport/routes
    const response = await studentApi.get<TransportRoute[]>('/transport/routes'); 
    return response.data;
  } catch (error) {
    console.log("Error fetching routes list (API might be missing)"); 
    return [];
  }
};

// NEW: Get Students by Route
export const getStudentsByRoute = async (routeId: string): Promise<any[]> => {
  try {
    const response = await studentApi.get<any[]>(`/transport/route/${routeId}/students`);
    return response.data;
  } catch (error) {
    console.error("Error fetching route students:", error);
    return [];
  }
};