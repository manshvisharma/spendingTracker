import { useState } from 'react';
import { motion } from 'motion/react';
import { useTransactions, useBudget } from '../hooks/useData';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, differenceInDays } from 'date-fns';
import { cn } from '../lib/utils';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Streak() {
  const { data: transactions } = useTransactions();
  const { data: budget } = useBudget();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const txns = (transactions || []).filter(t => !t.deletedAt);
  
  const actualMonthlyIncome = txns
    .filter(t => t.type === 'income' && isSameMonth(t.date, currentDate) && !t.isBorrowed)
    .reduce((a, t) => a + t.amount, 0);

  const monthlySavings = budget?.monthlySavings || 0;
  const daysInMonth = differenceInDays(endOfMonth(currentDate), startOfMonth(currentDate)) + 1;
  
  let calculatedMonthlyLimit = actualMonthlyIncome - monthlySavings;
  if (calculatedMonthlyLimit < 0) calculatedMonthlyLimit = 0;
  
  const dailyLimit = calculatedMonthlyLimit > 0 ? calculatedMonthlyLimit / daysInMonth : 0;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate stats
  let currentStreak = 0;
  let longestStreak = 0;
  
  // Create a map of date (yyyy-MM-dd) to spend amount
  const spendByDate = new Map<string, number>();
  txns.forEach(txn => {
    if (txn.type === 'expense') {
      const dateStr = format(txn.date, 'yyyy-MM-dd');
      spendByDate.set(dateStr, (spendByDate.get(dateStr) || 0) + txn.amount);
    }
  });

  // Calculate streaks (zero spend days)
  let firstTxnDate = new Date();
  if (txns.length > 0) {
    // txns is sorted descending by date, so the last one is the oldest
    firstTxnDate = new Date(txns[txns.length - 1].date);
  } else {
    firstTxnDate = startOfMonth(new Date());
  }
  
  // ensure firstTxnDate is not in the future compared to today
  if (firstTxnDate > new Date()) firstTxnDate = new Date();

  const allDays = eachDayOfInterval({ start: firstTxnDate, end: new Date() });
  let tempStreak = 0;
  allDays.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const spent = spendByDate.get(dateStr) || 0;
    if (spent === 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });
  
  // Calculate current streak backward from today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  let checkDate = new Date();
  while (true) {
    const dStr = format(checkDate, 'yyyy-MM-dd');
    const spent = spendByDate.get(dStr) || 0;
    if (spent === 0 && dStr <= todayStr) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-6 h-full"
    >
      <header className="flex items-center gap-4 mt-2">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Spending Streak</h1>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-[32px] p-6 text-white shadow-lg shadow-pink-500/20">
          <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2">Current Streak</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{currentStreak}</span>
            <span className="text-sm font-medium mb-1">days</span>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none">
          <p className="text-gray-500 dark:text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Longest Streak</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{longestStreak}</span>
            <span className="text-sm font-medium mb-1 text-gray-400">days</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const prev = new Date(currentDate);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentDate(prev);
              }}
              className="text-sm px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full"
            >
              Prev
            </button>
            <button 
              onClick={() => {
                const next = new Date(currentDate);
                next.setMonth(next.getMonth() + 1);
                setCurrentDate(next);
              }}
              className="text-sm px-3 py-1 bg-gray-100 dark:bg-white/10 rounded-full"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400 uppercase">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Empty days for offset */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const spent = spendByDate.get(dateStr) || 0;
            const isZero = spent === 0 && day <= new Date();
            const isOver = dailyLimit > 0 && spent > dailyLimit;
            const isUnder = dailyLimit > 0 && spent > 0 && spent <= dailyLimit;
            
            return (
              <div 
                key={dateStr}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center p-1 border",
                  isZero ? "bg-orange-100 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400" :
                  isOver ? "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400" :
                  isUnder ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400" :
                  "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400"
                )}
              >
                <span className="text-xs font-bold">{format(day, 'd')}</span>
                {isZero && day <= new Date() && <Trophy className="w-3 h-3 mt-1" />}
                {!isZero && spent > 0 && (
                  <span className="text-[8px] font-bold mt-1 truncate w-full text-center px-0.5">
                    {spent >= 1000 ? `${(spent/1000).toFixed(1)}k` : spent}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
