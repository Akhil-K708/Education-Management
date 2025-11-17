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