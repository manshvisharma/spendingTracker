import { useState, useEffect } from 'react';
import { Category, defaultCategories } from '../lib/types';

export function useCustomCategories(userId: string | undefined) {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!userId) return;
    const stored = localStorage.getItem(`custom_categories_${userId}`);
    if (stored) {
      setCustomCategories(JSON.parse(stored));
    }
  }, [userId]);

  const addCustomCategory = (name: string, emoji: string) => {
    if (!userId) return;
    const newCat: Category = {
      id: `custom_${Date.now()}`,
      name,
      emoji,
      icon: 'box',
      color: '#A020F0'
    };
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    localStorage.setItem(`custom_categories_${userId}`, JSON.stringify(updated));
  };

  return {
    categories: [...defaultCategories, ...customCategories],
    addCustomCategory
  };
}
