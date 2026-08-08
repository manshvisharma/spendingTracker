import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, BarChart3, Target, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function BottomNav() {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dash' },
    { to: '/transactions', icon: Receipt, label: 'Txns' },
    { to: '/add', icon: Plus, label: 'Add', isFab: true },
    { to: '/planner', icon: Target, label: 'Goals' },
    { to: '/analytics', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[370px] z-50">
      <div className="bg-white/85 dark:bg-[#121212]/85 backdrop-blur-2xl saturate-150 border border-black/5 dark:border-white/10 rounded-[28px] h-[54px] px-3.5 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "relative flex items-center justify-center transition-all duration-300 px-2 py-1 rounded-full",
                item.isFab 
                  ? "w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-md shadow-blue-500/30 hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white dark:border-[#121212]"
                  : isActive 
                    ? "-translate-y-1 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1" 
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              )
            }
          >
            {({ isActive }) => (
              <div className="flex items-center gap-1">
                <item.icon className={cn("w-[18px] h-[18px]", item.isFab && "w-5 h-5 text-white")} strokeWidth={isActive || item.isFab ? 2.5 : 1.8} />
                {!item.isFab && isActive && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[11px] font-bold tracking-tight whitespace-nowrap ml-0.5"
                  >
                    {item.label}
                  </motion.span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
