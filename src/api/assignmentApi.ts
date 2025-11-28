import { Assignment, AssignmentSubmission } from "../types/assignment";
import { studentApi } from "./axiosInstance";
 
export const getStudentAssignments = async (
  classSectionId: string
): Promise<Assignment[]> => {
  try {
    const response = await studentApi.get(
      `/assignments/class/${classSectionId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching class assignments:", error);
    return [];
  }
};
 
export const getMySubmissions = async (
  studentId: string
): Promise<AssignmentSubmission[]> => {
  try {
    const response = await studentApi.get(
      `/assignment-submissions/student/${studentId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching my submissions:", error);
    return [];
  }
};
 
export const submitStudentAssignment = async (
  assignmentId: string,
  subjectId: string,
  formData: FormData
) => {
  return studentApi.post(
    `/assignment-submissions/${assignmentId}/${subjectId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
 
export const getTeacherAssignments = async (
  teacherId: string
): Promise<Assignment[]> => {
  try {
    const response = await studentApi.get(`/assignments/teacher/${teacherId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    return [];
  }
};
 
export const createAssignment = async (
  teacherId: string,
  subjectId: string,
  classSectionId: string,
  formData: FormData
) => {
  return studentApi.post(
    `/assignment/${teacherId}/${subjectId}/${classSectionId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};
 
export const getAssignmentSubmissions = async (
  assignmentId: string,
  subjectId: string
): Promise<AssignmentSubmission[]> => {
  try {
    const response = await studentApi.get(
      `/assignment-submissions/${assignmentId}/${subjectId}/all`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
};
 
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
 