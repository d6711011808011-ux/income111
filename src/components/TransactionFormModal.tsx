import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  formatBaht,
} from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { X, Calendar, DollarSign, FileText, Tag, CreditCard } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => Promise<void>;
  editItem?: Transaction | null;
  userId: string;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  userId,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('อาหารและเครื่องดื่ม');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>('โอนเงิน / พร้อมเพย์');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (editItem) {
      setType(editItem.type);
      setAmount(editItem.amount.toString());
      setTitle(editItem.title);
      setCategory(editItem.category);
      setDate(editItem.date);
      setPaymentMethod(editItem.paymentMethod || 'โอนเงิน / พร้อมเพย์');
      setNote(editItem.note || '');
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setCategory('อาหารและเครื่องดื่ม');
      setDate(new Date().toISOString().substring(0, 10));
      setPaymentMethod('โอนเงิน / พร้อมเพย์');
      setNote('');
    }
    setErrorMsg('');
  }, [editItem, isOpen]);

  // Adjust category default when changing type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      setCategory('อาหารและเครื่องดื่ม');
    } else {
      setCategory('เงินเดือนประจำ');
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDate(d.toISOString().substring(0, 10));
  };

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('กรุณากรอกจำนวนเงินให้ถูกต้อง (มากกว่า 0)');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('กรุณาระบุชื่อรายการ');
      return;
    }
    if (!category.trim()) {
      setErrorMsg('กรุณาเลือกหมวดหมู่');
      return;
    }
    if (!date) {
      setErrorMsg('กรุณาเลือกวันที่');
      return;
    }

    setLoading(true);
    try {
      await onSave(
        {
          userId,
          type,
          amount: parsedAmount,
          title: title.trim(),
          category: category.trim(),
          date,
          paymentMethod,
          note: note.trim() || undefined,
        },
        editItem?.id
      );
      onClose();
    } catch (err: unknown) {
      console.error('Error saving transaction:', err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            {editItem ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Type Switcher: Income / Expense */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายจ่าย (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายรับ (Income)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              จำนวนเงิน (บาท) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ฿
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
            {/* Quick Amount Add Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[50, 100, 300, 500, 1000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleQuickAmount(v)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  +{v}฿
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-rose-500"
                >
                  ล้างค่า
                </button>
              )}
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              ชื่อรายการ / รายละเอียด *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'expense' ? 'เช่น ข้าวเที่ยง, เติมน้ำมัน, ช้อปปิ้ง' : 'เช่น เงินเดือน, งานเสริม, ขายของ'}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              หมวดหมู่ *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {currentCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs text-left transition-all border ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 font-semibold text-emerald-800'
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600">วันที่ *</label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleQuickDate(0)}
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    วันนี้
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleQuickDate(1)}
                    className="text-slate-500 hover:underline"
                  >
                    เมื่อวาน
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                ช่องทางชำระเงิน
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.label}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              บันทึกช่วยจำ (ไม่บังคับ)
            </label>
            <input
              type="text"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
              className="w-full px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all disabled:opacity-50 ${
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? 'กำลังบันทึก...' : editItem ? 'อัปเดตรายการ' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
