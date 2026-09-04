# 三项风险说明的只读核验

日期：2026-09-04；交付正文：[A侧风险处置说明](../../../../00_共享/每日协调/A_RISK_DISPOSITION_20260904.md)。

## 结果

本轮已完成证据复算和A书面说明，可以带限制交阅；未作B签署、最终风险接受、模型冻结或恢复验收。

- 资源锁21项历史均不可追溯，原工作簿未改。当前快照21项身份匹配，不反推历史无覆盖或全租户唯一。
- 规定名称13项超过历史日志记录的30字符限制，现名0项超过；最长41与29。前缀缩短不能单独证明跨项目隔离。
- 政策2744行，年份维2010—2025；源端匹配2704、未匹配40，左连接2744、膨胀0。40条全部为2026年待核记录，占全表约1.46%、占2026分区100%。
- 原关系审计A15:H15中PASS保持原样，本说明不把它解释为无遗漏或最终豁免。不重新给B增加DB05启动前置项。

## 来源与方法

`inspect_risks.mjs`通过捆绑表格工具只读导入五本文件：原资源锁、A侧关系审计、共享关系审计、锁定源country_policy_year和dim_year。工作簿范围分别为资源锁A1:G22、关系审计A1:H20、data A1:O2745、data A1:E17；原文件导入前后哈希一致，未调用导出。

`verify_risks.py`验证上述提取对应的当前输入哈希、A00锁定源哈希、当前XML包哈希与模型身份链，复算年份匹配、粒度、前缀长度，并检查已退役生成器的静态保护。只保存不含连接地址或数据库账户值的`RISK_EVIDENCE.json`。

本次选择与任务直接相关的覆盖率、匹配分母、证据时点和命名映射检查，没有扫描或修复CPI。没有新平台JOIN、截图或全租户同名结果。30字符限制来自历史执行日志，不是本轮重新测试的通用产品结论。

## 可复现文件

- `RISK_EVIDENCE.json`：五本工作簿的哈希、原审计#14行、21项命名/视图/物理表映射、覆盖率和限制。
- `inspect_risks.mjs`：只读提取，输出`outputs/READ_ONLY_INPUTS.json`。此全行中间件及node_modules被Git忽略，不公开上传。
- `verify_risks.py`：独立复算逻辑，需先有只读提取结果。所有源工作簿和原始XML需在本地，不将受控XML上传仓库。
- `RISK_REVIEW.ipynb`：3个代码单元按顺序在同一Python上下文执行，输出已保存；JSON结构和单元执行结果已检查。捆绑环境缺nbformat/nbclient，**未启动Jupyter内核，也未运行其官方结构校验器**。该限制不影响verify_risks.py已实际完成的源端复算。
- `build_review_notebook.py`：上述笔记本的标准库生成与逐单元执行入口。不是Excel作者脚本，不改工作簿。

执行顺序：在提供`@oai/artifact-tool`的捆绑Node环境运行`node inspect_risks.mjs`，再用捆绑Python运行`verify_risks.py`和`build_review_notebook.py`。复核者若需要完整Jupyter验证，可在其Jupyter环境执行`python -m jupyter nbconvert --execute --to notebook --inplace RISK_REVIEW.ipynb`，工作目录设为本目录。

五本源工作簿、源数据、原资源锁历史记录不变。未执行归档重建生成器；只读证据不是新的平台实测或最终验收通过记录。
