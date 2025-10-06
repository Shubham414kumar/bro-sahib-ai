import { Card } from './ui/card';
import { Battery, BatteryCharging, Wifi, WifiOff, Monitor, Smartphone, Tablet, Clock, Calendar } from 'lucide-react';
import { useSystemInfo } from '@/hooks/useSystemInfo';

export const SystemStatusPanel = () => {
  const systemInfo = useSystemInfo();

  const getBatteryIcon = () => {
    if (systemInfo.charging) return <BatteryCharging className="h-5 w-5 text-green-400" />;
    if (systemInfo.battery > 50) return <Battery className="h-5 w-5 text-green-400" />;
    if (systemInfo.battery > 20) return <Battery className="h-5 w-5 text-yellow-400" />;
    return <Battery className="h-5 w-5 text-red-400" />;
  };

  const getDeviceIcon = () => {
    if (systemInfo.deviceType === 'Mobile') return <Smartphone className="h-5 w-5" />;
    if (systemInfo.deviceType === 'Tablet') return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur-sm border-jarvis-blue/30">
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-jarvis-blue mb-4">System Status</h3>
        
        <div className="space-y-3">
          {/* Battery */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-3">
              {getBatteryIcon()}
              <span className="text-sm font-medium">Battery</span>
            </div>
            <span className="text-sm font-bold text-jarvis-blue">
              {systemInfo.battery}%
              {systemInfo.charging && ' ⚡'}
            </span>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-3">
              {systemInfo.network !== 'Offline' ? (
                <Wifi className="h-5 w-5 text-green-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-400" />
              )}
              <span className="text-sm font-medium">Network</span>
            </div>
            <span className="text-sm font-bold text-jarvis-blue">
              {systemInfo.network}
            </span>
          </div>

          {/* Device */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-3">
              {getDeviceIcon()}
              <span className="text-sm font-medium">Device</span>
            </div>
            <span className="text-sm font-bold text-jarvis-blue">
              {systemInfo.deviceType}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-jarvis-blue" />
              <span className="text-sm font-medium">Time</span>
            </div>
            <span className="text-sm font-bold text-jarvis-blue">
              {systemInfo.time}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-jarvis-blue" />
              <span className="text-sm font-medium">Date</span>
            </div>
            <span className="text-sm font-bold text-jarvis-blue">
              {systemInfo.date}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
