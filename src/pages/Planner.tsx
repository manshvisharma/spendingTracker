import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGoals, useTransactions, useAddGoal, useBudget, useSubscriptions, useAddSubscription, useAddTransaction, useUpdateSubscription, useUpdateTransaction } from '../hooks/useData';
import { Target, Plus, X, Repeat, Check, Pause, Play } from 'lucide-react';
import { startOfMonth, endOfMonth, differenceInDays, isSameMonth, format } from 'date-fns';
import { cn } from '../lib/utils';

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
  
  const [showAdd, setShowAdd] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');

  const [showAddSub, setShowAddSub] = useState(false);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDay, setSubDay] = useState('');

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
      className="flex flex-col gap-6"
    >
      <header className="flex items-center justify-between mt-2">
        <h1 className="text-3xl font-semibold tracking-tight">Goals & Subscriptions</h1>
      </header>

      {/* Subscriptions Section */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider">Fixed Costs</h2>
          <button onClick={() => setShowAddSub(!showAddSub)} className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/20 px-3 py-1 rounded-full">
            + Add
          </button>
        </div>

        <AnimatePresence>
          {showAddSub && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="flex gap-2 mb-2">
                <input type="text" placeholder="Name" value={subName} onChange={e => setSubName(e.target.value)} className="flex-1 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none" />
                <input type="number" placeholder="₹" value={subAmount} onChange={e => setSubAmount(e.target.value)} className="w-20 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none" />
                <input type="number" placeholder="Day" value={subDay} onChange={e => setSubDay(e.target.value)} className="w-16 bg-gray-50 dark:bg-white/5 rounded-xl p-2 text-sm outline-none" />
              </div>
              <button onClick={handleAddSub} className="w-full bg-blue-500 text-white rounded-xl py-2 text-sm font-bold">Save</button>
            </motion.div>
          )}
        </AnimatePresence>

        {sList.length === 0 && txns.filter(t => t.isBorrowed && !t.repaid).length === 0 && !showAddSub ? (
          <p className="text-xs text-gray-500">No fixed costs or unpaid borrowed dues.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Unpaid Borrowed Items */}
            {txns.filter(t => t.isBorrowed && !t.repaid).map(bTxn => (
              <div key={bTxn.id} className="flex justify-between items-center p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-500/20">
                <div>
                  <p className="text-sm font-bold flex items-center gap-2 text-purple-900 dark:text-purple-200">
                    {bTxn.notes || 'Borrowed Money'}
                    <span className="text-[10px] bg-purple-200 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full uppercase font-bold">Borrowed Due</span>
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">₹{bTxn.amount.toLocaleString('en-IN')} • To Repay</p>
                </div>
                <button 
                  onClick={() => handleMarkBorrowedRepaid(bTxn)}
                  className="p-2 rounded-full bg-emerald-500 text-white hover:scale-105 transition-transform"
                  title="Mark Borrowed Amount as Repaid"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ))}

            {sList.map(sub => {
              const currentMonthStr = format(new Date(), 'yyyy-MM');
              const isPaid = sub.lastPaidMonth === currentMonthStr;
              
              return (
                <div key={sub.id} className={cn("flex justify-between items-center p-3 rounded-2xl transition-all", sub.isPaused ? "bg-gray-100 dark:bg-white/5 opacity-50" : isPaid ? "bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20" : "bg-gray-50 dark:bg-white/10")}>
                  <div>
                    <p className="text-sm font-bold flex items-center gap-2">
                      {sub.name}
                      {sub.isPaused && <span className="text-[10px] bg-gray-200 dark:bg-white/20 px-2 py-0.5 rounded-full">Paused</span>}
                      {isPaid && <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase">Paid</span>}
                      {!isPaid && !sub.isPaused && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full uppercase">Due</span>}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">₹{sub.amount.toLocaleString('en-IN')} • Due on Day {sub.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTogglePause(sub)} className="p-2 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full hover:scale-105 transition-transform" title={sub.isPaused ? "Resume" : "Pause"}>
                      {sub.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    {!sub.isPaused && (
                      isPaid ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Paid
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleMarkSubPaid(sub)} 
                          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1 transition-transform active:scale-95"
                          title="Mark as Paid"
                        >
                          <Check className="w-3.5 h-3.5" /> Pay
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

      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider ml-4">Goals</h2>
        <button onClick={() => setShowAdd(true)} className="w-8 h-8 mr-2 bg-white dark:bg-white/10 rounded-full flex items-center justify-center text-gray-900 dark:text-white backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none hover:bg-gray-50 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none mb-4 relative">
              <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
              <h3 className="font-bold mb-4">Create New Goal</h3>
              <input 
                type="text" 
                placeholder="Goal Name (e.g. MacBook)"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <input 
                type="number" 
                placeholder="Target Amount (₹)"
                value={goalAmount}
                onChange={e => setGoalAmount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button onClick={handleAddGoal} className="w-full py-3 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-2xl font-bold">
                Save Goal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gList.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] shadow-sm dark:shadow-none">
          <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner dark:shadow-xl">
            <Target className="w-8 h-8 text-gray-400 dark:text-white/50" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Goals Yet</h3>
          <p className="text-gray-500 dark:text-white/50 text-sm">Create a savings goal for a trip, phone, or laptop and track your progress daily.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {gList.map(goal => {
            // Allocate totalSaved proportionally or just show same ratio for simplicity
            const weight = goal.targetAmount / (totalGoalsAmount || 1);
            const currentAllocated = totalSaved * weight;
            const progress = Math.min(100, (currentAllocated / goal.targetAmount) * 100);
            const remAmount = Math.max(0, goal.targetAmount - currentAllocated);
            const daysToAchieve = dailyLimit > 0 ? Math.ceil(remAmount / dailyLimit) : 0;
            
            return (
              <div key={goal.id} className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-5 shadow-sm dark:shadow-none">
                <p className="text-[10px] text-gray-500 dark:text-white/50 uppercase font-bold tracking-wider mb-2">{goal.name}</p>
                <div className="flex justify-between items-end text-gray-900 dark:text-white">
                  <h5 className="text-xl font-bold">{Math.round(progress)}%</h5>
                  <p className="text-xs text-gray-500 dark:text-white/40 pb-1">₹{Math.round(currentAllocated / 1000)}k / {(goal.targetAmount / 1000).toFixed(1)}k</p>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-orange-500 dark:text-orange-400 mt-2 font-medium italic">
                  {progress < 100 && daysToAchieve > 0 ? `${daysToAchieve} zero-spend days to go` : progress < 100 ? 'Needs more income' : 'Goal reached! 🎉'}
                </p>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Smart snippet */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none">
        <h3 className="text-[10px] font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">Total Savings Progress</h3>
        <p className="text-gray-600 dark:text-white/80 text-sm leading-relaxed">
          You have saved <strong className="text-emerald-500 dark:text-emerald-400">₹{Math.floor(totalSaved).toLocaleString('en-IN')}</strong> this month (including unused daily limits). 
          {totalDaysToAchieve > 0 && ` You need ${totalDaysToAchieve} more zero-spend days to achieve all current goals.`}
        </p>
      </div>

    </motion.div>
  );
}
