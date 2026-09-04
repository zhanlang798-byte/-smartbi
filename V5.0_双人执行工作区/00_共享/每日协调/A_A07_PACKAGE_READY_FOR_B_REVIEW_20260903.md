# A→B｜A07 可复核交付包（2026-09-03）

> 2026-09-04版本复核补记：本单保留9月3日交付事实和签署。两个8月31日XML的哈希/安全结论仍有效，但其模型与9月4日所持较新快照存在18项字段属性及度量/节点/知识图谱差异，不能据此签最新完整恢复包PASS。当前为`PACKAGE_REFRESH_REQUIRED`；执行下述恢复动作前须先原生重新导出六页+同一模型分包并核验。详见 `A_RESOURCE_PACKAGE_RECONCILIATION_20260904.md`。

## 当前结论

A侧状态：DB04_PAGE_PASS_B_REVIEW / PERFORMANCE_A_PASS / PAGE_MODEL_XML_READY / KB_NATIVE_BACKUP_READY / CLEAN_TARGET_RECOVERY_BLOCKED / FORMAL_AI_19_OF_25。

本交接单将已经完成、可由B立即只读复核的材料集中列出；不把独立恢复、AI六题或G4—G6写成通过。

## B现在可以复核的内容

1. DB04页面：B已于2026-09-02完成独立复测并本人签署PASS，DB04页面项和G3六页初验闭环。
2. A07性能：DB01区域切换、DB01→DB02下钻、DB02全期、DB04策略切换均完成3次冷缓存+3次热缓存，24次操作全部不超过10秒；B可按文本记录独立抽查，不需要性能截图。
3. 页面/模型XML：两份包均已重新解析并核对字节数与SHA-256。
   - A07_PAGES_DB01_DB02_DB04_WITH_MODEL_20260831.xml：878820字节；E013A0695E0B97FD558BD90F870661BD6DA2F2592B993226D4A177A54C0463C5。
   - A07_PAGES_DB03_DB05_DB06_WITH_MODEL_20260831.xml：871374字节；5B77EFB3F93AF4C6DBD3061261C221347BCB92761DA577F1DE3427C2AC5404A3。
4. AI资源：AIP、KB、Agent均已定位；KB原生导出45条，标题唯一45、空标题0、空知识0、ENABLE 45、PLAIN 45。
   - KB CSV SHA-256：0DF11F73D8999985C16307C7FDDA09B666E51B40D781DD03273C4FD4A7A479CD。
5. 安全边界：知识库CSV敏感关键词扫描0命中；页面/模型XML不含密码、令牌、Cookie、Secret或API Key，但含JDBC地址与数据库用户名，只能受控内部交付，禁止上传公开仓库。

## 证据入口

- A侧当前进度：../../A_数据平台/当前进度.md
- DB04状态：../../A_数据平台/03_Smartbi证据/DB04/DB04_BUILD_STATUS_V50.txt
- 性能状态：../../A_数据平台/03_Smartbi证据/性能/A07_PERFORMANCE_STATUS_V50.txt
- XML交付索引：../../A_数据平台/04_XML恢复/A07_DELIVERY_INDEX_V50.txt
- XML安全复核：../../A_数据平台/04_XML恢复/A07_XML_SECURITY_REVIEW_V50.txt
- 独立恢复清单：../../A_数据平台/04_XML恢复/A07_RECOVERY_RUNBOOK_V50.txt
- AI资源截图：../../A_数据平台/03_Smartbi证据/P1/A_AI_RESOURCE_EXPORT_20260903/
- KB原生备份：../../A_数据平台/04_XML恢复/AI_NATIVE_BACKUP_20260903/
- B既有DB04复测签署：B_DB04_FORMAL_REVIEW_20260901.md

## 尚不能复核为PASS的项目

1. 独立干净目标环境尚未提供，不能执行目标空置取证、导入、源目标差异、KPI复算和恢复录屏。
2. 正式AI仍为内置“数据洞察”19/25；AI-01/04/19/20连续出现sessionstatus_timeout，六题本轮按用户指示跳过，未生成原答的题不能判PASS。
3. G4、G5、G6及A07整体不得签PASS；B签署必须由B本人完成。

## 交给B的最短动作

1. 只读抽查A07性能文本与DB04既有复测记录，填写B自己的性能复核结论。
2. 在受控内部位置核对两份XML的字节数、SHA-256和安全复核结论；不要把XML推送到公开仓库。
3. 如能提供独立干净目标，按A07_RECOVERY_RUNBOOK_V50.txt执行空置取证与恢复；A记录导入事实，B独立复核对象、六页、KPI和内置数据洞察模型选择。
4. AI正式复测维持暂停；只有项目重新决定开启且平台会话服务正常时，才按冻结问句恢复六题及25问回归。

## A侧签署

执行者A：A07_PACKAGE_READY_FOR_B_PARTIAL_REVIEW。
签署时间：2026-09-03 21:41:46 +08:00。
边界：仅签已列明的A侧交付事实；不签独立恢复、六题、25问、G4—G6，不代签B。
