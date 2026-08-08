import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBudget, useUpdateBudget, useTransactions, useRestoreTransaction } from '../hooks/useData';
import { LogOut, User, Shield, Bell, Download, Trash2, Moon, Sun, Save, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: budget } = useBudget();
  const { data: transactions } = useTransactions();
  const updateBudget = useUpdateBudget();
  const restoreTxn = useRestoreTransaction();
  const navigate = useNavigate();

  const [savings, setSavings] = useState('');
  const [paydayStart, setPaydayStart] = useState('5');
  const [rollover, setRollover] = useState(true);
  const [pocketMoneyAmount, setPocketMoneyAmount] = useState('10000');
  const [isSaving, setIsSaving] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  useEffect(() => {
    if (budget) {
      setSavings(budget.monthlySavings?.toString() || '');
      setPaydayStart(budget.paydayCycleStartDay?.toString() || '5');
      setRollover(budget.enableRollover !== false);
      setPocketMoneyAmount(budget.nextPocketMoneyAmount?.toString() || '10000');
    }
  }, [budget]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaveBudget = async () => {
    setIsSaving(true);
    try {
      await updateBudget.mutateAsync({
        monthlySavings: Number(savings) || 0,
        paydayCycleStartDay: Number(paydayStart) || 5,
        enableRollover: rollover,
        nextPocketMoneyAmount: Number(pocketMoneyAmount) || 10000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!transactions) return;
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Notes'];
    const rows = transactions.map(t => [
      new Date(t.date).toISOString().split('T')[0],
      t.type,
      t.amount.toString(),
      t.categoryName || '',
      t.notes || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <header className="mt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      </header>

      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 flex items-center gap-4 shadow-sm dark:shadow-none">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-full border border-gray-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-white/5" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-pink-500/20 text-white">
            {user?.displayName ? user.displayName.charAt(0) : 'JD'}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold">{user?.displayName || 'John Doe'}</h2>
          <p className="text-gray-500 dark:text-white/50 text-sm">{user?.email || 'john@example.com'}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider ml-4 mb-1 mt-4">Budget & Income</h3>
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-600 dark:text-white/70 block mb-1">Pocket Money / Payday Cycle Start Day</label>
            <input 
              type="number"
              min="1"
              max="28"
              value={paydayStart}
              onChange={(e) => setPaydayStart(e.target.value)}
              placeholder="e.g. 5 for 5th of every month"
              className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">e.g. Setting '5' runs your cycle from 5th of this month to 4th of next month.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-white/70 block mb-1">Expected Pocket Money (₹)</label>
              <input 
                type="number"
                value={pocketMoneyAmount}
                onChange={(e) => setPocketMoneyAmount(e.target.value)}
                placeholder="10000"
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-2.5 outline-none text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-white/70 block mb-1">Monthly Savings Target (₹)</label>
              <input 
                type="number"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                placeholder="2000"
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-2.5 outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Daily Budget Rollover</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">If you spend less today, carry forward unspent allowance to boost tomorrow's budget.</p>
            </div>
            <button 
              type="button"
              onClick={() => setRollover(!rollover)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative p-1 shrink-0",
                rollover ? "bg-blue-600" : "bg-gray-300 dark:bg-white/20"
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full bg-white transition-transform shadow-md",
                rollover ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>

          <button 
            onClick={handleSaveBudget}
            disabled={isSaving}
            className="mt-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-2xl flex justify-center items-center gap-2 hover:opacity-90 transition-opacity text-sm"
          >
            {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Save Preferences</>}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider ml-4 mb-1 mt-4">Preferences</h3>
        
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-sm dark:shadow-none">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/5"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-gray-600 dark:text-white/60" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-white/60" />}
            <span className="flex-1 font-semibold text-sm">Theme ({theme})</span>
          </button>
          <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/5">
            <Shield className="w-5 h-5 text-gray-600 dark:text-white/60" />
            <span className="flex-1 font-semibold text-sm">Security & Privacy</span>
          </button>
          <button className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/5">
            <Bell className="w-5 h-5 text-gray-600 dark:text-white/60" />
            <span className="flex-1 font-semibold text-sm">Notifications</span>
          </button>
          <button onClick={handleExportCSV} className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/5">
            <Download className="w-5 h-5 text-gray-600 dark:text-white/60" />
            <span className="flex-1 font-semibold text-sm">Export Data (CSV)</span>
          </button>
          <button onClick={() => setShowRecycleBin(!showRecycleBin)} className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left border-b border-gray-100 dark:border-white/5">
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-white/60" />
            <span className="flex-1 font-semibold text-sm">Recycle Bin</span>
          </button>
        </div>
      </div>

      {showRecycleBin && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none mb-4">
          <h3 className="font-bold mb-4">Deleted Transactions</h3>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {transactions?.filter(t => t.deletedAt).length === 0 ? (
              <p className="text-sm text-gray-500">Recycle bin is empty.</p>
            ) : (
              transactions?.filter(t => t.deletedAt).map(txn => (
                <div key={txn.id} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold">{txn.notes || txn.categoryName}</p>
                    <p className="text-xs text-gray-500">₹{txn.amount}</p>
                  </div>
                  <button 
                    onClick={() => txn.id && restoreTxn.mutate(txn.id)}
                    className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="mt-8 bg-white dark:bg-white/5 backdrop-blur-xl text-gray-900 dark:text-white font-semibold text-lg py-4 px-8 rounded-full flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/10 active:scale-95 transition-all border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>
    </motion.div>
  );
}
