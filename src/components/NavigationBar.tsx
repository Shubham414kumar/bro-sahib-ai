import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Activity, CreditCard, Settings, BookOpen, AppWindow, Monitor, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/transcript', label: 'Chat', icon: MessageSquare },
  { path: '/study', label: 'Study', icon: BookOpen },
  { path: '/apps', label: 'Apps', icon: AppWindow },
  { path: '/automation', label: 'Auto', icon: Monitor },
  { path: '/face', label: 'Face', icon: Camera },
  { path: '/system', label: 'System', icon: Activity },
  { path: '/payment', label: 'Payment', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const NavigationBar = () => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 bg-card/50 backdrop-blur-sm border border-jarvis-blue/20 rounded-full px-4 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300',
                isActive
                  ? 'bg-jarvis-blue text-white shadow-lg shadow-jarvis-blue/50'
                  : 'text-muted-foreground hover:text-jarvis-blue hover:bg-jarvis-blue/10'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-jarvis-blue/20 z-50">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-300',
                  isActive
                    ? 'bg-jarvis-blue/20 text-jarvis-blue'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 mb-1', isActive && 'animate-pulse')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
