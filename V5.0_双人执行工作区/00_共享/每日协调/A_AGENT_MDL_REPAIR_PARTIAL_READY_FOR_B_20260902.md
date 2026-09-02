# A｜正式 Agent／冻结 MDL 修复后交接（2026-09-02）

> 历史交接：已被 `A_AGENT_R20_REAL_QUERY_RETEST_20260902.md` 取代。R20 去除固定答案后真实问数为3 PASS / 3 FAIL，当前状态不是 READY_FOR_B_RETEST；请以R20交接为准。

## 当前状态

`A_REPAIR_PUBLISHED / AI01_AI04_AI16_AI17_A_PASS / AI19_AI20_STEP_LIMIT_BLOCKED / B_RETEST_REQUIRED / G4_BLOCKED`

## A 已完成

1. 正式对象保持 `AGENT_XH202612_V50_ASSISTANT` + `MDL_XH202612_V50_COUNTRY_RESERVE`，标准模式、推理关闭，未切换其他模型。
2. Start→ReAct 用户请求绑定改为会话变量 `question`；系统规则发布为 `V50-B04-AGENT-REACT-R19`。
3. 月度来源/布尔、来源登记、MVP综合来源、ODI来源采用唯一业务别名，避免跨表同名字段误用。
4. `V50_country_exposure.year` 修为字符串并别名 `exposure_odi_stock_year`；确认 `odi_stock_usd` 源值已截断为 `2147483647` 后将错误原值隐藏，以 `V50_MVP_country_latest.exposure_odi_stock_usd_exact` 提供精确金额桥接；保存并清缓存。
5. 使用冻结问句实跑：AI-01、AI-04、AI-16、AI-17 均 PASS；证据及SHA-256见 `../../A_数据平台/03_Smartbi证据/P1/A_MDL_FORMAL_PRETEST_20260902/README.md`。
6. 已更新并签署两本共享台账：`DAILY_GATE_STATUS_20260831.xlsx`、`DAILY_OBJECT_LOCK_20260831.xlsx`。G3写PASS并由A回签；G4—G6按真实阻塞保留。两本工作簿公式错误扫描均为0，视觉复核通过。

台账 SHA-256：

```text
D7A7AF3F25622455184D3CA760865281AD05925F03146950763847E99C5814E7  DAILY_GATE_STATUS_20260831.xlsx
F01143281913F3FF84B01F5915B24DB9470D665C3C5C13F91A4037A8B0D568D8  DAILY_OBJECT_LOCK_20260831.xlsx
```

## 仍未通过

| 题号 | 当前结论 | 阻塞事实 |
|---|---|---|
| AI-19 | BLOCKED | R17核心数值已正确，但月度来源拼接与`is_proxy=4`红线未消除；字段消歧后的R18/R19在后端固定20步截断，未形成可签七段答案 |
| AI-20 | BLOCKED | 冻结六段问句稳定触发后端固定20步上限，未形成可签答案 |

界面“最大执行轮次”改为40后，后端仍返回“已达到最大执行步数限制（20步）”；A 已恢复标准值20，未把无效界面配置冒充修复。

## B 下一步

1. 使用同一正式 Agent、冻结 MDL、冻结 `actual_prompt`，独立新会话复测 AI-01、AI-04、AI-16、AI-17并本人判分。
2. 对 AI-19/20 明确选择：允许按原段落拆分执行、由平台管理员提高后端硬上限，或保持 BLOCKED；A 不代 B 改测试规则。
3. 六题处理后执行 AI-01—AI-25 全量回归；只有硬失败为0且签署完整时才能升级 G4。

## A签署

- 执行者A：`PASS`（仅限 R19 修复发布与 AI-01/04/16/17 A侧实跑）。
- 时间：`2026-09-02 20:45:44 +08:00`。
- 边界：AI-19/20、B04、G4、25问保持未通过；A不代签B。

## B签署

- 执行者B：`PENDING`。
- B须在独立复测后本人填写 PASS / FAIL / BLOCKED、签名和时间。
