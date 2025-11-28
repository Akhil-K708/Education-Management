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
  subjectIds?: string[];
}

export interface AssignSubjectTeacherDTO {
  classSectionId: string;
  subjectId: string;
  teacherId: string;
}

export interface ClassSubjectMappingDTO {
  id: string;
  classSectionId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export const getSubjectMappings = async (classSectionId: string): Promise<ClassSubjectMappingDTO[]> => {
  try {
    const response = await studentApi.get(`/subject/assign/${classSectionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subject mappings:", error);
    return [];
  }
};

// 2. Assign a Teacher to a Subject
export const assignSubjectTeacher = async (data: AssignSubjectTeacherDTO) => {
  try {
    const response = await studentApi.post('/subject/assignSubjectTeacher', data);
    return response.data;
  } catch (error) {
    console.error("Error assigning teacher to subject:", error);
    throw error;
  }
};
 
// 🔥 FIX: Updated to use studentApi (Axios) which handles Auth Token automatically
export const submitAdmission = async (admissionData: any, photoUri?: string) => {
  try {
    const formData = new FormData();
 
    if (Platform.OS === "web") {
      const jsonBlob = new Blob(
        [JSON.stringify(admissionData)],
        { type: "application/json" }
      );
      formData.append("data", jsonBlob);
    } else {
      formData.append("data", {
        name: "data.json",
        type: "application/json",
        string: JSON.stringify(admissionData),
      } as any);
    }
 
    if (photoUri) {
      if (Platform.OS === "web") {
        const blob = await fetch(photoUri).then((r) => r.blob());
        formData.append("photo", blob, "admission_photo.jpg");
      } else {
        formData.append("photo", {
          uri: photoUri.startsWith("file://") ? photoUri : "file://" + photoUri,
          name: "admission_photo.jpg",
          type: "image/jpeg",
        } as any);
      }
    }
 
    // Using studentApi instead of fetch to include Auth Token
    const response = await studentApi.post('/admission', formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
 
    return response.data;
  } catch (error) {
    console.error("Admission submit error:", error);
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
        academicYear: '2025-2026' 
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

// 🔥 NEW: GET GENDER PERCENTAGE FOR DASHBOARD
export const getGenderStats = async (): Promise<any> => {
  try {
    const response = await studentApi.get('/dashboard/gender-percentage');
    return response.data;
  } catch (error) {
    console.error("Error fetching gender stats:", error);
    return { Male: 50, Female: 50 }; // Default fallback
  }
};
 
// --- UPDATES & DELETE ---
export const updateSubject = async (subjectId: string, data: SubjectDTO): Promise<SubjectDTO> => {
  try {
    const response = await studentApi.put<SubjectDTO>(`/subject/${subjectId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating subject:", error);
    throw error;
  }
};
 
export const updateTeacher = async (teacherId: string, data: TeacherDTO): Promise<TeacherDTO> => {
  try {
    const response = await studentApi.put<TeacherDTO>(`/teacher/${teacherId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating teacher:", error);
    throw error;
  }
};
 
export const updateClassSection = async (classSectionId: string, data: ClassSectionDTO): Promise<ClassSectionDTO> => {
  try {
    const response = await studentApi.put<ClassSectionDTO>(`/class-sections/${classSectionId}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating class section:", error);
    throw error;
  }
};
 
// 🔥 FIX: Updated to use studentApi (Axios) which handles Auth Token automatically
export const updateStudent = async (studentId: string, studentData: any, photoUri?: string) => {
  try {
    const formData = new FormData();
 
    if (Platform.OS === "web") {
      formData.append(
        "data",
        new Blob([JSON.stringify(studentData)], { type: "application/json" })
      );
    } else {
      formData.append("data", {
        name: "data.json",
        type: "application/json",
        string: JSON.stringify(studentData),
      } as any);
    }
 
    if (photoUri && !photoUri.startsWith("http")) {
      if (Platform.OS === "web") {
        const blob = await fetch(photoUri).then(r => r.blob());
        formData.append("photo", blob, `student_${studentId}.jpg`);
      } else {
        formData.append("photo", {
          uri: photoUri.startsWith("file://") ? photoUri : "file://" + photoUri,
          name: `student_${studentId}.jpg`,
          type: "image/jpeg",
        } as any);
      }
    }
 
    const response = await studentApi.put(`/${studentId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
 
    return response.data;
 
  } catch (error: any) {
    console.error("Update student error:", error);
    throw error;
  }
};

export const deleteStudent = async (studentId: string) => {
  try {
    await studentApi.delete(`/${studentId}`);
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};

export const getUnassignedStudents = async (grade: string): Promise<StudentDTO[]> => {
  try {
    const response = await studentApi.get<StudentDTO[]>(`/students/unassigned/${grade}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unassigned students:", error);
    return [];
  }
};

export const assignStudentToClass = async (classSectionId: string, studentId: string) => {
    await studentApi.put(`/class-sections/${classSectionId}/assign-student`, null, {
        params: { studentId }
    });
};