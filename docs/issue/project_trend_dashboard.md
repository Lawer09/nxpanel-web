# 项目趋势 Dashboard 筛选与展示收敛说明

## 出现场景

项目趋势 Dashboard 已经能够从项目报表和项目管理跳转进入，但页面中仍保留了投放状态输入框，且多序列折线图有时会全部显示为同一颜色，影响数据口径理解和图表可读性。

## 问题原因

- `adStatus` 已经在跳转链路中透传，继续在 Dashboard 顶部展示输入框会让页面存在重复筛选入口
- 如果 Dashboard 继续隐式按 `adStatus` 过滤，而页面上又没有明确说明，会造成数据口径不透明
- 折线图仅依赖默认主题色推断时，在部分配置组合下不能稳定区分不同 `series`
- Dashboard 日期范围如果不复用报表快捷项，会和项目报表筛选体验割裂
- 跳转参数只带单边日期时，沿用残缺日期会让趋势口径不可预期
- 跳转参数即使带了完整日期，但若起止是同一天，也不适合趋势分析场景

## 解决方式

- Dashboard 顶部移除 `adStatus` 输入框
- Dashboard 查询彻底不再使用 `adStatus` 过滤，即使 URL 中仍兼容保留该参数
- 页面头部保留项目当前投放状态标签，仅做只读展示
- 页面头部同步展示项目当前限流状态标签，复用项目报表的 `isLimited` 映射口径
- 所有多序列折线图改为显式 `series -> color` 映射
- 顶部日期范围改为复用项目报表同一套快捷日期预设
- 跳转进入若只携带单边日期参数，或起止是同一天，统一回退到最近 7 天
- 成本结构趋势图额外显式指定面积图系列颜色，避免两层堆叠颜色难区分
- 多序列折线图统一略微加粗线条，提升趋势对比可读性
- 国家贡献排行仅保留贡献值大于 `0` 的国家，避免 `0` 值国家挤占排行空间
- 主图区块统一改名为“收益趋势”，国家下钻同步改为“国家收益趋势”
- 当项目报表新增 `adRevenueNow` 与 `adRevenueDiff` 后，单看列表不利于理解其时间变化，需要在 Dashboard 增加独立对比趋势图，同时在报表指标选择处补字段释义，避免口径歧义
- 国家贡献排行切换指标时，不应重新请求整页数据；国家维度聚合结果已经足够支持前端本地切换、排序和小占比国家合并
- 广告收益对比趋势改为堆叠柱状图，更贴近 `adRevenueNow <= adRevenue` 且 `adRevenueDiff = adRevenueNow - adRevenue` 的对比关系

## 影响范围

- `src/pages/report/project-trend/index.tsx`
- `docs/components/project_trend_dashboard.md`
- `docs/version/v1.4.2`

## 相关文件

- `src/pages/report/project-trend/index.tsx`
- `docs/components/project_trend_dashboard.md`
- `docs/version/v1.4.2`
