import {
  DailyScheduleItem,
  StudentTimetableData,
  Teacher,
  TeacherDetailsData,
} from '../types/timetable';

const teachers: Record<string, Teacher> = {
  t1: { id: 't1', name: 'Mrs. Aruna (Class Teacher)' },
  t2: { id: 't2', name: 'Mr. Suresh Kumar' },
  t3: { id: 't3', name: 'Mr. David' },
  t4: { id: 't4', name: 'Ms. Priya Sharma' },
};

const mockSchedules: Record<string, TeacherDetailsData> = {
  t1: {
    weeklySchedule: [
      { id: 'm1', day: 'Mon', time: '10:00 AM - 11:00 AM', room: '10A' },
      { id: 'm2', day: 'Wed', time: '10:00 AM - 11:00 AM', room: '10A' },
      { id: 'm3', day: 'Fri', time: '10:00 AM - 11:00 AM', room: '10A' },
    ],
    attendance: ['2025-11-03', '2025-11-05', '2025-11-07', '2025-11-10', '2025-11-12', '2025-11-14', '2025-11-17'],
  },
  t2: {
    weeklySchedule: [
      { id: 's1', day: 'Tue', time: '09:00 AM - 10:00 AM', room: 'Lab 2' },
      { id: 's2', day: 'Thu', time: '09:00 AM - 10:00 AM', room: 'Lab 2' },
    ],
    attendance: ['2025-11-04', '2025-11-06', '2025-11-11', '2025-11-13'],
  },
  t3: {
    weeklySchedule: [
      { id: 'e1', day: 'Mon', time: '01:00 PM - 02:00 PM', room: '10A' },
      { id: 'e2', day: 'Tue', time: '01:00 PM - 02:00 PM', room: '10A' },
      { id: 'e3', day: 'Wed', time: '01:00 PM - 02:00 PM', room: '10A' },
      { id: 'e4', day: 'Thu', time: '01:00 PM - 02:00 PM', room: '10A' },
    ],
    attendance: ['2025-11-03', '2025-11-04', '2025-11-05', '2025-11-06', '2025-11-10', '2025-11-11', '2025-11-12', '2025-11-13'],
  },
  t4: {
    weeklySchedule: [
      { id: 'h1', day: 'Fri', time: '02:00 PM - 03:00 PM', room: '10A' },
      { id: 'h2', day: 'Sat', time: '11:00 AM - 12:00 PM', room: '10A' },
    ],
    attendance: ['2025-11-07', '2025-11-08', '2025-11-14', '2025-11-15'],
  },
};

// --- MOCK DATA FOR DAILY TABLE ---
const mockDailySchedule: DailyScheduleItem[] = [
  { id: 'd1', subjectName: 'Telugu', time: '10:00 AM - 11:00 AM', room: '10A', teacherName: 'Mrs. Aruna' },
  { id: 'd2', subjectName: 'Physics', time: '11:00 AM - 12:00 PM', room: '10A', teacherName: 'Mr. Suresh Kumar' },
  { id: 'd3', subjectName: 'English', time: '12:00 PM - 01:00 PM', room: '10A', teacherName: 'Mr. David' },
  { id: 'd4', subjectName: 'Social', time: '02:00 PM - 03:00 PM', room: '10A', teacherName: 'Ms. Priya Sharma' },
];

export const getStudentInitialData = async (): Promise<StudentTimetableData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        classTeacher: teachers.t1,
        subjects: [
          { id: 'sub1', name: 'Telugu', teacher: teachers.t1 },
          { id: 'sub2', name: 'Physics', teacher: teachers.t2 },
          { id: 'sub3', name: 'English', teacher: teachers.t3 },
          { id: 'sub4', name: 'Social', teacher: teachers.t4 },
        ],
      });
    }, 500);
  });
};

export const getTeacherDetails = async (teacherId: string): Promise<TeacherDetailsData> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mockSchedules[teacherId]) {
        resolve(mockSchedules[teacherId]);
      } else {
        reject(new Error('Teacher data not found'));
      }
    }, 500);
  });
};

export const getStudentDailySchedule = async (): Promise<DailyScheduleItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDailySchedule);
    }, 500);
  });
};