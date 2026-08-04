import React from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

interface AccordionSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  defaultPadding?: boolean;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  icon: Icon,
  badge,
  badgeColor = 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700',
  isExpanded,
  onToggle,
  children,
  defaultPadding = true
}) => {
  return (
    <div className="border-t border-gray-200/50">
      {/* Header - Clickable */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-700 flex-shrink-0" />
          <h3 className="text-xs font-bold text-gray-900">{title}</h3>
          {badge && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
        )}
      </button>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className={defaultPadding ? 'px-3 pb-3' : ''}>
          {children}
        </div>
      )}
    </div>
  );
};

