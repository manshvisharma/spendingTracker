import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTransactions, useBudget } from '../hooks/useData';
import { format, isToday, isThisWeek } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, User, Eye, EyeOff, AlertTriangle, Flame, ShieldAlert, Zap, Calendar, TrendingUp, Compass, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { usePrivacy } from '../contexts/PrivacyContext';
import { 
  getPaydayCycle, 
  calculateMoneyRunway, 
  calculateSpendingVelocity, 
  calculateNoSpendDays, 
  calculateBudgetRollover 
} from '../lib/financialEngine';

export function Dashboard() {
  const { data: transactions } = useTransactions();
  const { data: budget } = useBudget();
  const navigate = useNavigate();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  const [activeTab, setActiveTab] = useState<'runway' | 'velocity' | 'nospend'>('runway');

  const txns = (transactions || []).filter(t => !t.deletedAt);
  
  // Payday Cycle calculations
  const paydayCycle = getPaydayCycle(txns, budget?.paydayCycleStartDay);
  
  // Filter transactions in current Payday cycle
  const cycleTxns = txns.filter(t => {
    const d = new Date(t.date);
    return d >= paydayCycle.startDate && d <= paydayCycle.endDate;
  });

  const cycleIncome = cycleTxns
    .filter(t => t.type === 'income' && !t.isBorrowed)
    .reduce((a, t) => a + t.amount, 0);

  const cycleExpenses = cycleTxns
    .filter(t => t.type === 'expense')
    .reduce((a, t) => a + t.amount, 0);

  const allIncome = txns.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const allExpenses = txns.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = allIncome - allExpenses;

  const todaySpend = txns.filter(t => t.type === 'expense' && isToday(t.date)).reduce((a, t) => a + t.amount, 0);

  const monthlySavings = budget?.monthlySavings || 0;
  
  // Dynamic monthly limit
  const baseMonthlyIncome = cycleIncome > 0 ? cycleIncome : (budget?.nextPocketMoneyAmount || 10000);
  let calculatedMonthlyLimit = Math.max(0, baseMonthlyIncome - monthlySavings);

  // Financial Engine Metrics
  const runway = calculateMoneyRunway(balance, cycleExpenses, paydayCycle.daysPassed, paydayCycle.daysRemaining);
  const velocity = calculateSpendingVelocity(baseMonthlyIncome, cycleExpenses, paydayCycle.daysPassed, paydayCycle.totalDays);
  const noSpendInfo = calculateNoSpendDays(txns, paydayCycle);
  const rolloverInfo = calculateBudgetRollover(txns, budget || null, paydayCycle, calculatedMonthlyLimit);

  // Daily budget calculations
  const baseDailyLimit = calculatedMonthlyLimit > 0 ? calculatedMonthlyLimit / paydayCycle.totalDays : 0;
  const effectiveDailyLimit = rolloverInfo.isRolloverActive ? rolloverInfo.todayEffectiveLimit : baseDailyLimit;
  
  const safeDailySpend = paydayCycle.daysRemaining > 0 ? Math.max(0, Math.floor(balance / paydayCycle.daysRemaining)) : 0;
  const isOverspentToday = todaySpend > effectiveDailyLimit && effectiveDailyLimit > 0;

  const maskValue = (value: number | string) => isPrivacyMode ? '****' : value.toLocaleString('en-IN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3.5 text-xs sm:text-sm max-w-lg mx-auto pb-6"
    >
      {/* HEADER */}
      <header className="flex items-center justify-between pt-1 z-10">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
            Total Balance
            <button onClick={togglePrivacyMode} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight mt-0.5 flex items-center">
            <span className="text-gray-400 dark:text-gray-500 mr-1 text-2xl font-normal">₹</span>
            {maskValue(balance)}
          </h1>
          <p className="text-[10px] font-medium text-gray-500 dark:text-white/40 mt-0.5">
            Cycle: {format(paydayCycle.startDate, 'MMM d')} – {format(paydayCycle.endDate, 'MMM d')}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => navigate('/streak')} className="flex bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full border border-orange-500/20 items-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all">
            <Flame className="w-3.5 h-3.5 fill-orange-500" />
            <span className="text-[11px] font-bold">{noSpendInfo.currentStreak}d Streak</span>
          </button>
          <Link to="/settings" className="w-9 h-9 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-700 dark:text-white">
            <User className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* EMERGENCY MODE ALERT */}
      {runway.isEmergency && (
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-rose-500/15 border border-rose-500/40 rounded-2xl p-3.5 text-rose-600 dark:text-rose-400 shadow-md flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="font-extrabold text-xs uppercase tracking-wider">🔴 Low Balance / Emergency Mode</h3>
          </div>
          <p className="text-[11px] font-medium leading-tight">
            You have <span className="font-bold">{paydayCycle.daysRemaining} days</span> left in cycle. Money runs out in ~<span className="font-bold underline">{runway.runwayDays} days</span>.
          </p>
          <div className="bg-rose-500/10 p-2 rounded-xl flex items-center justify-between border border-rose-500/20 text-xs">
            <span className="font-bold">Strict Daily Cap:</span>
            <span className="font-black">₹{safeDailySpend}/day</span>
          </div>
        </motion.div>
      )}

      {/* OVERSPEND WARNING TODAY */}
      {isOverspentToday && (
        <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-2xl p-3 flex gap-2 items-center">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <p className="text-xs font-medium">Overspent today (Spent ₹{todaySpend} / Limit ₹{effectiveDailyLimit}). Go light tomorrow!</p>
        </div>
      )}

      {/* COMPACT STATS GRID */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Today</span>
          <p className="text-base font-extrabold text-rose-500 mt-1">₹{maskValue(todaySpend)}</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Safe/Day</span>
          <p className="text-base font-extrabold text-emerald-500 mt-1">₹{maskValue(safeDailySpend)}</p>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Cycle Income</span>
          <p className="text-base font-extrabold text-blue-500 mt-1">₹{maskValue(cycleIncome)}</p>
        </div>
      </div>

      {/* TABBED FINANCIAL ENGINE INSIGHTS */}
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-3.5 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 dark:bg-black/30 p-1 rounded-2xl gap-1 mb-3">
          <button
            onClick={() => setActiveTab('runway')}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1",
              activeTab === 'runway' 
                ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            <span>Runway</span>
          </button>
          <button
            onClick={() => setActiveTab('velocity')}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1",
              activeTab === 'velocity' 
                ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Velocity</span>
          </button>
          <button
            onClick={() => setActiveTab('nospend')}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1",
              activeTab === 'nospend' 
                ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>No-Spend</span>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'runway' && (
            <motion.div key="runway" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Money Runway</span>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-0.5">
                    ~{runway.runwayDays} Days Left
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider",
                  runway.isComfortable ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600" : "bg-rose-100 dark:bg-rose-500/20 text-rose-600"
                )}>
                  {runway.isComfortable ? '🟢 Comfortable' : '🔴 Alert'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-white/70 font-medium">
                {runway.isComfortable 
                  ? `At your current ₹${runway.avgDailySpend}/day pace, your balance easily lasts the remaining ${paydayCycle.daysRemaining} days of this cycle.` 
                  : `You're spending ₹${runway.avgDailySpend}/day. Adjust to ₹${safeDailySpend}/day to reach payday on day ${paydayCycle.daysRemaining}.`}
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-2xl flex items-center justify-between text-indigo-900 dark:text-indigo-300">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-bold">Next Pocket Money:</span>
                </div>
                <span className="text-xs font-extrabold">₹{(budget?.nextPocketMoneyAmount || 10000).toLocaleString('en-IN')} in {paydayCycle.daysRemaining}d</span>
              </div>
            </motion.div>
          )}

          {activeTab === 'velocity' && (
            <motion.div key="velocity" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Spending Pace</span>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">
                    {velocity.spentPercent}% Spent in {velocity.timeElapsedPercent}% of Month
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider",
                  velocity.isFast ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600" : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600"
                )}>
                  {velocity.isFast ? '🔴 Fast Pace' : '🟢 Normal Pace'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-white/70 font-medium leading-relaxed">
                {velocity.statusMessage}
              </p>
              {rolloverInfo.isRolloverActive && (
                <div className="bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-2xl flex items-center justify-between text-amber-900 dark:text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold">Rollover Allowance:</span>
                  </div>
                  <span className="text-xs font-extrabold">+₹{rolloverInfo.rolloverSavings} Carried Over</span>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'nospend' && (
            <motion.div key="nospend" initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-900 dark:text-white">🔥 {noSpendInfo.noSpendCount} No-Spend Days Saved</span>
                <button onClick={() => navigate('/streak')} className="text-[11px] font-bold text-blue-500 hover:underline">Full Map &rarr;</button>
              </div>
              <div className="grid grid-cols-7 gap-1 mt-1">
                {noSpendInfo.heatmapData.slice(-14).map((d, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "flex flex-col items-center justify-center p-1 rounded-xl text-[9px] font-bold",
                      d.level === 'zero' && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                      d.level === 'low' && "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30",
                      d.level === 'moderate' && "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30",
                      d.level === 'high' && "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    )}
                    title={`${d.date}: ₹${d.amount}`}
                  >
                    <span className="opacity-60 text-[8px] uppercase">{d.dayName}</span>
                    <span className="text-[10px] font-black">{d.dayNum}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK ACTIONS */}
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 shadow-sm">
        <h4 className="font-bold mb-2 text-[10px] text-gray-400 uppercase tracking-wider">Quick Log</h4>
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => navigate('/add?cat=c1')} className="flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl p-2 transition-colors">
            <span className="text-sm">🍔</span>
            <span className="text-xs font-semibold">Food</span>
          </button>
          <button onClick={() => navigate('/add?cat=c4')} className="flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl p-2 transition-colors">
            <span className="text-sm">🛵</span>
            <span className="text-xs font-semibold">Travel</span>
          </button>
          <button onClick={() => navigate('/add?cat=c7')} className="flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl p-2 transition-colors">
            <span className="text-sm">🛍️</span>
            <span className="text-xs font-semibold">Shop</span>
          </button>
          <button onClick={() => navigate('/add')} className="flex items-center justify-center gap-1.5 bg-blue-600 text-white rounded-xl p-2 font-bold text-xs hover:bg-blue-500 transition-colors shadow-sm">
            <span>⚡</span>
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-2.5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Recent Activity</h4>
          <Link to="/transactions" className="text-xs text-blue-500 font-bold hover:underline">View All</Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {txns.slice(0, 5).map((txn) => (
            <div key={txn.id} className="flex items-center justify-between p-1 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-sm">
                  {txn.categoryEmoji || '💰'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{txn.notes || txn.categoryName || 'Income'}</p>
                  <p className="text-[10px] text-gray-400">{format(txn.date, 'MMM d, h:mm a')}</p>
                </div>
              </div>
              <p className={cn(
                "text-xs font-bold",
                txn.type === 'income' ? 'text-emerald-500' : 'text-gray-900 dark:text-white'
              )}>
                {txn.type === 'income' ? '+' : '-'}₹{maskValue(txn.amount)}
              </p>
            </div>
          ))}
          {txns.length === 0 && (
            <div className="text-center py-5 text-gray-400 text-xs">
              No transactions logged yet. Tap 'Add' above!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

