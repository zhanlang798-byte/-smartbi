# B00 签收自动核对结果（2026-08-25 23:24）

- 交接包目录：D:\pre-code\smartbi\-smartbi\V5.0_双人执行工作区\00_共享\模型交接
- 合计 23 项：PASS 23 / FAIL 0 / BLOCKED 0

## 逐项

| 检查项 | 判定 | 说明 |
|---|---|---|
| 交接包目录存在 | PASS | D:\pre-code\smartbi\-smartbi\V5.0_双人执行工作区\00_共享\模型交接 |
| 材料 MODEL_HANDOFF_V50.txt | PASS | 在 |
| 材料 TABLE_CONTRACT_V50.xlsx | PASS | 在 |
| 材料 FIELD_DICTIONARY_V50.xlsx | PASS | 在 |
| 材料 RELATIONSHIP_MAP_V50.xlsx | PASS | 在 |
| 材料 RELATIONSHIP_AUDIT_V50.xlsx | PASS | 在 |
| 材料 METRIC_DICTIONARY_V50.xlsx | PASS | 在 |
| 材料 KNOWN_GAPS_V50.txt | PASS | 在 |
| 材料 MODEL_CHANGELOG_V50.txt | PASS | 在 |
| 共用账号口径与27字段核对记录 | PASS | A/B共用账号为既定前提；27/27字段树可见；B已审核确认（2026-08-25） |
| 表合同行数合计=313,593 | PASS | 实算 313,593 |
| 表合同正式表数=18 | PASS | 实有 18 |
| 表合同总表数=21（18+3） | PASS | 实有 21 |
| 辅助表 MVP_country_latest=40行 | PASS |  |
| 辅助表 MVP_company_data_status=20行 | PASS |  |
| 辅助表 MVP_cycle_state=660行 | PASS |  |
| 企业 168=160 global+8 region | PASS | 168=168, global=160, region=8 |
| 国家桥=0（bridge全region且iso3空） | PASS | 8行 |
| 海外收入三字段可用值=0 | PASS | 非空 0 |
| 历史18条 1970/pending/评级空 | PASS | 18条 |
| HIST001/002/018 modern_backtest_allowed=0 | PASS | {'HIST001': 0, 'HIST002': 0, 'HIST018': 0} |
| MVP三表行数 40/20/660 | PASS | 40/20/660 |
| 触发分布 双2/单4/未触发34/不足0 | PASS | {'未触发': 34, '单触发': 4, '双触发': 2} |

## 需人工完成（脚本无法触达）

1. [x] A/B共用同一Smartbi账号为项目既定前提；B不修改A对象属于职责纪律；B已确认
2. [x] Smartbi共享模型字段树27/27可见记录已归档；B已审核确认（2026-08-25）
3. [ ] RELATIONSHIP_MAP：维度→事实单向、无事实-事实多对多、地区桥不连国家（肉眼核）
4. [ ] RELATIONSHIP_AUDIT：每条关系前后事实行数不膨胀（肉眼核）
5. [ ] METRIC_DICTIONARY：DB03/05/06 所需指标逐项在列（对照三页线框字段）
6. [x] KNOWN_GAPS / MODEL_CHANGELOG：B已阅读确认（2026-08-25）

> 签收规则：任何 FAIL = 不签收，写问题单退回；BLOCKED（交接未到位）不记 FAIL。
