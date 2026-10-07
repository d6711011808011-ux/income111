import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { formatBaht, formatMonthThai } from '../constants/categories';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface MonthlyMetricsProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
}

export const MonthlyMetrics: React.FC<MonthlyMetricsProps> = ({
  transactions,
  selectedMonth,
}) => {
  // Current month totals
  const { income, expense, count, daysInMonth } = useMemo(() => {
    const [year, month] = selectedMonth.split('-');
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const dCount = new Date(y, m, 0).getDate();

    let inc = 0;
    let exp = 0;
    let cnt = 0;

    transactions.forEach((tx) => {
      if (tx.date.startsWith(selectedMonth)) {
        cnt++;
        if (tx.type === 'income') inc += tx.amount;
        if (tx.type === 'expense') exp += tx.amount;
      }
    });

    return { income: inc, expense: exp, count: cnt, daysInMonth: dCount };
  }, [transactions, selectedMonth]);

  // Previous month totals for comparison
  const prevMonthMetrics = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
    const prevMonthStr = `${y}-${String(m).padStart(2, '0')}`;

    let inc = 0;
    let exp = 0;
    transactions.forEach((tx) => {
      if (tx.date.startsWith(prevMonthStr)) {
        if (tx.type === 'income') inc += tx.amount;
        if (tx.type === 'expense') exp += tx.amount;
      }
    });

    return { income: inc, expense: exp };
  }, [transactions, selectedMonth]);

  const netBalance = income - expense;
  const savingsRate = income > 0 ? Math.max(0, (netBalance / income) * 100) : 0;
  const dailyAverageExpense = daysInMonth > 0 ? expense / daysInMonth : 0;

  // Comparison %
  const expenseDiff = prevMonthMetrics.expense > 0
    ? ((expense - prevMonthMetrics.expense) / prevMonthMetrics.expense) * 100
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. รายรับรวม */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            รายรับรวม (Income)
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-800 tracking-tight">
          {formatBaht(income)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span className="text-emerald-600 font-semibold flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 inline" />
            เงินเข้า
          </span>
          <span>ในเดือน {formatMonthThai(selectedMonth).split(' ')[0]}</span>
        </div>
        <div className="absolute right-0 bottom-0 h-1 w-full bg-emerald-500" />
      </div>

      {/* 2. รายจ่ายรวม */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            รายจ่ายรวม (Expense)
          </span>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-800 tracking-tight">
          {formatBaht(expense)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          {expenseDiff !== null ? (
            <span
              className={`font-semibold flex items-center ${
                expenseDiff > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {expenseDiff > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 inline" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 inline" />
              )}
              {Math.abs(expenseDiff).toFixed(1)}% {expenseDiff > 0 ? 'เพิ่มขึ้น' : 'ลดลง'}
            </span>
          ) : (
            <span className="text-slate-400">เฉลี่ย {formatBaht(dailyAverageExpense)}/วัน</span>
          )}
          <span className="text-slate-400">เทียบเดือนก่อน</span>
        </div>
        <div className="absolute right-0 bottom-0 h-1 w-full bg-rose-500" />
      </div>

      {/* 3. ยอดคงเหลือสุทธิ */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            ยอดคงเหลือสุทธิ (Net)
          </span>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              netBalance >= 0
                ? 'bg-blue-50 text-blue-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div
          className={`text-2xl font-bold tracking-tight ${
            netBalance >= 0 ? 'text-slate-800' : 'text-rose-600'
          }`}
        >
          {formatBaht(netBalance)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          {netBalance >= 0 ? (
            <span className="text-blue-600 font-medium">
              กระแสเงินสดเป็นบวก (มีเงินเก็บ)
            </span>
          ) : (
            <span className="text-rose-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              รายจ่ายเกินรายรับ {formatBaht(Math.abs(netBalance))}
            </span>
          )}
        </div>
        <div
          className={`absolute right-0 bottom-0 h-1 w-full ${
            netBalance >= 0 ? 'bg-blue-500' : 'bg-amber-500'
          }`}
        />
      </div>

      {/* 4. อัตราการออมเงิน */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            อัตราการออมเงิน (Savings)
          </span>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-800 tracking-tight">
          {income > 0 ? `${savingsRate.toFixed(1)}%` : '0%'}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
          <span>รวมบันทึกทั้งหมด </span>
          <span className="font-semibold text-slate-700">{count} รายการ</span>
        </div>
        <div className="absolute right-0 bottom-0 h-1 w-full bg-violet-500" />
      </div>
    </div>
  );
};
