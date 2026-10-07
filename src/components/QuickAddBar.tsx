import React from 'react';
import { Coffee, Utensils, Car, ShoppingCart, Zap, Plus } from 'lucide-react';

interface QuickAddBarProps {
  onQuickAdd: (title: string, category: string, defaultAmount: number) => void;
  onOpenFullModal: () => void;
}

const PRESETS = [
  { label: 'มื้ออาหาร', category: 'อาหารและเครื่องดื่ม', amount: 60, icon: Utensils, color: 'text-rose-500 bg-rose-50 hover:bg-rose-100' },
  { label: 'กาแฟ/เครื่องดื่ม', category: 'อาหารและเครื่องดื่ม', amount: 55, icon: Coffee, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
  { label: 'เดินทาง/BTS/น้ำมัน', category: 'การเดินทาง/น้ำมัน', amount: 50, icon: Car, color: 'text-blue-500 bg-blue-50 hover:bg-blue-100' },
  { label: 'ซื้อของใช้', category: 'ช้อปปิ้งและของใช้', amount: 150, icon: ShoppingCart, color: 'text-pink-500 bg-pink-50 hover:bg-pink-100' },
  { label: 'ค่าน้ำ/ค่าไฟ', category: 'ค่าน้ำ/ค่าไฟ/เน็ต/บิล', amount: 500, icon: Zap, color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' },
];

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onQuickAdd, onOpenFullModal }) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-slate-700">
          บันทึกด่วน (Quick Shortcut)
        </span>
        <button
          onClick={onOpenFullModal}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          บันทึกแบบละเอียด
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.label}
              onClick={() => onQuickAdd(preset.label, preset.category, preset.amount)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border border-transparent hover:border-slate-200 ${preset.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{preset.label}</span>
              <span className="opacity-75 font-normal">~{preset.amount}฿</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
