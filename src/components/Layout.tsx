import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from './BottomNav';

export function Layout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen selection:bg-black/10 dark:selection:bg-white/30 overflow-x-hidden font-sans">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>
      
      <main className="relative z-10 w-full max-w-lg mx-auto pb-32 min-h-screen flex flex-col px-4 sm:px-6 pt-8">
        <Outlet />
      </main>
      
      <BottomNav />
    </div>
  );
}
