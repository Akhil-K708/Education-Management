import { studentApi } from './axiosInstance';

// --- Class Section Types ---
export interface ClassSectionDTO {
  classSectionId?: string;
  className: string;
  section: string;
  academicYear: string;
  capacity: number;
  currentStrength?: number;
  classTeacherName?: string;
}

// --- Subject Types ---
export interface SubjectDTO {
  subjectId?: string;
  subjectName: string;
  subjectCode: string;
  active?: boolean;
}

// --- Class API Calls ---
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

// --- Subject API Calls ---
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