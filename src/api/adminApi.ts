import { Platform } from 'react-native';
import { studentApi } from './axiosInstance';

// --- DTOs ---
export interface ClassSectionDTO {
  classSectionId?: string;
  className: string;
  section: string;
  academicYear: string;
  capacity: number;
  currentStrength?: number;
  classTeacherId?: string;
  classTeacherName?: string;
  subjectIds?: string[];
}

export interface StudentDTO {
  studentId: string;
  fullName: string;
  rollNumber: string;
  grade: string;
  section: string;
  classSectionId: string;
  contactNumber: string;
  fatherName: string;
  profileImageUrl?: string;
}

export interface AdmissionDTO {
  admissionNumber: string;
  applicantName: string;
  fatherName: string;
  fatherContact: string;
  gradeApplied: string;
  admissionDate: string;
  status: string;
  photoUrl?: string;
  // Add other fields if needed for display
}

export interface SubjectDTO {
  subjectId?: string;
  subjectName: string;
  subjectCode: string;
  active?: boolean;
}

export interface TeacherDTO {
  teacherId?: string;
  teacherName: string;
  email: string;
  phone: string;
  qualification: string;
  gender: string;
  experience: number;
  address: string;
}

export const submitAdmission = async (admissionData: any, photoUri?: string) => {
  try {
    const formData = new FormData();

    // 1. Append JSON Data
    if (Platform.OS === 'web') {
      // Web needs Blob
      const jsonBlob = new Blob([JSON.stringify(admissionData)], { type: 'application/json' });
      formData.append('data', jsonBlob as any);
    } else {
      // Mobile sends as String (Backend should accept this if configured correctly)
      formData.append('data', JSON.stringify(admissionData));
    }

    // 2. Append Photo
    if (photoUri) {
      if (Platform.OS === 'web') {
        // Web Code
        const response = await fetch(photoUri);
        const blob = await response.blob();
        formData.append('photo', blob, 'photo.jpg');
      } else {
        // Mobile Code (Android/iOS)
        const filename = photoUri.split('/').pop() || 'photo.jpg';
        
        // Fix file type extension
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // Android needs 'file://', iOS sometimes doesn't. This ensures it works.
        const uri = Platform.OS === 'android' ? photoUri : photoUri.replace('file://', '');

        formData.append('photo', {
          uri: uri,
          name: filename,
          type: type, // Explicit type is mandatory for Android
        } as any);
      }
    }

    // 3. Send Request
    // Note: 'Content-Type' header REMOVED to let Axios set boundary automatically
    const response = await studentApi.post('/admission', formData, {
      headers: {
        'Accept': 'application/json',
      },
      transformRequest: (data) => {
        return data; // Crucial: Prevents Axios from destroying FormData
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error submitting admission:", error);
    throw error;
  }
};

// 2. GET PENDING ADMISSIONS
export const getPendingAdmissions = async (): Promise<AdmissionDTO[]> => {
  try {
    const response = await studentApi.get<AdmissionDTO[]>('/admissions/pending');
    return response.data;
  } catch (error) {
    console.error("Error fetching pending admissions:", error);
    return [];
  }
};

// 3. APPROVE ADMISSION
export const approveAdmission = async (admissionNumber: string, approvedBy: string) => {
  try {
    const response = await studentApi.post(`/approve/${admissionNumber}`, {
        approvedBy: approvedBy,
        academicYear: '2025-2026' // Default or Dynamic
    });
    return response.data;
  } catch (error) {
    console.error("Error approving admission:", error);
    throw error;
  }
};

// 4. REJECT ADMISSION
export const rejectAdmission = async (admissionNumber: string) => {
  try {
    const response = await studentApi.post(`/reject/${admissionNumber}`);
    return response.data;
  } catch (error) {
    console.error("Error rejecting admission:", error);
    throw error;
  }
};
// --- CLASS APIs ---
export const getAllClassSections = async (): Promise<ClassSectionDTO[]> => {
  try {
    const response = await studentApi.get<ClassSectionDTO[]>('/class-sections');
    return response.data;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

export const createClassSection = async (data: ClassSectionDTO): Promise<ClassSectionDTO> => {
  try {
    const response = await studentApi.post<ClassSectionDTO>('/class-sections', data);
    return response.data;
  } catch (error) {
    console.error("Error creating class:", error);
    throw error;
  }
};

export const deleteClassSection = async (classSectionId: string) => {
  try {
    await studentApi.delete(`/class-section/${classSectionId}`);
  } catch (error) {
    console.error("Error deleting class:", error);
    throw error;
  }
};

// --- SUBJECT APIs ---
export const getAllSubjects = async (): Promise<SubjectDTO[]> => {
  try {
    const response = await studentApi.get<SubjectDTO[]>('/subject/allSubjects');
    return response.data;
  } catch (error) {
    console.error("Error fetching subjects:", error);
    throw error;
  }
};

export const createSubject = async (data: SubjectDTO): Promise<SubjectDTO> => {
  try {
    const response = await studentApi.post<SubjectDTO>('/subject/createSubject', data);
    return response.data;
  } catch (error) {
    console.error("Error creating subject:", error);
    throw error;
  }
};

export const deleteSubject = async (subjectId: string) => {
  try {
    await studentApi.delete(`/subject/${subjectId}`);
  } catch (error) {
    console.error("Error deleting subject:", error);
    throw error;
  }
};

// --- TEACHER APIs ---
export const getAllTeachers = async (): Promise<TeacherDTO[]> => {
  try {
    const response = await studentApi.get<TeacherDTO[]>('/teacher/all');
    return response.data;
  } catch (error) {
    console.error("Error fetching teachers:", error);
    throw error;
  }
};

export const createTeacher = async (data: TeacherDTO): Promise<TeacherDTO> => {
  try {
    const response = await studentApi.post<TeacherDTO>('/teacher/add', data);
    return response.data;
  } catch (error) {
    console.error("Error creating teacher:", error);
    throw error;
  }
};

export const deleteTeacher = async (id: string) => {
  try {
    await studentApi.delete(`/teacher/${id}`);
  } catch (error) {
    console.error("Error deleting teacher:", error);
    throw error;
  }
};

// --- STUDENT APIs ---
export const getAllStudents = async (): Promise<StudentDTO[]> => {
  try {
    const response = await studentApi.get<StudentDTO[]>('/allStudents');
    return response.data;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

