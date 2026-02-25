import React, { useState } from 'react';
import { ChevronLeft, MoreHorizontal, Settings, FileText, User, Building, TrendingUp, BarChart3, AlertCircle, Paperclip, Download, Eye, Lock } from 'lucide-react';
import { Button, Badge, Card } from '../components/ui/shared';
import { BOMView, generateMockProducts } from '../components/project/BOMView';
import { CostView } from '../components/project/CostView';
import { QuoteView } from '../components/project/QuoteView';
import { BusinessCaseView } from '../components/project/BusinessCaseView';
import { PaybackView } from '../components/project/PaybackView';
import { QuotationPaperView } from '../components/project/QuotationPaperView';
import { SalesParams, DEFAULT_SALES_PARAMS } from '../components/project/costCalc';
import { useSimpleRouter } from '../router';

// Define Types here to share
export interface MaterialItem {
  id: number;
  level: string;
  partNo: string;
  name: string;
  version: string;
  type: string;
  availability: string;
  material: string;
  qty: number;
  unit: string;
  price: number;
  priceStatus?: 'reasonable' | 'deviation' | 'abnormal';
  status: 'verified' | 'warning' | 'missing';
  remark?: string;
  supplier: string;
  aiSuggestion?: string;
}

export interface ProcessItem {
  id: number;
  opNo: string;
  name: string;
  workCenter: string;
  cycleTime: number;
  unit: string;
  mhr: number;
  status: 'verified' | 'warning' | 'missing';
  specifications?: string; // 规格要求
  price?: number; // 单价
  isExpanded?: boolean; // 展开状态
}

export interface InvestmentData {
  mold: number;
  rnd: number;
  amortization: string;
}

export interface InvestmentItem {
  id: number;
  type: 'MOLD' | 'GAUGE' | 'JIG' | 'FIXTURE';
  name: string;
  amount: number;
  supplier?: string;
  leadTime?: number; // 制作周期（天）
  // 快速计算字段
  quantity?: number; // 数量参数（点位数/功能模块数/长度/重量或体积）
  unitPrice?: number; // 单价（固定值）
  autoCalculate?: boolean; // 是否自动计算
  // 分组分摊
  amortizationGroup?: string; // 分摊组别 (如 'tooling1', 'tooling2', 'rnd')
}

export interface RnDItem {
  id: number;
  type: 'DESIGN' | 'TEST' | 'CERTIFICATION';
  name: string;
  amount: number;
  description?: string;
}

export interface AmortizationStrategy {
  mode: 'UPFRONT' | 'AMORTIZED';
  durationYears: number; // 分摊年限
  capitalInterestRate: number; // 资本利率 (如 0.06 表示 6%)
  amortizationVolume: number; // 分摊基数（件数）
}

export interface Product {
  id: string;
  name: string;
  materials: MaterialItem[];
  processes: ProcessItem[];
  investment: InvestmentData;
  investmentItems?: InvestmentItem[]; // 详细投资项
  rndItems?: RnDItem[]; // 详细研发项
  amortizationStrategy?: AmortizationStrategy; // 分摊策略
  // 产品独立的商业参数
  salesParams?: SalesParams; // 每个产品独立的商业参数
  annualVolume?: number; // 产品独立的年产量（覆盖项目级别）
  // 车型销量拆分
  vehicleVolumes?: {
    commercialVehicles?: number; // 商用车销量
    passengerCars?: number;      // 乘用车销量
  };
}

// Attachment Interface
export interface Attachment {
  id: string;
  name: string;
  type: 'inquiry' | 'bom' | 'quotation' | 'material-inquiry';
  uploadDate: string;
  size: string;
  uploadedBy: string;
}

// Project Interface (Matches Dashboard)
export interface Project {
  id: string;
  projectName: string;
  projectCode: string;
  customerName: string;
  customerCode: string;
  factoryId: string;
  annualVolume: number;
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
  owner: string;
  remarks?: string;
  targetMargin?: number;
  processRouteCode?: string; // 工艺路线编码
  createdDate: string;
}

export default function ProjectDetail() {
  const { navigate, params } = useSimpleRouter();
  const [activeTab, setActiveTab] = useState('intro');
  
  // Replaced separate materials/processes state with products array
  const [products, setProducts] = useState<Product[]>(generateMockProducts());
  const [vmConfirmed, setVmConfirmed] = useState(false); // 改为false，默认不锁定BOM
  const [salesParams, setSalesParams] = useState<SalesParams>(DEFAULT_SALES_PARAMS);
  
  const hasBOM = products.length > 0;
  const id = params.id || '1';

  // Mock Project Data
  const project: Project = {
    id: id,
    projectName: 'Brake Line Assembly V2',
    projectCode: 'AS-2026-001',
    customerName: 'Tesla Inc.',
    customerCode: 'CUST-TSL-001',
    factoryId: 'SH-01',
    annualVolume: 120000,
    status: 'in-progress',
    owner: 'Alice Chen',
    remarks: '2026年第一季度重点项目,需优化铝合金部件成本。',
    targetMargin: 15.5,
    processRouteCode: 'LINE-A-I01A02M03',
    createdDate: '2026-02-12'
  };

  // Mock Attachments Data
  const attachments: Attachment[] = [
    {
      id: 'att-001',
      name: 'Tesla_Brake_Assembly_RFQ_2026Q1.pdf',
      type: 'inquiry',
      uploadDate: '2026-02-12',
      size: '2.3 MB',
      uploadedBy: 'Alice Chen'
    },
    {
      id: 'att-002',
      name: 'Brake_Line_BOM_V2.xlsx',
      type: 'bom',
      uploadDate: '2026-02-13',
      size: '856 KB',
      uploadedBy: 'Bob Wang'
    },
    {
      id: 'att-003',
      name: 'Connector_BOM_V2.xlsx',
      type: 'bom',
      uploadDate: '2026-02-13',
      size: '634 KB',
      uploadedBy: 'Bob Wang'
    },
    {
      id: 'att-004',
      name: 'Material_Price_Inquiry_2026-02.xlsx',
      type: 'material-inquiry',
      uploadDate: '2026-02-14',
      size: '1.2 MB',
      uploadedBy: 'Carol Li'
    },
    {
      id: 'att-005',
      name: 'Aluminum_Supplier_Quote.xlsx',
      type: 'material-inquiry',
      uploadDate: '2026-02-14',
      size: '768 KB',
      uploadedBy: 'Carol Li'
    },
    {
      id: 'att-006',
      name: 'Final_Quotation_AS-2026-001.pdf',
      type: 'quotation',
      uploadDate: '2026-02-15',
      size: '1.5 MB',
      uploadedBy: 'Alice Chen'
    }
  ];

  const factoryMap: Record<string, string> = {
    'SH-01': '上海工厂 (Shanghai)',
    'DE-01': '德国工厂 (Germany)',
    'MX-01': '墨西哥工厂 (Mexico)'
  };

  const handleBOMUpload = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  // Intro Tab Component
  const IntroView = () => {
    // Get attachment type label and color
    const getAttachmentTypeInfo = (type: Attachment['type']) => {
      switch (type) {
        case 'inquiry':
          return { label: '客户询价单', color: 'bg-blue-100 text-blue-700' };
        case 'bom':
          return { label: 'BOM表', color: 'bg-purple-100 text-purple-700' };
        case 'quotation':
          return { label: '报价单', color: 'bg-green-100 text-green-700' };
        case 'material-inquiry':
          return { label: '物料询价表', color: 'bg-orange-100 text-orange-700' };
        default:
          return { label: '其他', color: 'bg-slate-100 text-slate-700' };
      }
    };

    // Parse process route code
    const parseProcessRoute = (code?: string) => {
      if (!code) return null;
      // Example: LINE-A-I01A02M03
      // LINE-A = 产线, I01 = 注塑, A02 = 装配, M03 = 机加
      const processMap: Record<string, string> = {
        'I': '注塑',
        'A': '装配',
        'M': '机加',
        'P': '喷涂',
        'W': '焊接'
      };
      
      const parts = code.split('-');
      if (parts.length < 2) return code;
      
      const productionLine = parts.slice(0, -1).join('-');
      const processSequence = parts[parts.length - 1];
      
      // Parse process sequence (e.g., I01A02M03)
      const processSteps: string[] = [];
      const regex = /([A-Z])(\d+)/g;
      let match;
      
      while ((match = regex.exec(processSequence)) !== null) {
        const processType = match[1];
        const processNumber = match[2];
        const processName = processMap[processType] || processType;
        processSteps.push(`${processName} ${processNumber}`);
      }
      
      return {
        line: productionLine,
        steps: processSteps
      };
    };

    const routeInfo = parseProcessRoute(project.processRouteCode);

    return (
      <div className="space-y-6">
        <Card className="p-6 border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <FileText className="text-blue-600" size={20} />
                 项目基本信息
              </h3>
              <Badge variant="info" className="text-sm px-3 py-1">
                 {project.status === 'in-progress' ? '进行中' : project.status}
              </Badge>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
              
              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">项目名称</label>
                 <p className="text-base font-medium text-slate-900">{project.projectName}</p>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">项目编号 (AS/AC)</label>
                 <p className="text-base font-medium text-slate-900 font-mono">{project.projectCode}</p>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">项目状态</label>
                 <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${project.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                    <span className="text-base font-medium text-slate-900 capitalize">
                       {project.status === 'in-progress' ? '进行中' : 
                        project.status === 'completed' ? '已完成' : 
                        project.status === 'draft' ? '草稿' : project.status}
                    </span>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">客户名称</label>
                 <div className="flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <p className="text-base font-medium text-slate-900">{project.customerName}</p>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">客户编号</label>
                 <p className="text-base font-medium text-slate-900 font-mono">{project.customerCode || '-'}</p>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">所属工厂</label>
                 <div className="flex items-center gap-2">
                    <Building size={16} className="text-slate-400" />
                    <p className="text-base font-medium text-slate-900">
                       {factoryMap[project.factoryId] || project.factoryId || '-'}
                    </p>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">年产量</label>
                 <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-slate-400" />
                    <p className="text-base font-medium text-slate-900">
                       {project.annualVolume.toLocaleString()} <span className="text-sm text-slate-500">件/年</span>
                    </p>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">工艺路线编码</label>
                 <p className="text-base font-medium text-slate-900 font-mono">
                    {project.processRouteCode || '-'}
                 </p>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">项目负责人</label>
                 <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {project.owner.charAt(0)}
                     </div>
                     <p className="text-base font-medium text-slate-900">{project.owner}</p>
                 </div>
              </div>

           </div>

           {/* Remarks Section */}
           <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">备注信息</label>
                 <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm text-slate-700 leading-relaxed">
                    {project.remarks || '暂无备注信息。'}
                 </div>
              </div>
           </div>
           
           <div className="mt-4 flex justify-end text-xs text-slate-400">
              创建时间: {project.createdDate} • ID: {project.id}
           </div>
        </Card>

        {/* Attachments Section */}
        <Card className="p-6 border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Paperclip className="text-blue-600" size={20} />
                 项目附件
                 <Badge variant="default" className="text-xs px-2 py-0.5">
                    {attachments.length}
                 </Badge>
              </h3>
           </div>

           {attachments.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Paperclip size={32} className="mb-2" />
                <p className="text-sm">暂无附件</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {attachments.map((attachment) => {
                  const typeInfo = getAttachmentTypeInfo(attachment.type);
                  return (
                    <div 
                      key={attachment.id}
                      className="flex flex-col p-4 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
                          <FileText size={32} className="text-slate-500" />
                        </div>
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded ${typeInfo.color} font-medium text-center mb-2`}>
                        {typeInfo.label}
                      </span>
                      
                      <p className="text-sm font-medium text-slate-900 text-center line-clamp-2 mb-3 min-h-[2.5rem]">
                        {attachment.name}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs hover:bg-blue-50 hover:text-blue-600">
                          <Eye size={14} />
                          预览
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1 gap-1 text-xs hover:bg-blue-50 hover:text-blue-600">
                          <Download size={14} />
                          下载
                        </Button>
                      </div>
                    </div>
                  );
                })}
             </div>
           )}
        </Card>
        
        {/* Quick Stats or Next Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="p-4 flex items-center gap-4 border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setActiveTab('bom')}>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                 <Settings size={20} />
              </div>
              <div>
                 <p className="text-sm font-medium text-slate-900">配置 BOM</p>
                 <p className="text-xs text-slate-500">导入或创建物料清单</p>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto text-blue-600">前往</Button>
           </Card>
           <Card className="p-4 flex items-center gap-4 border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setActiveTab('cost')}>
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                 <TrendingUp size={20} />
              </div>
              <div>
                 <p className="text-sm font-medium text-slate-900">成本核算</p>
                 <p className="text-xs text-slate-500">查看物料与工序成本</p>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto text-blue-600">前往</Button>
           </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-slate-900">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800 px-6 py-4">
         <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="-ml-2">
                 <ChevronLeft size={20} />
              </Button>
              <div className="flex-1">
                 <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{project.projectName}</h1>
                    <Badge variant="info">{project.status === 'in-progress' ? '进行中' : project.status}</Badge>
                 </div>
                 <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span>{project.customerName}</span>
                    <span>•</span>
                    <span>{project.projectCode}</span>
                 </div>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" className="gap-2">
                   <Settings size={14} /> 项目设置
                 </Button>
                 <Button variant="ghost" size="icon">
                   <MoreHorizontal size={18} />
                 </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 overflow-x-auto">
               {['intro', 'bom', 'cost', 'quote', 'business', 'investment', 'paper'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                       px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5
                       ${activeTab === tab 
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                       }
                    `}
                  >
                    {tab === 'intro' && '项目简介'}
                    {tab === 'bom' && (<>{vmConfirmed && <Lock size={12} className="text-amber-500" />}BOM管理</>)}
                    {tab === 'cost' && '成本核算'}
                    {tab === 'quote' && '报价汇总'}
                    {tab === 'business' && '商业案例'}
                    {tab === 'investment' && '投资回收'}
                    {tab === 'paper' && '报价单'}
                  </button>
               ))}
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-6">
         {activeTab === 'intro' && <IntroView />}
         {activeTab === 'bom' && (
           <BOMView 
             products={products}
             onProductsChange={setProducts}
             onUploadSuccess={handleBOMUpload}
             readOnly={vmConfirmed}
           />
         )}
         {activeTab === 'cost' && (
           <CostView
             hasBOM={hasBOM}
             products={products}
             vmConfirmed={vmConfirmed}
             onVmConfirm={() => {
               setVmConfirmed(true);
               setActiveTab('quote');
             }}
             onVmRevoke={() => setVmConfirmed(false)}
           />
         )}
         {activeTab === 'quote' && (
           <QuoteView
             products={products}
             project={project}
             vmConfirmed={vmConfirmed}
             salesParams={salesParams}
             onSalesParamsChange={setSalesParams}
             onNavigate={setActiveTab}
           />
         )}
         {activeTab === 'business' && (
           <BusinessCaseView
             products={products}
             project={project}
             vmConfirmed={vmConfirmed}
             salesParams={salesParams}
           />
         )}
         {activeTab === 'investment' && (
           <PaybackView
             products={products}
             project={project}
             vmConfirmed={vmConfirmed}
             salesParams={salesParams}
           />
         )}
         {activeTab === 'paper' && (
           <QuotationPaperView
             project={project}
             products={products}
             salesParams={salesParams}
             onSalesParamsChange={setSalesParams}
           />
         )}
      </div>
    </div>
  );
}