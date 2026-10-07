import React from 'react';
import { User } from 'firebase/auth';
import { formatMonthThai } from '../constants/categories';
import {
  Wallet,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Database,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  onLogin: () => void;
  onLogout: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  selectedMonth,
  onMonthChange,
  onLogin,
  onLogout,
  isOnline,
}) => {
  // Move prev / next month
  const handleShiftMonth = (offset: number) => {
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + offset;
    if (m > 12) {
      m = 1;
      y += 1;
    } else if (m < 1) {
      m = 12;
      y -= 1;
    }
    onMonthChange(`${y}-${String(m).padStart(2, '0')}`);
  };

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const isCurrentMonth = selectedMonth === currentMonthStr;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-800 tracking-tight">
                  Income<span className="text-emerald-600">111</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <Database className="w-2.5 h-2.5" />
                  Firebase
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                ระบบจัดการรายรับรายจ่าย & วิเคราะห์ข้อมูล
              </p>
            </div>
          </div>

          {/* Month Selector in Center */}
          <div className="flex items-center bg-slate-100/90 rounded-xl p-1 shadow-2xs">
            <button
              onClick={() => handleShiftMonth(-1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2.5 sm:px-3 text-center">
              <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 hidden sm:inline" />
                {formatMonthThai(selectedMonth)}
              </span>
            </div>

            <button
              onClick={() => handleShiftMonth(1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentMonth && (
              <button
                onClick={() => onMonthChange(currentMonthStr)}
                className="ml-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors hidden md:block"
              >
                เดือนนี้
              </button>
            )}
          </div>

          {/* Right: Auth Profile / Google Sign-in */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    ซิงค์ข้อมูลแล้ว
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เข้าสู่ระบบด้วย Google</span>
                <span className="sm:hidden">เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
