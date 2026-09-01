# DB03 正式证据索引｜2026-09-01

页面资源：`DB03_XH202612_V50_COMPANY_BOUNDARY`

当前状态：`READY_B_SIGN / A_REVIEW_PENDING`。运行时、财年/质量联动、性能、组件映射和对账已齐；B 与 A 的本人签署尚未完成，因此不写正式 PASS。

## 一、默认页面与边界

| 文件 | 证明内容 | 证据状态 |
|---|---|---|
| `01c_DB03_默认全页_预览态_上半页_20260901.png` | 四筛选器默认态、企业目录20、矩阵20、Global160、Region8、Country0、收入字段0 | 正式 |
| `01d_DB03_默认全页_预览态_下半页_20260901.png` | 企业数据可答边界默认20条及字段展示 | 正式 |
| `05c_DB03_组件3_geography_level无country_配置证据.png` | `geography_level` 无 `country` 成员，支撑 Country 固定边界0 | 正式配置证据 |

页面纵向内容超过单屏，默认全页使用上、下两张连续预览截图，不把分页/滚动结构误判为证据缺失。

## 二、企业与财年联动

| 文件 | 证明内容 | 证据状态 |
|---|---|---|
| `07d_DB03_企业筛选_华为联动_干净预览态_20260901.png` | 华为1家、Global8、Region5、固定卡0 | 正式 |
| `08a_DB03_华为_财年2020_披露6_来源1_20260901.png` | 华为×2020=披露6、来源1；固定卡保持0 | 正式 |

## 三、数据质量修复与联动

| 文件 | 证明内容 | 证据状态 |
|---|---|---|
| `08b_DB03_数据质量筛选器错误显示财年候选_BLOCKED_20260901.png` | 修复前误绑 `fiscal_year` 的问题闭环依据 | 历史问题证据，不代表当前状态 |
| `05d_DB03_数据质量筛选器绑定_quality_flag_配置证据_20260901.png` | 当前字段路径为 `V50_company_overseas_exposure.quality_flag` | 正式配置证据 |
| `08e_DB03_数据质量候选项_真实标签_20260901.png` | 下拉真实标签为 `ai_evidence_final_user_confirmed`、`user_confirmed_ai_review_sparse` | 正式 |
| `08c_DB03_数据质量_ai_evidence联动_PASS_20260901.png` | 标签1：矩阵2、Global0、Region8、固定卡0 | 正式 |
| `08d_DB03_数据质量_user_confirmed联动_PASS_20260901.png` | 标签2：矩阵20、Global160、Region0、固定卡0 | 正式 |

## 四、性能

| 文件 | 操作 | 耗时 | 结果 |
|---|---|---:|---|
| `10a_DB03_性能1_恢复默认全部企业_2.575秒_20260901.png` | 恢复企业全部并完成刷新 | 2.575秒 | PASS |
| `08c_DB03_数据质量_ai_evidence联动_PASS_20260901.png` | 选择质量标签1 | 3.813秒 | PASS |
| `08d_DB03_数据质量_user_confirmed联动_PASS_20260901.png` | 选择质量标签2 | 3.799秒 | PASS |
| `10b_DB03_性能4_数据质量恢复全部_7.615秒_PASS_20260901.png` | 恢复质量全部并关闭下拉完成刷新 | 7.615秒 | PASS |

阈值为单次不超过10秒；4次均通过。公式化计时表见 `DB03_RECONCILIATION_V50.xlsx` 的“性能计时”sheet。

## 五、正式验收三件套

1. `DB03_COMPONENT_MAP_V50.xlsx`
2. `DB03_RECONCILIATION_V50.xlsx`
3. `DB03_ACCEPTANCE_V50.txt`

## 六、签署边界

- B：核对上述材料后本人签 `PASS / FAIL / BLOCKED`，填写签名与时间。
- A：只读复核后本人签 `PASS / FAIL / BLOCKED`，填写签名与时间。
- AI 不代签任何一方；两项签署完成前，DB03 正式状态保持 `BLOCKED_SIGNOFF`。
