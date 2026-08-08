import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAddTransaction } from '../hooks/useData';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useAuth } from '../contexts/AuthContext';
import { X, Check, Plus, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

// Quick tap preset expense shortcuts
const QUICK_PRESETS = [
  { label: '☕ Chai', amount: '20', catId: 'c1', name: 'Chai' },
  { label: '🥤 Coffee', amount: '100', catId: 'c1', name: 'Coffee' },
  { label: '🛺 Auto / Cab', amount: '60', catId: 'c2', name: 'Auto/Cab' },
  { label: '🍱 Lunch', amount: '150', catId: 'c1', name: 'Lunch' },
  { label: '🛒 Grocery', amount: '350', catId: 'c3', name: 'Grocery' },
  { label: '⛽ Fuel', amount: '200', catId: 'c2', name: 'Fuel' },
  { label: '🍕 Snacks', amount: '120', catId: 'c1', name: 'Snacks' },
];

export function AddExpense() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addTxn = useAddTransaction();
  const { user } = useAuth();
  const { categories, addCustomCategory } = useCustomCategories(user?.uid);
  
  const [amount, setAmount] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(searchParams.get('cat') || null);
  const [customNotes, setCustomNotes] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  
  // Format for datetime-local input
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setAmount(preset.amount);
    setSelectedCatId(preset.catId);
    setCustomNotes(preset.name);
  };

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
      notes: type === 'income' ? (isBorrowed ? 'Borrowed' : 'Income') : (customNotes || cat?.name),
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

  // Show top 8 categories unless expanded
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-col max-w-lg mx-auto px-2 pt-1 pb-16 min-w-0"
    >
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-lg w-full min-w-0 flex flex-col gap-3">
        {/* COMPACT HEADER */}
        <header className="flex justify-between items-center min-w-0 pb-1 border-b border-gray-100 dark:border-white/5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white hover:bg-gray-200 transition-all border border-gray-200/60 dark:border-white/10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-full p-1 shadow-inner">
            <button 
              className={cn(
                "px-4 py-1 rounded-full text-xs font-bold transition-all", 
                type === 'expense' ? "bg-black text-white dark:bg-white dark:text-black shadow-sm" : "text-gray-500 dark:text-white/50"
              )}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
            <button 
              className={cn(
                "px-4 py-1 rounded-full text-xs font-bold transition-all", 
                type === 'income' ? "bg-black text-white dark:bg-white dark:text-black shadow-sm" : "text-gray-500 dark:text-white/50"
              )}
              onClick={() => setType('income')}
            >
              Income
            </button>
          </div>

          <div className="w-8" />
        </header>

        {/* COMPACT AMOUNT SECTION */}
        <div className="flex flex-col items-center justify-center py-4 bg-gray-50/80 dark:bg-black/20 border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-widest font-bold mb-1">Enter Amount</p>
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-2xl text-gray-400 dark:text-white/30 mr-1.5 font-bold">₹</span>
            <input
              type="number"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-4xl font-extrabold text-black dark:text-white w-full max-w-[200px] text-center outline-none placeholder:text-gray-300 dark:placeholder:text-white/10"
              placeholder="0"
            />
          </div>

          {/* Note input */}
          <input 
            type="text"
            placeholder="Add note (optional e.g. Starbucks, Uber)"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full max-w-xs text-center text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500/40 mb-2.5 shadow-sm"
          />

          {/* Date Selector Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-white/10 px-3 py-1 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
              <input 
                type="checkbox" 
                checked={useCustomDate} 
                onChange={e => setUseCustomDate(e.target.checked)}
                className="accent-blue-500 rounded w-3 h-3" 
              />
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">Custom Date</span>
            </label>
            
            <AnimatePresence>
              {useCustomDate && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden">
                  <input 
                    type="datetime-local" 
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    className="bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-full px-3 py-1 text-[10px] font-semibold text-gray-700 dark:text-white outline-none shadow-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* QUICK TAP PRESETS */}
        {type === 'expense' && (
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Quick 1-Tap Presets
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0">
              {QUICK_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="shrink-0 text-[11px] font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  {p.label} <span className="text-emerald-500">₹{p.amount}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY SELECTOR */}
        <AnimatePresence>
          {type === 'expense' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2"
            >
              <div className="flex justify-between items-center px-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Choose Category</p>
                <button 
                  onClick={() => setShowNewCat(!showNewCat)}
                  className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 hover:scale-105 transition-all border border-blue-500/20"
                >
                  <Plus className="w-3 h-3" /> Custom Cat
                </button>
              </div>
              
              <AnimatePresence>
                {showNewCat && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }} 
                    className="overflow-hidden mb-1"
                  >
                    <div className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 p-2.5 rounded-2xl flex gap-2 shadow-sm">
                      <input 
                        type="text" 
                        placeholder="Emoji" 
                        value={newCatEmoji} 
                        onChange={e => setNewCatEmoji(e.target.value)}
                        className="w-12 bg-white dark:bg-white/10 rounded-xl p-2 text-center text-xs outline-none border border-gray-200 dark:border-white/10"
                      />
                      <input 
                        type="text" 
                        placeholder="Category Name" 
                        value={newCatName} 
                        onChange={e => setNewCatName(e.target.value)}
                        className="flex-1 bg-white dark:bg-white/10 rounded-xl p-2 text-xs outline-none border border-gray-200 dark:border-white/10"
                      />
                      <button 
                        onClick={handleSaveCustomCat}
                        className="bg-blue-500 text-white px-3 rounded-xl text-xs font-bold shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* COMPACT GRID */}
              <div className="grid grid-cols-4 gap-2">
                {displayedCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all border",
                      selectedCatId === cat.id 
                        ? "bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm scale-102" 
                        : "bg-gray-50/80 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-100 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <span className="text-xl mb-1">{cat.emoji}</span>
                    <span className="text-[10px] font-semibold truncate w-full text-center">{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* SHOW MORE / LESS TOGGLE */}
              {categories.length > 8 && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="w-full mt-1 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-[11px] font-bold flex items-center justify-center gap-1 hover:text-black dark:hover:text-white transition-all"
                >
                  {showAllCategories ? (
                    <>Show Fewer Categories <ChevronUp className="w-3.5 h-3.5" /></>
                  ) : (
                    <>Show All Categories ({categories.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                  )}
                </button>
              )}
            </motion.div>
          )}
          
          {type === 'income' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="my-2 flex justify-center"
            >
              <label className="flex items-center gap-2.5 bg-gray-50 dark:bg-white/5 px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isBorrowed}
                  onChange={(e) => setIsBorrowed(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-white">This is borrowed (Need to pay back later)</span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={!isReady}
          className={cn(
            "w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-md mt-1",
            isReady 
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-98" 
              : "bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 cursor-not-allowed shadow-none"
          )}
        >
          <Check className="w-4 h-4" strokeWidth={2.5} />
          Save {type === 'expense' ? 'Expense' : 'Income'}
        </button>
      </div>
    </motion.div>
  );
}
