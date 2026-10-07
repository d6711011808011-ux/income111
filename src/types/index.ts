export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  category: string; // e.g., 'อาหารและเครื่องดื่ม' or 'All'
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  bgColor: string;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // percentage 0-100
  transactionCount: number;
  dailyAverageExpense: number;
}
