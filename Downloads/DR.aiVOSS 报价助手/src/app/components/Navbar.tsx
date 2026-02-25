import React from 'react';
import { Search, Plus, Bell, ChevronDown, LayoutGrid } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: Logo and Nav Links */}
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <LayoutGrid size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Nexus</span>
          </a>
          <div className="hidden md:flex md:items-center md:gap-6">
            <a href="#" className="text-sm font-medium text-blue-600 transition-colors dark:text-blue-400">Dashboard</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-200">Projects</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-200">Team</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-200">Reports</a>
          </div>
        </div>

        {/* Right Section: Search, Actions, Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="h-9 w-64 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <button className="flex h-9 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition-transform hover:bg-slate-800 hover:scale-105 active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500">
            <Plus size={16} />
            <span className="hidden sm:inline">New Project</span>
          </button>

          <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950"></span>
          </button>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-800">
            <button className="group flex items-center gap-2 outline-none">
              <img
                src="https://images.unsplash.com/photo-1652471943570-f3590a4e52ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbiUyMGJ1c2luZXNzfGVufDF8fHx8MTc3MDk0ODU0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="User Avatar"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white transition-all group-hover:ring-blue-500 dark:ring-slate-950"
              />
              <ChevronDown size={16} className="text-slate-400 transition-transform group-hover:text-slate-600 dark:group-hover:text-slate-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
