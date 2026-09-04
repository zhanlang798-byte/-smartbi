# A03 CPI 完整 SQL 与引用预检

日期：2026-09-04（Asia/Shanghai）。本包为技术修复预检与仓库进度证据。

**SQL_PREFLIGHT=PASS；正式修复仍为 FAIL_MAX_PENDING_REPAIR。未修改、保存或发布正式模型，未改任何 Excel 或 B 签署。**

## 已完成

在 Smartbi 原生 SQL 查询界面选择“可导入数据库”，针对 `input.v50_country_monthly_risk` 执行三个只读查询，并从原生“复制SQL”核对实际输入。结果保存后，关闭临时查询并明确选择“不保存”。

| 核查 | 实际结果 | 结论 |
|---|---|---|
| 完整18列SELECT | 7,680行；18列名称与原表一致 | 仅将CPI改为聚合前DECIMAL转换，未增删列 |
| 总行/非空/空值 | 7,680 / 7,616 / 64 | 与既有独立源端基准一致 |
| CPI合计/平均/最大 | 2,862,057.90 / 375.80 / 47,954.24 | 界面两位小数匹配；不宣称全精度相等 |
| 覆盖范围 | 40国，2010-01-31至2025-12-31 | 全表查询，无业务筛选 |
| 复合键iso3+month_end | 空键0、重复键组0、多余重复行0 | 粒度未发现异常 |
| 空值处理 | 原NULL64、空白字符串0、CAST后NULL64 | 不填0、不减少记录 |

完整SELECT没有WHERE、JOIN、DISTINCT；仅 `CAST(NULLIF(TRIM(cpi_index), '') AS DECIMAL(30,12)) AS cpi_index` 处理CPI。主键审计SQL的CROSS JOIN只合并两个单行统计结果，不是正式候选的关系变更。

## 引用核查与限制

- 在线“影响性分析”确认原表→正式模型→DB01至DB06六页的**资源级**依赖，不代表六页都直接使用CPI。
- 9/4正式模型导出中原表为BASIC_TABLE，视图ID为 `aeff8422c42966f645693674f870bc27`；记录了18字段ID及dim_country、dim_date两条1:M单向关系。
- 8/31受控六页XML中，只有DB02的 `汇率与CPI趋势（FX上升=本币贬值）` 组件直接命中该CPI引用，组件ID为 `50069196dac827c6732e076784c7fd80`。其私有度量的ref/refDataSetFieldId及privateDefine也已记录。
- 页面XML是**历史快照**。本次不是最新全租户字段依赖扫描，不能据此排除后来新增的使用者；未完成的新鲜度核查不能签成PASS。
- 同名字段不等于同一个字段。monthly_risk/global_cycle等其他表的CPI字段不在本次修改范围。

## 仍未解决的正式修复入口

原表右键“编辑”对应DOM类包含 `ctx-item disabled`，本会话没有可用的原位SQL编辑入口。此事实只证明该入口禁用，**未确定是表类型、产品设计还是权限原因**。本轮未尝试删除重建、覆盖上传或物理DDL。

前序目录STRING→BIGDECIMAL的可逆试修无法改变正式MAX；前序已完整回退。本轮验证说明SELECT方案可计算正确，但没有证明它能够替换原BASIC_TABLE且保留原字段引用。正式原生MAX最后一次有效失败证据仍是前序993.56；本轮没有重新测正式原生指标卡，也没有宣称它已经变为47,954.24。

### 下一步实施门槛（未执行）

1. 由源表/平台维护方确认：是否可将现有 `input.v50_country_monthly_risk.cpi_index` 原位数值化并保留表名、字段、NULL和精度；或提供BASIC_TABLE→SQL查询的受支持保引用替换流程。请求内容见 `IMPLEMENTATION_HANDOFF.md`，尚未对外发送。
2. 取得实施时点的新备份和最新直接引用清单；明确回退入口。原始XML含连接元数据，只可受控内部保存，不公开上传。
3. 若走替换路线，验证18字段ID、2关系、模型覆盖属性、DB02私有度量及其他最新引用；仅保持字段别名相同不算保引用。
4. 正式保存/刷新后复测原生MAX=47,954.24、AVG=375.80、SUM=2,862,057.90（两位小数），以及7680/7616/64、主键、DB02趋势/国家月份筛选和受影响计算。未通过则回退。
5. A记录实际变更及新导出，交B独立复核；不得以本次查询PASS代替正式签署。

## 可复现材料

| 文件 | 用途 |
|---|---|
| `CPI_FULL_QUERY_CHECK.sql`、`01_*`、`02_*` | 完整18列候选外层聚合、原生结果与复制SQL |
| `03_*`、`04_*` | 原始18列候选的7680行预览和实际SQL |
| `CPI_KEY_NULL_CHECK.sql`、`05_*`、`06_*` | 主键、日期、NULL及空白字符串核查 |
| `07_NATIVE_EDIT_ENTRY.json` | 原表“编辑”入口禁用的可见DOM属性 |
| `08_QUERY_DISCARD.json` | 明确不保存并关闭SQL草稿 |
| `REFERENCE_AUDIT.json`、`audit_references.py` | 受控XML的字段/关系/私有度量白名单审计；重跑需本机受控XML |
| `LIVE_IMPACT_SUMMARY.json` | 在线资源级依赖白名单 |
| `verify_preflight.py`、`PREFLIGHT_VERIFICATION.json` | SQL输入一致性、结果、引用边界及保护文件哈希断言 |
| `CPI_SQL_PREFLIGHT.ipynb`、`build_notebook.py` | 含关键SQL与Python核查的伴随笔记本 |

从本目录运行 `python verify_preflight.py` 可只读核验；加 `--write` 重建结果JSON。脚本需要本仓库前序基准、只读源工作簿和类型工作簿，仅校验文件哈希，不写工作簿。

笔记本已使用Python标准库顺序执行全部代码单元并保留输出。当前运行时缺少nbformat/nbclient，**未在Jupyter内核执行**；内核复验命令写在笔记本中。本地核验不会自动登录或重新执行平台SQL，实时重测需在Smartbi原生查询界面分别运行所附SQL。

## 结论与签收边界

证据包可带上述限制共享，正式CPI最终验收仍需修复。源工作簿与类型台账SHA-256保持前序基准；不改383 PASS/59 FAIL，不代签B，不重试已跳过的AI六题，不改变G2启动放行或既有页面初验结论。按数据质量/分析验证流程，已将SQL证据、引用限制和正式修复状态分别记录，避免把诊断预检当成上线通过。
