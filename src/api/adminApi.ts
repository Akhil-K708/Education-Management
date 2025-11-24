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
  admissionNumber?: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  aadhaarNumber?: string;

  grade: string;
  section: string;
  classSectionId: string;
  academicYear?: string;

  joiningDate?: string;
  rollNumber: string;
  
  contactNumber?: string;
  email?: string;
  
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  fatherName: string;
  fatherContact?: string;
  motherName?: string;
  motherContact?: string;
  guardianName?: string;
  guardianContact?: string;

  emergencyContactName?: string;
  emergencyContactNumber?: string;

  profileImageUrl?: string;
  active?: boolean;
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

    if (Platform.OS === 'web') {
      // Web needs Blob
      const jsonBlob = new Blob([JSON.stringify(admissionData)], { type: 'application/json' });
      formData.append('data', jsonBlob as any);
    } else {
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
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const uri = Platform.OS === 'android' ? photoUri : photoUri.replace('file://', '');

        formData.append('photo', {
          uri: uri,
          name: filename,
          type: type,
        } as any);
      }
    }

    const response = await studentApi.post('/admission', formData, {
      headers: {
        'Accept': 'application/json',
      },
      transformRequest: (data) => {
        return data; 
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

// --- SUBJECT UPDATES ---
// Edit Subject
export const updateSubject = async (subjectId: string, data: SubjectDTO): Promise<SubjectDTO> => {
  try {
    // Backend: PUT /api/student/subject/{subjectId}
    const response = await studentApi.put<SubjectDTO>(`/subject/${subjectId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating subject:", error);
    throw error;
  }
};

// --- TEACHER UPDATES ---
// Edit Teacher
export const updateTeacher = async (teacherId: string, data: TeacherDTO): Promise<TeacherDTO> => {
  try {
    // Backend: PUT /api/student/teacher/{teacherId}
    const response = await studentApi.put<TeacherDTO>(`/teacher/${teacherId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating teacher:", error);
    throw error;
  }
};

// --- CLASS UPDATES ---
// Edit Class Section
export const updateClassSection = async (classSectionId: string, data: ClassSectionDTO): Promise<ClassSectionDTO> => {
  try {
    // Backend: PUT /api/student/class-sections/{classSectionId}
    const response = await studentApi.put<ClassSectionDTO>(`/class-sections/${classSectionId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating class section:", error);
    throw error;
  }
};

// --- STUDENT UPDATES & DELETE ---
// Edit Student (Supports Photo Update)
export const updateStudent = async (studentId: string, studentData: any, photoUri?: string) => {
  try {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // Web: Convert JSON to Blob
      const jsonBlob = new Blob([JSON.stringify(studentData)], { type: 'application/json' });
      formData.append('data', jsonBlob as any);
      
      // Web: Append Photo if exists
      if (photoUri && photoUri.startsWith('blob:')) {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        formData.append('photo', blob, 'updated_photo.jpg');
      }
    } else {
      // Mobile: Standard JSON stringify
      formData.append('data', JSON.stringify(studentData));

      // Mobile: Append Photo
      if (photoUri && !photoUri.startsWith('http')) { // Only if it's a new local image
        const filename = photoUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('photo', {
          uri: Platform.OS === 'android' ? photoUri : photoUri.replace('file://', ''),
          name: filename,
          type: type,
        } as any);
      }
    }

    // Backend: PUT /api/student/{studentId}
    const response = await studentApi.put(`/${studentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data, // Prevents Axios from messing up FormData
    });

    return response.data;
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

// Delete Student
export const deleteStudent = async (studentId: string) => {
  try {
    // Backend: DELETE /api/student/{studentId}
    await studentApi.delete(`/${studentId}`);
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};