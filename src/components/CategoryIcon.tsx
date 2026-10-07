import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Smile,
  MoreHorizontal,
  Briefcase,
  Store,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  Tag,
  Smartphone,
  Banknote,
  CreditCard,
  Wallet,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Smile,
  MoreHorizontal,
  Briefcase,
  Store,
  Laptop,
  TrendingUp,
  Gift,
  CircleDollarSign,
  Tag,
  Smartphone,
  Banknote,
  CreditCard,
  Wallet,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', style }) => {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent className={className} style={style} />;
};
