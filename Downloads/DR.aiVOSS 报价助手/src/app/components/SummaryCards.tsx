import React from 'react';
import { DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const cards = [
  {
    title: 'Budget Spent',
    value: '$12,450',
    change: '+2.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'blue',
  },
  {
    title: 'Hours Logged',
    value: '1,240',
    change: '+12%',
    trend: 'up',
    icon: Clock,
    color: 'purple',
  },
  {
    title: 'Tasks Completed',
    value: '342',
    change: '+18%',
    trend: 'up',
    icon: CheckCircle2,
    color: 'emerald',
  },
  {
    title: 'Pending Issues',
    value: '12',
    change: '-5%',
    trend: 'down',
    icon: AlertCircle,
    color: 'amber',
  },
];

export function SummaryCards() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between">
            <div className={`rounded-xl p-3 ${
              card.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
              card.color === 'purple' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
              card.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
              'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
            }`}>
              <card.icon size={24} />
            </div>
            <span className={`flex items-center text-sm font-medium ${
              card.trend === 'up' 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : card.trend === 'down' && card.title === 'Pending Issues' // Good thing if pending issues go down
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {card.change}
            </span>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</h3>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
          </div>

          {/* Hover effect decoration */}
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-50 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-800/50"></div>
        </div>
      ))}
    </div>
  );
}
