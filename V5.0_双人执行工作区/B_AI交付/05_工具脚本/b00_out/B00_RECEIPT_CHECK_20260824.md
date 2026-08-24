# B00 签收自动核对结果（2026-08-24 11:02）

- 交接包目录：/Users/tanshuo888/Code/pre-code/Smartbi/-smartbi/V5.0_双人执行工作区/00_共享/模型交接
- 合计 9 项：PASS 7 / FAIL 2

## 逐项

| 检查项 | 判定 | 说明 |
|---|---|---|
| 交接包目录存在 | FAIL | 未到位：/Users/tanshuo888/Code/pre-code/Smartbi/-smartbi/V5.0_双人执行工作区/00_共享/模型交接（A04 未交付，状态=BLOCKED 而非 FAIL） |
| 表合同文件 | FAIL | 未到位，跳过（交接后重跑） |
| 企业 168=160 global+8 region | PASS | 168=168, global=160, region=8 |
| 国家桥=0（bridge全region且iso3空） | PASS | 8行 |
| 海外收入三字段可用值=0 | PASS | 非空 0 |
| 历史18条 1970/pending/评级空 | PASS | 18条 |
| HIST001/002/018 modern_backtest_allowed=0 | PASS | {'HIST001': 0, 'HIST002': 0, 'HIST018': 0} |
| MVP三表行数 40/20/660 | PASS | 40/20/660 |
| 触发分布 双2/单4/未触发34/不足0 | PASS | {'未触发': 34, '单触发': 4, '双触发': 2} |

## 需人工完成（脚本无法触达）

1. [ ] B 账号在 Smartbi 内对共享模型实测：能查询、保存修改被拒（截图）
2. [ ] RELATIONSHIP_MAP：维度→事实单向、无事实-事实多对多、地区桥不连国家（肉眼核）
3. [ ] RELATIONSHIP_AUDIT：每条关系前后事实行数不膨胀（肉眼核）
4. [ ] METRIC_DICTIONARY：DB03/05/06 所需指标逐项在列（对照三页线框字段）
5. [ ] KNOWN_GAPS / MODEL_CHANGELOG：已读并签收（签字）

> 签收规则：任何 FAIL = 不签收，写问题单退回；BLOCKED（交接未到位）不记 FAIL。
