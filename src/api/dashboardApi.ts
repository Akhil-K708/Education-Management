import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import {
  AttendanceChartData,
  ClassStats,
  DashboardData,
  NoticeItem,
  SchoolFeedItem,
  StudentDashboardCombinedData,
  StudentProfileInfo,
} from '../types/dashboard';
import { getFromStorage } from '../utils/storage';

// APIs
import { getAllStudents, getAllTeachers } from './adminApi';
import { getClassStudents, getStudentAttendance } from './attendanceApi';
import { studentApi } from './axiosInstance';
import { getAdminFeeStats } from './feesApi';
import { getAllNotices } from './noticeApi';
import { getStudentProfile } from './studentService';

// 1. API BASE URL
const API_BASE_URL = 'http://192.168.0.113:8080';

// Helper to fix Image URL
const getFullImageUrl = (url: string | null | undefined) => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('https')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Helper: Get User ID
const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const token = await getFromStorage('accessToken');
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded.sub; 
  } catch (e) {
    return null;
  }
};

// --- FEED APIs ---

export const getSchoolFeed = async (): Promise<SchoolFeedItem[]> => {
  try {
    const response = await studentApi.get<SchoolFeedItem[]>('/feed/all');
    return response.data.map(item => ({
        ...item,
        imageUrl: getFullImageUrl(item.imageUrl)
    }));
  } catch (error) {
    console.error("Error fetching school feed:", error);
    return [];
  }
};

// 🔥 CREATE POST (Fixed 400 Error - Using 'data' key)
export const createSchoolFeedPost = async (postData: any, photoUri?: string) => {
  return submitFeedData(`${API_BASE_URL}/api/student/feed/create`, 'POST', postData, photoUri);
};

// 🔥 UPDATE POST
export const updateSchoolFeedPost = async (id: string, postData: any, photoUri?: string) => {
  return submitFeedData(`${API_BASE_URL}/api/student/feed/update/${id}`, 'PUT', postData, photoUri);
};

// 🔥 DELETE POST
export const deleteSchoolFeedPost = async (id: string) => {
  try {
    await studentApi.delete(`/feed/delete/${id}`);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

// --- HELPER FOR MULTIPART FORM DATA ---
const submitFeedData = async (url: string, method: 'POST' | 'PUT', jsonData: any, photoUri?: string) => {
    try {
        const formData = new FormData();

        // 1. Append JSON Data (Key MUST be 'data' to match other controllers)
        if (Platform.OS === "web") {
            const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: "application/json" });
            formData.append("data", jsonBlob);
        } else {
            formData.append("data", {
                string: JSON.stringify(jsonData),
                type: "application/json",
            } as any);
        }

        // 2. Append Image File (Key 'file')
        if (photoUri && !photoUri.startsWith('http')) {
            if (Platform.OS === "web") {
                const blob = await fetch(photoUri).then((r) => r.blob());
                formData.append("file", blob, "post_image.jpg");
            } else {
                formData.append("file", {
                    uri: photoUri.startsWith("file://") ? photoUri : "file://" + photoUri,
                    name: "post_image.jpg",
                    type: "image/jpeg",
                } as any);
            }
        }

        // 3. Send Request
        const token = await getFromStorage('accessToken');
        const headers: any = {
            'Accept': 'application/json',
            // Content-Type handled automatically
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: formData,
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed: ${response.status} - ${errText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error in ${method} post:`, error);
        throw error;
    }
};

// --- DASHBOARD DATA ---
// (Keep existing logic for student/admin data fetching)
export const getStudentDashboardData = async (): Promise<StudentDashboardCombinedData> => {
    // ... (same as before)
    try {
        const studentId = await getCurrentUserId();
        if (!studentId) throw new Error("User not logged in");

        const [profileDTO, allNotices, schoolFeed] = await Promise.all([
        getStudentProfile(studentId),
        getAllNotices(),
        getSchoolFeed()
        ]);

        const profile: StudentProfileInfo = {
        name: profileDTO.fullName,
        class: profileDTO.grade,
        section: profileDTO.section,
        studentId: profileDTO.studentId,
        fatherName: profileDTO.fatherName,
        profilePhotoUrl: getFullImageUrl(profileDTO.profileImageUrl),
        };

        const notices: NoticeItem[] = allNotices.map(n => ({
        id: n.id || Math.random().toString(),
        title: n.noticeName,
        description: n.noticeDescription,
        date: n.noticeDate,
        type: n.noticeType
        }));

        let classStats: ClassStats = { total: 0, girls: 0, boys: 0 };
        if (profileDTO.classSectionId) {
        try {
            const classmates = await getClassStudents(profileDTO.classSectionId);
            classStats = {
            total: classmates.length,
            boys: classmates.filter((s: any) => s.gender === 'Male').length,
            girls: classmates.filter((s: any) => s.gender === 'Female').length,
            };
        } catch (e) {}
        }

        const today = new Date();
        const monthsLabels: string[] = [];
        const attendanceValues: number[] = [];
        const attendancePromises = [];
        for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        monthsLabels.push(d.toLocaleString('default', { month: 'short' }));
        attendancePromises.push(
            getStudentAttendance(studentId, d.getFullYear(), d.getMonth() + 1)
            .then(res => res.percentage || 0).catch(() => 0)
        );
        }
        const results = await Promise.all(attendancePromises);
        results.forEach(val => attendanceValues.push(val));

        const attendanceChart: AttendanceChartData = {
        labels: monthsLabels,
        datasets: [{ data: attendanceValues }],
        };

        return { profile, classStats, notices, attendanceChart, schoolFeed };

    } catch (error) {
        console.error("Error fetching student dashboard data:", error);
        throw error;
    }
};

export const getDashboardData = async (): Promise<DashboardData> => {
    // ... (same as before)
    try {
        const [students, teachers, feeStats, allNotices] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        getAdminFeeStats(),
        getAllNotices()
        ]);

        const totalEarnings = feeStats.reduce((sum, item) => sum + item.totalCollectedFee, 0);
        
        const maleCount = students.filter(s => s.gender && s.gender.toUpperCase() === 'MALE').length;
        const femaleCount = students.filter(s => s.gender && s.gender.toUpperCase() === 'FEMALE').length;
        const totalStudents = students.length || 1; 

        const notices: NoticeItem[] = allNotices.map(n => ({
        id: n.id || Math.random().toString(),
        title: n.noticeName,
        description: n.noticeDescription,
        date: n.noticeDate,
        type: n.noticeType
        }));

        return {
        stats: {
            students: students.length,
            teachers: teachers.length,
            passPercentage: 94.2,
            earnings: totalEarnings,
        },
        earningsChart: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                { data: [20, 45, 28, 80, 99, 43] }, 
                { data: [10, 30, 15, 60, 70, 35] }, 
            ],
        },
        studentDemographics: {
            male: Math.round((maleCount / totalStudents) * 100),
            female: Math.round((femaleCount / totalStudents) * 100),
        },
        notices: notices,
        };

    } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        throw error;
    }
};

export const getStudentProfileData = async (): Promise<{
    profile: StudentProfileInfo;
    classStats: ClassStats;
}> => {
    const data = await getStudentDashboardData();
    return {
        profile: data.profile,
        classStats: data.classStats,
    };
};