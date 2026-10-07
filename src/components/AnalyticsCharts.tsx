import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatBaht,
  formatMonthThai,
} from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  onSelectMonth: (month: string) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  selectedMonth,
  onSelectMonth,
}) => {
  const [chartTab, setChartTab] = useState<'donut' | 'monthlyBar' | 'dailyTrend'>('donut');
  const [donutType, setDonutType] = useState<'expense' | 'income'>('expense');
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  // 1. Filter transactions for selected month
  const currentMonthTx = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // 2. Category Breakdown for selected month and type
  const categoryStats = useMemo(() => {
    const list = currentMonthTx.filter((tx) => tx.type === donutType);
    const total = list.reduce((sum, tx) => sum + tx.amount, 0);

    const map = new Map<string, number>();
    list.forEach((tx) => {
      map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
    });

    const categoriesPool = donutType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const result: {
      category: string;
      amount: number;
      percentage: number;
      color: string;
      icon: string;
    }[] = [];

    map.forEach((amount, category) => {
      const match = categoriesPool.find((c) => c.name === category);
      result.push({
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: match?.color || (donutType === 'expense' ? '#EF4444' : '#10B981'),
        icon: match?.icon || 'Tag',
      });
    });

    // Sort highest amount first
    result.sort((a, b) => b.amount - a.amount);
    return { list: result, total };
  }, [currentMonthTx, donutType]);

  // Donut SVG path generator
  const donutArcs = useMemo(() => {
    const total = categoryStats.total;
    if (total === 0) return [];

    let accumulatedAngle = 0;
    const size = 260;
    const center = size / 2;
    const outerRadius = 100;
    const innerRadius = 65;

    return categoryStats.list.map((item, idx) => {
      const sliceAngle = (item.amount / total) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle = endAngle;

      // Convert polar to cartesian
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + outerRadius * Math.cos(startRad);
      const y1 = center + outerRadius * Math.sin(startRad);
      const x2 = center + outerRadius * Math.cos(endRad);
      const y2 = center + outerRadius * Math.sin(endRad);

      const x3 = center + innerRadius * Math.cos(endRad);
      const y3 = center + innerRadius * Math.sin(endRad);
      const x4 = center + innerRadius * Math.cos(startRad);
      const y4 = center + innerRadius * Math.sin(startRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
        Z
      `;

      return {
        ...item,
        pathData,
        isHovered: hoveredDonutIndex === idx,
      };
    });
  }, [categoryStats, hoveredDonutIndex]);

  // 3. Last 6 Months Comparison
  const last6MonthsData = useMemo(() => {
    const [currYearStr, currMonthStr] = selectedMonth.split('-');
    const currYear = parseInt(currYearStr, 10);
    const currMonth = parseInt(currMonthStr, 10);

    const months: { monthKey: string; income: number; expense: number; net: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      let targetM = currMonth - i;
      let targetY = currYear;
      while (targetM <= 0) {
        targetM += 12;
        targetY -= 1;
      }
      const mStr = `${targetY}-${String(targetM).padStart(2, '0')}`;
      months.push({
        monthKey: mStr,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    transactions.forEach((tx) => {
      const txMonth = tx.date.substring(0, 7);
      const found = months.find((m) => m.monthKey === txMonth);
      if (found) {
        if (tx.type === 'income') found.income += tx.amount;
        if (tx.type === 'expense') found.expense += tx.amount;
      }
    });

    months.forEach((m) => {
      m.net = m.income - m.expense;
    });

    const maxVal = Math.max(
      ...months.map((m) => Math.max(m.income, m.expense)),
      1000
    );

    return { months, maxVal };
  }, [transactions, selectedMonth]);

  // 4. Daily Spending Trend for selected month
  const dailyData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const daysInMonth = new Date(y, m, 0).getDate();

    const days: { day: number; dateStr: string; expense: number; income: number; cumExpense: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, expense: 0, income: 0, cumExpense: 0 });
    }

    currentMonthTx.forEach((tx) => {
      const dayNum = parseInt(tx.date.substring(8, 10), 10);
      const target = days.find((d) => d.day === dayNum);
      if (target) {
        if (tx.type === 'expense') target.expense += tx.amount;
        if (tx.type === 'income') target.income += tx.amount;
      }
    });

    let runningExpense = 0;
    days.forEach((d) => {
      runningExpense += d.expense;
      d.cumExpense = runningExpense;
    });

    const maxDailyExpense = Math.max(...days.map((d) => d.expense), 100);
    return { days, maxDailyExpense, totalMonthExpense: runningExpense };
  }, [currentMonthTx, selectedMonth]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      {/* Chart Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            กราฟวิเคราะห์ข้อมูลการเงิน
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปการเคลื่อนไหวทางการเงินประจำ {formatMonthThai(selectedMonth)}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-medium">
          <button
            onClick={() => setChartTab('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              chartTab === 'donut'
                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            สัดส่วนหมวดหมู่
          </button>
          <button
            onClick={() => setChartTab('monthlyBar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              chartTab === 'monthlyBar'
                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            เปรียบเทียบรายเดือน
          </button>
          <button
            onClick={() => setChartTab('dailyTrend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              chartTab === 'dailyTrend'
                ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            แนวโน้มรายวัน
          </button>
        </div>
      </div>

      {/* Chart Tab 1: Donut Category Breakdown */}
      {chartTab === 'donut' && (
        <div className="pt-6">
          <div className="flex justify-between items-center mb-5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สัดส่วนตามหมวดหมู่
            </span>
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => {
                  setDonutType('expense');
                  setHoveredDonutIndex(null);
                }}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  donutType === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายจ่าย (Expense)
              </button>
              <button
                onClick={() => {
                  setDonutType('income');
                  setHoveredDonutIndex(null);
                }}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  donutType === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รายรับ (Income)
              </button>
            </div>
          </div>

          {categoryStats.total === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <PieIcon className="w-7 h-7" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                ยังไม่มีข้อมูล{donutType === 'expense' ? 'รายจ่าย' : 'รายรับ'}ในเดือนนี้
              </p>
              <p className="text-xs text-slate-400 mt-1">
                เริ่มเพิ่มรายการเพื่อดูแผนภูมิตรวจสอบสัดส่วนการเงิน
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Donut Chart Canvas */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 260 260" className="w-full h-full transform -rotate-90">
                    {donutArcs.map((arc, idx) => (
                      <path
                        key={idx}
                        d={arc.pathData}
                        fill={arc.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-300 cursor-pointer hover:opacity-85"
                        style={{
                          transform: arc.isHovered ? 'scale(1.04)' : 'scale(1)',
                          transformOrigin: '130px 130px',
                        }}
                        onMouseEnter={() => setHoveredDonutIndex(idx)}
                        onMouseLeave={() => setHoveredDonutIndex(null)}
                      />
                    ))}
                  </svg>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                    {hoveredDonutIndex !== null && categoryStats.list[hoveredDonutIndex] ? (
                      <>
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                          {categoryStats.list[hoveredDonutIndex].category}
                        </span>
                        <span className="text-lg font-bold text-slate-800">
                          {formatBaht(categoryStats.list[hoveredDonutIndex].amount)}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600">
                          {categoryStats.list[hoveredDonutIndex].percentage.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-400 font-medium">
                          {donutType === 'expense' ? 'รายจ่ายรวม' : 'รายรับรวม'}
                        </span>
                        <span className="text-lg font-bold text-slate-800">
                          {formatBaht(categoryStats.total)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {categoryStats.list.length} หมวดหมู่
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Breakdown Table / Progress bars */}
              <div className="md:col-span-7 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {categoryStats.list.map((item, idx) => {
                  const isHovered = hoveredDonutIndex === idx;
                  return (
                    <div
                      key={item.category}
                      onMouseEnter={() => setHoveredDonutIndex(idx)}
                      onMouseLeave={() => setHoveredDonutIndex(null)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                        isHovered
                          ? 'bg-slate-50 border-slate-300 shadow-xs'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
                            style={{ backgroundColor: item.color }}
                          >
                            <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-700">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 mr-2">
                            {formatBaht(item.amount)}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart Tab 2: Monthly Comparison Bar Chart */}
      {chartTab === 'monthlyBar' && (
        <div className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              เปรียบเทียบรายรับและรายจ่าย 6 เดือนย้อนหลัง
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">รายรับ</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
                <span className="text-slate-600 font-medium">รายจ่าย</span>
              </span>
            </div>
          </div>

          <div className="relative pt-6 pb-2">
            {/* Chart Area */}
            <div className="grid grid-cols-6 gap-2 sm:gap-4 h-56 items-end border-b border-slate-200">
              {last6MonthsData.months.map((m, idx) => {
                const incomeHeight =
                  last6MonthsData.maxVal > 0
                    ? Math.round((m.income / last6MonthsData.maxVal) * 190)
                    : 0;
                const expenseHeight =
                  last6MonthsData.maxVal > 0
                    ? Math.round((m.expense / last6MonthsData.maxVal) * 190)
                    : 0;
                const isSelected = m.monthKey === selectedMonth;
                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={m.monthKey}
                    className="relative flex flex-col items-center h-full justify-end cursor-pointer group"
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    onClick={() => onSelectMonth(m.monthKey)}
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <div className="absolute -top-16 z-20 bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2.5 shadow-lg pointer-events-none whitespace-nowrap">
                        <div className="font-semibold text-slate-200">
                          {formatMonthThai(m.monthKey)}
                        </div>
                        <div className="text-emerald-400">
                          รับ: {formatBaht(m.income)}
                        </div>
                        <div className="text-rose-400">
                          จ่าย: {formatBaht(m.expense)}
                        </div>
                        <div className="text-amber-300 font-bold border-t border-slate-700 mt-0.5 pt-0.5">
                          คงเหลือ: {formatBaht(m.net)}
                        </div>
                      </div>
                    )}

                    {/* Bars Container */}
                    <div className="flex items-end gap-1 sm:gap-1.5 h-48 w-full justify-center px-1">
                      {/* Income Bar */}
                      <div
                        className={`w-3 sm:w-5 rounded-t-sm transition-all duration-300 ${
                          isSelected ? 'bg-emerald-500 shadow-xs' : 'bg-emerald-400 hover:bg-emerald-500'
                        }`}
                        style={{ height: `${Math.max(incomeHeight, 4)}px` }}
                      />
                      {/* Expense Bar */}
                      <div
                        className={`w-3 sm:w-5 rounded-t-sm transition-all duration-300 ${
                          isSelected ? 'bg-rose-500 shadow-xs' : 'bg-rose-400 hover:bg-rose-500'
                        }`}
                        style={{ height: `${Math.max(expenseHeight, 4)}px` }}
                      />
                    </div>

                    {/* Month Label */}
                    <div className="mt-2 text-center">
                      <span
                        className={`block text-[11px] sm:text-xs truncate transition-all ${
                          isSelected
                            ? 'font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm'
                            : 'text-slate-500 group-hover:text-slate-900'
                        }`}
                      >
                        {formatMonthThai(m.monthKey).split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              * คลิกที่แท่งของแต่ละเดือนเพื่อสลับไปดูรายละเอียดของเดือนนั้นๆ
            </p>
          </div>
        </div>
      )}

      {/* Chart Tab 3: Daily Spending Trend */}
      {chartTab === 'dailyTrend' && (
        <div className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              แนวโน้มค่าใช้จ่ายรายวันตลอดเดือน
            </span>
            <span className="text-xs font-medium text-slate-600">
              รวมทั้งเดือน: <span className="font-bold text-rose-600">{formatBaht(dailyData.totalMonthExpense)}</span>
            </span>
          </div>

          <div className="relative pt-6 pb-2">
            <div className="h-56 flex items-end gap-1 border-b border-slate-200">
              {dailyData.days.map((d, idx) => {
                const height =
                  dailyData.maxDailyExpense > 0
                    ? Math.round((d.expense / dailyData.maxDailyExpense) * 190)
                    : 0;
                const isHovered = hoveredDayIndex === idx;

                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center h-full justify-end relative cursor-pointer group"
                    onMouseEnter={() => setHoveredDayIndex(idx)}
                    onMouseLeave={() => setHoveredDayIndex(null)}
                  >
                    {isHovered && (
                      <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[11px] rounded-lg py-1 px-2 shadow-lg pointer-events-none whitespace-nowrap">
                        <div className="font-semibold text-slate-300">วันที่ {d.day}</div>
                        <div className="text-rose-400 font-bold">จ่าย: {formatBaht(d.expense)}</div>
                        <div className="text-slate-400 text-[10px]">สะสม: {formatBaht(d.cumExpense)}</div>
                      </div>
                    )}
                    <div
                      className={`w-full max-w-[14px] rounded-t-sm transition-all duration-200 ${
                        d.expense > 0
                          ? isHovered
                            ? 'bg-rose-600'
                            : 'bg-rose-400 hover:bg-rose-500'
                          : 'bg-slate-100'
                      }`}
                      style={{ height: `${Math.max(height, 3)}px` }}
                    />
                  </div>
                );
              })}
            </div>
            {/* Day Numbers Axis */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
              <span>วันที่ 1</span>
              <span>วันที่ 10</span>
              <span>วันที่ 20</span>
              <span>วันที่ {dailyData.days.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
