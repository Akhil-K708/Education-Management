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
  finalMessage: string; 
}

// --- NEW TYPES FOR TEACHER MARKS ENTRY ---
export interface MarksEntryItem {
  studentId: string;
  marksObtained: number;
  attendanceStatus: 'PRESENT' | 'ABSENT';
  remarks: string;
}

export interface SubjectMarksEntryRequest {
  examId: string;
  classSectionId: string;
  subjectId: string;
  entries: MarksEntryItem[];
}