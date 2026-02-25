import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/shared';
import { Product, Project } from '../../pages/ProjectDetail';
import {
  SalesParams, calcProductCosts, calcSK, calcYearlyData, calcNPV,
  aggregateInvestmentByGroup, fmt, fmtK, DEFAULT_SALES_PARAMS
} from './costCalc';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { motion } from 'motion/react';

interface PaybackViewProps {
  products: Product[];
  project: Project;
  vmConfirmed: boolean;
  salesParams?: SalesParams;
}

export function PaybackView({ products = [], project, vmConfirmed, salesParams = DEFAULT_SALES_PARAMS }: PaybackViewProps) {
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

  // Calculate per product
  const productCosts = useMemo(() => {
    if (!activeProduct) return [];
    return calcProductCosts([activeProduct]);
  }, [activeProduct]);
  
  const totalHK3 = productCosts.reduce((s, c) => s + c.hk3, 0);
  const totalInvestment = productCosts.reduce((s, c) => s + c.totalInvestment, 0);
  const totalRnD = productCosts.reduce((s, c) => s + c.totalRnD, 0);
  const totalProjectInvestment = totalInvestment + totalRnD;
  const investmentByGroup = useMemo(() => aggregateInvestmentByGroup(productCosts), [productCosts]);

  const skCalc = useMemo(() => calcSK(totalHK3, totalInvestment, totalRnD, investmentByGroup, params), [totalHK3, totalInvestment, totalRnD, investmentByGroup, params]);
  
  // Use product-specific annualVolume if available
  const annualVolume = activeProduct?.annualVolume || project.annualVolume;
  const yearlyData = useMemo(() => calcYearlyData(params, productCosts, skCalc, annualVolume), [params, productCosts, skCalc, annualVolume]);

  const npvResult = useMemo(
    () => calcNPV(totalProjectInvestment, yearlyData, params),
    [totalProjectInvestment, yearlyData, params]
  );

  // Calculate Break-even Price Increase
  const breakEvenAnalysis = useMemo(() => {
    // NPV = PV_Revenue - PV_CashOut - Investment
    // We want NPV = 0 => PV_Revenue_New = PV_CashOut + Investment
    // PV_Revenue = Sum(Revenue_i * Discount_i)
    // Since Revenue is proportional to Price, PV_Revenue_New / PV_Revenue_Old = NewPrice / OldPrice
    
    const pvRevenue = npvResult.yearlyData.reduce((sum, d) => sum + (d.cashIn * d.discountFactor), 0);
    const pvCashOut = npvResult.yearlyData.reduce((sum, d) => sum + (d.cashOut * d.discountFactor), 0);
    const pvInv = totalProjectInvestment; // Assuming inv at t=0 has discount factor 1
    
    // Note: calcNPV's yearlyData[0] is initial investment (cashOut), cashIn=0.
    // The loop in calcNPV starts pushing from yearlyData[0] which corresponds to Year 1?
    // Let's check calcNPV logic.
    // year0 is manually added. cashIn=0.
    // Then loop yearlyData (years 1..N).
    // So pvRevenue calculation above works (summing all cashIn * discountFactor).
    // pvCashOut calculation works (summing all cashOut * discountFactor).
    
    // Check if PV_Revenue is 0 to avoid division by zero
    if (pvRevenue <= 0) return { requiredIncrease: 0, impossible: true };

    const targetRevenuePV = pvCashOut + pvInv; // wait, pvCashOut includes the investment?
    // In calcNPV: year0.cashOut = initialInv.
    // So pvCashOut sum INCLUDES initialInv.
    // So targetRevenuePV = pvCashOut. (Because we want PV_In - PV_Out = 0 => PV_In = PV_Out)
    
    const targetPV = pvCashOut; // This includes investment outflow at year 0
    
    const ratio = targetPV / pvRevenue;
    const requiredIncrease = (ratio - 1) * 100;
    
    return { requiredIncrease, impossible: false };
  }, [npvResult, totalProjectInvestment]);

  if (!vmConfirmed || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
        <div className="bg-slate-100 p-4 rounded-full mb-4"><AlertCircle className="h-8 w-8 text-slate-400" /></div>
        <h3 className="text-lg font-medium text-slate-900">等待报价汇总完成</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">请先在"报价汇总"页面完成商业参数输入后查看投资回收分析。</p>
      </div>
    );
  }

  const isProfitable = npvResult.isProfitable;
  const paybackYears = npvResult.paybackYears;
  const paybackText = paybackYears === Infinity ? 'N/A' : `${fmt(paybackYears, 1)} 年`;

  // AI Analysis Logic
  const aiAnalysis = useMemo(() => {
    if (npvResult.npvTotal < 0) {
      const increaseText = breakEvenAnalysis.impossible 
        ? "需大幅调整商业模式" 
        : `提升单价至少 ${breakEvenAnalysis.requiredIncrease.toFixed(1)}%`;
        
      return `项目总投资高达 ${fmtK(totalProjectInvestment)}，当前定价策略下 NPV 为 ${fmtK(npvResult.npvTotal)}，项目面临亏损风险。建议：1. ${increaseText} 以覆盖资本成本；2. 与客户协商，将部分研发验证费用 (${fmtK(totalRnD)}) 改为客户一次性支付 (NRE Paid) 以减少资金占用。`;
    } else if (paybackYears > 3) {
      return `项目 NPV 为正 (${fmtK(npvResult.npvTotal)})，但回收期较长 (${fmt(paybackYears, 1)} 年)。建议：评估客户长期订单稳定性，或优化初期投资结构（如减少首期模具投入）。`;
    } else {
      return `项目财务状况健康，NPV 为 ${fmtK(npvResult.npvTotal)}，预计在 ${fmt(paybackYears, 1)} 年内收回投资。各项指标均在合理范围内。`;
    }
  }, [npvResult, totalProjectInvestment, paybackYears, totalRnD, breakEvenAnalysis]);

  // Chart Data Preparation
  const chartData = npvResult.yearlyData.map(d => ({
    name: d.year === 0 ? '初始投资' : `Year ${d.year}`,
    cashFlow: d.netCashFlow,
    cumulative: d.cumulativeDCF,
    // For visualization
    isPositive: d.netCashFlow >= 0
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">投资回收分析 · Payback & NPV</h2>
              <Badge variant={isProfitable ? "success" : "destructive"} className="text-[10px]">
                {isProfitable ? "项目可行 (NPV > 0)" : "亏损风险 (NPV < 0)"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              基于折现现金流 (DCF) 模型计算项目投资回报 · 折现率 {params?.capitalInterestRate || 6}%
            </p>
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

      {/* Core Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* NPV Card */}
        <div className={`p-5 rounded-xl border-2 transition-colors ${isProfitable ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'}`}>
          <div className="text-sm font-medium text-slate-500 mb-1">净现值 (NPV)</div>
          <div className={`text-3xl font-bold ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmtK(npvResult.npvTotal)}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            {isProfitable ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            {isProfitable ? "投资回报为正" : "投资无法完全回收"}
          </div>
        </div>

        {/* Investment Card */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-slate-500 mb-1">项目总投资</div>
          <div className="text-3xl font-bold text-slate-900">
            {fmtK(totalProjectInvestment)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            含模具/检具/研发/测试等一次性投入
          </div>
        </div>

        {/* Payback Period Card */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-slate-500 mb-1">动态投资回收期</div>
          <div className="text-3xl font-bold text-blue-700">
            {paybackText}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            基于累计折现现金流转正时间点
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
           现金流瀑布图与回收轨迹
           <span className="text-xs font-normal text-slate-400 px-2 py-0.5 bg-slate-100 rounded">
             柱状图: 年度净现金流 (Net Cash Flow) | 折线: 累计折现现金流 (Cumulative DCF)
           </span>
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => `¥${val/10000}w`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(val) => `¥${val/10000}w`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `¥${value.toLocaleString()}`, 
                  name === 'cashFlow' ? '净现金流' : '累计折现现金流'
                ]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#94a3b8" yAxisId="left" />
              
              <Bar yAxisId="left" dataKey="cashFlow" name="年度净现金流" barSize={40} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cashFlow >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
              
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cumulative" 
                name="累计折现现金流" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
          <AlertTriangle className="text-indigo-600 h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            AI 智能体诊断
            <Badge variant="outline" className="text-xs font-normal">Based on Dr.aiVOSS Algorithm</Badge>
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {aiAnalysis}
          </p>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-900">年度现金流明细表</h4>
          <div className="text-xs text-slate-400">折现率: {params?.capitalInterestRate || 6}%</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
              <tr>
                <th className="px-6 py-3">年份</th>
                <th className="px-6 py-3 text-right">现金流入 (Inflow)</th>
                <th className="px-6 py-3 text-right">现金流出 (Outflow)</th>
                <th className="px-6 py-3 text-right">净现金流 (Net)</th>
                <th className="px-6 py-3 text-right">折现系数</th>
                <th className="px-6 py-3 text-right">折现后 (DCF)</th>
                <th className="px-6 py-3 text-right">累计 (Cumulative)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {npvResult.yearlyData.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {row.year === 0 ? '初始投资 (Year 0)' : `Year ${row.year}`}
                  </td>
                  <td className="px-6 py-3 text-right text-emerald-600">
                    {row.cashIn > 0 ? `+${fmtK(row.cashIn)}` : '-'}
                  </td>
                  <td className="px-6 py-3 text-right text-red-600">
                    {row.cashOut > 0 ? `-${fmtK(row.cashOut)}` : '-'}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${row.netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmtK(row.netCashFlow)}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-500 font-mono text-xs">
                    {row.discountFactor.toFixed(3)}
                  </td>
                  <td className="px-6 py-3 text-right text-slate-600">
                    {fmtK(row.discountedCashFlow)}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${row.cumulativeDCF >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmtK(row.cumulativeDCF)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="text-xs text-slate-400 text-center pb-8">
        * 计算逻辑：现金流 = 标准利润 (Standard Profit) + 折旧/摊销回填 (Depreciation) - 当年投资 (Investments)
      </div>
    </motion.div>
  );
}