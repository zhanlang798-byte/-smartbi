# Smartbi 数据包交付说明（2026-08-20）
## 内容
- 18 个数据工作簿：6 维表(dim_country/date/year/company/asset/event) + 11 权威表 + bridge_company_geography
- 3 个控制簿：数据字典_V4.1 / Smartbi导入行数与哈希清单 / Smartbi模型映射_V4.1
- 每个数据文件只有名为 data 的工作表，首行英文蛇形字段名，日期/数字为真实 Excel 类型
## 验收
- 313,593 行，主键重复 0、空主键 0（清单见哈希簿）
- HY OAS 原始序列按许可不随包分发（仅派生变化量）
- 导入顺序按 模型映射 表 import_order 1→18
## QA 证据
随附：D10 导出日志、缺口登记册(20 条,留空留原因)、质量摘要、IMF 尾月修复日志等
## 联系
数据侧问题回查 run_id 与 manifest（项目内 data/raw/*/manifest.jsonl 全链溯源）
