// src/types/attendance.ts

export interface AttendanceStats {
  totalWorkingDays: number;
  present: number;
  absent: number;
  holidays: number;
  percentage: number;
}

export interface AttendanceLog {
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  holidayReason?: string; // e.g., "Diwali", "Exam Preparation", "Sunday"
}

export interface AttendanceData {
  studentId: string;
  stats: AttendanceStats;
  logs: AttendanceLog[];
}