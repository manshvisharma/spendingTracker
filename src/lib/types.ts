import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  emoji: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const TransactionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['expense', 'income']),
  categoryId: z.string().optional(), // optional for income
  categoryName: z.string().optional(),
  categoryEmoji: z.string().optional(),
  categoryColor: z.string().optional(),
  source: z.string().optional(), // for income
  notes: z.string().optional(),
  date: z.number(), // timestamp
  createdAt: z.number(),
  isBorrowed: z.boolean().optional(),
  repaid: z.boolean().optional(),
  relatedBorrowedId: z.string().optional(),
  relatedSubscriptionId: z.string().optional(),
  paidMonth: z.string().optional(),
  deletedAt: z.number().nullable().optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const SubscriptionSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string(),
  amount: z.number(),
  dueDate: z.number(),
  lastPaidMonth: z.string().optional(),
  categoryId: z.string().optional(),
  isPaused: z.boolean().optional(),
  createdAt: z.number(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const BudgetSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  monthlyIncome: z.number().optional(),
  monthlySavings: z.number().optional(),
  dailyLimit: z.number().optional(),
  weeklyLimit: z.number().optional(),
  monthlyLimit: z.number().optional(),
  paydayCycleStartDay: z.number().optional(), // e.g. 5 for 5th of every month
  enableRollover: z.boolean().optional(),
  nextPocketMoneyAmount: z.number().optional(),
  categoryLimits: z.record(z.string(), z.number()).optional(), // categoryId -> limit
});
export type Budget = z.infer<typeof BudgetSchema>;

export const GoalSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  deadline: z.number().optional(),
  type: z.enum(['trip', 'purchase', 'custom']),
  createdAt: z.number(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const defaultCategories: Category[] = [
  { id: 'c1', name: 'Food', icon: 'utensils', color: '#FF9500', emoji: '🍔' },
  { id: 'c2', name: 'Snacks', icon: 'cookie', color: '#FFCC00', emoji: '🍩' },
  { id: 'c3', name: 'Tea/Coffee', icon: 'coffee', color: '#8D6E63', emoji: '☕' },
  { id: 'c4', name: 'Travel', icon: 'train', color: '#5AC8FA', emoji: '🛵' },
  { id: 'c5', name: 'Petrol', icon: 'fuel', color: '#FF3B30', emoji: '⛽' },
  { id: 'c6', name: 'Clothes', icon: 'shirt', color: '#AF52DE', emoji: '👕' },
  { id: 'c7', name: 'Shopping', icon: 'shopping-bag', color: '#FF2D55', emoji: '🛍️' },
  { id: 'c8', name: 'Movie', icon: 'film', color: '#5856D6', emoji: '🍿' },
  { id: 'c9', name: 'Trip', icon: 'plane', color: '#007AFF', emoji: '✈️' },
  { id: 'c10', name: 'Medical', icon: 'pill', color: '#FF3B30', emoji: '💊' },
  { id: 'c11', name: 'College', icon: 'graduation-cap', color: '#4CD964', emoji: '🎓' },
  { id: 'c12', name: 'Subscriptions', icon: 'repeat', color: '#34C759', emoji: '🔄' },
  { id: 'c13', name: 'Friends', icon: 'users', color: '#FF9500', emoji: '🫂' },
  { id: 'c14', name: 'Gift', icon: 'gift', color: '#FF2D55', emoji: '🎁' },
  { id: 'c15', name: 'Miscellaneous', icon: 'box', color: '#8E8E93', emoji: '📦' },
];
