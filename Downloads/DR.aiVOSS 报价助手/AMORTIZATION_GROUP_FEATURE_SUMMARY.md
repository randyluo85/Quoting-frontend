# 投资项分组分摊功能实现总结

## 功能概述

成功实现了**投资项分组分摊 (Amortization Group)** 功能，允许Sales将不同设计寿命或归属的投资项（模具、检具、夹具、工装）分配到不同的分摊组，每组独立计算分摊金额并在报表中独立展示。

---

## 功能特性

### 1. **投资项分组管理**
- 在**成本核算 (Cost View) - 投资 (Investment) Tab**中
- 每个投资项可以分配到不同的分摊组：
  - **Tooling 1**: 默认组，通常用于主要模具和检具
  - **Tooling 2**: 次要工装或延迟投资
  - **R&D**: 研发相关投资项
- 支持快速切换投资项所属的分摊组

### 2. **分摊组独立配置**
- 在**报价汇总 (Quote View) - 商业参数 Tab**中
- 每个分摊组可以独立配置：
  - **分摊年限 (years)**: 投资分摊期限（年）
  - **分摊基数 (volume)**: 分摊件数
  - **资本利率 (capitalInterestRate)**: 统一使用项目资本利率
- 实时显示每组的：
  - 投资总额
  - 含息总额
  - 单件分摊额

### 3. **成本层级 (SK) 动态展示**
- SK成本明细表中动态显示所有分摊组
- 每组独立显示：
  - 单件分摊额 (¥)
  - 占SK-2比例 (%)
  - 计算说明（投资额 × 含息因子 / 分摊件数，年限）

### 4. **QS年度报表动态列**
- QS年度表格列头动态显示分摊组
- 每年每组独立显示分摊金额
- 支持不同年限的分摊：
  - 如Tooling 1分摊2年，则前2年有金额，后续为0
  - 如Tooling 2分摊3年，则前3年有金额，后续为0

---

## 技术实现

### 1. **数据结构**

#### AmortizationGroup (costCalc.ts)
```typescript
export interface AmortizationGroup {
  id: string;        // 组别ID，如 'tooling1', 'tooling2', 'rnd'
  name: string;      // 组别名称，如 'Tooling 1', 'Tooling 2', 'R&D'
  years: number;     // 分摊年限
  volume: number;    // 分摊基数（件数）
  color: string;     // 显示颜色
}
```

#### InvestmentItem (ProjectDetail.tsx)
```typescript
export interface InvestmentItem {
  // ... 其他字段
  amortizationGroup?: string; // 分摊组别 (如 'tooling1', 'tooling2', 'rnd')
}
```

### 2. **计算逻辑**

#### 投资按组统计 (costCalc.ts)
```typescript
// 计算每个产品的投资按组分类
const investmentByGroup: Record<string, number> = {};
(product.investmentItems || []).forEach((item) => {
  const itemAmount = item.autoCalculate 
    ? (item.quantity || 0) * (item.unitPrice || 0) 
    : item.amount;
  const group = item.amortizationGroup || 'tooling1';
  investmentByGroup[group] = (investmentByGroup[group] || 0) + itemAmount;
});
```

#### 分组分摊计算 (calcSK)
```typescript
const unitAmortByGroup: Record<string, number> = {};
if (p.amortizationMode === 'AMORTIZED') {
  p.amortizationGroups.forEach((group) => {
    const groupInvestment = investmentByGroup[group.id] || 0;
    if (groupInvestment > 0 && group.volume > 0) {
      const groupInterestFactor = 1 + (p.capitalInterestRate / 100) * group.years;
      const groupWithInterest = groupInvestment * groupInterestFactor;
      const unitAmort = groupWithInterest / group.volume;
      unitAmortByGroup[group.id] = unitAmort;
    }
  });
}
```

#### 年度分摊计算 (calcYearlyData)
```typescript
const amortByGroup: Record<string, number> = {};
p.amortizationGroups.forEach((group) => {
  // 检查当前年份是否在该组的分摊期内
  const withinGroupPeriod = idx < group.years;
  const groupUnitAmort = skCalc.unitAmortByGroup[group.id] || 0;
  const yearGroupAmort = withinGroupPeriod ? groupUnitAmort : 0;
  amortByGroup[group.id] = yearGroupAmort;
});
```

### 3. **UI组件**

#### InvestmentTabContent.tsx
- 投资项表格中增加"分摊组"列
- 下拉选择框切换分摊组（Tooling 1 / Tooling 2 / R&D）

#### QuoteView.tsx - 商业参数Tab
- 分摊组详细配置卡片
- 实时显示每组的投资额、含息总额、单件分摊额
- 可调整每组的分摊年限和基数

#### QuoteView.tsx - SK成本层级Tab
- 动态渲染每个分摊组的分摊行
- 根据分摊组ID分配不同颜色（tooling1=amber, tooling2=purple, rnd=teal）

#### QuoteView.tsx - QS年度Tab
- 动态生成分摊组列头
- 每年每组独立显示分摊金额
- 合计行自动计算跨列合并

---

## 默认配置

```typescript
amortizationGroups: [
  { id: 'tooling1', name: 'Tooling 1', years: 2, volume: 80000, color: 'blue' },
  { id: 'tooling2', name: 'Tooling 2', years: 3, volume: 120000, color: 'purple' },
  { id: 'rnd', name: 'R&D', years: 2, volume: 80000, color: 'emerald' },
]
```

---

## 使用场景

### 场景1：不同寿命的模具
- **Tooling 1**: 主要冲压模具，设计寿命2年，80,000件
- **Tooling 2**: 辅助检具，设计寿命3年，120,000件
- 每组独立计算分摊，避免混合导致的不准确

### 场景2：分期投资
- **Tooling 1**: 第一期模具投资，项目启动时采购
- **Tooling 2**: 第二期模具投资，项目扩产时采购
- 不同分摊策略反映实际投资时间点

### 场景3：研发与生产分离
- **Tooling 1/2**: 生产模具和工装
- **R&D**: 研发设计费、测试费、认证费
- 财务核算要求分开展示

---

## 向后兼容

系统保留了向后兼容性：
- 如果没有使用分组（`unitAmortByGroup`为空），则展示传统的"投资分摊 (Tooling)"和"研发分摊 (R&D)"行
- 使用分组后，自动隐藏传统行，显示分组明细

---

## 后续优化建议

1. **增加/删除分摊组**: 允许Sales动态增加或删除分摊组
2. **分摊组重命名**: 允许自定义分摊组名称
3. **分摊组预设模板**: 提供行业标准的分摊组配置模板
4. **分摊组图表可视化**: 在Payback和BC视图中增加分组分摊的图表展示
5. **分摊组导出**: 在PDF报价单中体现分组分摊明细

---

## 测试要点

- [x] 投资项可以正确分配到不同分摊组
- [x] 分摊组配置变更实时反映到成本计算
- [x] SK成本明细表动态显示所有分摊组
- [x] QS年度表格动态显示分摊组列
- [x] 不同年限的分摊正确计算（超过年限后为0）
- [x] 向后兼容性测试（没有分组时的表现）

---

## 相关文件

- `/src/app/components/project/costCalc.ts` - 核心计算逻辑
- `/src/app/components/project/InvestmentTabContent.tsx` - 投资项管理UI
- `/src/app/components/project/QuoteView.tsx` - 报价汇总与分摊组配置UI
- `/src/app/pages/ProjectDetail.tsx` - 数据结构定义
