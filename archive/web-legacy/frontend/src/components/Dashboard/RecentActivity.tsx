import React from 'react';
import { Eye, UserPlus, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';

export interface Activity {
  id: string;
  type: 'view' | 'rsvp_yes' | 'rsvp_no' | 'guest_added' | 'invitation_created';
  title: string;
  description: string;
  timestamp: string;
  invitationTitle?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'view':
      return <Eye className="h-5 w-5 text-blue-500" />;
    case 'rsvp_yes':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'rsvp_no':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'guest_added':
      return <UserPlus className="h-5 w-5 text-purple-500" />;
    case 'invitation_created':
      return <Calendar className="h-5 w-5 text-primary-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  return past.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Henüz aktivite yok</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Son Aktiviteler</h3>
      
      <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="scale-90 sm:scale-100">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900">
                {activity.title}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">
                {activity.description}
              </p>
              {activity.invitationTitle && (
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 italic truncate">
                  Davetiye: {activity.invitationTitle}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
              {getTimeAgo(activity.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

