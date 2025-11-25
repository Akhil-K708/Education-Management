import { ExamResultData, SubjectMarksEntryRequest } from '../types/results';
import { studentApi } from './axiosInstance';

// --- STUDENT: MOCK DATA (Existing) ---
// (Nuvvu Student ki Mock vadutunnav kabatti deenni alage unchanu)

const unit1Results: ExamResultData = {
  examId: 'unit1',
  examName: 'Unit Test 1',
  stats: { noOfSubjects: 6, totalMarksObtained: 545, maxTotalMarks: 600, percentage: '90.8%', rank: '4th' },
  subjects: [
    { id: '1', subjectName: 'Telugu', paperObtained: 75, paperTotal: 80, assignmentObtained: 18, assignmentTotal: 20, totalObtained: 93, totalMax: 100, status: 'Pass' },
    // ... other subjects
  ],
  finalMessage: 'Congratulations! You passed with distinction.',
};

export const getAvailableExams = async (): Promise<{ id: string; name: string }[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 'unit1', name: 'Unit Test 1' },
        { id: 'halfyearly', name: 'Half Yearly' },
      ]);
    }, 500);
  });
};

export const getExamResult = async (examId: string): Promise<ExamResultData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(unit1Results);
    }, 500);
  });
};


// --- TEACHER: REAL API CALLS (New) ---

// 1. Save Marks (Backend: PUT /api/student/exams/enter-marks/{subjectId})
export const enterMarks = async (subjectId: string, data: SubjectMarksEntryRequest): Promise<any> => {
  try {
    const response = await studentApi.put(`/exams/enter-marks/${subjectId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error entering marks:", error);
    throw error;
  }
};

// 2. Get Subjects for a Class (Backend: GET /api/student/subject/assign/{classSectionId})
// (Results screen lo dropdown kosam helper)
export const getSubjectsByClass = async (classSectionId: string): Promise<any[]> => {
  try {
    const response = await studentApi.get(`/subject/assign/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching class subjects:", error);
    return [];
  }
};