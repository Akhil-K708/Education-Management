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
  title: string;
  description: string;
  date: string;
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