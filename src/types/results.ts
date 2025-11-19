export interface SubjectResult {
  id: string;
  subjectName: string;
  paperObtained: number;
  paperTotal: number;
  assignmentObtained: number;
  assignmentTotal: number;
  totalObtained: number; // Paper + Assignment
  totalMax: number;      // Max Paper + Max Assignment
  status: 'Pass' | 'Fail';
}

export interface ExamResultData {
  examId: string;
  examName: string;
  stats: {
    noOfSubjects: number;
    totalMarksObtained: number;
    maxTotalMarks: number;
    percentage: string;
    rank: string;
  };
  subjects: SubjectResult[];
  finalMessage: string; // e.g., "Congratulations you passed with distinction"
}