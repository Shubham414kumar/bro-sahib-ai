import { useState, useEffect } from 'react';

interface SystemInfo {
  battery: number;
  charging: boolean;
  network: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  time: string;
  date: string;
}

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    battery: 100,
    charging: false,
    network: 'Online',
    deviceType: 'Desktop',
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
  });

  useEffect(() => {
    const updateSystemInfo = async () => {
      // Get battery info
      if ('getBattery' in navigator) {
        try {
          const battery: any = await (navigator as any).getBattery();
          setSystemInfo(prev => ({
            ...prev,
            battery: Math.round(battery.level * 100),
            charging: battery.charging,
          }));
        } catch (e) {
          console.log('Battery API not supported');
        }
      }

      // Get network info
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const networkStatus = navigator.onLine ? (connection?.effectiveType || 'Online') : 'Offline';

      // Get device type
      const width = window.innerWidth;
      let deviceType: 'Mobile' | 'Tablet' | 'Desktop' = 'Desktop';
      if (width < 768) deviceType = 'Mobile';
      else if (width < 1024) deviceType = 'Tablet';

      // Get time and date
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      setSystemInfo(prev => ({
        ...prev,
        network: networkStatus,
        deviceType,
        time,
        date,
      }));
    };

    updateSystemInfo();
    const interval = setInterval(updateSystemInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return systemInfo;
};
