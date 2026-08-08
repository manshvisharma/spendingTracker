import { useState } from 'react';
import { motion } from 'motion/react';
import { useTransactions, useSubscriptions, useBudget } from '../hooks/useData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, DollarSign, PiggyBank, Download, ShieldAlert, Sparkles, Check, Calculator, BrainCircuit } from 'lucide-react';
import { detectSpendingPatterns } from '../lib/financialEngine';

export function Analytics() {
  const { data: transactions } = useTransactions();
  const { data: subscriptions } = useSubscriptions();
  const { data: budget } = useBudget();
  const txns = (transactions || []).filter(t => !t.deletedAt);
  const subs = subscriptions || [];
  
  const [currentDate, setCurrentDate] = useState(new Date());

  // Prepare weekly data for area chart
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyData = daysInWeek.map(day => {
    const amount = txns
      .filter(t => t.type === 'expense' && format(t.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
      .reduce((sum, t) => sum + t.amount, 0);
    return { name: format(day, 'EEE'), amount };
  });

  // Prepare category data for pie chart
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const monthTxns = txns.filter(t => t.date >= monthStart.getTime() && t.date <= monthEnd.getTime());
  const monthExpenses = monthTxns.filter(t => t.type === 'expense');
  const monthIncome = monthTxns.filter(t => t.type === 'income' && !t.isBorrowed).reduce((a,b)=>a+b.amount,0);
  const totalMonthExpense = monthExpenses.reduce((a,b)=>a+b.amount,0);

  // Savings calculations
  const setMonthlySavingsTarget = budget?.monthlySavings || 0;
  const unspentBudgetSavings = Math.max(0, (monthIncome > 0 ? monthIncome - setMonthlySavingsTarget : 0) - totalMonthExpense);
  const totalSavingsThisMonth = setMonthlySavingsTarget + unspentBudgetSavings;

  // Detected spending patterns
  const detectedPatterns = detectSpendingPatterns(txns);

  const handleExportCSV = () => {
    if (monthTxns.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Notes', 'Amount (INR)', 'Borrowed'];
    const rows = monthTxns.map(t => [
      format(t.date, 'yyyy-MM-dd HH:mm'),
      t.type,
      `"${t.categoryName || 'General'}"`,
      `"${t.notes || ''}"`,
      t.amount,
      t.isBorrowed ? 'Yes' : 'No'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `moneyhisab_statement_${format(currentDate, 'MMM_yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const categoryTotals = monthExpenses.reduce((acc, t) => {
    const cat = t.categoryName || 'Other';
    acc[cat] = (acc[cat] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals)
    .map(([name, value]) => {
      const txn = monthExpenses.find(t => t.categoryName === name);
      return { name, value, color: txn?.categoryColor || '#8884d8' };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const daysSoFar = differenceInDays(currentDate > monthEnd ? monthEnd : currentDate, monthStart) + 1;
  const avgDailySpend = daysSoFar > 0 ? totalMonthExpense / daysSoFar : 0;
  
  // Calculate Financial Health logic
  let healthScore = 100;
  if (monthIncome === 0 && totalMonthExpense > 0) {
    healthScore = 30; // spending without income
  } else if (monthIncome > 0) {
    const ratio = totalMonthExpense / monthIncome;
    if (ratio <= 0.3) healthScore = 98;
    else if (ratio <= 0.5) healthScore = 85;
    else if (ratio <= 0.8) healthScore = 65;
    else if (ratio <= 1.0) healthScore = 40;
    else healthScore = 15;
  }
  
  // Quick insights
  const highestCategory = pieData.length > 0 ? pieData[0] : null;
  const activeSubs = subs.filter(s => !s.isPaused);
  const totalSubsCost = activeSubs.reduce((a,b) => a + b.amount, 0);

  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const daysInTotalMonth = differenceInDays(endOfMonth(currentDate), startOfMonth(currentDate)) + 1;
  const projectedMonthSpend = Math.round(avgDailySpend * daysInTotalMonth);

  const paidSubs = activeSubs.filter(s => s.lastPaidMonth === currentMonthStr);
  const upcomingSubs = activeSubs.filter(s => s.lastPaidMonth !== currentMonthStr);
  const totalPaidSubsCost = paidSubs.reduce((a, b) => a + b.amount, 0);
  const totalUpcomingSubsCost = upcomingSubs.reduce((a, b) => a + b.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <header className="mt-2 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-full px-3 py-1.5 text-xs font-bold hover:scale-105 transition-transform"
            title="Export Monthly Statement as CSV"
          >
            <Download className="w-3.5 h-3.5" /> Statement
          </button>
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-2 py-1 shadow-sm dark:shadow-none">
            <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-semibold px-2">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}</span>
            <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* AUTOMATED SPENDING PATTERNS */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-5 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit className="w-4 h-4 text-purple-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">Automated Spending Patterns</h2>
        </div>

        {detectedPatterns.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detectedPatterns.map(pattern => (
              <div key={pattern.id} className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-2xl">{pattern.emoji}</span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">{pattern.tag}</span>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{pattern.title}</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{pattern.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-xs">
            Log more transactions to unlock automatic spending habit analysis!
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Savings Summary</h2>
              <p className="text-[11px] text-gray-500 dark:text-white/50">Your accumulated monthly savings & surplus</p>
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totalSavingsThisMonth.toLocaleString('en-IN')}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
          <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
            <p className="text-[10px] text-gray-500 dark:text-white/40 uppercase font-bold tracking-wider">Target Set</p>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">₹{setMonthlySavingsTarget.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
            <p className="text-[10px] text-gray-500 dark:text-white/40 uppercase font-bold tracking-wider">Unspent Surplus</p>
            <p className="text-base font-bold text-emerald-500 dark:text-emerald-400 mt-0.5">+₹{unspentBudgetSavings.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Financial Health Score */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[32px] p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <h2 className="text-sm font-bold text-white/90 uppercase tracking-wider mb-2 relative z-10 flex items-center gap-2">
          Financial Health
        </h2>
        <div className="flex items-end gap-3 relative z-10">
          <span className="text-5xl font-black">{healthScore}</span>
          <span className="text-white/70 font-semibold mb-2 text-xl">/ 100</span>
        </div>
        <p className="text-sm text-white/90 mt-2 relative z-10 font-medium">
          {healthScore >= 80 ? 'Excellent! You are saving a large portion of your income.' : 
           healthScore >= 60 ? 'Good! Keep your expenses in check to improve your score.' : 
           healthScore >= 40 ? 'Warning! You are spending most of your income.' : 
           'Critical! You are spending more than you earn.'}
        </p>
      </div>

      {/* CREATIVE FEATURE #1: Smart Forecast & Daily Burn Rate */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Smart Month-End Forecast</h2>
            <p className="text-[11px] text-gray-500 dark:text-white/50">Predicted totals based on your current daily spending pace</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
            <p className="text-[10px] text-gray-500 dark:text-white/40 uppercase font-bold tracking-wider">Daily Burn Rate</p>
            <p className="text-xl font-black text-gray-900 dark:text-white mt-1">₹{Math.round(avgDailySpend)}<span className="text-xs text-gray-400 font-normal">/day</span></p>
          </div>
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
            <p className="text-[10px] text-gray-500 dark:text-white/40 uppercase font-bold tracking-wider">Projected Spend</p>
            <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">₹{projectedMonthSpend.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400">
            <TrendingDown className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Spent So Far</h3>
          </div>
          <span className="text-xl font-black">₹{totalMonthExpense.toLocaleString('en-IN')}</span>
        </div>
        
        <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[28px] p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
            <DollarSign className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Fixed Costs</h3>
          </div>
          <span className="text-xl font-black">₹{totalSubsCost.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-gray-500">Active this month</span>
        </div>
      </div>

      {/* Weekly Spend Chart */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 flex-1 overflow-hidden shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-6">Weekly Spend</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(5,5,5,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(16px)' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 flex-1 overflow-hidden shadow-sm dark:shadow-none">
        <h2 className="text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-6">Top Categories</h2>
        {pieData.length > 0 ? (
          <div className="flex items-center">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 ml-6 flex flex-col gap-3">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{d.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₹{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-white/40 text-sm text-center py-4">Not enough data to show categories.</p>
        )}
      </div>

      {/* Subscriptions Tracker with Paid vs Due Status */}
      <div className="bg-white dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[32px] p-6 shadow-sm dark:shadow-none mb-8">
        <h2 className="text-sm font-bold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-4">Fixed Costs & Subscriptions</h2>
        {activeSubs.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-white/40">No active fixed costs or subscriptions.</p>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-2xl">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">Paid This Month</p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">₹{totalPaidSubsCost.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-2xl">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">Upcoming Due</p>
                <p className="text-base font-bold text-amber-700 dark:text-amber-300 mt-0.5">₹{totalUpcomingSubsCost.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {activeSubs.map(s => {
                const isPaid = s.lastPaidMonth === currentMonthStr;
                return (
                  <div key={s.id} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">🔄</div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white block">{s.name}</span>
                        <span className="text-[10px] text-gray-500 dark:text-white/40 block">Due on Day {s.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">₹{s.amount.toLocaleString('en-IN')}</span>
                      {isPaid ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          Due
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </motion.div>
  );
}
