export interface Teacher {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
  teacher: Teacher;
}

export interface WeeklyScheduleItem {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  time: string;
  room: string;
}

export interface StudentTimetableData {
  classTeacher: Teacher;
  subjects: Subject[];
}

export interface TeacherDetailsData {
  weeklySchedule: WeeklyScheduleItem[];
  attendance: string[];
}

export interface DailyScheduleItem {
  id: string;
  subjectName: string;
  time: string;
  room: string;
  teacherName: string;
}