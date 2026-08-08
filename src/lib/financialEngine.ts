import { startOfDay, endOfDay, differenceInDays, addMonths, subMonths, isWithinInterval, format, getDay, getHours } from 'date-fns';
import { Transaction, Budget } from './types';

export interface PaydayCycle {
  startDate: Date;
  endDate: Date;
  startDay: number;
  totalDays: number;
  daysPassed: number;
  daysRemaining: number;
}

/**
 * Calculates current Payday / Pocket Money cycle boundaries.
 * If paydayStartDay is provided (e.g., 5th), cycle runs from 5th of current/previous month to 4th of next month.
 * If not provided, infers from the date of the first major income in the current month, or defaults to 1st.
 */
export function getPaydayCycle(transactions: Transaction[], customStartDay?: number): PaydayCycle {
  const now = new Date();
  let startDay = customStartDay || 0;

  // Infer start day from first non-borrowed income transaction if not explicitly set
  if (!startDay) {
    const incomeTxns = transactions
      .filter(t => t.type === 'income' && !t.isBorrowed && !t.deletedAt)
      .sort((a, b) => b.amount - a.amount);
    if (incomeTxns.length > 0) {
      startDay = new Date(incomeTxns[0].date).getDate();
    } else {
      startDay = 1; // Default 1st of month
    }
  }

  // Ensure startDay is valid (1-28)
  startDay = Math.min(Math.max(1, startDay), 28);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  let startDate: Date;
  let endDate: Date;

  if (currentDay >= startDay) {
    startDate = new Date(currentYear, currentMonth, startDay, 0, 0, 0);
    const nextMonth = addMonths(startDate, 1);
    endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), startDay - 1, 23, 59, 59);
  } else {
    const prevMonth = subMonths(new Date(currentYear, currentMonth, 1), 1);
    startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), startDay, 0, 0, 0);
    endDate = new Date(currentYear, currentMonth, startDay - 1, 23, 59, 59);
  }

  const totalDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
  const daysPassed = Math.min(totalDays, Math.max(1, differenceInDays(now, startDate) + 1));
  const daysRemaining = Math.max(0, totalDays - daysPassed + 1);

  return {
    startDate,
    endDate,
    startDay,
    totalDays,
    daysPassed,
    daysRemaining
  };
}

/**
 * Calculates Money Runway (in days) based on balance and average daily spend rate.
 */
export function calculateMoneyRunway(balance: number, cycleExpenses: number, daysPassed: number, daysRemaining: number) {
  const avgDailySpend = daysPassed > 0 ? cycleExpenses / daysPassed : 0;
  
  let runwayDays = 0;
  if (avgDailySpend > 0 && balance > 0) {
    runwayDays = Math.floor(balance / avgDailySpend);
  } else if (balance > 0 && avgDailySpend === 0) {
    runwayDays = 999; // Indefinite
  }

  const isComfortable = runwayDays >= daysRemaining;
  const isEmergency = balance <= 0 || (runwayDays < daysRemaining && runwayDays <= 7) || (balance / Math.max(1, cycleExpenses + balance) < 0.15);

  return {
    avgDailySpend: Math.round(avgDailySpend),
    runwayDays,
    isComfortable,
    isEmergency,
    daysRemaining
  };
}

/**
 * Calculates Spending Velocity (% of income spent vs % of cycle elapsed).
 */
export function calculateSpendingVelocity(income: number, expenses: number, daysPassed: number, totalDays: number) {
  if (income <= 0) {
    return {
      spentPercent: 100,
      timeElapsedPercent: Math.round((daysPassed / totalDays) * 100),
      isFast: expenses > 0,
      statusMessage: expenses > 0 ? "Spending faster than income" : "No income recorded"
    };
  }

  const spentPercent = Math.round((expenses / income) * 100);
  const timeElapsedPercent = Math.round((daysPassed / totalDays) * 100);

  const isFast = spentPercent > (timeElapsedPercent + 5);
  const isSlower = spentPercent < timeElapsedPercent;

  let statusMessage = "On track with normal pace";
  if (isFast) {
    statusMessage = `You've spent ${spentPercent}% of your money in ${timeElapsedPercent}% of the cycle.`;
  } else if (isSlower) {
    statusMessage = "Currently spending slower than your normal pace.";
  }

  return {
    spentPercent,
    timeElapsedPercent,
    isFast,
    isSlower,
    statusMessage
  };
}

/**
 * Calculates No-Spend Days & Streaks for the current cycle.
 */
export function calculateNoSpendDays(transactions: Transaction[], cycle: PaydayCycle) {
  const validTxns = transactions.filter(t => !t.deletedAt && t.type === 'expense');
  
  const daysMap: Record<string, number> = {};
  
  let checkDate = new Date(cycle.startDate);
  const today = new Date();

  while (checkDate <= today && checkDate <= cycle.endDate) {
    const key = format(checkDate, 'yyyy-MM-dd');
    daysMap[key] = 0;
    checkDate.setDate(checkDate.getDate() + 1);
  }

  validTxns.forEach(t => {
    const key = format(new Date(t.date), 'yyyy-MM-dd');
    if (daysMap[key] !== undefined) {
      daysMap[key] += t.amount;
    }
  });

  const dayKeys = Object.keys(daysMap).sort();
  let noSpendCount = 0;
  let currentStreak = 0;
  let bestStreak = 0;

  dayKeys.forEach(key => {
    if (daysMap[key] === 0) {
      noSpendCount++;
      currentStreak++;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  });

  // Heatmap dataset for calendar
  const heatmapData = dayKeys.map(key => {
    const amount = daysMap[key];
    let level: 'zero' | 'low' | 'moderate' | 'high' = 'zero';
    if (amount === 0) level = 'zero';
    else if (amount <= 300) level = 'low';
    else if (amount <= 800) level = 'moderate';
    else level = 'high';

    return {
      date: key,
      dayNum: new Date(key).getDate(),
      dayName: format(new Date(key), 'EEE'),
      amount,
      level
    };
  });

  return {
    noSpendCount,
    currentStreak,
    bestStreak,
    heatmapData
  };
}

/**
 * Automatically detects spending patterns from transaction history.
 */
export function detectSpendingPatterns(transactions: Transaction[]) {
  const expenses = transactions.filter(t => !t.deletedAt && t.type === 'expense');
  if (expenses.length < 3) return [];

  const patterns: { id: string; title: string; description: string; emoji: string; tag: string }[] = [];

  // 1. Weekend vs Weekday analysis
  let weekendTotal = 0;
  let weekendCount = 0;
  let weekdayTotal = 0;
  let weekdayCount = 0;

  // Day of week analysis (0 = Sun, 6 = Sat)
  const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Night spending (> 8 PM / 20:00)
  let nightTotal = 0;
  let nightCount = 0;

  expenses.forEach(t => {
    const d = new Date(t.date);
    const day = getDay(d);
    const hour = getHours(d);

    dayOfWeekTotals[day] += t.amount;
    dayOfWeekCounts[day]++;

    if (day === 0 || day === 6) {
      weekendTotal += t.amount;
      weekendCount++;
    } else {
      weekdayTotal += t.amount;
      weekdayCount++;
    }

    if (hour >= 20 || hour < 4) {
      nightTotal += t.amount;
      nightCount++;
    }
  });

  const avgWeekend = weekendCount > 0 ? weekendTotal / Math.max(1, weekendCount / 2) : 0;
  const avgWeekday = weekdayCount > 0 ? weekdayTotal / Math.max(1, weekdayCount / 5) : 0;

  if (avgWeekend > avgWeekday * 1.25 && weekendTotal > 0) {
    const pct = Math.round(((avgWeekend - avgWeekday) / (avgWeekday || 1)) * 100);
    patterns.push({
      id: 'weekend_spike',
      title: 'Weekend Spending Spike',
      description: `You spend ~${pct}% more on weekends compared to weekdays.`,
      emoji: '🎉',
      tag: 'Weekend Pattern'
    });
  }

  // Peak day
  let maxDayIdx = 0;
  let maxDayAvg = 0;
  dayOfWeekTotals.forEach((tot, idx) => {
    const cnt = dayOfWeekCounts[idx];
    const avg = cnt > 0 ? tot / cnt : 0;
    if (avg > maxDayAvg) {
      maxDayAvg = avg;
      maxDayIdx = idx;
    }
  });

  if (maxDayAvg > 0) {
    patterns.push({
      id: 'peak_day',
      title: `Most Expensive Day: ${dayNames[maxDayIdx]}`,
      description: `You average ₹${Math.round(maxDayAvg)} on ${dayNames[maxDayIdx]}s.`,
      emoji: '📅',
      tag: 'Daily Habit'
    });
  }

  // Night spending
  if (nightCount > 0) {
    const avgNight = Math.round(nightTotal / nightCount);
    patterns.push({
      id: 'night_spend',
      title: 'Late Night Expenses',
      description: `Average spending after 8 PM is ₹${avgNight.toLocaleString('en-IN')}.`,
      emoji: '🌙',
      tag: 'Timing Insight'
    });
  }

  // Top category frequency
  const catCounts: Record<string, { name: string; emoji: string; count: number; total: number }> = {};
  expenses.forEach(t => {
    const cat = t.categoryName || 'Other';
    if (!catCounts[cat]) {
      catCounts[cat] = { name: cat, emoji: t.categoryEmoji || '🛍️', count: 0, total: 0 };
    }
    catCounts[cat].count++;
    catCounts[cat].total += t.amount;
  });

  const topCat = Object.values(catCounts).sort((a, b) => b.count - a.count)[0];
  if (topCat && topCat.count >= 3) {
    patterns.push({
      id: 'frequent_category',
      title: `Top Frequent Habit: ${topCat.name}`,
      description: `Loging ${topCat.emoji} ${topCat.name} ${topCat.count} times for a total of ₹${topCat.total.toLocaleString('en-IN')}.`,
      emoji: topCat.emoji,
      tag: 'Top Habit'
    });
  }

  return patterns;
}

/**
 * Calculates budget rollover allowance for today if enabled.
 */
export function calculateBudgetRollover(
  transactions: Transaction[],
  budget: Budget | null,
  cycle: PaydayCycle,
  calculatedMonthlyLimit: number
) {
  if (!budget?.enableRollover || calculatedMonthlyLimit <= 0) {
    return {
      rolloverSavings: 0,
      todayEffectiveLimit: calculatedMonthlyLimit > 0 ? calculatedMonthlyLimit / cycle.totalDays : 0,
      isRolloverActive: false
    };
  }

  const baseDailyLimit = calculatedMonthlyLimit / cycle.totalDays;
  const daysPassed = cycle.daysPassed;

  if (daysPassed <= 1) {
    return {
      rolloverSavings: 0,
      todayEffectiveLimit: baseDailyLimit,
      isRolloverActive: true
    };
  }

  // Expenses strictly before today in this cycle
  const todayStart = startOfDay(new Date()).getTime();
  const cycleStart = cycle.startDate.getTime();

  const pastExpensesInCycle = transactions
    .filter(t => !t.deletedAt && t.type === 'expense' && t.date >= cycleStart && t.date < todayStart)
    .reduce((a, b) => a + b.amount, 0);

  const pastDaysCount = daysPassed - 1;
  const pastBudgetExpected = pastDaysCount * baseDailyLimit;
  const rolloverSavings = Math.max(0, pastBudgetExpected - pastExpensesInCycle);

  const todayEffectiveLimit = baseDailyLimit + rolloverSavings;

  return {
    rolloverSavings: Math.round(rolloverSavings),
    todayEffectiveLimit: Math.round(todayEffectiveLimit),
    isRolloverActive: true
  };
}
