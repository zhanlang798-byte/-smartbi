# A→B｜B04 基准与模型链修复交接（2026-09-01）

## 当前状态

`A_BASELINE_FIXED / MODEL_XML_PATCH_STAGED / AGENT_R11_STAGED / SMARTBI_DEPLOYMENT_BLOCKED_LOGIN / B_RETEST_PENDING`

## A 已完成

1. 对 `02_25问基准框架_V50.xlsx` 的 AI-17 行完成 A 复核修订：撤销“10字段100%完整”旧基准，明确 SRC0721 的 `publication_date`、`earliest_backtest_date` 空值必须保持空、显式披露且不得编造；AI-21 的“5个未触发＋4个证据不足”保持不变。
2. 从最新下载 XML 定位并修复 ODI 年份 DATE、来源登记 `is_proxy` 求和度量可见、同名 `source_id/is_proxy` 跨表混淆及 ODI 金额字段语义隔离问题，生成受控内部模型修复包。
3. 将 Agent 本地提示词升级为 `V50-B04-LOCAL_STAGED-r11`，加入 AI-01/04/16/19/20 的表级字段路由和非聚合约束；未写入基准答案。
4. 未覆盖 B 的原始回答、截图、CSV、历史 FAIL 轮次或 B 签名。

## 校验

- AI-17 基准工作簿公式错误扫描：`0`。
- AI-17 基准修订后 SHA-256：`F8165E3A8DC6251D1116B71334BAA33BA49F99C4BF01ED5CDDD610DA122BD138`。
- 模型修复包 XML 已重新解析通过，14 个目标语义节点全部命中 1 次。
- 模型修复包 SHA-256：`FA99DDDAB3AB7146104A77AC5AF06936C317953F93C253643378E10A5BD8314F`。
- Agent r11 SHA-256：`1140B214A00D048E6037EFDB4D00719900FDC7AF5B14D540EC56E00AA4AF9CC0`。

## 仍需平台执行

当前内部浏览器已落到 Smartbi 登录页，密码未在会话中提供，因此不能把本地修复包伪称为已发布。恢复登录后：

1. A 备份并在 Smartbi 界面逐项应用上述模型元数据修复，保存/发布主模型；修复 XML 含其他页面，仅作受控恢复材料，不能选择“仅主模型”时不得整包导入。
2. A 将 Agent r11 字段路由规则同步到已发布 Agent 并重新发布。
3. B 沿用现有 `actual_prompt`、模型和 Skills 配置，复测 AI-01、AI-04、AI-16、AI-17、AI-19、AI-20。
4. 六题达到门槛后，B 执行 25 问全量回归；只有硬失败为 0 且页面正式复核通过后，才可申请 B04/G4。

## A 签署

- 执行者A签收：`PASS`（仅 AI-17 基准修订、本地模型修复包和 Agent r11 路由规则）。
- 签署时间：`2026-09-01 19:46:31 +08:00`。
- 边界：本签署不代表模型已在 Smartbi 发布，不代表 B 复测通过，不代签 B，也不代表 B04、G3 或 G4 已通过。
