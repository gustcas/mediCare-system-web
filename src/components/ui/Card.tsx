import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, icon, iconBg, iconColor, trend, trendUp }: StatCardProps) {
  return (
    <Card className="group" hover>
      <div className="flex items-center justify-between mb-5">
        <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
    </Card>
  );
}
