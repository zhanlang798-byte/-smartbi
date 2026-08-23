# -*- coding: utf-8 -*-
# 写入P0最终证据：XML依赖记录 + 验收单
import os
P0 = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\A_数据平台\03_Smartbi证据\P0"

xml_txt = """P0 XML导出与依赖记录（步骤7）——已完成导出核验
==================================================
导出时间：2026-08-24 01:01:47 +0800（文件修改时间）
平台版本：Smartbi V11（Hotfix_SmartbiV11_20260802，导出头tag实测）

XML文件读数（AI实算）：
- 路径：C:\\Users\\33625\\Downloads\\migrate.xml
- 大小：640,411 字节
- SHA-256：881ff177a0a7bcd2aaf938bdbfa4db6ecc7535c9e495e2e38be08b60f15bcdd2

XML内资源清单（AI解析，非口头）：
1. AUGMENTED_DATASET 别名 P0_XH202612_V50_DATA（内含4张表节点：dim_country/dim_date/country_monthly_risk/global_cycle_month，全部字段在列）
2. SMARTBI_DATAPROCESS 别名 P0_XH202612_V50_MODEL（数据模型，含3条关系）
3. SMARTBIX_PAGE 别名 P0_XH202612_V50_PAGE（KPI+2折线+2筛选器页面）
4. PERMISSIONS、CUSTOM_ICONS（导出系统附带项，正常）

无关资源检查：第一次/第二次/指标模型/黄金珠宝等均未混入；
“自助ETL”字样为MODEL资源的存放路径标签，非混入对象。

偏差记录（不影响本步PASS，A03前处理）：
- 改名用的是“别名/显示名”，资源内部name仍为原名（new_project等）；
- 4张表节点显示名为dim_country等未带P0前缀，与正式资源名同形——A03全量导入前必须改别名或删除P0对象，避免与正式对象混淆。

恢复验收：未做干净目标恢复测试 → 按规则记：恢复未验收。
（覆盖恢复到同一环境不算独立恢复；如需验收，在干净环境导入migrate.xml后重跑行数核对。）
"""

acc = """P0验收单（A02）——最终
==================================================
验收时间：2026-08-24 01:05 +0800（实际完成晚于G1原定8-23 18:00，如实记录为延期）
执行者：A　对象前缀：P0_XH202612_V50

[x] 步骤1 选样：TUR+NGA+ZWE，2024-01..2025-12连续24个月，含真实缺失（ZWE fx缺20/24月、cpi全缺；NGA储备全缺）
[x] 步骤2 四张P0样本表3/24/72/24行，主键/来源/run_id保留，month_end为真日期格式
[x] 步骤3 上传完成；平台行数72/24有预览截图证据；3/24（维表）由筛选器候选值（3国）与月份区间（2024-01..2025-12共24月）间接证实
[x] 步骤3b 类型核对：month_end=timestamp（截图证据）；2个平台误判string字段（yield_spread_10y_3m、equity_drawdown）经A手改double（A口头报告，截图待补）；2个全空列默认string已记录
[x] 步骤4 三条单向关系（初版误用“大于”运算符致预览塌缩3/1行，改“等于”后恢复72/24，未动数据）
[x] 步骤5 KPI=3（唯一计数）；折线1三系列；折线2全球cpi_yoy；国家+月份两筛选器
[x] 步骤6 ZWE筛选只剩4点且断口留白（基线8310.85/12476.33/18457.10/25093.05吻合）；NGA完整线与基线吻合；月份区间同时控制两图（经dim_date桥修正后）；缺失未显示为0；行数未膨胀
[x] 步骤7 XML已导出：migrate.xml，640,411字节，SHA-256=881ff177…bcdd2，资源清单核验无混入；恢复未验收

PASS标准逐项：行数一致✓ 类型正确✓ 筛选不膨胀缺失仍为空✓ KPI/折线误差≤1%✓ XML+哈希✓

最终判定：PASS（A02 P0门）
遗留（不阻塞，A03前清）：①2个改型字段截图待补 ②P0表节点别名未带前缀 ③恢复未验收
A签收：______　B复核：______
"""

open(os.path.join(P0, 'P0_XML_DEPENDENCIES.txt'), 'w', encoding='utf-8').write(xml_txt)
open(os.path.join(P0, 'P0_ACCEPTANCE.txt'), 'w', encoding='utf-8').write(acc)
print('written')
for f in ['P0_XML_DEPENDENCIES.txt', 'P0_ACCEPTANCE.txt']:
    p = os.path.join(P0, f)
    print(f, os.path.getsize(p), 'bytes')
