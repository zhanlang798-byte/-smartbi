# A03 CPI 底层数值化修复预检与可逆试修

日期：2026-09-04。结论：`FAIL_MAX_PENDING_REPAIR`，不是修复通过或 B 签收。

## 本轮完成

1. 从当前租户导出指定正式模型 `MDL_XH202612_V50_COUNTRY_RESERVE`。带“可导入数据库”依赖的首次导出返回 `java.lang.Long cannot be cast to smartbi.catalogtree.cache.AclObject`；改为仅导出正式模型后成功。本轮未导出权限、未修补平台 ACL。
2. 修复前导出 `migrate (10).xml`，721,318 字节，SHA-256 `7cde968407b7cb9ab56df1f2121e2c1673ff617db1f1ac71ae76f5306e005b3f`。模型最后修改时间为 `2026-09-02 23:44:40`，22 个视图；模型 CPI 覆盖类型 BIGDECIMAL，源视图 CPI 类型 STRING。原始文件仅在忽略目录 `backups/` 受控保存。
3. 在“数据连接”定位 `input.v50_country_monthly_risk` 的 18 个目录字段。只将 CPI 目录类型从 STRING 改为 BIGDECIMAL，平台提示保存成功，重开仍为 BIGDECIMAL；其余 17 个字段保持原状。
4. 对正式模型尝试单表“同步”，勾选保留表/字段别名、描述、数据类型、格式、分区设置。同步草稿中 CPI 反而显示字符串，故没有点击正式模型保存。原生 MAX 指标卡刷新后仍为 993.56，未得到预期 47,954.24。本轮没有把目录元数据改型当作物理字段改型成功，也没有把缓存刷新请求当作独立查询成功证据。
5. 已将 CPI 目录类型及格式回退为 STRING / `<字符串-默认值>`，保存并重开核对：18 个目录字段与试修前逐项一致。
6. 再导出正式模型 `migrate (11).xml`，721,318 字节，SHA-256 `688622fb50d69f04556685e060346964177402e1a15f7e95b2bf5348cd3c87eb`。解析对比完整 `AUGMENTED_DATASET` 子树：属性和全部子元素均未改变，最后修改时间也未改变。两个文件整体哈希不同，不能称为同一文件；模型内容相同由结构比较验证。
7. 查看“转换为 ETL 高级查询”入口得到“源表 → 输出到 MPP”草稿，未运行、未保存，已取消。该路线会引入抽取路径，不能作为本轮单字段目录修复悄悄上线。[Smartbi 官方说明](https://my.smartbi.com.cn/forum.php?mod=viewthread&tid=14068)也说明 ETL 高级查询需要抽取模式。

## 未完成及下一步

- 当前安全修改路径仍未闭环：目录类型可以保存，但不能据此证明聚合前已数值化；模型同步还会回到字符串。正式 MAX 失败仍沿用上一轮全表 SQL/原生卡片证据，详见 `../A03_CPI_RUNTIME_RECHECK_20260904/README.md`。
- `CPI_REPAIR_CANDIDATE.sql` 是保持 18 列、无过滤/连接/去重、保留空值的 SELECT 候选；仅局部 CAST 聚合已在上一轮验证，完整候选尚未绑定正式模型或执行上线。
- 后续应由平台/源表维护方确认并提供**保持现有表名、字段引用和关系不变的物理数值化入口**；若只能替换成 SQL 查询，须先核对字段 ID 映射、全部引用与回退方式，不能直接删除旧表、重建表或覆盖上传。
- 实施后必须复测：原生 MAX=47,954.24、AVG=375.80（两位小数）；7680 行、7616 非空、64 空值；iso3+month_end 唯一；DB02 趋势、受影响 CPI 同比和筛选；重新导出并比较字段/关系/引用。之后才提交 B 独立复核。
- 本轮不改任何 Excel 状态或签署，不改只读源文件，不改物理表数据，不运行 DDL，不改正式 AI 路线，不重试已跳过的六题。G2 启动放行保持；G4—G6 不签最终 PASS。

## 核验材料

| 文件 | 用途 |
|---|---|
| `01_SOURCE_FIELD_METADATA.json` | 试修前 18 字段目录元数据 |
| `02_ETL_CONVERSION_PREFLIGHT.txt` | 未运行/未保存的 ETL 转换入口 |
| `03_CATALOG_TYPE_SAVE_RESULT.txt` | 目录改型保存成功提示 |
| `04_MODEL_SYNC_OPTIONS.txt` | 同步时勾选的保留选项 |
| `05_SYNC_DRAFT_CPI_STRING.txt` | 未发布的同步草稿 CPI 回到 STRING |
| `06_CATALOG_AFTER_REOPEN.json` | 目录改型重开后确实 BIGDECIMAL |
| `07_NATIVE_MAX_AFTER_CATALOG_TRIAL.txt` | 指定模型原生 MAX 刷新后仍 993.56 |
| `08_CATALOG_ROLLBACK_REOPEN.json` | 回退后 18 字段与原状一致 |
| `09_FRESH_MODEL_REOPEN.txt` | 重新从资源入口打开的正式模型会话，CPI 保持原长浮点型；旧同步草稿页已关闭 |
| `BACKUP_VERIFICATION.json` / `inspect_backup.py` | 新备份的脱敏核验与只读解析 |
| `TRIAL_VERIFICATION.json` / `verify_trial.py` | 模型完整子树未改变及目录回退断言 |

原始 XML 不是独立恢复测试结果，不上传公开 GitHub；仓库仅保存脱敏元数据、哈希、证据文本和候选 SQL。
