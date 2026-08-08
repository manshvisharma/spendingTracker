import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTransactions, useSubscriptions, useBudget } from '../hooks/useData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, BrainCircuit, Sparkles, Compass, PieChart as PieIcon } from 'lucide-react';
import { detectSpendingPatterns } from '../lib/financialEngine';
import { cn } from '../lib/utils';

export function Analytics() {
  const { data: transactions } = useTransactions();
  const { data: subscriptions } = useSubscriptions();
  const { data: budget } = useBudget();

  const txns = (transactions || []).filter(t => !t.deletedAt);
  const subs = subscriptions || [];
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'habits' | 'simulator'>('overview');

  // Impact Simulator state
  const [simCost, setSimCost] = useState('');

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
  
  const activeSubs = subs.filter(s => !s.isPaused);
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  const paidSubs = activeSubs.filter(s => s.lastPaidMonth === currentMonthStr);
  const upcomingSubs = activeSubs.filter(s => s.lastPaidMonth !== currentMonthStr);
  const totalPaidSubsCost = paidSubs.reduce((a, b) => a + b.amount, 0);
  const totalUpcomingSubsCost = upcomingSubs.reduce((a, b) => a + b.amount, 0);

  // Impact Simulator Calculation
  const simExpense = Number(simCost) || 0;
  const daysOfRunwayLost = avgDailySpend > 0 ? Math.round(simExpense / avgDailySpend) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-4 max-w-lg mx-auto pb-6 w-full min-w-0"
    >
      <header className="mt-1 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight truncate">Insights & Analytics</h1>
          <p className="text-[11px] text-gray-500 dark:text-white/40 truncate">Financial health & spending patterns</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="shrink-0 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-full px-3 py-1.5 text-xs font-bold hover:scale-105 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Statement</span>
        </button>
      </header>

      {/* ORGANIZED NAVIGATION TABS */}
      <div className="flex bg-gray-100 dark:bg-black/30 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-none w-full min-w-0">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex-1 min-w-[85px] shrink-0 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
            activeTab === 'overview' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('breakdown')}
          className={cn(
            "flex-1 min-w-[95px] shrink-0 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
            activeTab === 'breakdown' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <PieIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span>Breakdown</span>
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={cn(
            "flex-1 min-w-[80px] shrink-0 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
            activeTab === 'habits' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <BrainCircuit className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Habits</span>
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={cn(
            "flex-1 min-w-[80px] shrink-0 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
            activeTab === 'simulator' ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Impact</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: OVERVIEW & HEALTH */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3.5 w-full min-w-0">
            {/* Financial Health Score Gauge */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden w-full">
              <div className="flex justify-between items-start relative z-10 gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-200">Financial Health Score</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black">{healthScore}</span>
                    <span className="text-emerald-200 text-xs sm:text-sm font-bold">/ 100</span>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0">
                  {healthScore >= 80 ? '🌟 Wealth Saver' : healthScore >= 60 ? '👍 Steady' : '⚠️ Alert'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-2 font-medium">
                {healthScore >= 80 ? 'Great job! Your spending is well within budget limits.' : 'Keep a tight cap on daily spends to improve your score before next payday.'}
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Monthly Spend</p>
                <p className="text-base sm:text-lg font-black text-rose-500 mt-0.5 truncate">₹{totalMonthExpense.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Avg ₹{Math.round(avgDailySpend)}/day</p>
              </div>

              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-3 sm:p-3.5 min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Savings Surplus</p>
                <p className="text-base sm:text-lg font-black text-emerald-500 mt-0.5 truncate">₹{totalSavingsThisMonth.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-gray-400 mt-1 truncate">Target ₹{setMonthlySavingsTarget}</p>
              </div>
            </div>

            {/* Weekly Trend Chart */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 shadow-sm w-full min-w-0">
              <div className="flex justify-between items-center mb-3 gap-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 truncate">Weekly Spend Trend</h3>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 shrink-0">
                  <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <span className="font-semibold px-1 text-[10px] sm:text-[11px]">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}</span>
                  <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="h-36 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: BREAKDOWN & CATEGORIES */}
        {activeTab === 'breakdown' && (
          <motion.div key="breakdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3.5 w-full min-w-0">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 shadow-sm w-full min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Top Category Share</h3>
              {pieData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full min-w-0">
                  <div className="w-28 h-28 shrink-0 mx-auto sm:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={4} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs w-full">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{d.name}</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white shrink-0">₹{d.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">Log more expenses to see category breakdown!</p>
              )}
            </div>

            {/* Fixed Costs Breakdown */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 shadow-sm w-full min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Fixed Costs & Subscriptions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-1">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Paid This Month</span>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">₹{totalPaidSubsCost.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Upcoming Due</span>
                  <p className="text-sm font-black text-amber-700 dark:text-amber-400 mt-0.5">₹{totalUpcomingSubsCost.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SPENDING HABITS & PATTERNS */}
        {activeTab === 'habits' && (
          <motion.div key="habits" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3.5 w-full min-w-0">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 shadow-sm w-full min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4 text-purple-500 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Automated Spending Habits</h3>
              </div>

              {detectedPatterns.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {detectedPatterns.map(pattern => (
                    <div key={pattern.id} className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-3 rounded-2xl flex items-start gap-3 w-full min-w-0">
                      <span className="text-xl shrink-0">{pattern.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">{pattern.tag}</span>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate">{pattern.title}</h4>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">{pattern.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  Log a few more transactions to auto-detect spending habits!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: EXPENSE RUNWAY IMPACT SIMULATOR */}
        {activeTab === 'simulator' && (
          <motion.div key="simulator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3.5 w-full min-w-0">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 shadow-sm w-full min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white truncate">Runway Impact Simulator</h3>
                  <p className="text-[10px] text-gray-400 truncate">Test how a big purchase affects your budget</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2 w-full">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Potential Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={simCost}
                    onChange={(e) => setSimCost(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {simExpense > 0 && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 flex flex-col gap-1.5 w-full">
                    <div className="flex items-center justify-between text-rose-800 dark:text-rose-300">
                      <span className="text-xs font-bold">Runway Reduced By:</span>
                      <span className="text-lg font-black">~{daysOfRunwayLost} Days</span>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300/80 leading-relaxed font-medium">
                      Buying this item will consume ~{daysOfRunwayLost} days of your average daily budget. Think twice if payday is far away!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
