import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator, Search, CheckCircle, AlertTriangle, AlertCircle,
  TrendingUp, TrendingDown, Sparkles, Shield,
  ChevronDown, ChevronUp, Send, FileText,
  Box, Settings, Layers, CircleDot, Info
} from 'lucide-react';
import { Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/shared';
import { Product } from '../../pages/ProjectDetail';

// ==================== Types ====================

interface CostViewProps {
  hasBOM: boolean;
  products: Product[];
  vmConfirmed?: boolean;
  onVmConfirm?: () => void;
  onVmRevoke?: () => void;
}

type VerifyStatus = 'normal' | 'high' | 'low' | 'warning';

interface SimilarProduct {
  id: string;
  name: string;
  customer: string;
  similarity: number;
  hk3Cost: number;
  materialCost: number;
  processCost: number;
  volume: number;
  date: string;
}

interface MaterialVerification {
  materialId: number;
  partNo: string;
  name: string;
  currentPrice: number;
  currentQty: number;
  unit: string;
  benchmarkPrice: number;
  deviation: number; // percentage
  status: VerifyStatus;
  similarItems: { source: string; price: number; date: string }[];
  characteristics: string[];
  characteristicMatch: string;
}

interface ProcessVerification {
  processId: number;
  opNo: string;
  name: string;
  currentCost: number;
  benchmarkCost: number;
  deviation: number;
  status: VerifyStatus;
  similarProcesses: { source: string; cost: number; mhr: number }[];
}

interface InvestmentVerification {
  itemId: number;
  name: string;
  type: string;
  currentAmount: number;
  benchmarkAmount: number;
  deviation: number;
  status: VerifyStatus;
  characteristics: string[];
  matchedCharacteristics: Record<string, string>;
  similarItems: { source: string; amount: number; specs: string }[];
}

// ==================== Constants ====================

const tableStyles = {
  container: 'w-full overflow-x-auto border border-slate-200 rounded-md relative bg-white dark:bg-slate-950 dark:border-slate-800',
  table: 'w-full text-[12px] text-left border-collapse',
  thead: 'bg-slate-50 text-slate-500 sticky top-0 z-10 dark:bg-slate-900 dark:text-slate-400',
  th: 'px-3 py-2 font-medium border-b border-slate-200 whitespace-nowrap dark:border-slate-800',
  tbody: 'divide-y divide-slate-100 dark:divide-slate-800',
  tr: 'group hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50',
  td: 'px-3 py-1.5 align-middle border-b border-slate-50 dark:border-slate-900/50',
};

// 向量匹配特征基准表（来自用户上传的图片）
const CHARACTERISTIC_CRITERIA: Record<string, { label: string; features: string[] }> = {
  '塑料件': { label: '塑料件', features: ['材料', '重量', '公差等级'] },
  '金属件': { label: '金属件', features: ['材料', '重量', '尺寸特征', '公差等级'] },
  '总成产品': { label: '总成产品', features: ['产品类别', '零部件数量'] },
  '模具': { label: '模具 (Mold)', features: ['产品类别', '外观尺寸', '寿命等'] },
  '检具': { label: '检具 (Gauge)', features: ['材料', '重量', '定位特征'] },
};

const INVESTMENT_TYPE_CRITERIA: Record<string, string> = {
  MOLD: '模具',
  GAUGE: '检具',
  JIG: '工装',
  FIXTURE: '成型工装',
};

// ==================== Mock Data Generators ====================

function generateSimilarProducts(product: Product): SimilarProduct[] {
  return [
    {
      id: 'PRJ-2025-087',
      name: 'Brake Line Assembly V1.2',
      customer: 'BMW AG',
      similarity: 94.2,
      hk3Cost: 198.35,
      materialCost: 142.80,
      processCost: 55.55,
      volume: 45000,
      date: '2025-08',
    },
    {
      id: 'PRJ-2025-056',
      name: 'Suspension Tube Set',
      customer: 'Mercedes-Benz',
      similarity: 87.6,
      hk3Cost: 215.60,
      materialCost: 158.20,
      processCost: 57.40,
      volume: 38000,
      date: '2025-05',
    },
    {
      id: 'PRJ-2024-142',
      name: 'Brake Pipe Assembly',
      customer: 'Volkswagen',
      similarity: 82.1,
      hk3Cost: 182.90,
      materialCost: 130.50,
      processCost: 52.40,
      volume: 60000,
      date: '2024-11',
    },
  ];
}

function generateMaterialVerifications(product: Product): MaterialVerification[] {
  const materialTypeMap: Record<string, string> = {
    '金属 - 铝合金': '金属件',
    '金属 - 钢材': '金属件',
    '塑料': '塑料件',
    '橡胶': '塑料件',
  };

  return product.materials.map((m) => {
    const category = materialTypeMap[m.material] || '金属件';
    const criteria = CHARACTERISTIC_CRITERIA[category];
    const benchmarkPrice = m.price * (0.85 + Math.random() * 0.25);
    const deviation = ((m.price - benchmarkPrice) / benchmarkPrice) * 100;
    let status: VerifyStatus = 'normal';
    if (deviation > 15) status = 'high';
    else if (deviation > 8) status = 'warning';
    else if (deviation < -10) status = 'low';

    return {
      materialId: m.id,
      partNo: m.partNo,
      name: m.name,
      currentPrice: m.price,
      currentQty: m.qty,
      unit: m.unit,
      benchmarkPrice: parseFloat(benchmarkPrice.toFixed(2)),
      deviation: parseFloat(deviation.toFixed(1)),
      status,
      similarItems: [
        { source: 'PRJ-2025-087 / BMW', price: parseFloat((m.price * (0.92 + Math.random() * 0.1)).toFixed(2)), date: '2025-08' },
        { source: 'PRJ-2024-142 / VW', price: parseFloat((m.price * (0.88 + Math.random() * 0.15)).toFixed(2)), date: '2024-11' },
      ],
      characteristics: criteria?.features || [],
      characteristicMatch: category,
    };
  });
}

function generateProcessVerifications(product: Product): ProcessVerification[] {
  return product.processes.map((p) => {
    const currentCost = (p.cycleTime / 3600) * p.mhr;
    const benchmarkCost = currentCost * (0.88 + Math.random() * 0.2);
    const deviation = ((currentCost - benchmarkCost) / benchmarkCost) * 100;
    let status: VerifyStatus = 'normal';
    if (deviation > 12) status = 'high';
    else if (deviation > 5) status = 'warning';
    else if (deviation < -8) status = 'low';

    return {
      processId: p.id,
      opNo: p.opNo,
      name: p.name,
      currentCost: parseFloat(currentCost.toFixed(2)),
      benchmarkCost: parseFloat(benchmarkCost.toFixed(2)),
      deviation: parseFloat(deviation.toFixed(1)),
      status,
      similarProcesses: [
        { source: 'BMW 项目', cost: parseFloat((currentCost * (0.93 + Math.random() * 0.08)).toFixed(2)), mhr: parseFloat((p.mhr * 0.95).toFixed(2)) },
        { source: 'VW 项目', cost: parseFloat((currentCost * (0.9 + Math.random() * 0.12)).toFixed(2)), mhr: parseFloat((p.mhr * 0.92).toFixed(2)) },
      ],
    };
  });
}

function generateInvestmentVerifications(product: Product): InvestmentVerification[] {
  return (product.investmentItems || []).map((item) => {
    const displayAmount = item.autoCalculate ? (item.quantity || 0) * (item.unitPrice || 0) : item.amount;
    const benchmarkAmount = displayAmount * (0.82 + Math.random() * 0.25);
    const deviation = displayAmount > 0 ? ((displayAmount - benchmarkAmount) / benchmarkAmount) * 100 : 0;
    let status: VerifyStatus = 'normal';
    if (deviation > 15) status = 'high';
    else if (deviation > 8) status = 'warning';
    else if (deviation < -5) status = 'low';

    const typeKey = INVESTMENT_TYPE_CRITERIA[item.type] || '模具';
    const criteria = CHARACTERISTIC_CRITERIA[typeKey];

    const matchedCharacteristics: Record<string, string> = {};
    if (criteria) {
      criteria.features.forEach((f) => {
        if (f === '材料') matchedCharacteristics[f] = '铝合金 / 钢材';
        else if (f === '重量') matchedCharacteristics[f] = '3.5 kg';
        else if (f === '公差等级') matchedCharacteristics[f] = 'IT7';
        else if (f === '尺寸特征') matchedCharacteristics[f] = '320×180×95 mm';
        else if (f === '产品类别') matchedCharacteristics[f] = '管路总成';
        else if (f === '零部件数量') matchedCharacteristics[f] = '6 件';
        else if (f === '外观尺寸') matchedCharacteristics[f] = '450×300×250 mm';
        else if (f === '寿命等') matchedCharacteristics[f] = '50万次';
        else if (f === '定位特征') matchedCharacteristics[f] = '3点定位';
        else matchedCharacteristics[f] = '-';
      });
    }

    return {
      itemId: item.id,
      name: item.name,
      type: item.type,
      currentAmount: displayAmount,
      benchmarkAmount: parseFloat(benchmarkAmount.toFixed(2)),
      deviation: parseFloat(deviation.toFixed(1)),
      status,
      characteristics: criteria?.features || [],
      matchedCharacteristics,
      similarItems: [
        { source: 'PRJ-2025-087', amount: parseFloat((displayAmount * (0.88 + Math.random() * 0.1)).toFixed(2)), specs: '类似规格' },
        { source: 'PRJ-2024-099', amount: parseFloat((displayAmount * (0.92 + Math.random() * 0.12)).toFixed(2)), specs: '近似参数' },
      ],
    };
  });
}

// ==================== Sub Components ====================

function StatusBadge({ status, label }: { status: VerifyStatus; label?: string }) {
  const config = {
    normal: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <CheckCircle size={11} />, text: label || '正常' },
    high: { bg: 'bg-red-50 border-red-200 text-red-700', icon: <TrendingUp size={11} />, text: label || '偏高' },
    low: { bg: 'bg-blue-50 border-blue-200 text-blue-700', icon: <TrendingDown size={11} />, text: label || '偏低' },
    warning: { bg: 'bg-amber-50 border-amber-200 text-amber-700', icon: <AlertTriangle size={11} />, text: label || '关注' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg}`}>
      {c.icon} {c.text}
    </span>
  );
}

function DeviationDisplay({ deviation }: { deviation: number }) {
  const isPositive = deviation > 0;
  const color = Math.abs(deviation) > 10 ? (isPositive ? 'text-red-600' : 'text-blue-600') : Math.abs(deviation) > 5 ? 'text-amber-600' : 'text-emerald-600';
  return (
    <span className={`text-[12px] font-semibold ${color}`}>
      {isPositive ? '+' : ''}{deviation.toFixed(1)}%
    </span>
  );
}

function ExpandableRow({
  children,
  expandContent,
  defaultExpanded = false,
}: {
  children: React.ReactNode;
  expandContent: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <>
      <tr
        className={`${tableStyles.tr} cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        {children}
        <td className={`${tableStyles.td} text-center`}>
          <button className="text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/70">
          <td colSpan={100} className="px-4 py-3">
            {expandContent}
          </td>
        </tr>
      )}
    </>
  );
}

// ==================== Main Component ====================

export function CostView({ hasBOM, products = [], vmConfirmed = false, onVmConfirm, onVmRevoke }: CostViewProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (products?.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  const activeProduct = products?.find((p) => p.id === selectedProductId) || products?.[0];

  // ========== Cost Calculations ==========
  const calculateProductCosts = (product: Product) => {
    const materialCost = product.materials.reduce((acc, item) => acc + item.price * item.qty, 0);
    const processCost = product.processes.reduce((acc, item) => acc + (item.cycleTime / 3600) * item.mhr, 0);
    const hk3Cost = materialCost + processCost;
    const investmentCost = (product.investmentItems || []).reduce(
      (acc, item) => acc + (item.autoCalculate ? (item.quantity || 0) * (item.unitPrice || 0) : item.amount),
      0
    );
    return { materialCost, processCost, hk3Cost, investmentCost };
  };

  // ========== Verification Data ==========
  const verificationData = useMemo(() => {
    if (!activeProduct) return null;
    return {
      similarProducts: generateSimilarProducts(activeProduct),
      materialVerifications: generateMaterialVerifications(activeProduct),
      processVerifications: generateProcessVerifications(activeProduct),
      investmentVerifications: generateInvestmentVerifications(activeProduct),
    };
  }, [activeProduct?.id, activeProduct?.materials, activeProduct?.processes, activeProduct?.investmentItems]);

  const currentCosts = activeProduct ? calculateProductCosts(activeProduct) : null;

  const allProductsTotals = useMemo(
    () =>
      products.reduce(
        (totals, product) => {
          const costs = calculateProductCosts(product);
          return {
            totalMaterial: totals.totalMaterial + costs.materialCost,
            totalProcess: totals.totalProcess + costs.processCost,
            totalHK3: totals.totalHK3 + costs.hk3Cost,
            totalInvestment: totals.totalInvestment + costs.investmentCost,
          };
        },
        { totalMaterial: 0, totalProcess: 0, totalHK3: 0, totalInvestment: 0 }
      ),
    [products]
  );

  // Verification summary
  const verificationSummary = useMemo(() => {
    if (!verificationData) return { total: 0, normal: 0, warning: 0, high: 0 };
    const all = [
      ...verificationData.materialVerifications.map((v) => v.status),
      ...verificationData.processVerifications.map((v) => v.status),
      ...verificationData.investmentVerifications.map((v) => v.status),
    ];
    return {
      total: all.length,
      normal: all.filter((s) => s === 'normal' || s === 'low').length,
      warning: all.filter((s) => s === 'warning').length,
      high: all.filter((s) => s === 'high').length,
    };
  }, [verificationData]);

  // Overall product-level status
  const productVerifyStatus = useMemo((): VerifyStatus => {
    if (!verificationData?.similarProducts.length || !currentCosts) return 'normal';
    const avgBenchmark =
      verificationData.similarProducts.reduce((s, p) => s + p.hk3Cost, 0) /
      verificationData.similarProducts.length;
    const deviation = ((currentCosts.hk3Cost - avgBenchmark) / avgBenchmark) * 100;
    if (deviation > 12) return 'high';
    if (deviation > 5) return 'warning';
    if (deviation < -8) return 'low';
    return 'normal';
  }, [verificationData, currentCosts]);

  if (!hasBOM || !activeProduct || !currentCosts) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Calculator className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">暂无成本数据</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          请先在 BOM 管理页面上传并解析 BOM 文件，系统将自动计算相关成本。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ==================== Header Section ==================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-slate-900" />
                <h2 className="text-base font-bold text-slate-900">成本核算 · Cost Calculation</h2>
                {vmConfirmed && (
                  <Badge variant="success" className="text-[10px] gap-1">
                    <CheckCircle size={10} /> VM 已确认
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                包含 {products.length} 个产品 · HK III 制造成本核算与 AI 价格校验
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right px-3 border-r border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium mb-0.5">物料成本</div>
                <div className="text-sm font-bold text-blue-600">¥{allProductsTotals.totalMaterial.toFixed(2)}</div>
              </div>
              <div className="text-right px-3 border-r border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium mb-0.5">工艺成本</div>
                <div className="text-sm font-bold text-purple-600">¥{allProductsTotals.totalProcess.toFixed(2)}</div>
              </div>
              <div className="text-right px-3 border-r border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium mb-0.5">投资总额</div>
                <div className="text-sm font-bold text-amber-600">¥{allProductsTotals.totalInvestment.toLocaleString()}</div>
              </div>
              <div className="text-right px-3 bg-blue-50 rounded-md py-1.5">
                <div className="text-[10px] text-blue-600 font-bold mb-0.5">HK III</div>
                <div className="text-base font-bold text-blue-700">¥{allProductsTotals.totalHK3.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="flex items-center border-b border-slate-200 overflow-x-auto bg-slate-50">
          {products.map((product) => {
            const costs = calculateProductCosts(product);
            return (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                className={`
                  group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap
                  ${selectedProductId === product.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                <span>{product.id}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-normal text-slate-500">¥{costs.hk3Cost.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== Product Summary Cards ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 mb-1">
            <Box size={12} /> 物料成本
          </div>
          <div className="text-lg font-bold text-slate-900">¥{currentCosts.materialCost.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{activeProduct.materials.length} 项物料</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-purple-600 mb-1">
            <Settings size={12} /> 工艺成本
          </div>
          <div className="text-lg font-bold text-slate-900">¥{currentCosts.processCost.toFixed(2)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{activeProduct.processes.length} 道工序</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 mb-1">
            <Layers size={12} /> 投资总额
          </div>
          <div className="text-lg font-bold text-slate-900">¥{currentCosts.investmentCost.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{(activeProduct.investmentItems || []).length} 项投资</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 mb-1">
            <Calculator size={12} /> HK III 制造成本
          </div>
          <div className="text-lg font-bold text-blue-800">¥{currentCosts.hk3Cost.toFixed(2)}</div>
          <div className="text-[10px] text-blue-500 mt-0.5">= 物料 + 工艺</div>
        </div>
        <div className={`rounded-lg border p-3 shadow-sm ${
          verificationSummary.high > 0
            ? 'bg-red-50 border-red-200'
            : verificationSummary.warning > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold mb-1">
            <Shield size={12} className={verificationSummary.high > 0 ? 'text-red-600' : verificationSummary.warning > 0 ? 'text-amber-600' : 'text-emerald-600'} />
            <span className={verificationSummary.high > 0 ? 'text-red-700' : verificationSummary.warning > 0 ? 'text-amber-700' : 'text-emerald-700'}>
              AI 价格校验
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-medium">
              <CheckCircle size={10} /> {verificationSummary.normal}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 font-medium">
              <AlertTriangle size={10} /> {verificationSummary.warning}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-700 font-medium">
              <AlertCircle size={10} /> {verificationSummary.high}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">共 {verificationSummary.total} 项校验</div>
        </div>
      </div>

      {/* ==================== Main Content ==================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Tabs>
          <div className="border-b border-slate-200 px-4">
            <TabsList className="h-11">
              <TabsTrigger value="summary" activeValue={activeTab} setActiveValue={setActiveTab}>
                HK3 成本汇总
              </TabsTrigger>
              <TabsTrigger value="verify-product" activeValue={activeTab} setActiveValue={setActiveTab}>
                <span className="flex items-center gap-1.5">
                  <Sparkles size={13} /> 产品校验
                  <StatusBadge status={productVerifyStatus} />
                </span>
              </TabsTrigger>
              <TabsTrigger value="verify-material" activeValue={activeTab} setActiveValue={setActiveTab}>
                <span className="flex items-center gap-1.5">
                  物料校验
                  {verificationData && (
                    <span className="text-[10px] text-slate-400">
                      ({verificationData.materialVerifications.length})
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="verify-process" activeValue={activeTab} setActiveValue={setActiveTab}>
                <span className="flex items-center gap-1.5">
                  工艺校验
                  {verificationData && (
                    <span className="text-[10px] text-slate-400">
                      ({verificationData.processVerifications.length})
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="verify-investment" activeValue={activeTab} setActiveValue={setActiveTab}>
                <span className="flex items-center gap-1.5">
                  投资校验
                  {verificationData && (
                    <span className="text-[10px] text-slate-400">
                      ({verificationData.investmentVerifications.length})
                    </span>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ========== Tab: HK3 Summary ========== */}
          <TabsContent value="summary" activeValue={activeTab}>
            <div className="p-0">
              <div className={tableStyles.container + ' border-0 rounded-none'}>
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th className={`${tableStyles.th} w-10 text-center`}>#</th>
                      <th className={`${tableStyles.th} w-20`}>编号</th>
                      <th className={`${tableStyles.th} min-w-[140px]`}>名称</th>
                      <th className={`${tableStyles.th} w-20`}>类别</th>
                      <th className={`${tableStyles.th} w-20 text-right`}>数量</th>
                      <th className={`${tableStyles.th} w-16`}>单位</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>单价 (¥)</th>
                      <th className={`${tableStyles.th} w-28 text-right`}>小计 (¥)</th>
                      <th className={`${tableStyles.th} w-20 text-right`}>占比</th>
                      <th className={`${tableStyles.th} w-20 text-center`}>校验</th>
                    </tr>
                  </thead>
                  <tbody className={tableStyles.tbody}>
                    {/* Material Section Header */}
                    <tr className="bg-blue-50/60">
                      <td colSpan={10} className={`${tableStyles.td} text-[12px] font-bold text-blue-800 py-2`}>
                        <div className="flex items-center gap-1.5">
                          <Box size={13} /> 物料成本（Material Cost）
                        </div>
                      </td>
                    </tr>
                    {activeProduct.materials.map((m, idx) => {
                      const subtotal = m.price * m.qty;
                      const pct = currentCosts.hk3Cost > 0 ? (subtotal / currentCosts.hk3Cost) * 100 : 0;
                      const mv = verificationData?.materialVerifications.find((v) => v.materialId === m.id);
                      return (
                        <tr key={`m-${m.id}`} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} text-center text-slate-400`}>{idx + 1}</td>
                          <td className={`${tableStyles.td} font-medium text-slate-700 font-mono`}>{m.partNo}</td>
                          <td className={`${tableStyles.td} font-medium text-slate-900`}>{m.name}</td>
                          <td className={tableStyles.td}>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              物料
                            </span>
                          </td>
                          <td className={`${tableStyles.td} text-right font-mono`}>{m.qty}</td>
                          <td className={`${tableStyles.td} text-slate-500`}>{m.unit}</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{m.price.toFixed(2)}</td>
                          <td className={`${tableStyles.td} text-right font-bold`}>¥{subtotal.toFixed(2)}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>{pct.toFixed(1)}%</td>
                          <td className={`${tableStyles.td} text-center`}>
                            {mv && <StatusBadge status={mv.status} />}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Material Subtotal */}
                    <tr className="bg-blue-50/40">
                      <td colSpan={7} className={`${tableStyles.td} text-[12px] font-bold text-blue-900 pl-6`}>
                        物料成本小计（{activeProduct.materials.length} 项）
                      </td>
                      <td className={`${tableStyles.td} text-right font-bold text-blue-800`}>
                        ¥{currentCosts.materialCost.toFixed(2)}
                      </td>
                      <td className={`${tableStyles.td} text-right text-blue-700 font-medium`}>
                        {currentCosts.hk3Cost > 0
                          ? ((currentCosts.materialCost / currentCosts.hk3Cost) * 100).toFixed(1)
                          : 0}%
                      </td>
                      <td className={tableStyles.td}></td>
                    </tr>

                    {/* Process Section Header */}
                    <tr className="bg-purple-50/60">
                      <td colSpan={10} className={`${tableStyles.td} text-[12px] font-bold text-purple-800 py-2`}>
                        <div className="flex items-center gap-1.5">
                          <Settings size={13} /> 工艺成本（Process Cost）
                        </div>
                      </td>
                    </tr>
                    {activeProduct.processes.map((p, idx) => {
                      const cost = (p.cycleTime / 3600) * p.mhr;
                      const pct = currentCosts.hk3Cost > 0 ? (cost / currentCosts.hk3Cost) * 100 : 0;
                      const pv = verificationData?.processVerifications.find((v) => v.processId === p.id);
                      return (
                        <tr key={`p-${p.id}`} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} text-center text-slate-400`}>{idx + 1}</td>
                          <td className={`${tableStyles.td} font-bold text-slate-900 font-mono`}>{p.opNo}</td>
                          <td className={`${tableStyles.td} font-medium text-slate-900`}>{p.name}</td>
                          <td className={tableStyles.td}>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                              工艺
                            </span>
                          </td>
                          <td className={`${tableStyles.td} text-right font-mono`}>{p.cycleTime}</td>
                          <td className={`${tableStyles.td} text-slate-500`}>s</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{p.mhr.toFixed(2)}/h</td>
                          <td className={`${tableStyles.td} text-right font-bold`}>¥{cost.toFixed(2)}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>{pct.toFixed(1)}%</td>
                          <td className={`${tableStyles.td} text-center`}>
                            {pv && <StatusBadge status={pv.status} />}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Process Subtotal */}
                    <tr className="bg-purple-50/40">
                      <td colSpan={7} className={`${tableStyles.td} text-[12px] font-bold text-purple-900 pl-6`}>
                        工艺成本小计（{activeProduct.processes.length} 道工序）
                      </td>
                      <td className={`${tableStyles.td} text-right font-bold text-purple-800`}>
                        ¥{currentCosts.processCost.toFixed(2)}
                      </td>
                      <td className={`${tableStyles.td} text-right text-purple-700 font-medium`}>
                        {currentCosts.hk3Cost > 0
                          ? ((currentCosts.processCost / currentCosts.hk3Cost) * 100).toFixed(1)
                          : 0}%
                      </td>
                      <td className={tableStyles.td}></td>
                    </tr>

                    {/* HK3 Total */}
                    <tr className="bg-gradient-to-r from-blue-100/80 to-indigo-100/80">
                      <td colSpan={7} className={`${tableStyles.td} font-bold text-blue-900 text-[13px]`}>
                        <div className="flex items-center gap-1.5">
                          <Calculator size={14} /> HK III 制造成本合计
                        </div>
                      </td>
                      <td className={`${tableStyles.td} text-right font-bold text-blue-900 text-[13px]`}>
                        ¥{currentCosts.hk3Cost.toFixed(2)}
                      </td>
                      <td className={`${tableStyles.td} text-right font-bold text-blue-800`}>100%</td>
                      <td className={`${tableStyles.td} text-center`}>
                        <StatusBadge status={productVerifyStatus} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ========== Tab: Product Verification ========== */}
          <TabsContent value="verify-product" activeValue={activeTab}>
            <div className="p-5 space-y-5">
              {/* Product-Level Vector Match */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">产品级向量匹配</h3>
                  <span className="text-[10px] text-slate-400">基于产品特征（产品类别 / 零部件数量）进行相似产品匹配</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                  {verificationData?.similarProducts.map((sp) => {
                    const deviation = currentCosts.hk3Cost > 0 ? ((currentCosts.hk3Cost - sp.hk3Cost) / sp.hk3Cost) * 100 : 0;
                    return (
                      <div key={sp.id} className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-[12px] font-bold text-slate-900">{sp.id}</div>
                            <div className="text-[10px] text-slate-500">{sp.name}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <CircleDot size={10} className="text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-700">{sp.similarity}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                          <span>{sp.customer}</span>
                          <span>·</span>
                          <span>{sp.date}</span>
                          <span>·</span>
                          <span>{sp.volume.toLocaleString()} 件/年</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="bg-slate-50 rounded px-2 py-1.5">
                            <div className="text-[9px] text-slate-400 mb-0.5">HK3</div>
                            <div className="font-bold text-slate-800">¥{sp.hk3Cost.toFixed(2)}</div>
                          </div>
                          <div className="bg-slate-50 rounded px-2 py-1.5">
                            <div className="text-[9px] text-slate-400 mb-0.5">物料</div>
                            <div className="font-medium text-blue-700">¥{sp.materialCost.toFixed(2)}</div>
                          </div>
                          <div className="bg-slate-50 rounded px-2 py-1.5">
                            <div className="text-[9px] text-slate-400 mb-0.5">工艺</div>
                            <div className="font-medium text-purple-700">¥{sp.processCost.toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">与当前产品偏差</span>
                          <DeviationDisplay deviation={deviation} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comparison Summary */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} className="text-slate-600" />
                  <h4 className="text-[12px] font-bold text-slate-800">对比分析</h4>
                </div>
                <div className={tableStyles.container + ' border-slate-200'}>
                  <table className={tableStyles.table}>
                    <thead className={tableStyles.thead}>
                      <tr>
                        <th className={`${tableStyles.th} w-40`}>项目</th>
                        <th className={`${tableStyles.th} w-28 text-right`}>当前产品</th>
                        {verificationData?.similarProducts.map((sp) => (
                          <th key={sp.id} className={`${tableStyles.th} w-28 text-right`}>{sp.id}</th>
                        ))}
                        <th className={`${tableStyles.th} w-28 text-right`}>行业均值</th>
                        <th className={`${tableStyles.th} w-20 text-center`}>状态</th>
                      </tr>
                    </thead>
                    <tbody className={tableStyles.tbody}>
                      <tr className={tableStyles.tr}>
                        <td className={`${tableStyles.td} font-medium`}>物料成本</td>
                        <td className={`${tableStyles.td} text-right font-bold`}>¥{currentCosts.materialCost.toFixed(2)}</td>
                        {verificationData?.similarProducts.map((sp) => (
                          <td key={sp.id} className={`${tableStyles.td} text-right`}>¥{sp.materialCost.toFixed(2)}</td>
                        ))}
                        <td className={`${tableStyles.td} text-right text-slate-500`}>
                          ¥{verificationData ? (verificationData.similarProducts.reduce((s, p) => s + p.materialCost, 0) / verificationData.similarProducts.length).toFixed(2) : '-'}
                        </td>
                        <td className={`${tableStyles.td} text-center`}><StatusBadge status="normal" /></td>
                      </tr>
                      <tr className={tableStyles.tr}>
                        <td className={`${tableStyles.td} font-medium`}>工艺成本</td>
                        <td className={`${tableStyles.td} text-right font-bold`}>¥{currentCosts.processCost.toFixed(2)}</td>
                        {verificationData?.similarProducts.map((sp) => (
                          <td key={sp.id} className={`${tableStyles.td} text-right`}>¥{sp.processCost.toFixed(2)}</td>
                        ))}
                        <td className={`${tableStyles.td} text-right text-slate-500`}>
                          ¥{verificationData ? (verificationData.similarProducts.reduce((s, p) => s + p.processCost, 0) / verificationData.similarProducts.length).toFixed(2) : '-'}
                        </td>
                        <td className={`${tableStyles.td} text-center`}><StatusBadge status="normal" /></td>
                      </tr>
                      <tr className="bg-blue-50/60">
                        <td className={`${tableStyles.td} font-bold text-blue-900`}>HK III 合计</td>
                        <td className={`${tableStyles.td} text-right font-bold text-blue-900`}>¥{currentCosts.hk3Cost.toFixed(2)}</td>
                        {verificationData?.similarProducts.map((sp) => (
                          <td key={sp.id} className={`${tableStyles.td} text-right font-medium text-blue-800`}>¥{sp.hk3Cost.toFixed(2)}</td>
                        ))}
                        <td className={`${tableStyles.td} text-right font-bold text-blue-700`}>
                          ¥{verificationData ? (verificationData.similarProducts.reduce((s, p) => s + p.hk3Cost, 0) / verificationData.similarProducts.length).toFixed(2) : '-'}
                        </td>
                        <td className={`${tableStyles.td} text-center`}>
                          <StatusBadge status={productVerifyStatus} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========== Tab: Material Verification ========== */}
          <TabsContent value="verify-material" activeValue={activeTab}>
            <div className="p-4 space-y-4">
              {/* Characteristic Criteria Reference */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-indigo-800 mb-1.5">向量匹配校验基准 · 物料特征维度</div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-[11px] text-indigo-700">
                      <span><strong>塑料件：</strong>材料 / 重量 / 公差等级</span>
                      <span><strong>金属件：</strong>材料 / 重量 / 尺寸特征 / 公差等级</span>
                      <span><strong>总成产品：</strong>产品类别 / 零部件数量</span>
                    </div>
                    <p className="text-[10px] text-indigo-500 mt-1.5">系统基于以上特征维度进行向量相似度计算，匹配历史报价数据，确保成本无 buffer</p>
                  </div>
                </div>
              </div>

              <div className={tableStyles.container}>
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th className={`${tableStyles.th} w-20`}>零件号</th>
                      <th className={`${tableStyles.th} min-w-[100px]`}>名称</th>
                      <th className={`${tableStyles.th} w-20`}>匹配类型</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>当前单价</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>基准单价</th>
                      <th className={`${tableStyles.th} w-20 text-right`}>偏差</th>
                      <th className={`${tableStyles.th} w-20 text-center`}>状态</th>
                      <th className={`${tableStyles.th} min-w-[160px]`}>校验特征维度</th>
                      <th className={`${tableStyles.th} w-12 text-center`}></th>
                    </tr>
                  </thead>
                  <tbody className={tableStyles.tbody}>
                    {verificationData?.materialVerifications.map((mv) => (
                      <ExpandableRow
                        key={mv.materialId}
                        expandContent={
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <div className="text-[11px] font-bold text-slate-700 mb-2">历史相似物料报价</div>
                              <div className="space-y-1.5">
                                {mv.similarItems.map((si, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white rounded px-2.5 py-1.5 border border-slate-200">
                                    <span className="text-[11px] text-slate-600">{si.source}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-[11px] font-medium">¥{si.price.toFixed(2)}</span>
                                      <span className="text-[10px] text-slate-400">{si.date}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] font-bold text-slate-700 mb-2">校验特征匹配详情</div>
                              <div className="space-y-1.5">
                                {mv.characteristics.map((c, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white rounded px-2.5 py-1.5 border border-slate-200">
                                    <span className="text-[11px] text-slate-600">{c}</span>
                                    <CheckCircle size={12} className="text-emerald-500" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <td className={`${tableStyles.td} font-mono font-medium`}>{mv.partNo}</td>
                        <td className={`${tableStyles.td} font-medium text-slate-900`}>{mv.name}</td>
                        <td className={tableStyles.td}>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {mv.characteristicMatch}
                          </span>
                        </td>
                        <td className={`${tableStyles.td} text-right font-medium`}>¥{mv.currentPrice.toFixed(2)}</td>
                        <td className={`${tableStyles.td} text-right text-slate-500`}>¥{mv.benchmarkPrice.toFixed(2)}</td>
                        <td className={`${tableStyles.td} text-right`}><DeviationDisplay deviation={mv.deviation} /></td>
                        <td className={`${tableStyles.td} text-center`}><StatusBadge status={mv.status} /></td>
                        <td className={tableStyles.td}>
                          <div className="flex flex-wrap gap-1">
                            {mv.characteristics.map((c, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                      </ExpandableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ========== Tab: Process Verification ========== */}
          <TabsContent value="verify-process" activeValue={activeTab}>
            <div className="p-4 space-y-4">
              <div className={tableStyles.container}>
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th className={`${tableStyles.th} w-16`}>工序号</th>
                      <th className={`${tableStyles.th} min-w-[120px]`}>工序名称</th>
                      <th className={`${tableStyles.th} w-28 text-right`}>当前成本 (¥)</th>
                      <th className={`${tableStyles.th} w-28 text-right`}>基准成本 (¥)</th>
                      <th className={`${tableStyles.th} w-20 text-right`}>偏差</th>
                      <th className={`${tableStyles.th} w-20 text-center`}>状态</th>
                      <th className={`${tableStyles.th} min-w-[200px]`}>相似工序参考</th>
                      <th className={`${tableStyles.th} w-12 text-center`}></th>
                    </tr>
                  </thead>
                  <tbody className={tableStyles.tbody}>
                    {verificationData?.processVerifications.map((pv) => (
                      <ExpandableRow
                        key={pv.processId}
                        expandContent={
                          <div>
                            <div className="text-[11px] font-bold text-slate-700 mb-2">相似工序详细对比</div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                              {pv.similarProcesses.map((sp, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded px-3 py-2 border border-slate-200">
                                  <span className="text-[11px] text-slate-600">{sp.source}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-slate-400">MHR: ¥{sp.mhr}/h</span>
                                    <span className="text-[11px] font-medium">成本: ¥{sp.cost.toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        }
                      >
                        <td className={`${tableStyles.td} font-bold font-mono`}>{pv.opNo}</td>
                        <td className={`${tableStyles.td} font-medium text-slate-900`}>{pv.name}</td>
                        <td className={`${tableStyles.td} text-right font-medium`}>¥{pv.currentCost.toFixed(2)}</td>
                        <td className={`${tableStyles.td} text-right text-slate-500`}>¥{pv.benchmarkCost.toFixed(2)}</td>
                        <td className={`${tableStyles.td} text-right`}><DeviationDisplay deviation={pv.deviation} /></td>
                        <td className={`${tableStyles.td} text-center`}><StatusBadge status={pv.status} /></td>
                        <td className={tableStyles.td}>
                          <div className="flex flex-wrap gap-1.5">
                            {pv.similarProcesses.map((sp, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                                {sp.source}: ¥{sp.cost.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </ExpandableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ========== Tab: Investment Verification ========== */}
          <TabsContent value="verify-investment" activeValue={activeTab}>
            <div className="p-4 space-y-4">
              {/* Characteristic Criteria Reference for Investment */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-amber-800 mb-1.5">投资项校验基准 · 特征维度</div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-[11px] text-amber-700">
                      <span><strong>模具 (Mold)：</strong>产品类别 / 外观尺寸 / 寿命等</span>
                      <span><strong>检具 (Gauge)：</strong>材料 / 重量 / 定位特征</span>
                      <span><strong>工装 / 夹具：</strong>功能模块 / 复杂度</span>
                    </div>
                    <p className="text-[10px] text-amber-500 mt-1.5">系统基于以上特征维度匹配历史投资项数据，确保投资报价无 buffer</p>
                  </div>
                </div>
              </div>

              {(verificationData?.investmentVerifications.length || 0) === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Layers size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-slate-600 mb-1">暂无投资项</p>
                  <p className="text-xs text-slate-400">请先在 BOM 管理页面添加投资项</p>
                </div>
              ) : (
                <div className={tableStyles.container}>
                  <table className={tableStyles.table}>
                    <thead className={tableStyles.thead}>
                      <tr>
                        <th className={`${tableStyles.th} w-20`}>类型</th>
                        <th className={`${tableStyles.th} min-w-[120px]`}>名称</th>
                        <th className={`${tableStyles.th} w-28 text-right`}>当前金额 (¥)</th>
                        <th className={`${tableStyles.th} w-28 text-right`}>基准金额 (¥)</th>
                        <th className={`${tableStyles.th} w-20 text-right`}>偏差</th>
                        <th className={`${tableStyles.th} w-20 text-center`}>状态</th>
                        <th className={`${tableStyles.th} min-w-[200px]`}>匹配特征</th>
                        <th className={`${tableStyles.th} w-12 text-center`}></th>
                      </tr>
                    </thead>
                    <tbody className={tableStyles.tbody}>
                      {verificationData?.investmentVerifications.map((iv) => (
                        <ExpandableRow
                          key={iv.itemId}
                          expandContent={
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <div className="text-[11px] font-bold text-slate-700 mb-2">特征匹配详情</div>
                                <div className="space-y-1.5">
                                  {Object.entries(iv.matchedCharacteristics).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between bg-white rounded px-2.5 py-1.5 border border-slate-200">
                                      <span className="text-[11px] text-slate-600 font-medium">{key}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-900">{value}</span>
                                        <CheckCircle size={12} className="text-emerald-500" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] font-bold text-slate-700 mb-2">历史相似投资项</div>
                                <div className="space-y-1.5">
                                  {iv.similarItems.map((si, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded px-2.5 py-1.5 border border-slate-200">
                                      <div>
                                        <span className="text-[11px] text-slate-700">{si.source}</span>
                                        <span className="text-[10px] text-slate-400 ml-2">{si.specs}</span>
                                      </div>
                                      <span className="text-[11px] font-medium">¥{si.amount.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <td className={tableStyles.td}>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                              iv.type === 'MOLD' ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : iv.type === 'GAUGE' ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                : iv.type === 'JIG' ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : 'bg-pink-50 text-pink-700 border-pink-200'
                            }`}>
                              {INVESTMENT_TYPE_CRITERIA[iv.type] || iv.type}
                            </span>
                          </td>
                          <td className={`${tableStyles.td} font-medium text-slate-900`}>{iv.name}</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{iv.currentAmount.toLocaleString()}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>¥{iv.benchmarkAmount.toLocaleString()}</td>
                          <td className={`${tableStyles.td} text-right`}><DeviationDisplay deviation={iv.deviation} /></td>
                          <td className={`${tableStyles.td} text-center`}><StatusBadge status={iv.status} /></td>
                          <td className={tableStyles.td}>
                            <div className="flex flex-wrap gap-1">
                              {iv.characteristics.map((c, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                        </ExpandableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ==================== VM Confirmation Footer ==================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        {!vmConfirmed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                verificationSummary.high > 0
                  ? 'bg-red-100 text-red-600'
                  : verificationSummary.warning > 0
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
              }`}>
                <Shield size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {verificationSummary.high > 0
                    ? `发现 ${verificationSummary.high} 项价格偏高预警`
                    : verificationSummary.warning > 0
                      ? `${verificationSummary.warning} 项需关注`
                      : '所有成本项校验通过'}
                </div>
                <div className="text-xs text-slate-500">
                  VM 确认后将通知 Sales 进行商业参数输入与报价
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <FileText size={14} />
                导出校验报告
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                onClick={() => setShowConfirmDialog(true)}
              >
                <Send size={14} />
                VM 确认并提交 Sales
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-700">成本已确认，已通知 Sales</div>
                <div className="text-xs text-slate-500">
                  HK III 制造成本: ¥{currentCosts.hk3Cost.toFixed(2)} · 确认时间: {new Date().toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-slate-500"
              onClick={() => onVmRevoke?.()}
            >
              撤回确认
            </Button>
          </div>
        )}
      </div>

      {/* ==================== Confirm Dialog ==================== */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">确认提交成本</h3>
                <p className="text-sm text-slate-500">将通知 Sales 进行报价</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">产品</span>
                <span className="font-medium">{activeProduct.id} - {activeProduct.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">HK III 制造成本</span>
                <span className="font-bold text-blue-700">¥{currentCosts.hk3Cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">校验结果</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">{verificationSummary.normal} 正常</span>
                  <span className="text-amber-600">{verificationSummary.warning} 关注</span>
                  <span className="text-red-600">{verificationSummary.high} 偏高</span>
                </div>
              </div>
            </div>

            {verificationSummary.high > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={16} />
                  <div className="text-sm text-red-800">
                    <strong>注意：</strong>存在 {verificationSummary.high} 项价格偏高预警。确认提交表示 VM 已审核并接受当前成本。
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirmDialog(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  onVmConfirm?.();
                  setShowConfirmDialog(false);
                }}
              >
                确认提交
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
