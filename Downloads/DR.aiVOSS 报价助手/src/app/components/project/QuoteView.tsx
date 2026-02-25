import React, { useMemo } from 'react';
import {
  Calculator, DollarSign, AlertTriangle, CheckCircle,
  FileText, Download, BarChart3, Layers, Settings, Lock
} from 'lucide-react';
import { Button, Badge, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/shared';
import { Product, Project } from '../../pages/ProjectDetail';
import { SalesParams, calcProductCosts, calcSK, calcYearlyData, aggregateInvestmentByGroup, fmt, DEFAULT_SALES_PARAMS } from './costCalc';

// ==================== Types ====================

interface QuoteViewProps {
  products: Product[];
  project: Project;
  vmConfirmed: boolean;
  salesParams?: SalesParams;
  onSalesParamsChange: (params: SalesParams) => void;
  onNavigate?: (tab: string) => void;
}

// ==================== Styles ====================

const tableStyles = {
  container: 'w-full overflow-x-auto border border-slate-200 rounded-md bg-white',
  table: 'w-full text-[12px] text-left border-collapse',
  thead: 'bg-slate-50 text-slate-500 sticky top-0 z-10',
  th: 'px-3 py-2 font-medium border-b border-slate-200 whitespace-nowrap',
  tbody: 'divide-y divide-slate-100',
  tr: 'hover:bg-slate-50 transition-colors',
  td: 'px-3 py-2 align-middle border-b border-slate-50',
};

// ==================== Component ====================

export function QuoteView({ products = [], project, vmConfirmed, salesParams = DEFAULT_SALES_PARAMS, onSalesParamsChange, onNavigate }: QuoteViewProps) {
  const [activeTab, setActiveTab] = React.useState<string>('params');
  const [selectedProductId, setSelectedProductId] = React.useState<string>('');

  // Initialize selected product
  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Get active product
  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Use product-specific salesParams if available, otherwise use project-level params
  const params: SalesParams = activeProduct?.salesParams ? {
    ...DEFAULT_SALES_PARAMS,
    ...activeProduct.salesParams,
  } : {
    ...DEFAULT_SALES_PARAMS,
    ...salesParams,
  };

  const updateParam = (key: keyof SalesParams, value: number | string | any) => {
    if (activeProduct) {
      // Update product-specific params
      const updatedParams = { ...params, [key]: value };
      // This would trigger a parent component update to save the params to the product
      // For now, we'll call the parent's onSalesParamsChange
      onSalesParamsChange(updatedParams);
    } else {
      // Fallback to project-level params
      onSalesParamsChange({ ...params, [key]: value });
    }
  };

  // ========== Calculations (per product) ==========
  const productCosts = useMemo(() => {
    if (!activeProduct) return [];
    return calcProductCosts([activeProduct]);
  }, [activeProduct]);
  
  const totalHK3 = productCosts.reduce((s, c) => s + c.hk3, 0);
  const totalInvestment = productCosts.reduce((s, c) => s + c.totalInvestment, 0);
  const totalRnD = productCosts.reduce((s, c) => s + c.totalRnD, 0);
  const investmentByGroup = useMemo(() => aggregateInvestmentByGroup(productCosts), [productCosts]);
  const skCalc = useMemo(() => calcSK(totalHK3, totalInvestment, totalRnD, investmentByGroup, params), [totalHK3, totalInvestment, totalRnD, investmentByGroup, params]);
  
  // Use product-specific annualVolume if available, otherwise use project-level
  const annualVolume = activeProduct?.annualVolume || project.annualVolume;
  const yearlyData = useMemo(() => calcYearlyData(params, productCosts, skCalc, annualVolume), [params, productCosts, skCalc, annualVolume]);

  // DB4 summary for the first year
  const firstYearDB4 = yearlyData.length > 0 ? yearlyData[0].db4Rate : 0;
  const overallMarginRate = params.quotedPrice > 0 ? ((params.quotedPrice - skCalc.sk2) / params.quotedPrice) * 100 : 0;

  // ========== Not Ready State ==========
  if (!vmConfirmed || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Lock className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">等待 VM 确认成本</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          VM 需先在"成本核算"页面完成 HK III 制造成本校验并确认提交后，Sales 方可进入报价汇总输入商业参数。
        </p>
      </div>
    );
  }

  const warningBg = (w: 'red' | 'yellow' | 'green') =>
    w === 'red' ? 'bg-red-50' : w === 'yellow' ? 'bg-amber-50' : '';
  const warningText = (w: 'red' | 'yellow' | 'green') =>
    w === 'red' ? 'text-red-700' : w === 'yellow' ? 'text-amber-700' : 'text-slate-700';

  return (
    <div className="flex flex-col gap-4">
      {/* ==================== Header ==================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-slate-900" />
              <h2 className="text-base font-bold text-slate-900">报价汇总 · Quotation Summary</h2>
              <Badge variant="success" className="text-[10px] gap-1">
                <CheckCircle size={10} /> VM 成本已确认
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {project.projectCode} · {project.customerName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right px-3 border-r border-slate-200">
              <div className="text-[10px] text-slate-500 font-medium mb-0.5">HK III</div>
              <div className="text-sm font-bold text-blue-700">¥{fmt(totalHK3)}</div>
            </div>
            <div className="text-right px-3 border-r border-slate-200">
              <div className="text-[10px] text-slate-500 font-medium mb-0.5">SK-2</div>
              <div className="text-sm font-bold text-purple-700">¥{fmt(skCalc.sk2)}</div>
            </div>
            <div className="text-right px-3">
              <div className="text-[10px] text-slate-500 font-medium mb-0.5">报价单价</div>
              <div className="text-sm font-bold text-emerald-700">¥{fmt(params.quotedPrice)}</div>
            </div>
          </div>
        </div>
        
        {/* Product Selector */}
        {products.length > 1 && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-600 whitespace-nowrap">选择产品:</span>
            <div className="flex gap-2 flex-wrap">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                    ${selectedProductId === product.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }
                  `}
                >
                  {product.id}
                  {product.annualVolume && (
                    <span className="ml-1.5 opacity-75">({product.annualVolume.toLocaleString()} 件/年)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================== Summary Cards ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 mb-1"><Calculator size={12} /> HK III</div>
          <div className="text-lg font-bold text-slate-900">¥{fmt(totalHK3)}</div>
          <div className="text-[10px] text-slate-400">制造成本</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 mb-1"><DollarSign size={12} /> SK-1</div>
          <div className="text-lg font-bold text-slate-900">¥{fmt(skCalc.sk1)}</div>
          <div className="text-[10px] text-slate-400">含管销</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-purple-600 mb-1"><Layers size={12} /> SK-2</div>
          <div className="text-lg font-bold text-slate-900">¥{fmt(skCalc.sk2)}</div>
          <div className="text-[10px] text-slate-400">完全成本</div>
        </div>
        <div className={`rounded-lg border p-3 shadow-sm ${overallMarginRate >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold mb-1">
            <DollarSign size={12} className={overallMarginRate >= 0 ? 'text-emerald-600' : 'text-red-600'} />
            <span className={overallMarginRate >= 0 ? 'text-emerald-700' : 'text-red-700'}>单件利润</span>
          </div>
          <div className={`text-lg font-bold ${overallMarginRate >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
            ¥{fmt(params.quotedPrice - skCalc.sk2)}
          </div>
          <div className={`text-[10px] ${overallMarginRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(overallMarginRate, 1)}%</div>
        </div>
        <div className={`rounded-lg border p-3 shadow-sm ${
          yearlyData.some(y => y.warning === 'red') ? 'bg-red-50 border-red-200'
            : yearlyData.some(y => y.warning === 'yellow') ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold mb-1">
            {yearlyData.some(y => y.warning !== 'green')
              ? <AlertTriangle size={12} className="text-amber-600" />
              : <CheckCircle size={12} className="text-emerald-600" />
            }
            <span className="text-slate-700">QS 预警</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{fmt(firstYearDB4, 1)}%</div>
          <div className="text-[10px] text-slate-400">首年 DB4</div>
        </div>
      </div>

      {/* ==================== Main Content ==================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <Tabs>
          <div className="border-b border-slate-200 px-4">
            <TabsList className="h-11 px-[4px] py-[8px] mx-[0px] my-[14px]">
              <TabsTrigger value="params" activeValue={activeTab} setActiveValue={setActiveTab}>
                商业参数
              </TabsTrigger>
              <TabsTrigger value="sk" activeValue={activeTab} setActiveValue={setActiveTab}>
                成本层级 (SK)
              </TabsTrigger>
              <TabsTrigger value="qs" activeValue={activeTab} setActiveValue={setActiveTab}>
                报价汇总 (QS)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ========== Tab: Commercial Parameters ========== */}
          <TabsContent value="params" activeValue={activeTab}>
            <div className="p-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Price & Margin */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <DollarSign size={14} className="text-blue-600" /> 价格与利润
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">报价单价 (¥/件)</label>
                        <Input type="number" step="0.01" value={params.quotedPrice} onChange={(e) => updateParam('quotedPrice', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">汇率 (CNY)</label>
                        <Input type="number" step="0.01" value={params.exchangeRate} onChange={(e) => updateParam('exchangeRate', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      
                      {/* 年降参数 - 细化为三个字段 */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">年降比例 (%/年)</label>
                        <Input type="number" step="0.1" value={params.annualReductionRate} onChange={(e) => updateParam('annualReductionRate', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">年降年限 (年)</label>
                        <Input type="number" step="1" value={params.annualReductionYears} onChange={(e) => updateParam('annualReductionYears', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">开始年份 (第几年)</label>
                        <Input type="number" step="1" value={params.annualReductionStartYear} onChange={(e) => updateParam('annualReductionStartYear', parseInt(e.target.value) || 1)} className="h-9 text-sm" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">目标利润率 (%)</label>
                        <Input type="number" step="0.1" value={params.targetMargin} onChange={(e) => updateParam('targetMargin', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">付款账期 (天)</label>
                        <Input type="number" value={params.paymentTermsDays} onChange={(e) => updateParam('paymentTermsDays', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">管销费率 (%)</label>
                        <Input type="number" step="0.1" value={params.saRate} onChange={(e) => updateParam('saRate', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">营运资金利率 (%)</label>
                        <Input type="number" step="0.1" value={params.interestRate} onChange={(e) => updateParam('interestRate', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-slate-600">物流费率 (%)</label>
                        <Input type="number" step="0.1" value={params.logisticsRate} onChange={(e) => updateParam('logisticsRate', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Amortization Strategy */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Settings size={14} className="text-amber-600" /> 分摊策略配置
                    </h3>
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium text-slate-600">投资分摊模式</label>
                        <div className="space-y-2">
                          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${params.amortizationMode === 'UPFRONT' ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <input type="radio" name="amortMode" checked={params.amortizationMode === 'UPFRONT'} onChange={() => updateParam('amortizationMode', 'UPFRONT')} className="mt-0.5" />
                            <div>
                              <div className="text-[12px] font-medium text-slate-900">一次性支付 (Upfront)</div>
                              <div className="text-[10px] text-slate-500">客户单独支付投资费用，不计入零件单价</div>
                            </div>
                          </label>
                          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${params.amortizationMode === 'AMORTIZED' ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <input type="radio" name="amortMode" checked={params.amortizationMode === 'AMORTIZED'} onChange={() => updateParam('amortizationMode', 'AMORTIZED')} className="mt-0.5" />
                            <div>
                              <div className="text-[12px] font-medium text-slate-900">分摊进单价 (Amortized)</div>
                              <div className="text-[10px] text-slate-500">投资费用分摊到零件单价中，含资本利息</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-slate-600">分摊年限 (年)</label>
                          <Input type="number" value={params.amortizationYears} onChange={(e) => updateParam('amortizationYears', parseInt(e.target.value) || 0)} disabled={params.amortizationMode === 'UPFRONT'} className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-slate-600">分摊基数 (件)</label>
                          <Input type="number" value={params.amortizationVolume} onChange={(e) => updateParam('amortizationVolume', parseInt(e.target.value) || 0)} disabled={params.amortizationMode === 'UPFRONT'} className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium text-slate-600">资本利率 (%)</label>
                          <Input type="number" step="0.1" value={params.capitalInterestRate} onChange={(e) => updateParam('capitalInterestRate', parseFloat(e.target.value) || 0)} disabled={params.amortizationMode === 'UPFRONT'} className="h-9 text-sm" />
                        </div>
                      </div>

                      {params.amortizationMode === 'AMORTIZED' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                          <div className="text-[11px] font-bold text-amber-800 mb-2">分摊计算预览</div>
                          <div className="space-y-1 text-[11px] text-amber-700">
                            <div className="flex justify-between"><span>含息因子</span><span className="font-medium">{fmt(skCalc.interestFactor)}</span></div>
                            <div className="flex justify-between"><span>投资含息总额</span><span className="font-medium">¥{skCalc.investmentWithInterest.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between"><span>研发含息总额</span><span className="font-medium">¥{skCalc.rndWithInterest.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                            <div className="flex justify-between pt-1.5 border-t border-amber-300 font-bold"><span>预计单件分摊额</span><span className="text-amber-900">¥{fmt(skCalc.unitTooling + skCalc.unitRnD)}</span></div>
                          </div>
                        </div>
                      )}
                      
                      {/* 分摊组详细配置 */}
                      {params.amortizationMode === 'AMORTIZED' && (
                        <div className="space-y-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-medium text-slate-700">分摊组详细配置</label>
                            <span className="text-[10px] text-slate-400">资本利率: {params.capitalInterestRate}%</span>
                          </div>
                          <div className="space-y-2">
                            {params.amortizationGroups.map((group, index) => {
                              const groupAmount = investmentByGroup[group.id] || 0;
                              const groupInterestFactor = 1 + (params.capitalInterestRate / 100) * group.years;
                              const groupWithInterest = groupAmount * groupInterestFactor;
                              const unitAmort = group.volume > 0 ? groupWithInterest / group.volume : 0;
                              
                              const colorMap: Record<string, string> = {
                                'tooling1': 'blue',
                                'tooling2': 'purple',
                                'rnd': 'emerald'
                              };
                              const color = colorMap[group.id] || 'slate';
                              
                              return (
                                <div key={group.id} className={`bg-white border border-${color}-200 rounded-lg p-3 space-y-2`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold text-${color}-700`}>{group.name}</span>
                                    {groupAmount > 0 && (
                                      <span className="text-[10px] text-slate-500">投资额: ¥{groupAmount.toLocaleString()}</span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] text-slate-500 mb-1 block">分摊年限 (年)</label>
                                      <Input 
                                        type="number" 
                                        min="1" 
                                        step="1"
                                        value={group.years} 
                                        onChange={(e) => {
                                          const newGroups = [...params.amortizationGroups];
                                          newGroups[index] = { ...group, years: parseInt(e.target.value) || 1 };
                                          onSalesParamsChange({ ...params, amortizationGroups: newGroups });
                                        }} 
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 mb-1 block">分摊基数 (件)</label>
                                      <Input 
                                        type="number" 
                                        min="1" 
                                        step="1000"
                                        value={group.volume} 
                                        onChange={(e) => {
                                          const newGroups = [...params.amortizationGroups];
                                          newGroups[index] = { ...group, volume: parseInt(e.target.value) || 1 };
                                          onSalesParamsChange({ ...params, amortizationGroups: newGroups });
                                        }} 
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>
                                  {groupAmount > 0 && (
                                    <div className={`bg-${color}-50 rounded px-2 py-1.5 space-y-0.5`}>
                                      <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-600">含息总额:</span>
                                        <span className="font-medium text-slate-700">¥{groupWithInterest.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</span>
                                      </div>
                                      <div className="flex justify-between text-[10px]">
                                        <span className={`text-${color}-700 font-bold`}>单件分摊:</span>
                                        <span className={`font-bold text-${color}-800`}>¥{fmt(unitAmort)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ========== Tab: SK Cost Hierarchy ========== */}
          <TabsContent value="sk" activeValue={activeTab}>
            <div className="p-4">
              <div className={tableStyles.container}>
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th className={`${tableStyles.th} min-w-[200px]`}>成本项</th>
                      <th className={`${tableStyles.th} w-32 text-right`}>单件成本 (¥)</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>占 SK-2 比</th>
                      <th className={tableStyles.th}>计算说明</th>
                    </tr>
                  </thead>
                  <tbody className={tableStyles.tbody}>
                    {productCosts.flatMap((pc) => [
                        <tr key={`${pc.productId}-mat`} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} pl-6 font-medium text-blue-700`}>物料成本 ({pc.productId})</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(pc.materialCost)}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>{skCalc.sk2 > 0 ? fmt((pc.materialCost / skCalc.sk2) * 100, 1) : 0}%</td>
                          <td className={`${tableStyles.td} text-slate-500`}>{products.find(p => p.id === pc.productId)?.materials.length || 0} 项物料汇总</td>
                        </tr>,
                        <tr key={`${pc.productId}-proc`} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} pl-6 font-medium text-purple-700`}>工艺成本 ({pc.productId})</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(pc.processCost)}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>{skCalc.sk2 > 0 ? fmt((pc.processCost / skCalc.sk2) * 100, 1) : 0}%</td>
                          <td className={`${tableStyles.td} text-slate-500`}>{products.find(p => p.id === pc.productId)?.processes.length || 0} 道工序汇总</td>
                        </tr>,
                    ])}
                    <tr className="bg-blue-50/60">
                      <td className={`${tableStyles.td} font-bold text-blue-900`}>HK III (制造成本)</td>
                      <td className={`${tableStyles.td} text-right font-bold text-blue-900`}>¥{fmt(totalHK3)}</td>
                      <td className={`${tableStyles.td} text-right text-blue-700 font-medium`}>{skCalc.sk2 > 0 ? fmt((totalHK3 / skCalc.sk2) * 100, 1) : 0}%</td>
                      <td className={`${tableStyles.td} text-blue-700`}>= 物料成本 + 工艺成本</td>
                    </tr>
                    <tr className={tableStyles.tr}>
                      <td className={`${tableStyles.td} pl-6 font-medium`}>管销费用 (S&A)</td>
                      <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(skCalc.saCost)}</td>
                      <td className={`${tableStyles.td} text-right text-slate-500`}>{skCalc.sk2 > 0 ? fmt((skCalc.saCost / skCalc.sk2) * 100, 1) : 0}%</td>
                      <td className={`${tableStyles.td} text-slate-500`}>¥{fmt(params.quotedPrice)} × {params.saRate}%</td>
                    </tr>
                    <tr className="bg-emerald-50/60">
                      <td className={`${tableStyles.td} font-bold text-emerald-900`}>SK-1 (含管销)</td>
                      <td className={`${tableStyles.td} text-right font-bold text-emerald-900`}>¥{fmt(skCalc.sk1)}</td>
                      <td className={`${tableStyles.td} text-right text-emerald-700 font-medium`}>{skCalc.sk2 > 0 ? fmt((skCalc.sk1 / skCalc.sk2) * 100, 1) : 0}%</td>
                      <td className={`${tableStyles.td} text-emerald-700`}>= HK III + S&A</td>
                    </tr>
                    
                    {/* 分组分摊 - 动态渲染每个组 */}
                    {params.amortizationGroups.map((group) => {
                      const groupAmount = investmentByGroup[group.id] || 0;
                      const unitAmort = skCalc.unitAmortByGroup[group.id] || 0;
                      const groupInterestFactor = 1 + (params.capitalInterestRate / 100) * group.years;
                      const colorMap: Record<string, string> = {
                        'tooling1': 'amber',
                        'tooling2': 'purple',
                        'rnd': 'teal'
                      };
                      const color = colorMap[group.id] || 'slate';
                      
                      return groupAmount > 0 || params.amortizationMode === 'AMORTIZED' ? (
                        <tr key={group.id} className={tableStyles.tr}>
                          <td className={`${tableStyles.td} pl-6 font-medium text-${color}-700`}>
                            {group.name} 分摊
                          </td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(unitAmort)}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>
                            {skCalc.sk2 > 0 ? fmt((unitAmort / skCalc.sk2) * 100, 1) : 0}%
                          </td>
                          <td className={`${tableStyles.td} text-slate-500`}>
                            {params.amortizationMode === 'AMORTIZED' 
                              ? `¥${groupAmount.toLocaleString()} × ${fmt(groupInterestFactor)} / ${group.volume.toLocaleString()}件，${group.years}年` 
                              : '一次性支付'}
                          </td>
                        </tr>
                      ) : null;
                    })}
                    
                    {/* 保留向后兼容的合计行（如果没有分组数据时显示） */}
                    {Object.keys(skCalc.unitAmortByGroup).length === 0 && (
                      <>
                        <tr className={tableStyles.tr}>
                          <td className={`${tableStyles.td} pl-6 font-medium text-amber-700`}>投资分摊 (Tooling)</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(skCalc.unitTooling)}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>{skCalc.sk2 > 0 ? fmt((skCalc.unitTooling / skCalc.sk2) * 100, 1) : 0}%</td>
                          <td className={`${tableStyles.td} text-slate-500`}>{params.amortizationMode === 'AMORTIZED' ? `¥${totalInvestment.toLocaleString()} × ${fmt(skCalc.interestFactor)} / ${params.amortizationVolume.toLocaleString()}件` : '一次性支付'}</td>
                        </tr>
                        <tr className={tableStyles.tr}>
                          <td className={`${tableStyles.td} pl-6 font-medium text-teal-700`}>研发分摊 (R&D)</td>
                          <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(skCalc.unitRnD)}</td>
                          <td className={`${tableStyles.td} text-right text-slate-500`}>{skCalc.sk2 > 0 ? fmt((skCalc.unitRnD / skCalc.sk2) * 100, 1) : 0}%</td>
                          <td className={`${tableStyles.td} text-slate-500`}>{params.amortizationMode === 'AMORTIZED' ? `¥${totalRnD.toLocaleString()} × ${fmt(skCalc.interestFactor)} / ${params.amortizationVolume.toLocaleString()}件` : '一次性支付'}</td>
                        </tr>
                      </>
                    )}
                    <tr className={tableStyles.tr}>
                      <td className={`${tableStyles.td} pl-6 font-medium`}>营运资金利息</td>
                      <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(skCalc.workingCapInterest)}</td>
                      <td className={`${tableStyles.td} text-right text-slate-500`}>{skCalc.sk2 > 0 ? fmt((skCalc.workingCapInterest / skCalc.sk2) * 100, 1) : 0}%</td>
                      <td className={`${tableStyles.td} text-slate-500`}>VP × {params.interestRate}% × ({params.paymentTermsDays}/360)</td>
                    </tr>
                    <tr className={tableStyles.tr}>
                      <td className={`${tableStyles.td} pl-6 font-medium`}>物流费用</td>
                      <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(skCalc.logistics)}</td>
                      <td className={`${tableStyles.td} text-right text-slate-500`}>{skCalc.sk2 > 0 ? fmt((skCalc.logistics / skCalc.sk2) * 100, 1) : 0}%</td>
                      <td className={`${tableStyles.td} text-slate-500`}>HK III × {params.logisticsRate}%</td>
                    </tr>
                    <tr className="bg-gradient-to-r from-purple-100/80 to-indigo-100/80">
                      <td className={`${tableStyles.td} font-bold text-purple-900 text-[13px]`}>SK-2 (单件总成本)</td>
                      <td className={`${tableStyles.td} text-right font-bold text-purple-900 text-[13px]`}>¥{fmt(skCalc.sk2)}</td>
                      <td className={`${tableStyles.td} text-right font-bold text-purple-800`}>100%</td>
                      <td className={`${tableStyles.td} text-purple-700 font-medium`}>= SK-1 + Tooling + R&D + WC + Logistics</td>
                    </tr>
                    <tr className={`${params.quotedPrice > skCalc.sk2 ? 'bg-emerald-50/60' : 'bg-red-50/60'}`}>
                      <td className={`${tableStyles.td} font-bold ${params.quotedPrice > skCalc.sk2 ? 'text-emerald-900' : 'text-red-900'}`}>单件利润 (VP - SK-2)</td>
                      <td className={`${tableStyles.td} text-right font-bold ${params.quotedPrice > skCalc.sk2 ? 'text-emerald-800' : 'text-red-800'}`}>¥{fmt(params.quotedPrice - skCalc.sk2)}</td>
                      <td className={`${tableStyles.td} text-right font-bold ${params.quotedPrice > skCalc.sk2 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(overallMarginRate, 1)}%</td>
                      <td className={`${tableStyles.td} ${params.quotedPrice > skCalc.sk2 ? 'text-emerald-700' : 'text-red-700'} font-medium`}>{params.quotedPrice > skCalc.sk2 ? '盈利' : '亏损'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ========== Tab: QS Yearly ========== */}
          <TabsContent value="qs" activeValue={activeTab}>
            <div className="p-4 space-y-4">
              {yearlyData.some(y => y.warning === 'red') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>注意！</strong>部分年度 DB4 低于 -5%，存在严重亏损风险。请确认是否包含战略意图（如市场份额获取、客户关系维护）。
                  </div>
                </div>
              )}
              <div className={tableStyles.container}>
                <table className={tableStyles.table}>
                  <thead className={tableStyles.thead}>
                    <tr>
                      <th className={`${tableStyles.th} w-16`}>年份</th>
                      <th className={`${tableStyles.th} w-20 text-right`}>产量</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>VP (¥)</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>HK3 (¥)</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>SK-1 (¥)</th>
                      
                      {/* 动态显示分摊组列 */}
                      {params.amortizationGroups.map((group) => (
                        <th key={group.id} className={`${tableStyles.th} w-20 text-right`}>
                          {group.name} (¥)
                        </th>
                      ))}
                      
                      <th className={`${tableStyles.th} w-20 text-right`}>WC (¥)</th>
                      <th className={`${tableStyles.th} w-24 text-right`}>SK-2 (¥)</th>
                      <th className={`${tableStyles.th} w-20 text-right`}>DB4%</th>
                      <th className={`${tableStyles.th} w-28 text-right`}>DB4 Value (¥)</th>
                      <th className={`${tableStyles.th} w-16 text-center`}>预警</th>
                    </tr>
                  </thead>
                  <tbody className={tableStyles.tbody}>
                    {yearlyData.map(y => {
                      const db4Value = y.db4 * y.volume;
                      return (
                      <tr key={y.year} className={`${tableStyles.tr} ${warningBg(y.warning)}`}>
                        <td className={`${tableStyles.td} font-bold`}>{y.year}</td>
                        <td className={`${tableStyles.td} text-right`}>{y.volume.toLocaleString()}</td>
                        <td className={`${tableStyles.td} text-right font-medium`}>¥{fmt(y.vp)}</td>
                        <td className={`${tableStyles.td} text-right`}>¥{fmt(y.hk3)}</td>
                        <td className={`${tableStyles.td} text-right`}>¥{fmt(y.sk1)}</td>
                        
                        {/* 动态显示每个分摊组的金额 */}
                        {params.amortizationGroups.map((group) => {
                          const groupAmort = y.amortByGroup[group.id] || 0;
                          return (
                            <td key={group.id} className={`${tableStyles.td} text-right`}>
                              ¥{fmt(groupAmort)}
                            </td>
                          );
                        })}
                        
                        <td className={`${tableStyles.td} text-right`}>¥{fmt(y.workingCap)}</td>
                        <td className={`${tableStyles.td} text-right font-bold`}>¥{fmt(y.sk2)}</td>
                        <td className={`${tableStyles.td} text-right font-bold ${warningText(y.warning)}`}>{fmt(y.db4Rate, 1)}%</td>
                        <td className={`${tableStyles.td} text-right font-medium ${db4Value >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          ¥{db4Value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className={`${tableStyles.td} text-center`}>
                          {y.warning === 'red' && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full"><AlertTriangle size={10} /> 高风险</span>}
                          {y.warning === 'yellow' && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full"><AlertTriangle size={10} /> 警告</span>}
                          {y.warning === 'green' && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full"><CheckCircle size={10} /> 正常</span>}
                        </td>
                      </tr>
                      );
                    })}
                    <tr className="bg-slate-50">
                      <td className={`${tableStyles.td} font-bold`}>合计</td>
                      <td className={`${tableStyles.td} text-right font-bold`}>{yearlyData.reduce((s, y) => s + y.volume, 0).toLocaleString()}</td>
                      <td colSpan={3 + params.amortizationGroups.length} className={`${tableStyles.td} text-right font-bold`}>
                        净销售额合计: ¥{yearlyData.reduce((s, y) => s + y.netSales, 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`${tableStyles.td} text-right font-bold`}></td>
                      <td className={`${tableStyles.td} text-right font-bold`}></td>
                      <td className={`${tableStyles.td} text-right font-bold ${yearlyData.reduce((s, y) => s + y.db4 * y.volume, 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        ¥{yearlyData.reduce((s, y) => s + y.db4 * y.volume, 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className={tableStyles.td}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ==================== Footer ==================== */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          商业参数变更实时反映至 QS · 详细 BC 和 Payback 分析请查看对应标签页
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={() => onNavigate('business')}
              >
                查看商业案例 (BC)
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                onClick={() => onNavigate('investment')}
              >
                查看投资回报 (Payback)
              </Button>
            </>
          )}
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"><Download size={14} /> 生成报价单 PDF</Button>
        </div>
      </div>
    </div>
  );
}