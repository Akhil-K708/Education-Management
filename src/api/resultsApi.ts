import { ExamResultData, SubjectMarksEntryRequest } from '../types/results';
import { studentApi } from './axiosInstance';

// --- COMMON: GET ALL EXAMS ---
export const getAvailableExams = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await studentApi.get<any[]>('/exams/all');
    return response.data.map((exam) => ({
      id: exam.examId,
      name: exam.examName,
    }));
  } catch (error) {
    console.error("Error fetching exams:", error);
    return [];
  }
};

// --- STUDENT: GET MY RESULTS ---
export const getStudentExamResult = async (
  examId: string, 
  studentId: string, 
  classSectionId: string
): Promise<ExamResultData | null> => {
  try {
    const response = await studentApi.get<any>(
      `/exams/result/${examId}/${studentId}`,
      { params: { classSectionId } }
    );
    const data = response.data;

    // Mapping Backend DTO to Frontend Type
    const resultData: ExamResultData = {
        examId: data.examId,
        examName: data.examName,
        stats: {
            noOfSubjects: data.subjects.length,
            totalMarksObtained: data.totalMarksObtained,
            maxTotalMarks: data.totalMarksMax,
            percentage: data.percentage ? `${data.percentage.toFixed(1)}%` : '0%',
            rank: data.rank ? getOrdinal(data.rank) : 'N/A'
        },
        subjects: data.subjects.map((sub: any) => ({
            id: sub.subjectId,
            subjectName: sub.subjectName,
            paperObtained: sub.paperObtained,
            paperTotal: sub.paperTotal,
            assignmentObtained: sub.assignmentObtained,
            assignmentTotal: sub.assignmentTotal,
            totalObtained: sub.subjectTotalObtained,
            totalMax: sub.subjectTotalMax,
            status: sub.status
        })),
        finalMessage: getRemarks(data.percentage)
    };

    return resultData;

  } catch (error: any) {
    console.error("Error fetching student result:", error);
    return null; 
  }
};

// --- TEACHER: ENTER MARKS ---
export const enterMarks = async (subjectId: string, data: SubjectMarksEntryRequest): Promise<string> => {
  try {
    const response = await studentApi.put(`/exams/enter-marks/${subjectId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error entering marks:", error);
    throw error;
  }
};

// --- TEACHER: GET SUBJECTS FOR CLASS ---
export const getSubjectMappings = async (classSectionId: string): Promise<any[]> => {
  try {
    const response = await studentApi.get(`/subject/assign/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subject mappings:", error);
    return [];
  }
};

// --- ADMIN: GET CLASS EXAM RESULTS (Detailed View) ---
// Backend: GET /api/student/exams/class-result/{examId}/{classSectionId}
export const getClassExamResults = async (
  examId: string, 
  classSectionId: string
): Promise<any[]> => {
  try {
    const response = await studentApi.get<any[]>(
      `/exams/class-result/${examId}/${classSectionId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching class results:", error);
    return [];
  }
};

// --- ADMIN: PUBLISH RESULTS ---
// Backend: PUT /api/student/exams/publish/{examId}/{classSectionId}
export const publishResult = async (
  examId: string, 
  classSectionId: string, 
  adminName: string = 'ADMIN'
): Promise<string> => {
  try {
    const response = await studentApi.put(
      `/exams/publish/${examId}/${classSectionId}`, 
      {}, 
      { params: { adminName } }
    );
    return response.data;
  } catch (error) {
    console.error("Error publishing results:", error);
    throw error;
  }
};

// --- HELPER UTILS ---
function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getRemarks(percentage: number): string {
    if (percentage >= 90) return "Outstanding performance!";
    if (percentage >= 75) return "Excellent work!";
    if (percentage >= 60) return "Good job!";
    if (percentage >= 50) return "You passed.";
    return "Work harder next time.";
}