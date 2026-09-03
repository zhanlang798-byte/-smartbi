# A｜正式测试切换至内置 Agent（2026-09-03）

## 当前状态

`BUILTIN_DATA_INSIGHT_SELECTED / MDL_FIXED / FORMAL_19_OF_25_PASS / SIX_POST_FIX_RETEST_PENDING / AI19_RUNTIME_BLOCKED / G4_BLOCKED`

## 口径依据与项目决定

1. 用户提供的赛事群公告截图说明：平台内置 Agent 已经过测试并可添加技能，赛事方建议优先使用内置 Agent；如使用自研智能体，评委还会额外体验并检验准确率。该公告是“建议不要使用自研智能体”，不是禁止条款。
2. 项目于 2026-09-03 明确决定：正式复测统一使用 Smartbi 内置 **“数据洞察”**，固定模型 `MDL_XH202612_V50_COUNTRY_RESERVE`，关闭联网搜索，每题独立新会话。
3. `AGENT_XH202612_V50_ASSISTANT` 及其 R20/R21 结果保留为修复诊断与历史实验记录，不再作为正式评分通道，不删除、不倒改既有证据。

## 本轮实机核查

- 时间：`2026-09-03 14:04:59 +08:00`。
- 通道：内置 `数据洞察`。
- 模型：`MDL_XH202612_V50_COUNTRY_RESERVE`。
- 联网搜索：已关闭。
- 问句：AI-19 冻结 r1 长版原文。
- 结果：平台未生成回答，并显式返回 `服务异常 / sessionstatus_timeout`。
- 判定：AI-19 为 `RUNTIME_BLOCKED`；在公共会话服务未恢复前不继续制造无效 AI-20 轮次，AI-20 保持待复测。

## 正式进度重述

- 既有内置通道正式成绩仍为 `19/25 PASS`。
- 模型修复后的正式待复测题为 `AI-01 / AI-04 / AI-16 / AI-17 / AI-19 / AI-20` 共6题。
- 自研 Agent 中 AI-01/04/16/17 的通过结果只证明修复方向，不直接折算为内置通道正式 PASS。
- G4、25问最终签收和B方签署继续保持未通过。

## 证据

| 文件 | 说明 | SHA-256 |
|---|---|---|
| `../../A_数据平台/03_Smartbi证据/P1/A_MDL_FORMAL_PRETEST_20260902/29_BUILTIN_DATA_INSIGHT_AI19_NO_DELIVERABLE_20260903.png` | 内置“数据洞察”、指定模型和AI-19提交后的无交付状态 | `D05E298BE63E6FEC94B58AA485A6106BDB9B13F278DA964E6812F4AF58E2A658` |
| `../../A_数据平台/03_Smartbi证据/P1/A_MDL_FORMAL_PRETEST_20260902/30_ORGANIZER_BUILTIN_AGENT_RECOMMENDATION_20260903.png` | 用户提供的赛事群公告截图，支持优先采用内置 Agent 的项目决定 | `A4DCA91F60181EAB7D5139460B6D3E7FD88A41C0F4E41CA235D5317C407C7942` |
| `../../A_数据平台/03_Smartbi证据/P1/A_MDL_FORMAL_PRETEST_20260902/26_AICHAT_SHARED_SESSIONSTATUS_TIMEOUT_20260903.png` | 先前内置数据洞察同类 `sessionstatus_timeout` 证据 | 见同目录README |

## 服务恢复后的执行顺序

1. A 在内置“数据洞察”按冻结原文逐题新开会话，先跑 AI-01/04/16/17，再跑 AI-19/20。
2. 六题均取得完整原答并按冻结基准通过后，A只签“A侧复测完成”。
3. B使用相同内置通道、相同模型和相同问句独立复测六题，再执行AI-01—AI-25全量回归并由B本人签署。

## A签署

- 执行者A：`BUILTIN_ROUTE_CONFIRMED / AI19_RUNTIME_BLOCKED / SIX_FORMAL_RETEST_PENDING`。
- 签署时间：`2026-09-03 14:05:59 +08:00`。
- 边界：不签六题通过，不签B04、G4或25问最终通过，不代签B。
