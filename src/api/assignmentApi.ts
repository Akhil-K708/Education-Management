import { Assignment, AssignmentSubmission } from '../types/assignment';
import { studentApi } from './axiosInstance';

// --- STUDENT ENDPOINTS ---

// 1. Get Assignments for a Class (Student View)
export const getStudentAssignments = async (classSectionId: string): Promise<Assignment[]> => {
  try {
    const response = await studentApi.get<Assignment[]>(`/assignments/class/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching class assignments:", error);
    return []; // Return empty array on error to prevent crash
  }
};

// 2. Get My Submissions (Student View)
export const getMySubmissions = async (studentId: string): Promise<AssignmentSubmission[]> => {
  try {
    const response = await studentApi.get<AssignmentSubmission[]>(`/assignment-submissions/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching my submissions:", error);
    return [];
  }
};

// 3. Submit Assignment (Student Action)
export const submitStudentAssignment = async (
  assignmentId: string, 
  subjectId: string, 
  data: Partial<AssignmentSubmission>
): Promise<string> => {
  try {
    const response = await studentApi.post(
      `/assignment-submissions/${assignmentId}/${subjectId}`,
      data
    );
    return response.data; 
  } catch (error) {
    console.error("Error submitting assignment:", error);
    throw error;
  }
};

// --- TEACHER ENDPOINTS ---

// 4. Get Assignments Created by Teacher
export const getTeacherAssignments = async (teacherId: string): Promise<Assignment[]> => {
  try {
    const response = await studentApi.get<Assignment[]>(`/assignments/teacher/${teacherId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    return [];
  }
};

// 5. Create New Assignment
// Endpoint: /assignment/{teacherId}/{subjectId}/{classSectionId}
export const createAssignment = async (
  teacherId: string,
  subjectId: string,
  classSectionId: string,
  data: Partial<Assignment>
): Promise<Assignment> => {
  try {
    const response = await studentApi.post<Assignment>(
      `/assignment/${teacherId}/${subjectId}/${classSectionId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error creating assignment:", error);
    throw error;
  }
};

// 6. Get All Submissions for an Assignment (Teacher View)
export const getAssignmentSubmissions = async (
  assignmentId: string,
  subjectId: string
): Promise<AssignmentSubmission[]> => {
  try {
    const response = await studentApi.get<AssignmentSubmission[]>(
      `/assignment-submissions/${assignmentId}/${subjectId}/all`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
};

// 7. Review Submission (Grade/Remark)
export const reviewSubmission = async (
  assignmentId: string,
  subjectId: string,
  submissionNumber: number,
  data: { status: string; remark: string; reviewedBy: string }
): Promise<string> => {
  try {
    const response = await studentApi.put(
      `/assignment-submissions/${assignmentId}/${subjectId}/${submissionNumber}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error reviewing submission:", error);
    throw error;
  }
};