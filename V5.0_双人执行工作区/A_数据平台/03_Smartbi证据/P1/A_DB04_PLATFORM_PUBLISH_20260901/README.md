# A｜DB04模型与项目级r11平台发布证据（2026-09-01）

## 已执行

1. `V50_country_monthly_risk.source_id` 别名改为 `risk_source_id`。
2. `V50_country_monthly_risk.is_proxy` 别名改为 `risk_is_proxy`。
3. `V50_country_monthly_risk.iso3` 从错误整型改为字符串；模型校验不再出现该关系键类型不一致。
4. `V50_source_registry.source_id` 别名改为 `registry_source_id`。
5. `V50_source_registry.is_proxy` 别名改为 `registry_is_proxy`，原始字段设为可见。
6. `V50_MVP_country_latest.latest_odi_stock_usd` 别名改为 `odi_stock_usd_exact`。
7. `V50_MVP_country_latest.latest_odi_stock_year` 别名改为 `odi_stock_year`，数据类型改为整型。
8. `AIP_XH202612_V50_DECISION` 项目说明保存项目级r11路由约束。
9. A侧AI-01冒烟13.532秒，安全返回`BLOCKED／待补证`，未输出错误金额或18180年份。
10. 删除来源登记自动生成的 `is_proxy2` 求和度量，避免问数误选计数/求和；保存结果为`保存成功！`。

## 截图

- `01_MODEL_VALIDATION_AFTER_FIX.png`：第一次校验及原关系建议项。
- `02_RISK_FIELD_ALIAS_AND_ISO3_TYPE.png`：风险表别名和iso3字符串类型。
- `03_REGISTRY_SOURCE_ALIAS.png`：来源登记source_id唯一别名。
- `04_REGISTRY_PROXY_VISIBLE.png`：来源登记原始代理字段可见。
- `05_ODI_FIELD_ALIAS_AND_YEAR_TYPE.png`：ODI金额/年份别名及整数年份。
- `06_PROJECT_R11_PUBLISHED.png`：项目级r11已保存说明。
- `07_AI01_A_SIDE_SMOKE_BLOCKED.png`：A侧安全边界冒烟。
- `08_MODEL_VALIDATION_FINAL.png`：iso3类型修复后的最终校验；键类型不一致已消失，剩余为模型关系建议项。
- `09_PROXY_MEASURE_REMOVED.png`：原始 `registry_is_proxy` 保留，右侧度量树不再含 `is_proxy2`。

## 判定边界

- A侧平台发布：`PASS`。
- A侧安全冒烟：`PASS`（仅边界，不代表AI-01答案通过）。
- B正式复测：`PENDING`。
- B04/G3/G4：不得据此签署通过。
- 受控XML修复包继续禁止公开上传；本轮只提交截图与说明。
