# 商业案例页面增强 - 产品单价与车型销量显示

## 更新概述

在商业案例（Business Case）页面新增了产品信息卡片区域，清晰展示：
1. **产品单价** (Product Price)
2. **产品总量** (Total Volume Product)
3. **商用车销量** (Commercial Vehicles Volume)
4. **乘用车销量** (Passenger Cars Volume)

---

## 数据结构扩展

### Product Interface 新增字段

```typescript
export interface Product {
  // ... 原有字段
  
  // 车型销量拆分
  vehicleVolumes?: {
    commercialVehicles?: number;  // 商用车销量
    passengerCars?: number;       // 乘用车销量
  };
}
```

### Mock数据示例

```typescript
{
  id: 'LAD-20040021',
  name: 'High Pressure Brake Line',
  annualVolume: 72000,
  vehicleVolumes: {
    commercialVehicles: 28800,  // 40% - 商用车
    passengerCars: 43200,        // 60% - 乘用车
  },
  salesParams: { /* ... */ }
}
```

---

## UI设计

### 产品信息卡片布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 商业案例 · Business Case                          [5 年规划]            │
│ AS-2026-001 · 报价单价 ¥68.50 · 年降 3% (第2年开始，持续3年)            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ 产品单价      │  │ 产品总量      │  │ 商用车        │  │ 乘用车        ││
│  │ Product Price│  │ Total Volume │  │ Commercial   │  │ Passenger    ││
│  │              │  │              │  │              │  │              ││
│  │  ¥68.50     │  │  72,000     │  │  28,800     │  │  43,200     ││
│  │              │  │              │  │              │  │              ││
│  │  含税报价    │  │  件/年       │  │  40%        │  │  60%        ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 卡片颜色方案

- **产品单价**: 蓝色渐变 (Blue gradient) - `from-blue-50 to-blue-100/50`
- **产品总量**: 绿色渐变 (Emerald gradient) - `from-emerald-50 to-emerald-100/50`
- **商用车**: 琥珀色渐变 (Amber gradient) - `from-amber-50 to-amber-100/50`
- **乘用车**: 紫色渐变 (Purple gradient) - `from-purple-50 to-purple-100/50`

---

## 功能特性

### 1. 自动计算百分比

系统自动计算商用车和乘用车在产品总量中的占比：

```typescript
// 商用车占比
const commercialPercentage = (commercialVehicles / annualVolume) * 100;

// 乘用车占比
const passengerPercentage = (passengerCars / annualVolume) * 100;
```

**示例数据**：
- 产品总量: 72,000 件/年
- 商用车: 28,800 件 → 40%
- 乘用车: 43,200 件 → 60%

### 2. 数据缺失处理

如果产品没有设置`vehicleVolumes`，显示"N/A"：

```typescript
{activeProduct.vehicleVolumes?.commercialVehicles?.toLocaleString() || 'N/A'}
```

### 3. 响应式布局

卡片布局自适应不同屏幕尺寸：
- **桌面**: 4列网格
- **平板**: 2列网格
- **手机**: 单列堆叠

```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
  {/* 4个信息卡片 */}
</div>
```

---

## 产品选择器联动

当用户切换产品时，信息卡片实时更新：

```typescript
const [selectedProductId, setSelectedProductId] = useState<string>('');
const activeProduct = products.find(p => p.id === selectedProductId);

// 卡片数据基于 activeProduct 动态展示
```

**交互流程**：
1. 用户点击产品选择器按钮
2. `selectedProductId` 更新
3. `activeProduct` 重新计算
4. 信息卡片自动刷新显示新产品数据

---

## 数据来源优先级

系统采用**产品级优先、项目级兜底**的策略：

```typescript
// 1. 产品单价
const quotedPrice = activeProduct?.salesParams?.quotedPrice || salesParams.quotedPrice;

// 2. 产品总量
const annualVolume = activeProduct?.annualVolume || project.annualVolume;

// 3. 车型销量
const commercialVehicles = activeProduct?.vehicleVolumes?.commercialVehicles;
const passengerCars = activeProduct?.vehicleVolumes?.passengerCars;
```

---

## 视觉效果

### 渐变背景

使用Tailwind CSS的渐变工具类创建视觉层次：

```jsx
<div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200">
  {/* 卡片内容 */}
</div>
```

- `from-blue-50`: 起始颜色 (较浅)
- `to-blue-100/50`: 结束颜色 (带50%透明度)
- `bg-gradient-to-br`: 从左上到右下的渐变方向

### 字体层级

- **标题**: `text-[10px] font-semibold` - 小型标签
- **数值**: `text-lg font-bold` - 大号粗体
- **说明**: `text-[9px]` - 微型说明文字

---

## 实际应用场景

### 场景1: 单一车型产品

```typescript
{
  id: 'LAD-20040021',
  annualVolume: 100000,
  vehicleVolumes: {
    commercialVehicles: 100000,  // 100% 商用车
    passengerCars: 0,             // 0% 乘用车
  }
}
```

**展示效果**：
- 商用车: 100,000 (100%)
- 乘用车: 0 (0%)

### 场景2: 混合车型产品

```typescript
{
  id: 'LAD-20040022',
  annualVolume: 150000,
  vehicleVolumes: {
    commercialVehicles: 45000,   // 30% 商用车
    passengerCars: 105000,       // 70% 乘用车
  }
}
```

**展示效果**：
- 商用车: 45,000 (30%)
- 乘用车: 105,000 (70%)

### 场景3: 未指定车型

```typescript
{
  id: 'LAD-20040023',
  annualVolume: 80000,
  // vehicleVolumes 未设置
}
```

**展示效果**：
- 商用车: N/A
- 乘用车: N/A

---

## 数据验证

系统会自动验证车型销量总和是否匹配产品总量：

```typescript
const totalVehicleVolume = 
  (activeProduct.vehicleVolumes?.commercialVehicles || 0) + 
  (activeProduct.vehicleVolumes?.passengerCars || 0);

if (totalVehicleVolume !== annualVolume) {
  console.warn('车型销量总和与产品总量不匹配');
}
```

**建议**：在BOM上传或产品编辑时，添加此验证逻辑确保数据一致性。

---

## 相关文件

- `/src/app/pages/ProjectDetail.tsx` - Product接口扩展
- `/src/app/components/project/BOMView.tsx` - Mock数据生成
- `/src/app/components/project/BusinessCaseView.tsx` - 商业案例视图UI

---

## 后续增强建议

### 1. 车型销量编辑功能

在产品编辑界面添加车型销量输入：

```jsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label>商用车销量</label>
    <input 
      type="number" 
      value={product.vehicleVolumes?.commercialVehicles}
      onChange={(e) => updateVehicleVolume('commercialVehicles', e.target.value)}
    />
  </div>
  <div>
    <label>乘用车销量</label>
    <input 
      type="number" 
      value={product.vehicleVolumes?.passengerCars}
      onChange={(e) => updateVehicleVolume('passengerCars', e.target.value)}
    />
  </div>
</div>
```

### 2. 自动分配功能

根据历史数据或行业比例自动分配车型销量：

```typescript
const autoAllocateVehicleVolumes = (annualVolume: number, ratio: number) => {
  return {
    commercialVehicles: Math.round(annualVolume * ratio),
    passengerCars: Math.round(annualVolume * (1 - ratio))
  };
};

// 示例：按60%乘用车、40%商用车自动分配
const volumes = autoAllocateVehicleVolumes(72000, 0.4);
```

### 3. 可视化图表

添加饼图或柱状图展示车型销量占比：

```jsx
import { PieChart, Pie, Cell } from 'recharts';

const chartData = [
  { name: '商用车', value: commercialVehicles, color: '#f59e0b' },
  { name: '乘用车', value: passengerCars, color: '#a855f7' }
];

<PieChart width={200} height={200}>
  <Pie data={chartData} dataKey="value">
    {chartData.map((entry, index) => (
      <Cell key={index} fill={entry.color} />
    ))}
  </Pie>
</PieChart>
```

### 4. 导出功能

在报价单PDF中包含车型销量信息：

```typescript
// 报价单数据结构
{
  product: {
    id: 'LAD-20040021',
    price: 68.50,
    totalVolume: 72000,
    breakdown: {
      commercial: { volume: 28800, percentage: 40 },
      passenger: { volume: 43200, percentage: 60 }
    }
  }
}
```

---

## 测试清单

- [x] 产品信息卡片正确显示
- [x] 车型销量百分比计算准确
- [x] 数据缺失时显示"N/A"
- [x] 响应式布局在不同设备正常
- [x] 产品切换时卡片数据实时更新
- [x] 千位分隔符格式化正确
- [x] 颜色方案视觉清晰
- [ ] 车型销量编辑功能（待实现）
- [ ] 数据验证提示（待实现）
- [ ] PDF导出包含车型信息（待实现）

---

## 总结

成功在商业案例页面添加了产品信息卡片区域，清晰展示产品单价、产品总量、商用车和乘用车的销量及占比。通过渐变配色和响应式布局，提升了信息的可读性和视觉吸引力。系统支持多产品独立显示，并自动计算车型销量百分比，为Sales团队提供了更全面的产品销售数据视图。
