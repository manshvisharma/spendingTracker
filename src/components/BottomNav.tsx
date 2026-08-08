import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, BarChart3, Target, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function BottomNav() {
  const location = useLocation();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dash' },
    { to: '/transactions', icon: Receipt, label: 'Txns' },
    { to: '/add', icon: Plus, label: 'Add', isFab: true },
    { to: '/planner', icon: Target, label: 'Goals' },
    { to: '/analytics', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[380px] z-50">
      <div 
        onMouseLeave={() => setHoveredPath(null)}
        className="relative bg-white/90 dark:bg-[#121212]/90 backdrop-blur-2xl saturate-150 border border-black/5 dark:border-white/10 rounded-[28px] h-[58px] px-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const isHovered = hoveredPath === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onMouseEnter={() => setHoveredPath(item.to)}
              className={({ isActive: linkActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200 z-10 px-2.5 py-1.5 rounded-2xl select-none",
                  item.isFab 
                    ? "w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-md shadow-blue-500/30 hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white dark:border-[#121212] -translate-y-2.5"
                    : "flex-1 text-center"
                )
              }
            >
              {/* SLIDING ACTIVE GLASS BUBBLE */}
              {!item.isFab && isActive && (
                <motion.div
                  layoutId="activeBubble"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/20 border border-blue-500/20 dark:border-blue-400/30 rounded-2xl shadow-sm -z-10"
                />
              )}

              {/* SLIDING HOVER BUBBLE (WHEN NOT ACTIVE) */}
              {!item.isFab && !isActive && isHovered && (
                <motion.div
                  layoutId="hoverBubble"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-black/5 dark:bg-white/10 rounded-2xl -z-10"
                />
              )}

              <div className="flex flex-col items-center justify-center">
                <item.icon 
                  className={cn(
                    "transition-all duration-200", 
                    item.isFab 
                      ? "w-5 h-5 text-white" 
                      : isActive 
                        ? "w-[17px] h-[17px] text-blue-600 dark:text-blue-400 scale-110 -translate-y-0.5" 
                        : "w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                  )} 
                  strokeWidth={isActive || item.isFab ? 2.5 : 1.8} 
                />
                {!item.isFab && (
                  <span 
                    className={cn(
                      "text-[9px] font-extrabold tracking-tight whitespace-nowrap leading-none mt-0.5 transition-colors",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
