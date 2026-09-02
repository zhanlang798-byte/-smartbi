# A｜正式 Agent R20 去硬编码真实问数复测交接（2026-09-02）

## 当前状态

`R20_RETEST_COMPLETE / 3_PASS_3_FAIL / A_REPAIR_REQUIRED / B_RETEST_NOT_READY / G4_BLOCKED`

## A 已完成

1. 核查正式 `AGENT_XH202612_V50_ASSISTANT` 的内层 LLM 自定义提示词，发现 AI-01/04/17 固定答案片段。
2. 删除固定答案，改为通用 R20 约束提示词，禁止硬编码、禁止使用会话记忆补数，要求事实只能来自当前 `MDL_XH202612_V50_COUNTRY_RESERVE` 查询；已保存。
3. 使用同一正式 Agent、同一冻结 MDL、每题独立新会话执行 AI-01/04/16/17/19/20 六题。
4. 六题均触发 ReAct/MDL 真实查询并生成最终答案；AI-19/20 已能完整交付，不再按“20步上限”记 BLOCKED。
5. 六张 R20 证据截图、提示词版本和 SHA-256 已归档至 `../../A_数据平台/03_Smartbi证据/P1/A_MDL_FORMAL_PRETEST_20260902/`。

## R20 判定

| 题号 | 判定 | 关键事实 |
|---|---|---|
| AI-01 | PASS | 40样本、中位数1,527,540,000 USD、ETH/TUR入选、ZWE排除、ODI 2024财年及双来源定位正确 |
| AI-04 | PASS | 42.70252、2018.099、184021；日期、单位、WEB-0048-R01与布尔值正确 |
| AI-17 | PASS | SRC0721来源登记与SHA-256正确，未登记日期保持空 |
| AI-16 | FAIL | `source_id` 返回“见 manifest”，`is_proxy` 返回 `4` |
| AI-19 | FAIL | `cpi_yoy=-0.83604`、`crisis_event_count=23`，冻结真值应为 `0.309024`、`2` |
| AI-20 | FAIL | 储备全程缺失国家回答0而冻结基线为5；企业分层回答2而冻结基线为168；月度元数据仍异常 |

汇总：`3 PASS / 3 FAIL`。A 只签“复测执行完成”，不签 G4，不代签 B。

## 当前修复队列

1. 修复 `V50_country_monthly_risk` 的真实 `source_id/is_proxy` 返回链，禁止降级为“见 manifest/4”。
2. 修复 `V50_MVP_country_latest.cpi_yoy` 与 `crisis_event_count` 的派生/别名映射，恢复冻结真值。
3. 修复 AI-20 的储备缺失国家统计与企业治理基线取数，确保5国缺失、168条企业分层口径可复算。
4. 用原冻结问句独立重跑 AI-16/19/20；只有六题全部PASS后才标记 `READY_FOR_B_RETEST`。

## B 下一步

当前为 `B_RETEST_NOT_READY`。B 暂不需要签收25问；待A发布下一版修复并提交失败三题PASS证据后，B再使用冻结问句独立复测六题并完成AI-01—AI-25全量判分与本人签署。

## 共享台账更新

- `DAILY_GATE_STATUS_20260831.xlsx` 已按 R20 结果更新；SHA-256：`4FAE15F9A2F8F60F300E409D74103BAA3E2B238B50991FD3A9569E25A70634BA`。
- `DAILY_OBJECT_LOCK_20260831.xlsx` 已按 R20 结果更新；SHA-256：`3EE3E8F3F93AC08E38F35728BB018834EC1032853DC26F2342E5820C6AD45C7B`。
- 两表均保持 `G4/G5/G6=BLOCKED`，未代签 B。

## A签署

- 执行者A：`R20_RETEST_COMPLETE / 3_PASS_3_FAIL`。
- 时间：`2026-09-02 22:32:05 +08:00`。
- 边界：仅确认去硬编码、六题真实执行和证据归档完成；AI-16/19/20为FAIL，G4/G5/G6保持BLOCKED。

## B签署

- 执行者B：`PENDING`。
- 条件：A失败三题修复并重跑全过后，由B独立复测并本人签署。
