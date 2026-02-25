import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, TrendingUp, Users, Activity } from 'lucide-react';
import { motion } from 'motion/react';

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 5000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

export function Hero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-2xl sm:px-10 sm:py-12 md:py-16">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[100px]"></div>
        <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-purple-600/20 blur-[80px]"></div>
      </div>

      <div className="relative z-10 grid gap-8 lg:grid-cols-2 lg:gap-16">
        {/* Left Content */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              Welcome back, Alex
            </h2>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Project Overview & <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Performance Stats
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-slate-400">
              You have completed <strong>12 tasks</strong> this week. Your team is performing <strong>15% better</strong> than last month. Keep up the great work!
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Revenue</p>
                  <p className="text-lg font-semibold text-white">$45,231</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 backdrop-blur-sm border border-white/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-400">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Active Users</p>
                  <p className="text-lg font-semibold text-white">2,453</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Content: Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative rounded-2xl bg-slate-800/50 p-6 backdrop-blur-md border border-white/5"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Weekly Activity</h3>
              <p className="text-sm text-slate-400">User engagement over the last 7 days</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <ArrowUpRight size={16} />
              <span className="text-sm font-medium">+12.5%</span>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
