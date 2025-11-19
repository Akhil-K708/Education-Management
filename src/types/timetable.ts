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

export interface TimetableMini {
  day: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
}

export interface StudentSubjectTimetable {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  weeklyDays: string[];
  periods: TimetableMini[];
}

export interface WeeklyTimetable {
  day: string;
  list: TimetableMini[];
}

export interface StudentTimetableResponse {
  studentId: string;
  studentName: string;
  classSection: ClassSectionMini;
  classTeacher: TeacherMini;
  subjects: StudentSubjectTimetable[];
  todayTimetable: TimetableMini[];
  fullWeekTimetable: WeeklyTimetable[];
}