export interface FeeSummary {
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface FeeItem {
  feeId: string;
  feeName: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: string;
}

export interface PaymentHistoryItem {
  paymentId: string;
  paymentDate: string;
  amount: number;
  method: string;
  transactionRef: string;
}

export interface StudentFeeDetails {
  summary: FeeSummary;
  pendingFees: FeeItem[]; 
  allFees: FeeItem[];
  paymentHistory: PaymentHistoryItem[];
}

// --- ADMIN TYPES ---

export interface ClassFeeStatsDTO {
  classSectionId: string;
  className: string;
  section: string;
  totalExpectedFee: number;
  totalCollectedFee: number;
  totalPendingFee: number;
}

export interface StudentFeeStatusDTO {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalFee: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
}