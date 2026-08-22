# Forecasting the Price of Gold with Integrated Media Sentiment—A Prediction Framework Based on Online News Sentiment Mining with CNN-QRLSTM

- 来源：https://pmc.ncbi.nlm.nih.gov/articles/PMC13025532/
- 发布机构：NCBI/PMC
- 原归档资产：WEB-0139
- 内容状态：MIXED_CONTENT
- 提取时间：2026-08-16T09:21:21.372Z

## Abstract

Accurate gold price forecasting is crucial for economic stability and investment decision-making. In order to improve the accuracy of gold price prediction and quantify the uncertainty of gold price fluctuation, this paper proposes a hybrid model (CNN-QRLSTM) that integrates convolutional neural network (CNN) and quantile regression long- and short-term memory network (QRLSTM) and innovatively introduces news text data to quantify the media sentiment. We combine EEMD with the Hurst index to remove white noise from the original signal, and the processed data is used as the input layer of the prediction model. Furthermore, to demonstrate the impact of news sentiment on gold prices, this paper employs entropy measurement methods based on information theory to quantify the uncertainty and information content embedded within processed gold price sequences and derived sentiment indicators. The mutual information (MI) algorithm, based on information entropy, captures the nonlinear correlations between financial keywords and market sentiment. It constructs a financial sentiment lexicon (covering keywords such as economic policies and geopolitical conflicts), combines semantic rules with context-weighted strategies, calculates sentiment scores for news texts, and generates daily aggregated media sentiment indicators. This entropy-based perception method not only enhances the interpretability of emotion-driven fluctuations but also provides a theoretical foundation for reducing prediction uncertainty through multi-source data fusion. The experiment uses 2022–2025 daily London gold spot price data, Shanghai Gold Exchange gold price data, and the same period of Gold Investment Network gold market news to carry out the study. The empirical study shows that the synergy of multi-source data fusion and the quantile regression mechanism can improve the accuracy of gold price prediction and the new paradigm of risk interpretation while providing theoretical support for the formulation of quantitative investment strategies.

**Keywords:** gold price forecast, Hurst index, EEMD, CNN-QRLSTM, online news emotional poles _BI_, information theory, entropy, mutual information

## 1\. Introduction

### 1.1. Background and Significance of the Study

Gold serves as a commodity, currency, and safe-haven asset in global markets. Its price fluctuations serve as an economic barometer and directly impact inflation hedging, exchange rate risk management, and portfolio allocation \[[1](#B1-entropy-28-00271)\]. Research shows that gold plays a crucial role in clean energy development \[[2](#B2-entropy-28-00271)\]. However, gold prices are influenced by a complex interplay of factors, such as fluctuating real interest rates, shifts in the U.S. dollar index, geopolitical tensions like trade wars, macroeconomic policy changes such as central bank interest rate adjustments, and prevailing market sentiment. These factors create complex gold price time series with nonlinearity, high noise, and structural breaks. Traditional forecasting models struggle with insufficient accuracy and poor robustness, particularly in adapting to the volatile and unpredictable nature of gold price movements \[[3](#B3-entropy-28-00271)\].

In recent years, with the proliferation of digital media and real-time data sources, vast volumes of news texts have become a crucial medium for reflecting market sentiment and expectations. Existing research confirms that investor sentiment and media bias significantly influence short-term fluctuations in gold prices. However, effectively extracting domain-specific sentiment signals from unstructured text and deeply integrating them with quantitative financial data remains a frontier challenge in current research. Furthermore, most predictive models provide only point estimates, making it difficult to quantify prediction uncertainty and failing to meet the demand for probabilistic decision support in risk management practices. Coupled with the rapid development of the Internet, the volume and types of data continue to expand, so accurately predicting the price of gold has become a serious and urgent problem. From an information-theoretic perspective, gold price volatility embodies a high degree of entropy—a measure of market uncertainty and information randomness. Effectively quantifying and reducing this entropy through data processing and feature extraction is key to improving forecast robustness.

### 1.2. Literature Review

Effective forecasting of the price of gold is of great significance not only for the formulation of strategies to cope with risks and the maintenance of economic stability but also for its far-reaching impact on the stable development of international financial markets. In recent years, domestic and foreign research on the price of gold is mainly divided into two categories: one is to explore the influencing factors of the price of gold, and the other is committed to proposing a prediction model for the price of gold \[[4](#B4-entropy-28-00271),[5](#B5-entropy-28-00271)\]. This part will elaborate on the research results of the literature from these two aspects, respectively, summarize the important factors affecting the price of gold, and summarize the research ideas and forecasting methods of the gold forecasting model.

#### 1.2.1. Factors Affecting the Price of Gold

Most of the current research on the factors influencing the price of gold has centered on macroeconomics as a central factor. Haque (2015) employed Dickey–Fuller and DF-GLS unit root tests to demonstrate a positive correlation between gold prices and the Australian dollar to US dollar (AUD/USD) exchange rate \[[6](#B6-entropy-28-00271)\]. Huang (2010) and others analyzed the correlation between the dollar index and the price of gold, and the results showed that there was a negative correlation between the two before, and there is no cointegration relationship, which is affected by a variety of factors \[[7](#B7-entropy-28-00271)\]. Xie (2010) analyzed the correlation between the US dollar and the world gold price from a long-term historical perspective to establish a cointegration equation \[[8](#B8-entropy-28-00271)\]. The conclusion shows that there is a little bit of cointegration between the world gold price and the US dollar. In Dan (2009), with the data of gold price and domestic inflation from 1996 to 2007 in China, the correlation between them is analyzed with the Phillips expanding curve equation and the method of least squares estimation \[[9](#B9-entropy-28-00271)\]. The results show that the price of gold plays a role in forecasting the inflation. Therefore, the price of gold can be used as a reference to indicate the economic trends and the changes in the inflation fluctuations. Zhu (2018) conducted an event study analyzing the impact of monetary policy from four major central banks on the dollar gold price \[[10](#B10-entropy-28-00271)\]. They concluded that the Federal Reserve and the European Central Bank exerted significant influence on gold prices, while the monetary policies of the Bank of England and the Bank of Japan had no discernible effect on gold prices.

In addition to this, some other factors influencing the price of gold have also been suggested by scholars, mainly real interest rates, geopolitical risks, commodity prices, and weather factors, as well as economic policy uncertainty and investor sentiment. Zhou (2025) investigated the relationship between geopolitical risk (GPR) and gold price bubbles \[[11](#B11-entropy-28-00271)\]. The results indicate a significant relationship between GPR and gold price bubbles, particularly with GPRA, which exerts a stronger influence than GPRT does. Apergis (2019) employed a Bayesian Markov Switching Vector Error Correction Model (VECM) to uncover a positive correlation between gold prices and real interest rates, demonstrating that gold can hedge against fluctuations in real interest rates during economic recessions \[[12](#B12-entropy-28-00271)\]. Kanjilal (2017) employed a dual-mechanism threshold vector correction model to identify distinct dynamics in gold and crude oil across long-term and short-term states following the 2008 global crisis \[[13](#B13-entropy-28-00271)\]. Their findings indicate that the relationship between gold and oil prices is nonlinear and asymmetric. Zhang (2010) examined the price volatility of two markets, oil and gold, and analyzed their cointegration and causality, and the results of the study showed that the price of crude oil and the price of gold were in agreement, and the positive correlation coefficient was significant \[[14](#B14-entropy-28-00271)\]. Zhu (2023) re-examined the potential driving impact of climate risks on gold price volatility using predictive modeling and seasonal-trend decomposition (STL) methods, observing the utility benefits of such risks \[[15](#B15-entropy-28-00271)\]. They found that gold price fluctuations are negatively correlated with physical risks. Soni (2023) employed a wavelet-based approach to examine the dynamic relationship between Indian economic policy (EPU) uncertainty and oil, stocks, and gold \[[16](#B16-entropy-28-00271)\]. Their findings indicate that in the medium to short term, gold prices exhibit a positive correlation coefficient and covariance with EPU, though the impact is not statistically significant; from a long-term perspective, EPU has a positive impact on gold prices. Luo (2022) utilized an infinite Hidden Markov (IHM) transformation model within a Heterogeneous Autoregressive (HAR) framework to accommodate structural breaks in the data and, for the first time in the literature, use a variety of sentiment indicators representing the speculative and hedging tendencies of investors in these markets as predictors in forecasting models \[[17](#B17-entropy-28-00271)\]. The results highlight the predictive role of investor sentiment-related factors in improving the forecast accuracy of volatility dynamics in commodities with the potential to also yield economic gains for investors in these markets.

[Table 1](#entropy-28-00271-t001) summarizes the factors influencing gold prices and their research methodologies as identified in the aforementioned literature.

##### Table 1.

Literature Review on Factors Affecting Gold Prices.

Author

Factor

Research Methodology

Conclusion

Huang (2010) \[[7](#B7-entropy-28-00271)\]

US dollar index

\-

There is a negative correlation between the price of gold and the US dollar index, and there is no cointegration relationship.

Xie (2010) \[[8](#B8-entropy-28-00271)\]

US dollar index

Cointegration equation

There is a little bit of cointegration between the world gold price and the US dollar.

Dan (2009) \[[9](#B9-entropy-28-00271)\]

CPI

The Phillips expanding curve equation and the method of least squares estimation

The price of gold plays a role in forecasting the inflation, and can be used as a reference to indicate the economic trends and the changes of the inflation fluctuations.

Zhu (2018) \[[10](#B10-entropy-28-00271)\]

Monetary policy

\-

The Federal Reserve and the European Central Bank have had a large impact on the gold price, while the monetary policies of the Bank of England and the Bank of Japan have had no significant impact on the gold price.

Zhou (2025) \[[11](#B11-entropy-28-00271)\]

Geopolitical risk

The log-periodic power law singularity (LPPLS) model

A significant relationship between GPR and gold price bubbles, particularly with GPRA, which exerts a stronger influence than GPRT does.

Apergis (2019) \[[12](#B12-entropy-28-00271)\]

Effective interest rate

VECM

There is a positive correlation between the price of gold and real interest rates.

Kanjilal (2017) \[[13](#B13-entropy-28-00271)\]

Crude oil

Dual-mechanism threshold vector error correction Model

The relationship between gold and oil prices is nonlinear and asymmetric.

Zhang (2010) \[[14](#B14-entropy-28-00271)\]

Crude oil price

\-

The price of oil is positively linked to the price of gold in most cases.

Zhu (2023) \[[15](#B15-entropy-28-00271)\]

Climate risk

Predictive modeling and STL decomposition

Gold price volatility is negatively correlated with physical risk.

Soni (2023) \[[16](#B16-entropy-28-00271)\]

EPU

Wavelet Method

In the short to medium term, gold prices are positively correlated with EPU, but the effect is not significant; in the long term, EPU has a positive impact on gold prices.

Luo (2022) \[[17](#B17-entropy-28-00271)\]

Investor sentiment

Infinite Hidden Markov (IHM) transformation model within a Heterogeneous Autoregressive (HAR)

The predictive role of investor sentiment-related factors in improving the accuracy of forecasting commodity volatility dynamics.

#### 1.2.2. Gold Price Forecasting Model

In order to improve the accuracy of gold price forecasting, a large number of domestic and foreign financial and statistical scholars have proposed new research directions and forecasting methods. The first group of studies focuses on modeling from traditional statistics. Ismail (2009) constructed a multiple regression model to forecast future trends in gold prices based on influencing factors such as inflation rates, exchange rates, and money supply \[[18](#B18-entropy-28-00271)\]. Amina (2015) employed a bivariate vector autoregression-generalized autoregressive conditional heteroskedasticity (VAR-GARCH) model to examine the dynamic returns and forecasting capabilities of China’s gold and stock markets, thereby assessing the diversification and hedging effectiveness of Chinese gold \[[19](#B19-entropy-28-00271)\]. Although the above methods can achieve good results when dealing with linear relationships, they often suffer from overfitting or insufficient prediction accuracy when confronted with the nonlinearity and high volatility of financial markets.

The second type of research is the prediction of gold prices based on machine learning algorithms. Li (2024) developed a novel model by integrating a BP neural network with ensemble empirical mode decomposition \[[20](#B20-entropy-28-00271)\]. Compared to the original BP neural network, this approach reduces the impact of white noise and enhances the model’s robustness. Hadavandi (2010) proposed a particle swarm optimization (PSO)-based time series model for gold price forecasting, which uses the PSO algorithm for parameter estimation and applies the model to the daily observation of gold prices \[[21](#B21-entropy-28-00271)\]. The model is tested to be able to cope with the volatility of the gold price time series. You (2025) enhanced prediction accuracy by extracting data features through a combination of convolutional neural networks (CNN) and long short-term memory (LSTM) models \[[22](#B22-entropy-28-00271)\]. While this type of machine learning has largely improved the accuracy of gold price prediction, its dataset is mostly homogeneous, and its sensitivity to parameter settings needs to be improved.

Therefore, it has become a mainstream approach to improve the predictive performance of traditional statistical models by combining them with machine learning. Poor (2024) introduced unstructured data through text analysis to construct a CNN-based gold price prediction model, demonstrating the significance of multi-source data-driven models and providing investors and financial institutions with a high-precision decision support tool \[[4](#B4-entropy-28-00271)\]. Solikhun (2025) used a quantum perceptron algorithm to predict global gold prices, utilizing it to improve the efficiency and performance of neural network models \[[23](#B23-entropy-28-00271)\]. Quantum computers can perform multiple computations simultaneously, allowing them to solve problems that are difficult for classical computers to solve. Nallamothul (2024) combined the skewness–kurtosis generalized autoregressive conditional heteroskedasticity (SKGARCH) model with LSTM to address the inadequacies of traditional methods in fully accounting for volatility information and non-normal distribution characteristics \[[24](#B24-entropy-28-00271)\]. In Guo (2025), the Complete Ensemble Empirical Mode Decomposition with Adaptive Noise (CEEMDAN) is employed to decompose a residual term containing complex information following the variational modal decomposition (VMD) and an extreme gradient boosting tree (XGBoost) optimized by the Whale Optimization Algorithm (WOA) is combined to construct the VMD-RES.-CEEMDAN-WOA-XGBoost model \[[25](#B25-entropy-28-00271)\]. It is shown that the combined prediction model has superior performance compared to the other comparative prediction models evaluated. Bhavana (2025) introduces a multi-objective optimization framework that utilizes Pareto alpha cutting techniques to evaluate and enhance gold price forecasting models \[[26](#B26-entropy-28-00271)\]. They employed three distinct models, the Autoregressive Distributed Lag (ARDL) model, a stochastic model, and the Autoregressive Integrated Moving Average (ARIMA) model, to capture the underlying dynamics of gold price fluctuations influenced by macroeconomic factors. By applying the alpha-cut technique, they filtered out less optimal models, retaining only those that met a predefined level of acceptability across all criteria. The results show that ARDL achieves excellent accuracy and goodness-of-fit, while the stochastic model exhibits robust stability. Gijy (2025) proposes a hybrid Markov Weighted Fuzzy Kernel Time Series framework for gold price prediction, together with Red Piranha Walrus Optimization (MWFKTS-RPWO) \[[27](#B27-entropy-28-00271)\]. It provides an optimal balance between computational efficiency and accuracy compared to existing methods. Wu (2025) proposed an improved brain-inspired neural network based on the GELU function and residual connections for predicting the next-day stock prices of power companies \[[28](#B28-entropy-28-00271)\]. By utilizing residual connections to transmit information between shallow and deep layers, the network fully leverages information to mine deep hidden features. Chen (2025) proposed a DROI framework incorporating econometric breakpoint tests to evaluate the predictive performance of Spanish electricity price data across different time periods \[[29](#B29-entropy-28-00271)\]. This approach effectively addressed the inherent complexities of electricity prices, such as seasonality, high volatility, and non-stationarity. Che (2025) proposed a multivariate method incorporating a genetic algorithm-based feature selection framework (GAFSF) and double bidirectional gated recurrent unit (DBiGRU) to create such a model \[[30](#B30-entropy-28-00271)\]. It employs multi-temporal and spatial characteristics for wind speed modeling to enhance information acquisition and complex pattern analysis.

[Table 2](#entropy-28-00271-t002) summarizes the various models used to forecast gold prices in the aforementioned literature, along with their research methodologies.

##### Table 2.

Gold Price Forecasting Modeling Research Literature Review.

Author

Predictive Model

Research Methodology

Conclusion

Ismail (2009) \[[18](#B18-entropy-28-00271)\]

Multiple Megression Model

Influencing factors such as inflation, exchange rates, and money supply

Forecast the future movement of the gold price based on the influencing factors.

Amina (2015) \[[19](#B19-entropy-28-00271)\]

Bivariate vector autoregression-VAR-GARCH

Dynamic Returns and Forecasts of China’s Gold and Stock Markets

Assessed the diversification and hedging effectiveness of gold in China.

Li (2024) \[[20](#B20-entropy-28-00271)\]

Combining BP neural networks and ensemble empirical modal decomposition to build a new model

\-

The effect of white noise is reduced compared to the original BP neural network to improve the robustness of the model.

Hadavandi (2010) \[[21](#B21-entropy-28-00271)\]

Particle swarm optimization (PSO)

Parameter estimation using PSO algorithm

It is able to cope with the volatility of the gold price time series and has good prediction accuracy.

You (2025) \[[22](#B22-entropy-28-00271)\]

CNN and LSTM

\-

Extracting data features to improve prediction accuracy.

Poor (2024) \[[4](#B4-entropy-28-00271)\]

Introducing unstructured data to construct a CNN-based gold price prediction model

\-

A highly accurate decision support tool for investors and financial institutions.

Solikhun (2025) \[[23](#B23-entropy-28-00271)\]

Quantum computer

\-

Multiple computations can be performed simultaneously, enabling the solution of problems that are difficult to solve with classical computers.

Nallamothul (2024) \[[24](#B24-entropy-28-00271)\]

SKGARCH and LSTM for skewness and Kurtosis

\-

The problem of under-consideration of volatility information and non-normal distribution characteristics in traditional methods is addressed.

Guo (2025) \[[25](#B25-entropy-28-00271)\]

The VMD-RES.-CEEMDAN-WOA-XGBoost model

Variable selection using a traditional LASSO model followed by prediction using QRNN

CEEMDAN is employed to decompose a residual term containing complex information following the VMD and XGBoost optimized by the WOA

Bhavana (2025) \[[26](#B26-entropy-28-00271)\]

A multi-objective optimization framework

Utilizes Pareto alpha cutting techniques to evaluate and enhance gold price forecasting models

ARDL achieves excellent accuracy and goodness-of-fit, while the stochastic model exhibits robust stability.

Gijy (2025) \[[27](#B27-entropy-28-00271)\]

MWFKTS-RPWO

\-

It provides an optimal balance between computational efficiency and accuracy compared to existing methods.

Wu (2025) \[[28](#B28-entropy-28-00271)\]

An improved brain-inspired neural network

The GELU function and residual connections

By utilizing residual connections to transmit information between shallow and deep layers, the network fully leverages information to mine deep hidden features.

Chen (2025) \[[29](#B29-entropy-28-00271)\]

DROI framework

Coupled with an econometric breakpoint test

Effectively addressed the inherent complexities of electricity prices.

Che (2025) \[[30](#B30-entropy-28-00271)\]

CEEMDAN-GAFSF-DBiGRU-OLSSA

\-

It employs multi-temporal and spatial characteristics for wind speed modeling to enhance information acquisition and complex pattern analysis.

#### 1.2.3. Information-Theoretic Approaches in Financial Forecasting

Beyond statistical and machine learning models, information theory offers a fundamental framework for quantifying uncertainty, information flow, and feature relevance in financial time series. Entropy, as a core concept, measures the unpredictability of price movements and the information content of market signals. Recent studies have incorporated entropy-based methods (e.g., approximate entropy, sample entropy) to characterize market complexity and detect regime shifts. Furthermore, Mutual Information (MI), a measure of nonlinear dependence derived from entropy, has been applied in feature selection and lexicon expansion for sentiment analysis, capturing contextual associations beyond linear correlation. Our work integrates these principles by using MI for sentiment dictionary construction and employing entropy-aware evaluation to assess uncertainty reduction in gold price forecasts.

#### 1.2.4. Existing Model Flaws and the Innovation of This Paper

To construct a more robust, precise, and interpretable gold price forecasting framework, we first systematically reviewed the limitations of existing mainstream methods and, based on this analysis, proposed the innovative contributions of this study.

##### Limitations of Existing Models and Methods

(1) Noise interference and information redundancy at the data level: Original financial time series exhibit non-stationarity and high noise characteristics. Traditional preprocessing methods (such as simple filtering or wavelet transforms) often lack adaptive capabilities when distinguishing genuine market signals from random noise, potentially leading to the loss of useful high-frequency information or residual noise. This introduces sources of uncertainty into subsequent forecasting models.

(2) The singularity of the model structure and the inadequacy of risk quantification: Mainstream forecasting models can be divided into two categories. First, traditional statistical models (such as ARIMA and GARCH) can provide interval forecasts but struggle to capture complex nonlinear relationships. Second, machine learning models (such as LSTM and CNN), while adept at capturing nonlinear patterns, cannot quantify prediction uncertainty through their point-prediction outputs, making them ill-suited for risk management requirements. Simple model combinations fail to achieve deep coordination among local feature extraction, modeling long-term dependencies, and probabilistic output.

(3) The shallow integration of multi-source data is particularly evident in the realm of sentiment analysis: Most studies merely incorporate macroeconomic indicators as supplementary inputs, while the utilization of alternative data (such as news texts) remains relatively superficial. Specifically, sentiment fusion prediction models such as Sentiment LSTM or emotion-enhanced attention mechanisms generally exhibit limitations. First, sentiment representation is limited, heavily relying on pre-built generic sentiment dictionaries without dynamic expansion tailored to the financial sector. This makes it difficult to capture sentiment semantics within market-specific contexts such as “safe-haven” and “policy uncertainty.” Second, the temporal alignment is coarse, with sentiment indicators often aggregated at daily intervals. When synchronizing with price sequences, the specific timing of news releases and the lag effects of market reactions are not sufficiently accounted for. This may cause sentiment signals to lag or lead, introducing misleading correlations. Third, the model integration remains superficial. Emotional features are typically fed directly into recurrent neural networks as supplementary input vectors without undergoing more refined local semantic structure extraction through sophisticated architectures. Furthermore, they are not synergistically optimized with quantifiable uncertainty mechanisms, thereby limiting the potential of emotional information to enhance prediction accuracy and risk insights.

(4) The Static Nature and Domain Barriers in Emotion Indicator Construction: Sentiment analysis methods based on fixed, general-purpose dictionaries struggle to adapt to the dynamic context of financial texts and fail to recognize the sentiment weighting of domain-specific keywords. This results in constructed sentiment metrics that deviate from actual market sentiment.

##### Innovative Contributions of This Paper

To address the aforementioned limitations, this paper introduces systematic innovations across four dimensions: data processing, model architecture, information fusion, and emotion quantification.

(1) To overcome the poor adaptability of traditional denoising methods, this paper proposes an advanced denoising strategy based on EEMD. After decomposing into multi-scale intrinsic modal functions (IMFs), the approach does not simply eliminate high-frequency components. Instead, it introduces a dual criterion combining the Hurst exponent and sample entropy. An IMF is only classified as predominantly random noise and excluded when it simultaneously exhibits a low Hurst index indicating anti-persistence and high sample entropy indicating high randomness. This method more precisely separates noise from valid signals by analyzing both statistical characteristics and information structure, providing cleaner and more stable inputs for subsequent predictions.

(2) To unify the nonlinear fitting capability and uncertainty quantification capability of the model, this paper proposes a novel hybrid deep learning framework, CNN-QRLSTM. Within this model, CNN provides local perception and parameter sharing capabilities, effectively capturing local patterns in input sequences while reducing model complexity. QR performs interval estimation across different quantiles and employs a quantile loss function to weight cross-quantile prediction errors, thereby optimizing forecast outcomes. As a core component, LSTM captures long-term dependencies within sequences and demonstrates memory capabilities. This method excels in nonlinear fitting and is suitable for forecasting both short-term and long-term gold prices characterized by inherent volatility.

(3) This paper constructs a hierarchical multi-source data input system. In terms of structured data, the system incorporates eight major categories of factors, including macroeconomics, monetary policy, commodities, and climate risk. In the utilization of unstructured data, this study proposes a solution fundamentally distinct from existing sentiment fusion models. (1) Domain-adaptive sentiment construction dynamically expands the sentiment lexicon from financial news based on mutual information (MI), ensuring sentiment representations remain highly relevant to the gold market context and resolving semantic disconnect issues inherent in generic dictionaries. (2) Through multi-level feature collaboration, the CNN-QRLSTM framework establishes a progressive architecture comprising “local perception (CNN)—temporal modeling (LSTM)—risk assessment (QR).” (3) Percentile-aware emotion fusion, where emotion indicators not only serve as inputs for point predictions but also directly participate in percentile loss calculations.

(4) To achieve precise and robust domain sentiment representation, this paper proposes a method for constructing and expanding a financial sentiment lexicon based on mutual information (MI) from information theory, accompanied by rigorous experimental design to mitigate risks. Starting from seed words, the method dynamically identifies and incorporates sentiment terms with strong domain semantic associations by calculating MI values between candidate words and sets of positive/negative seed words across vast financial news. Furthermore, when calculating the daily sentiment polarity index (BI) and training the model, strict adherence to temporal sequencing is maintained. Only news from the current day and historical periods are utilized, with a one-period lag applied to the model input. This approach effectively mitigates risks of information leakage and overfitting.

In summary, the four core innovations of this study form a one-to-one solution relationship with the aforementioned four major limitations. Together, they constitute a complete, coherent, and logically consistent predictive framework innovation system—spanning data cleansing, model design, information fusion, and feature engineering—aimed at systematically enhancing the accuracy, robustness, and decision-making utility of gold price forecasting.

The remainder of this paper is organized as follows. In [Section 2](#sec2-entropy-28-00271), the basic principles of the proposed model and correction method are introduced, respectively. [Section 3](#sec3-entropy-28-00271) outlines the dataset partitioning and presents experimental results for all models, including data processing outcomes, price prediction results, and metric validation findings. In [Section 4](#sec4-entropy-28-00271), the model’s capabilities in interval coverage, time dependency, and extreme event prediction are examined. In [Section 5](#sec5-entropy-28-00271), the experimental results are summarized and future research prospects are discussed.

## 2\. Methodology

### 2.1. EEMD–Hurst–Entropy Model Theory

#### 2.1.1. EEMD Model

Integrated Empirical Modal Decomposition (EEMD) is an improved method of Empirical Modal Decomposition (EMD) that suppresses the defects of EMD mode mixing by adding white noise. The core idea of EEMD is to superimpose different Gaussian white noise sequences of the same amplitude on the original signal to change the distribution of the signal extrema and obtain the upper and lower envelopes that conform to the characteristics of the signal, and then obtain each intrinsic modal function (IMF) by EMD of the superimposed signals several times, and then perform overall averaging of the IMF results to offset the added white noise, so as to effectively inhibit modal aliasing and avoid signal decomposition distortion. In this way, the generation of modal aliasing can be effectively suppressed, and signal decomposition distortion can be avoided.

First for the original signal, add Gaussian white noise,

xj(t)\=x(t)+ε⋅ωj(t),j\=1,2,…,M,

(1)

where ωj(t) is a Gaussian white noise added for the first time. _M_ is the total number of integrations. ε is the noise amplitude factor.

Perform EMD on the signal xj(t) after each noise addition. Finding all the points of great and small values of the, construct the upper envelope emax(t) and lower envelope emin(t) of the signal using cubic spline interpolation, and compute the local mean,

m(t)\=emax(t)+emin(t)2,

(2)

Extract IMF for iterative screening,

hi(t)\=hi−1(t)−mi−1(t),

(3)

Until hi(t) satisfies the IMF conditions. The standard deviation (_SD_) is typically used as the stopping criterion.

Standard Deviation (SD) Guideline: SD\=∑tmi−1(t)2hi−12<εDifference ≤1: Nextrema−Nzero−crossings≤1

(4)

A series of intrinsic modal functions (IMFs) and a residual function are obtained,

xj(t)\=∑j\=1Mcj,i(t)+rj,n(t),

(5)

where cj,i(t) is the i-th IMF of the j-th decomposition. rj,n(t) is a residual function.

The same order IMF of all the noise-added signal decomposition results are averaged to obtain the final IMF.

c¯i(t)\=1M∑j\=1Mcj,i(t),

(6)

The final EEMD results in

x(t)≈∑j\=1nc¯i(t)+r¯n(t),

(7)

where r¯n(t) is the average residual term.

From an information-theoretic perspective, the EEMD process essentially involves a normalized separation of the original signal’s information (or uncertainty). Each intrinsic modal function (IMF) represents a distinct oscillatory pattern at different time scales, each exhibiting varying degrees of information complexity (or randomness). Shannon entropy serves as the classical tool for quantifying this uncertainty. For a discretized IMF component IMFi, its entropy value HIMFi can be approximated as

HIMFi\=−∑kpklog2pk

(8)

where pk represents the probability distribution of IMFi’s amplitude after binning. High-frequency, irregular IMF components (such as IMF1 and IMF2) typically correspond to market micro-noise or unpredictable instantaneous shocks, exhibiting high entropy values and disordered information. Conversely, low-frequency, smooth IMF components (such as trend components) possess lower entropy values and stable information structures, representing certain long-term trends. Therefore, incorporating entropy analysis enables more precise identification and removal of IMF components that primarily contribute noise rather than meaningful information.

[Figure 1](#entropy-28-00271-f001) illustrates the entire process of data decomposition using the EEMD model.

##### Figure 1.

[![Figure 1](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/a685f37d6cd1/entropy-28-00271-g001.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g001.jpg)

Technical process of EEMD.

#### 2.1.2. IMF Selection Based on Hurst Exponents and Information Entropy

To more accurately separate noise from useful information in raw signals, this paper proposes a dual-criterion IMF filtering method based on the Hurst exponent and information entropy. The Hurst exponent measures the persistence of a time series from the perspective of its long-range memory, while information entropy (specifically, sample entropy, as adopted in this paper) quantifies the randomness and irregularity of the sequence from the angle of information complexity. By combining these two complementary metrics, we can scientifically evaluate and screen the IMF components following EEMD at both the statistical characteristics and information structure levels.

##### Introduction of the Hurst Index

The generalized Hurst index describes the scaling behavior of segments with large or small fluctuations. Research indicates that when _h_ < 0.5, the time series exhibits anti-persistence; time series show random wandering behavior when h = 0.5; time series are shown to be persistent when _h_ > 0.5 \[[30](#B30-entropy-28-00271)\]. Therefore, when performing EEMD, examine the Hurst exponent of each IMF group and observe the Hurst exponent of the data after removing a specific IMF group, ensuring it remains within the range of \[0.5, 0.7\].

##### Theory and Computation of Sample Entropy

Sample entropy serves as a robust metric for measuring the complexity and irregularity of time series, particularly well-suited for short data sequences. For an IMF component A of length N, the calculation steps for its sample entropy SampEnm,r,N are as follows:

Construct an m-dimensional vector sequentially,

Xm(i)\=u(i),u(i+1),…,u(i+m−1),

(9)

where i\=1,2,…,N−m+1.

Define the distance between two distances A and B as the maximum absolute value of the differences between their corresponding elements,

dXm(i),Xm(j)\=maxk\=0,1,…,m−1u(i+k)−u(j+k),

(10)

Given a similarity tolerance _r_, count the number of vector pairs satisfying dXm(i),Xm(j)<r and calculate their proportion,

Bim(r)\=1N−m−1countdXm(i),Xm(j)<r,

(11)

Calculate the average,

Bm(r)\=1N−m∑i\=1N−mBim(r),

(12)

Increment dimension m by _m_ + 1, repeat the above steps to obtain Bm+1(r).

SampEn(m,r,N)\=−lnBm+1(r)Bm(r),

(13)

The higher the entropy value of a sample, the more complex and irregular the sequence becomes, indicating a higher proportion of random noise components. Conversely, the smoother and more regular the sequence, the more defined its information structure becomes.

##### Hurst–Entropy Dual-Criterion Screening Mechanism

After obtaining a series of IMF components through EEMD, we simultaneously calculate the Hurst exponent _H_ and sample entropy _SampEn_ for each IMF component. Based on information theory and time series analysis principles, we establish the following screening criteria:

Identification of Noise IMFs: For high-frequency IMFs, if both conditions are simultaneously satisfied, (1) H≪0.5; (2) The _SampEn_ value is significantly higher than the other components. Then it is determined that the IMF primarily consists of high-frequency random noise and non-predictive interference, and should be removed from the reconstructed signal.

Effective IMF retention: For low-to-mid frequency IMF, if the following conditions are met, (1) H≈0.5 or H\>0.5; (2) The _SampEn_ value is relatively low. Then it is determined that the IMF carries structural information with predictive value in gold price fluctuations, and should be retained and used for signal reconstruction.

##### Dual-Criteria Screening Process

First, perform EEMD on the original gold price sequence to obtain IMF components arranged from high to low frequency. Next, the Hurst exponent and sample entropy of each IMF are computed in parallel; finally, each IMF is evaluated based on the dual criteria. Those simultaneously satisfying “low Hurst exponent” and “high sample entropy” are identified as noise and removed. The remaining IMF components are reconstructed into a denoised time series, which serves as input for the subsequent CNN-QRLSTM prediction model.

[Figure 2](#entropy-28-00271-f002) illustrates the process of filtering sub-sequences after EEMD using the dual criteria of Hurst exponent and sample entropy.

###### Figure 2.

[![Figure 2](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/399dee70013b/entropy-28-00271-g002.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g002.jpg)

Dual-Criterion IMF Selection Flowchart Based on Hurst Exponent and Sample Entropy.

By introducing information entropy (sample entropy) as a complementary metric to the Hurst index, this method achieves quantitative assessment of signal components across two dimensions: “statistical properties” and “information complexity.” This not only provides a more robust theoretical foundation for noise identification but also ensures that data input into prediction models exhibits both stationarity (guaranteed by the Hurst exponent) and low randomness (guaranteed by sample entropy). Consequently, it reduces model learning uncertainty at its source, thereby enhancing prediction accuracy and robustness. Algorithm 1 presents the pseudocode for the EEMD algorithm.

**Algorithm 1.** The EEMD model pseudo-code.

EEMD (Ensemble Empirical Mode Decomposition)

Parameters:

-   _N_: Number of ensemble trials (typical range: 100–500)
    
-   _ϵ_: Noise amplitude ratio (usually 0.1–0.3 of data STD)
    
-   _IMFmax_: Maximum number of Intrinsic Mode Functions to extract
    

Input:  

-   _x_(_t_): Original time series signal (length _T_)
    
-   _wn_(_t_): White noise series for _n_\-th trial
    

  
1: /\* Initialize IMF storage and parameters \*/  
2: _IMFlist_←∅, _n_←1  
3: Normalize _x_(_t_) to zero mean  
4: WHILE (n≤ N) DO5: /\* Add controlled noise \*/6: xn(t)←x(t) + ϵ·wn(t)7: /\*EMD Decomposition \*/8: r(t)←xn(t)/\* Initialize residue \*/9:k←1/\* IMF counter \*/10: WHILE (k≤IMFmax AND r(t) not monotonic) DO11:  h(t)←r(t)/\* Working signal \*/12: /\*Extract k\-th IMF \*/13: REPEAT14: Identify all local extrema of h(t)15: Interpolate upper envelope eup(t) (cubic spline)16: Interpolate lower envelope elo(t) (cubic spline)17: m(t)←eupt+elot2/\* Meanenvelope \*/  
18: _h_(_t_)←_h_(_t_) − _m_(_t_)  
19: UNTIL (SD < 0.3)/\* Stopping criterion \*/  
20: Store _IMFkn_←_h_(_t_)  
21: _r_(_t_)←_r_(_t_) − _IMFkn_  
22:  _k_←_k_ + 1  
23: END WHILE  
24: Store residue _Rn_(_t_)←_r_(_t_)  
25: /\*Calculate the sample entropy or Shannon entropy for each IMF order\*/  
26: FOR each IMF index k DO  
27: Compute SampEn(IMF\_kn)  
28: END FOR  
29: \*n←n + 1\*  
30: END WHILE  
31: _n_←_n_ + 1  
32: END WHILE  
33: /\* Ensemble Averaging\*/34: FOR each IMF index k DO35: IMF————kt←1N∑n\=1NIMFknt  
36: Append IMF————kt to _IMFlist_  
37: END FOR  
38: R¯t←1N∑n\=1NRnt/\* Final residue \*/  
39: RETURN IMFlist, R¯t

### 2.2. Online News Sentiment Mining Model Theory

This module will detail how to calculate sentiment poles using an online news sentiment mining model _BI_ \[[31](#B31-entropy-28-00271)\]. The specific process is shown in [Figure 3](#entropy-28-00271-f003).

#### Figure 3.

[![Figure 3](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/244bb4e99601/entropy-28-00271-g003.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g003.jpg)

A technical process for calculating sentiment polarity based on online news sentiment mining models.

#### 2.2.1. Construction of a Basic Lexicon

##### Chinese Participle

In a sentiment polarity analysis based on online news texts, it is necessary to construct a multidimensional vector space representation on the basis of words to transform the textual data into computer-recognizable vectors for the next construction of the underlying lexicon. We chose to use the Tsinghua Finance and Economics Thesaurus as the base lexical entries \[[32](#B32-entropy-28-00271)\]. Some of the terms are shown in [Table 3](#entropy-28-00271-t003).

###### Table 3.

Vocabulary of financial terms and word formation in the Basic Affective Dictionary (partial).

Financial Words

Positive Emotional Words

Positive Evaluation Words

Negative Emotion Words

Negative Evaluation Words

developmental

carry

peaceful

worried

exorbitant

governments

praise

insurance

pessimism

conservative

economics

reverence

indispensable

tentative

complicated

market

favor

impartial

muffled

monotonous

resource

complacent

well-to-do

bad reaction

take time

offerings

gratitude

fairness

awkward

high cost

interest

solicitous

convenient

anxiety

dim

buying

exuberant

reliably

panic-stricken

cunning

odds

thirst

full of vitality

attack

straitened circumstances

##### Construction of an Emotional Lexicon

The Basic Emotion Dictionary includes the Basic Positive Emotion Dictionary and the Basic Negative Emotion Dictionary. We used the HowNet Sentiment Dictionary as our research dictionary. The Basic Positive Emotions Dictionary includes positive emotion words and positive evaluation words; the Basic Negative Affective Dictionary includes negative affective words and negative evaluative words. Some of the terms are shown in [Table 4](#entropy-28-00271-t004).

###### Table 4.

Word formation of auxiliary dictionaries (partial).

Degate Words

Stop-Word Phrases

Degree Level Terms

not yet

including

very

unavoidable

and

especially

not

in order to

a little bit

difficult

what

mildly

why bother

thereby

counterpart

none

but

more and more

nothing

for example

adequately

less

in addition

a little

un-

also

too

##### Construction of an Auxiliary Dictionary

The auxiliary dictionary constructed in this paper mainly consists of a Degate dictionary, a deactivation dictionary, and a degree-level dictionary. Some of the terms are shown in [Table 4](#entropy-28-00271-t004).

#### 2.2.2. Theory of MI Algorithms: An Information-Theoretic Foundation

Mutual Information (MI) is a fundamental concept in information theory, derived from Shannon entropy. It quantifies the reduction in uncertainty about one random variable given knowledge of another. Formally, for two discrete variables _X_ and _Y_, the MI IX;Y is defined as the divergence between their joint distribution and the product of their marginal distributions:

IX;Y\=∑y∈Y∑x∈Xpx,ylogp(x,y)p(x)p(y),

(14)

A higher MI value indicates a stronger statistical dependency and greater reduction in uncertainty. In the context of sentiment lexicon expansion, we leverage MI to measure the association strength between candidate words and pre-defined sets of positive or negative seed words. Words that significantly reduce the uncertainty about sentiment polarity (i.e., have high MI with a seed set) are deemed semantically aligned and incorporated into the expanded financial sentiment dictionary.

The process of calculating the degree of association between two terms is as follows:

MIw1,w2\=log2(p(w1,w2)p(w2)p(w2)),

(15)

where _w_1 and _w_2 denote two different words. _p_(_w_1) and _p_(_w_2) denote the probabilities of _w_1 and _w_2 appearing in the news text.

p(wi)\=NwiNtotal,i\=1,2,

(16)

where Nwi indicates the number of news texts appearing in _wi_, Ntotal indicates the total number of news texts. _p_(_w_1,_w_2) denotes the probability that _w_1 and _w_2 appear together in a news text, referred to as their co-occurrence probability,

p(w1,w2)\=Nw1,w2Ntotal,

(17)

where Nw1,w2 represents the number of news texts where _w_1 and _w_2 appear simultaneously.

By calculating the MI value of an unknown word with respect to the set of positive and negative sentiment words, the semantic disposition of that unknown word can be obtained SO,

SO(w)\=∑pw∈PwMI(w,pw)Npw+∑nw∈NwMI(w,nw)Nnw,

(18)

where _Pw_ is positive seed thesaurus, _pw_ is positive seed words concentrated in positive thesaurus; _Nw_ is negative seed thesaurus, _nw_ is negative seed words concentrated in negative thesaurus. ∑pw∈PwMI(w,pw) is the sum of the MI values for each _pw_ in _w_ and _Pw_, ∑nw∈NwMI(w,nw) is the sum of the MI values for each _nw_ in _w_ and _Nw_. Npw and Nnw are the number of positive and negative seed words.

SO(w)\>0 indicates that the MI between the unknown word and the positive seed word set is higher, thus classifying the unknown word as a positive term. SO(w)<0 indicates that the MI between the unknown word and the negative seed word set is higher, thus classifying the unknown word as a negative term.

#### 2.2.3. Calculation of the Number of Gold News Sentiment Poles

To get the daily sentiment polarity, you need to calculate the sentiment polarity of each gold news clause, linearly sum to get the sentiment base of each news, and finally add the sentiment polarity of daily gold news to get the daily gold news sentiment polarity. The computational flow is shown in [Figure 4](#entropy-28-00271-f004).

##### Figure 4.

[![Figure 4](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/0757f8317f88/entropy-28-00271-g004.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g004.jpg)

Calculation process for the emotional polarity _BI_.

Based on the above process, the sentiment scores of the sentences are obtained, and the sentence scores of each news item are summed to obtain the news sentiment score. Set when Score\>0.5 is positive news and when Score<−0.5 is negative news. Thus, we can calculate the daily count of positive news items Npos and negative news items Nneg. The daily emotional polarity _BI_ is

BI\=lnNpos+0.5Nneg+0.5,

(19)

when there is a lot of positive news released in the market BI\>0, on the other hand, BI<0. Algorithm 2 presents the pseudocode for the Online News Sentiment Mining Model.

**Algorithm 2.** Online News Sentiment Mining Model pseudo-code.

Online News Sentiment Mining Model

Parameters:

-   _L_: Maximum sequence length
    
-   _E_: Word embedding dimension
    
-   _K_: Number of sentiment classes (e.g., 3 for \[negative, neutral, positive\])
    
-   _α_: Learning rate
    

Input:

-   Raw news text _D_ = {_d_1,…,_dN_}
    
-   Corresponding labels _Y_ = {_y_1,…,_yN_} where yi∈{0,1,2} _yi_∈{0,1,2}
    

1:/_Text Preprocessing_/  
2: FOR each document _di_∈_D_ DO  
3: Remove non-alphabetic characters  
4: Convert to lowercase  
5: Tokenize using NLTK/Spacy →_tokens_ = \[_w_1,…,_wm_\]  
6: Lemmatize tokens  
7: Remove stopwords  
8: Pad/truncate to length _L_  
9: END FOR  
10:/_Feature Extraction_/  
11: Initialize pretrained embedding matrix _W_∈ℝ∣_V_∣ ×_E_ (GloVe/BERT)  
12: FOR each token sequence _tokensi_ DO  
13: Xi←LookupEmbedding(W,tokensi)_Xi_←_LookupEmbedding_(_W_,_tokensi_)/\* Shape: (L, E) \*/  
14: END FOR  
15:/_Hybrid Neural Network_/  
16: Define model architecture:  
17: Input layer: _input_←(_None_,_L_,_E_)  
18:/\* Parallel Feature Extractors \*/  
19: CNN Branch:  
20: _conv_1←_Conv_1_D_(_filters_ = 128,_kernel_\__size_ = 3,_activation_ = ‘_relu_’)(_input_)  
21: _pool_1←_MaxPooling_1_D_(_pool_\__size_ = 2)(_conv_1)  
22: _drop_1←_Dropout_(0.5)(_pool_1)  
23: LSTM Branch:  
24: _lstm_1←_Bidirectional_(_LSTM_(_units_ = 64,_return_\__sequences_ = _True_))(_input_)  
25: _att_←_AttentionLayer_()(_lstm_1)/\* Self-attention mechanism \*/  
26:/\* Feature Fusion \*/  
27: _merged_←_Concatenate_()(\[_drop_1,_att_\])  
28: _dense_1←_Dense_(128,_activation_ = ‘_relu_’)(_merged_)  
29: _output_←_Dense_(_K_,_activation_ = ‘_softmax_’)(_dense_1)  
30:/_Model Training/_  
31: Compile with:  
32: _loss_←‘_categorical_\__crossentropy_’  
33: _optimizer_←_Adam_(_α_)  
34: _metrics_←\[‘_accuracy_’,_F_1\__score_\]  
35: Train using mini-batches:  
36: FOR _epoch_ = 1 TO _max_\__epochs_ DO  
37: Xbatch,Ybatch←SampleBatch(X,Y,batch\_size = 32)_Xbatch_,_Ybatch_←_SampleBatch_(_X_,_Y_,_batch_\__size_ = 32)  
38:  _grads_←_Backpropagate_(_loss_,_output_)  
39:  _UpdateWeights_(_optimizer_,_grads_)  
40: IF _EarlyStopping_(_val_\__loss_,_patience_ = 3) THEN BREAK  
41: END FOR

### 2.3. CNN-QRLSTM Modeling Theory

Convolutional long short-term neural network based on quantile regression (CNN-QRLSTM) is a kind of deep learning model used to deal with time series data prediction. The model consists of a Convolutional Neural Network (CNN) and a Quartile Regression Model for Long- and Short-Term Memory Networks (QRLSTM).

#### 2.3.1. Convolutional Neural Network (CNN)

CNN is used for feature extraction and dimensionality reduction of time series data; it can recognize patterns on different time scales and is suitable for capturing local features of time series data. The main components of a CNN model include an input layer, a convolutional layer, a pooling layer, a fully connected layer, and an output layer. The calculation process is as follows:

First use a one-dimensional convolutional operation (Conv1D), for the input sequence x∈RT×d, convolution kernel W∈Rk×d×m outputs,

ytj\=∑i\=0k−1∑l\=1dWi,lj⋅xt+i,l+bj,

(20)

where _T_ is sequence length, _d_ is feature dimension, _k_ is the size of the nucleus, _m_ is the number of output channels, ytj denotes the output of the jth channel at time step t, bj is bias entry. If stride = 1, padding = 0, output length T’\=T−k+1.

Moving on to the pooling layer, reducing sequence length and increasing robustness using one-dimensional maximal pooling (ManPool1D).

yt\=maxxt⋅s,xt⋅s+1,…,xt⋅s+k−1,

(21)

where _s_ is the step size and _k_ is the pooling kernel size.

The final mapping to the prediction target is done through the full connectivity layer,

y^\=Wfc⋅Flatten(y)+bfc

(22)

#### 2.3.2. Quartile Regression of Long- and Short-Term Memory Networks (QRLSTM)

LSTM is used to capture long-term dependencies in time-series data, which regulates the flow of information through three gating units, i.e., the forgetting gate, input gate, and output gate, and a cellular state, to effectively deal with the problem of information transfer and memorization of time-series data. The calculation process is as follows \[[33](#B33-entropy-28-00271)\]:

The forget gate decides what information to discard from the cell state,

ft\=σWf⋅ht−1,xt+bf,

(23)

where _Wf_ is oblivion gate weighting matrix, _ht_−1 is the hidden state of the previous time step, _Xt_ is current input value.

Updating new information on cell status via Input Gate,

it\=σWi⋅ht−1,xt+bi (Update ratio),

(24)

C˜t\=tanhWC⋅ht−1,xt+bC (Candidate value),

(25)

Combining forgetting and input gates to update memory for cell state updating,

Ct\=ft⊙Ct−1+it⊙C˜t,

(26)

where ⊙ is element-by-element multiplication.

Output hidden state based on cell state, i.e., Output Gate,

Ot\=σWo⋅ht−1,xt+bo,

(27)

ht\=ot⊙tanhCt,

(28)

In this paper, we construct a QRLSTM model based on LSTM combined with quantile regression, estimating model parameters by optimizing the objective function,

F\=min W,bEλW,bEλW,b\=∑i\=1NρτYi−fXi,W,bρτu\=uτ−Iu,

(29)

where Eλ(W,b) is error function, Yi is sample actual values, fXi,W,b is the output values of the LSTM model, _W_ is weighting matrix, _b_ is model bias term, _I_(_u_) is characteristic function, τ is the quantile of (0,1).

Get the conditional quantile of Y as an input function for kernel density estimation,

Q^Yτ|X\=fX,W^τ,b^τZt\=Q^Yτ|X,t\=1,2,…,T,

(30)

Assuming Z1,Z2,…,ZT is mutually independent, its kernel density estimate function is

f^hZ\=1Th∑t\=1TKZ−Zth,

(31)

where _h_ is wide, based on experience this paper selects h\=1.06σ^n− 15. σ^ is sample variance, _n_ is sample size, _T_ is the number of quartiles, K⋅ is nonnegative kernel function. In this paper, the Epanechnikov kernel function was selected to calculate the

Ku\=34(1−u2)Iu≤1,

(32)

In this paper, we use the pinball loss to evaluate the probabilistic prediction effect, i.e., the smaller the loss, the better the effect. For the loss function (Pinball Loss) defined as

Lτ,tyt,y^t\=τ⋅yt−y^t(1−τ)⋅yt−y^t   if yt≥y^t   if yt<y^t,

(33)

L\=1QS∑τ\=1Q∑t∈SLτyt,y^t,

(34)

where _y_ is real value, y^ is predicted quartile, _Q_ is target quartile values, _S_ is the length of the test set.

#### 2.3.3. Entropy as a Measure of Predictive Uncertainty

While the quantile regression mechanism provides a range of possible outcomes, it is equally important to quantify the inherent uncertainty or informational clarity of these probabilistic predictions. To this end, we introduce information entropy as a complementary metric to evaluate the uncertainty encapsulated in the model’s output distribution.

For each prediction time step _t_, the CNN-QRLSTM model generates a set of quantile estimates Q^τt for τ∈T. These quantiles implicitly define an empirical cumulative distribution function (CDF). We can approximate the corresponding probability density and compute the conditional entropy of the prediction, given the model and input data,

HYt|Xt^\=−∑kpt,k^log2pt,k^

(35)

where pt,k^ represents the probability mass assigned to the k-th bin of a discretized support derived from the predicted quantiles. A lower conditional entropy HYt|Xt^ indicates that the model’s predictive distribution is more concentrated, whereas a higher entropy reflects greater dispersion and uncertainty.

This entropy-based perspective aligns with and enriches the quantile regression framework, as follows:

(1) Complement to Pinball Loss: While the pinball loss optimizes for calibration at specific quantiles, minimizing the conditional entropy encourages the overall prediction distribution to be sharper and more informative, without sacrificing calibration.

(2) Uncertainty Decomposition: The total uncertainty (differential entropy) in the gold price series can be conceptually decomposed into aleatoric uncertainty (inherent noise in the data, captured by the spread of predictive intervals) and epistemic uncertainty (model uncertainty, potentially reduced with more data or a better model). The entropy of our quantile-based distribution primarily reflects the aleatoric component pertinent to risk assessment.

(3) Information Gain Interpretation: The reduction in entropy from the marginal distribution of gold prices _H_(_Y_) to the conditional predictive distribution _H_(_Y|X_) can be viewed as the information gain achieved by our model, quantifying how much uncertainty is resolved by incorporating the multi-source explanatory variables and temporal features.

Thus, by integrating entropy analysis, our CNN-QRLSTM framework not only provides interval forecasts but also offers an information-theoretic gauge of prediction confidence. This empowers investors to distinguish between periods where the model makes precise, low-entropy forecasts and periods of high uncertainty, enabling more nuanced risk-aware decision-making. The complete CNN-QRLSTM workflow is shown in [Figure 5](#entropy-28-00271-f005), and the model pseudocode is presented in Algorithm 3.

**Algorithm 3.** The pseudo-code of CNN-QRLSTM.

CNN-QRLSTM for Multi-Quantile Time Series Forecasting

Parameters:

-   _δ_—Convergence tolerance for early stopping
    
-   _K_—Number of target quantiles (e.g., \[0.05, 0.25, 0.5, 0.75, 0.95\])
    
-   _w_—Window size (lookback period)
    
-   _f_—Number of input features
    

Hyperparameters:

-   _nepochs_—Maximum training epochs
    
-   _batch_\__size_—Mini-batch size
    
-   _η_—Learning rate
    

1: /\* Initialize model and training parameters \*/  
2: Set _epoch_←0, _converged_←_False_  
3: Initialize network weights _θ_ randomly  
4: Normalize input data _X_∈ℝ_N_× _w_ × _f_ and targets _y_  
5: WHILE (epoch<max\_epochs AND NOT converged) DO6: /\* Mini\-batch processing \*/7: FOR each batch  Xb∈ℝbatch\_size × w × f DO8: /\* Forward Pass \*/9: /\* CNN Feature Extraction \*/10:  C1 \= ReLU(Conv1D128(Xb))11: C2 \= Dropout(MaxPool1D(ReLU(Conv1D64(C1))))12: /\* LSTM Sequence Processing \*/13:  L1 \= LSTM256(Reshape(C2))14:  H \=Dropout(LSTM128(L1))15: /\* Multi\-Quantile Output \*/16:  y^k \= Dense(H) for each k∈K  
17: /\* Loss Computation \*/18: FOR each quantile  k∈K DO19:ℒk \= 1batch∑max\[k(y − y^k),(k − 1)(y − y^k)\]  
20: END FOR  
21: _total_\__loss_ = ∑_k_∈_K_ℒ_k_  
22: /\* Backpropagation \*/  
23: Compute gradients ∇_θtotal_\__loss_  
24: Update parameters _θ_←_θ_ − _η_∇_θ_  
25: END FOR  
26: /\*Epoch Evaluation\*/  
27: IF (∣_total_\__lossepoch_ − _total_\__lossepoch_ − 1∣ < _δ_) THEN  
28:  _converged_←_True_  
29: END IF  
30: _epoch_←_epoch_ + 1  
31: END WHILE  
32: /\* Model Output \*/33: Return trained weights θ and quantile predictions {y^k}k∈K

##### Figure 5.

[![Figure 5](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/e121dc11ea40/entropy-28-00271-g005.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g005.jpg)

The total workflow of this module.

#### 2.3.4. CNN-QRLSTM Collaborative Mechanism and Performance Enhancement Approaches

CNN, QR, and LSTM synergistically enhance prediction performance within this framework through the following mechanisms.

(1) CNN as a Local Semantic and Temporal Pattern Extractor: Perform one-dimensional convolution on input sequences (including sentiment indicators, etc.) to capture short-term volatility patterns and local dependencies. Through dimension reduction via the pooling layer, salient features are preserved while noise transmission to subsequent LSTM layers is minimized.

(2) LSTM as a module for long-term dependencies and sequence memory: Accepting high-dimensional features extracted by CNN, it learns the long-term dynamic relationships between gold prices and multiple factors. Regulate information flow through gating mechanisms to prevent gradient vanishing and enhance modeling capabilities for complex sequence structures.

(3) QR as the output layer for uncertainty quantification and risk perception: Based on the LSTM hidden state, multiple conditional quantiles are output through a quantile fully connected layer. Using the Pinball loss function to jointly optimize all quantiles enables the model to not only predict trends but also assess price ranges at different confidence levels.

CNN’s local perception capability enhances the LSTM’s sensitivity to short-term fluctuations, while the QR mechanism transforms the LSTM’s hidden state into probabilistic outputs. This adds risk dimension information to point forecasts, thereby enhancing decision support value.

### 2.4. Framework of the Proposed Model

In this paper, we propose an integrated prediction framework based on the CNN-QRLSTM model and the online news sentiment mining model. The framework is organized into three modules. Firstly, for the data collection module, we selected three major gold exchanges, namely the World Exchange, the London Bullion Exchange, and the Shanghai Exchange. In order to provide the accuracy of the model’s predictions, we included the factors influencing the price of gold in the parameter indicators, choosing a total of eight indicators in the categories of inflation, macroeconomic categories, commodities, media sentiment, interest rates, and economic policy. Secondly, in the data processing module, for the numerical data, we use the EEMD method to add white noise to the original data, perform multiple repetitions of decomposition into multiple sets of IMFs, and introduce the Hurst index, and the IMFs with the highest frequency and the lowest Hurst index are rejected as white noise, and then the reconstructed data are used as the input data for the prediction model. To improve the accuracy of the predictive model, we will calculate the Hurst index of the processed dataset to determine the embedding dimension of the model. For the textual data, we build a textual dictionary of gold prices by the MI algorithm and calculate the sentiment polarity BI to be included in the independent variables of the prediction model. Thirdly, in the machine learning module, we use the CNN-QRLSTM model for gold price prediction, and experiments prove that this framework improves the accuracy and stability of the prediction model, which is better than the traditional machine model. A full-text technical flowchart is shown in [Figure 6](#entropy-28-00271-f006).

#### Figure 6.

[![Figure 6](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/fbaad9af334c/entropy-28-00271-g006.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g006.jpg)

Technical flow of this research.

## 3\. Results

### 3.1. Data Selection and Model Parameters

#### 3.1.1. Gold Price Date

In order to prove the accuracy of the prediction model we constructed and to realize a reasonable prediction of the gold price, we chose the world gold market and two gold markets as the object of study. The dataset includes daily traded gold prices from 1 February 2022, to 28 February 2025, for a total of 1093 days (including non-gold trading days). [Figure 7](#entropy-28-00271-f007) provides information on time horizon changes for three markets: the WGC, the London Bullion Association Market (LBMA), and the Shanghai Gold Exchange (SGE).

##### Figure 7.

[![Figure 7](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/04c1ccf9db9a/entropy-28-00271-g007.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g007.jpg)

WGC, LBMA and SGE Gold Price Trends from 1 February 2022, to 28 February 2025.

Our research centers around short-term gold forecasts, particularly for day-ahead price forecasts. A total of 70% of the dataset was used for model construction and 30% for evaluating the performance of the predictive model. Due to the existence of the gold market closure and different countries’ gold market closure times, there are a large number of missing values in each dataset. In order to ensure that the data of each market can be fairly compared horizontally, we use Lagrange interpolation to fill in the missing values, selecting the missing values before and after the five data points as a reference to ensure that the filled value is in line with the market’s gold price volatility.

Through a series of data processing, we not only improve the quality of the gold market price but also provide a solid foundation for subsequent research on the accuracy of gold price forecasting and the exploration of the influence of various factors on the volatility of the gold price.

#### 3.1.2. Data on Impact Factors

Also included within the dataset are eight influencing factors related to gold price volatility. We have taken into account the macroeconomic type of factors that affect the gold price (dollar index, inflation, etc.), economic and political factors, and some other related factors (commodities, media sentiment, etc.). Due to the existence of market closures for some commodities, the data is the same as the gold price using Lagrange interpolation to supplement missing values. Most of these factors are positively or negatively correlated with gold, and taking them into account in the model can improve the interpretability of the predictive model. The following is a detailed description of these influencing factors in [Figure 8](#entropy-28-00271-f008).

##### Figure 8.

[![Figure 8](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/88d4e5a27222/entropy-28-00271-g008.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g008.jpg)

Trends in Impact Factors 1 February 2022 through 28 February 2025.

-   ●
    
    **US dollar index (USDX)**: Gold is a commodity denominated in U.S. dollars, and the U.S. dollar index is a measure of the U.S. dollar in the international foreign exchange market. Exchange rate changes in a comprehensive indicator, so the U.S. dollar index is one of the factors closely related to the price of gold. A stronger U.S. dollar index means that the U.S. dollar strengthens relative to other major currencies, making it more expensive to buy gold, dampening demand for gold, which tends to fall in price. Therefore, USDX has a significant negative correlation with the price of gold, and the inclusion of the U.S. dollar index in the model in this study helps to improve the accuracy of the model’s predictions.
    
-   ●
    
    **Inflation (CPI)**: Gold is seen as an effective tool in the fight against inflation. When CPI figures rise, inflationary pressures increase, and investors tend to shift their assets to value-protecting commodities such as gold, which raises the demand for gold, and the price of gold tends to rise. Thus the CPI is significantly and positively correlated with the price of gold in the short run.
    
-   ●
    
    **Effective interest rate (EIR)**: “Real interest rate” refers to the real interest rate at which investors receive interest returns after excluding inflation, and the level of EIR directly affects investors’ investment decisions. When real interest rates rise, investors are more inclined to deposit their money in banks or more profitable financial products, the demand for gold falls, and the price falls; instead, investors will shift their money to gold based on avoidance. Thus, EIR is negatively correlated with the price of gold.
    
-   ●
    
    **Monetary policy (M2)**: The easing or tightening of monetary policy directly affects the country’s money supply. China’s current monetary statistics system divides the money supply into three levels, M0, M1, and M2, of which the growth rate of M2 is often used to measure the degree of monetary policy easing. When M2 grows rapidly, it indicates a looser monetary policy, more money on the market, and lower interest rates when investors seek more value-preserving assets, and the price of gold rises. Therefore, M2 is positively correlated with the price of gold, and the looser the monetary policy, the faster the price of gold grows.
    
-   ●
    
    **Bulk commodities (Petroleum and Copper)**: Commodity markets are closely linked to global economic conditions and the monetary environment. Prices of energy commodities (e.g., oil) and metal commodities (e.g., copper, aluminum) are typically influenced by global economic growth and industrial production activity. When the global economy booms, industrial production increases, and the demand for energy and metal grows; price increases at the same time will also trigger the rise of inflation. Then investors usually choose to preserve value, gold demand increases, and the price rises. Whereas agricultural commodities have a relatively weak relationship with the price of gold, in the case of an extreme food crisis, which could lead to rising prices and severe inflation, investors would tend to acquire gold, leading to an increase in the price of gold. Thus, in general, commodities are positively correlated with the price of gold, with petroleum as a proxy for energy commodities and copper as a proxy for metals in our dataset, leaving out for the time being agricultural commodities, where the correlation is weak.
    
-   ●
    
    **Economic policy (EPU)**: The Economic Policy Uncertainty Index (EPU) reflects global economic and political events such as trade disputes and political unrest. Rising EPU means increased economic policy uncertainty and increased uncertainty about the future economic outlook, which prompts investors to move their money to relatively value-protecting gold, and the price of gold thus rises. Since the implementation of economic policies does not happen overnight and requires a long-term process, EPU and gold prices show a positive correlation in the long run, but the relationship is not significant in the short run.
    
-   ●
    
    **Climate risk (ACI)**: Extreme weather events caused by climate change, such as high temperatures and heavy rains, have had a significant impact on the gold mining industry. Extreme weather events often increase the difficulty of miners’ work as well as their equipment requirements, increase economic costs, and can even result in economic losses when the price of gold rises as a result of increased mining costs. In addition to this, investors will invest in gold as a safe-haven asset in the face of uncertain weather events, and the price of gold will rise. We use the Actuarial Climate Index (ACI) as a numerical indicator of climate risk factors, which looks at six extreme climate events: extreme low temperatures (LT), extreme high temperatures (HT), extreme rainfall (Hr), extreme drought (Dr), strong winds (Hw), and sea level (Sl). We therefore believe that the ACI is positively correlated with the price of gold.
    
-   ●
    
    **Media sentiment (BI)**: Media sentiment has a significant impact on the volatility of the gold price. The price of gold falls when there is a large amount of positive news about gold in the media, causing positive sentiment to permeate the market, which in turn leads investors to invest in high-risk, high-return assets such as equities and emerging industries when there is less demand for gold; conversely, when the media reports negative news in a big way, the price of gold rises. We built an online news sentiment model for calculating the sentiment polarity (BI) of text data and chose BI as a digital indicator reflecting media sentiment, with higher BI values indicating more negative media sentiment and more disturbed market sentiment. Therefore, BI is considered to be negatively correlated with the price of gold. We incorporate the calculation of daily BI values into the prediction framework using the method of crawling gold news texts.
    

[Table 5](#entropy-28-00271-t005) presents the factors influencing gold prices introduced in this model, categorizes them, and provides the digital indicators incorporated into the model.

##### Table 5.

Classification of influencing factors.

Form

Factor

Digital Indicators

Macroeconomic

US dollar index

USDX

Inflation

CPI

Effective interest rate

EIR

Economic and Political

Monetary policy

M2

Economic policy

EPU

Others

Bulk commodities

Petroleum

Copper

Climate risk

ACI

Media sentiment

BI

#### 3.1.3. Risk Prevention and Control for Aligning Sentiment Data with Price Sequences

When constructing daily sentiment indicators _BI_ and aligning them with gold price sequences, risks such as overfitting, information leakage, sentiment lag, and noise interference may arise.

If an emotion dictionary relies excessively on training set news, it may lead to reduced out-of-sample generalization capabilities and result in overfitting. This paper employs a rolling time window to partition the training and validation sets, ensuring the emotion dictionary undergoes continuous validation within the dynamic news corpus.

Using future news sentiment to predict current prices, or incorporating future price information into sentiment indicators, will distort prediction results and heighten the risk of information leakage. This study strictly employs time-series alignment to ensure that sentiment metrics for day _t_ are calculated solely based on news released on that day and prior days. During model training, sentiment data from the preceding period is used as input to prevent forward-looking bias.

Due to the time lag between news releases and market reactions, irrational sentiment noise may interfere with model learning. This paper employs the EEMD–Hurst–Entropy method to denoise emotional sequences. By incorporating an attention mechanism into the CNN-QRLSTM architecture, it assigns dynamic weights to emotional features across different time steps, thereby enhancing the model’s ability to identify critical emotional signals.

### 3.2. Data Preprocessing Based on EEDM and Hurst Indexes

We first use the EEMD method to decompose the digital dataset consisting of gold prices and eight influencing factors in three gold markets, and then calculate the frequency and Hurst index of each IMF, and obtain the denoised digital dataset by controlling the Hurst index of the integrated dataset and removing the IMFs with high frequency and low Hurst index as white noise. The processed digital dataset retains the trend of the original dataset and has removed the most unstable fluctuation values, presenting a clearer and more stable trend, which helps to improve the accuracy and stability of the subsequent model predictions.

In the data preprocessing module, we first decompose the three market gold price datasets using EEMD, and then remove some of the IMFs as white noise in combination with the Hurst index to obtain a denoised dataset.

We categorized the dataset into 8 groups IMF. Shows IMF results after decomposition of data for three markets in [Figure 9](#entropy-28-00271-f009). It can be seen that IMF1 and IMF2 show violent fluctuations with large frequencies that may contain noise. IMF8, on the other hand, has trended flat and can be considered a trend term.

#### Figure 9.

[![Figure 9](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/647151e74de3/entropy-28-00271-g009.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g009.jpg)

Decomposed IMF results. (**a**) Decomposition results for WGC data; (**b**) decomposition results for LBMA data; (**c**) decomposition results for SGE data.

The decomposed Hurst index of the IMF is shown in [Table 6](#entropy-28-00271-t006). It can be seen that the values of IMF1 to IMF4 are all less than 0.5; in contrast, the values of IMF7 and IMF8 are all around 1 and have leveled off. By removing each set of IMFs separately and calculating the Hurst index of the integrated dataset after the removal, the value was controlled to be between 0.5 and 0.7. Finally, we find that the Hurst index after removing IMF1 and IMF2 is 0.51; therefore, these two sets of IMFs are removed as white noise.

#### Table 6.

Hurst value of IMF after decomposition.

IMF

WGC

LBMA

SGE

IMF1

−0.004

−0.002

−0.005

IMF2

−0.016

−0.015

−0.013

IMF3

0.012

0.005

0.020

IMF4

0.133

0.131

0.140

IMF5

0.575

0.400

0.534

IMF6

0.915

0.844

0.867

IMF7

0.995

0.984

0.999

IMF8

0.974

0.975

0.972

In [Figure 10](#entropy-28-00271-f010), comparing the original data with the data processed by the EEMD-H method, it can be observed that the processed data filters out the unstable components and outliers, presenting a clearer convergence result.

#### Figure 10.

[![Figure 10](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/86b95d970c33/entropy-28-00271-g010.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g010.jpg)

Comparison of data trends before and after EEMD-H model treatment. (**a**) Comparison of data before and after WGC processing; (**b**) comparison of data before and after LBMA processing; (**c**) comparison of data before and after SGE processing.

### 3.3. Calculation of Sentiment Poles Based on Online News Sentiment Mining Models

In the age of data, online news reports are the externalized manifestation of media sentiment, and different media reports investors tend to use online news reports as the main reference for investment, i.e., media sentiment indirectly influences investors’ investment decisions. Therefore, it is necessary to analyze gold news texts and incorporate the calculated sentiment polarity as a digital indicator of media sentiment into the prediction model.

The textual data is difficult to crawl due to the anti-crawling techniques of foreign gold sites; we chose the Golden Investment Network as the corpus for our study. We collected 1303 news text data from the corpus, which contains the headlines as well as the body content of the news. [Figure 11](#entropy-28-00271-f011) displays a word cloud of crawled news entries.

#### Figure 11.

[![Figure 11](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/48239eacd180/entropy-28-00271-g011.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g011.jpg)

Online Newsword Cloud.

Sentiment polarity analysis of the price of gold using the base dictionary is not accurate due to the limited number of words involved in the creation of the base dictionary, which is not domain-related. In order to better compute the sentiment polarity of gold investments, in this module we use the MI algorithm to expand the base lexicon into a gold price sentiment lexicon applicable to the gold domain.

The MI algorithm is a metric in information theory used to quantify the dependence between two random variables and is often used to compute the emotional tendency of Chinese words. It detects a nonlinear relationship between two words and measures the degree of association. We first utilized the statistics of sentiment words in 300 gold news articles to select the positive and negative sentiment words with prominent polarity as the seed word set, and some of the seed words are shown in [Table 7](#entropy-28-00271-t007).

#### Table 7.

Seed Word Collection (partial).

Positive Seed Words

Negative Seed Words

appreciation

price reduction

firm

tumble

steady

fall apar

favorable

negative

buy

sell

signal

diving

peace party

war party

praise

weak

At this point, we have obtained the golden sentiment lexicon through the MI algorithm, with a total of 55 positive sentiment words and 104 negative sentiment words, and some of the seed words are shown in [Table 8](#entropy-28-00271-t008). Combined with the base lexicon used in this paper, we finally constructed a sentiment lexicon for the gold domain, which serves as the basis for calculating the number of gold news sentiment poles.

#### Table 8.

Golden Dictionary of Emotions (partial).

Positive Emotional Words

Negative Emotion Words

rising significantly

stresses

escalate

price reduction

rising

sell

steady

depreciation

loose

disadvantageous

look forward to

damages

open

slump

work force

panic-stricken

deterministic

bullion rush

flood in

deeply entrenched

We include the calculated _BI_ as a numerical indicator of media sentiment among the factors influencing the price of gold in our forecasting models. The daily _BI_ trend results are shown in [Figure 12](#entropy-28-00271-f012).

#### Figure 12.

[![Figure 12](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/bb5211a4bdaf/entropy-28-00271-g012.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g012.jpg)

Daily _BI_ calculations.

### 3.4. Embedded Dimension Selection for Hurst Index Based Prediction Framework

Yang et al. (2023) demonstrated in their study on the relationship between the Hurst exponent and prediction accuracy that, when the Hurst index is lower than 1.92, the pattern of change within the data is more complex, so more embedding dimensions are needed to construct the prediction framework \[[34](#B34-entropy-28-00271),[35](#B35-entropy-28-00271)\]; when the Hurst index is higher than 1.92, the pattern of change within the data is relatively clear, and therefore fewer embedding dimensions are needed to construct the prediction framework.

Since we control the Hurst index of the EEMD noise reduction processed data at 0.56, we choose to set the embedding dimension to 9 based on the correlation between the influences and the gold price.

From the [Figure 13](#entropy-28-00271-f013), it is evident that the USDX, interest rates, economic policies, and investor sentiment have relatively weak explanatory power for gold price fluctuations and exhibit a positive driving effect; monetary policy and copper prices have significant explanatory power for gold price fluctuations and present a positive driving effect; the Climate Risk Index (ACI) has relatively weak explanatory power for gold price fluctuations and shows a negative driving effect; inflation (CPI) and crude oil prices (Petroleum) have significant explanatory power for gold price fluctuations and demonstrate a negative driving effect.

#### Figure 13.

[![Figure 13](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/21a6414516a0/entropy-28-00271-g013.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g013.jpg)

Correlation between various influencing factors and the price of gold. (**a**) WGC Correlation; (**b**) LBMA Correlation; (**c**) SGE Correlation.

### 3.5. Modeling Results Based on the Golden Sentiment Polarity BI

[Figure 14](#entropy-28-00271-f014) shows the point prediction and interval prediction results based on the CNN-QRLSTM prediction model, where we performed interval prediction at 80% and 40% confidence levels, respectively.

#### Figure 14.

[![Figure 14](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/fc2f664b4ed7/entropy-28-00271-g014.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g014.jpg)

Point prediction and interval prediction results based on CNN-QRLSTM prediction models. (**a**) WGC Final Forecast Results; (**b**) LBMA Final Forecast Results; (**c**) SGE Final Forecast Results.

### 3.6. Numerical Verification

In this section, in order to validate the effectiveness of our proposed gold price prediction framework, we design evaluation experiments to compare and analyze the datasets. By observing the combined performance of the framework under different evaluation metrics, the EEMD, the necessity of introducing golden sentiment poles, and the superiority of the CNN-QRLSTM over the effect of a single model are identified.

The calculation process for all evaluation indicators (_MAE_, _MSE_, _RMES_, _MAPE_, _R_2) is as follows:

MAE\=1n∑i\=1nyi−y^i,

(36)

MSE\=1n∑i\=1nyi−y^i2,

(37)

RMSE\= 1n∑i\=1nyi−y^i2,

(38)

MAPE\=100%n∑i\=1nyi−y^iyi,

(39)

R2\=1−∑i\=1nyi−y^i2∑i\=1nyi−y¯2,

(40)

We control for the combination between EEMD and each single model, i.e., we compare the values of all evaluated metrics for prediction frameworks, namely, LSTM, CNN-LSTM, CNN-QRLSTM, EEMD-CNN-LSTM, EEMD-CNN-QRLSTM, XGBoost and ARIMA-GRACH. On this basis, the introduction of the golden sentiment polarity BI was controlled, and the specific experimental data are shown in [Table 9](#entropy-28-00271-t009), [Table 10](#entropy-28-00271-t010) and [Table 11](#entropy-28-00271-t011) (all interval predictions were taken with a confidence level of 50%).

#### Table 9.

WGC Combined performance across assessment indicators.

BI

Model

MAE

MSE

RMSE

MAPE

R2

Without BI  
data

LSTM

26.505

1225.715

35.010

1.254

0.989

CNN-LSTM

39.061

4382.585

66.201

1.794

0.957

CNN-QRLSTM

31.751

1504.485

38.788

1.543

0.986

EEMD-CNN-LSTM

27.079

1271.598

35.660

1.123

0.988

EEMD-CNN-QRLSTM

21.770

1043.686

32.306

0.874

0.990

With BI

LSTM

20.670

743.864

27.274

0.974

0.993

CNN-LSTM

26.761

1240.784

35.225

1.262

0.987

CNN-QRLSTM

32.300

965.040

31.065

1.201

0.991

EEMD-CNN-LSTM

20.174

1210.872

34.780

0.844

0.989

EEMD-CNN-QRLSTM

**13.200**

**281.660**

**16.783**

**0.542**

**0.998**

XGBoost

312.880

106,787.051

326.783

18.244

−11.169

ARIMA-GRACH

224.997

60,157.020

245.269

13.573

−5.855

#### Table 10.

LBMA Combined performance across assessment indicators.

BI

Model

MAE

MSE

RMSE

MAPE

R2

Without BI  
data

LSTM

23.487

1077.188

32.821

1.218

0.987

CNN-LSTM

28.941

1715.414

41.417

1.468

0.981

CNN-QRLSTM

27.436

2521.761

50.217

1.400

0.972

EEMD-CNN-LSTM

31.049

2547.504

50.473

1.582

0.968

EEMD-CNN-QRLSTM

16.002

515.246

22.699

0.871

0.993

With BI

LSTM

13.652

467.667

21.626

0.709

0.995

CNN-LSTM

19.791

812.582

28.506

1.300

0.990

CNN-QRLSTM

15.820

538.650

23.209

0.807

0.993

EEMD-CNN-LSTM

16.362

470.668

21.695

0.848

0.994

EEMD-CNN-QRLSTM

**10.117**

**167.209**

**12.931**

**0.535**

**0.998**

XGBoost

312.880

102,845.783

320.695

17.683

−10.874

ARIMA-GRACH

218.654

58,243.876

241.338

12.875

−5.630

#### Table 11.

SGE Combined performance across assessment indicators.

BI

Model

MAE

MSE

RMSE

MAPE

R2

Without BI  
data

LSTM

26.505

1225.715

35.010

1.254

0.989

CNN-LSTM

39.061

4382.585

66.201

1.794

0.957

CNN-QRLSTM

32.951

2009.762

44.830

1.506

0.986

EEMD-CNN-LSTM

30.894

2105.213

45.883

1.362

0.985

EEMD-CNN-QRLSTM

21.083

1137.877

33.732

0.894

0.992

With BI

LSTM

28.172

1469.841

38.339

1.300

0.992

CNN-LSTM

34.111

2504.921

50.049

1.513

0.985

CNN-QRLSTM

24.611

965.040

31.065

1.201

0.991

EEMD-CNN-LSTM

23.875

1223.978

34.985

1.056

0.992

EEMD-CNN-QRLSTM

**21.590**

**1054.347**

**32.470**

**0.952**

**0.993**

XGBoost

289.457

91,267.845

302.105

16.894

−9.765

ARIMA-GRACH

198.765

45,892.768

241.338

11.987

−4.987

[Table 9](#entropy-28-00271-t009), [Table 10](#entropy-28-00271-t010) and [Table 11](#entropy-28-00271-t011) list the experimental results of WGC, LBMA, and SGE gold price data in different forecasting models in various indicators, where the bolded values indicate that the model performance is optimal. Overall, the application of the complete model is a significant improvement over the original LSTM model. The MAE, MSE, RMSE, and MAPE show a decreasing trend, and the R2 shows an increasing trend. However, ARIMA-GARCH fails to capture the complex nonlinear correlations between exogenous features and target variables, while XGBoost overlooks the strong time-series lag dependence of the dataset and suffers from severe overfitting. In contrast, hybrid or deep learning models perform far better here, as they can well integrate time-series sequence characteristics and nonlinear feature interactions, achieving much lower error metrics and more robust predictive results.

Take the WGC market data as an example, as seen in [Table 7](#entropy-28-00271-t007). Comparing the single LSTM model without the introduction of gold sentiment poles and without data processing with the full forecasting framework BI-EEMD-CNN-QRLSTM, the MAE indicator decreases from 26.505 to 13.200, the MSE indicator decreases from 1225.715 to 281.660, the RMSE indicator decreases from 35.010 to 16.783, the MAPE indicator decreases from 1.254 to 0.542, and R2 increases from 0.989 to 0.998. This shows that our prediction framework significantly reduces errors and improves prediction accuracy overall.

In order to prove the necessity of the data processing module EEMD, we compare CNN-QRLSTM with EEMD-CNN-LSTM after the introduction of BI, and the results show that the MAE metric decreases from 32.200 to 13.200, the MSE metric will be 281.660 instead of 965.040, the RMSE metric will be 16.783 instead of 31.065, the MAPE metric from 1.201 to 0.542, and the R2 indicator from 0.991 to 0.998. From this we can see that after EEMD processing the data error is reduced and accuracy is increased, proving the necessity of EEMD processing.

In addition to this, to verify the performance improvement after adding quantile regression, we compare EEMD-CNN-LSTM with EEMD-CNN-QRLSTM after introducing BI. In order to verify the necessity of introducing golden sentiment poles, we compare EEMD-CNN-QRLSTM without BI with EEMD-CNN-QRLSTM with BI. This is all to show the results of decreasing MAE, MSE, RMSE, and MAPE and increasing R2. Thus, we further confirm the importance of quantile regression with BI.

Overall, the BI-EEMD-CNN-QRLSTM framework mostly outperforms the single model on all datasets and metrics, confirming the robustness and reliability of our proposed modeling framework for gold price prediction.

## 4\. Discussion

In order to ensure the reliability and validity of the model’s prediction results, this section evaluates the model in several dimensions through prediction interval coverage tests, time dependence tests, etc. We will focus on the model’s goodness-of-fit and prediction accuracy to ensure its reliability in real gold price prediction applications.

### 4.1. Forecast Interval Coverage Test

This test is mainly used to accurately assess whether the prediction intervals output by the model (e.g., the corresponding interquartile ranges at different confidence levels) can realistically cover the range of fluctuations of the actual gold price. The effectiveness of the quantile regression model in predicting the range of price fluctuations is verified by comparing the proportion of actual prices falling within the predicted range with the theoretical confidence level to ensure that the model is able to effectively respond to large fluctuations in the market.

In [Figure 15](#entropy-28-00271-f015), the model has a better prediction interval at the 30–70 quartile, while the interval at the 10–90 quartile is too wide and the prediction is relatively too conservative.

#### Figure 15.

[![Figure 15](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/9c680fb39e80/entropy-28-00271-g015.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g015.jpg)

Coverage test.

### 4.2. Time-Dependent Test

In order to test in depth whether there is temporal autocorrelation in the model residual series, so as to accurately determine whether the model has adequately extracted the long-run dependencies embedded in the time series, we conducted an ACF test.

As shown in [Figure 16](#entropy-28-00271-f016), the residuals are close to 0 after the delay of the 6th and 12th order, indicating that the residuals are white noise (i.e., there is no significant autocorrelation), which fully indicates that the model has successfully captured the important temporal characteristics embedded in the data, effectively avoiding the omission of that key dynamic information affecting the price of gold, and guaranteeing the timeliness and accuracy of the model prediction.

#### Figure 16.

[![Figure 16](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/92b8/13025532/511056e34c0d/entropy-28-00271-g016.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=13025532_entropy-28-00271-g016.jpg)

Residual autocorrelation coefficient ACF.

### 4.3. Extreme Case Performance

To quantify the model’s ability to capture extreme market risks, [Table 12](#entropy-28-00271-t012) presents the performance of the EEMD-CNN-QRLSTM model under extreme scenarios (High-Volatility Rally, High-Volatility Drop) and a stable control scenario across the three major markets.

#### Table 12.

Extreme Condition Performance.

Market

Market Scenario

RMSE

MAE

R2

WGC

Normal Stability

13.520

10.480

0.999

High-Volatility Rally

19.240

15.120

0.997

High-Volatility Drop

23.460

18.350

0.995

LBMA

Normal Stability

29.830

22.680

0.995

High-Volatility Rally

37.240

29.150

0.992

High-Volatility Drop

41.810

33.050

0.990

SGE

Normal Stability

10.760

8.390

0.999

High-Volatility Rally

16.310

12.790

0.998

High-Volatility Drop

19.390

15.210

0.996

(1) High-Volatility Rally: An extreme upward scenario where the daily gold price increase exceeds 1.2 times the standard deviation of historical returns, reflecting sudden positive shocks such as geopolitical conflicts and favorable policies.

(2) High-Volatility Drop: An extreme downward scenario where the daily gold price decline exceeds 1.2 times the standard deviation of historical returns, corresponding to negative shocks such as better-than-expected economic data and liquidity tightening.

(3) Normal Stability (Control): A stable scenario where price fluctuations fall within ±0.5 times the standard deviation of historical means, serving as a benchmark for performance comparison.

The results show: (1) In extreme scenarios, the model still maintains excellent fitting performance with R2 all above 0.987, among which the R2 of the SGE market in the High-Volatility Drop scenario reaches 0.995, significantly outperforming the prediction performance of traditional models in extreme environments; (2) the error indicators exhibit a reasonable incremental trend of ‘Normal Stability < High-Volatility Rally < High-Volatility Drop’. For example, the RMSE of the LBMA market in the High-Volatility Drop scenario (47.060) increases by 77.2% compared with the stable scenario (26.560), which is consistent with the objective law of increased price fluctuation randomness under extreme events; (3) In cross-market comparison, the MAE of the SGE market in extreme scenarios (13.150–15.990) is significantly lower than that of WGC (17.160–20.580) and LBMA (27.970–32.390), reflecting the model’s stronger adaptability to extreme risks in China’s domestic gold market. The above results verify the core advantage of the QRLSTM quantile regression mechanism—by quantifying the conditional quantile distribution of prices, it effectively covers the range of extreme fluctuations, providing an accurate quantitative basis for risk hedging in extreme market environments.

### 4.4. Information-Theoretic Analysis of Uncertainty Reduction

We further analyze the model’s performance through an information-theoretic lens by computing the entropy reduction between the original gold price series and the model residuals. The entropy of the raw series _H_(_X_) represents the intrinsic market uncertainty. After processing with EEMD-Hurst and prediction with CNN-QRLSTM, the entropy of residuals H(ε) decreases significantly. The information gain IG\=H(X)−H(ε) quantifies how much uncertainty the model explains. Our framework achieves an average IG of 1.8 bits across three markets, indicating substantial uncertainty resolution. This aligns with the MI-driven sentiment expansion, which adds informative features that reduce entropy in price prediction.

### 4.5. Computational Overhead and Real-Time Applicability of the CNN-QRLSTM Model

We quantitatively analyzed the computational overhead of the CNN-QRLSTM model under the identical hardware conditions (CPU: Intel i7-12700H, GPU: NVIDIA RTX 3060 6G, Memory: 16G) with a unified training setup (12,000 samples, batch size 32, 30 training epochs), compared its inference speed with lightweight baseline models, and further analyzed its applicability in real-time/high-frequency gold price forecasting scenarios, while proposing targeted lightweight optimization schemes and hardware recommendations.

In terms of parameter count, the single CNN and LSTM models have about 2.3 M and 5.8 M parameters, respectively, while the CNN-QRLSTM model reaches 8.6 M, increasing by 274% and 48.3%, respectively, due to the added custom attention layer, 5 quantile-corresponding fully connected layers in QRLSTM, and the CNN + LSTM double-layer structure. For training time, the single CNN takes 1.2 min, the single LSTM 3.5 min, and the CNN-QRLSTM 5.8 min (383% and 65.7% increases), caused by the complex model structure, more intricate pinball loss calculation, with the overall training time still within an acceptable range. In terms of inference overhead, the single-sample inference time of the single CNN, single LSTM and CNN-QRLSTM is about 12 μs, 28 μs and 45 μs (275% and 60.7% increases for the latter), and the 1000-sample inference time is about 8.5 ms, 22.3 ms and 36.8 ms (333% and 65% increases for the latter). The increased inference overhead stems from the longer forward propagation chain (CNN→QRLSTM), and the model shows a batch inference efficiency advantage with a significantly lower time growth rate in batch inference. We also compared the inference speed with lightweight machine learning models (XGBoost): the 1000-sample inference time of XGBoost is about 15.2 ms respectively, while that of CNN-QRLSTM is 36.8 ms. Though slower than lightweight models, it is significantly superior to other deep learning models such as Transformer-Time-Series (89.5 ms for 1000 samples), and its inference overhead is acceptable in terms of the cost-performance ratio of prediction information value to inference overhead, as it can output multi-quantile interval predictions while lightweight models only generate point predictions.

For real-time/high-frequency forecasting applicability, the CNN-QRLSTM model is well-suited for hour-level real-time forecasting in the gold market: the total processing time for a single sample is controlled within 100 μs even with data preprocessing and feature extraction, far lower than the hour-level forecasting time window; its batch inference efficiency is high and its structural design is adapted to the characteristics of high-frequency data. For minute-level ultra-high-frequency forecasting, lightweight optimization is required, including model pruning, parameter quantization, CNN structure simplification and lightweight attention layer replacement. After optimization, the model’s parameter count can be reduced to less than 5 M, the single-sample inference time within 20 μs, and the prediction accuracy loss limited to less than 5%, without affecting practical application value. We put forward hardware recommendations for different scenarios: conventional CPUs or entry-level GPUs are sufficient for hour-level real-time forecasting; GPU clusters or dedicated inference chips combined with lightweight optimization are recommended for minute-level ultra-high-frequency forecasting; mid-to-high-end GPUs are suggested for the model training phase to shorten training time and improve development efficiency.

## 5\. Conclusions

This study proposes a hybrid forecasting framework that is grounded in information-theoretic principles and integrates deep learning to address the complexity and uncertainty inherent in gold price fluctuations. By explicitly quantifying and managing market entropy—a measure of informational randomness and unpredictability—our approach reframes gold price prediction as a problem of uncertainty reduction through information gain. The core innovation lies in the synergistic application of entropy-aware signal processing (EEMD-Hurst with Sample Entropy filtering), information-theoretic feature engineering (Mutual Information-based sentiment lexicon expansion), and entropy-interpretable probabilistic modeling (CNN-QRLSTM with quantile regression). This triad ensures that both structured numeric data and unstructured textual information are transformed into low-entropy, high-information features that maximally reduce predictive uncertainty.

At the data level, historical transaction data from the world’s three major gold markets were selected as the prediction targets. The model systematically incorporates multidimensional influencing factors such as the U.S. Dollar Index, inflation, commodity prices, and media sentiment to enhance its explanatory power in real-world scenarios. During the preprocessing stage, the original signal was decomposed using Ensemble Empirical Mode Decomposition (EEMD). IMF components were filtered using dual criteria—Hurst exponents and information entropy—effectively separating noise from valid signals. This significantly enhanced the stability and predictability of the input data. Simultaneously, to quantify the impact of media sentiment, this study developed a news sentiment mining model by constructing a financial sentiment lexicon and extending it based on the mutual information (MI) algorithm. This model calculates the daily sentiment polarity index BI, which is introduced into the predictive model as a structured market sentiment variable. In the core forecasting module, the CNN-QRLSTM model utilizes a convolutional neural network to capture the local spatio-temporal characteristics of price sequences. By incorporating a quantile regression mechanism into the LSTM, it achieves simultaneous output of point forecasts and interval forecasts. This not only provides a more comprehensive quantification of uncertainty, helping investors assess the potential scope of risks, but also overcomes the limitations of single-point forecasts in risk decision-making. To validate the framework’s reliability, we conducted a series of rigorous evaluation tests. The results indicate that this forecasting framework delivers optimal performance at a 50% confidence level and demonstrates strong resilience against risks.

Through a series of methodological innovations and empirical analyses, this study strongly proves the synergistic effect of multi-source data fusion, quantile regression, and sentiment mining and provides a two-dimensional analytical framework of “accuracy + risk” for gold price forecasting. Looking ahead, our forecasting framework can be further expanded to include high-frequency data processing, cross-market linkage analysis (e.g., a correlation study of cryptocurrencies and gold), and real-time sentiment monitoring, which is expected to further promote the widespread application of quantitative forecasting models in complex financial markets and help financial market participants grasp the opportunities in the midst of uncertainty.

## Author Contributions

Conceptualization, Y.J., X.L. and L.Z.; methodology, J.H.; software, X.L.; validation, Y.J. and X.L.; formal analysis, Y.J.; investigation, L.Z.; resources, J.H.; data curation, Y.J. and X.L.; writing—original draft preparation, Y.J.; writing—review and editing, J.H.; visualization, X.L.; supervision, J.H.; project administration, J.F.; funding acquisition, J.H. All authors have read and agreed to the published version of the manuscript.

## Data Availability Statement

This paper provides gold price data from the WGC, LBMA, and SGC markets used in the model.

## Conflicts of Interest

The authors declare no conflicts of interest.

## Funding Statement

This research was supported by Youth Program of National Natural Science Foundation of China under Grant 72103186, Innovation Centre for Digital Business and Capital Development of BTBU under Grant SZSK202309, BTBU Digital Business Platform Project by BMEC and Xi’an Social Science Planning Fund Project under Grant 25JX87.

## Footnotes

**Disclaimer/Publisher’s Note:** The statements, opinions and data contained in all publications are solely those of the individual author(s) and contributor(s) and not of MDPI and/or the editor(s). MDPI and/or the editor(s) disclaim responsibility for any injury to people or property resulting from any ideas, methods, instructions or products referred to in the content.

## References

-   1.Chang S., Qin M., Su C.W. The Uncertainty in Energy and Cryptocurrency Markets: Is Gold Really a Safe Haven? Manch. Sch. 2025;93:254–266. doi: 10.1111/manc.12510. \[[DOI](https://doi.org/10.1111/manc.12510)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Manch.%20Sch.&title=The%20Uncertainty%20in%20Energy%20and%20Cryptocurrency%20Markets:%20Is%20Gold%20Really%20a%20Safe%20Haven?&author=S.%20Chang&author=M.%20Qin&author=C.W.%20Su&volume=93&publication_year=2025&pages=254-266&doi=10.1111/manc.12510&)\]
-   2.Shi H., Heng J., Duan H., Li H., Chen W., Wang P., Cui L., Wang S. Critical Mineral Constraints Pressure Energy Transition and Trade toward the Paris Agreement Climate Goals. Nat. Commun. 2025;16:4496. doi: 10.1038/s41467-025-59741-y. \[[DOI](https://doi.org/10.1038/s41467-025-59741-y)\] \[[PMC free article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12078721/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/40368945/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nat.%20Commun.&title=Critical%20Mineral%20Constraints%20Pressure%20Energy%20Transition%20and%20Trade%20toward%20the%20Paris%20Agreement%20Climate%20Goals&author=H.%20Shi&author=J.%20Heng&author=H.%20Duan&author=H.%20Li&author=W.%20Chen&volume=16&publication_year=2025&pages=4496&pmid=40368945&doi=10.1038/s41467-025-59741-y&)\]
-   3.The Drivers of Gold Price. \[(accessed on 25 September 2025)\]. Available online: [https://xueshu.baidu.com/ndscholar/browse/detail?paperid=a3f467ded7447d54b618d2c3335d37f3&site=xueshu\_se](https://xueshu.baidu.com/ndscholar/browse/detail?paperid=a3f467ded7447d54b618d2c3335d37f3&site=xueshu_se).
-   4.Poor S.K., Fattahi S., Hajian M. Gold Price Forecasting: A Novel Approach Based on Text Mining and Big-Data-Driven Model. Stud. Bus. Econ. 2024;19:156–171. doi: 10.2478/sbe-2024-0049. \[[DOI](https://doi.org/10.2478/sbe-2024-0049)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Stud.%20Bus.%20Econ.&title=Gold%20Price%20Forecasting:%20A%20Novel%20Approach%20Based%20on%20Text%20Mining%20and%20Big-Data-Driven%20Model&author=S.K.%20Poor&author=S.%20Fattahi&author=M.%20Hajian&volume=19&publication_year=2024&pages=156-171&doi=10.2478/sbe-2024-0049&)\]
-   5.Zhou H. An Empirical Analysis of Factors Affecting Gold Prices. J. Chongqing Jiaotong Univ. (Soc. Sci. Ed.) 2008;8:42–46. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J.%20Chongqing%20Jiaotong%20Univ.%20\(Soc.%20Sci.%20Ed.\)&title=An%20Empirical%20Analysis%20of%20Factors%20Affecting%20Gold%20Prices&author=H.%20Zhou&volume=8&publication_year=2008&pages=42-46&)\]
-   6.Haque M.A., Topal E., Lilford E. Relationship between the Gold Price and the Australian Dollar—US Dollar Exchange Rate. Miner. Econ. 2015;28:65–78. doi: 10.1007/s13563-015-0067-y. \[[DOI](https://doi.org/10.1007/s13563-015-0067-y)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Miner.%20Econ.&title=Relationship%20between%20the%20Gold%20Price%20and%20the%20Australian%20Dollar%E2%80%94US%20Dollar%20Exchange%20Rate&author=M.A.%20Haque&author=E.%20Topal&author=E.%20Lilford&volume=28&publication_year=2015&pages=65-78&doi=10.1007/s13563-015-0067-y&)\]
-   7.Huang D., Wang S. 2010 Sixth International Conference on Natural Computation. IEEE; Piscataway, NJ, USA: 2010. The Real Diagnosis Analysis of the Correlation Relations between USD Index & Gold Price; pp. 724–727. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=2010%20Sixth%20International%20Conference%20on%20Natural%20Computation&author=D.%20Huang&author=S.%20Wang&publication_year=2010&)\]
-   8.Xie C. Analysis of the Dollar Factor in the Long-Term Evolution of International Gold Prices. China’s Circ. Econ. 2010;24:70–73. doi: 10.14089/j.cnki.cn11-3664/f.2010.08.021. \[[DOI](https://doi.org/10.14089/j.cnki.cn11-3664/f.2010.08.021)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=China%E2%80%99s%20Circ.%20Econ.&title=Analysis%20of%20the%20Dollar%20Factor%20in%20the%20Long-Term%20Evolution%20of%20International%20Gold%20Prices&author=C.%20Xie&volume=24&publication_year=2010&pages=70-73&doi=10.14089/j.cnki.cn11-3664/f.2010.08.021&)\]
-   9.Fu D., Mei X., Zhang H. An Empirical Analysis of the Correlation Between Gold Prices and Inflation. Gold. 2009;30:4–7. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Gold&title=An%20Empirical%20Analysis%20of%20the%20Correlation%20Between%20Gold%20Prices%20and%20Inflation&author=D.%20Fu&author=X.%20Mei&author=H.%20Zhang&volume=30&publication_year=2009&pages=4-7&)\]
-   10.Zhu Y., Fan J., Tucker J. The Impact of Monetary Policy on Gold Price Dynamics. Res. Int. Bus. Financ. 2018;44:319–331. doi: 10.1016/j.ribaf.2017.07.100. \[[DOI](https://doi.org/10.1016/j.ribaf.2017.07.100)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Res.%20Int.%20Bus.%20Financ.&title=The%20Impact%20of%20Monetary%20Policy%20on%20Gold%20Price%20Dynamics&author=Y.%20Zhu&author=J.%20Fan&author=J.%20Tucker&volume=44&publication_year=2018&pages=319-331&doi=10.1016/j.ribaf.2017.07.100&)\]
-   11.Zhou H., Liang C. Geopolitical Risk and Gold Price Bubbles. Rev. Account. Financ. 2025;24:353–374. doi: 10.1108/RAF-09-2024-0369. \[[DOI](https://doi.org/10.1108/RAF-09-2024-0369)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Rev.%20Account.%20Financ.&title=Geopolitical%20Risk%20and%20Gold%20Price%20Bubbles&author=H.%20Zhou&author=C.%20Liang&volume=24&publication_year=2025&pages=353-374&doi=10.1108/RAF-09-2024-0369&)\]
-   12.Apergis N., Cooray A., Khraief N., Apergis I. Do Gold Prices Respond to Real Interest Rates? Evidence from the Bayesian Markov Switching VECM Model. J. Int. Financ. Mark. Inst. Money. 2019;60:134–148. doi: 10.1016/j.intfin.2018.12.014. \[[DOI](https://doi.org/10.1016/j.intfin.2018.12.014)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J.%20Int.%20Financ.%20Mark.%20Inst.%20Money&title=Do%20Gold%20Prices%20Respond%20to%20Real%20Interest%20Rates?%20Evidence%20from%20the%20Bayesian%20Markov%20Switching%20VECM%20Model&author=N.%20Apergis&author=A.%20Cooray&author=N.%20Khraief&author=I.%20Apergis&volume=60&publication_year=2019&pages=134-148&doi=10.1016/j.intfin.2018.12.014&)\]
-   13.Kanjilal K., Ghosh S. Dynamics of Crude Oil and Gold Price Post 2008 Global Financial Crisis—New Evidence from Threshold Vector Error-Correction Model. Resour. Policy. 2017;52:358–365. doi: 10.1016/j.resourpol.2017.04.001. \[[DOI](https://doi.org/10.1016/j.resourpol.2017.04.001)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Resour.%20Policy&title=Dynamics%20of%20Crude%20Oil%20and%20Gold%20Price%20Post%202008%20Global%20Financial%20Crisis%E2%80%94New%20Evidence%20from%20Threshold%20Vector%20Error-Correction%20Model&author=K.%20Kanjilal&author=S.%20Ghosh&volume=52&publication_year=2017&pages=358-365&doi=10.1016/j.resourpol.2017.04.001&)\]
-   14.Zhang Y.-J., Wei Y.-M. The Crude Oil Market and the Gold Market: Evidence for Cointegration, Causality and Price Discovery. Resour. Policy. 2010;35:168–177. doi: 10.1016/j.resourpol.2010.05.003. \[[DOI](https://doi.org/10.1016/j.resourpol.2010.05.003)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Resour.%20Policy&title=The%20Crude%20Oil%20Market%20and%20the%20Gold%20Market:%20Evidence%20for%20Cointegration,%20Causality%20and%20Price%20Discovery&author=Y.-J.%20Zhang&author=Y.-M.%20Wei&volume=35&publication_year=2010&pages=168-177&doi=10.1016/j.resourpol.2010.05.003&)\]
-   15.Zhu J., Han W., Zhang J. Does Climate Risk Matter for Gold Price Volatility? Financ. Res. Lett. 2023;58:104544. doi: 10.1016/j.frl.2023.104544. \[[DOI](https://doi.org/10.1016/j.frl.2023.104544)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Financ.%20Res.%20Lett.&title=Does%20Climate%20Risk%20Matter%20for%20Gold%20Price%20Volatility?&author=J.%20Zhu&author=W.%20Han&author=J.%20Zhang&volume=58&publication_year=2023&pages=104544&doi=10.1016/j.frl.2023.104544&)\]
-   16.Soni R.K., Nandan T., Chatnani N.N. Dynamic Association of Economic Policy Uncertainty with Oil, Stock and Gold: A Wavelet-Based Approach. J. Econ. Stud. 2023;50:1501–1525. doi: 10.1108/jes-05-2022-0267. \[[DOI](https://doi.org/10.1108/jes-05-2022-0267)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J.%20Econ.%20Stud.&title=Dynamic%20Association%20of%20Economic%20Policy%20Uncertainty%20with%20Oil,%20Stock%20and%20Gold:%20A%20Wavelet-Based%20Approach&author=R.K.%20Soni&author=T.%20Nandan&author=N.N.%20Chatnani&volume=50&publication_year=2023&pages=1501-1525&doi=10.1108/jes-05-2022-0267&)\]
-   17.Luo J., Demirer R., Gupta R., Ji Q. Forecasting Oil and Gold Volatilities with Sentiment Indicators under Structural Breaks. Energy Econ. 2022;105:105751. doi: 10.1016/j.eneco.2021.105751. \[[DOI](https://doi.org/10.1016/j.eneco.2021.105751)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Energy%20Econ.&title=Forecasting%20Oil%20and%20Gold%20Volatilities%20with%20Sentiment%20Indicators%20under%20Structural%20Breaks&author=J.%20Luo&author=R.%20Demirer&author=R.%20Gupta&author=Q.%20Ji&volume=105&publication_year=2022&pages=105751&doi=10.1016/j.eneco.2021.105751&)\]
-   18.Ismail Z., Yahya A., Shabri A. Forecasting Gold Prices Using Multiple Linear Regression Method. Am. J. Appl. Sci. 2009;6:1509–1514. doi: 10.3844/ajassp.2009.1509.1514. \[[DOI](https://doi.org/10.3844/ajassp.2009.1509.1514)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Am.%20J.%20Appl.%20Sci.&title=Forecasting%20Gold%20Prices%20Using%20Multiple%20Linear%20Regression%20Method&author=Z.%20Ismail&author=A.%20Yahya&author=A.%20Shabri&volume=6&publication_year=2009&pages=1509-1514&doi=10.3844/ajassp.2009.1509.1514&)\]
-   19.El Hedi Arouri M., Lahiani A., Nguyen D.K. World Gold Prices and Stock Returns in China: Insights for Hedging and Diversification Strategies. Econ. Model. 2015;44:273–282. doi: 10.1016/j.econmod.2014.10.030. \[[DOI](https://doi.org/10.1016/j.econmod.2014.10.030)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Econ.%20Model.&title=World%20Gold%20Prices%20and%20Stock%20Returns%20in%20China:%20Insights%20for%20Hedging%20and%20Diversification%20Strategies&author=M.%20El%20Hedi%20Arouri&author=A.%20Lahiani&author=D.K.%20Nguyen&volume=44&publication_year=2015&pages=273-282&doi=10.1016/j.econmod.2014.10.030&)\]
-   20.Li H., Wang Q., Wei D. A Novel Hybrid Model Combining BPNN Neural Network and Ensemble Empirical Mode Decomposition. Int. J. Comput. Intell. Syst. 2024;17:77. doi: 10.1007/s44196-024-00446-3. \[[DOI](https://doi.org/10.1007/s44196-024-00446-3)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Int.%20J.%20Comput.%20Intell.%20Syst.&title=A%20Novel%20Hybrid%20Model%20Combining%20BPNN%20Neural%20Network%20and%20Ensemble%20Empirical%20Mode%20Decomposition&author=H.%20Li&author=Q.%20Wang&author=D.%20Wei&volume=17&publication_year=2024&pages=77&doi=10.1007/s44196-024-00446-3&)\]
-   21.Hadavandi E., Ghanbari A., Abbasian-Naghneh S. 2010 Third International Conference on Business Intelligence and Financial Engineering. IEEE; Piscataway, NJ, USA: 2010. Developing a Time Series Model Based on Particle Swarm Optimization for Gold Price Forecasting; pp. 337–340. \[[Google Scholar](https://scholar.google.com/scholar_lookup?title=2010%20Third%20International%20Conference%20on%20Business%20Intelligence%20and%20Financial%20Engineering&author=E.%20Hadavandi&author=A.%20Ghanbari&author=S.%20Abbasian-Naghneh&publication_year=2010&)\]
-   22.You W., Chen J., Xie H., Ren Y. Which Uncertainty Measure Better Predicts Gold Prices? New Evidence from a CNN-LSTM Approach. N. Am. J. Econ. Financ. 2025;76:102375. doi: 10.1016/j.najef.2025.102375. \[[DOI](https://doi.org/10.1016/j.najef.2025.102375)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=N.%20Am.%20J.%20Econ.%20Financ.&title=Which%20Uncertainty%20Measure%20Better%20Predicts%20Gold%20Prices?%20New%20Evidence%20from%20a%20CNN-LSTM%20Approach&author=W.%20You&author=J.%20Chen&author=H.%20Xie&author=Y.%20Ren&volume=76&publication_year=2025&pages=102375&doi=10.1016/j.najef.2025.102375&)\]
-   23.Solikhun S., Siregar M.R. Analyzing Perceptron Algorithm for Global Gold Price Prediction Using Quantum Computing Approach. Kinet. Game Technol. Inf. Syst. Comput. Netw. Comput. Electron. Control. 2025;10:17–28. doi: 10.22219/kinetik.v10i1.2024. \[[DOI](https://doi.org/10.22219/kinetik.v10i1.2024)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Kinet.%20Game%20Technol.%20Inf.%20Syst.%20Comput.%20Netw.%20Comput.%20Electron.%20Control&title=Analyzing%20Perceptron%20Algorithm%20for%20Global%20Gold%20Price%20Prediction%20Using%20Quantum%20Computing%20Approach&author=S.%20Solikhun&author=M.R.%20Siregar&volume=10&publication_year=2025&pages=17-28&doi=10.22219/kinetik.v10i1.2024&)\]
-   24.Nallamothu S., Rajyalakshmi K., Arumugam P. Gold Price Prediction Using Skewness and Kurtosis Based Generalized Auto-Regressive Conditional Heteroskedasticity Approach with Long Short Term Memory Network. J. Inst. Eng. India Ser. B. 2024;105:1715–1727. doi: 10.1007/s40031-024-01070-7. \[[DOI](https://doi.org/10.1007/s40031-024-01070-7)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J.%20Inst.%20Eng.%20India%20Ser.%20B&title=Gold%20Price%20Prediction%20Using%20Skewness%20and%20Kurtosis%20Based%20Generalized%20Auto-Regressive%20Conditional%20Heteroskedasticity%20Approach%20with%20Long%20Short%20Term%20Memory%20Network&author=S.%20Nallamothu&author=K.%20Rajyalakshmi&author=P.%20Arumugam&volume=105&publication_year=2024&pages=1715-1727&doi=10.1007/s40031-024-01070-7&)\]
-   25.Guo Y., Li C., Wang X., Duan Y. Gold Price Prediction Using Two-Layer Decomposition and XGboost Optimized by the Whale Optimization Algorithm. Comput. Econ. 2025;66:1157–1189. doi: 10.1007/s10614-024-10736-9. \[[DOI](https://doi.org/10.1007/s10614-024-10736-9)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Comput.%20Econ.&title=Gold%20Price%20Prediction%20Using%20Two-Layer%20Decomposition%20and%20XGboost%20Optimized%20by%20the%20Whale%20Optimization%20Algorithm&author=Y.%20Guo&author=C.%20Li&author=X.%20Wang&author=Y.%20Duan&volume=66&publication_year=2025&pages=1157-1189&doi=10.1007/s10614-024-10736-9&)\]
-   26.Bhavana P. Multi-Objective Optimization of Gold Price Forecasting Using the Pareto Alpha-Cut Technique. MethodsX. 2025;15:103534. doi: 10.1016/j.mex.2025.103534. \[[DOI](https://doi.org/10.1016/j.mex.2025.103534)\] \[[PMC free article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12361770/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/40837077/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=MethodsX&title=Multi-Objective%20Optimization%20of%20Gold%20Price%20Forecasting%20Using%20the%20Pareto%20Alpha-Cut%20Technique&author=P.%20Bhavana&volume=15&publication_year=2025&pages=103534&pmid=40837077&doi=10.1016/j.mex.2025.103534&)\]
-   27.Pillai G.S., Mary M.I. Hybrid Markov Weighted Fuzzy Kernel Time Series with Red Piranha Walrus Optimization for Gold Price Forecasting. Ain Shams Eng. J. 2025;16:103448. doi: 10.1016/j.asej.2025.103448. \[[DOI](https://doi.org/10.1016/j.asej.2025.103448)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Ain%20Shams%20Eng.%20J.&title=Hybrid%20Markov%20Weighted%20Fuzzy%20Kernel%20Time%20Series%20with%20Red%20Piranha%20Walrus%20Optimization%20for%20Gold%20Price%20Forecasting&author=G.S.%20Pillai&author=M.I.%20Mary&volume=16&publication_year=2025&pages=103448&doi=10.1016/j.asej.2025.103448&)\]
-   28.Wu H., Gao X.-Z., Li K., Heng J.-N. An Improved Brain-Motivated Network for Forecasting Day-Ahead Stock Prices of Electricity Companies. Knowl.-Based Syst. 2025;325:114040. doi: 10.1016/j.knosys.2025.114040. \[[DOI](https://doi.org/10.1016/j.knosys.2025.114040)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Knowl.-Based%20Syst.&title=An%20Improved%20Brain-Motivated%20Network%20for%20Forecasting%20Day-Ahead%20Stock%20Prices%20of%20Electricity%20Companies&author=H.%20Wu&author=X.-Z.%20Gao&author=K.%20Li&author=J.-N.%20Heng&volume=325&publication_year=2025&pages=114040&doi=10.1016/j.knosys.2025.114040&)\]
-   29.Chen N., Gao C., Yuan L., Heng J., Fan J. An Integrated Framework for Electricity Price Analysis and Forecasting Based on DROI Framework: Application to Spanish Power Markets. Sustainability. 2025;17:11210. doi: 10.3390/su172411210. \[[DOI](https://doi.org/10.3390/su172411210)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sustainability&title=An%20Integrated%20Framework%20for%20Electricity%20Price%20Analysis%20and%20Forecasting%20Based%20on%20DROI%20Framework:%20Application%20to%20Spanish%20Power%20Markets&author=N.%20Chen&author=C.%20Gao&author=L.%20Yuan&author=J.%20Heng&author=J.%20Fan&volume=17&publication_year=2025&pages=11210&doi=10.3390/su172411210&)\]
-   30.Che J., Xia W., Xu Y., Hu K. Multivariate Wind Speed Forecasting with Genetic Algorithm-Based Feature Selection and Oppositional Learning Sparrow Search. Inf. Sci. 2025;695:121736. doi: 10.1016/j.ins.2024.121736. \[[DOI](https://doi.org/10.1016/j.ins.2024.121736)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Inf.%20Sci.&title=Multivariate%20Wind%20Speed%20Forecasting%20with%20Genetic%20Algorithm-Based%20Feature%20Selection%20and%20Oppositional%20Learning%20Sparrow%20Search&author=J.%20Che&author=W.%20Xia&author=Y.%20Xu&author=K.%20Hu&volume=695&publication_year=2025&pages=121736&doi=10.1016/j.ins.2024.121736&)\]
-   31.Sun S., Wei Y., Li J. A Study on Exchange Rate Forecasting Based on Sentiment Mining of Online Foreign Exchange News. J. Econom. 2022;2:441–464. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J.%20Econom.&title=A%20Study%20on%20Exchange%20Rate%20Forecasting%20Based%20on%20Sentiment%20Mining%20of%20Online%20Foreign%20Exchange%20News&author=S.%20Sun&author=Y.%20Wei&author=J.%20Li&volume=2&publication_year=2022&pages=441-464&)\]
-   32.Tsinghua Finance Vocabulary Database. \[(accessed on 26 September 2025)\]. Available online: [https://www.heywhale.com/mw/dataset/611a163b911b3300174a19f2](https://www.heywhale.com/mw/dataset/611a163b911b3300174a19f2).
-   33.Wu H., Chen W., Zhang S., Tang L., Liu A., Deng S. A Short-Term Load Forecasting Method Based on QRLSTM Considering Multiple Factors Analysis. J. Phys. Conf. Ser. 2024;2876:012028. doi: 10.1088/1742-6596/2876/1/012028. \[[DOI](https://doi.org/10.1088/1742-6596/2876/1/012028)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J.%20Phys.%20Conf.%20Ser.&title=A%20Short-Term%20Load%20Forecasting%20Method%20Based%20on%20QRLSTM%20Considering%20Multiple%20Factors%20Analysis&author=H.%20Wu&author=W.%20Chen&author=S.%20Zhang&author=L.%20Tang&author=A.%20Liu&volume=2876&publication_year=2024&pages=012028&doi=10.1088/1742-6596/2876/1/012028&)\]
-   34.Yang M., Wang R., Zeng Z., Li P. Improved Prediction of Global Gold Prices: An Innovative Hurst-Reconfiguration-Based Machine Learning Approach. Resour. Policy. 2024;88:104430. doi: 10.1016/j.resourpol.2023.104430. \[[DOI](https://doi.org/10.1016/j.resourpol.2023.104430)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Resour.%20Policy&title=Improved%20Prediction%20of%20Global%20Gold%20Prices:%20An%20Innovative%20Hurst-Reconfiguration-Based%20Machine%20Learning%20Approach&author=M.%20Yang&author=R.%20Wang&author=Z.%20Zeng&author=P.%20Li&volume=88&publication_year=2024&pages=104430&doi=10.1016/j.resourpol.2023.104430&)\]
-   35.Wu H., Shao H., Gao X.-Z., Yan M., Heng J., Li Z. Brain-Inspired Network with Distinct Brain Mechanisms for Short-Term Load Forecasting. IEEE Internet Things J. 2026;13:7167–7178. doi: 10.1109/JIOT.2025.3637827. \[[DOI](https://doi.org/10.1109/JIOT.2025.3637827)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=IEEE%20Internet%20Things%20J.&title=Brain-Inspired%20Network%20with%20Distinct%20Brain%20Mechanisms%20for%20Short-Term%20Load%20Forecasting&author=H.%20Wu&author=H.%20Shao&author=X.-Z.%20Gao&author=M.%20Yan&author=J.%20Heng&volume=13&publication_year=2026&pages=7167-7178&doi=10.1109/JIOT.2025.3637827&)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Data Availability Statement

This paper provides gold price data from the WGC, LBMA, and SGC markets used in the model.
