export interface Assignment {
  assignmentId: string;
  subjectId: string;
  title: string;
  description: string;
  createdBy: string; 
  assignedTo: string;
  status: 'ASSIGNED' | 'COMPLETED' | 'EXPIRED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedDate: string; 
  dueDate: string;      
  attachedFiles?: string; 
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
  relatedFileLinks?: string[]; 
}

export interface AssignmentCombined {
  assignment: Assignment;
  submission?: AssignmentSubmission | null; 
}