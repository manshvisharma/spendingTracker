import React from 'react';
import { 
  Tv, 
  Music, 
  Cloud, 
  Play, 
  Smartphone, 
  Wifi, 
  Zap, 
  Droplet, 
  Home, 
  Dumbbell, 
  Utensils, 
  Sparkles, 
  Code, 
  CreditCard, 
  Shield, 
  Newspaper, 
  Repeat,
  Flame,
  Globe,
  Radio,
  Gamepad2,
  Car
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface BrandInfo {
  name: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ElementType;
  badgeLabel?: string;
  logoSvg?: React.ReactNode;
}

export function getBrandInfo(name: string): BrandInfo {
  const clean = name.trim().toLowerCase();

  if (clean.includes('netflix')) {
    return {
      name: 'Netflix',
      bgClass: 'bg-[#E50914]',
      textClass: 'text-white',
      borderClass: 'border-[#E50914]/30',
      icon: Tv,
      badgeLabel: 'N',
      logoSvg: (
        <span className="font-black tracking-tighter text-sm font-sans text-white leading-none">N</span>
      )
    };
  }

  if (clean.includes('spotify')) {
    return {
      name: 'Spotify',
      bgClass: 'bg-[#1DB954]',
      textClass: 'text-black',
      borderClass: 'border-[#1DB954]/30',
      icon: Music,
    };
  }

  if (clean.includes('apple') || clean.includes('icloud') || clean.includes('apple music') || clean.includes('apple tv')) {
    return {
      name: 'Apple',
      bgClass: 'bg-black dark:bg-white/20',
      textClass: 'text-white',
      borderClass: 'border-gray-800 dark:border-white/20',
      icon: Cloud,
    };
  }

  if (clean.includes('youtube') || clean.includes('yt music')) {
    return {
      name: 'YouTube',
      bgClass: 'bg-[#FF0000]',
      textClass: 'text-white',
      borderClass: 'border-[#FF0000]/30',
      icon: Play,
    };
  }

  if (clean.includes('prime') || clean.includes('amazon')) {
    return {
      name: 'Prime Video',
      bgClass: 'bg-[#00A8E1]',
      textClass: 'text-white',
      borderClass: 'border-[#00A8E1]/30',
      icon: Tv,
    };
  }

  if (clean.includes('disney') || clean.includes('hotstar')) {
    return {
      name: 'Disney+',
      bgClass: 'bg-[#113CCF]',
      textClass: 'text-white',
      borderClass: 'border-[#113CCF]/30',
      icon: Sparkles,
    };
  }

  if (clean.includes('mobile') || clean.includes('airtel') || clean.includes('jio') || clean.includes('vi') || clean.includes('recharge') || clean.includes('phone')) {
    return {
      name: 'Mobile',
      bgClass: 'bg-purple-600',
      textClass: 'text-white',
      borderClass: 'border-purple-500/30',
      icon: Smartphone,
    };
  }

  if (clean.includes('wifi') || clean.includes('broadband') || clean.includes('fiber') || clean.includes('internet') || clean.includes('act') || clean.includes('tata play')) {
    return {
      name: 'Internet',
      bgClass: 'bg-teal-600',
      textClass: 'text-white',
      borderClass: 'border-teal-500/30',
      icon: Wifi,
    };
  }

  if (clean.includes('electricity') || clean.includes('power') || clean.includes('eb bill') || clean.includes('light')) {
    return {
      name: 'Electricity',
      bgClass: 'bg-amber-500',
      textClass: 'text-white',
      borderClass: 'border-amber-500/30',
      icon: Zap,
    };
  }

  if (clean.includes('water')) {
    return {
      name: 'Water',
      bgClass: 'bg-blue-500',
      textClass: 'text-white',
      borderClass: 'border-blue-500/30',
      icon: Droplet,
    };
  }

  if (clean.includes('rent') || clean.includes('pg') || clean.includes('flat') || clean.includes('house') || clean.includes('maintenance')) {
    return {
      name: 'Rent',
      bgClass: 'bg-rose-500',
      textClass: 'text-white',
      borderClass: 'border-rose-500/30',
      icon: Home,
    };
  }

  if (clean.includes('gym') || clean.includes('fitness') || clean.includes('cult') || clean.includes('workout') || clean.includes('yoga')) {
    return {
      name: 'Gym',
      bgClass: 'bg-emerald-600',
      textClass: 'text-white',
      borderClass: 'border-emerald-500/30',
      icon: Dumbbell,
    };
  }

  if (clean.includes('swiggy') || clean.includes('zomato') || clean.includes('food')) {
    return {
      name: 'Food',
      bgClass: 'bg-orange-500',
      textClass: 'text-white',
      borderClass: 'border-orange-500/30',
      icon: Utensils,
    };
  }

  if (clean.includes('chatgpt') || clean.includes('openai') || clean.includes('claude') || clean.includes('gemini') || clean.includes('ai')) {
    return {
      name: 'AI Subscription',
      bgClass: 'bg-indigo-600',
      textClass: 'text-white',
      borderClass: 'border-indigo-500/30',
      icon: Sparkles,
    };
  }

  if (clean.includes('github') || clean.includes('copilot') || clean.includes('hosting') || clean.includes('vercel') || clean.includes('domain')) {
    return {
      name: 'Developer',
      bgClass: 'bg-slate-800',
      textClass: 'text-white',
      borderClass: 'border-slate-700',
      icon: Code,
    };
  }

  if (clean.includes('card') || clean.includes('emi') || clean.includes('loan') || clean.includes('credit')) {
    return {
      name: 'EMI / Loan',
      bgClass: 'bg-violet-600',
      textClass: 'text-white',
      borderClass: 'border-violet-500/30',
      icon: CreditCard,
    };
  }

  if (clean.includes('insurance') || clean.includes('lic') || clean.includes('health') || clean.includes('policy')) {
    return {
      name: 'Insurance',
      bgClass: 'bg-cyan-700',
      textClass: 'text-white',
      borderClass: 'border-cyan-600/30',
      icon: Shield,
    };
  }

  if (clean.includes('news') || clean.includes('newspaper') || clean.includes('medium') || clean.includes('substack')) {
    return {
      name: 'News',
      bgClass: 'bg-stone-700',
      textClass: 'text-white',
      borderClass: 'border-stone-600/30',
      icon: Newspaper,
    };
  }

  if (clean.includes('game') || clean.includes('playstation') || clean.includes('xbox') || clean.includes('steam')) {
    return {
      name: 'Gaming',
      bgClass: 'bg-blue-700',
      textClass: 'text-white',
      borderClass: 'border-blue-600/30',
      icon: Gamepad2,
    };
  }

  if (clean.includes('car') || clean.includes('fuel') || clean.includes('petrol') || clean.includes('uber') || clean.includes('ola')) {
    return {
      name: 'Transport',
      bgClass: 'bg-amber-600',
      textClass: 'text-white',
      borderClass: 'border-amber-500/30',
      icon: Car,
    };
  }

  if (clean.includes('gas') || clean.includes('cylinder') || clean.includes('indane') || clean.includes('hp')) {
    return {
      name: 'Gas Cylinder',
      bgClass: 'bg-red-600',
      textClass: 'text-white',
      borderClass: 'border-red-500/30',
      icon: Flame,
    };
  }

  // Default fallback
  const charCode = clean ? clean.charCodeAt(0) : 0;
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500'
  ];
  const selectedBg = colors[charCode % colors.length];

  return {
    name: name || 'Subscription',
    bgClass: selectedBg,
    textClass: 'text-white',
    borderClass: 'border-white/20',
    icon: Repeat,
  };
}

export const POPULAR_PRESETS = [
  { name: 'Netflix', amount: '649', day: '5', label: '🎬 Netflix' },
  { name: 'Spotify', amount: '119', day: '10', label: '🎵 Spotify' },
  { name: 'iCloud', amount: '75', day: '1', label: '☁️ iCloud' },
  { name: 'Mobile Recharge', amount: '299', day: '15', label: '📱 Mobile' },
  { name: 'WiFi Broadband', amount: '825', day: '8', label: '📶 WiFi' },
  { name: 'Prime Video', amount: '299', day: '12', label: '🍿 Prime' },
  { name: 'Electricity Bill', amount: '1200', day: '20', label: '⚡ Electricity' },
  { name: 'Cult.fit / Gym', amount: '1500', day: '1', label: '🏋️ Gym' },
  { name: 'House Rent', amount: '12000', day: '1', label: '🏠 Rent' },
  { name: 'ChatGPT Plus', amount: '1999', day: '14', label: '✨ ChatGPT' },
];

interface BrandLogoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BrandLogo({ name, size = 'md', className }: BrandLogoProps) {
  const brand = getBrandInfo(name);
  const IconComponent = brand.icon;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs rounded-lg',
    md: 'w-8 h-8 text-sm rounded-xl',
    lg: 'w-10 h-10 text-base rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'shrink-0 flex items-center justify-center font-bold shadow-sm border transition-all',
        brand.bgClass,
        brand.textClass,
        brand.borderClass,
        sizeClasses[size],
        className
      )}
      title={brand.name}
    >
      {brand.logoSvg ? (
        brand.logoSvg
      ) : (
        <IconComponent className={iconSizes[size]} />
      )}
    </div>
  );
}
