import { CategoryItem } from '../types';

export const EXPENSE_CATEGORIES: CategoryItem[] = [
  { id: 'exp_food', name: 'อาหารและเครื่องดื่ม', type: 'expense', icon: 'Utensils', color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 'exp_transport', name: 'การเดินทาง/น้ำมัน', type: 'expense', icon: 'Car', color: '#F97316', bgColor: '#FFEDD5' },
  { id: 'exp_shopping', name: 'ช้อปปิ้งและของใช้', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', bgColor: '#FCE7F3' },
  { id: 'exp_housing', name: 'ที่พัก/ค่าเช่าบ้าน', type: 'expense', icon: 'Home', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'exp_bills', name: 'ค่าน้ำ/ค่าไฟ/เน็ต/บิล', type: 'expense', icon: 'Zap', color: '#EAB308', bgColor: '#FEF9C3' },
  { id: 'exp_entertainment', name: 'บันเทิงและท่องเที่ยว', type: 'expense', icon: 'Film', color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 'exp_health', name: 'สุขภาพและการรักษา', type: 'expense', icon: 'HeartPulse', color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'exp_education', name: 'การศึกษา/พัฒนาตนเอง', type: 'expense', icon: 'GraduationCap', color: '#06B6D4', bgColor: '#CFFAFE' },
  { id: 'exp_family', name: 'ครอบครัวและสัตว์เลี้ยง', type: 'expense', icon: 'Smile', color: '#F43F5E', bgColor: '#FFE4E6' },
  { id: 'exp_other', name: 'ค่าใช้จ่ายอื่นๆ', type: 'expense', icon: 'MoreHorizontal', color: '#6B7280', bgColor: '#F3F4F6' },
];

export const INCOME_CATEGORIES: CategoryItem[] = [
  { id: 'inc_salary', name: 'เงินเดือนประจำ', type: 'income', icon: 'Briefcase', color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'inc_business', name: 'ธุรกิจ/ค้าขาย', type: 'income', icon: 'Store', color: '#059669', bgColor: '#A7F3D0' },
  { id: 'inc_freelance', name: 'งานฟรีแลนซ์/เสริม', type: 'income', icon: 'Laptop', color: '#0D9488', bgColor: '#CCFBF1' },
  { id: 'inc_investment', name: 'เงินปันผล/กำไรหุ้น', type: 'income', icon: 'TrendingUp', color: '#2563EB', bgColor: '#DBEAFE' },
  { id: 'inc_bonus', name: 'โบนัส/ของขวัญ', type: 'income', icon: 'Gift', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'inc_other', name: 'รายรับอื่นๆ', type: 'income', icon: 'CircleDollarSign', color: '#14B8A6', bgColor: '#E6FFFA' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const PAYMENT_METHODS = [
  { id: 'promptpay', label: 'โอนเงิน / พร้อมเพย์', icon: 'Smartphone' },
  { id: 'cash', label: 'เงินสด', icon: 'Banknote' },
  { id: 'card', label: 'บัตรเครดิต / เดบิต', icon: 'CreditCard' },
  { id: 'ewallet', label: 'E-Wallet / วอลเล็ต', icon: 'Wallet' },
];

export function getCategoryDetails(name: string, type: 'income' | 'expense' = 'expense'): CategoryItem {
  const found = ALL_CATEGORIES.find((c) => c.name === name);
  if (found) return found;
  return {
    id: 'unknown',
    name,
    type,
    icon: type === 'income' ? 'TrendingUp' : 'Tag',
    color: type === 'income' ? '#10B981' : '#EF4444',
    bgColor: type === 'income' ? '#D1FAE5' : '#FEE2E2',
  };
}

export function formatBaht(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('THB', '฿');
}

export function formatMonthThai(monthStr: string): string {
  // YYYY-MM
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const mIndex = parseInt(month, 10) - 1;
  const thaiYear = parseInt(year, 10) + 543;
  return `${thaiMonths[mIndex] || month} ${thaiYear}`;
}

export function formatDateThai(dateStr: string): string {
  // YYYY-MM-DD
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [year, month, day] = dateStr.split('-');
  const thaiShortMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  const mIndex = parseInt(month, 10) - 1;
  const thaiYear = parseInt(year, 10) + 543;
  return `${parseInt(day, 10)} ${thaiShortMonths[mIndex] || month} ${thaiYear}`;
}
