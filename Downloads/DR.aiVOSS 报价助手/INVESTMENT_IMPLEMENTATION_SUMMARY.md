# BOM管理-投资项清单功能实现总结

## ✅ 已完成的工作

### 1. 数据类型扩展（ProjectDetail.tsx）
已在 `InvestmentItem` 接口中添加以下字段：
```typescript
export interface InvestmentItem {
  id: number;
  type: 'MOLD' | 'GAUGE' | 'JIG' | 'FIXTURE';
  name: string;
  amount: number;
  supplier?: string;
  leadTime?: number;
  // 新增字段
  quantity?: number;        // 数量参数（点位数/功能模块数/长度/重量或体积）
  unitPrice?: number;       // 单价（固定值）
  autoCalculate?: boolean;  // 是否自动计算
}
```

### 2. Tab导航更新（BOMView.tsx）
已在第586-592行添加第三个tab：
```typescript
<TabsTrigger value="investment" activeValue={activeTab} setActiveValue={setActiveTab}>
  投资项清单 ({activeProduct?.investmentItems?.length || 0})
</TabsTrigger>
```

### 3. 投资项清单完整代码
代码已准备完毕（见 /investment-tab-code.txt），需要插入到 BOMView.tsx 第932行之后。

## 📋 投资项清单功能特性

### 快速计算规则
- **检具 (GAUGE)**: 点位数 × ¥150/点
- **工装 (JIG)**: 功能模块数 × ¥500/模块
- **成型工装 (FIXTURE)**: 长度(mm) × ¥0.5/mm
- **模具 (MOLD)**: 重量/体积 × ¥200/单位

### 表格列设计
1. **类型** - 下拉选择（检具/工装/成型工装/模具）
2. **名称** - 可编辑输入框
3. **数量参数** - 数字输入框（显示单位提示）
4. **单价** - 可调整的数字输入框
5. **计算金额** - 自动计算显示（带✨图标标识自动计算）
6. **供应商** - 可编辑输入框
7. **操作** - 删除按钮

### 交互功能
1. **类型切换** - 自动更新单价和重新计算金额
2. **数量输入** - 实时计算金额
3. **单价调整** - 支持自定义单价，金额自动重新计算
4. **增加投资项** - 表格底部按钮（与工艺清单一致）
5. **删除投资项** - 每行右侧删除按钮
6. **总计显示** - 表格底部总计行

### UI样式
- 与物料清单、工艺清单保持一致的表格样式
- 12px 字体大小
- 空状态提示（TrendingUp图标）
- 计算说明信息框（蓝色背景）

## 🔧 待完成步骤

由于文件编辑工具限制，需要手动完成以下操作：

1. 打开 `/src/app/components/project/BOMView.tsx`
2. 定位到第932行（工艺清单的 `</TabsContent>` 结束标签）
3. 在该行之后插入 `/investment-tab-code.txt` 中的完整代码
4. 保存文件

插入位置示意：
```typescript
// 第931行
                  </Card>
                </TabsContent>    // 工艺清单结束

                // 👈 在这里插入投资项清单TabsContent代码

              </Tabs>             // 第933行
           </div>
         )}
```

## ✅ 集成验证清单

插入代码后，验证以下功能：
- [ ] 投资项清单tab可以正常切换
- [ ] 空状态显示正确
- [ ] "增加投资项"按钮在表格底部可用
- [ ] 类型选择自动更新单价
- [ ] 数量×单价=金额自动计算
- [ ] 自定义单价后金额重新计算
- [ ] 删除投资项功能正常
- [ ] 总计行显示正确
- [ ] 计算说明框显示正确

## 🎯 业务价值

该功能简化了投资项成本估算流程：
1. **标准化定价** - 预设固定单价，确保估算一致性
2. **快速计算** - 只需输入数量参数，金额自动计算
3. **灵活调整** - 支持根据实际情况调整单价
4. **可追溯性** - 完整记录投资项明细和供应商信息
5. **与成本核算联动** - 数据自动同步到成本核算页面
