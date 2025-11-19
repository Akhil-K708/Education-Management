// src/types/timetable.ts

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
  day: string;  // e.g., "MONDAY"
  date: string; // e.g., "2025-11-20"
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

// Frontend Helper Interface for Unique Subject List
export interface UniqueSubject {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}