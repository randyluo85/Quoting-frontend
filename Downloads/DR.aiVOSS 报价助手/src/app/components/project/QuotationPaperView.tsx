import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Settings, Download, Printer, ChevronRight, X, 
  AlertTriangle, CheckCircle, RefreshCw, DollarSign, Calendar, 
  CreditCard, Truck, History
} from 'lucide-react';
import { Button, Badge, Card, Input, Label, Select } from '../ui/shared';
import { Project, Product } from '../../pages/ProjectDetail';
import { SalesParams, calcProductCosts, calcSK, calcYearlyData, aggregateInvestmentByGroup, fmt, DEFAULT_SALES_PARAMS } from './costCalc';

interface QuotationPaperViewProps {
  project: Project;
  products: Product[];
  salesParams: SalesParams;
  onSalesParamsChange: (params: SalesParams) => void;
}

export function QuotationPaperView({ 
  project, 
  products, 
  salesParams, 
  onSalesParamsChange 
}: QuotationPaperViewProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [currency, setCurrency] = useState<'CNY' | 'EUR' | 'USD'>('CNY');
  
  // 确保 salesParams 包含所有必需的字段
  const params: SalesParams = useMemo(() => ({
    ...DEFAULT_SALES_PARAMS,
    ...salesParams,
  }), [salesParams]);
  
  // Effect to trigger highlights when key params change
  useEffect(() => {
    const fields = [];
    if (params.quotedPrice) fields.push('price');
    if (params.amortizationMode) fields.push('nre');
    if (params.targetMargin) fields.push('margin');
    
    setHighlightedFields(fields);
    const timer = setTimeout(() => setHighlightedFields([]), 1500);
    return () => clearTimeout(timer);
  }, [params.quotedPrice, params.amortizationMode, params.targetMargin]);

  // Calculations
  const productCosts = useMemo(() => calcProductCosts(products), [products]);
  const totalHK3 = productCosts.reduce((s, c) => s + c.hk3, 0);
  
  // Calculate total investment and RnD
  const totalInvestment = productCosts.reduce((s, c) => s + c.totalInvestment, 0);
  const totalRnD = productCosts.reduce((s, c) => s + c.totalRnD, 0);
  const investmentByGroup = useMemo(() => aggregateInvestmentByGroup(productCosts), [productCosts]);
  
  const skCalc = useMemo(() => calcSK(totalHK3, totalInvestment, totalRnD, investmentByGroup, params), [totalHK3, totalInvestment, totalRnD, investmentByGroup, params]);
  
  // Guardrails
  const marginRate = params.quotedPrice > 0 
    ? ((params.quotedPrice - skCalc.sk2) / params.quotedPrice) * 100 
    : 0;
  const isLowMargin = marginRate < 8; 
  const isLoss = marginRate < 0;

  // Currency Conversion
  const exchangeRates = { CNY: 1, EUR: 0.1285, USD: 0.1388 }; // Derived roughly from image 1/7.13 and 1/6.89
  const rate = exchangeRates[currency];
  
  const convert = (val: number) => val * rate;
  const fmtVal = (val: number) => fmt(convert(val));

  // Date
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  // VOSS Info (Static as per image)
  const vossInfo = {
    company: "VOSS Automotive Components (Jinan) Co., LTD",
    address: "4277 of Ji Chang Road. Jinan, 250107, Shandong, P.R.China",
    website: "www.voss.de"
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-slate-100 dark:bg-slate-900">
      
      {/* ================= Top Bar (Fixed) ================= */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-10 flex items-center justify-between px-6 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" />
          <h2 className="font-bold text-slate-800">报价单预览</h2>
          <Badge variant="outline" className="ml-2 text-xs font-normal text-slate-500">
            VOSS Standard Template
          </Badge>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             variant="outline" 
             size="sm" 
             className="gap-2"
             onClick={() => window.print()}
           >
             <Printer size={16} /> 打印
           </Button>
           <div className="h-6 w-px bg-slate-200"></div>
           <Button variant="outline" size="sm" className="gap-2">
             <FileText size={16} /> 导出 Word
           </Button>
           <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
             <Download size={16} /> 导出 PDF
           </Button>
        </div>
      </div>

      {/* ================= Main Content (Document Preview) ================= */}
      <div className="flex-1 overflow-auto pt-24 pb-12 px-4 flex justify-center custom-scrollbar print:p-0 print:overflow-visible">
        <div 
          className="bg-white shadow-lg w-[210mm] min-h-[297mm] p-[15mm] relative text-[10pt] leading-snug font-arial print:shadow-none print:w-full"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Document Header */}
          <div className="mb-6">
            <h1 className="text-lg font-bold text-black mb-2">VOSS Quotation {project.customerName}</h1>
            <p className="text-black mb-4 text-xs">
              Thank for your inquiry by e-mail, fax or phone of our products. We are pleased to quote you our best price with our terms as follows.
            </p>
            
            {/* Info Table */}
            <table className="w-full border-collapse border border-black text-xs mb-6">
              <tbody>
                <tr>
                  <td className="border border-black font-bold p-1 bg-slate-50 w-1/2">Customer's Information</td>
                  <td className="border border-black font-bold p-1 bg-slate-50 w-1/2">VOSS Information</td>
                </tr>
                <tr>
                  <td className="border border-black p-0 align-top">
                    <div className="flex h-full">
                      <div className="w-16 font-bold p-1 border-r border-slate-200">To</div>
                      <div className="p-1 flex-1">{project.customerName}</div>
                    </div>
                  </td>
                  <td className="border border-black p-0 align-top">
                    <div className="flex h-full">
                      <div className="w-20 font-bold p-1 border-r border-slate-200">From</div>
                      <div className="p-1 flex-1">{vossInfo.company}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-0 align-top">
                    <div className="flex h-full">
                      <div className="w-16 font-bold p-1 border-r border-slate-200">Address</div>
                      <div className="p-1 flex-1"></div>
                    </div>
                  </td>
                  <td className="border border-black p-0 align-top">
                    <div className="flex h-full">
                      <div className="w-20 font-bold p-1 border-r border-slate-200">Address</div>
                      <div className="p-1 flex-1">{vossInfo.address}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-16 font-bold p-1 border-r border-slate-200">Attn</div>
                      <div className="p-1 flex-1">Purchasing Dept.</div>
                    </div>
                  </td>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-20 font-bold p-1 border-r border-slate-200">Main contact</div>
                      <div className="p-1 flex-1">{project.owner}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-16 font-bold p-1 border-r border-slate-200">Tel</div>
                      <div className="p-1 flex-1"></div>
                    </div>
                  </td>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-20 font-bold p-1 border-r border-slate-200">Tel</div>
                      <div className="p-1 flex-1">0531-89021518</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-16 font-bold p-1 border-r border-slate-200">Email</div>
                      <div className="p-1 flex-1"></div>
                    </div>
                  </td>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-20 font-bold p-1 border-r border-slate-200">Email</div>
                      <div className="p-1 flex-1">sales@voss.cn</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-16 font-bold p-1 border-r border-slate-200">Website</div>
                      <div className="p-1 flex-1"></div>
                    </div>
                  </td>
                  <td className="border border-black p-0 align-top">
                    <div className="flex">
                      <div className="w-20 font-bold p-1 border-r border-slate-200">Website</div>
                      <div className="p-1 flex-1">{vossInfo.website}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Details */}
          <div className="mb-8">
            <h3 className="font-bold text-black mb-1">Details for Assembly Tube Mass Price:</h3>
            <p className="text-xs mb-4 italic">(Exchange rate :1EUR=7.78RMB, 1USD=7.20RMB)</p>
            
            <h4 className="font-bold text-sm mb-2">{project.projectCode}:</h4>
            
            <table className="w-full border-collapse border border-black text-xs text-center">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-black p-2 w-16" rowSpan={2}>Customer No.</th>
                  <th className="border border-black p-2 w-24" rowSpan={2}>VOSS NO.</th>
                  <th className="border border-black p-2" rowSpan={2}>Description</th>
                  <th className="border border-black p-2 w-12" rowSpan={2}>Factor</th>
                  <th className="border border-black p-1" colSpan={3}>Net Price(W/O VAT)</th>
                  <th className="border border-black p-1" colSpan={3}>Subtotal(W/O VAT)</th>
                </tr>
                <tr className="bg-slate-50">
                  <th className="border border-black p-1 w-16">(Euro)</th>
                  <th className="border border-black p-1 w-16">(USD)</th>
                  <th className="border border-black p-1 w-16">(RMB)</th>
                  <th className="border border-black p-1 w-16">(Euro)</th>
                  <th className="border border-black p-1 w-16">(USD)</th>
                  <th className="border border-black p-1 w-16">(RMB)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  // If currency matches column, show value, else empty
                  const isRMB = currency === 'CNY';
                  const isEUR = currency === 'EUR';
                  const isUSD = currency === 'USD';
                  
                  const price = params.quotedPrice;
                  const total = price * project.annualVolume;

                  return (
                    <tr key={p.id}>
                      <td className="border border-black p-2">{project.customerCode}-{idx + 1}</td>
                      <td className="border border-black p-2">{p.id}</td>
                      <td className="border border-black p-2 text-left">{p.name}</td>
                      <td className="border border-black p-2">1</td>
                      
                      {/* Net Price Columns */}
                      <td className={`border border-black p-2 ${highlightedFields.includes('price') && isEUR ? 'bg-yellow-200' : ''}`}>
                        {isEUR ? fmtVal(price) : ''}
                      </td>
                      <td className={`border border-black p-2 ${highlightedFields.includes('price') && isUSD ? 'bg-yellow-200' : ''}`}>
                        {isUSD ? fmtVal(price) : ''}
                      </td>
                      <td className={`border border-black p-2 ${highlightedFields.includes('price') && isRMB ? 'bg-yellow-200' : ''}`}>
                        {isRMB ? fmtVal(price) : ''}
                      </td>
                      
                      {/* Subtotal Columns */}
                      <td className="border border-black p-2">{isEUR ? fmtVal(total) : ''}</td>
                      <td className="border border-black p-2">{isUSD ? fmtVal(total) : ''}</td>
                      <td className="border border-black p-2">{isRMB ? fmtVal(total) : ''}</td>
                    </tr>
                  );
                })}
                {/* SUM Row */}
                <tr>
                  <td className="border border-black p-2 font-bold text-right" colSpan={4}>SUM</td>
                  <td className="border border-black p-2 bg-slate-100"></td>
                  <td className="border border-black p-2 bg-slate-100"></td>
                  <td className="border border-black p-2 bg-slate-100"></td>
                  <td className="border border-black p-2 font-bold">{currency === 'EUR' ? fmtVal(params.quotedPrice * project.annualVolume) : ''}</td>
                  <td className="border border-black p-2 font-bold">{currency === 'USD' ? fmtVal(params.quotedPrice * project.annualVolume) : ''}</td>
                  <td className="border border-black p-2 font-bold">{currency === 'CNY' ? fmtVal(params.quotedPrice * project.annualVolume) : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tooling Price */}
          <div className="mb-8">
            <h3 className="font-bold text-black text-sm mb-2">
              Tool Price for new parts (Overall consideration of all the above projects, the same parts as NW25 version will not be charged)
            </h3>
            
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-black p-2 text-left w-1/2">VOSS NO. / Description</th>
                  <th className="border border-black p-2 w-1/6">(Euro)</th>
                  <th className="border border-black p-2 w-1/6">(USD)</th>
                  <th className="border border-black p-2 w-1/6">(RMB)</th>
                </tr>
              </thead>
              <tbody>
                {/* Render Investment Items or Summary */}
                {products[0]?.investmentItems?.map((item) => (
                   <tr key={item.id}>
                     <td className="border border-black p-2">{item.name}</td>
                     <td className="border border-black p-2 text-right">{currency === 'EUR' && params.amortizationMode === 'UPFRONT' ? fmtVal(item.amount) : ''}</td>
                     <td className="border border-black p-2 text-right">{currency === 'USD' && params.amortizationMode === 'UPFRONT' ? fmtVal(item.amount) : ''}</td>
                     <td className="border border-black p-2 text-right">{currency === 'CNY' && params.amortizationMode === 'UPFRONT' ? fmtVal(item.amount) : ''}</td>
                   </tr>
                )) || (
                   <>
                     {/* Default rows if no detailed items */}
                     <tr>
                        <td className="border border-black p-2">Assembly Tooling Cost (Molds)</td>
                        <td className="border border-black p-2 text-right">{currency === 'EUR' && params.amortizationMode === 'UPFRONT' ? fmtVal(products[0]?.investment.mold) : ''}</td>
                        <td className="border border-black p-2 text-right">{currency === 'USD' && params.amortizationMode === 'UPFRONT' ? fmtVal(products[0]?.investment.mold) : ''}</td>
                        <td className="border border-black p-2 text-right">{currency === 'CNY' && params.amortizationMode === 'UPFRONT' ? fmtVal(products[0]?.investment.mold) : ''}</td>
                     </tr>
                     <tr>
                        <td className="border border-black p-2">R&D / Testing Cost</td>
                        <td className="border border-black p-2 text-right">{currency === 'EUR' && params.amortizationMode === 'UPFRONT' ? fmtVal(products[0]?.investment.rnd) : ''}</td>
                        <td className="border border-black p-2 text-right">{currency === 'USD' && params.amortizationMode === 'UPFRONT' ? fmtVal(products[0]?.investment.rnd) : ''}</td>
                        <td className="border border-black p-2 text-right">{currency === 'CNY' && params.amortizationMode === 'UPFRONT' ? fmtVal(products[0]?.investment.rnd) : ''}</td>
                     </tr>
                   </>
                )}

                {/* Show Amortization Note if Amortized */}
                {params.amortizationMode === 'AMORTIZED' && (
                  <tr>
                    <td className="border border-black p-2 italic text-slate-500" colSpan={4}>
                      * Tooling and R&D costs are amortized into piece price over {params.amortizationYears} years ({params.amortizationVolume} pcs).
                    </td>
                  </tr>
                )}

                <tr className="font-bold">
                  <td className="border border-black p-2 text-right">SUM</td>
                  <td className="border border-black p-2 text-right">{currency === 'EUR' && params.amortizationMode === 'UPFRONT' ? fmtVal(totalInvestment + totalRnD) : ''}</td>
                  <td className="border border-black p-2 text-right">{currency === 'USD' && params.amortizationMode === 'UPFRONT' ? fmtVal(totalInvestment + totalRnD) : ''}</td>
                  <td className="border border-black p-2 text-right">{currency === 'CNY' && params.amortizationMode === 'UPFRONT' ? fmtVal(totalInvestment + totalRnD) : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer / Remarks */}
          <div className="text-xs space-y-4 pt-4 border-t-2 border-black">
             <div>
               <h4 className="font-bold">Remark</h4>
               <p>
                 VOSS reserves rights to change quotation upon any engineering change.<br/>
                 Price includes current confirmed technical specification, any specific test items required hereafter would be charged separately.
               </p>
             </div>
             
             <div>
               <h4 className="font-bold">Manufacturing location</h4>
               <p>
                 VOSS Automotive Components (Jinan) Co,Ltd., China<br/>
                 福士汽车零部件 (济南) 有限公司
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h4 className="font-bold mb-1">Invoice Information for RMB account</h4>
                   <div className="space-y-1 text-[10px] leading-tight text-slate-700">
                      <p>名称: 福士汽车零部件 (济南) 有限公司</p>
                      <p>Company Name: VOSS Automotive Components (Jinan) Co,Ltd., China</p>
                      <p>地址: 山东省济南市历城区机场路 4277 号</p>
                      <p>Add: No.4277 Jichang road, Jinan Lingang Development Zone, Yaoqiang Town Licheng District, Jinan, Shandong Province PR.C</p>
                      <div className="flex justify-between">
                         <span>电话: 0531-89021518</span>
                         <span>传真: 0531-89021780</span>
                      </div>
                      <p>纳税人识别号: 91370100664869905R</p>
                      <p>开户行: 中国银行济南高新支行</p>
                      <p>Bank name: BANK OF CHINA JINAN GAOXIN SUB-BRANCH</p>
                      <p>账号: 235108306939</p>
                   </div>
                </div>

                <div>
                   <h4 className="font-bold mb-1">Bank Account Information for EUR and USD account:</h4>
                   <div className="space-y-1 text-[10px] leading-tight text-slate-700">
                      <p>Company Name: VOSS AUTOMOTIVE COMPONENTS (Jinan) CO.,LTD.</p>
                      <p>Add: No.4277 Jichang road, Jinan Lingang Development Zone, Yaoqiang Town Licheng District, Jinan, Shandong Province PR.C</p>
                      <p>Tel: 0531-89021518</p>
                      <p>Fax: 0531-89021780</p>
                      <p className="mt-2">Taxpayer ID: 91370100664869905R</p>
                      <p>Bank name: BANK OF CHINA JINAN GAOXIN SUB-BRANCH</p>
                      <p>EUR account No. : 237708306933</p>
                      <p>USD account No. : 235108306939</p>
                      <p>Swift code: BKCHCNBJ51B</p>
                   </div>
                </div>
             </div>

             <div className="pt-4 text-[10px] text-slate-500">
                <p>
                   Basis to our deliveries are the individually negotiated contractual stipulations as well as our general terms and conditions which can be found under the following address: 
                   <a href="#" className="text-blue-600 underline ml-1">http://doc.voss.de/agb/VOSS-Automotive-GmbH-AGB_eng.pdf</a>
                </p>
                <p className="mt-1">
                   交付条件需个别商议后进行合同上的约定,同时必须满足我方的总则和条款。关于总则条款可以在以上网址找到
                </p>
                <p className="mt-1 font-bold">
                   We do not accept any other general terms even in case of unreserved execution of deliveries.
                </p>
             </div>
          </div>

        </div>
      </div>

      {/* ================= Right Side Drawer (Control Panel) ================= */}
      <div 
        className={`
           fixed top-16 right-0 bottom-0 w-[400px] bg-white border-l border-slate-200 shadow-xl 
           transform transition-transform duration-300 ease-in-out z-20 flex flex-col print:hidden
           ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Toggle Button (Visible when closed) */}
        {!isDrawerOpen && (
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Settings size={24} className="animate-spin-slow" />
          </button>
        )}

        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
             <Settings size={18} className="text-blue-600" />
             商业参数调整
           </h3>
           <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-slate-600">
             <X size={20} />
           </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           
           {/* Guardrails Alert */}
           {(isLoss || isLowMargin) && (
             <div className={`p-4 rounded-lg border flex items-start gap-3 ${isLoss ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <AlertTriangle className={`shrink-0 mt-0.5 ${isLoss ? 'text-red-600' : 'text-amber-600'}`} size={16} />
                <div className="text-xs">
                   <div className={`font-bold mb-1 ${isLoss ? 'text-red-800' : 'text-amber-800'}`}>
                     {isLoss ? '严重亏损预警' : '低利润风险'}
                   </div>
                   <p className={`${isLoss ? 'text-red-700' : 'text-amber-700'}`}>
                     当前调价方案导致项目{isLoss ? '出现亏损' : '利润率低于 8%'}，建议重新评估价格或优化成本。
                   </p>
                </div>
             </div>
           )}

           {/* 1. Price & Margin */}
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-l-2 border-blue-500 pl-2">利润策略</h4>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">目标利润率 (%)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={params.targetMargin}
                        onChange={(e) => {
                           // Logic to auto-adjust price based on margin
                           const newMargin = parseFloat(e.target.value) || 0;
                           const rateFactors = (params.saRate / 100) + (params.interestRate / 100 * (params.paymentTermsDays / 360));
                           const fixedPart = skCalc.sk2 - (params.quotedPrice * rateFactors); 
                           
                           if (1 - (newMargin/100) - rateFactors > 0) {
                              const newPrice = fixedPart / (1 - (newMargin/100) - rateFactors);
                              onSalesParamsChange({ ...params, targetMargin: newMargin, quotedPrice: parseFloat(newPrice.toFixed(2)) });
                           }
                        }}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">报价单价 (CNY)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={params.quotedPrice}
                        onChange={(e) => onSalesParamsChange({ ...params, quotedPrice: parseFloat(e.target.value) || 0 })}
                        className={`pr-8 ${isLoss ? 'border-red-300 focus:ring-red-200' : ''}`}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">¥</span>
                    </div>
                 </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 px-1">
                 <span>当前实际利润率:</span>
                 <span className={`font-bold ${isLoss ? 'text-red-600' : isLowMargin ? 'text-amber-600' : 'text-emerald-600'}`}>
                   {fmt(marginRate, 1)}%
                 </span>
              </div>
           </div>

           {/* 2. NRE Strategy */}
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-l-2 border-purple-500 pl-2">NRE 分摊策略</h4>
              
              <div className="p-1 bg-slate-100 rounded-lg flex gap-1">
                 <button 
                   onClick={() => onSalesParamsChange({ ...params, amortizationMode: 'UPFRONT' })}
                   className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${params.amortizationMode === 'UPFRONT' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   一次性支付
                 </button>
                 <button 
                   onClick={() => onSalesParamsChange({ ...params, amortizationMode: 'AMORTIZED' })}
                   className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${params.amortizationMode === 'AMORTIZED' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   分摊进单价
                 </button>
              </div>

              {params.amortizationMode === 'AMORTIZED' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in">
                   <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">分摊年限 (Year)</Label>
                      <Input 
                        type="number" 
                        value={params.amortizationYears}
                        onChange={(e) => onSalesParamsChange({ ...params, amortizationYears: parseFloat(e.target.value) || 0 })}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-xs text-slate-500">分摊基数 (Pcs)</Label>
                      <Input 
                        type="number" 
                        value={params.amortizationVolume}
                        onChange={(e) => onSalesParamsChange({ ...params, amortizationVolume: parseFloat(e.target.value) || 0 })}
                      />
                   </div>
                </div>
              )}
           </div>

           {/* 3. Currency & FX */}
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-l-2 border-emerald-500 pl-2">汇率与币种</h4>
              <div className="space-y-3">
                 <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">显示币种</Label>
                    <div className="grid grid-cols-3 gap-2">
                       {['CNY', 'EUR', 'USD'].map((c) => (
                         <button
                           key={c}
                           onClick={() => setCurrency(c as any)}
                           className={`
                             py-2 text-xs font-bold rounded border transition-colors
                             ${currency === c 
                               ? 'border-blue-600 bg-blue-50 text-blue-700' 
                               : 'border-slate-200 text-slate-600 hover:border-slate-300'}
                           `}
                         >
                           {c}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* 4. Terms */}
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 border-l-2 border-amber-500 pl-2">商务条款</h4>
              <div className="space-y-3">
                 <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">付款账期 (Days)</Label>
                    <Select 
                      value={params.paymentTermsDays}
                      onChange={(e) => onSalesParamsChange({ ...params, paymentTermsDays: parseInt(e.target.value) })}
                    >
                       <option value={30}>Net 30 Days</option>
                       <option value={45}>Net 45 Days</option>
                       <option value={60}>Net 60 Days</option>
                       <option value={90}>Net 90 Days</option>
                       <option value={120}>Net 120 Days</option>
                    </Select>
                 </div>
                 
                 {/* 年降参数细化 */}
                 <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">年降比例 (LTA %/年)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={params.annualReductionRate}
                        onChange={(e) => onSalesParamsChange({ ...params, annualReductionRate: parseFloat(e.target.value) || 0 })}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">年降年限 (年)</Label>
                    <Input 
                      type="number" 
                      value={params.annualReductionYears}
                      onChange={(e) => onSalesParamsChange({ ...params, annualReductionYears: parseInt(e.target.value) || 0 })}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">开始年份 (第几年)</Label>
                    <Input 
                      type="number" 
                      value={params.annualReductionStartYear}
                      onChange={(e) => onSalesParamsChange({ ...params, annualReductionStartYear: parseInt(e.target.value) || 1 })}
                    />
                 </div>
              </div>
           </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
           <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={() => setIsDrawerOpen(false)}>
              <CheckCircle size={16} className="mr-2" /> 确认调整
           </Button>
        </div>
      </div>

    </div>
  );
}