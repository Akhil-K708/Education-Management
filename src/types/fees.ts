export interface FeeSummary {
  totalFee: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface FeeItem {
  id: string;
  title: string;
  dueDate: string;
  amount: number;
  status: 'OVERDUE' | 'PENDING' | 'PAID';
}

export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  type: string;
  receipt: string;
  method: string; 
}

export interface StudentFeeDetails {
  summary: FeeSummary;
  pendingFees: FeeItem[];
  paymentHistory: PaymentHistoryItem[];
}