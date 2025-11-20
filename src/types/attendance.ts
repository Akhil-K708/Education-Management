export interface AttendanceStats {
  totalWorkingDays: number;
  present: number;
  absent: number;
  holidays: number;
  percentage: number;
}

export interface AttendanceLog {
  date: string; 
  status: 'PRESENT' | 'ABSENT' | 'HOLIDAY';
  holidayReason?: string; 
}

export interface AttendanceData {
  studentId: string;
  stats: AttendanceStats;
  logs: AttendanceLog[];
}