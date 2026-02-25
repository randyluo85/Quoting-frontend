import { Product } from '../../pages/ProjectDetail';

// ==================== Types ====================

// 分摊组配置
export interface AmortizationGroup {
  id: string; // 组别ID，如 'tooling1', 'tooling2', 'rnd'
  name: string; // 组别名称，如 'Tooling 1', 'Tooling 2', 'R&D'
  years: number; // 分摊年限
  volume: number; // 分摊基数（件数）
  color: string; // 显示颜色
}

export interface SalesParams {
  quotedPrice: number;
  exchangeRate: number;
  // 年降参数细化
  annualReductionRate: number; // 年降比例 (%)
  annualReductionYears: number; // 持续降3年
  annualReductionStartYear: number; // 从第2年开始年降（通常第一年不降）
  targetMargin: number;
  paymentTermsDays: number;
  amortizationMode: 'UPFRONT' | 'AMORTIZED';
  amortizationYears: number; // 默认分摊年限（向后兼容）
  amortizationVolume: number; // 默认分摊基数（向后兼容）
  // 分组分摊配置
  amortizationGroups: AmortizationGroup[]; // 多个分摊组
  capitalInterestRate: number;
  interestRate: number; // 年利率（用于营运资金利息），与 capitalInterestRate（投资分摊资本利率）区分
  saRate: number;
  logisticsRate: number;
}

export interface ProductCosts {
  productId: string;
  materialCost: number;
  processCost: number;
  hk3: number;
  totalInvestment: number;
  totalRnD: number;
  // 分组投资金额
  investmentByGroup: Record<string, number>; // 按组别统计投资金额
}

export interface SKCalc {
  interestFactor: number;
  investmentWithInterest: number;
  rndWithInterest: number;
  unitTooling: number;
  unitRnD: number;
  // 分组分摊金额
  unitAmortByGroup: Record<string, number>; // 每个组的单件分摊额
  saCost: number;
  sk1: number;
  workingCapInterest: number;
  logistics: number;
  sk2: number;
}

export interface YearlyData {
  year: number;
  volume: number;
  vp: number;
  netSales: number;
  hk3: number;
  saCost: number;
  sk1: number;
  toolingAmort: number; // 保留向后兼容
  rndAmort: number; // 保留向后兼容
  // 分组分摊金额
  amortByGroup: Record<string, number>; // 每个组的分摊额
  workingCap: number;
  logistics: number;
  sk2: number;
  db4: number;
  db4Rate: number;
  warning: 'red' | 'yellow' | 'green';
}

export interface NPVYearlyData {
  year: number;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  discountFactor: number;
  discountedCashFlow: number;
  cumulativeDCF: number;
}

export interface NPVResult {
  totalInvestment: number;
  npvTotal: number;
  paybackYears: number;
  yearlyData: NPVYearlyData[];
  isProfitable: boolean;
}

export const DEFAULT_SALES_PARAMS: SalesParams = {
  quotedPrice: 68.50, // Adjusted for profitability
  exchangeRate: 7.83,
  annualReductionRate: 3.0,
  annualReductionYears: 3, // 持续降3年
  annualReductionStartYear: 2, // 从第2年开始年降（通常第一年不降）
  targetMargin: 15.0,
  paymentTermsDays: 90,
  amortizationMode: 'AMORTIZED',
  amortizationYears: 2,
  amortizationVolume: 80000, // Based on new ramp-up (Year 1: 30k, Year 2: 50k)
  // 默认分摊组配置
  amortizationGroups: [
    { id: 'tooling1', name: 'Tooling 1', years: 2, volume: 80000, color: 'blue' },
    { id: 'tooling2', name: 'Tooling 2', years: 3, volume: 120000, color: 'purple' },
    { id: 'rnd', name: 'R&D', years: 2, volume: 80000, color: 'emerald' },
  ],
  capitalInterestRate: 6.0,
  interestRate: 5.0,
  saRate: 2.1,
  logisticsRate: 1.0,
};

export const BASE_YEAR = 2026;
export const PROJECT_YEARS = 5;

// ==================== Calculators ====================

export function calcProductCosts(products: Product[]): ProductCosts[] {
  return products.map((product) => {
    const materialCost = product.materials.reduce((acc, m) => acc + m.price * m.qty, 0);
    const processCost = product.processes.reduce((acc, p) => acc + (p.cycleTime / 3600) * p.mhr, 0);
    const hk3 = materialCost + processCost;
    
    // Calculate investment by group
    const investmentByGroup: Record<string, number> = {};
    let totalInvestment = 0;
    
    (product.investmentItems || []).forEach((item) => {
      const itemAmount = item.autoCalculate 
        ? (item.quantity || 0) * (item.unitPrice || 0) 
        : item.amount;
      
      const group = item.amortizationGroup || 'tooling1'; // 默认分配到 tooling1
      investmentByGroup[group] = (investmentByGroup[group] || 0) + itemAmount;
      totalInvestment += itemAmount;
    });
    
    // Fallback if no items defined but summary exists
    if (totalInvestment === 0 && (product.investment?.mold > 0)) {
      totalInvestment = product.investment.mold;
      investmentByGroup['tooling1'] = product.investment.mold;
    }

    // Calculate RnD from detailed items OR fallback to simple summary
    let totalRnD = (product.rndItems || []).reduce((acc, item) => acc + item.amount, 0);
    // Fallback if no items defined but summary exists
    if (totalRnD === 0 && (product.investment?.rnd > 0)) {
      totalRnD = product.investment.rnd;
      investmentByGroup['rnd'] = product.investment.rnd;
    } else if (totalRnD > 0) {
      // R&D items always go to 'rnd' group
      investmentByGroup['rnd'] = totalRnD;
    }
    
    return { productId: product.id, materialCost, processCost, hk3, totalInvestment, totalRnD, investmentByGroup };
  });
}

// Helper: Aggregate investmentByGroup from all products
export function aggregateInvestmentByGroup(productCosts: ProductCosts[]): Record<string, number> {
  const aggregated: Record<string, number> = {};
  productCosts.forEach((pc) => {
    Object.entries(pc.investmentByGroup).forEach(([groupId, amount]) => {
      aggregated[groupId] = (aggregated[groupId] || 0) + amount;
    });
  });
  return aggregated;
}

export function calcSK(
  totalHK3: number, 
  totalInvestment: number, 
  totalRnD: number, 
  investmentByGroup: Record<string, number>,
  params?: SalesParams
): SKCalc {
  const p = params || DEFAULT_SALES_PARAMS;
  const interestFactor = 1 + (p.capitalInterestRate / 100) * p.amortizationYears;
  const investmentWithInterest = totalInvestment * interestFactor;
  const rndWithInterest = totalRnD * interestFactor;

  // Calculate amortization by group
  const unitAmortByGroup: Record<string, number> = {};
  let totalUnitAmort = 0;
  
  if (p.amortizationMode === 'AMORTIZED') {
    // For each group, calculate unit amortization
    p.amortizationGroups.forEach((group) => {
      const groupInvestment = investmentByGroup[group.id] || 0;
      if (groupInvestment > 0 && group.volume > 0) {
        const groupInterestFactor = 1 + (p.capitalInterestRate / 100) * group.years;
        const groupWithInterest = groupInvestment * groupInterestFactor;
        const unitAmort = groupWithInterest / group.volume;
        unitAmortByGroup[group.id] = unitAmort;
        totalUnitAmort += unitAmort;
      }
    });
  }

  // Legacy fields for backward compatibility
  const unitTooling =
    p.amortizationMode === 'AMORTIZED' && p.amortizationVolume > 0
      ? investmentWithInterest / p.amortizationVolume
      : 0;
  const unitRnD =
    p.amortizationMode === 'AMORTIZED' && p.amortizationVolume > 0
      ? rndWithInterest / p.amortizationVolume
      : 0;

  const saCost = p.quotedPrice * (p.saRate / 100);
  const sk1 = totalHK3 + saCost;
  const workingCapInterest = p.quotedPrice * (p.interestRate / 100) * (p.paymentTermsDays / 360);
  const logistics = totalHK3 * (p.logisticsRate / 100);
  
  // Use grouped amortization if available, otherwise fall back to legacy
  const totalAmort = Object.keys(unitAmortByGroup).length > 0 ? totalUnitAmort : (unitTooling + unitRnD);
  const sk2 = sk1 + totalAmort + workingCapInterest + logistics;

  return { 
    interestFactor, 
    investmentWithInterest, 
    rndWithInterest, 
    unitTooling, 
    unitRnD, 
    unitAmortByGroup,
    saCost, 
    sk1, 
    workingCapInterest, 
    logistics, 
    sk2 
  };
}

export function calcYearlyData(
  params: SalesParams | undefined,
  productCosts: ProductCosts[],
  skCalc: SKCalc,
  annualVolume: number
): YearlyData[] {
  const p = params || DEFAULT_SALES_PARAMS;
  // Use a realistic ramp-up profile based on Annual Volume being the "Peak/Standard" volume
  const volumeProfile = [
    { year: BASE_YEAR, volume: Math.round(annualVolume * 0.60) },     // Year 1: Ramp up (60%)
    { year: BASE_YEAR + 1, volume: Math.round(annualVolume * 1.00) }, // Year 2: Full production
    { year: BASE_YEAR + 2, volume: Math.round(annualVolume * 1.00) }, // Year 3: Full production
    { year: BASE_YEAR + 3, volume: Math.round(annualVolume * 0.95) }, // Year 4: Slight decline
    { year: BASE_YEAR + 4, volume: Math.round(annualVolume * 0.85) }, // Year 5: End of life phase down
  ];

  return volumeProfile.map(({ year, volume }, idx) => {
    // 计算年降：根据开始年份和持续年限
    // idx: 0=Year1, 1=Year2, 2=Year3, 3=Year4, 4=Year5
    // 例如：开始年份=2 (从Year2开始)，持续年限=3 (降3年，即Year2,3,4)
    let reductionApplied = 0;
    const yearNumber = idx + 1; // 1-based: Year 1, 2, 3...
    
    if (yearNumber >= p.annualReductionStartYear) {
      // 计算实际降价年数
      const yearsFromStart = yearNumber - p.annualReductionStartYear;
      // 如果在年降年限内，应用降价
      if (yearsFromStart < p.annualReductionYears) {
        reductionApplied = yearsFromStart + 1; // +1 因为从第一年就开始降
      } else {
        // 超过年降年限，维持最后一年的降价幅度
        reductionApplied = p.annualReductionYears;
      }
    }
    
    const vp = p.quotedPrice * Math.pow(1 - p.annualReductionRate / 100, reductionApplied);
    const netSales = volume * vp;

    const materialScale = 1 - idx * 0.015;
    const processScale = 1 - idx * 0.01;
    const hk3Base = productCosts.reduce((s, c) => s + c.materialCost * materialScale + c.processCost * processScale, 0);

    const saCost = vp * (p.saRate / 100);
    const sk1 = hk3Base + saCost;

    // Calculate amortization by group for this year
    const amortByGroup: Record<string, number> = {};
    let totalYearAmort = 0;
    
    p.amortizationGroups.forEach((group) => {
      // Check if this year is within the amortization period for this group
      const withinGroupPeriod = idx < group.years;
      const groupUnitAmort = skCalc.unitAmortByGroup[group.id] || 0;
      const yearGroupAmort = withinGroupPeriod ? groupUnitAmort : 0;
      amortByGroup[group.id] = yearGroupAmort;
      totalYearAmort += yearGroupAmort;
    });

    // Legacy fields for backward compatibility
    const withinAmortPeriod = idx < p.amortizationYears;
    const toolingAmort = withinAmortPeriod ? skCalc.unitTooling : 0;
    const rndAmort = withinAmortPeriod ? skCalc.unitRnD : 0;
    
    const workingCap = vp * (p.interestRate / 100) * (p.paymentTermsDays / 360);
    const logistics = hk3Base * (p.logisticsRate / 100);
    
    // Use grouped amortization if available, otherwise fall back to legacy
    const finalAmort = Object.keys(amortByGroup).length > 0 ? totalYearAmort : (toolingAmort + rndAmort);
    const sk2 = sk1 + finalAmort + workingCap + logistics;

    const db4 = vp - sk2;
    const db4Rate = vp > 0 ? (db4 / vp) * 100 : 0;

    let warning: 'red' | 'yellow' | 'green' = 'green';
    if (db4Rate < -5) warning = 'red';
    else if (db4Rate < 0) warning = 'yellow';

    return { 
      year, 
      volume, 
      vp, 
      netSales, 
      hk3: hk3Base, 
      saCost, 
      sk1, 
      toolingAmort, 
      rndAmort, 
      amortByGroup, // 分组分摊金额
      workingCap, 
      logistics, 
      sk2, 
      db4, 
      db4Rate, 
      warning 
    };
  });
}

export function calcBC(yearlyData: YearlyData[]) {
  const totalNetSales = yearlyData.reduce((s, y) => s + y.netSales, 0);
  const totalHK3All = yearlyData.reduce((s, y) => s + y.hk3 * y.volume, 0);
  const totalSK2All = yearlyData.reduce((s, y) => s + y.sk2 * y.volume, 0);
  const dbI = totalNetSales - totalHK3All;
  const dbIV = totalNetSales - totalSK2All;
  const dbIRate = totalNetSales > 0 ? (dbI / totalNetSales) * 100 : 0;
  const dbIVRate = totalNetSales > 0 ? (dbIV / totalNetSales) * 100 : 0;
  return { totalNetSales, totalHK3All, totalSK2All, dbI, dbIV, dbIRate, dbIVRate };
}

export interface PaybackResult {
  // Investment
  totalProjectInvestment: number;
  toolingInvestment: number;
  rndInvestment: number;
  // Per-unit financials
  quotedPrice: number;
  unitCost: number;       // SK cost WITHOUT amortization (HK3 + S&A + WC + Logistics)
  unitHK3: number;
  unitSA: number;
  unitWC: number;
  unitLogistics: number;
  unitProfit: number;     // VP - unitCost
  // Annual / Monthly
  annualRevenue: number;
  annualCost: number;
  annualProfit: number;
  monthlyProfit: number;
  // Payback
  paybackMonths: number;
  paybackYears: number;
  // Recommendation
  level: string;
  color: string;
  reason: string;
}

export function calcPayback(
  totalInvestment: number,
  totalRnD: number,
  totalHK3: number,
  annualVolume: number,
  params?: SalesParams
): PaybackResult {
  const p = params || DEFAULT_SALES_PARAMS;
  const totalProjectInvestment = totalInvestment + totalRnD;

  // Unit cost WITHOUT amortization — payback uses profit before amortization
  // because amortization IS the investment being recovered
  const unitSA = p.quotedPrice * (p.saRate / 100);
  const unitWC = p.quotedPrice * (p.interestRate / 100) * (p.paymentTermsDays / 360);
  const unitLogistics = totalHK3 * (p.logisticsRate / 100);
  const unitCost = totalHK3 + unitSA + unitWC + unitLogistics;

  // Simple static payback: Payback = Total Investment / Monthly Net Profit
  // Monthly Net Profit = (VP - Cost_without_amort) × Annual Volume / 12
  const unitProfit = p.quotedPrice - unitCost;
  const annualRevenue = p.quotedPrice * annualVolume;
  const annualCost = unitCost * annualVolume;
  const annualProfit = unitProfit * annualVolume;
  const monthlyProfit = annualProfit / 12;

  const paybackMonths = monthlyProfit > 0 ? totalProjectInvestment / monthlyProfit : Infinity;
  const paybackYears = paybackMonths / 12;

  let level: string;
  let color: string;
  let reason: string;
  if (paybackMonths <= 12) {
    level = '极力推荐'; color = 'emerald';
    reason = '回收期极短，投资回报快';
  } else if (paybackMonths <= 24) {
    level = '推荐'; color = 'blue';
    reason = `回收期约 ${Math.round(paybackMonths)} 个月，回收期适中，风险可控`;
  } else if (paybackMonths <= 36) {
    level = '谨慎'; color = 'amber';
    reason = `回收期约 ${Math.round(paybackMonths)} 个月，需评估客户风险承受能力`;
  } else {
    level = '不推荐'; color = 'red';
    reason = paybackMonths === Infinity
      ? '项目单件利润为负，无法收回投资，建议调整报价或成本策略'
      : `回收期约 ${Math.round(paybackMonths)} 个月，回收期过长，建议调整报价或投资策略`;
  }

  return {
    totalProjectInvestment,
    toolingInvestment: totalInvestment,
    rndInvestment: totalRnD,
    quotedPrice: p.quotedPrice,
    unitCost,
    unitHK3: totalHK3,
    unitSA,
    unitWC,
    unitLogistics,
    unitProfit,
    annualRevenue,
    annualCost,
    annualProfit,
    monthlyProfit,
    paybackMonths,
    paybackYears,
    level,
    color,
    reason,
  };
}

export function calcNPV(
  totalInvestment: number,
  yearlyData: YearlyData[],
  params?: SalesParams
): NPVResult {
  const p = params || DEFAULT_SALES_PARAMS;
  // Use capitalInterestRate as Discount Rate (e.g. 6.0%)
  const rate = (p.capitalInterestRate || 6.0) / 100;

  // Year 0: Initial Investment Outflow
  // We assume investment happens at start of Year 1 (t=0)
  const initialInv = totalInvestment;
  
  const year0: NPVYearlyData = {
    year: 0, // Year 0 relative to start
    cashIn: 0,
    cashOut: initialInv,
    netCashFlow: -initialInv,
    discountFactor: 1.0,
    discountedCashFlow: -initialInv,
    cumulativeDCF: -initialInv
  };

  const npvData: NPVYearlyData[] = [year0];
  let cumulative = -initialInv;
  let paybackYears = Infinity;
  let paybackFound = false;

  yearlyData.forEach((y, i) => {
    // Cash In: Net Sales
    const cashIn = y.netSales;

    // Cash Out: Operating Costs (SK2 - Amortization)
    // SK2 includes HK3 + SA + WC + Logistics + Amortization
    // We remove amortization because it's non-cash
    const totalAmort = (y.toolingAmort + y.rndAmort) * y.volume;
    const totalSK2 = y.sk2 * y.volume;
    const cashOut = totalSK2 - totalAmort;
    
    // Net Cash Flow
    const netCashFlow = cashIn - cashOut;

    // Discounting (Year 1, 2, 3...)
    const n = i + 1;
    const discountFactor = 1 / Math.pow(1 + rate, n);
    const dcf = netCashFlow * discountFactor;

    const prevCumulative = cumulative;
    cumulative += dcf;

    // Check for Payback Crossing
    if (!paybackFound && prevCumulative < 0 && cumulative >= 0) {
      // Linear Interpolation: 
      // Fraction of year needed = |Unrecovered| / ThisYearDCF
      const unrecovered = Math.abs(prevCumulative);
      const fraction = unrecovered / dcf;
      paybackYears = (n - 1) + fraction; // Previous year + fraction
      paybackFound = true;
    }

    npvData.push({
      year: y.year, // Calendar Year
      cashIn,
      cashOut,
      netCashFlow,
      discountFactor,
      discountedCashFlow: dcf,
      cumulativeDCF: cumulative
    });
  });

  return {
    totalInvestment: initialInv,
    npvTotal: cumulative,
    paybackYears: paybackFound ? paybackYears : Infinity,
    yearlyData: npvData,
    isProfitable: cumulative > 0
  };
}

export const fmt = (n: number, decimals = 2) => n.toFixed(decimals);
export const fmtK = (n: number) => (n >= 10000 ? `¥${(n / 10000).toFixed(1)}万` : `¥${n.toLocaleString()}`);