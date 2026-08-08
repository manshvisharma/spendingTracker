import { motion } from 'motion/react';
import { useTransactions, useBudget } from '../hooks/useData';
import { format, isToday, isThisWeek } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, User, Eye, EyeOff, AlertTriangle, Flame, ShieldAlert, Zap, Calendar, TrendingUp } from 'lucide-react';
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

  const borrowedInCycle = cycleTxns
    .filter(t => t.type === 'income' && t.isBorrowed)
    .reduce((a, t) => a + t.amount, 0);

  const cycleExpenses = cycleTxns
    .filter(t => t.type === 'expense')
    .reduce((a, t) => a + t.amount, 0);

  const allIncome = txns.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const allExpenses = txns.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = allIncome - allExpenses;

  const todaySpend = txns.filter(t => t.type === 'expense' && isToday(t.date)).reduce((a, t) => a + t.amount, 0);
  const weekSpend = txns.filter(t => t.type === 'expense' && isThisWeek(t.date)).reduce((a, t) => a + t.amount, 0);

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
      className="flex flex-col gap-4 text-xs sm:text-sm"
    >
      <header className="flex items-center justify-between mt-1 z-10">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            Total Balance
            <button onClick={togglePrivacyMode} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
              {isPrivacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-0.5 flex items-center">
            <span className="text-gray-400 dark:text-gray-500 mr-1">₹</span>
            {maskValue(balance)}
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-white/40 mt-0.5">
            Cycle: {format(paydayCycle.startDate, 'MMM d')} – {format(paydayCycle.endDate, 'MMM d')}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => navigate('/streak')} className="hidden sm:flex bg-white/70 dark:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-200 dark:border-white/10 items-center gap-1.5 shadow-sm dark:shadow-none hover:bg-white/90 dark:hover:bg-white/20 transition-colors cursor-pointer">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-medium">{noSpendInfo.currentStreak}d Streak</span>
          </button>
          <Link to="/settings" className="w-10 h-10 bg-white/70 dark:bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-gray-200 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 transition-colors shadow-sm dark:shadow-none text-gray-700 dark:text-white">
            <User className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* EMERGENCY MODE ALERT */}
      {runway.isEmergency && (
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-red-500/15 border-2 border-red-500/40 rounded-[24px] p-4 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/10 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">🔴 Low Balance / Emergency Mode</h3>
          </div>
          <p className="text-xs font-medium leading-relaxed">
            You have <span className="font-bold">{paydayCycle.daysRemaining} days</span> until your next pocket money. At your current rate, your money will run out in approximately <span className="font-bold underline">{runway.runwayDays} days</span>.
          </p>
          <div className="bg-red-500/10 dark:bg-red-500/20 p-2.5 rounded-xl flex items-center justify-between border border-red-500/20 mt-1">
            <span className="text-xs font-bold">Recommended Strict Cap:</span>
            <span className="text-sm font-black">₹{safeDailySpend}/day</span>
          </div>
        </motion.div>
      )}

      {/* QUICK ACTIONS */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-4 shadow-sm dark:shadow-none">
        <h4 className="font-bold mb-2.5 text-xs text-gray-500 dark:text-white/50 uppercase tracking-wider">Quick Actions</h4>
        <div className="grid grid-cols-4 gap-2.5">
          <button onClick={() => navigate('/add?cat=c1')} className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-[20px] p-2.5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 text-base">🍔</div>
            <span className="text-[11px] font-semibold">Food</span>
          </button>
          <button onClick={() => navigate('/add?cat=c4')} className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-[20px] p-2.5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 text-base">🛵</div>
            <span className="text-[11px] font-semibold">Travel</span>
          </button>
          <button onClick={() => navigate('/add?cat=c7')} className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-[20px] p-2.5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-500 text-base">🛍️</div>
            <span className="text-[11px] font-semibold">Shop</span>
          </button>
          <button onClick={() => navigate('/add')} className="flex flex-col items-center justify-center gap-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-[20px] p-2.5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-base">⚡</div>
            <span className="text-[11px] font-semibold">Add</span>
          </button>
        </div>
      </div>

      {/* CORE FINANCIAL ENGINE METRICS (Runway & Velocity & Pocket Money) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Money Runway Card */}
        <div className={cn(
          "border rounded-[26px] p-4 backdrop-blur-xl relative overflow-hidden transition-all",
          runway.isComfortable 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
        )}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Money Runway</span>
            <span className="text-sm">{runway.isComfortable ? '🟢 Comfortable' : '🔴 Alert'}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">~{runway.runwayDays} Days</span>
            <span className="text-[11px] opacity-80">({paydayCycle.daysRemaining} days in cycle)</span>
          </div>
          <p className="text-[11px] mt-1.5 opacity-90 font-medium">
            {runway.isComfortable 
              ? "Your current spending rate safely covers the remaining days!"
              : `At ₹${runway.avgDailySpend}/day, you're spending faster than your income.`}
          </p>
        </div>

        {/* Days Until Next Pocket Money */}
        <div className="bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-[26px] p-4 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Next Pocket Money</span>
              <Calendar className="w-3.5 h-3.5 opacity-70" />
            </div>
            <p className="text-xl font-black">₹{(budget?.nextPocketMoneyAmount || 10000).toLocaleString('en-IN')} <span className="text-xs font-normal opacity-80">in {paydayCycle.daysRemaining} days</span></p>
          </div>
          <div className="mt-2 pt-2 border-t border-indigo-500/15 flex justify-between items-center text-[11px] font-bold">
            <span>Safe Daily Allowance:</span>
            <span className="text-sm font-black">₹{safeDailySpend}</span>
          </div>
        </div>
      </div>

      {/* SPENDING VELOCITY & ROLLOVER STATUS */}
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[28px] p-4 flex flex-col gap-3 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">Spending Velocity</h3>
          </div>
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
            velocity.isFast ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          )}>
            {velocity.isFast ? '🔴 Fast Pace' : '🟢 Normal Pace'}
          </span>
        </div>
        <p className="text-xs text-gray-700 dark:text-white/80 font-medium leading-relaxed">
          {velocity.statusMessage}
        </p>

        {/* Rollover badge */}
        {rolloverInfo.isRolloverActive && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2.5 rounded-2xl flex items-center justify-between text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold">Budget Rollover Active</span>
            </div>
            <span className="text-xs font-extrabold">+₹{rolloverInfo.rolloverSavings} Carried Over</span>
          </div>
        )}
      </div>

      {/* OVERSPEND WARNING TODAY */}
      {isOverspentToday && (
        <div className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-2xl p-3 flex gap-2.5 items-start">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold">Overspent Today</p>
            <p className="text-[11px] mt-0.5">You spent ₹{todaySpend} against today's target of ₹{effectiveDailyLimit}. Pause non-essential buys tomorrow!</p>
          </div>
        </div>
      )}

      {/* NO-SPEND DAYS CALENDAR HEATMAP */}
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[28px] p-4 shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">No-Spend Days</h3>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">🔥 {noSpendInfo.noSpendCount} Days Saved <span className="text-xs font-normal text-gray-400">(Best Streak: {noSpendInfo.bestStreak}d)</span></p>
          </div>
          <button onClick={() => navigate('/streak')} className="text-xs font-bold text-blue-500 hover:underline">View Map</button>
        </div>

        {/* Mini Calendar heatmap */}
        <div className="grid grid-cols-7 gap-1.5 mt-2">
          {noSpendInfo.heatmapData.slice(-14).map((d, i) => (
            <div 
              key={i}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition-all",
                d.level === 'zero' && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
                d.level === 'low' && "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30",
                d.level === 'moderate' && "bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30",
                d.level === 'high' && "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              )}
              title={`${d.date}: ₹${d.amount}`}
            >
              <span className="opacity-60 text-[9px] uppercase">{d.dayName}</span>
              <span className="text-xs font-black">{d.dayNum}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN STATS GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 mb-1.5">
            <div className="p-1 bg-red-100 dark:bg-red-500/20 rounded-full">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Today Spend</span>
          </div>
          <p className="text-xl font-extrabold">₹{maskValue(todaySpend)}</p>
        </div>
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-4 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-1.5 text-green-500 dark:text-green-400 mb-1.5">
            <div className="p-1 bg-green-100 dark:bg-green-500/20 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Cycle Income</span>
          </div>
          <p className="text-xl font-extrabold">₹{maskValue(cycleIncome)}</p>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-5 overflow-hidden flex flex-col shadow-sm dark:shadow-none">
        <h4 className="font-bold mb-3 flex justify-between items-center text-sm">
          Recent Activity
          <Link to="/transactions" className="text-xs text-blue-500 dark:text-blue-400 font-normal hover:underline">See All</Link>
        </h4>
        <div className="flex flex-col gap-3.5">
          {txns.slice(0, 5).map((txn) => (
            <div key={txn.id} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-lg"
                >
                  {txn.categoryEmoji || '💰'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{txn.notes || txn.categoryName || 'Income'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-white/40">{format(txn.date, 'MMM d, h:mm a')}</p>
                </div>
              </div>
              <p className={cn(
                "text-xs font-bold",
                txn.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-orange-500 dark:text-orange-400'
              )}>
                {txn.type === 'income' ? '+' : '-'}₹{maskValue(txn.amount)}
              </p>
            </div>
          ))}
          {txns.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-xs">
              No transactions yet. Tap '+' to log your first expense!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
