import React from 'react';
import { TrendingUp, Eye } from 'lucide-react';

interface ViewDataPoint {
  date: string;
  views: number;
}

interface ViewsTimelineProps {
  data: ViewDataPoint[];
  totalViews: number;
}

export const ViewsTimeline: React.FC<ViewsTimelineProps> = ({ data, totalViews }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Görüntüleme Trendi</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Henüz görüntüleme verisi yok</p>
          </div>
        </div>
      </div>
    );
  }

  const maxViews = Math.max(...data.map(d => d.views), 1);
  const avgViews = Math.round(data.reduce((sum, d) => sum + d.views, 0) / data.length);

  // Last 7 days for chart
  const chartData = data.slice(-7);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Görüntüleme Trendi</h3>
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-green-500" />
          <span>Son 7 gün</span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Toplam Görüntüleme</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalViews}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Günlük Ortalama</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgViews}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-2 sm:space-y-3">
        {chartData.map((point, index) => {
          const barHeight = maxViews > 0 ? (point.views / maxViews) * 100 : 0;
          const date = new Date(point.date);
          const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
          const dayNumber = date.getDate();

          return (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 sm:w-12 text-[10px] sm:text-xs text-gray-600 font-medium">
                {dayName} {dayNumber}
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-6 sm:h-8 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500 flex items-center justify-end pr-2 sm:pr-3"
                  style={{ width: `${Math.max(barHeight, 3)}%` }}
                >
                  {point.views > 0 && (
                    <span className="text-[10px] sm:text-xs font-semibold text-white">
                      {point.views}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {chartData.length >= 2 && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-900">İstatistik</p>
              <p className="text-[10px] sm:text-xs text-blue-700 mt-1">
                {chartData[chartData.length - 1].views > chartData[0].views
                  ? `Son 7 günde görüntülemeleriniz artış gösterdi! 📈`
                  : `Davetiyelerinizi daha fazla paylaşarak görüntüleme sayınızı artırabilirsiniz.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

