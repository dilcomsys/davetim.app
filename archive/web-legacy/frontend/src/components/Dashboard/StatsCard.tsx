import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: 'primary' | 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  primary: 'bg-primary-100 text-primary-600',
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
}) => {
  // Ensure value is never NaN
  const displayValue = isNaN(Number(value)) ? 0 : value;
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{displayValue}</p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${colorClasses[iconColor]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center mt-2">
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500 ml-2">son 30 gün</span>
        </div>
      )}
    </div>
  );
};

