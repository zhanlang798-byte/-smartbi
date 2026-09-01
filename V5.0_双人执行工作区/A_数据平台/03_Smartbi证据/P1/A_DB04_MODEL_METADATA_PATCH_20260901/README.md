# DB04 模型元数据修复包（A，2026-09-01）

## 结论

从 2026-08-31 下载的最新内部迁移包 `migrate (7).xml` 中复核主模型 `MDL_XH202612_V50_COUNTRY_RESERVE`，确认以下配置会直接导致 B 的 AI-01、AI-04、AI-16、AI-19、AI-20 失败：

1. `V50_MVP_country_latest.latest_odi_stock_year` 在语义层被配置为 `DATE`，会返回类似 `18180` 的日期序列值，而不是四位年份。
2. `V50_source_registry.is_proxy` 原值字段被隐藏，而 `sum(is_proxy)` 度量可见，问数链会把布尔/空值错误聚合为整数。
3. 多表 `source_id`、`is_proxy` 使用相同语义别名，问数链可能跨表拼接来源或选错代理标记。
4. `latest_odi_stock_usd` 缺少与外汇储备等相似金额字段的语义隔离说明。

## 已修复的元数据

- 月度风险来源字段改为 `risk_source_id`，代理原值改为 `risk_is_proxy`。
- 来源登记字段改为 `registry_source_id`、`registry_is_proxy`；原值字段恢复可见，`sum(is_proxy)` 度量及其节点隐藏。
- ODI 存量字段语义别名改为 `odi_stock_usd_exact`，明确禁止替换成储备或其他金额。
- ODI 年份改为 `INTEGER` / `<整型-默认值>`，语义别名改为 `odi_stock_year`。
- 同步更新模型定义 JSON、语义字段和节点描述；资源 ID、表 ID、页面和 B 原始证据未改。

## 文件与校验

- 原始输入：`C:/Users/33625/Downloads/migrate (7).xml`
- 原始 SHA-256：`F4852D333FBFD60E0D228160E2DBB85E3EBFC4D242D4CCDF809DDD06A96FD77D`
- 修复包：`migrate_MODEL_METADATA_PATCH_20260901.xml`
- 修复包 SHA-256：`FA99DDDAB3AB7146104A77AC5AF06936C317953F93C253643378E10A5BD8314F`
- 模型 ID：`6b5dff57a4093ba3db07d2903905fe40`
- 修复后模型时间：`2026-09-01 19:46:31 +08:00`

## 使用边界

该文件是受控内部修复包，不得公开上传。当前 Smartbi 会话已退出登录，因此本轮只完成离线修复和结构校验，尚未在平台覆盖模型。该 XML 沿用下载包结构，仍包含 DB03/DB05/DB06 页面；恢复登录后优先在平台界面逐项修改主模型元数据。只有导入界面能明确选择“仅主模型”、且已备份当前资源时才可使用本包；不能选择资源时不得整包导入，以免覆盖页面。发布后由 B 保持原问句复测 AI-01、AI-04、AI-16、AI-17、AI-19、AI-20，并再做 25 问全量回归。
