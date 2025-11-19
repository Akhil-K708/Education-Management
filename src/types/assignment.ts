// src/types/assignment.ts

export interface Assignment {
  assignmentId: string;
  subjectId: string;
  title: string;
  description: string;
  createdBy: string; // teacherId or teacherName
  assignedTo: string; // classSectionId
  status: 'ASSIGNED' | 'COMPLETED' | 'EXPIRED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedDate: string; // YYYY-MM-DD
  dueDate: string;      // YYYY-MM-DD
  attachedFiles?: string; // Comma separated URLs or single file link
}

export interface AssignmentSubmission {
  assignmentId: string;
  subjectId: string;
  submissionNumber?: number;
  studentId: string;
  submittedDate?: string;
  note: string;
  remark?: string;
  reviewedBy?: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED';
  relatedLinks?: string[];
  relatedFileLinks?: string[]; // Uploaded file URLs
}

export interface AssignmentCombined {
  assignment: Assignment;
  submission?: AssignmentSubmission | null; // స్టూడెంట్ సబ్మిట్ చేసి ఉంటే ఆ డేటా ఇక్కడ ఉంటుంది
}