# B → A：R19 失败题 Chrome 独立复测与原表字段核验（2026-09-02）

> 测试状态：`B_R19_FAILED_CASES_RETEST_FAIL / UNSTABLE / G4_BLOCKED`
>
> 测试范围：仅复测当前失败题 `AI-04 / AI-19 / AI-20`，**未执行 AI-01—AI-25 全量回归**。
>
> 对照基线：A 最新提交 `873e70e`（“发布R19修复并提交四题复测证据”）。

## 1. 一句话结论

A 的四个 PASS 是 R12/R15/R16/R19 不同修订下、不同工具设置和定制下一步提示的构建器单次成功样本；AI-19、AI-20 在 A 侧仍为 BLOCKED。B 在正式公共 AIChat 中使用冻结 Agent、冻结 MDL 和冻结问句独立复测后，复现了 AI-04 同问结果翻转、AI-19 错值及 20 步截断、AI-20 原表字段幻觉和治理计数错误，因此不能把 A 的单次 PASS 认定为最终 R19 稳定修复。

## 2. B 本轮测试条件

| 项目 | 实际条件 |
|---|---|
| 浏览器 | Google Chrome |
| 入口 | 公共 AIChat，而非 Agent 构建器 Run 面板 |
| Agent | `AGENT_XH202612_V50_ASSISTANT` |
| 输入资源 | `MDL_XH202612_V50_COUNTRY_RESERVE` |
| 问句 | `B_AI交付/03_AIChat配置/B04_六题复测执行单_20260902.md` 中冻结原文 |
| 会话纪律 | 每题独立新对话；不改问句；不点重新生成替代首答 |
| 本轮范围 | 只测失败题，不测全量 25 问 |

## 3. 原始 XLSX 表头与真值核验

本节直接读取 A 侧只读镜像中的原始 XLSX，不以 Agent 回答或旧判分文字代替原表。

### 3.1 字段名：原表字段与模型别名必须区分

| 表 | 原表实际字段事实 | 对本轮判分的影响 |
|---|---|---|
| `country_monthly_risk.xlsx` | 有 `source_id/source_frequency/data_version/is_proxy/is_imputed`；**没有 `quality_flag`** | 回答应展示原字段语义；若问到 `quality_flag`，必须写“原表无此字段”，不得编成 `original` |
| `MVP_country_latest.xlsx` | 有 `source_id/quality_flag`，TUR 的 `source_id=MOFCOM-2024公报;WEB-0048-R01` | 该综合来源只属于 MVP 派生视图，不能回填到月度原始行 |
| `country_exposure.xlsx` | 原字段为 `year/source_id/quality_flag/odi_stock_usd_source` | `exposure_odi_stock_year/exposure_source_id/exposure_quality_flag` 是 MDL 查询别名，不是源表物理字段 |
| `company_overseas_exposure.xlsx` | **没有 `iso3` 字段**；有 `geography_id/geography_name/geography_level` | 不得生成企业×国家映射或 country 粒度统计 |
| `asset_monthly_return.xlsx` | 行情键为业务 `asset_id`（如 `CNY_CASH`），与维表 `AST001—AST010` 不同域 | 两表必须分表报告，不得强行关联 |
| `portfolio_scenario.xlsx` | 有 19 个字段；**没有 `source_id` 和 `quality_flag`** | 引用情景数值时必须明确来源/质量字段缺口 |

补充说明：R19 提示词中的 `source_id→risk_source_id`、`is_proxy→risk_is_proxy` 是模型层查询路由；原始月度表的物理字段仍叫 `source_id/is_proxy`。对用户输出时必须保持原字段语义，不能显示“见 manifest”或把布尔值变成计数。

### 3.2 AI-04 / AI-19 的 TUR 原表真值

原表：`A_数据平台/01_输入只读镜像/D0-D12_数据交付_V4.2/data/smartbi/country_monthly_risk.xlsx`。

| 字段 | 2025-12-31 真值 |
|---|---|
| `fx_avg_lcu_per_usd` | `42.70252` |
| `cpi_index` | `2018.099` |
| `fx_reserves_usd` | `184021` |
| `reserve_import_months` | `5.88037` |
| `imports_usd` | `33823.659` |
| `source_id` | `WEB-0048-R01` |
| `source_frequency` | `monthly` |
| `data_version` | `WEB-0048-R01` |
| `is_proxy` | `false` |
| `is_imputed` | `false` |
| `quality_flag` | **原表无此字段** |

TUR 的 2025-01 至 2025-12 共 12 行；每行 `source_id=WEB-0048-R01`、`is_proxy=false`、`is_imputed=false`、`data_version=WEB-0048-R01`。

`MVP_country_latest.xlsx` 的 TUR 行真值：

- `fx_12m_depr=0.219943034593486`，即约 `21.99%`；
- `cpi_yoy=0.309024169705555`，即约 `30.90%`；
- `trigger_label=双触发`；
- `crisis_event_count=2`。

`country_exposure.xlsx` 的 TUR 最新非空 ODI 行真值：

- `year=2024`；
- `odi_stock_usd=3,098,820,000`；
- `source_id=MOFCOM-2024公报`；
- `odi_stock_usd_source=附表2 p56`；
- `quality_flag=review`。

注意：原始交付 XLSX 中 ODI 金额是精确值 `3,098,820,000`；A 的变更日志另有记录，SmartBI 已导入物理字段曾被截断为 `2147483647`。线上查询金额应使用 A 新增的精确金额桥接，年份/来源/定位/质量仍需对应 exposure 同一最新财年行，二者不可混写。

### 3.3 AI-20 治理基线真值

| 检查项 | 原表核验结果 |
|---|---|
| 储备字段全程为空国家 | `AGO / BEN / CIV / ETH / IRN`（5 国） |
| 名称级代理 | 仅 `AST004`、`AST008`；`AST007` 是派生，`AST009/010` 是压力情景工具 |
| 行情表记录 | 91,727 行；`is_proxy=1` 为 30,629 行，涉及 `CNY_CASH/GOLD_LOCAL/LOCAL_CASH/USD_CASH` |
| 政策表 | 2,744 行 = `2704 no_conflict + 40 机提待核` |
| TUR 2025 精确政策行 | 0 行；2026 年有 1 条 OFAC 待核，不得替代 2025 |
| 企业披露表 | 168 行 = `160 global + 8 region + 0 country` |
| 企业收入字段 | `total_revenue/overseas_revenue/overseas_revenue_share` 非空数均为 0 |
| 历史危机表 | 18 行；`start_date` 全为 1970-01-01 占位；`review_status` 全 pending；`comparability_grade` 全空 |
| 历史现代回测标记 | `modern_backtest_allowed=1` 15 行，`=0` 3 行 |
| 组合情景表 | 207,720 行；TUR+`window_end=2025-12-31` 为 36 行 |
| TUR 36 行构成 | `3layer_grid=28`、`3layer_ablate_no_gold=4`、`3layer_ablate_no_usd=4`；四个 horizon 各 9 行 |

## 4. Chrome 两轮复测判定

### 4.1 AI-04：`FAIL_UNSTABLE`

| 轮次 | 正确项 | 错误项 | 判定 |
|---|---|---|---|
| R1 | 三个数值、日期、`is_imputed`、`data_version` 正确 | `source_id=见 manifest`；`is_proxy=4` | FAIL |
| R2 | 数值、日期、`source_id=WEB-0048-R01`、两个布尔值、版本均正确 | 无关键字段错误 | 单次 PASS |

同一冻结问句在相同公共 AIChat 发布态下出现 FAIL→PASS 翻转。R2 与 A 的成功样本相符，但不能消除 R1 的可复现映射错误；当前总判定保持 `FAIL_UNSTABLE`。

### 4.2 AI-19：`FAIL`

| 轮次 | 实际结果 | 对照原表 |
|---|---|---|
| R1 | 完成回答，但给出 `cpi_yoy≈-83.6%`、`crisis_event_count=23` | 正确应为 `30.90%`、`2` |
| R2 | 达到最大执行步数 20，任务未完成 | 与 A 侧 R19 BLOCKED 同类 |

因此 AI-19 不只是“步数上限”问题：R1 已证明即使完成，也可能选错派生值或错误计算。

### 4.3 AI-20：`FAIL`

| 轮次 | 正确项 | 关键错误 |
|---|---|---|
| R1 | 政策全表计数与企业总量部分可对上 | 月度 `source_id=见 manifest`、`is_proxy=4`；把不存在的月度 `quality_flag` 写成 `original`；错误声称没有储备全程缺失国 |
| R2 | 企业 `160 global + 8 region` 与三个收入字段全空正确 | 同样复现 `见 manifest/is_proxy=4/quality_flag=original`；仍漏掉 5 个储备缺失国；政策状态错成 `1+1`；历史错成 1 行；TUR 情景错成 27 行 |

R2 正确真值应为政策 `2704+40`、历史 `18`、TUR 情景 `36`。多张原表的字段存在性和治理计数同时错误，正式判 FAIL。

## 5. 与 A 侧复测证据的对齐结论

| 题目 | A 侧证据修订/入口 | B 公共 AIChat结果 | 对齐结论 |
|---|---|---|---|
| AI-04 | R15 构建器 Run；仅 1/12 工具；定制“最多 2 次 OLAP”下一步提示 | R1 FAIL、R2 PASS | A 仅证明一次可成功，B 证明结果会翻转 |
| AI-01 | R19 构建器 Run；2/12 工具；定制“每表最多 1 次 OLAP” | 本轮未测 | 不能外推为其他题稳定 |
| AI-16 | R16 构建器 Run | 本轮未测 | 不是最终 R19 同条件证据 |
| AI-17 | R12 构建器 Run | B 先前公共 AIChat PASS | 真值可取得，但不是 R19 专项稳定性证明 |
| AI-19 | R19，A 侧明确 20 步 BLOCKED | R1 错值、R2 20 步 FAIL | A/B 都未 PASS；且 B 发现步数外的数值错误 |
| AI-20 | R19，A 侧明确 20 步 BLOCKED | 两轮均 FAIL | A/B 都未 PASS；B 已定位字段与统计错误 |

A 的汇总 README 明确写的是 `4_OF_6_A_SELFTEST_PASS / AI19_AI20_STEP_LIMIT_BLOCKED`。四个成功样本分别来自 R19/R15/R16/R12，并非最终 R19 同批回归；截图入口也是构建器 Run，不满足 B 执行单要求的公共 AIChat 同条件独立复测。

## 6. 当前签收与下一步

1. 当前只确认“部分单次成功”，不签“最终 R19 稳定修复”。
2. AI-04 保持 `FAIL_UNSTABLE`；AI-19、AI-20 保持 `FAIL`。
3. A 需先锁定 MDL 字段路由，至少处理：
   - 月度原始行 `source_id/is_proxy/is_imputed/data_version` 的确定性语义映射；
   - 月度表不存在 `quality_flag` 时明确报缺字段；
   - MVP `cpi_yoy/crisis_event_count` 与月度字段不串表；
   - 缺失国家、政策、企业、历史、情景计数的完整全表口径；
   - AI-19/20 在 20 步限制内的执行拆分或平台提限。
4. A 完成最终发布后，B 只重测失败题；同一最终发布态、同一公共 AIChat 配置、独立新会话连续 3 次全部通过，再改稳定 PASS。
5. 失败题稳定后才执行 AI-01—AI-25 全量回归；此前 G4 保持 BLOCKED。

## 7. 证据索引

目录：`B_AI_CHAT_R19_CHROME_RETEST_FAIL_20260902_证据/`

1. `01_AI04_R1_元数据映射_FAIL.png`
2. `02_AI04_R2_同问_PASS_结果翻转.png`
3. `03_AI19_R1_关键派生值_FAIL.png`
4. `04_AI19_R2_20步上限_FAIL.png`
5. `05_AI20_R1_来源与缺失集合_FAIL.png`
6. `06_AI20_R2_来源与治理计数_FAIL_上.png`
7. `07_AI20_R2_来源与治理计数_FAIL_下.png`

本记录只整理 B 独立复测事实与原表只读核验，不修改 Agent、KB、MDL 或 A 历史证据。
