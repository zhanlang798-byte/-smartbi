# B00 Smartbi 27 字段树核对记录｜2026-08-25

- 模型：`MDL_XH202612_V50_COUNTRY_RESERVE`
- 操作位置：Chrome 中的 Smartbi 数据准备 → 数据集 → 共享模型字段树
- 操作方式：逐表展开并逐字段核对；未点击保存，未修改模型或 A 对象
- 账号口径：A/B 使用项目同一 Smartbi 账号；这是既定运行前提
- 结果：**27/27 可见，缺失 0**
- 证据边界：本记录证明字段在模型树中存在/可见，不证明数据值查询、页面搭建或 G2 整体验收

| 页面 | 表 | 核对字段 | 结果 |
|---|---|---|---|
| DB03 | `V50_dim_company` | `company_id`、`company_name_zh`、`industry`、`operating_model` | 4/4 可见 |
| DB03 | `V50_company_overseas_exposure` | `fiscal_year`、`geography_level`、`total_revenue` | 3/3 可见 |
| DB03 | `V50_bridge_company_geography` | `iso3` | 1/1 可见 |
| DB03 | `V50_MVP_company_data_status` | `answer_scope`、`prohibited_inference` | 2/2 可见 |
| DB05 | `V50_country_policy_year` | `policy_code`、`manual_review_status` | 2/2 可见 |
| DB05 | `V50_source_registry` | `source_id`、`publisher`、`dataset_name`、`license`、`sha256` | 5/5 可见 |
| DB06 | `V50_global_cycle_month` | `equity_drawdown` | 1/1 可见 |
| DB06 | `V50_MVP_cycle_state` | `primary_state`、`labels` | 2/2 可见 |
| DB06 | `V50_historical_crisis_event` | `start_date`、`review_status`、`modern_backtest_allowed` | 3/3 可见 |
| DB06 | `V50_portfolio_scenario` | `max_drawdown`、`cvar_95`、`cost_total`、`gold_weight` | 4/4 可见 |

补充：`modern_backtest_allowed`、`cvar_95`、`cost_total`、`gold_weight` 位于模型的“度量”分组，其余目标字段位于“维度”分组。

执行者 B 本人复核：✅（审核无异议）  时间：2026-08-25 23:19 +08:00
