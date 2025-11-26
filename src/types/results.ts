export interface SubjectResult {
  id: string;
  subjectName: string;
  paperObtained: number;
  paperTotal: number;
  assignmentObtained: number;
  assignmentTotal: number;
  totalObtained: number; 
  totalMax: number;      
  status: string;
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

// --- UPDATED MARKS ENTRY TYPES (Matched with Backend) ---
export interface MarksEntryItem {
  studentId: string;
  // Previous 'marksObtained' removed
  paperObtained: number;
  paperTotal: number;
  assignmentObtained: number;
  assignmentTotal: number;
  attendanceStatus: 'PRESENT' | 'ABSENT';
  remarks: string;
}

export interface SubjectMarksEntryRequest {
  examId: string;
  classSectionId: string;
  subjectId: string;
  entries: MarksEntryItem[];
}