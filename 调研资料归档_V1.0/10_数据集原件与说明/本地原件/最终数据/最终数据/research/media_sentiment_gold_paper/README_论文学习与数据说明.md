# 《融合媒体情绪的黄金价格预测》论文学习与数据说明

更新时间：2026-07-15

## 一、先说结论

这篇论文的方法框架有参考价值，但目前不能按原文精确复现。MDPI/PMC 页面没有提供数值数据、代码、补充附件、最终情绪词表或每日媒体情绪指标 BI。论文的 Data Availability Statement 声称提供 WGC、LBMA 和“SGC”市场金价，但公开页面并没有可下载附件；“SGC”也很可能是 SGE 的笔误。

本数据包因此严格分成三类：

1. **论文原文与结构化全文**：已经下载，可核验方法、图表、参考文献和数据可得性声明。
2. **论文明确引用、可以合法下载的原始数据**：目前唯一能直接锁定的是参考文献 32 的 THUOCL 财经词表。
3. **开放复现代理数据**：EPU、美国实际利率、广义美元指数、世界银行商品价格。这些数据用于先跑通模型或做扩展研究，均不是原作者使用的数据。

## 二、论文信息

- 题目：*Forecasting the Price of Gold with Integrated Media Sentiment—A Prediction Framework Based on Online News Sentiment Mining with CNN-QRLSTM*
- 期刊：Entropy, 2026, 28(3), 271
- DOI：10.3390/e28030271
- 发表日期：2026-02-28
- MDPI：https://www.mdpi.com/1099-4300/28/3/271
- PMC：https://pmc.ncbi.nlm.nih.gov/articles/PMC13025532/
- 本地 PDF：`paper/Ji_et_al_2026_Entropy_CNN-QRLSTM.pdf`
- 本地全文 XML：`metadata/europepmc_fulltext.xml`

## 三、论文框架学习

论文的主线是“多源数据 + 领域情绪 + 分解降噪 + 分位数深度学习”：

1. 使用 WGC/Global、LBMA、上海黄金交易所三个市场的金价。
2. 使用 USDX、CPI、EIR、M2、EPU、石油、铜、ACI 等外生变量。
3. 从金投网获取 1303 篇黄金新闻，抽取其中 300 篇选择种子词。
4. 以 THUOCL 财经词表、HowNet 情感词典及否定词/程度副词规则为基础，构造黄金领域情绪词典。
5. 论文称最终词典包含 55 个正向词和 104 个负向词，据此生成每日媒体情绪指标 BI。
6. 对价格序列做 EEMD 分解，再结合 Hurst 指数与样本熵识别噪声分量，文中剔除 IMF1 和 IMF2。
7. 使用 CNN 提取局部模式，QRLSTM 预测条件分位数，并加入注意力机制，输出点预测和区间预测。
8. 按时间顺序使用 70% 训练、30% 测试；文中称 BI 使用一期滞后以降低前视偏差。

论文报告的代表性结果是：加入 BI 后，WGC 市场模型的 MAE 为 13.2、MAPE 为 0.542%、R² 为 0.998。该结果需要与随机游走/前值基线、收益率预测、严格滚动外样本以及防泄漏处理一起重新审计。

## 四、已下载和整理的数据

### 1. 论文明确引用的公开词库

THUOCL 财经词表：

- 原始文件：`datasets/raw/THUOCL_caijing.txt`
- UTF-8 CSV：`datasets/processed/THUOCL_caijing_utf8.csv`
- 词条数：3830
- 字段：词条、文档频次 DF
- 官方仓库：https://github.com/thunlp/THUOCL
- 论文引用的 Heywhale 页面：https://www.heywhale.com/mw/dataset/611a163b911b3300174a19f2
- 许可：MIT；成果中应声明使用“清华大学开放中文词库”并按官方说明引用。

重要：THUOCL 财经词表只是基础财经词库，不是论文最终的 55 正向/104 负向黄金情绪词表。后者没有公开。

### 2. 中国大陆报纸 EPU 候选代理

- 原始文件：`datasets/raw/China_Mainland_Paper_EPU.xlsx`
- 处理文件：`datasets/processed/China_Mainland_EPU_proxy_2022-02_to_2025-02.csv`
- 时间窗：2022-02 至 2025-02，共 37 个月
- 来源：https://www.policyuncertainty.com/china_monthly.html
- 许可：CC BY 4.0；应注明 Davis、Liu、Sheng 及 policyuncertainty.com。

论文没有说明使用哪个中国 EPU 版本，因此这里只能作为候选代理，不能写成“论文原始 EPU”。

### 3. 实际利率开放代理

- 文件：`datasets/processed/US_Treasury_real_yield_proxy_2022-02_to_2025-02.csv`
- 观测数：769 个非空交易日
- 指标：美国财政部 10 年期 TIPS 实际收益率
- 来源：https://home.treasury.gov/resource-center/data-chart-center/interest-rates

论文的 EIR 没有说明国家、期限、单位及是否为 real/effective interest rate，本文件只是透明、可追溯的开放代理。

### 4. 美元指数开放代理

- 文件：`datasets/processed/Fed_broad_dollar_proxy_2022-02_to_2025-02.csv`
- 观测数：770 个非空交易日
- 指标：美联储 H.10 广义美元指数
- 来源：https://www.federalreserve.gov/releases/h10/current/

它不等于 ICE DXY。论文图中的 USDX 更像 DXY，但论文没有给供应商或代码，因此不能把本文件冒充为原序列。

### 5. 世界银行商品月度代理

- 文件：`datasets/processed/World_Bank_commodity_proxies_2022-02_to_2025-02.csv`
- 时间窗：2022-02 至 2025-02，共 37 个月
- 字段：Brent 原油、铜、黄金、白银
- 单位：美元/桶、美元/吨、美元/盎司
- 来源：https://www.worldbank.org/en/research/commodity-markets

这是月频开放数据，用于先跑通模型以及扩展到金银联合预测；它不能替代论文图示的日频石油/铜价。

## 五、没有下载的原始数据及原因

| 数据 | 状态 | 原因 |
|---|---|---|
| WGC/Global 金价 | 未作为论文原数据下载 | 论文未定义字段、时点、币种；相关历史 LBMA 基准价受 IBA 许可约束 |
| LBMA Gold Price | 需授权 | AM/PM、币种未说明；获取、使用或再分发历史数据通常需要 IBA 许可 |
| SGE 金价 | 只能定位官方入口 | 合约、收盘价/加权均价未说明；2024 年前后分属不同查询页 |
| 金投网 1303 篇新闻 | 未公开 | 作者没有提供 URL 清单、抓取时间、去重规则或文本文件；正文还受版权与网站条款约束 |
| 每日 BI | 未公开 | 最终词典、语义规则、逐篇得分和日度聚合值均未附 |
| HowNet 情感词典 | 未下载 | 论文没有给版本、引用或许可信息 |
| CPI、M2 | 未下载为“原始序列” | 国家、基期、单位、季调、存量/同比及缩放方式不明 |
| ACI | 需团队成员人工下载 | 官方要求先勾选条款，允许个人专业/非商业研究，但禁止机器人抓取和再分发 |

官方入口：

- LBMA：https://www.lbma.org.uk/prices-and-data/lbma-precious-metal-prices
- WGC/Goldhub：https://china.gold.org/goldhub/data/gold-prices
- SGE 2024 年起：https://www.sge.com.cn/sjzx/quotation_daily_new
- SGE 更早历史数据：https://www.sge.com.cn/sjzx/mrhqsj
- ACI：https://actuariesclimateindex.org/data/

## 六、最重要的复现问题

1. **样本天数矛盾**：论文称 2022-02-01 至 2025-02-28 共 1093 天且包含非交易日；含首尾的自然日实际是 1124 天，相差 31 天。
2. **潜在分解泄漏**：如果先对全样本做 EEMD，再切分 70%/30%，测试期信息会进入训练期分量。论文没有清楚说明是否在每个滚动窗口内重新分解。
3. **插值可能使用未来信息**：论文使用前后各 5 个点做拉格朗日插值；“后 5 点”对真实预测不可用。
4. **价格单位和时点不统一**：SGE 通常为人民币/克，LBMA/WGC 常为美元/盎司，论文图示没有完整说明换算与对齐。
5. **外生变量没有数据字典**：USDX、CPI、EIR、M2、EPU、石油、铜、ACI 的代码、单位、时区、发布时间和修订规则均缺失。
6. **高 R² 不等于有效预测**：价格水平高度自相关，必须增加 `t+1=t`、随机游走等基线，并同时考察收益率、涨跌方向和区间覆盖率。

## 七、建议的比赛复现路线

1. 先选一个可审计的主目标，例如 SGE Au99.99 日收盘；其他市场仅做稳健性检验。
2. 先完成无情绪基线：naive、ARIMA、XGBoost、LSTM。
3. 为每个特征建立“最早可用时间”字段，所有宏观变量按发布滞后处理。
4. 重建新闻管线时保存 URL、发布时间、抓取时间、正文哈希、去重结果和逐篇得分。
5. 对比分词典 BI 与中文金融预训练模型 BI，并做无 BI/词典 BI/预训练 BI 的消融实验。
6. 使用扩展窗口 walk-forward；分解、标准化、特征选择、调参全部放进每个训练窗口。
7. 预测目标同时包含下一交易日对数收益、上涨概率和 0.05/0.5/0.95 分位数。
8. 评价除 MAE、RMSE、MAPE、R² 外，再加入方向准确率、pinball loss、区间覆盖率和 Diebold-Mariano 检验。

## 八、文件导航与校验

- 综合工作簿：`outputs/019f56e7-91fe-7a43-b1d0-ae50e45c9d0c/论文数据来源与复现清单.xlsx`
- 机器可读数据清单：`metadata/dataset_manifest.csv`
- 文件 SHA-256：`metadata/checksums_sha256.txt`
- 工作簿包含：导读、数据清单、复现风险、THUOCL 词表、EPU 代理、实际利率代理、美元指数代理、商品月度代理和质量检查。

任何后续论文或答辩中，都应把“精确引用源”“作者未公开数据”“开放代理数据”三者分开表述。
