// src/api/feesApi.ts

import { StudentFeeDetails } from '../types/fees';
// import { studentApi } from './axiosInstance'; // Backend వచ్చినప్పుడు దీన్ని వాడాలి

// --- MOCK DATA ---
const MOCK_FEE_DATA: StudentFeeDetails = {
  summary: {
    totalFee: 45000,
    paidAmount: 25000,
    pendingAmount: 20000,
  },
  pendingFees: [
    { id: '1', title: 'Term 2 Tuition Fee', dueDate: '2025-11-10', amount: 15000, status: 'OVERDUE' },
    { id: '2', title: 'Transport Fee (Nov)', dueDate: '2025-11-05', amount: 2500, status: 'OVERDUE' },
    { id: '3', title: 'Term 3 Tuition Fee', dueDate: '2026-02-10', amount: 2500, status: 'PENDING' },
  ],
  paymentHistory: [
    { id: '101', date: '2025-06-15', amount: 15000, type: 'Term 1 Fee', receipt: 'REC001', method: 'Online' },
    { id: '102', date: '2025-06-15', amount: 5000, type: 'Admission Fee', receipt: 'REC002', method: 'Cash' },
    { id: '103', date: '2025-09-10', amount: 5000, type: 'Transport (Term 1)', receipt: 'REC003', method: 'Online' },
  ]
};

export const getStudentFeeDetails = async (studentId: string): Promise<StudentFeeDetails> => {
  // Backend Integration Future Plan:
  // const response = await studentApi.get<StudentFeeDetails>(`/fees/${studentId}`);
  // return response.data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_FEE_DATA);
    }, 800); // Simulate network delay
  });
};