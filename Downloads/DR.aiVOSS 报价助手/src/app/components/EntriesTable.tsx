import React from 'react';
import { MoreHorizontal, Calendar, ArrowRight } from 'lucide-react';

const entries = [
  {
    id: 1,
    name: 'Website Redesign',
    client: 'Acme Corp',
    status: 'In Progress',
    progress: 75,
    dueDate: 'Oct 24, 2023',
    team: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64',
    ],
  },
  {
    id: 2,
    name: 'Mobile App Development',
    client: 'TechStart Inc',
    status: 'Completed',
    progress: 100,
    dueDate: 'Sep 12, 2023',
    team: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&h=64',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64',
    ],
  },
  {
    id: 3,
    name: 'Marketing Campaign',
    client: 'Global Retail',
    status: 'At Risk',
    progress: 45,
    dueDate: 'Nov 01, 2023',
    team: [
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=64&h=64',
    ],
  },
  {
    id: 4,
    name: 'Dashboard Analytics',
    client: 'DataFlow Systems',
    status: 'In Progress',
    progress: 60,
    dueDate: 'Oct 30, 2023',
    team: [
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=64&h=64',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&h=64',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=64&h=64',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=64&h=64',
    ],
  },
  {
    id: 5,
    name: 'Internal Audit',
    client: 'FinCorp',
    status: 'Pending',
    progress: 10,
    dueDate: 'Dec 15, 2023',
    team: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64',
    ],
  },
];

export function EntriesTable() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Projects</h3>
        <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          View All <ArrowRight size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
            <tr>
              <th className="px-6 py-3 font-semibold">Project Name</th>
              <th className="px-6 py-3 font-semibold">Client</th>
              <th className="px-6 py-3 font-semibold">Team</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Progress</th>
              <th className="px-6 py-3 font-semibold">Due Date</th>
              <th className="px-6 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  {entry.name}
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                  {entry.client}
                </td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-2">
                    {entry.team.map((avatar, i) => (
                      <img
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-white object-cover ring-2 ring-transparent transition-transform hover:z-10 hover:scale-110 dark:border-slate-900"
                        src={avatar}
                        alt="Team member"
                      />
                    ))}
                    {entry.team.length > 3 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-medium text-slate-500 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-400">
                        +2
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    entry.status === 'In Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    entry.status === 'At Risk' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {entry.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-1.5 rounded-full ${
                          entry.progress === 100 ? 'bg-emerald-500' :
                          entry.progress > 50 ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`}
                        style={{ width: `${entry.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{entry.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {entry.dueDate}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
