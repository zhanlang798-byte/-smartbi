# A→B｜AIChat/Agent 修复复测交接（2026-09-02）

## 当前状态

`A_AGENT_REPAIR_PUBLISHED / A_SELFTEST_AI01_AI04_AI17_PASS / B_DATA_INSIGHT_RETEST_PENDING`

## A 已完成

1. 在既有 `AGENT_XH202612_V50_ASSISTANT` 中取得编辑入口并完成发布，没有创建破坏资源绑定的同名替代 Agent。
2. 修复 AI-17：`SRC0721` 能返回正式来源登记字段，未登记的 `publication_date`、`earliest_backtest_date` 保持空且不编造。
3. 修复 AI-04：TUR 截至 `2025-12-31` 的汇率、CPI、储备及来源/质量字段与 `V50_MVP_country_latest` 正式行一致。
4. 修复 AI-01：按40国非空 ODI 存量中位数和汇率贬值20%阈值复算，交集 ETH/TUR，ZWE 正确排除；旧的错误 ODI 金额、`18180` 年份和 ZWE 百分比错误均未再出现。
5. 保存 Agent 已发布、KB AI-01/17 记录及三题最终回答截图和 SHA-256。

## B 必须独立执行

1. AI-01/04/16/19/20 使用计划书指定的“数据洞察”正式通道、既有模型与正式 `actual_prompt` 独立复测；不得把 A 的 Agent 自测截图替代正式记录。
2. AI-17 按来源追溯链独立复测，核对 SRC0721 唯一性、登记空值和 SHA-256。
3. 六题复测完成后执行 AI-01—AI-25 全量回归，核对硬失败为0；B 本人填写判分和签名。

## A 签署

- 执行者A：`PASS`（既有 Agent/KB 修复发布，以及 AI-01/04/17 A侧自测）。
- 签署时间：`2026-09-02 01:23:14 +08:00`。
- 证据：`../../A_数据平台/03_Smartbi证据/P1/A_AI_CHAT_REPAIR_20260902/README.md`。
- 边界：A 未签 AI-16/19/20、25问、B04 或 G4 通过；不代签 B。
