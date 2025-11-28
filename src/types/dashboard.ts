// src/types/dashboard.ts

export interface DashboardStats {
  students: number;
  teachers: number;
  passPercentage: number;
  earnings: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

export interface StudentDemographics {
  male: number;
  female: number;
}

export interface NoticeItem {
  id: string;
  title: string; // Mapped from noticeName
  description: string; // Mapped from noticeDescription
  date: string; // Mapped from noticeDate
  type?: string; // 'GENERAL' | 'EVENT' | 'HOLIDAY'
}

export interface DashboardData {
  stats: DashboardStats;
  earningsChart: ChartData;
  studentDemographics: StudentDemographics;
  notices: NoticeItem[];
}

export interface StudentProfileInfo {
  name: string;
  class: string;
  section: string;
  studentId: string;
  fatherName: string;
  profilePhotoUrl?: string;
}

export interface ClassStats {
  total: number;
  girls: number;
  boys: number;
}

export interface AttendanceChartData {
  labels: string[];
  datasets: [{ data: number[] }];
}

// --- TYPES FOR SCHOOL BUZZ ---

export type SchoolFeedType = 'EVENT' | 'QUOTE' | 'IMAGE';

export interface SchoolFeedItem {
  id: string;
  type: SchoolFeedType;
  title: string; 
  description?: string;
  imageUrl?: string; 
  postDate: string;
  themeColor?: string; 
}

// Combined Data Type for Student Dashboard API Response
export interface StudentDashboardCombinedData {
  profile: StudentProfileInfo;
  classStats: ClassStats;
  notices: NoticeItem[];
  attendanceChart: AttendanceChartData;
  schoolFeed: SchoolFeedItem[]; 
}