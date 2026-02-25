import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, Lock, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/shared';
import { Product, Project } from '../../pages/ProjectDetail';
import {
  SalesParams, calcProductCosts, calcSK, calcYearlyData, calcBC,
  aggregateInvestmentByGroup, PROJECT_YEARS, fmt, fmtK, DEFAULT_SALES_PARAMS,
} from './costCalc';

interface BusinessCaseViewProps {
  products: Product[];
  project: Project;
  vmConfirmed: boolean;
  salesParams?: SalesParams;
}

const tableStyles = {
  container: 'w-full overflow-x-auto border border-slate-200 rounded-md bg-white',
  table: 'w-full text-[12px] text-left border-collapse',
  thead: 'bg-slate-50 text-slate-500 sticky top-0 z-10',
  th: 'px-3 py-2 font-medium border-b border-slate-200 whitespace-nowrap',
  tbody: 'divide-y divide-slate-100',
  tr: 'hover:bg-slate-50 transition-colors',
  td: 'px-3 py-2 align-middle border-b border-slate-50',
};

export function BusinessCaseView({ products = [], project, vmConfirmed, salesParams = DEFAULT_SALES_PARAMS }: BusinessCaseViewProps) {
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
  const investmentByGroup = useMemo(() => aggregateInvestmentByGroup(productCosts), [productCosts]);
  const skCalc = useMemo(() => calcSK(totalHK3, totalInvestment, totalRnD, investmentByGroup, params), [totalHK3, totalInvestment, totalRnD, investmentByGroup, params]);
  
  // Use product-specific annualVolume if available
  const annualVolume = activeProduct?.annualVolume || project.annualVolume;
  const yearlyData = useMemo(() => calcYearlyData(params, productCosts, skCalc, annualVolume), [params, productCosts, skCalc, annualVolume]);
  const bc = useMemo(() => calcBC(yearlyData), [yearlyData]);

  if (!vmConfirmed || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
        <div className="bg-slate-100 p-4 rounded-full mb-4"><Lock className="h-8 w-8 text-slate-400" /></div>
        <h3 className="text-lg font-medium text-slate-900">等待报价汇总完成</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">请先在"报价汇总"页面完成商业参数输入后查看商业案例分析。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-slate-900" />
              <h2 className="text-base font-bold text-slate-900">商业案例 · Business Case</h2>
              <Badge variant="info" className="text-[10px]">{PROJECT_YEARS} 年规划</Badge>
            </div>
            <p className="text-xs text-slate-500">
              {project.projectCode} · 报价单价 ¥{fmt(params.quotedPrice)} · 年降 {params.annualReductionRate}% (第{params.annualReductionStartYear}年开始，持续{params.annualReductionYears}年)
            </p>
          </div>
        </div>
        
        {/* Product Info Cards */}
        {activeProduct && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200">
              <div className="text-[10px] font-semibold text-blue-600 mb-1">产品单价 · Product Price</div>
              <div className="text-lg font-bold text-blue-900">¥{fmt(params.quotedPrice)}</div>
              <div className="text-[9px] text-blue-600 mt-0.5">含税报价</div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-3 border border-emerald-200">
              <div className="text-[10px] font-semibold text-emerald-600 mb-1">产品总量 · Total Volume</div>
              <div className="text-lg font-bold text-emerald-900">{annualVolume.toLocaleString()}</div>
              <div className="text-[9px] text-emerald-600 mt-0.5">件/年</div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3 border border-amber-200">
              <div className="text-[10px] font-semibold text-amber-600 mb-1">商用车 · Commercial</div>
              <div className="text-lg font-bold text-amber-900">
                {activeProduct.vehicleVolumes?.commercialVehicles?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-[9px] text-amber-600 mt-0.5">
                {activeProduct.vehicleVolumes?.commercialVehicles 
                  ? `${((activeProduct.vehicleVolumes.commercialVehicles / annualVolume) * 100).toFixed(0)}%` 
                  : ''}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200">
              <div className="text-[10px] font-semibold text-purple-600 mb-1">乘用车 · Passenger</div>
              <div className="text-lg font-bold text-purple-900">
                {activeProduct.vehicleVolumes?.passengerCars?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-[9px] text-purple-600 mt-0.5">
                {activeProduct.vehicleVolumes?.passengerCars 
                  ? `${((activeProduct.vehicleVolumes.passengerCars / annualVolume) * 100).toFixed(0)}%` 
                  : ''}
              </div>
            </div>
          </div>
        )}
        
        {/* Product Selector */}
        {products.length > 1 && (
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-3">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-[10px] font-bold text-blue-600 mb-1">净销售额 (Net Sales)</div>
          <div className="text-xl font-bold text-blue-900">{fmtK(bc.totalNetSales)}</div>
          <div className="text-[10px] text-blue-500 mt-0.5">{PROJECT_YEARS} 年累计</div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <div className="text-[10px] font-bold text-slate-600 mb-1">HK III 总成本</div>
          <div className="text-xl font-bold text-slate-900">{fmtK(bc.totalHK3All)}</div>
        </div>
        <div className={`rounded-lg border p-4 ${bc.dbIRate >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-[10px] font-bold mb-1 ${bc.dbIRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>DB I (生产毛利)</div>
          <div className={`text-xl font-bold ${bc.dbIRate >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>{fmtK(bc.dbI)}</div>
          <div className={`text-[10px] mt-0.5 ${bc.dbIRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(bc.dbIRate, 1)}%</div>
        </div>
        <div className={`rounded-lg border p-4 ${bc.dbIVRate >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-[10px] font-bold mb-1 ${bc.dbIVRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>DB IV (净利润)</div>
          <div className={`text-xl font-bold ${bc.dbIVRate >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>{fmtK(bc.dbIV)}</div>
          <div className={`text-[10px] mt-0.5 ${bc.dbIVRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(bc.dbIVRate, 1)}%</div>
        </div>
      </div>

      {/* Yearly BC Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={14} className="text-indigo-600" /> 年度商业案例明细
          </h3>
        </div>
        <div className="p-4">
          <div className={tableStyles.container}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={`${tableStyles.th} w-16`}>年份</th>
                  <th className={`${tableStyles.th} w-20 text-right`}>产量</th>
                  <th className={`${tableStyles.th} w-28 text-right`}>Net Sales (¥)</th>
                  <th className={`${tableStyles.th} w-28 text-right`}>HK III (¥)</th>
                  <th className={`${tableStyles.th} w-28 text-right`}>DB I (¥)</th>
                  <th className={`${tableStyles.th} w-20 text-right`}>DB I%</th>
                  <th className={`${tableStyles.th} w-28 text-right`}>SK-2 Total (¥)</th>
                  <th className={`${tableStyles.th} w-28 text-right`}>DB IV (¥)</th>
                  <th className={`${tableStyles.th} w-20 text-right`}>DB IV%</th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {yearlyData.map((y) => {
                  const ySales = y.netSales;
                  const yHK3Total = y.hk3 * y.volume;
                  const yDBI = ySales - yHK3Total;
                  const yDBIRate = ySales > 0 ? (yDBI / ySales) * 100 : 0;
                  const ySK2Total = y.sk2 * y.volume;
                  const yDBIV = ySales - ySK2Total;
                  const yDBIVRate = ySales > 0 ? (yDBIV / ySales) * 100 : 0;
                  return (
                    <tr key={y.year} className={tableStyles.tr}>
                      <td className={`${tableStyles.td} font-bold`}>{y.year}</td>
                      <td className={`${tableStyles.td} text-right`}>{y.volume.toLocaleString()}</td>
                      <td className={`${tableStyles.td} text-right font-medium`}>¥{ySales.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                      <td className={`${tableStyles.td} text-right`}>¥{yHK3Total.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                      <td className={`${tableStyles.td} text-right font-medium ${yDBI >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>¥{yDBI.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                      <td className={`${tableStyles.td} text-right ${yDBIRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(yDBIRate, 1)}%</td>
                      <td className={`${tableStyles.td} text-right`}>¥{ySK2Total.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                      <td className={`${tableStyles.td} text-right font-bold ${yDBIV >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>¥{yDBIV.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                      <td className={`${tableStyles.td} text-right font-bold ${yDBIVRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(yDBIVRate, 1)}%</td>
                    </tr>
                  );
                })}
                {/* Totals */}
                <tr className="bg-slate-50 font-bold">
                  <td className={`${tableStyles.td}`}>合计</td>
                  <td className={`${tableStyles.td} text-right`}>{yearlyData.reduce((s, y) => s + y.volume, 0).toLocaleString()}</td>
                  <td className={`${tableStyles.td} text-right`}>¥{bc.totalNetSales.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                  <td className={`${tableStyles.td} text-right`}>¥{bc.totalHK3All.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                  <td className={`${tableStyles.td} text-right ${bc.dbI >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>¥{bc.dbI.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                  <td className={`${tableStyles.td} text-right ${bc.dbIRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(bc.dbIRate, 1)}%</td>
                  <td className={`${tableStyles.td} text-right`}>¥{bc.totalSK2All.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                  <td className={`${tableStyles.td} text-right ${bc.dbIV >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>¥{bc.dbIV.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</td>
                  <td className={`${tableStyles.td} text-right ${bc.dbIVRate >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(bc.dbIVRate, 1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-500 space-y-1">
        <div><strong>DB I (生产毛利)</strong> = Net Sales − HK III（制造成本），反映生产环节的直接利润</div>
        <div><strong>DB IV (净利润)</strong> = Net Sales − SK-2（完全成本），反映项目整体盈利能力</div>
        <div>以上数据基于"报价汇总"中的商业参数实时计算，参数变更会自动更新本页数据</div>
      </div>
    </div>
  );
}