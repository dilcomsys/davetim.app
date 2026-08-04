import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface RSVPChartProps {
  attending: number;
  notAttending: number;
  pending: number;
}

export const RSVPChart: React.FC<RSVPChartProps> = ({
  attending,
  notAttending,
  pending,
}) => {
  const total = attending + notAttending + pending;
  
  if (total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">RSVP Durumu</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Henüz RSVP verisi yok</p>
          </div>
        </div>
      </div>
    );
  }

  const attendingPercent = Math.round((attending / total) * 100);
  const notAttendingPercent = Math.round((notAttending / total) * 100);
  const pendingPercent = Math.round((pending / total) * 100);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">RSVP Durumu</h3>
      
      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-4 sm:mb-6">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="20"
            />
            
            {/* Attending arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#10b981"
              strokeWidth="20"
              strokeDasharray={`${attendingPercent * 2.51327} 251.327`}
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
            />
            
            {/* Not attending arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray={`${notAttendingPercent * 2.51327} 251.327`}
              strokeDashoffset={`-${attendingPercent * 2.51327}`}
              transform="rotate(-90 50 50)"
            />
            
            {/* Pending arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="20"
              strokeDasharray={`${pendingPercent * 2.51327} 251.327`}
              strokeDashoffset={`-${(attendingPercent + notAttendingPercent) * 2.51327}`}
              transform="rotate(-90 50 50)"
            />
            
            {/* Center text */}
            <text
              x="50"
              y="45"
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill="#1f2937"
            >
              {total}
            </text>
            <text
              x="50"
              y="58"
              textAnchor="middle"
              fontSize="8"
              fill="#6b7280"
            >
              Toplam Davetli
            </text>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm text-gray-700">Katılacak</span>
          </div>
          <div className="text-right">
            <span className="text-xs sm:text-sm font-semibold text-gray-900">{attending}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 ml-1 sm:ml-2">({attendingPercent}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm text-gray-700">Katılmayacak</span>
          </div>
          <div className="text-right">
            <span className="text-xs sm:text-sm font-semibold text-gray-900">{notAttending}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 ml-1 sm:ml-2">({notAttendingPercent}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm text-gray-700">Bekliyor</span>
          </div>
          <div className="text-right">
            <span className="text-xs sm:text-sm font-semibold text-gray-900">{pending}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 ml-1 sm:ml-2">({pendingPercent}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

