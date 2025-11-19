import {
  AttendanceChartData,
  ClassStats,
  DashboardData,
  NoticeItem,
  StudentProfileInfo,
} from '../types/dashboard';

const mockStudentProfile: StudentProfileInfo = {
  name: 'Rakesh',
  class: '10th',
  section: 'A',
  studentId: 'STU2025001',
  fatherName: "Ravi Kumar",
  profilePhotoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
};

const mockClassStats: ClassStats = {
  total: 45,
  girls: 22,
  boys: 23,
};

const mockNotices: NoticeItem[] = [
  {
    id: '1',
    title: 'Inter-school competition',
    description: 'Sport/singing/drawing/drama',
    date: '10 Feb, 2025',
  },
  {
    id: '2',
    title: 'Disciplinary action',
    description: 'Disciplinary action if school discipline is not followed',
    date: '6 Feb, 2025',
  },
  {
    id: '3',
    title: 'School Annual Function',
    description: 'Celebration 2025-26',
    date: '2 Feb, 2025',
  },
];

const mockAttendanceChartData: AttendanceChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [85, 90, 88, 92, 95, 87], 
    },
  ],
};

// Combined Data Type for Student Dashboard
interface StudentDashboardCombinedData {
  profile: StudentProfileInfo;
  classStats: ClassStats;
  notices: NoticeItem[];
  attendanceChart: AttendanceChartData;
}

// --- New Function: Get All Student Dashboard Data ---
export const getStudentDashboardData = async (): Promise<StudentDashboardCombinedData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        profile: mockStudentProfile,
        classStats: mockClassStats,
        notices: mockNotices,
        attendanceChart: mockAttendanceChartData,
      });
    }, 1000); // 1 second delay simulate chestunnam
  });
};

// --- Existing Function: Admin/General Dashboard Data ---
export const getDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        stats: {
          students: 1260,
          teachers: 224,
          passPercentage: 92.5,
          earnings: 54000,
        },
        earningsChart: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              data: [20, 45, 28, 80, 99, 43],
            },
            {
              data: [10, 30, 15, 60, 70, 35],
            },
          ],
        },
        studentDemographics: {
          male: 55,
          female: 45,
        },
        notices: mockNotices,
      });
    }, 1000);
  });
};

// --- Existing Function: Only Profile Data (Optional) ---
export const getStudentProfileData = async (): Promise<{
  profile: StudentProfileInfo;
  classStats: ClassStats;
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        profile: mockStudentProfile,
        classStats: mockClassStats,
      });
    }, 500);
  });
};