import React, { useState } from 'react';
import { Budget, Transaction } from '../types';
import { formatBaht, formatMonthThai } from '../constants/categories';
import { Target, AlertTriangle, CheckCircle2, Edit2, Plus, Sparkles } from 'lucide-react';

interface BudgetTrackerProps {
  budgets: Budget[];
  transactions: Transaction[];
  selectedMonth: string;
  userId: string;
  onSaveBudget: (month: string, category: string, amount: number, existingId?: string) => Promise<void>;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  budgets,
  transactions,
  selectedMonth,
  userId,
  onSaveBudget,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Find general budget for selected month
  const currentBudget = budgets.find(
    (b) => b.month === selectedMonth && b.category === 'All'
  );

  // Total expense for selected month
  const totalExpense = transactions
    .filter((tx) => tx.date.startsWith(selectedMonth) && tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const budgetAmount = currentBudget?.amount || 0;
  const percentage = budgetAmount > 0 ? (totalExpense / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - totalExpense;

  const handleStartEdit = () => {
    setBudgetInput(budgetAmount > 0 ? budgetAmount.toString() : '');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetInput);
    if (isNaN(num) || num < 0) return;
    setLoading(true);
    try {
      await onSaveBudget(selectedMonth, 'All', num, currentBudget?.id);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              เป้าหมายงบประมาณรายจ่าย (Monthly Budget)
            </h4>
            <p className="text-xs text-slate-500">
              ประจำเดือน {formatMonthThai(selectedMonth)}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            {budgetAmount > 0 ? (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                แก้ไขงบ
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                ตั้งงบประมาณ
              </>
            )}
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
              ฿
            </span>
            <input
              type="number"
              min="0"
              step="100"
              required
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="ระบุจำนวนงบประมาณ เช่น 20000"
              className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึกงบ'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      ) : budgetAmount === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-600">
            ยังไม่ได้กำหนดเป้าหมายงบประมาณสำหรับเดือนนี้
          </p>
          <button
            onClick={handleStartEdit}
            className="mt-2 text-xs text-emerald-600 hover:underline font-semibold"
          >
            + คลิกที่นี่เพื่อกำหนดงบประมาณใช้จ่าย
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <div className="text-xs text-slate-500">
              ใช้ไปแล้ว{' '}
              <span className="font-bold text-slate-800 text-sm">
                {formatBaht(totalExpense)}
              </span>{' '}
              จากงบ{' '}
              <span className="font-bold text-slate-800 text-sm">
                {formatBaht(budgetAmount)}
              </span>
            </div>
            <div className="text-right">
              {remaining >= 0 ? (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" />
                  เหลืองบอีก {formatBaht(remaining)}
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 inline" />
                  เกินงบ {formatBaht(Math.abs(remaining))}!
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentage > 100
                  ? 'bg-rose-500'
                  : percentage > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
            <span>ใช้ไปแล้ว {percentage.toFixed(1)}%</span>
            <span>
              {percentage >= 100
                ? 'เกินงบประมาณที่ตั้งไว้'
                : `เหลือใช้ได้อีก ${(100 - percentage).toFixed(1)}%`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
