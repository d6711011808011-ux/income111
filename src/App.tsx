/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, testConnection } from './firebase/config';
import {
  subscribeUserTransactions,
  subscribeUserBudgets,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  saveBudget,
} from './firebase/service';
import { Transaction, Budget } from './types';
import { Header } from './components/Header';
import { MonthlyMetrics } from './components/MonthlyMetrics';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { BudgetTracker } from './components/BudgetTracker';
import { TransactionList } from './components/TransactionList';
import { TransactionFormModal } from './components/TransactionFormModal';
import { QuickAddBar } from './components/QuickAddBar';
import {
  Plus,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Database,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

// Default initial starter transactions for demo/guest experience
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo_1',
    userId: 'guest',
    type: 'income',
    amount: 35000,
    category: 'เงินเดือนประจำ',
    title: 'เงินเดือนประจำงวด',
    date: new Date().toISOString().substring(0, 7) + '-01',
    paymentMethod: 'โอนเงิน / พร้อมเพย์',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_2',
    userId: 'guest',
    type: 'expense',
    amount: 8500,
    category: 'ที่พัก/ค่าเช่าบ้าน',
    title: 'ค่าเช่าห้องและส่วนกลาง',
    date: new Date().toISOString().substring(0, 7) + '-02',
    paymentMethod: 'โอนเงิน / พร้อมเพย์',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_3',
    userId: 'guest',
    type: 'expense',
    amount: 1450,
    category: 'ค่าน้ำ/ค่าไฟ/เน็ต/บิล',
    title: 'ค่าไฟฟ้าและอินเทอร์เน็ต',
    date: new Date().toISOString().substring(0, 7) + '-03',
    paymentMethod: 'โอนเงิน / พร้อมเพย์',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_4',
    userId: 'guest',
    type: 'expense',
    amount: 250,
    category: 'อาหารและเครื่องดื่ม',
    title: 'ข้าวแกงและกาแฟเช้า',
    date: new Date().toISOString().substring(0, 7) + '-04',
    paymentMethod: 'เงินสด',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_5',
    userId: 'guest',
    type: 'expense',
    amount: 1200,
    category: 'การเดินทาง/น้ำมัน',
    title: 'เติมน้ำมันรถยนต์',
    date: new Date().toISOString().substring(0, 7) + '-05',
    paymentMethod: 'บัตรเครดิต / เดบิต',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_6',
    userId: 'guest',
    type: 'income',
    amount: 4500,
    category: 'งานฟรีแลนซ์/เสริม',
    title: 'รับงานออกแบบกราฟิกพิเศษ',
    date: new Date().toISOString().substring(0, 7) + '-05',
    paymentMethod: 'โอนเงิน / พร้อมเพย์',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_7',
    userId: 'guest',
    type: 'expense',
    amount: 890,
    category: 'ช้อปปิ้งและของใช้',
    title: 'ของใช้ในห้องน้ำและซูเปอร์มาร์เก็ต',
    date: new Date().toISOString().substring(0, 7) + '-06',
    paymentMethod: 'โอนเงิน / พร้อมเพย์',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Month navigation: format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<Transaction | null>(null);

  // Notice alert banner
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'info' | 'success' | 'error';
  } | null>(null);

  // 1. Validate connection to Firestore on boot (as required by skill)
  useEffect(() => {
    testConnection().then((connected) => {
      setIsOnline(connected);
    });
  }, []);

  // 2. Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. Realtime listener for Firestore when user is signed in
  useEffect(() => {
    if (user) {
      // Subscribe to user's real Firestore transactions
      const unsubTx = subscribeUserTransactions(
        user.uid,
        (items) => {
          setTransactions(items);
        },
        (err) => {
          console.error('Transactions subscription error:', err);
        }
      );

      // Subscribe to user's real Firestore budgets
      const unsubBudgets = subscribeUserBudgets(
        user.uid,
        (bList) => {
          setBudgets(bList);
        },
        (err) => {
          console.error('Budgets subscription error:', err);
        }
      );

      return () => {
        unsubTx();
        unsubBudgets();
      };
    } else {
      // Guest mode: load local storage or demo data
      const saved = localStorage.getItem('income111_guest_transactions');
      if (saved) {
        try {
          setTransactions(JSON.parse(saved));
        } catch {
          setTransactions(DEMO_TRANSACTIONS);
        }
      } else {
        setTransactions(DEMO_TRANSACTIONS);
      }

      const savedBudgets = localStorage.getItem('income111_guest_budgets');
      if (savedBudgets) {
        try {
          setBudgets(JSON.parse(savedBudgets));
        } catch {
          setBudgets([
            {
              id: 'guest_budget_1',
              userId: 'guest',
              month: new Date().toISOString().substring(0, 7),
              category: 'All',
              amount: 25000,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
      } else {
        setBudgets([
          {
            id: 'guest_budget_1',
            userId: 'guest',
            month: new Date().toISOString().substring(0, 7),
            category: 'All',
            amount: 25000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    }
  }, [user]);

  // Persist guest data to localStorage
  const updateGuestTransactions = (newItems: Transaction[]) => {
    setTransactions(newItems);
    localStorage.setItem('income111_guest_transactions', JSON.stringify(newItems));
  };

  const updateGuestBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('income111_guest_budgets', JSON.stringify(newBudgets));
  };

  // Login handler
  const handleLogin = async () => {
    try {
      const res = await loginWithGoogle();
      const newUser = res.user;
      setStatusMessage({
        text: `ยินดีต้อนรับ ${newUser.displayName || newUser.email}! เชื่อมต่อ Firebase เรียบร้อยแล้ว`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      console.error('Login error:', err);
      setStatusMessage({
        text: 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง',
        type: 'error',
      });
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      setStatusMessage({
        text: 'ออกจากระบบเรียบร้อยแล้ว เข้าสู่โหมดทดลอง',
        type: 'info',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Add or Edit Transaction
  const handleSaveTransaction = async (
    itemData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (user) {
      if (editId) {
        await updateTransaction(editId, itemData);
      } else {
        await addTransaction(itemData);
      }
    } else {
      // Guest mode
      const now = new Date().toISOString();
      if (editId) {
        const updated = transactions.map((t) =>
          t.id === editId ? { ...t, ...itemData, updatedAt: now } : t
        );
        updateGuestTransactions(updated);
      } else {
        const newItem: Transaction = {
          ...itemData,
          id: `guest_${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [newItem, ...transactions];
        updateGuestTransactions(updated);
      }
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (user) {
      await deleteTransaction(id);
    } else {
      const updated = transactions.filter((t) => t.id !== id);
      updateGuestTransactions(updated);
    }
  };

  // Save Budget
  const handleSaveBudget = async (
    month: string,
    category: string,
    amount: number,
    existingId?: string
  ) => {
    if (user) {
      await saveBudget(user.uid, month, category, amount, existingId);
    } else {
      const now = new Date().toISOString();
      if (existingId) {
        const updated = budgets.map((b) =>
          b.id === existingId ? { ...b, amount, updatedAt: now } : b
        );
        updateGuestBudgets(updated);
      } else {
        const newBudget: Budget = {
          id: `guest_b_${Date.now()}`,
          userId: 'guest',
          month,
          category,
          amount,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [...budgets, newBudget];
        updateGuestBudgets(updated);
      }
    }
  };

  // Quick Add handler
  const handleQuickAdd = (title: string, category: string, amount: number) => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEditClick = (item: Transaction) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  // Open new modal
  const handleOpenNewModal = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header
        user={user}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Messages */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-700 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Guest Banner if not signed in */}
        {!user && !authLoading && (
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  โหมดทดลองใช้งาน (Firebase Income111 พร้อมใช้งาน)
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    Live Cloud Ready
                  </span>
                </h4>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  ท่านสามารถทดลองบันทึกและดูสรุปกราฟได้ทันที หรือเข้าสู่ระบบด้วย Google เพื่อซิงค์ข้อมูลกับ Firestore โปรเจกต์ Income111 ถาวร
                </p>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-emerald-50 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
            >
              <LogIn className="w-4 h-4 text-emerald-600" />
              เชื่อมต่อ Google Account
            </button>
          </div>
        )}

        {/* 1. Monthly Financial Metrics Cards */}
        <MonthlyMetrics
          transactions={transactions}
          selectedMonth={selectedMonth}
        />

        {/* Quick Add Preset Bar */}
        <QuickAddBar
          onQuickAdd={handleQuickAdd}
          onOpenFullModal={handleOpenNewModal}
        />

        {/* 2. Analytics Charts (Donut, Monthly Comparison, Daily Trend) */}
        <AnalyticsCharts
          transactions={transactions}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />

        {/* 3. Budget Target & Tracker */}
        <BudgetTracker
          budgets={budgets}
          transactions={transactions}
          selectedMonth={selectedMonth}
          userId={user?.uid || 'guest'}
          onSaveBudget={handleSaveBudget}
        />

        {/* 4. Transactions List & Filter */}
        <TransactionList
          transactions={transactions}
          selectedMonth={selectedMonth}
          onEdit={handleEditClick}
          onDelete={handleDeleteTransaction}
          onAddNew={handleOpenNewModal}
        />
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
        <button
          onClick={handleOpenNewModal}
          className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-transform active:scale-95"
          title="เพิ่มรายการใหม่"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Modal for Adding / Editing Transaction */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        editItem={editItem}
        userId={user?.uid || 'guest'}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Income111</span>
            <span>• ระบบจัดการรายรับรายจ่ายแบบรายเดือน</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>เชื่อมต่อ Firebase Firestore: Income111</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
