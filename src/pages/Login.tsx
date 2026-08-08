import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { WalletCards } from 'lucide-react';

export function Login() {
  const { user, signInWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 flex flex-col items-center text-center max-w-md w-full"
      >
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-xl shadow-2xl flex items-center justify-center mb-8 relative">
          <WalletCards className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight mb-4">MoneyHisab</h1>
        <p className="text-white/50 text-lg mb-12">
          Premium personal finance tracking. Beautifully simple, powerfully smart.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white text-black font-bold text-lg py-5 px-8 rounded-full flex items-center justify-center gap-3 hover:scale-[0.98] active:scale-95 transition-all shadow-xl"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </motion.div>
    </div>
  );
}
