export interface ExamMaster {
  examId: string;
  examName: string;
  examType: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ExamSubjectSchedule {
  subjectId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
}

export interface ExamDaySchedule {
  examDate: string; 
  dayName: string;  
  subjects: ExamSubjectSchedule[];
}