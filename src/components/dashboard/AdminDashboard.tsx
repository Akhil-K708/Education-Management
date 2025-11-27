import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

// API Imports
import { getAllClassSections, getAllStudents, getAllTeachers } from '../../api/adminApi';
import { getAllExams } from '../../api/examApi';
import { getAllPayments } from '../../api/feesApi';
import { getClassExamResults } from '../../api/resultsApi';

// Types & Components
import { DashboardData } from '../../types/dashboard';
import { DashboardStatCard } from './DashboardStatCard';
import { EarningsChart } from './EarningsChart';
import { EventCalendar } from './EventCalendar';
import { NoticeBoard } from './NoticeBoard';
import { StudentDemographicsChart } from './StudentDemographicsChart';

export const AdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Basic Counts (Removed getGenderStats to calculate locally)
        const [studentsList, teachersList] = await Promise.all([
          getAllStudents(),
          getAllTeachers()
        ]);

        // 🔥 FIX: Calculate Gender Percentage Locally for 100% Accuracy
        const totalStudents = studentsList.length || 1; // Avoid division by zero
        
        // Check for "Male", "male", "MALE" (Case Insensitive)
        const maleCount = studentsList.filter(s => s.gender && s.gender.toUpperCase() === 'MALE').length;
        const femaleCount = studentsList.filter(s => s.gender && s.gender.toUpperCase() === 'FEMALE').length;

        const malePercentage = Math.round((maleCount / totalStudents) * 100);
        const femalePercentage = Math.round((femaleCount / totalStudents) * 100);

        // 2. Fetch & Calculate Earnings (Monthly)
        const allPayments = await getAllPayments();
        const totalEarnings = allPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // Process Monthly Data for Chart
        const monthCounts = new Array(12).fill(0);
        allPayments.forEach(p => {
            const monthIndex = new Date(p.paymentDate).getMonth(); // 0 = Jan
            monthCounts[monthIndex] += p.amount;
        });

        // Get Current Month + Previous 5 Months labels/data
        const today = new Date();
        const chartLabels = [];
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            chartLabels.push(d.toLocaleString('default', { month: 'short' }));
            chartData.push(monthCounts[d.getMonth()]);
        }

        // 3. Calculate Pass Percentage (Latest Published Exam - All Classes)
        let passPercentage = 0;
        const allExams = await getAllExams();
        // Get Latest Published Exam
        const latestExam = allExams
            .filter(e => e.status === 'PUBLISHED')
            .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

        if (latestExam) {
            const allClasses = await getAllClassSections();
            let totalStudentsAppeared = 0;
            let totalStudentsPassed = 0;

            // Fetch results for all classes in parallel
            const resultsPromises = allClasses.map(cls => 
                getClassExamResults(latestExam.examId, cls.classSectionId!)
            );
            
            const allResults = await Promise.all(resultsPromises);

            // Aggregate
            allResults.flat().forEach((res: any) => {
                totalStudentsAppeared++;
                // Check if student passed based on total percentage logic (e.g., > 35%)
                const isPassed = (res.percentage >= 35);
                if (isPassed) totalStudentsPassed++;
            });

            if (totalStudentsAppeared > 0) {
                passPercentage = parseFloat(((totalStudentsPassed / totalStudentsAppeared) * 100).toFixed(1));
            }
        }

        // 4. Prepare Final Data Object
        const dashboardData: DashboardData = {
            stats: {
                students: studentsList.length,
                teachers: teachersList.length,
                passPercentage: passPercentage,
                earnings: totalEarnings,
            },
            earningsChart: {
                labels: chartLabels,
                datasets: [
                    { data: chartData }, // Actual Earnings
                ],
            },
            studentDemographics: {
                male: malePercentage,   // Calculated locally
                female: femalePercentage, // Calculated locally
            },
            notices: [], // Handled inside NoticeBoard component
        };

        setData(dashboardData);

      } catch (e) {
        console.error('Failed to load admin dashboard', e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <DashboardStatCard
        title="Students"
        value={data?.stats.students || 0}
        iconName="people-outline"
        color="#2563EB"
      />
      <DashboardStatCard
        title="Teachers"
        value={data?.stats.teachers || 0}
        iconName="person-outline"
        color="#10B981"
      />
      <DashboardStatCard
        title="Pass Percentage"
        value={`${data?.stats.passPercentage || 0}%`}
        iconName="ribbon-outline"
        color="#F59E0B"
      />
      <DashboardStatCard
        title="Total Earnings"
        value={`₹${(data?.stats.earnings || 0).toLocaleString()}`}
        iconName="cash-outline"
        color="#EF4444"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!data) return null;

  const { earningsChart, studentDemographics } = data;

  if (isMobile) {
    return (
      <View style={styles.container}> 
        {renderStats()}
        <EarningsChart data={earningsChart} />
        <EventCalendar />
        <StudentDemographicsChart data={studentDemographics} />
        <NoticeBoard />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderStats()}
      <View style={styles.webContainer}>
        <View style={styles.leftColumn}>
          <EarningsChart data={earningsChart} />
          <NoticeBoard />
        </View>
        <View style={styles.rightColumn}>
          <EventCalendar />
          <StudentDemographicsChart data={studentDemographics} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftColumn: {
    flex: 2,
    minWidth: 300,
    marginRight: 8,
    flexDirection: 'column',
  },
  rightColumn: {
    flex: 1,
    minWidth: 300,
    marginLeft: 8,
    flexDirection: 'column',
  },
});