import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTransactions, useDeleteTransaction, useUpdateTransaction, useAddTransaction } from '../hooks/useData';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Search, Trash2, Check, Copy, Share2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function Transactions() {
  const { data: transactions } = useTransactions();
  const deleteTxn = useDeleteTransaction();
  const updateTxn = useUpdateTransaction();
  const addTxn = useAddTransaction();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'borrowed' | 'high'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Custom Modal States
  const [confirmDeleteTxn, setConfirmDeleteTxn] = useState<any | null>(null);
  const [splitTxn, setSplitTxn] = useState<any | null>(null);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [copiedText, setCopiedText] = useState(false);
  
  const txns = (transactions || []).filter(t => !t.deletedAt);
  
  const filteredTxns = txns.filter(t => {
    const matchesSearch = (t.notes?.toLowerCase().includes(search.toLowerCase()) || 
      t.categoryName?.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filter === 'income' && t.type !== 'income') return false;
    if (filter === 'expense' && t.type !== 'expense') return false;
    if (filter === 'borrowed' && (!t.isBorrowed || t.repaid)) return false;
    if (filter === 'high' && t.amount < 1000) return false;
    
    if (timeFilter === 'today' && !isToday(t.date)) return false;
    if (timeFilter === 'week' && !isThisWeek(t.date)) return false;
    if (timeFilter === 'month' && !isThisMonth(t.date)) return false;
    
    return true;
  });

  const groupTransactions = () => {
    const groups: { [key: string]: typeof txns } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    filteredTxns.forEach(t => {
      if (isToday(t.date)) groups['Today'].push(t);
      else if (isYesterday(t.date)) groups['Yesterday'].push(t);
      else if (isThisWeek(t.date)) groups['This Week'].push(t);
      else if (isThisMonth(t.date)) groups['This Month'].push(t);
      else groups['Older'].push(t);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  };

  const handleMarkRepaid = async (txn: any) => {
    if (txn.id) {
      await updateTxn.mutateAsync({ id: txn.id, repaid: true });
      await addTxn.mutateAsync({
        amount: txn.amount,
        type: 'expense',
        notes: `Repaid: ${txn.notes || 'Borrowed'}`,
        date: Date.now(),
        categoryId: 'c15', // misc
        relatedBorrowedId: txn.id
      });
    }
  };

  const handleDuplicate = async (txn: any) => {
    await addTxn.mutateAsync({
      amount: txn.amount,
      type: txn.type,
      notes: `${txn.notes || 'Transaction'} (Copy)`,
      date: Date.now(),
      categoryId: txn.categoryId,
      categoryName: txn.categoryName,
      categoryEmoji: txn.categoryEmoji,
      categoryColor: txn.categoryColor,
      isBorrowed: txn.isBorrowed
    });
  };

  const handleCopySplitMsg = (txn: any) => {
    const perPerson = Math.ceil(txn.amount / splitCount);
    const text = `Hey! Your share for "${txn.notes || txn.categoryName || 'Expense'}" is ₹${perPerson}. Total was ₹${txn.amount} split among ${splitCount} people. Please UPI me!`;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 h-full"
    >
      <header className="flex items-center justify-between mt-1">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Transactions</h1>
          <p className="text-[11px] text-gray-500 dark:text-white/40">History, filters & split payment requests</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl py-2.5 pl-10 pr-3 text-xs text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all shadow-sm"
        />
      </div>
      
      <div className="flex flex-col gap-2 -mt-1">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {(['all', 'expense', 'income', 'borrowed', 'high'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                filter === f 
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm" 
                  : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50"
              )}
            >
              {f === 'high' ? '> ₹1000' : f === 'borrowed' ? '💳 Borrowed' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'today', 'week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors uppercase tracking-wider",
                timeFilter === f 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" 
                  : "bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 space-y-4">
        {groupTransactions().map(([label, items]) => (
          <div key={label}>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{label}</h3>
            <div className="flex flex-col gap-1.5 bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 overflow-hidden shadow-sm">
              {items.map((txn, index) => (
                <motion.div 
                  layout
                  key={txn.id} 
                  className={cn(
                    "flex items-center justify-between group cursor-pointer py-1.5",
                    index !== items.length - 1 && "border-b border-gray-100 dark:border-white/5 pb-2.5"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div 
                      className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-base shrink-0"
                    >
                      {txn.categoryEmoji || '💰'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{txn.notes || txn.categoryName || 'Income'}</span>
                        {txn.isBorrowed && !txn.repaid && (
                          <span className="shrink-0 text-[8px] bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Borrowed
                          </span>
                        )}
                        {txn.isBorrowed && txn.repaid && (
                          <span className="shrink-0 text-[8px] bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Repaid
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-white/40 mt-0.5">{format(txn.date, 'h:mm a • d MMM')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={cn(
                      "text-xs font-black mr-0.5",
                      txn.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'
                    )}>
                      {txn.type === 'income' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </p>

                    <div className="flex items-center gap-0.5">
                      {txn.isBorrowed && !txn.repaid && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkRepaid(txn);
                          }}
                          className="p-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 rounded-lg transition-all"
                          title="Mark as Repaid"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button 
                        onClick={() => handleDuplicate(txn)}
                        className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-all"
                        title="Duplicate Transaction"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {txn.type === 'expense' && (
                        <button 
                          onClick={() => { setSplitTxn(txn); setSplitCount(2); }}
                          className="p-1 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/20 rounded-lg transition-all"
                          title="Split Expense"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setConfirmDeleteTxn(txn);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        {filteredTxns.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No transactions found.
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      <AnimatePresence>
        {confirmDeleteTxn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmDeleteTxn(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-6 rounded-[28px] max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500 mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Transaction?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">₹{confirmDeleteTxn.amount.toLocaleString('en-IN')}</span> ({confirmDeleteTxn.notes || confirmDeleteTxn.categoryName || 'Transaction'})? This action will move it to trash and automatically revert any linked status.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteTxn(null)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (confirmDeleteTxn.id) {
                      deleteTxn.mutate(confirmDeleteTxn.id);
                    }
                    setConfirmDeleteTxn(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-lg shadow-red-500/30"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Expense Modal */}
      <AnimatePresence>
        {splitTxn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSplitTxn(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-6 rounded-[28px] max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Split Expense</h3>
                <button onClick={() => setSplitTxn(null)} className="text-xs font-bold text-gray-400">Close</button>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{splitTxn.notes || splitTxn.categoryName}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{splitTxn.amount.toLocaleString('en-IN')}</p>
              </div>

              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block">Split between people:</label>
              <div className="flex items-center gap-3 mb-6">
                {[2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setSplitCount(num)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors",
                      splitCount === num 
                        ? "bg-purple-600 text-white border-purple-600" 
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {num} People
                  </button>
                ))}
              </div>

              <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 p-4 rounded-2xl mb-6 text-center">
                <p className="text-xs text-purple-600 dark:text-purple-300 font-medium">Per Person Share</p>
                <p className="text-2xl font-black text-purple-700 dark:text-purple-200 mt-1">₹{Math.ceil(splitTxn.amount / splitCount)}</p>
              </div>

              <button 
                onClick={() => handleCopySplitMsg(splitTxn)}
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
              >
                {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedText ? "Message Copied!" : "Copy WhatsApp Request Msg"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
