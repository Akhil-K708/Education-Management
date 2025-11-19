import { Assignment, AssignmentSubmission } from '../types/assignment';
import { studentApi } from './axiosInstance';

// 1. Get Assignments for a Class
export const getStudentAssignments = async (classSectionId: string): Promise<Assignment[]> => {
  try {
    // Endpoint: /api/student/assignments/class/{classSectionId}
    const response = await studentApi.get<Assignment[]>(`/assignments/class/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    throw error;
  }
};

// 2. Get My Submissions (To check if already submitted)
export const getMySubmissions = async (studentId: string): Promise<AssignmentSubmission[]> => {
  try {
    // Endpoint: /api/student/assignment-submissions/student/{studentId}
    const response = await studentApi.get<AssignmentSubmission[]>(`/assignment-submissions/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
};

// 3. Submit Assignment
export const submitStudentAssignment = async (
  assignmentId: string, 
  subjectId: string, 
  data: Partial<AssignmentSubmission>
): Promise<string> => {
  try {
    // Endpoint: /api/student/assignment-submissions/{assignmentId}/{subjectId}
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