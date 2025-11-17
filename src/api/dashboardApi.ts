import { DashboardData } from '../types/dashboard';

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
            }
          ],
        },
        studentDemographics: {
          male: 55,
          female: 45,
        },
        notices: [
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
        ],
      });
    }, 1000);
  });
};