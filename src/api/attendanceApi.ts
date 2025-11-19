// src/api/attendanceApi.ts

import { AttendanceData, AttendanceLog } from "../types/attendance";

// Mock Holidays Data (మనం కావాల్సినన్ని యాడ్ చేసుకోవచ్చు)
const SPECIAL_HOLIDAYS: Record<string, string> = {
  '2025-11-01': 'State Formation Day',
  '2025-11-14': "Children's Day",
  '2025-11-20': 'Exam Preparation Holiday', // Teacher Declared
  '2025-11-21': 'Exam Preparation Holiday', // Teacher Declared
};

const generateMockLogs = (): AttendanceLog[] => {
  const logs: AttendanceLog[] = [];
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, d).getDay(); // 0=Sun

    let status: 'PRESENT' | 'ABSENT' | 'HOLIDAY' = 'PRESENT';
    let reason = '';

    // 1. Check for Special Holidays first
    if (SPECIAL_HOLIDAYS[dateString]) {
        status = 'HOLIDAY';
        reason = SPECIAL_HOLIDAYS[dateString];
    } 
    // 2. Check for Sundays
    else if (dayOfWeek === 0) {
        status = 'HOLIDAY';
        reason = 'Sunday';
    } 
    // 3. Random Absents for demo
    else if (d === 5 || d === 18) {
       status = 'ABSENT';
    }

    // Don't mark future dates as Present/Absent (Keep them empty or Handle logic)
    // For this mock, we return data for the whole month to show the calendar properly
    logs.push({ date: dateString, status, holidayReason: reason });
  }
  return logs;
};

export const getStudentAttendance = async (studentId: string): Promise<AttendanceData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const logs = generateMockLogs();
      
      // Calculate Stats
      const present = logs.filter(l => l.status === 'PRESENT').length;
      const absent = logs.filter(l => l.status === 'ABSENT').length;
      const holidays = logs.filter(l => l.status === 'HOLIDAY').length;
      const totalWorking = present + absent;
      const percentage = totalWorking > 0 ? (present / totalWorking) * 100 : 0;

      resolve({
        studentId,
        stats: {
          totalWorkingDays: totalWorking,
          present,
          absent,
          holidays,
          percentage: parseFloat(percentage.toFixed(1))
        },
        logs
      });
    }, 800); 
  });
};