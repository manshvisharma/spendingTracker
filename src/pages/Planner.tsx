import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGoals, useTransactions, useAddGoal, useBudget, useSubscriptions, useAddSubscription, useAddTransaction, useUpdateSubscription, useUpdateTransaction } from '../hooks/useData';
import { Target, X, Check, Pause, Play, Sparkles } from 'lucide-react';
import { startOfMonth, endOfMonth, differenceInDays, isSameMonth, format } from 'date-fns';
import { cn } from '../lib/utils';
import { BrandLogo, POPULAR_PRESETS } from '../components/BrandLogo';

export function Planner() {
  const { data: goals } = useGoals();
  const { data: transactions } = useTransactions();
  const { data: budget } = useBudget();
  const { data: subscriptions } = useSubscriptions();
  const addGoal = useAddGoal();
  const addSub = useAddSubscription();
  const addTxn = useAddTransaction();
  const updateTxn = useUpdateTransaction();
  const updateSub = useUpdateSubscription();
  
  const [plannerTab, setPlannerTab] = useState<'all' | 'goals' | 'subscriptions' | 'borrowed'>('all');

  const [showAdd, setShowAdd] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const [showAddSub, setShowAddSub] = useState(false);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDay, setSubDay] = useState('');

  const handleSelectPreset = (preset: typeof POPULAR_PRESETS[0]) => {
    setSubName(preset.name);
    setSubAmount(preset.amount);
    setSubDay(preset.day);
  };

  const handleAddGoal = async () => {
    if (goalName && goalAmount) {
      await addGoal.mutateAsync({
        name: goalName,
        targetAmount: Number(goalAmount),
        type: 'custom'
      });
      setShowAdd(false);
      setGoalName('');
      setGoalAmount('');
    }
  };

  const handleAddSub = async () => {
    if (subName && subAmount && subDay) {
      await addSub.mutateAsync({
        name: subName,
        amount: Number(subAmount),
        dueDate: Number(subDay),
      });
      setShowAddSub(false);
      setSubName('');
      setSubAmount('');
      setSubDay('');
    }
  };

  const handleMarkSubPaid = async (sub: any) => {
    const currentMonthStr = format(new Date(), 'yyyy-MM');
    if (sub.lastPaidMonth === currentMonthStr) {
      return;
    }
    
    await addTxn.mutateAsync({
      amount: sub.amount,
      type: 'expense',
      notes: `Fixed Cost: ${sub.name}`,
      date: Date.now(),
      categoryId: 'c12',
      relatedSubscriptionId: sub.id,
      paidMonth: currentMonthStr
    });
    
    await updateSub.mutateAsync({
      id: sub.id,
      lastPaidMonth: currentMonthStr
    });
  };

  const handleMarkBorrowedRepaid = async (txn: any) => {
    if (txn.id) {
      await updateTxn.mutateAsync({ id: txn.id, repaid: true });
      await addTxn.mutateAsync({
        amount: txn.amount,
        type: 'expense',
        notes: `Repaid: ${txn.notes || 'Borrowed'}`,
        date: Date.now(),
        categoryId: 'c15',
        relatedBorrowedId: txn.id
      });
    }
  };

  const handleTogglePause = async (sub: any) => {
    await updateSub.mutateAsync({
      id: sub.id,
      isPaused: !sub.isPaused
    });
  };
  
  const txns = (transactions || []).filter(t => !t.deletedAt);
  const gList = goals || [];
  const sList = subscriptions || [];

  const currentDate = new Date();
  
  const actualMonthlyIncome = txns
    .filter(t => t.type === 'income' && isSameMonth(t.date, currentDate) && !t.isBorrowed)
    .reduce((a, t) => a + t.amount, 0);

  const monthSpend = txns.filter(t => t.type === 'expense' && isSameMonth(t.date, currentDate)).reduce((a, t) => a + t.amount, 0);

  const monthlySavings = budget?.monthlySavings || 0;
  const daysInMonth = differenceInDays(endOfMonth(currentDate), startOfMonth(currentDate)) + 1;
  const currentDay = currentDate.getDate();
  
  let calculatedMonthlyLimit = actualMonthlyIncome - monthlySavings;
  if (calculatedMonthlyLimit < 0) calculatedMonthlyLimit = 0;
  
  const dailyLimit = calculatedMonthlyLimit > 0 ? calculatedMonthlyLimit / daysInMonth : 0;
  
  const expectedSpendSoFar = currentDay * dailyLimit;
  const savedFromBudget = Math.max(0, expectedSpendSoFar - monthSpend);

  const totalSaved = monthlySavings + savedFromBudget;
  const totalGoalsAmount = gList.reduce((acc, g) => acc + g.targetAmount, 0);
  const remainingTotal = totalGoalsAmount - totalSaved;
  const totalDaysToAchieve = dailyLimit > 0 ? Math.ceil(remainingTotal / dailyLimit) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 max-w-lg mx-auto pb-6 w-full min-w-0"
    >
      <header className="flex items-center justify-between mt-1 min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight truncate">Goals & Commitments</h1>
          <p className="text-[11px] text-gray-500 dark:text-white/40 truncate">Track financial targets, fixed costs & borrowings</p>
        </div>
      </header>

      {/* FILTER TABS */}
      <div className="flex bg-gray-100 dark:bg-black/30 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-none w-full min-w-0">
        <button
          onClick={() => setPlannerTab('all')}
          className={cn(
            "flex-1 min-w-[65px] shrink-0 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap text-center",
            plannerTab === 'all' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          All
        </button>
        <button
          onClick={() => setPlannerTab('goals')}
          className={cn(
            "flex-1 min-w-[90px] shrink-0 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap text-center",
            plannerTab === 'goals' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          Goals ({gList.length})
        </button>
        <button
          onClick={() => setPlannerTab('subscriptions')}
          className={cn(
            "flex-1 min-w-[100px] shrink-0 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap text-center",
            plannerTab === 'subscriptions' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          Fixed Costs ({sList.length})
        </button>
        <button
          onClick={() => setPlannerTab('borrowed')}
          className={cn(
            "flex-1 min-w-[95px] shrink-0 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap text-center",
            plannerTab === 'borrowed' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          Borrowed ({txns.filter(t => t.isBorrowed && !t.repaid).length})
        </button>
      </div>

      {/* FIXED COSTS & BORROWED SECTION */}
      {(plannerTab === 'all' || plannerTab === 'subscriptions' || plannerTab === 'borrowed') && (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-3.5 sm:p-4 shadow-sm w-full min-w-0">
          <div className="flex justify-between items-center mb-3 min-w-0">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Fixed Costs & Dues</h2>
            <button 
              onClick={() => setShowAddSub(!showAddSub)} 
              className="shrink-0 text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/20 px-2.5 py-1 rounded-full hover:scale-105 active:scale-95 transition-all"
            >
              {showAddSub ? 'Close' : '+ Add Cost'}
            </button>
          </div>

          <AnimatePresence>
            {showAddSub && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-3">
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Quick Popular App Presets
                    </span>
                  </div>

                  {/* PRESET CHIPS */}
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
                    {POPULAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(p)}
                        className="shrink-0 text-[10px] font-bold bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 hover:border-blue-500 text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-xl transition-all whitespace-nowrap"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        placeholder="Name (e.g. Netflix, Wifi)" 
                        value={subName} 
                        onChange={e => setSubName(e.target.value)} 
                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/40 pr-9" 
                      />
                      {subName.trim() && (
                        <div className="absolute right-2">
                          <BrandLogo name={subName} size="sm" />
                        </div>
                      )}
                    </div>
                    <input type="number" placeholder="Amount (₹)" value={subAmount} onChange={e => setSubAmount(e.target.value)} className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/40" />
                    <input type="number" placeholder="Due Day (1-31)" value={subDay} onChange={e => setSubDay(e.target.value)} className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>

                  <button onClick={handleAddSub} className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2 text-xs font-bold transition-all shadow-sm">
                    Save Fixed Cost
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {sList.length === 0 && txns.filter(t => t.isBorrowed && !t.repaid).length === 0 && !showAddSub ? (
            <p className="text-xs text-gray-400 py-4 text-center">No fixed costs or active borrowed dues.</p>
          ) : (
            <div className="flex flex-col gap-2 w-full min-w-0">
              {/* Unpaid Borrowed Items */}
              {(plannerTab === 'all' || plannerTab === 'borrowed') && txns.filter(t => t.isBorrowed && !t.repaid).map(bTxn => (
                <div key={bTxn.id} className="flex justify-between items-center p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/20 gap-2.5 w-full min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <BrandLogo name={bTxn.notes || 'Borrowed'} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold flex items-center gap-1.5 text-purple-900 dark:text-purple-200 truncate">
                        <span className="truncate">{bTxn.notes || 'Borrowed Money'}</span>
                        <span className="shrink-0 text-[9px] bg-purple-200 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase font-bold">Borrowed</span>
                      </p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5 font-medium">₹{bTxn.amount.toLocaleString('en-IN')} • To Repay</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleMarkBorrowedRepaid(bTxn)}
                    className="shrink-0 p-2 rounded-full bg-emerald-500 text-white hover:scale-105 active:scale-95 transition-transform"
                    title="Mark as Repaid"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Subscriptions */}
              {(plannerTab === 'all' || plannerTab === 'subscriptions') && sList.map(sub => {
                const currentMonthStr = format(new Date(), 'yyyy-MM');
                const isPaid = sub.lastPaidMonth === currentMonthStr;
                
                return (
                  <div 
                    key={sub.id} 
                    className={cn(
                      "flex justify-between items-center p-3 rounded-2xl transition-all gap-2.5 w-full min-w-0", 
                      sub.isPaused ? "bg-gray-100 dark:bg-white/5 opacity-50" : isPaid ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20" : "bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <BrandLogo name={sub.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold flex items-center gap-1.5 truncate">
                          <span className="truncate">{sub.name}</span>
                          {sub.isPaused && <span className="shrink-0 text-[9px] bg-gray-200 dark:bg-white/20 px-1.5 py-0.5 rounded-full">Paused</span>}
                          {isPaid && <span className="shrink-0 text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full uppercase">Paid</span>}
                          {!isPaid && !sub.isPaused && <span className="shrink-0 text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full uppercase">Due</span>}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">₹{sub.amount.toLocaleString('en-IN')} • Due Day {sub.dueDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => handleTogglePause(sub)} 
                        className="p-1.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full hover:scale-105 active:scale-95 transition-transform" 
                        title={sub.isPaused ? "Resume" : "Pause"}
                      >
                        {sub.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      {!sub.isPaused && (
                        isPaid ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleMarkSubPaid(sub)} 
                            className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 transition-transform active:scale-95 shadow-sm"
                          >
                            <Check className="w-3 h-3" /> Pay
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SAVINGS GOALS SECTION */}
      {(plannerTab === 'all' || plannerTab === 'goals') && (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-3.5 sm:p-4 shadow-sm w-full min-w-0">
          <div className="flex justify-between items-center mb-3 min-w-0">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">Savings Goals</h2>
            <button 
              onClick={() => setShowAdd(true)} 
              className="shrink-0 text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/20 px-2.5 py-1 rounded-full hover:scale-105 active:scale-95 transition-all"
            >
              + New Goal
            </button>
          </div>

          <AnimatePresence>
            {showAdd && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-4 relative">
                  <button onClick={() => setShowAdd(false)} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="w-4 h-4" /></button>
                  <h3 className="font-bold text-xs mb-3">Create Savings Goal</h3>
                  <input 
                    type="text" 
                    placeholder="Goal Name (e.g. MacBook, Goa Trip)"
                    value={goalName}
                    onChange={e => setGoalName(e.target.value)}
                    className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-2.5 mb-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <input 
                    type="number" 
                    placeholder="Target Amount (₹)"
                    value={goalAmount}
                    onChange={e => setGoalAmount(e.target.value)}
                    className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-2.5 mb-3 text-xs outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                  <button onClick={handleAddGoal} className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                    Save Goal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {gList.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No goals created yet. Set a target to start tracking progress!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
              {gList.map(goal => {
                const weight = goal.targetAmount / (totalGoalsAmount || 1);
                const currentAllocated = totalSaved * weight;
                const progress = Math.min(100, (currentAllocated / goal.targetAmount) * 100);
                const remAmount = Math.max(0, goal.targetAmount - currentAllocated);
                const daysToAchieve = dailyLimit > 0 ? Math.ceil(remAmount / dailyLimit) : 0;
                
                return (
                  <div key={goal.id} className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between w-full min-w-0">
                    <div>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-1 truncate">{goal.name}</p>
                      <div className="flex justify-between items-baseline text-gray-900 dark:text-white mt-1 gap-2">
                        <h5 className="text-xl font-black shrink-0">{Math.round(progress)}%</h5>
                        <p className="text-xs text-gray-400 font-medium truncate text-right">₹{Math.round(currentAllocated).toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 font-medium italic truncate">
                      {progress < 100 && daysToAchieve > 0 ? `${daysToAchieve} zero-spend days left` : progress < 100 ? 'Needs savings' : 'Goal reached! 🎉'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Smart Summary Card */}
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 shadow-sm w-full min-w-0">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Monthly Savings</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
          Saved <strong className="text-emerald-500">₹{Math.floor(totalSaved).toLocaleString('en-IN')}</strong> this month.
          {totalDaysToAchieve > 0 && ` ~${totalDaysToAchieve} zero-spend days needed for remaining goal targets.`}
        </p>
      </div>
    </motion.div>
  );
}
