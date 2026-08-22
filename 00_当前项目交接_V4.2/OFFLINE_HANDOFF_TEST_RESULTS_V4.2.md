# V4.2 离线交接证据定位测试

- 总题数：44
- 通过：44
- 失败：0
- 结论：PASS

| ID | 问题 | 期望 | 实际 | 状态 | 证据 |
|---|---|---:|---:|---|---|
| Q01 | 来源动作清单共有多少项？ | 688 | 688 | PASS | 调研资料归档_V1.1/05_QA与运行记录/registry_closure_V1.1.json |
| Q02 | 唯一asset_id有多少个？ | 688 | 688 | PASS | 同上 |
| Q03 | 实际本地HTML有多少个？ | 159 | 159 | PASS | 同上 |
| Q04 | 全部HTML型来源记录有多少条？ | 196 | 196 | PASS | 同上 |
| Q05 | 本地HTML中拦截页有多少个？ | 3 | 3 | PASS | 调研资料归档_V1.1/05_QA与运行记录/web_asset_audit_summary_V1.1.json |
| Q06 | 空壳HTML有多少个？ | 1 | 1 | PASS | 同上 |
| Q07 | 低内容HTML有多少个？ | 1 | 1 | PASS | 同上 |
| Q08 | 混合内容HTML有多少个？ | 90 | 90 | PASS | 同上 |
| Q09 | 叙述内容HTML有多少个？ | 49 | 49 | PASS | 同上 |
| Q10 | 下载入口HTML有多少个？ | 7 | 7 | PASS | 同上 |
| Q11 | 结构化HTML有多少个？ | 8 | 8 | PASS | 同上 |
| Q12 | 本轮底层资源请求多少次？ | 36 | 36 | PASS | 调研资料归档_V1.1/05_QA与运行记录/download_results_V1.1.csv |
| Q13 | 底层资源成功取得多少个？ | 26 | 26 | PASS | 同上 |
| Q14 | 底层资源失败多少个？ | 10 | 10 | PASS | 同上 |
| Q15 | 结构化对象清单有多少行？ | 180 | 180 | PASS | 调研资料归档_V1.1/05_QA与运行记录/structured_resource_inventory_V1.1.csv |
| Q16 | XLSX工作表多少个？ | 155 | 155 | PASS | 同上 |
| Q17 | XLSX工作表总行数？ | 124178 | 124178 | PASS | 同上 |
| Q18 | CSV原件多少个？ | 6 | 6 | PASS | 同上 |
| Q19 | CSV识别总行数？ | 1090 | 1090 | PASS | 同上 |
| Q20 | XML对象多少个？ | 8 | 8 | PASS | 同上 |
| Q21 | ZIP归档多少个？ | 7 | 7 | PASS | 同上 |
| Q22 | 文本对象多少个？ | 2 | 2 | PASS | 同上 |
| Q23 | 需要人工转换的旧XLS多少个？ | 2 | 2 | PASS | 调研资料归档_V1.1/05_QA与运行记录/structured_resource_inventory_summary_V1.1.json |
| Q24 | WEB-0335正式用途是什么？ | REPLACED | REPLACED | PASS | 调研资料归档_V1.1/00_交接入口/source_action_registry_V1.1.jsonl |
| Q25 | WEB-0336正式用途是什么？ | REPLACED | REPLACED | PASS | 同上 |
| Q26 | WEB-0335替代资产是什么？ | WEB-0115 | WEB-0115 | PASS | 同上 |
| Q27 | LCL-0156内容状态是什么？ | EMPTY_SHELL | EMPTY_SHELL | PASS | 同上 |
| Q28 | WEB-0345内容状态是什么？ | BLOCK_PAGE | BLOCK_PAGE | PASS | 同上 |
| Q29 | 评分追踪子项有多少条？ | 17 | 17 | PASS | 00_当前项目交接_V4.2/SCORING_TRACEABILITY_V4.2.csv |
| Q30 | 评分子项ID是否唯一？ | 17 | 17 | PASS | 同上 |
| Q31 | 完整性条款S5.1是否锁定4分钟目标？ | true | true | PASS | 同上 |
| Q32 | 项目状态表有多少个工作项？ | 18 | 18 | PASS | 00_当前项目交接_V4.2/PROJECT_STATUS_V4.2.csv |
| Q33 | D0当前状态？ | PARTIAL_REUSABLE | PARTIAL_REUSABLE | PASS | 同上 |
| Q34 | D1当前状态？ | NOT_STARTED | NOT_STARTED | PASS | 同上 |
| Q35 | D2A当前状态？ | COMPLETE_VERIFIED | COMPLETE_VERIFIED | PASS | 同上 |
| Q36 | D2B当前状态？ | PARTIAL_REUSABLE | PARTIAL_REUSABLE | PASS | 同上 |
| Q37 | D2D当前状态？ | COMPLETE_VERIFIED | COMPLETE_VERIFIED | PASS | 同上 |
| Q38 | D11当前状态？ | NOT_STARTED | NOT_STARTED | PASS | 同上 |
| Q39 | 飞书Mermaid是否以graph TD开头？ | true | true | PASS | 流程图/V4.2_来源获取至Smartbi交付全流程.mmd |
| Q40 | 共享候选文本中是否不存在手机号形态的账号或密码原文？ | 0 | 0 | PASS | 00_当前项目交接_V4.2及V4.2计划书通用秘密扫描 |
| Q41 | 正式130国表是否仍未开始？ | NOT_STARTED | NOT_STARTED | PASS | 00_当前项目交接_V4.2/PROJECT_STATUS_V4.2.csv |
| Q42 | Smartbi看板是否仍未开始？ | NOT_STARTED | NOT_STARTED | PASS | 同上 |
| Q43 | 归档V1.1是否明确存在显式缺口？ | CLOSED_WITH_EXPLICIT_GAPS | CLOSED_WITH_EXPLICIT_GAPS | PASS | 调研资料归档_V1.1/05_QA与运行记录/registry_closure_V1.1.json |
| Q44 | 结构化检查是否无失败对象？ | 0 | 0 | PASS | 调研资料归档_V1.1/05_QA与运行记录/structured_resource_inventory_summary_V1.1.json |
