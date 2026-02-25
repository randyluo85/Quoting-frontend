import React, { useState, useRef } from 'react';
import { Upload, FileUp, Mail, FileSpreadsheet, X, Sparkles, CornerDownRight, ThumbsUp, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Plus, Box, Settings, TrendingUp, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Input } from '../ui/shared';
import { MaterialItem, ProcessItem, Product, InvestmentItem, RnDItem, AmortizationStrategy } from '../../pages/ProjectDetail';
import { InvestmentTabContent } from './InvestmentTabContent';
import { DEFAULT_SALES_PARAMS, SalesParams } from './costCalc';

// Mock Data Generators
export const generateMockProducts = (): Product[] => [
  {
    id: 'LAD-20040021',
    name: 'High Pressure Brake Line',
    annualVolume: 72000, // 产品独立年产量
    vehicleVolumes: {
      commercialVehicles: 28800, // 商用车 40%
      passengerCars: 43200,      // 乘用车 60%
    },
    salesParams: {
      ...DEFAULT_SALES_PARAMS,
      quotedPrice: 68.50,
      targetMargin: 26.0,
      annualReductionRate: 3.0,
      amortizationGroups: [
        { id: 'tooling1', name: 'Tooling 1', years: 2, volume: 80000, color: 'blue' },
        { id: 'tooling2', name: 'Tooling 2', years: 3, volume: 120000, color: 'purple' },
        { id: 'rnd', name: 'R&D', years: 2, volume: 80000, color: 'emerald' },
      ],
    },
    investment: { mold: 850000, rnd: 150000, amortization: '按件摊销 (全生命周期)' },
    materials: [
      { 
        id: 1, 
        level: '1', 
        partNo: 'AL-6061-T6', 
        name: '铝合金管', 
        version: '1.2', 
        type: '外购', 
        availability: 'Y',
        material: '铝合金 6061', 
        qty: 0.65, 
        unit: 'kg', 
        price: 24.50,
        priceStatus: 'reasonable',
        status: 'verified', 
        supplier: '西南铝业', 
        remark: 'OD 12mm x 1.5mm'
      },
      { 
        id: 2, 
        level: '2', 
        partNo: 'FIT-STEEL-01', 
        name: '钢制接头', 
        version: '2.0', 
        type: '自制', 
        availability: 'Y',
        material: '碳钢 Q235', 
        qty: 2, 
        unit: '个', 
        price: 6.80,
        priceStatus: 'reasonable', 
        status: 'verified', 
        supplier: '精密机加车间', 
        remark: '镀锌镍合金'
      },
      { 
        id: 3, 
        level: '2', 
        partNo: 'BRACKET-05', 
        name: '安装支架', 
        version: '1.0', 
        type: '外购', 
        availability: 'Y',
        material: 'PA66-GF30', 
        qty: 3, 
        unit: '个', 
        price: 1.50,
        priceStatus: 'reasonable', 
        status: 'verified', 
        supplier: '工程塑料件厂', 
        remark: '注塑件'
      },
      { 
        id: 4, 
        level: '3', 
        partNo: 'SEAL-NBR-12', 
        name: 'O型密封圈', 
        version: '1.0', 
        type: '外购', 
        availability: 'Y',
        material: 'NBR 70', 
        qty: 2, 
        unit: '个', 
        price: 0.85,
        priceStatus: 'reasonable', 
        status: 'verified', 
        supplier: '密封件专家', 
        remark: '邵氏硬度70'
      },
    ],
    processes: [
       { 
         id: 1, 
         opNo: 'M01', 
         name: '下料切割', 
         workCenter: 'WC-CUT-01', 
         cycleTime: 45, 
         unit: 's', 
         mhr: 65.00, 
         status: 'verified',
         specifications: '长度公差±0.5mm',
         price: 65.00,
         isExpanded: false
       },
       { 
         id: 2, 
         opNo: 'M05', 
         name: '管端成型', 
         workCenter: 'WC-FORM-01', 
         cycleTime: 60, 
         unit: 's', 
         mhr: 85.00, 
         status: 'verified',
         specifications: '扩口成型，无裂纹',
         price: 85.00,
         isExpanded: false
       },
       { 
         id: 3, 
         opNo: 'M10', 
         name: '数控弯管', 
         workCenter: 'WC-BEND-01', 
         cycleTime: 90, 
         unit: 's', 
         mhr: 95.00, 
         status: 'verified',
         specifications: 'XYZ坐标点检测',
         price: 95.00,
         isExpanded: false
       },
       { 
         id: 4, 
         opNo: 'W01', 
         name: '感应钎焊', 
         workCenter: 'WC-WELD-01', 
         cycleTime: 75, 
         unit: 's', 
         mhr: 110.00, 
         status: 'verified',
         specifications: '焊缝饱满，无气孔',
         price: 110.00,
         isExpanded: false
       },
       { 
         id: 5, 
         opNo: 'A01', 
         name: '附件装配', 
         workCenter: 'WC-ASM-01', 
         cycleTime: 100, 
         unit: 's', 
         mhr: 55.00, 
         status: 'verified',
         specifications: '安装支架和保护套',
         price: 55.00,
         isExpanded: false
       },
       { 
         id: 6, 
         opNo: 'T01', 
         name: '氦气检漏', 
         workCenter: 'WC-TEST-01', 
         cycleTime: 50, 
         unit: 's', 
         mhr: 75.00, 
         status: 'verified',
         specifications: '泄漏率 < 1.0E-5 mbar.l/s',
         price: 75.00,
         isExpanded: false
       },
    ]
  }
];

// Mock database for checking material existence
const MOCK_DATABASE_MATERIALS = ['A356-T6', '40Cr'];

interface BOMViewProps {
  products: Product[];
  onProductsChange: (data: Product[]) => void;
  onUploadSuccess: (products: Product[]) => void;
  readOnly?: boolean;
}

export function BOMView({ products = [], onProductsChange, onUploadSuccess, readOnly = false }: BOMViewProps) {
  const [activeTab, setActiveTab] = useState('materials');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (products?.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const activeProduct = products?.find(p => p.id === selectedProductId) || products?.[0];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    simulateUpload();
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
       setIsUploading(false);
       if (activeProduct && activeProduct.materials.length === 0) {
          const mock = generateMockProducts()[0];
          const updated = products.map(p => p.id === activeProduct.id ? { ...p, materials: mock.materials, processes: mock.processes } : p);
          onProductsChange(updated);
       } else {
         const mockData = generateMockProducts();
         onUploadSuccess(mockData);
         setSelectedProductId(mockData[0].id);
       }
    }, 1500);
  };

  const updateProductMaterial = (productId: string, materialId: number, field: keyof MaterialItem, value: any) => {
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          materials: p.materials.map(m => m.id === materialId ? { ...m, [field]: value } : m)
        };
      }
      return p;
    });
    onProductsChange(updatedProducts);
  };

  // 一键询价功能 - 检测数据库中不存在的物料
  const handleBulkInquiry = () => {
    if (!activeProduct) return;
    
    const unrecognizedMaterials = activeProduct.materials.filter(
      m => !MOCK_DATABASE_MATERIALS.includes(m.partNo)
    );

    if (unrecognizedMaterials.length === 0) {
      alert('所有物料已在数据库中识别到，无需询价');
      return;
    }

    // 构建询价邮件内容
    const emailBody = `尊敬的供应商，\n\n我们需要以下物料的报价：\n\n${unrecognizedMaterials.map((m, idx) => 
      `${idx + 1}. ${m.partNo} - ${m.name}\n   材料: ${m.material}\n   数量: ${m.qty} ${m.unit}\n`
    ).join('\n')}\n\n请提供详细报价，谢谢！\n\n此致\nDr.aiVOSS 团队`;

    const subject = `物料询价请求 - 项目 ${activeProduct.id}`;
    
    // 使用 mailto 协议打开邮件客户端
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    setShowQuoteDialog(true);
  };

  // 导入报价单功能
  const handleImportQuote = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 模拟文件识别过程
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setShowImportDialog(true);
      // 清空 input，允许再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1500);
  };

  const hasData = activeProduct && (activeProduct.materials.length > 0 || activeProduct.processes.length > 0);

  const materialCost = activeProduct?.materials.reduce((acc, m) => acc + (m.price * m.qty), 0) || 0;
  const processCost = activeProduct?.processes.reduce((acc, p) => acc + ((p.cycleTime / 3600) * p.mhr), 0) || 0;
  const totalCost = materialCost + processCost;
  const investmentCost = (activeProduct?.investmentItems || []).reduce(
    (acc, item) => acc + (item.autoCalculate ? (item.quantity || 0) * (item.unitPrice || 0) : item.amount),
    0
  ) || ((activeProduct?.investment?.mold || 0) + (activeProduct?.investment?.rnd || 0));
  
  const getPriceStatusDisplay = (status?: string) => {
    switch(status) {
      case 'reasonable': 
        return <div className="flex items-center gap-1 text-[12px] text-emerald-600 font-medium"><ThumbsUp size={10} /> 合理</div>;
      case 'deviation': 
        return <div className="flex items-center gap-1 text-[12px] text-amber-600 font-medium"><AlertTriangle size={10} /> 偏差</div>;
      case 'abnormal': 
        return <div className="flex items-center gap-1 text-[12px] text-red-600 font-medium"><AlertCircle size={10} /> 异常</div>;
      default: return null;
    }
  };

  const getLevelBadge = (level: string) => {
    const num = parseInt(level) || 0;
    const colors = [
      'bg-slate-100 text-slate-600',
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-purple-100 text-purple-700 border-purple-200',
    ];
    return (
      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold border ${colors[num] || colors[0]}`}>
        {level}
      </div>
    );
  };

  // Shared Component: Editable Cell
  const EditableCell = ({ value, onChange, className = "" }: { value: string | number, onChange: (val: any) => void, className?: string }) => (
    <input 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className={`bg-transparent w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-[12px] ${className}`}
    />
  );
  
  // Shared Styles
  const tableStyles = {
    container: "w-full overflow-auto border border-slate-200 rounded-md relative bg-white dark:bg-slate-950 dark:border-slate-800",
    table: "w-full text-[12px] text-left border-collapse",
    thead: "bg-slate-50 text-slate-500 sticky top-0 z-10 dark:bg-slate-900 dark:text-slate-400",
    th: "px-3 py-2 font-medium border-b border-slate-200 whitespace-nowrap dark:border-slate-800",
    tbody: "divide-y divide-slate-100 dark:divide-slate-800",
    tr: "group hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50",
    td: "px-3 py-1.5 align-top border-b border-slate-50 dark:border-slate-900/50"
  };

  // Mock imported products for quote import dialog
  const mockImportedProducts = [
    { id: 'PROD-001', name: '产品 A', quantity: 100 },
    { id: 'PROD-002', name: '产品 B', quantity: 200 },
    { id: 'PROD-003', name: '产品 C', quantity: 150 },
  ];

  return (
    <div className="space-y-4">
      
      {/* Read-Only Banner */}
      {readOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-amber-800">BOM 已锁定 — VM 已确认成本</div>
            <div className="text-xs text-amber-600">成本核算已由 VM 确认并提交给 Sales，BOM 数据暂不可修改。如需修改请联系 VM 撤回确认。</div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 询价提示对话框 */}
      {showQuoteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">询价邮件已准备</h3>
                <p className="text-sm text-slate-500">邮件客户端已打开</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              系统已为您准备好询价邮件内容，包含所有未在数据库中识别到的物料。请在邮件客户端中添加收件人并发送。
            </p>
            <Button onClick={() => setShowQuoteDialog(false)} className="w-full">
              确定
            </Button>
          </div>
        </div>
      )}

      {/* 导入报价单对话框 */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">识别到的产品列表</h3>
              <button onClick={() => setShowImportDialog(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              以下是从报价单中识别到的产品。注意：BOM表中的物料和工艺信息需要为每个产品单独上传。
            </p>
            <div className="space-y-2 mb-6">
              {mockImportedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div>
                    <div className="font-medium text-slate-900">{product.id}</div>
                    <div className="text-sm text-slate-500">{product.name}</div>
                  </div>
                  <div className="text-sm text-slate-600">
                    数量: <span className="font-semibold">{product.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div className="text-sm text-amber-800">
                  <strong>提示：</strong>每个产品需要单独上传BOM表以获取完整的物料和工艺信息。
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowImportDialog(false)} variant="outline" className="flex-1">
                取消
              </Button>
              <Button 
                onClick={() => {
                  setShowImportDialog(false);
                  alert('产品已导入，请为每个产品单独上传BOM表');
                }} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                确认导入
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 dark:bg-slate-950 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Box size={18} className="text-slate-900 dark:text-slate-50" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">产品管理 · Products</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            包含 {products.length} 个产品
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs"
              onClick={handleImportQuote}
            >
              <FileUp size={14} /> 导入报价单
            </Button>
            <Button 
              size="sm" 
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              onClick={handleBulkInquiry}
            >
              <Mail size={14} /> 项目一键询价
            </Button>
          </div>
        )}
      </div>

      {/* 2. Product Tabs & Summary */}
      <div className="bg-white rounded-lg border border-slate-200 dark:bg-slate-950 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => setSelectedProductId(product.id)}
              className={`
                group relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap
                ${selectedProductId === product.id 
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:border-slate-700'}
              `}
            >
              <span>{product.id}</span>
            </button>
          ))}
          <button 
             onClick={() => {
                const newProduct: Product = {
                  id: `NEW-PROD-${String(products.length + 1).padStart(3, '0')}`,
                  name: '未命名产品',
                  investment: { mold: 0, rnd: 0, amortization: '一次性支付' },
                  materials: [],
                  processes: []
                };
                onProductsChange([...products, newProduct]);
                setSelectedProductId(newProduct.id);
             }}
             className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
             <Plus size={14} />
          </button>
        </div>

        {/* Product Summary */}
        {activeProduct && (
          <div className="p-4">
             <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-0.5">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                      {activeProduct.id}
                   </h3>
                   <input 
                      value={activeProduct.name}
                      onChange={(e) => {
                         const updated = products.map(p => p.id === activeProduct.id ? { ...p, name: e.target.value } : p);
                         onProductsChange(updated);
                      }}
                      className="text-sm text-slate-500 bg-transparent hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1"
                   />
                </div>

                <div className="flex items-center gap-4">
                   <div className="flex flex-col items-center px-2 border-r border-slate-100 last:border-0">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-blue-600 mb-0.5">
                         <Box size={12} /> 物料
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                         {hasData ? `¥${materialCost.toFixed(2)}` : '-'}
                      </div>
                   </div>

                   <div className="flex flex-col items-center px-2 border-r border-slate-100 last:border-0">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-purple-600 mb-0.5">
                         <Settings size={12} /> 工艺
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                         {hasData ? `¥${processCost.toFixed(2)}` : '-'}
                      </div>
                   </div>

                   <div className="flex flex-col items-center px-2 border-r border-slate-100 last:border-0">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 mb-0.5">
                         <TrendingUp size={12} /> 投资
                      </div>
                      <div className="text-xs font-bold text-amber-600">
                         {investmentCost > 0 ? `¥${investmentCost.toLocaleString()}` : '¥0.00'}
                      </div>
                   </div>

                   <div className="flex flex-col items-center justify-center bg-emerald-50 rounded-md px-4 py-1 border border-emerald-100">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 mb-0.5">
                         <DollarSign size={12} /> 单价
                      </div>
                      <div className="text-sm font-bold text-emerald-700">
                         {hasData ? `¥${totalCost.toFixed(2)}` : '-'}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* 3. Content Area */}
      <div className={`min-h-[400px] ${readOnly ? 'pointer-events-none opacity-75 select-none' : ''}`}>
        {!hasData ? (
          <div className="space-y-4">
            <Card className="p-6 border-dashed border-2 bg-slate-50/50">
              <div className="max-w-xl mx-auto text-center space-y-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    上传 {activeProduct?.id || '产品'} 的BOM表
                  </h3>
                  <p className="text-sm text-slate-500">
                    支持 Excel 或 CSV，AI自动解析
                  </p>
                </div>

                <div 
                  className={`
                    mt-4 border-2 border-dashed rounded-xl p-6 transition-colors
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Button onClick={simulateUpload} className="bg-slate-900 text-white gap-2">
                     <Upload size={14} /> 选择文件
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
             <Tabs className="w-full">
               <div className="flex items-center justify-between mb-2">
                 <TabsList>
                   <TabsTrigger value="materials" activeValue={activeTab} setActiveValue={setActiveTab}>
                     物料清单 ({activeProduct?.materials.length})
                   </TabsTrigger>
                   <TabsTrigger value="processes" activeValue={activeTab} setActiveValue={setActiveTab}>
                     工艺清单 ({activeProduct?.processes.length})
                   </TabsTrigger>
                   <TabsTrigger value="investment" activeValue={activeTab} setActiveValue={setActiveTab}>
                     投资项清单 ({activeProduct?.investmentItems?.length || 0})
                   </TabsTrigger>
                 </TabsList>
               </div>
               
               <TabsContent value="materials" activeValue={activeTab}>
                 <Card className="overflow-hidden border-0 shadow-none">
                   <div className={tableStyles.container}>
                     <table className={tableStyles.table}>
                       <thead className={tableStyles.thead}>
                         <tr>
                           <th className={`${tableStyles.th} w-12 text-center`}>层级</th>
                           <th className={`${tableStyles.th} w-24`}>零件号</th>
                           <th className={`${tableStyles.th} min-w-[120px]`}>零件名称</th>
                           <th className={`${tableStyles.th} w-16`}>版本</th>
                           <th className={`${tableStyles.th} w-20`}>类型</th>
                           <th className={`${tableStyles.th} w-16 text-center`}>状态</th>
                           <th className={`${tableStyles.th} min-w-[100px]`}>材料</th>
                           <th className={`${tableStyles.th} min-w-[100px]`}>供应商</th>
                           <th className={`${tableStyles.th} w-16 text-right`}>数量</th>
                           <th className={`${tableStyles.th} w-12`}>单位</th>
                           <th className={`${tableStyles.th} w-24 text-right`}>单价</th>
                           <th className={`${tableStyles.th} min-w-[120px]`}>备注</th>
                           <th className={`${tableStyles.th} text-center`}>操作</th>
                         </tr>
                       </thead>
                       <tbody className={tableStyles.tbody}>
                         {activeProduct?.materials.map((item) => (
                           <tr key={item.id} className={tableStyles.tr}>
                             <td className={tableStyles.td}>
                               <div className="flex justify-center pt-0.5">
                                 {getLevelBadge(item.level)}
                               </div>
                             </td>
                             <td className={`${tableStyles.td} pt-2 font-medium text-slate-700`}>
                               {/* Part No - Read Only */}
                               {item.partNo}
                             </td>
                             <td className={`${tableStyles.td} pt-2`}>
                               <div className="flex items-center">
                                 {item.level === '2' && <CornerDownRight size={12} className="text-slate-400 mr-1 shrink-0" />}
                                 {item.level === '3' && <span className="flex items-center mr-1"><span className="w-3"></span><CornerDownRight size={12} className="text-slate-400 shrink-0" /></span>}
                                 {/* Name - Read Only */}
                                 <span className="font-bold text-slate-800">{item.name}</span>
                               </div>
                             </td>
                             <td className={`${tableStyles.td} pt-2 text-slate-600`}>
                               {/* Version - Read Only */}
                               {item.version}
                             </td>
                             <td className={`${tableStyles.td} pt-1.5`}>
                               {/* Type - Select */}
                               <div className="relative group">
                                 <select 
                                   value={item.type} 
                                   onChange={(e) => updateProductMaterial(activeProduct.id, item.id, 'type', e.target.value)}
                                   className="bg-slate-100 w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 text-[12px] border-none appearance-none cursor-pointer hover:bg-slate-200 pr-5"
                                 >
                                   <option value="自制">自制</option>
                                   <option value="外购">外购</option>
                                   <option value="客供">客供</option>
                                 </select>
                                 <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-1.5 top-2 text-slate-400 pointer-events-none group-hover:text-slate-600">
                                   <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                 </svg>
                               </div>
                             </td>
                             <td className={`${tableStyles.td} pt-1.5`}>
                               {/* Status - Select (N or C) */}
                               <div className="relative group">
                                 <select 
                                   value={item.availability} 
                                   onChange={(e) => updateProductMaterial(activeProduct.id, item.id, 'availability', e.target.value)}
                                   className="bg-slate-100 w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 text-[12px] border-none appearance-none cursor-pointer hover:bg-slate-200 pr-5 text-center font-semibold"
                                 >
                                   <option value="N">N</option>
                                   <option value="C">C</option>
                                 </select>
                                 <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-1.5 top-2 text-slate-400 pointer-events-none group-hover:text-slate-600">
                                   <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                 </svg>
                               </div>
                             </td>
                             <td className={`${tableStyles.td} pt-1.5`}>
                               {/* Material - Select */}
                                <div className="relative group">
                                  <select 
                                    value={item.material} 
                                    onChange={(e) => updateProductMaterial(activeProduct.id, item.id, 'material', e.target.value)}
                                    className="bg-slate-100 w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 text-[12px] border-none appearance-none cursor-pointer hover:bg-slate-200 pr-5"
                                  >
                                    <option value="金属 - 铝合金">金属 - 铝合金</option>
                                    <option value="金属 - 钢材">金属 - 钢材</option>
                                    <option value="塑料">塑料</option>
                                    <option value="橡胶">橡胶</option>
                                    <option value="电子元器件">电子元器件</option>
                                    <option value="其他">其他</option>
                                  </select>
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-1.5 top-2 text-slate-400 pointer-events-none group-hover:text-slate-600">
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                             </td>
                             <td className={`${tableStyles.td} pt-2`}>
                               <EditableCell value={item.supplier} onChange={(v) => updateProductMaterial(activeProduct.id, item.id, 'supplier', v)} />
                             </td>
                             <td className={`${tableStyles.td} pt-2 text-right`}>
                               <EditableCell 
                                  value={item.qty} 
                                  onChange={(v) => updateProductMaterial(activeProduct.id, item.id, 'qty', parseFloat(v) || 0)} 
                                  className="text-right w-14"
                               />
                             </td>
                             <td className={`${tableStyles.td} pt-2`}>
                               <EditableCell 
                                  value={item.unit} 
                                  onChange={(v) => updateProductMaterial(activeProduct.id, item.id, 'unit', v)} 
                                  className="w-10"
                               />
                             </td>
                             <td className={`${tableStyles.td} pt-2 text-right`}>
                               <div className="flex flex-col items-end gap-1">
                                 <div className="flex items-center justify-end">
                                    <span className="text-slate-400 mr-0.5">¥</span>
                                    <EditableCell 
                                      value={item.price} 
                                      onChange={(v) => updateProductMaterial(activeProduct.id, item.id, 'price', parseFloat(v) || 0)} 
                                      className="text-right w-16 font-bold"
                                    />
                                 </div>
                                 {getPriceStatusDisplay(item.priceStatus)}
                               </div>
                             </td>
                             <td className={`${tableStyles.td} pt-2`}>
                               <EditableCell value={item.remark || ''} onChange={(v) => updateProductMaterial(activeProduct.id, item.id, 'remark', v)} className="text-[12px] text-slate-500" />
                             </td>
                             <td className={`${tableStyles.td} text-center`}>
                               <button
                                 className="inline-flex items-center justify-center h-6 w-6 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                 onClick={() => {
                                   if (!activeProduct) return;
                                   const updated = products.map(p => p.id === activeProduct.id ? {
                                     ...p,
                                     materials: p.materials.filter(m => m.id !== item.id)
                                   } : p);
                                   onProductsChange(updated);
                                 }}
                                 title="删除物料"
                               >
                                 <X size={14} />
                               </button>
                             </td>
                           </tr>
                         ))}
                         {/* 增加物料按钮行 */}
                         <tr className={tableStyles.tr}>
                           <td colSpan={13} className={`${tableStyles.td} text-center py-3`}>
                             <Button
                               size="sm"
                               variant="ghost"
                               className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                               onClick={() => {
                                 if (!activeProduct) return;
                                 const maxId = Math.max(0, ...activeProduct.materials.map(m => m.id));
                                 const newMaterial: MaterialItem = {
                                   id: maxId + 1,
                                   level: '1',
                                   partNo: '',
                                   name: '新物料',
                                   version: '1.0',
                                   type: '外购',
                                   availability: 'N',
                                   material: '其他',
                                   qty: 0,
                                   unit: '个',
                                   price: 0,
                                   status: 'warning',
                                   supplier: '',
                                   remark: ''
                                 };
                                 const updated = products.map(p => p.id === activeProduct.id ? {
                                   ...p,
                                   materials: [...p.materials, newMaterial]
                                 } : p);
                                 onProductsChange(updated);
                               }}
                             >
                               <Plus size={16} />
                               增加物料
                             </Button>
                           </td>
                         </tr>
                         {/* 总计行 */}
                         <tr className="bg-blue-50/80">
                           <td colSpan={10} className={`${tableStyles.td} text-[12px] font-bold text-blue-900`}>
                             物料成本合计（{activeProduct?.materials.length || 0} 项）
                           </td>
                           <td className={`${tableStyles.td} text-right`}>
                             <span className="text-[12px] font-bold text-blue-700">
                               ¥{materialCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                             </span>
                           </td>
                           <td colSpan={2} className={tableStyles.td}></td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                 </Card>
               </TabsContent>
               
               <TabsContent value="processes" activeValue={activeTab}>
                  <Card className="border-0 shadow-none">
                   <div className={tableStyles.container}>
                     <table className={tableStyles.table}>
                       <thead className={tableStyles.thead}>
                         <tr>
                           <th className={`${tableStyles.th} w-16 text-center`}>排序</th>
                           <th className={`${tableStyles.th} w-20`}>工序号</th>
                           <th className={`${tableStyles.th} min-w-[180px]`}>工序名称(设备)</th>
                           <th className={`${tableStyles.th} w-24 text-right`}>节拍(s)</th>
                           <th className={`${tableStyles.th} w-24 text-right`}>单价</th>
                           <th className={`${tableStyles.th} min-w-[200px]`}>规格要求</th>
                           <th className={`${tableStyles.th} w-16 text-center`}>操作</th>
                         </tr>
                       </thead>
                       <tbody className={tableStyles.tbody}>
                         {activeProduct?.processes.map((item, index) => {
                           const toggleExpand = () => {
                             const updated = products.map(p => {
                               if (p.id === activeProduct.id) {
                                 return {
                                   ...p,
                                   processes: p.processes.map(proc => 
                                     proc.id === item.id ? { ...proc, isExpanded: !proc.isExpanded } : proc
                                   )
                                 };
                               }
                               return p;
                             });
                             onProductsChange(updated);
                           };

                           return (
                             <tr key={item.id} className={tableStyles.tr}>
                               <td className={`${tableStyles.td} text-center`}>
                                 <div className="flex flex-col gap-1 items-center">
                                   <button 
                                     onClick={toggleExpand}
                                     className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                   >
                                     <ChevronUp size={14} />
                                   </button>
                                   <button 
                                     onClick={toggleExpand}
                                     className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                   >
                                     <ChevronDown size={14} />
                                   </button>
                                 </div>
                               </td>
                               <td className={`${tableStyles.td} font-bold text-slate-900`}>{item.opNo}</td>
                               <td className={`${tableStyles.td}`}>
                                 <div className="relative group">
                                   <select 
                                     value={item.name}
                                     onChange={(e) => {
                                       const updated = products.map(p => {
                                         if (p.id === activeProduct.id) {
                                           return {
                                             ...p,
                                             processes: p.processes.map(proc => 
                                               proc.id === item.id ? { ...proc, name: e.target.value } : proc
                                             )
                                           };
                                         }
                                         return p;
                                       });
                                       onProductsChange(updated);
                                     }}
                                     className="bg-slate-100 w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 text-[12px] border-none appearance-none cursor-pointer hover:bg-slate-200 pr-6"
                                   >
                                     <option value={item.name}>{item.name}</option>
                                     <option value="注塑">注塑</option>
                                     <option value="手动装配">手动装配</option>
                                     <option value="半自动装配">半自动装配</option>
                                     <option value="全自动装配">全自动装配</option>
                                     <option value="切管">切管</option>
                                     <option value="倒角">倒角</option>
                                     <option value="打孔">打孔</option>
                                     <option value="气密性检测">气密性检测</option>
                                     <option value="水检">水检</option>
                                     <option value="视觉检测">视觉检测</option>
                                     <option value="称重">称重</option>
                                     <option value="贴标">贴标</option>
                                     <option value="入库">入库</option>
                                     <option value="涂层">涂层</option>
                                     <option value="清洗">清洗</option>
                                     <option value="丝印">丝印</option>
                                   </select>
                                   <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-2 top-2 text-slate-400 pointer-events-none group-hover:text-slate-600">
                                     <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                   </svg>
                                 </div>
                               </td>
                               <td className={`${tableStyles.td} text-right font-medium text-slate-900`}>
                                 <EditableCell 
                                   value={item.cycleTime} 
                                   onChange={(v) => {
                                     const updated = products.map(p => {
                                       if (p.id === activeProduct.id) {
                                         return {
                                           ...p,
                                           processes: p.processes.map(proc => 
                                             proc.id === item.id ? { ...proc, cycleTime: parseFloat(v) || 0 } : proc
                                           )
                                         };
                                       }
                                       return p;
                                     });
                                     onProductsChange(updated);
                                   }} 
                                   className="text-right w-20"
                                 />
                               </td>
                               <td className={`${tableStyles.td} text-right font-bold text-slate-900`}>
                                 <div className="flex items-center justify-end">
                                   <span className="text-slate-400 mr-0.5">¥</span>
                                   <EditableCell 
                                     value={item.price?.toFixed(2) || '0.00'} 
                                     onChange={(v) => {
                                       const updated = products.map(p => {
                                         if (p.id === activeProduct.id) {
                                           return {
                                             ...p,
                                             processes: p.processes.map(proc => 
                                               proc.id === item.id ? { ...proc, price: parseFloat(v) || 0 } : proc
                                             )
                                           };
                                         }
                                         return p;
                                       });
                                       onProductsChange(updated);
                                     }} 
                                     className="text-right w-16 font-bold"
                                   />
                                 </div>
                               </td>
                               <td className={`${tableStyles.td} text-slate-600`}>
                                 <EditableCell 
                                   value={item.specifications || ''} 
                                   onChange={(v) => {
                                     const updated = products.map(p => {
                                       if (p.id === activeProduct.id) {
                                         return {
                                           ...p,
                                           processes: p.processes.map(proc => 
                                             proc.id === item.id ? { ...proc, specifications: v } : proc
                                           )
                                         };
                                       }
                                       return p;
                                     });
                                     onProductsChange(updated);
                                   }} 
                                   className="text-[12px]"
                                 />
                               </td>
                               <td className={`${tableStyles.td} text-center`}>
                                 <button
                                   className="inline-flex items-center justify-center h-6 w-6 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                   onClick={() => {
                                     if (!activeProduct) return;
                                     const updated = products.map(p => p.id === activeProduct.id ? {
                                       ...p,
                                       processes: p.processes.filter(proc => proc.id !== item.id)
                                     } : p);
                                     onProductsChange(updated);
                                   }}
                                   title="删除工序"
                                 >
                                   <X size={14} />
                                 </button>
                               </td>
                             </tr>
                           );
                         })}
                         {/* 增加工序按钮行 */}
                         <tr className={tableStyles.tr}>
                           <td colSpan={7} className={`${tableStyles.td} text-center py-3`}>
                             <Button 
                               size="sm" 
                               variant="ghost" 
                               className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                               onClick={() => {
                                 if (!activeProduct) return;
                                 const maxId = Math.max(0, ...activeProduct.processes.map(p => p.id));
                                 const lastProcess = activeProduct.processes[activeProduct.processes.length - 1];
                                 const lastOpNo = lastProcess?.opNo || 'I00';
                                 const opLetter = lastOpNo.charAt(0);
                                 const opNumber = parseInt(lastOpNo.substring(1)) + 1;
                                 const newOpNo = `${opLetter}${String(opNumber).padStart(2, '0')}`;
                                 
                                 const newProcess: ProcessItem = {
                                   id: maxId + 1,
                                   opNo: newOpNo,
                                   name: '新工序',
                                   workCenter: `WC-NEW-${String(maxId + 1).padStart(2, '0')}`,
                                   cycleTime: 0,
                                   unit: 's',
                                   mhr: 0,
                                   status: 'warning',
                                   specifications: '',
                                   price: 0,
                                   isExpanded: false
                                 };
                                 
                                 const updated = products.map(p => {
                                   if (p.id === activeProduct.id) {
                                     return {
                                       ...p,
                                       processes: [...p.processes, newProcess]
                                     };
                                   }
                                   return p;
                                 });
                                 onProductsChange(updated);
                               }}
                             >
                               <Plus size={16} />
                               增加工序
                             </Button>
                           </td>
                         </tr>
                         {/* 总计行 */}
                         <tr className="bg-purple-50/80">
                           <td colSpan={4} className={`${tableStyles.td} text-[12px] font-bold text-purple-900`}>
                             工艺成本合计（{activeProduct?.processes.length || 0} 道工序）
                           </td>
                           <td className={`${tableStyles.td} text-right`}>
                             <span className="text-[12px] font-bold text-purple-700">
                               ¥{processCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                             </span>
                           </td>
                           <td colSpan={2} className={tableStyles.td}></td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                 </Card>
               </TabsContent>

               <TabsContent value="investment" activeValue={activeTab}>
                 <InvestmentTabContent
                   activeProduct={activeProduct}
                   products={products}
                   onProductsChange={onProductsChange}
                   tableStyles={tableStyles}
                 />
               </TabsContent>
             </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}