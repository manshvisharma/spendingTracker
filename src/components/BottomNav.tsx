import { useState, TouchEvent } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, BarChart3, Target, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dash' },
    { to: '/transactions', icon: Receipt, label: 'Txns' },
    { to: '/planner', icon: Target, label: 'Goals' },
    { to: '/analytics', icon: BarChart3, label: 'Stats' },
    { to: '/add', icon: Plus, label: 'Add', isFab: true },
  ];

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const linkElem = elem?.closest('[data-nav-path]') as HTMLElement | null;
    if (linkElem) {
      const path = linkElem.getAttribute('data-nav-path');
      if (path) setHoveredPath(path);
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const linkElem = elem?.closest('[data-nav-path]') as HTMLElement | null;
    if (linkElem) {
      const path = linkElem.getAttribute('data-nav-path');
      if (path) setHoveredPath(path);
    }
  };

  const handleTouchEnd = () => {
    if (hoveredPath && hoveredPath !== location.pathname) {
      navigate(hoveredPath);
    }
    setHoveredPath(null);
  };

  return (
    <div 
      className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[380px] z-50 select-none"
      style={{
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        touchAction: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        onMouseLeave={() => setHoveredPath(null)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-white/90 dark:bg-[#121212]/90 backdrop-blur-2xl saturate-150 border border-black/5 dark:border-white/10 rounded-[28px] h-[58px] px-3 flex items-center justify-between shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const isBubbleTarget = hoveredPath ? hoveredPath === item.to : isActive;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-nav-path={item.to}
              onMouseEnter={() => setHoveredPath(item.to)}
              className={({ isActive: linkActive }) =>
                cn(
                  "relative flex flex-col items-center justify-center transition-all duration-200 z-10 px-2 py-1 rounded-2xl select-none touch-none",
                  item.isFab 
                    ? "w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/25 hover:scale-105 active:scale-95 flex items-center justify-center my-auto ml-1 shrink-0"
                    : "flex-1 text-center"
                )
              }
            >
              {/* SMOOTH SLIDING GLASS BUBBLE */}
              {!item.isFab && isBubbleTarget && (
                <motion.div
                  layoutId="navSlideBubble"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-blue-500/15 dark:bg-blue-400/20 border border-blue-500/25 dark:border-blue-400/35 rounded-2xl shadow-sm -z-10"
                />
              )}

              <div className="flex flex-col items-center justify-center pointer-events-none">
                <item.icon 
                  className={cn(
                    "transition-all duration-200", 
                    item.isFab 
                      ? "w-5 h-5 text-white" 
                      : isBubbleTarget 
                        ? "w-[17px] h-[17px] text-blue-600 dark:text-blue-400 scale-110 -translate-y-0.5" 
                        : "w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                  )} 
                  strokeWidth={isBubbleTarget || item.isFab ? 2.5 : 1.8} 
                />
                {!item.isFab && (
                  <span 
                    className={cn(
                      "text-[9px] font-extrabold tracking-tight whitespace-nowrap leading-none mt-0.5 transition-colors",
                      isBubbleTarget ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
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
