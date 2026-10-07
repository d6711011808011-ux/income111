import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  ALL_CATEGORIES,
  getCategoryDetails,
  formatBaht,
  formatDateThai,
} from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  selectedMonth,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter transactions
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      // Month match
      if (!tx.date.startsWith(selectedMonth)) return false;

      // Type match
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Category match
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const inTitle = tx.title.toLowerCase().includes(query);
        const inCategory = tx.category.toLowerCase().includes(query);
        const inNote = tx.note?.toLowerCase().includes(query) || false;
        const inAmount = tx.amount.toString().includes(query);
        if (!inTitle && !inCategory && !inNote && !inAmount) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, selectedMonth, typeFilter, categoryFilter, searchTerm, sortBy]);

  // Group by date when sorting by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[]; dailyExpense: number; dailyIncome: number }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredList.forEach((tx) => {
      const arr = map.get(tx.date) || [];
      arr.push(tx);
      map.set(tx.date, arr);
    });

    map.forEach((items, date) => {
      const dailyExpense = items.filter((i) => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
      const dailyIncome = items.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0);
      groups.push({ date, items, dailyExpense, dailyIncome });
    });

    return groups;
  }, [filteredList]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) return;
    const headers = ['วันที่', 'ประเภท', 'หมวดหมู่', 'ชื่อรายการ', 'จำนวนเงิน', 'ช่องทางชำระ', 'หมายเหตุ'];
    const rows = filteredList.map((tx) => [
      tx.date,
      tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      tx.category,
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.amount,
      tx.paymentMethod || '',
      `"${(tx.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Income111_${selectedMonth}_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              รายการบันทึกทั้งหมด
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                {filteredList.length} รายการ
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดการ แก้ไข หรือค้นหารายรับและรายจ่ายในเดือนนี้
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={filteredList.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors"
              title="ส่งออกเป็นไฟล์ CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              ส่งออก CSV
            </button>
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
            >
              + บันทึกรายการ
            </button>
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อรายการ, หมวดหมู่, ยอดเงิน..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกประเภท</option>
              <option value="expense">เฉพาะรายจ่าย</option>
              <option value="income">เฉพาะรายรับ</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">ทุกหมวดหมู่</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date_desc">วันที่: ล่าสุด</option>
              <option value="date_asc">วันที่: เก่าสุด</option>
              <option value="amount_desc">จำนวน: มากไปน้อย</option>
              <option value="amount_asc">จำนวน: น้อยไปมาก</option>
            </select>
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className="p-4 sm:p-6">
        {filteredList.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <Calendar className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-slate-700">ไม่มีรายการในช่วงเวลานี้</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              ยังไม่มีการบันทึกรายรับหรือรายจ่ายตามเงื่อนไขที่เลือก คลิกปุ่ม "+ บันทึกรายการ" เพื่อเริ่มต้น
            </p>
            <button
              onClick={onAddNew}
              className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-xl text-xs transition-colors"
            >
              + บันทึกรายการแรก
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDate.map((group) => (
              <div key={group.date} className="space-y-2">
                {/* Date header with daily subtotals */}
                <div className="flex items-center justify-between text-xs px-1 pb-1 border-b border-slate-100">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDateThai(group.date)}
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    {group.dailyIncome > 0 && (
                      <span className="text-emerald-600 font-medium">
                        + {formatBaht(group.dailyIncome)}
                      </span>
                    )}
                    {group.dailyExpense > 0 && (
                      <span className="text-rose-500 font-medium">
                        - {formatBaht(group.dailyExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in date */}
                <div className="space-y-1.5">
                  {group.items.map((tx) => {
                    const cat = getCategoryDetails(tx.category, tx.type);
                    const isDeleting = deletingId === tx.id;

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-slate-50/80 border border-slate-100 transition-all group"
                      >
                        {/* Left: Category Icon & Title */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.bgColor, color: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800 truncate">
                                {tx.title}
                              </span>
                              <span
                                className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md font-medium"
                                style={{ backgroundColor: cat.bgColor, color: cat.color }}
                              >
                                {tx.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              {tx.paymentMethod && (
                                <span className="text-slate-500">{tx.paymentMethod}</span>
                              )}
                              {tx.note && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[160px] text-slate-500">
                                    {tx.note}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span
                              className={`text-sm font-bold block ${
                                tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                              }`}
                            >
                              {tx.type === 'income' ? '+' : '-'} {formatBaht(tx.amount)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {isDeleting ? (
                              <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg">
                                <span className="text-[10px] text-rose-700 font-semibold px-1">
                                  ลบ?
                                </span>
                                <button
                                  onClick={() => confirmDelete(tx.id)}
                                  className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                                >
                                  ใช่
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]"
                                >
                                  ไม่
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => onEdit(tx)}
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                                  title="แก้ไข"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingId(tx.id)}
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                  title="ลบรายการ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
