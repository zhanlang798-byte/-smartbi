# A侧指定 MDL 数据洞察诊断预检（2026-09-02）

## 状态

`A_DATA_INSIGHT_DIAGNOSTIC_COMPLETE / 0_OF_6_PASS / MDL_QUERY_CHAIN_NOT_READY_FOR_B_REVIEW`

## 执行条件

- 通道：Smartbi“数据洞察”，不是 V50 Agent 正式判分；依据 B 最新回执，本轮只作为 MDL 映射和查询链诊断旁证。
- 模型：`MDL_XH202612_V50_COUNTRY_RESERVE`。
- 会话：每题独立新会话。
- 联网：每题提交前确认关闭。
- Skills：沿用 2026-09-01 正式轮次配置，测试中未调整。
- 问句：AI-01/04/16 使用 `B04_17题BLOCKED问数话术_20260901.md` 的 r2；AI-17 使用已修正的源表空值口径；AI-19/20 使用同手册 r1 长版原文。

## 结果

| 题号 | 开始时间 | A侧数据洞察诊断结果 | 事实依据 | 证据 |
|---|---|---|---|---|
| AI-04 | 2026-09-02 14:50:10 | FAIL | 数值正确，但 `source_id` 被错误拼接为 `MOFCOM-2024公报;WEB-0048-R01`，`is_proxy=false` 被错误返回为 `4`；耗时 149.698 秒 | `01_AI04_MDL_RETEST_FAIL_20260902.png` |
| AI-01 | 2026-09-02 14:54:23 | FAIL | 多次字段查询报错，最终界面显示“未生成交付物”，未返回中位数、集合和 ODI 明细 | `02_AI01_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png` |
| AI-17 | 2026-09-02 14:57:02 | FAIL | `V50_source_registry` 查询反复报错，达到最大执行步数 40 步，未返回 SRC0721 正式结果 | `03_AI17_MDL_RETEST_STEP_LIMIT_FAIL_20260902.png` |
| AI-16 | 2026-09-02 15:01:27 | FAIL | 已查询 TUR 月度记录并计算中间结果，但最终界面显示“未生成交付物” | `04_AI16_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png` |
| AI-19 | 2026-09-02 15:10:27 | FAIL | 多表查询和 exposure 年份语义验证后，最终界面显示“未生成交付物”，七段简报未交付 | `05_AI19_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png` |
| AI-20 | 2026-09-02 15:10:30 | FAIL | 数据质量、代理和治理表查询后，最终界面显示“未生成交付物”，六段边界清单未交付 | `06_AI20_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png` |

## 判定与修复边界

1. 本轮 6 题数据洞察诊断为 `0 PASS / 6 FAIL`，不能交给 B 作为 V50 Agent“待签收通过”批次，也不能申请 B04、G4 或 25 问通过。
2. `A_AI_CHAT_REPAIR_20260902` 中 AI-01/04/17 的 PASS 仅是 Agent/知识库 A侧自测；本轮证明它不能替代计划书要求的数据洞察指定 MDL 正式判分。
3. 下一步应先修复并重新发布 MDL/数据洞察查询链：原始 `source_id` 不跨表拼接、布尔原值不转聚合、`latest_odi_stock_usd`/ODI 年份可稳定访问、`V50_source_registry` 可按 source_id 唯一查询，以及复杂查询能够生成最终交付物。
4. B 最新回执 `B_AI_CHAT_V50_AGENT_RETEST_BLOCKED_20260902.md` 已明确 V50 Agent 正式复测仍处于 BLOCKED；修复后由 A 先证明 Agent 能实际查询冻结 MDL，并用冻结问句完成 AI-04/16 首答自测，再交 B 独立复测并由 B 本人签署。

## SHA-256

```text
2272C9AA76615A92CC88E0B8DBE409B8E4DC7C235A5463A8DB639877F61121FE  01_AI04_MDL_RETEST_FAIL_20260902.png
578C422CB7A0167AD02DF7DD5D50A2672B5E69B3D8691C9C978FA10C06A137E4  02_AI01_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png
233787380ACB73DF74DD8CFEEDCF925051D29737D08925C87E4DC06AFF69CE68  03_AI17_MDL_RETEST_STEP_LIMIT_FAIL_20260902.png
F23E40D8686D0CA76A2739B4418937B155FAF2F3C0FA53A000B336AC02917EAA  04_AI16_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png
06B64F837411897BF8B2BE3168440492C4ADA27259AA09E42E0A9C7457410F98  05_AI19_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png
DC4CD3B1C0FA7CBAE839CD8CFEDD14055BFE9728E6B2B294FA2C6A13223A12F0  06_AI20_MDL_RETEST_NO_DELIVERABLE_FAIL_20260902.png
```

## A签署

- 执行者A：`已完成本轮数据洞察诊断预检；结论 FAIL`。
- 签署时间：`2026-09-02 15:22:10 +08:00`。
- 签署边界：仅确认测试条件、原始结果和失败判定；不签“修复通过”，不代签 B，不代表 B04/G4/25问通过。

## B签署

- 执行者B：`PENDING`。
- 条件：A 完成上述 MDL/查询链修复并提供 6 题 A侧通过证据后，由 B 独立新会话复测。
