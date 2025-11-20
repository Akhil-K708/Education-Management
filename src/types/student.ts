export interface StudentDTO {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  dateOfBirth: string; 
  gender: string;
  bloodGroup: string;
  nationality: string;
  religion: string;
  category: string;
  aadhaarNumber: string;

  classSectionId: string;
  grade: string;
  section: string;
  academicYear: string;

  joiningDate: string;
  rollNumber: string;
  classTeacherId: string;

  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  email: string;

  fatherName: string;
  fatherContact: string;
  motherName: string;
  motherContact: string;
  guardianName: string;
  guardianContact: string;

  emergencyContactName: string;
  emergencyContactNumber: string;

  profileImageUrl: string;
  active: boolean;
}