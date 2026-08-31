# 智御出海 V5.0｜source_id 追溯规则

- 导入版本：`V50-KB04-LOCAL_READY-r1`
- 本地状态：`LOCAL_READY`
- 外部状态：`INSTANCE_REVIEW_PENDING`
- 适用知识库：`KB_XH202612_V50_GOVERNANCE`

## 1. 强制字段

回答中的每个数字必须带：`source_id`、观测期或财年、单位、质量标记。能取得来源登记时，再列发布机构、数据集、链接、许可、覆盖开始/结束、发布日期、抓取时间、数据版本、sha256、代理状态和正式使用状态。

## 2. 追溯路径

1. 从当前筛选和当前查询结果取得数字及 `source_id`。
2. 用 `source_id` 精确匹配 `V50_source_registry`；登记表共 734 行，键应唯一。
3. 逐字段原样返回；空字段写“该来源未登记此字段”。
4. 数字与来源冲突时，列出双方版本、时间和冲突字段，转人工复核。
5. `source_id` 不存在或无法匹配时，结论写“当前证据不足”，不编造替代来源。

## 3. 完整率边界

- `publisher`、`dataset_name` 完整率为 100%。
- `license`、`data_class`、`quality_tier`、`owner_id`、`is_proxy` 约 99%。
- `source_url` 约 75%。
- 原始文件名/相对路径约 56%。
- `coverage_start/end`、`publication_date`、`fetch_timestamp`、`sha256`、`data_version` 只有约 5%—6%。

低完整率字段为空是已登记缺口，不能为了“字段齐全”补写当前日期、猜测链接或伪造 sha256。

## 4. 正式使用状态

- `CORE`：正式核心证据。
- `SUPPLEMENT`：补充证据，不得无说明覆盖 CORE。
- `EXCLUDED`：不得用于正式事实。
- `REPLACED`：必须指向当前替代来源后再使用。
- `PENDING_MANUAL`：待人工复核，不等于允许使用。

## 5. 禁止事项

禁止编造 `source_id`、链接、许可、sha256、页码、发布机构或历史出处；禁止把来源登记层 `is_proxy` 的空值误写成行情层“无代理”；禁止只挑完整来源后声称全部来源字段完整。

## 6. 实例复核状态

本规则已本地定稿并可上传。正式检索验收仍需在平台抽查代表性完整行（可优先使用 `SRC0721`）及空字段行；抽查未完成前状态保持 `INSTANCE_REVIEW_PENDING`。
