import { ExamResultData } from '../types/results';

// --- Mock Data for Unit 1 ---
const unit1Results: ExamResultData = {
  examId: 'unit1',
  examName: 'Unit Test 1',
  stats: {
    noOfSubjects: 6,
    totalMarksObtained: 545,
    maxTotalMarks: 600,
    percentage: '90.8%',
    rank: '4th',
  },
  subjects: [
    { id: '1', subjectName: 'Telugu', paperObtained: 75, paperTotal: 80, assignmentObtained: 18, assignmentTotal: 20, totalObtained: 93, totalMax: 100, status: 'Pass' },
    { id: '2', subjectName: 'Hindi', paperObtained: 70, paperTotal: 80, assignmentObtained: 19, assignmentTotal: 20, totalObtained: 89, totalMax: 100, status: 'Pass' },
    { id: '3', subjectName: 'English', paperObtained: 72, paperTotal: 80, assignmentObtained: 18, assignmentTotal: 20, totalObtained: 90, totalMax: 100, status: 'Pass' },
    { id: '4', subjectName: 'Maths', paperObtained: 78, paperTotal: 80, assignmentObtained: 20, assignmentTotal: 20, totalObtained: 98, totalMax: 100, status: 'Pass' },
    { id: '5', subjectName: 'Science', paperObtained: 65, paperTotal: 80, assignmentObtained: 17, assignmentTotal: 20, totalObtained: 82, totalMax: 100, status: 'Pass' },
    { id: '6', subjectName: 'Social', paperObtained: 74, paperTotal: 80, assignmentObtained: 19, assignmentTotal: 20, totalObtained: 93, totalMax: 100, status: 'Pass' },
  ],
  finalMessage: 'Congratulations! You passed with distinction.',
};

// --- Mock Data for Half Yearly ---
const halfYearlyResults: ExamResultData = {
  examId: 'halfyearly',
  examName: 'Half Yearly',
  stats: {
    noOfSubjects: 6,
    totalMarksObtained: 510,
    maxTotalMarks: 600,
    percentage: '85.0%',
    rank: '8th',
  },
  subjects: [
    { id: '1', subjectName: 'Telugu', paperObtained: 70, paperTotal: 80, assignmentObtained: 18, assignmentTotal: 20, totalObtained: 88, totalMax: 100, status: 'Pass' },
    { id: '2', subjectName: 'Hindi', paperObtained: 68, paperTotal: 80, assignmentObtained: 19, assignmentTotal: 20, totalObtained: 87, totalMax: 100, status: 'Pass' },
    { id: '3', subjectName: 'English', paperObtained: 65, paperTotal: 80, assignmentObtained: 17, assignmentTotal: 20, totalObtained: 82, totalMax: 100, status: 'Pass' },
    { id: '4', subjectName: 'Maths', paperObtained: 60, paperTotal: 80, assignmentObtained: 15, assignmentTotal: 20, totalObtained: 75, totalMax: 100, status: 'Pass' },
    { id: '5', subjectName: 'Science', paperObtained: 25, paperTotal: 80, assignmentObtained: 10, assignmentTotal: 20, totalObtained: 35, totalMax: 100, status: 'Fail' }, // Failed example
    { id: '6', subjectName: 'Social', paperObtained: 72, paperTotal: 80, assignmentObtained: 18, assignmentTotal: 20, totalObtained: 90, totalMax: 100, status: 'Pass' },
  ],
  finalMessage: 'You need improvement in Science.',
};

// --- Get Available Exams List ---
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

// --- Get Result by Exam ID ---
export const getExamResult = async (examId: string): Promise<ExamResultData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (examId === 'halfyearly') {
        resolve(halfYearlyResults);
      } else {
        resolve(unit1Results);
      }
    }, 500);
  });
};