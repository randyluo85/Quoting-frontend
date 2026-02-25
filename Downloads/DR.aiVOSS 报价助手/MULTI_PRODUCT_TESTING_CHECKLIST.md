# 多产品独立报价功能 - 验证清单

## 快速验证步骤

### 1. 进入项目详情页
- 访问任意项目详情页（例如：项目ID = 1）
- 系统应加载默认的Mock产品数据（LAD-20040021 High Pressure Brake Line）

### 2. 查看BOM清单
- 切换到 "BOM清单" Tab
- 确认产品已加载物料和工艺数据
- VM点击"确认成本"按钮，锁定BOM

### 3. 验证报价汇总（QuoteView）

#### 3.1 单产品场景
- 切换到 "报价汇总" Tab
- ✅ 验证：产品选择器不显示（因为只有1个产品）
- ✅ 验证：显示产品LAD-20040021的成本数据
- ✅ 验证：Header显示HK III、SK-2、报价单价

#### 3.2 商业参数输入
- 切换到"商业参数" Tab
- ✅ 修改报价单价为 ¥68.50
- ✅ 修改目标利润率为 26%
- ✅ 修改年降比例为 3%
- ✅ 验证：SK成本层级实时更新
- ✅ 验证：QS年度表格实时更新

#### 3.3 QS年度表格
- 切换到"报价汇总(QS)" Tab
- ✅ 验证：表格显示5年数据（2026-2030）
- ✅ 验证：动态列显示 Tooling 1、Tooling 2、R&D
- ✅ 验证：DB4%计算正确，显示预警颜色
- ✅ 验证：首年DB4 应该为正值（约26%）

### 4. 验证商业案例（BusinessCaseView）

#### 4.1 基础展示
- 切换到 "商业案例" Tab
- ✅ 验证：产品选择器不显示（单产品）
- ✅ 验证：显示净销售额、HK III总成本
- ✅ 验证：DB I（生产毛利）为正
- ✅ 验证：DB IV（净利润）为正

#### 4.2 年度明细表
- ✅ 验证：表格显示5年详细数据
- ✅ 验证：Net Sales = Volume × VP
- ✅ 验证：DB I = Net Sales - HK III Total
- ✅ 验证：DB IV = Net Sales - SK-2 Total
- ✅ 验证：合计行计算正确

### 5. 验证投资回收（PaybackView）

#### 5.1 核心指标
- 切换到 "投资回收" Tab
- ✅ 验证：产品选择器不显示（单产品）
- ✅ 验证：NPV为正（项目可行）
- ✅ 验证：项目总投资显示正确（投资+研发）
- ✅ 验证：动态回收期约1.2年

#### 5.2 现金流图表
- ✅ 验证：瀑布图正确显示年度净现金流
- ✅ 验证：累计折现现金流折线正确
- ✅ 验证：初始投资显示为负值（红色柱）
- ✅ 验证：后续年份为正值（绿色柱）

#### 5.3 AI诊断
- ✅ 验证：AI诊断文本合理
- ✅ 验证：显示"项目财务状况健康"
- ✅ 验证：显示NPV金额和回收期

### 6. 多产品场景测试（需要Mock数据调整）

#### 6.1 添加第二个产品
修改 `/src/app/components/project/BOMView.tsx` 的 `generateMockProducts` 函数，添加第二个产品：

```typescript
export const generateMockProducts = (): Product[] => [
  {
    id: 'LAD-20040021',
    name: 'High Pressure Brake Line',
    annualVolume: 72000,
    salesParams: { /* ... */ },
    // ... 其他数据
  },
  {
    id: 'LAD-20040022',
    name: 'Low Pressure Brake Line',
    annualVolume: 48000,
    salesParams: {
      ...DEFAULT_SALES_PARAMS,
      quotedPrice: 52.00,
      targetMargin: 28.0,
      annualReductionRate: 2.5,
      amortizationGroups: [
        { id: 'tooling1', name: 'Tooling 1', years: 2, volume: 50000, color: 'blue' },
        { id: 'rnd', name: 'R&D', years: 2, volume: 50000, color: 'emerald' },
      ],
    },
    materials: [/* 复制第一个产品的materials */],
    processes: [/* 复制第一个产品的processes */],
  }
];
```

#### 6.2 验证产品选择器
- 刷新页面，切换到"报价汇总"
- ✅ 验证：产品选择器显示（Header下方）
- ✅ 验证：显示2个产品按钮
- ✅ 验证：显示年产量信息
  - LAD-20040021 (72,000 件/年)
  - LAD-20040022 (48,000 件/年)

#### 6.3 验证产品切换
- 点击 LAD-20040021
  - ✅ 按钮变为蓝色高亮
  - ✅ 成本数据切换到产品1
  - ✅ 报价单价显示 ¥68.50
  - ✅ QS表格显示72,000产量数据
  
- 点击 LAD-20040022
  - ✅ 按钮变为蓝色高亮
  - ✅ 成本数据切换到产品2
  - ✅ 报价单价显示 ¥52.00
  - ✅ QS表格显示48,000产量数据

#### 6.4 验证商业案例切换
- 切换到"商业案例" Tab
- ✅ 验证：产品选择器显示
- 切换产品1和产品2
  - ✅ 净销售额不同
  - ✅ DB I / DB IV 不同
  - ✅ 年度明细表数据不同

#### 6.5 验证投资回收切换
- 切换到"投资回收" Tab
- ✅ 验证：产品选择器显示
- 切换产品1和产品2
  - ✅ NPV不同
  - ✅ 回收期不同
  - ✅ 现金流图表数据不同
  - ✅ AI诊断文本不同

### 7. 边界条件测试

#### 7.1 产品无独立参数
- 修改Mock数据，删除产品2的salesParams
- ✅ 验证：产品2使用项目级参数（继承）
- ✅ 验证：切换产品2时不报错

#### 7.2 产品无独立年产量
- 修改Mock数据，删除产品2的annualVolume
- ✅ 验证：产品2使用项目级年产量（120,000）
- ✅ 验证：QS表格使用项目年产量计算

#### 7.3 空产品数组
- 修改Mock数据，返回空数组 []
- ✅ 验证：显示"等待BOM上传"提示
- ✅ 验证：不显示产品选择器
- ✅ 验证：不报错崩溃

### 8. 性能测试

#### 8.1 切换响应速度
- 快速点击产品选择器按钮
- ✅ 验证：切换延迟 < 100ms
- ✅ 验证：UI无闪烁或卡顿
- ✅ 验证：数据正确更新

#### 8.2 多产品场景
- 添加5个产品到Mock数据
- ✅ 验证：产品选择器正确显示所有产品
- ✅ 验证：切换仍然流畅
- ✅ 验证：内存占用正常

### 9. 用户体验测试

#### 9.1 视觉一致性
- ✅ 三个Tab的产品选择器样式一致
- ✅ 选中状态高亮清晰
- ✅ 年产量信息易读

#### 9.2 交互流畅性
- ✅ 按钮hover效果正常
- ✅ 点击反馈迅速
- ✅ 数据加载无明显延迟

#### 9.3 信息清晰度
- ✅ 产品ID清晰可辨
- ✅ 年产量格式化显示（千位分隔）
- ✅ 当前选中产品一目了然

---

## 已知限制

1. **参数持久化未实现**
   - 当前在QuoteView中修改产品参数，不会保存到products数组
   - 刷新页面后，参数修改丢失
   - 需要在ProjectDetail中实现产品更新handler

2. **产品参数编辑体验**
   - 当前修改参数后，需要手动切换产品才能看到效果
   - 建议添加"保存"按钮或实时持久化

3. **报价单PDF生成**
   - 未测试多产品场景的PDF生成
   - 可能需要添加产品选择或生成所有产品报价单

---

## 回归测试清单

确保改动不影响现有功能：

- [ ] 单产品项目的所有功能正常
- [ ] BOM上传和解析正常
- [ ] 成本核算正常
- [ ] 投资项管理正常
- [ ] 分摊组配置正常
- [ ] 报价单导出正常
- [ ] 所有Tab页面切换正常
- [ ] 项目列表页面正常
- [ ] 项目创建/编辑正常

---

## 下一步开发建议

### 优先级1: 参数持久化
实现产品级参数的保存和加载：
```typescript
// ProjectDetail.tsx
const handleProductParamsUpdate = (productId: string, params: SalesParams) => {
  setProducts(prev => prev.map(p => 
    p.id === productId ? { ...p, salesParams: params } : p
  ));
};
```

### 优先级2: 批量操作
添加"复制参数到所有产品"功能：
```typescript
const copyParamsToAll = (sourceProductId: string) => {
  const sourceParams = products.find(p => p.id === sourceProductId)?.salesParams;
  if (sourceParams) {
    setProducts(prev => prev.map(p => ({ ...p, salesParams: sourceParams })));
  }
};
```

### 优先级3: 产品汇总视图
添加项目级别的汇总Dashboard：
- 所有产品的总投资
- 所有产品的总销售额
- 项目整体利润率
- 多产品对比图表
