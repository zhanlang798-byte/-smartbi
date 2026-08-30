# B04 AIChat 材料包提交清单｜2026-08-30

> 性质：开工前材料归档与 A 只读知会。本文不是 B04 验收签收，也不代表平台对象已经创建或发布。

## 当前状态

- B04：`MATERIAL_READY / CONFIG_NOT_EXECUTED`
- G4 / B05：`OFFLINE_BASELINE_READY / REAL_RUN_0_OF_25`
- DB04 / G3 依赖项：`BLOCKED / EVIDENCE_PENDING`
- G2：保持启动放行；允许 B 配置正式 AIChat 对象并执行 5 题冒烟。

## 本次归档

1. `B_AI交付/00_个人手册/B04_AIChat完整配置操作手册_20260830.md`
2. `B_AI交付/03_AIChat配置/AI_RESOURCE_INVENTORY_V50.xlsx`
3. `B_AI交付/03_AIChat配置/KB_FILE_MANIFEST_V50.xlsx`
4. `B_AI交付/03_AIChat配置/AGENT_SYSTEM_PROMPT_V50.txt`
5. `B_AI交付/03_AIChat配置/AI_GOVERNANCE_RULES_V50.txt`
6. `B_AI交付/03_AIChat配置/B04_SMOKE_TEST_V50.xlsx`
7. B 任务进度审计和 Smartbi 总手册的 B04 导航/状态更新。

## 固定对象

| 资源 | 固定名称 | 写入/复核 |
|---|---|---|
| 模型 | `MDL_XH202612_V50_COUNTRY_RESERVE` | A 写入；B 只绑定 |
| AI 项目 | `AIP_XH202612_V50_DECISION` | B 写入；A 只读复核 |
| 知识库 | `KB_XH202612_V50_GOVERNANCE` | B 写入；A 只读复核 |
| 智能体 | `AGENT_XH202612_V50_ASSISTANT` | B 写入；A 只读复核；若官方流程不要求独立对象则按手册记录 N/A |
| 测试资源 | `QA_XH202612_V50_AICHAT_25` | B 执行；A 复核 |

## B04 开工后的 5 题

本次五类冒烟选定映射为：`AI-04` 国别数值、`AI-06` 企业拒答、`AI-22` 历史拒答、`AI-17` 来源追溯、`AI-18` 政策合规。每题必须新建会话、保存原答和截图；5/5 PASS 且硬失败为 0 前保持未发布。

## 暂不升级的事项

1. 正式 25 问仍为 0/25，离线基准不等于 AIChat 实测。
2. `AI-11/12/13/14/24` 直接依赖 DB04；`AI-15` 依赖周期与情景；`AI-19` 依赖六页当前筛选和 G3。
3. 模型最终冻结版本/签收、DB03 完整手册、DB04 主体和 G3 证据未齐时，相应知识类别保持 PARTIAL。
4. A 的复核意见、姓名、时间和 PASS 结论只能由 A 本人填写。

## 下一动作

- B：按完整手册创建/确认对象、绑定模型与知识库、验证七类检索并执行 5 题。
- A：可先只读检查本次材料结构；待 B 提交实机配置和 5 题证据后再做正式只读复核。
- 共同：B04 和 G4 状态按真实证据逐级更新，不因本次 Git 归档提前升级。

最终判定：`MATERIAL_READY / CONFIG_NOT_EXECUTED`。
