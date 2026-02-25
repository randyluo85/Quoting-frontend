import React from 'react';
import { Card, Badge } from '../ui/shared';
import { Calendar, Briefcase, Hash } from 'lucide-react';
import { useSimpleRouter } from '../../router';

interface ProjectCardProps {
  id: string;
  asCode: string;
  projectName: string;
  clientName: string;
  status: 'draft' | 'in-progress' | 'completed';
  owner: {
    sales: string;
    vm: string;
  };
  createdDate: string;
  annualVolume: string;
}

export function ProjectCard({
  id,
  asCode,
  projectName,
  clientName,
  status,
  owner,
  createdDate,
  annualVolume,
}: ProjectCardProps) {
  const { navigate } = useSimpleRouter();

  const statusVariant = 
    status === 'completed' ? 'success' :
    status === 'in-progress' ? 'info' : 
    'secondary';
  
  const statusLabel = 
    status === 'completed' ? '已完成' :
    status === 'in-progress' ? '进行中' : 
    '草稿';

  return (
    <Card 
      className="group cursor-pointer transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900"
      onClick={() => navigate(`/projects/${id}`)}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
             <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50 mb-1">{projectName}</h3>
             <div className="flex flex-col gap-1 text-slate-500 text-sm">
                <div className="flex items-center gap-2">
                   <Briefcase size={14} />
                   <span>{clientName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                   <Hash size={14} />
                   <span>{asCode}</span>
                </div>
             </div>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Sales / VM</span>
            <span className="font-medium text-slate-900 dark:text-slate-200">{owner.sales} / {owner.vm}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">年产量</span>
            <span className="font-medium text-slate-900 dark:text-slate-200">{annualVolume}</span>
          </div>
          <div className="flex justify-between text-sm">
             <div className="flex items-center gap-1 text-slate-500">
                <Calendar size={14} />
                <span>创建日期</span>
             </div>
             <span className="text-slate-700 dark:text-slate-300">{createdDate}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
