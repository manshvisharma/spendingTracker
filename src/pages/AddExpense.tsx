import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAddTransaction } from '../hooks/useData';
import { defaultCategories } from '../lib/types';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useAuth } from '../contexts/AuthContext';
import { X, Check, Calendar, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export function AddExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addTxn = useAddTransaction();
  const { user } = useAuth();
  const { categories, addCustomCategory } = useCustomCategories(user?.uid);
  
  const [amount, setAmount] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(searchParams.get('cat') || null);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  
  // Format for datetime-local input: YYYY-MM-DDThh:mm
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return;
    if (type === 'expense' && !selectedCatId) return;

    const cat = categories.find(c => c.id === selectedCatId);

    const transactionDate = useCustomDate ? new Date(customDate).getTime() : Date.now();

    await addTxn.mutateAsync({
      amount: Number(amount),
      type,
      categoryId: type === 'expense' ? cat?.id : undefined,
      categoryName: type === 'expense' ? cat?.name : undefined,
      categoryEmoji: type === 'expense' ? cat?.emoji : undefined,
      categoryColor: type === 'expense' ? cat?.color : undefined,
      date: transactionDate,
      notes: type === 'income' ? (isBorrowed ? 'Borrowed' : 'Income') : cat?.name,
      isBorrowed: type === 'income' ? isBorrowed : undefined
    });

    navigate(-1);
  };

  const handleSaveCustomCat = () => {
    if (newCatName && newCatEmoji) {
      addCustomCategory(newCatName, newCatEmoji);
      setShowNewCat(false);
      setNewCatName('');
      setNewCatEmoji('✨');
    }
  };

  const isReady = amount && Number(amount) > 0 && (type === 'income' || selectedCatId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="flex flex-col h-[calc(100vh-40px)]"
    >
      <header className="flex justify-between items-center py-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-white/10 backdrop-blur-md rounded-full text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white transition-colors border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <X className="w-6 h-6" />
        </button>
        <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full p-1 backdrop-blur-xl shadow-sm dark:shadow-none">
          <button 
            className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-colors", type === 'expense' ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white/80")}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
          <button 
            className={cn("px-5 py-2 rounded-full text-sm font-semibold transition-colors", type === 'income' ? "bg-black text-white dark:bg-white dark:text-black shadow-md" : "text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white/80")}
            onClick={() => setType('income')}
          >
            Income
          </button>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col items-center justify-center py-6">
        <p className="text-[10px] text-gray-500 dark:text-white/50 mb-2 uppercase tracking-widest font-bold">Enter Amount</p>
        <div className="flex items-baseline justify-center mb-6">
          <span className="text-4xl text-gray-400 dark:text-white/30 mr-2 font-bold">₹</span>
          <input
            type="number"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-6xl font-bold text-black dark:text-white w-full max-w-[250px] text-center outline-none placeholder:text-gray-300 dark:placeholder:text-white/10"
            placeholder="0"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/10">
            <input 
              type="checkbox" 
              checked={useCustomDate} 
              onChange={e => setUseCustomDate(e.target.checked)}
              className="accent-blue-500 rounded" 
            />
            <span className="text-xs font-semibold">Custom Date</span>
          </label>
          
          <AnimatePresence>
            {useCustomDate && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                <input 
                  type="datetime-local" 
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-full px-4 py-2 text-xs font-semibold text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {type === 'expense' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 overflow-y-auto pb-32"
          >
            <div className="flex justify-between items-center px-4 mb-4 mt-2">
              <p className="text-[10px] text-gray-500 dark:text-white/50 uppercase tracking-widest font-bold">Choose Category</p>
              <button 
                onClick={() => setShowNewCat(!showNewCat)}
                className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/20 px-2 py-1 rounded-full flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            
            <AnimatePresence>
              {showNewCat && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }} 
                  className="px-4 overflow-hidden"
                >
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-[24px] mb-4 flex gap-2 shadow-sm dark:shadow-none">
                    <input 
                      type="text" 
                      placeholder="Emoji (e.g. 🎮)" 
                      value={newCatEmoji} 
                      onChange={e => setNewCatEmoji(e.target.value)}
                      className="w-16 bg-gray-50 dark:bg-black/20 rounded-xl p-2 text-center outline-none border border-gray-200 dark:border-white/10"
                    />
                    <input 
                      type="text" 
                      placeholder="Category Name" 
                      value={newCatName} 
                      onChange={e => setNewCatName(e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-black/20 rounded-xl p-2 outline-none border border-gray-200 dark:border-white/10"
                    />
                    <button 
                      onClick={handleSaveCustomCat}
                      className="bg-blue-500 text-white px-4 rounded-xl font-bold"
                    >
                      Add
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-4 gap-4 px-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-[24px] transition-all backdrop-blur-md",
                    selectedCatId === cat.id ? "bg-white dark:bg-white/20 border border-gray-300 dark:border-white/30 scale-105 shadow-lg shadow-black/5 dark:shadow-white/5" : "bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none"
                  )}
                >
                  <div className="text-3xl mb-2">{cat.emoji}</div>
                  <span className="text-[10px] font-semibold text-gray-700 dark:text-white/80 line-clamp-1">{cat.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
        
        {type === 'income' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 flex justify-center pb-32"
          >
            <label className="flex items-center gap-3 bg-white dark:bg-white/5 px-6 py-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer h-fit mt-4">
              <input 
                type="checkbox" 
                checked={isBorrowed}
                onChange={(e) => setIsBorrowed(e.target.checked)}
                className="w-5 h-5 accent-orange-500 rounded"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-white">This is borrowed (Need to pay back)</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 left-4 right-4 max-w-lg mx-auto">
        <button
          onClick={handleSave}
          disabled={!isReady}
          className={cn(
            "w-full py-5 rounded-full flex items-center justify-center gap-2 text-lg font-bold transition-all shadow-xl",
            isReady ? "bg-gradient-to-tr from-blue-500 to-indigo-600 text-white hover:scale-[0.98] shadow-blue-500/25" : "bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed shadow-none"
          )}
        >
          <Check className="w-6 h-6" strokeWidth={3} />
          Save {type === 'expense' ? 'Expense' : 'Income'}
        </button>
      </div>
    </motion.div>
  );
}
