import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Network Status Indicator
 * Shows a notification when the user goes offline/online
 */
export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      toast.success('İnternet bağlantısı yeniden kuruldu! 🎉', {
        duration: 3000,
        icon: <Wifi className="h-5 w-5 text-green-500" />,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
      toast.error('İnternet bağlantısı kesildi! 📡', {
        duration: Infinity,
        id: 'offline-toast',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      toast.dismiss('offline-toast');
    };
  }, []);

  if (!showOfflineBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg animate-slide-down">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <WifiOff className="h-5 w-5 animate-pulse" />
        <span className="font-medium">
          İnternet bağlantısı yok - Bazı özellikler çalışmayabilir
        </span>
      </div>
    </div>
  );
};

/**
 * Hook to check network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

