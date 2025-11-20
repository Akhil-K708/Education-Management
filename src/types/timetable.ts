export interface ClassSectionMini {
  classSectionId: string;
  className: string;
  sectionName: string;
  academicYear: string;
}

export interface TeacherMini {
  teacherId: string;
  fullName: string;
}

export interface Period {
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export interface DayEntry {
  day: string; 
  date: string; 
  periods: Period[];
}

export interface StudentWeeklyTimetableDTO {
  studentId: string;
  studentName: string;
  classSectionId: string;
  classSection: ClassSectionMini;
  classTeacher: TeacherMini | null;
  weeklyTimetable: DayEntry[];
}

export interface UniqueSubject {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}