# AI HANDOFF

请严格按以下顺序工作：

1. 读取 `AI_CONTEXT.json`，确认当前方向与未完成事项；
2. 读取 `研究资料总清单.jsonl`，不要只读PDF；
3. 对任何结论先检查 `download_status`、`evidence_grade`、`raw_proxy_simulated` 和 `redistribution_scope`；
4. 对缺失或受限来源读取资料卡和待办，不得声称已经拥有全文；
5. V4.0为当前计划，V1.1-V3.1为历史；
6. 继续执行正式数据工程时新建运行号，不覆盖本归档。

推荐提示词：

> 你正在接手XH-202612项目。先读取00_交接入口/AI_CONTEXT.json和研究资料总清单.jsonl，列出已验证事实、代理数据、缺失来源和未完成交付，再依据V4.0制定下一步。不得把metadata_only资料写成已下载，不得把计划写成成果。
