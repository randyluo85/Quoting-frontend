import React from 'react';
import { X, Sparkles, Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { Button, Card } from '../ui/shared';
import { Product, InvestmentItem } from '../../pages/ProjectDetail';

interface InvestmentTabContentProps {
  activeProduct: Product | undefined;
  products: Product[];
  onProductsChange: (data: Product[]) => void;
  tableStyles: {
    container: string;
    table: string;
    thead: string;
    th: string;
    tbody: string;
    tr: string;
    td: string;
  };
}

const TYPE_CONFIG: Record<string, { label: string; unit: string; defaultPrice: number; defaultName: string; unitLabel: string }> = {
  GAUGE: { label: '检具 (Gauge)', unit: '点位数', defaultPrice: 150, defaultName: '新检具', unitLabel: '¥150/点' },
  JIG: { label: '工装 (Jig)', unit: '功能模块数', defaultPrice: 500, defaultName: '新工装', unitLabel: '¥500/模块' },
  FIXTURE: { label: '成型工装 (Fixture)', unit: '长度 (mm)', defaultPrice: 0.5, defaultName: '新成型工装', unitLabel: '¥0.5/mm' },
  MOLD: { label: '模具 (Mold)', unit: '重量/体积', defaultPrice: 200, defaultName: '新模具', unitLabel: '¥200/单位' },
};

const getTypeInfo = (type: string) => TYPE_CONFIG[type] || { label: '其他', unit: '数量', defaultPrice: 100, defaultName: '新投资项', unitLabel: '¥100/单位' };

export function InvestmentTabContent({ activeProduct, products, onProductsChange, tableStyles }: InvestmentTabContentProps) {

  const updateInvestmentItem = (itemId: number, updater: (item: InvestmentItem) => InvestmentItem) => {
    if (!activeProduct) return;
    const updated = products.map(p => p.id === activeProduct.id ? {
      ...p,
      investmentItems: (p.investmentItems || []).map(inv => inv.id === itemId ? updater(inv) : inv)
    } : p);
    onProductsChange(updated);
  };

  const addInvestmentItem = () => {
    if (!activeProduct) return;
    const maxId = Math.max(0, ...(activeProduct.investmentItems || []).map(i => i.id));
    const newItem: InvestmentItem = {
      id: maxId + 1,
      type: 'GAUGE',
      name: '新检具',
      amount: 0,
      quantity: 0,
      unitPrice: 150,
      autoCalculate: true,
      leadTime: undefined,
      supplier: '',
      amortizationGroup: 'tooling1', // 默认分配到 Tooling 1
    };
    const updated = products.map(p => p.id === activeProduct.id ? {
      ...p,
      investmentItems: [...(p.investmentItems || []), newItem]
    } : p);
    onProductsChange(updated);
  };

  const removeInvestmentItem = (itemId: number) => {
    if (!activeProduct) return;
    const updated = products.map(p => p.id === activeProduct.id ? {
      ...p,
      investmentItems: (p.investmentItems || []).filter(inv => inv.id !== itemId)
    } : p);
    onProductsChange(updated);
  };

  const getDisplayAmount = (item: InvestmentItem) => {
    if (item.autoCalculate) {
      return (item.quantity || 0) * (item.unitPrice || 0);
    }
    return item.amount;
  };

  const totalInvestment = (activeProduct?.investmentItems || []).reduce(
    (acc, item) => acc + getDisplayAmount(item), 0
  );

  return (
    <Card className="border-0 shadow-none">
      {(!activeProduct?.investmentItems || activeProduct.investmentItems.length === 0) ? (
        <div className="text-center py-12 text-slate-400">
          <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm text-slate-600 mb-1">暂无投资项</p>
          <p className="text-xs text-slate-400 mb-4">点击下方按钮添加模具、检具、工装等投资项目</p>
          <Button
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={addInvestmentItem}
          >
            <Plus size={14} /> 添加投资项
          </Button>
        </div>
      ) : (
        <>
          <div className={tableStyles.container}>
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={`${tableStyles.th} w-36`}>类型</th>
                  <th className={`${tableStyles.th} min-w-[140px]`}>名称</th>
                  <th className={`${tableStyles.th} w-28`}>分摊组</th>
                  <th className={`${tableStyles.th} w-28 text-right`}>数量参数</th>
                  <th className={`${tableStyles.th} w-32 text-right`}>计算金额 (¥)</th>
                  <th className={`${tableStyles.th} w-32`}>供应商</th>
                  <th className={`${tableStyles.th} w-16 text-center`}>操作</th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {activeProduct.investmentItems.map((item) => {
                  const displayAmount = getDisplayAmount(item);
                  const typeInfo = getTypeInfo(item.type);
                  return (
                    <tr key={item.id} className={tableStyles.tr}>
                      {/* 类型 */}
                      <td className={tableStyles.td}>
                        <div className="relative group">
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const newType = e.target.value as InvestmentItem['type'];
                              const newTypeInfo = getTypeInfo(newType);
                              updateInvestmentItem(item.id, (inv) => ({
                                ...inv,
                                type: newType,
                                name: inv.name === getTypeInfo(inv.type).defaultName ? newTypeInfo.defaultName : inv.name,
                                unitPrice: newTypeInfo.defaultPrice,
                                amount: inv.autoCalculate ? (inv.quantity || 0) * newTypeInfo.defaultPrice : inv.amount
                              }));
                            }}
                            className="bg-slate-100 w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 text-[12px] border-none appearance-none cursor-pointer hover:bg-slate-200 pr-5"
                          >
                            <option value="GAUGE">检具 (Gauge)</option>
                            <option value="JIG">工装 (Jig)</option>
                            <option value="FIXTURE">成型工装 (Fixture)</option>
                            <option value="MOLD">模具 (Mold)</option>
                          </select>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-1.5 top-2 text-slate-400 pointer-events-none group-hover:text-slate-600">
                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </td>

                      {/* 名称 */}
                      <td className={tableStyles.td}>
                        <input
                          value={item.name}
                          onChange={(e) => {
                            updateInvestmentItem(item.id, (inv) => ({ ...inv, name: e.target.value }));
                          }}
                          className="bg-transparent w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-[12px] font-medium"
                        />
                      </td>

                      {/* 分摊组 */}
                      <td className={tableStyles.td}>
                        <div className="relative group">
                          <select
                            value={item.amortizationGroup || 'tooling1'}
                            onChange={(e) => {
                              updateInvestmentItem(item.id, (inv) => ({ ...inv, amortizationGroup: e.target.value }));
                            }}
                            className="bg-slate-50 w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 text-[11px] border-none appearance-none cursor-pointer hover:bg-slate-100 pr-5"
                          >
                            <option value="tooling1">Tooling 1</option>
                            <option value="tooling2">Tooling 2</option>
                            <option value="rnd">R&D</option>
                          </select>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-1.5 top-2 text-slate-400 pointer-events-none group-hover:text-slate-600">
                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </td>

                      {/* 数量参数 */}
                      <td className={tableStyles.td}>
                        <div className="flex flex-col gap-0.5">
                          <input
                            type="number"
                            min="0"
                            step={item.type === 'FIXTURE' ? '0.1' : '1'}
                            placeholder={typeInfo.unit}
                            value={item.quantity || ''}
                            disabled={!item.autoCalculate}
                            onChange={(e) => {
                              const newQty = parseFloat(e.target.value) || 0;
                              updateInvestmentItem(item.id, (inv) => ({
                                ...inv,
                                quantity: newQty,
                                amount: inv.autoCalculate ? newQty * (inv.unitPrice || 0) : inv.amount
                              }));
                            }}
                            className={`bg-transparent w-full text-right focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-[12px] ${
                              item.autoCalculate ? 'text-slate-700' : 'text-slate-400 cursor-not-allowed'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400 text-right">{typeInfo.unit}</span>
                        </div>
                      </td>

                      {/* 计算金额 */}
                      <td className={`${tableStyles.td} text-right`}>
                        {item.autoCalculate ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className={`text-[12px] font-bold ${displayAmount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                              ¥{displayAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                            </span>
                            <Sparkles size={10} className="text-blue-500 shrink-0" title="自动计算" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            <span className="text-slate-400 mr-0.5 text-[12px]">¥</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.amount || ''}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                updateInvestmentItem(item.id, (inv) => ({ ...inv, amount: newAmount }));
                              }}
                              className="bg-transparent w-24 text-right text-[12px] font-bold text-amber-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5"
                            />
                          </div>
                        )}
                      </td>

                      {/* 供应商 */}
                      <td className={tableStyles.td}>
                        <input
                          value={item.supplier || ''}
                          placeholder="供应商名称"
                          onChange={(e) => {
                            updateInvestmentItem(item.id, (inv) => ({ ...inv, supplier: e.target.value }));
                          }}
                          className="bg-transparent w-full text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-[12px] placeholder:text-slate-300"
                        />
                      </td>

                      {/* 操作 */}
                      <td className={`${tableStyles.td} text-center`}>
                        <button
                          className="inline-flex items-center justify-center h-6 w-6 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          onClick={() => removeInvestmentItem(item.id)}
                          title="删除投资项"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* 增加投资项按钮行 */}
                <tr className={tableStyles.tr}>
                  <td colSpan={6} className={`${tableStyles.td} text-center py-3`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={addInvestmentItem}
                    >
                      <Plus size={16} />
                      增加投资项
                    </Button>
                  </td>
                </tr>

                {/* 总计行 */}
                <tr className="bg-amber-50/80">
                  <td colSpan={3} className={`${tableStyles.td} text-[12px] font-bold text-amber-900`}>
                    投资项总计（{activeProduct.investmentItems.length} 项）
                  </td>
                  <td className={`${tableStyles.td} text-right`}>
                    <span className="text-[12px] font-bold text-amber-700">
                      ¥{totalInvestment.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td colSpan={2} className={tableStyles.td}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 计算说明 */}
          <div className="p-4 bg-blue-50 border-t border-blue-100">
            <div className="flex gap-2">
              <AlertCircle size={14} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-800 leading-relaxed">
                <div className="font-semibold mb-1">固定单价计算规则：</div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-blue-700">
                  <span><strong>检具：</strong>点位数 × ¥150/点</span>
                  <span><strong>工装：</strong>功能模块数 × ¥500/模块</span>
                  <span><strong>成型工装：</strong>长度 × ¥0.5/mm</span>
                  <span><strong>模具：</strong>重量/体积 × ¥200/单位</span>
                </div>
                <p className="mt-1.5 text-blue-500">
                  单价可根据实际情况调整 · 切换"手动"模式可直接输入总金额
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}