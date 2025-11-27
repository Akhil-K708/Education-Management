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

// --- NEW TYPES FOR SCHOOL BUZZ (FEED) ---

export type SchoolFeedType = 'EVENT' | 'QUOTE' | 'IMAGE';

export interface SchoolFeedItem {
  id: string;
  type: SchoolFeedType;
  title: string; // Title or Quote Text
  description?: string;
  imageUrl?: string; // For Image posts
  postDate: string;
  themeColor?: string; // Optional color override
}

// Combined Data Type for Student Dashboard API Response
export interface StudentDashboardCombinedData {
  profile: StudentProfileInfo;
  classStats: ClassStats;
  notices: NoticeItem[];
  attendanceChart: AttendanceChartData;
  schoolFeed: SchoolFeedItem[]; // Changed from 'highlights' to 'schoolFeed'
}