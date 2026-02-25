import React from 'react';
import { LayoutDashboard, FileText, Database, Settings, Menu, Package, Zap } from 'lucide-react';
import { cn } from './ui/shared';
import { useSimpleRouter } from '../router';
import logoImage from 'figma:asset/78ab49d21ccc1bffa018e2abc68d364aa629da45.png';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const { navigate, path } = useSimpleRouter();

  const navItems = [
    { icon: LayoutDashboard, label: '仪表盘', href: '/' },
    { icon: FileText, label: '项目管理', href: '/projects' },
    { icon: Package, label: '物料库', href: '/materials' },
    { icon: Zap, label: '工艺库', href: '/processes' },
    { icon: Settings, label: '设置', href: '/settings' },
  ];

  return (
    <div className={cn("relative flex h-screen flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950", className, collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
         {!collapsed && (
           <img 
             src={logoImage} 
             alt="Dr.aiVoss" 
             className="h-8 w-auto object-contain"
           />
         )}
         <button 
          onClick={() => setCollapsed(!collapsed)}
          className={cn("text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800", collapsed && "mx-auto")}
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => {
            const isActive = path === item.href || (item.href !== '/' && path.startsWith(item.href));
            return (
              <button
                key={index}
                onClick={() => navigate(item.href)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Footer can be added here if needed */}
    </div>
  );
}