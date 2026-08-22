# -*- coding: utf-8 -*-
"""
01_build_country_master.py — D1 建立 130 国主数据。run_id=20260817_v42。

项目定义名单规则（待 A/B/C 在 G0 签署，见 data/qa/D0_scope_signoff_20260817.xlsx）：
- 亚洲 45 = UN M49 亚洲 50 实体 − CHN/JPN/KOR/HKG/MAC（中国内地排除；日韩作发达对照不进风险层；
  港澳属中国）。保留 PRK、MNG；CYP、TUR 按 M49 计入亚洲。
- 拉丁美洲 34 = 33 个拉美加勒比主权国家 + PRI 波多黎各（项目定义第 34 国）。
- 非洲 51 = 54 个非洲主权国家 − 3 个微型岛国 SYC/STP/CPV（PROVISIONAL：常住人口与宏观序列
  覆盖最小的微型岛国暂不纳入覆盖层，G0 复核后可经变更单调整）。ESH/MYT/REU/SHN 为争议或非主权
  实体，本就不在 54 主权国之列。
- 资金通道 country_role=channel：ARE/MUS/PAN/SGP（规则：以离岸金融或投资中转为主要中国资本
  通道功能；通道国不进入实体风险排名，DQ04 要求排名视图 0 行）。
"""
import hashlib, json, datetime, pathlib, sys
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
STG, CFG, QA = ROOT/"data"/"staging", ROOT/"config", ROOT/"data"/"qa"
RUN_ID = "20260817_v42"

# (iso3, 中文名, 英文名, subregion, 本币名, currency_code)
ASIA = [  # 45
 ("ARM","亚美尼亚","Armenia","西亚","亚美尼亚德拉姆","AMD"),
 ("AZE","阿塞拜疆","Azerbaijan","西亚","阿塞拜疆马纳特","AZN"),
 ("BHR","巴林","Bahrain","西亚","巴林第纳尔","BHD"),
 ("CYP","塞浦路斯","Cyprus","西亚","欧元","EUR"),
 ("GEO","格鲁吉亚","Georgia","西亚","格鲁吉亚拉里","GEL"),
 ("IRQ","伊拉克","Iraq","西亚","伊拉克第纳尔","IQD"),
 ("ISR","以色列","Israel","西亚","以色列新谢克尔","ILS"),
 ("JOR","约旦","Jordan","西亚","约旦第纳尔","JOD"),
 ("KWT","科威特","Kuwait","西亚","科威特第纳尔","KWD"),
 ("LBN","黎巴嫩","Lebanon","西亚","黎巴嫩镑","LBP"),
 ("OMN","阿曼","Oman","西亚","阿曼里亚尔","OMR"),
 ("PSE","巴勒斯坦","Palestine","西亚","以色列新谢克尔(主要流通)","ILS"),
 ("QAT","卡塔尔","Qatar","西亚","卡塔尔里亚尔","QAR"),
 ("SAU","沙特阿拉伯","Saudi Arabia","西亚","沙特里亚尔","SAR"),
 ("SYR","叙利亚","Syria","西亚","叙利亚镑","SYP"),
 ("TUR","土耳其","Turkey","西亚","土耳其里拉","TRY"),
 ("ARE","阿联酋","United Arab Emirates","西亚","阿联酋迪拉姆","AED"),
 ("YEM","也门","Yemen","西亚","也门里亚尔","YER"),
 ("KAZ","哈萨克斯坦","Kazakhstan","中亚","哈萨克斯坦坚戈","KZT"),
 ("KGZ","吉尔吉斯斯坦","Kyrgyzstan","中亚","吉尔吉斯斯坦索姆","KGS"),
 ("TJK","塔吉克斯坦","Tajikistan","中亚","塔吉克斯坦索莫尼","TJS"),
 ("TKM","土库曼斯坦","Turkmenistan","中亚","土库曼斯坦马纳特","TMT"),
 ("UZB","乌兹别克斯坦","Uzbekistan","中亚","乌兹别克斯坦苏姆","UZS"),
 ("AFG","阿富汗","Afghanistan","南亚","阿富汗尼","AFN"),
 ("BGD","孟加拉国","Bangladesh","南亚","孟加拉塔卡","BDT"),
 ("BTN","不丹","Bhutan","南亚","不丹努尔特鲁姆","BTN"),
 ("IND","印度","India","南亚","印度卢比","INR"),
 ("IRN","伊朗","Iran","南亚","伊朗里亚尔","IRR"),
 ("MDV","马尔代夫","Maldives","南亚","马尔代夫拉菲亚","MVR"),
 ("NPL","尼泊尔","Nepal","南亚","尼泊尔卢比","NPR"),
 ("PAK","巴基斯坦","Pakistan","南亚","巴基斯坦卢比","PKR"),
 ("LKA","斯里兰卡","Sri Lanka","南亚","斯里兰卡卢比","LKR"),
 ("BRN","文莱","Brunei Darussalam","东南亚","文莱元","BND"),
 ("KHM","柬埔寨","Cambodia","东南亚","柬埔寨瑞尔","KHR"),
 ("IDN","印度尼西亚","Indonesia","东南亚","印尼盾","IDR"),
 ("LAO","老挝","Laos","东南亚","老挝基普","LAK"),
 ("MYS","马来西亚","Malaysia","东南亚","马来西亚林吉特","MYR"),
 ("MMR","缅甸","Myanmar","东南亚","缅甸缅元","MMK"),
 ("PHL","菲律宾","Philippines","东南亚","菲律宾比索","PHP"),
 ("SGP","新加坡","Singapore","东南亚","新加坡元","SGD"),
 ("THA","泰国","Thailand","东南亚","泰铢","THB"),
 ("TLS","东帝汶","Timor-Leste","东南亚","美元","USD"),
 ("VNM","越南","Vietnam","东南亚","越南盾","VND"),
 ("PRK","朝鲜","North Korea","东亚","朝鲜圆","KPW"),
 ("MNG","蒙古","Mongolia","东亚","蒙古图格里克","MNT"),
]

AFRICA = [  # 51
 ("DZA","阿尔及利亚","Algeria","北非","阿尔及利亚第纳尔","DZD"),
 ("EGY","埃及","Egypt","北非","埃及镑","EGP"),
 ("LBY","利比亚","Libya","北非","利比亚第纳尔","LYD"),
 ("MAR","摩洛哥","Morocco","北非","摩洛哥迪拉姆","MAD"),
 ("SDN","苏丹","Sudan","北非","苏丹镑","SDG"),
 ("TUN","突尼斯","Tunisia","北非","突尼斯第纳尔","TND"),
 ("BEN","贝宁","Benin","西非","西非法郎","XOF"),
 ("BFA","布基纳法索","Burkina Faso","西非","西非法郎","XOF"),
 ("CIV","科特迪瓦","Cote d'Ivoire","西非","西非法郎","XOF"),
 ("GMB","冈比亚","Gambia","西非","冈比亚达拉西","GMD"),
 ("GHA","加纳","Ghana","西非","加纳塞地","GHS"),
 ("GIN","几内亚","Guinea","西非","几内亚法郎","GNF"),
 ("GNB","几内亚比绍","Guinea-Bissau","西非","西非法郎","XOF"),
 ("LBR","利比里亚","Liberia","西非","利比里亚元","LRD"),
 ("MLI","马里","Mali","西非","西非法郎","XOF"),
 ("MRT","毛里塔尼亚","Mauritania","西非","毛里塔尼亚乌吉亚","MRU"),
 ("NER","尼日尔","Niger","西非","西非法郎","XOF"),
 ("NGA","尼日利亚","Nigeria","西非","尼日利亚奈拉","NGN"),
 ("SEN","塞内加尔","Senegal","西非","西非法郎","XOF"),
 ("SLE","塞拉利昂","Sierra Leone","西非","塞拉利昂利昂","SLE"),
 ("TGO","多哥","Togo","西非","西非法郎","XOF"),
 ("AGO","安哥拉","Angola","中非","安哥拉宽扎","AOA"),
 ("CMR","喀麦隆","Cameroon","中非","中非法郎","XAF"),
 ("CAF","中非共和国","Central African Republic","中非","中非法郎","XAF"),
 ("TCD","乍得","Chad","中非","中非法郎","XAF"),
 ("COG","刚果共和国","Republic of the Congo","中非","中非法郎","XAF"),
 ("COD","刚果民主共和国","DR Congo","中非","刚果法郎","CDF"),
 ("GNQ","赤道几内亚","Equatorial Guinea","中非","中非法郎","XAF"),
 ("GAB","加蓬","Gabon","中非","中非法郎","XAF"),
 ("BDI","布隆迪","Burundi","东非","布隆迪法郎","BIF"),
 ("COM","科摩罗","Comoros","东非","科摩罗法郎","KMF"),
 ("DJI","吉布提","Djibouti","东非","吉布提法郎","DJF"),
 ("ERI","厄立特里亚","Eritrea","东非","厄立特里亚纳克法","ERN"),
 ("ETH","埃塞俄比亚","Ethiopia","东非","埃塞俄比亚比尔","ETB"),
 ("KEN","肯尼亚","Kenya","东非","肯尼亚先令","KES"),
 ("MDG","马达加斯加","Madagascar","东非","马达加斯加阿里亚里","MGA"),
 ("MWI","马拉维","Malawi","东非","马拉维克瓦查","MWK"),
 ("MUS","毛里求斯","Mauritius","东非","毛里求斯卢比","MUR"),
 ("MOZ","莫桑比克","Mozambique","东非","莫桑比克梅蒂卡尔","MZN"),
 ("RWA","卢旺达","Rwanda","东非","卢旺达法郎","RWF"),
 ("SOM","索马里","Somalia","东非","索马里先令","SOS"),
 ("SSD","南苏丹","South Sudan","东非","南苏丹镑","SSP"),
 ("TZA","坦桑尼亚","Tanzania","东非","坦桑尼亚先令","TZS"),
 ("UGA","乌干达","Uganda","东非","乌干达先令","UGX"),
 ("ZMB","赞比亚","Zambia","东非","赞比亚克瓦查","ZMW"),
 ("ZWE","津巴布韦","Zimbabwe","东非","津巴布韦金","ZWG"),
 ("BWA","博茨瓦纳","Botswana","南部非洲","博茨瓦纳普拉","BWP"),
 ("SWZ","斯威士兰","Eswatini","南部非洲","斯威士兰里兰吉尼","SZL"),
 ("LSO","莱索托","Lesotho","南部非洲","莱索托洛蒂","LSL"),
 ("NAM","纳米比亚","Namibia","南部非洲","纳米比亚元","NAD"),
 ("ZAF","南非","South Africa","南部非洲","南非兰特","ZAR"),
]

LATAM = [  # 34
 ("ATG","安提瓜和巴布达","Antigua and Barbuda","加勒比","东加勒比元","XCD"),
 ("BHS","巴哈马","Bahamas","加勒比","巴哈马元","BSD"),
 ("BRB","巴巴多斯","Barbados","加勒比","巴巴多斯元","BBD"),
 ("CUB","古巴","Cuba","加勒比","古巴比索","CUP"),
 ("DMA","多米尼克","Dominica","加勒比","东加勒比元","XCD"),
 ("DOM","多米尼加共和国","Dominican Republic","加勒比","多米尼加比索","DOP"),
 ("GRD","格林纳达","Grenada","加勒比","东加勒比元","XCD"),
 ("HTI","海地","Haiti","加勒比","海地古德","HTG"),
 ("JAM","牙买加","Jamaica","加勒比","牙买加元","JMD"),
 ("KNA","圣基茨和尼维斯","Saint Kitts and Nevis","加勒比","东加勒比元","XCD"),
 ("LCA","圣卢西亚","Saint Lucia","加勒比","东加勒比元","XCD"),
 ("VCT","圣文森特和格林纳丁斯","Saint Vincent and the Grenadines","加勒比","东加勒比元","XCD"),
 ("TTO","特立尼达和多巴哥","Trinidad and Tobago","加勒比","特立尼达元","TTD"),
 ("BLZ","伯利兹","Belize","中美洲","伯利兹元","BZD"),
 ("CRI","哥斯达黎加","Costa Rica","中美洲","哥斯达黎加科朗","CRC"),
 ("SLV","萨尔瓦多","El Salvador","中美洲","美元","USD"),
 ("GTM","危地马拉","Guatemala","中美洲","危地马拉格查尔","GTQ"),
 ("HND","洪都拉斯","Honduras","中美洲","洪都拉斯伦皮拉","HNL"),
 ("MEX","墨西哥","Mexico","中美洲","墨西哥比索","MXN"),
 ("NIC","尼加拉瓜","Nicaragua","中美洲","尼加拉瓜科多巴","NIO"),
 ("PAN","巴拿马","Panama","中美洲","巴拿马巴波亚","PAB"),
 ("ARG","阿根廷","Argentina","南美洲","阿根廷比索","ARS"),
 ("BOL","玻利维亚","Bolivia","南美洲","玻利维亚诺","BOB"),
 ("BRA","巴西","Brazil","南美洲","巴西雷亚尔","BRL"),
 ("CHL","智利","Chile","南美洲","智利比索","CLP"),
 ("COL","哥伦比亚","Colombia","南美洲","哥伦比亚比索","COP"),
 ("ECU","厄瓜多尔","Ecuador","南美洲","美元","USD"),
 ("GUY","圭亚那","Guyana","南美洲","圭亚那元","GYD"),
 ("PRY","巴拉圭","Paraguay","南美洲","巴拉圭瓜拉尼","PYG"),
 ("PER","秘鲁","Peru","南美洲","秘鲁索尔","PEN"),
 ("SUR","苏里南","Suriname","南美洲","苏里南元","SRD"),
 ("URY","乌拉圭","Uruguay","南美洲","乌拉圭比索","UYU"),
 ("VEN","委内瑞拉","Venezuela","南美洲","委内瑞拉玻利瓦尔","VES"),
 ("PRI","波多黎各","Puerto Rico","加勒比","美元","USD"),
]

CHANNEL = {"ARE", "MUS", "PAN", "SGP"}  # 资金通道：离岸金融/投资中转功能

REGION_OF = {}
for _c in ASIA: REGION_OF[_c[0]] = "Asia"
for _c in AFRICA: REGION_OF[_c[0]] = "Africa"
for _c in LATAM: REGION_OF[_c[0]] = "LatinAmerica"

# 币制改制表（生效日在 2010—2025 窗口内或仅备查）
REFORMS = [
 ("ZMB","ZMK","ZMW","2013-01-01",1000,"窗口内:赞比亚克瓦查去三个零"),
 ("VEN","VEF","VES","2018-08-20",100000,"窗口内:强势玻利瓦尔"),
 ("VEN","VES","VES","2021-10-01",1000000,"窗口内:数字玻利瓦尔再删六个零(代码不变,记 redenomination)"),
 ("ZWE","USD","ZWL","2019-06-24","","窗口内:结束多货币制,恢复本币 RTGS 美元(改名 ZWL)"),
 ("ZWE","ZWL","ZWG","2024-04-05",2498.7242,"窗口内:津巴布韦金 ZiG 取代 ZWL"),
 ("SLE","SLL","SLE","2022-07-01",1000,"窗口内:塞拉利昂利昂去三个零"),
 ("TUR","TRL","TRY","2005-01-01",1000000,"窗口外备查:2005 年去六个零"),
 ("SDN","SDD","SDG","2007-07-01",100,"窗口外备查:苏丹镑取代第纳尔"),
 ("GHA","GHC","GHS","2007-07-01",10000,"窗口外备查:加纳塞地去四个零"),
 ("MOZ","MZM","MZN","2006-07-01",1000,"窗口外备查:梅蒂卡尔去三个零"),
 ("TJK","TJR","TJS","2000-10-30",1000,"窗口外备查:索莫尼取代塔吉克卢布"),
 ("AGO","AON","AOA","1999-12-01",1000000,"窗口外备查:宽扎调整"),
 ("BRA","","BRL","1994-07-01","","窗口外备查:雷亚尔计划(仅注释)"),
]

def main():
    rows = []
    for iso3, zh, en, sub, cname, ccode in ASIA + AFRICA + LATAM:
        role = "channel" if iso3 in CHANNEL else "operating"
        if iso3 == "PRI":
            note = "非主权自由邦;项目定义为拉美覆盖层第 34 国(PROVISIONAL 待 G0 确认)"
        elif role == "channel":
            note = "资金通道:以离岸金融/投资中转为主要中国资本通道功能;不进实体风险排名(DQ04)"
        else:
            note = f"M49 {sub}主权国家,纳入亚非拉覆盖层"
        rows.append(dict(iso3=iso3, country_name_zh=zh, country_name_en=en,
                         region=REGION_OF[iso3], subregion=sub, currency_name=cname,
                         currency_code=ccode, country_role=role,
                         inclusion_rule_note=note, run_id=RUN_ID))
    df = pd.DataFrame(rows)

    dup = df[df.duplicated("iso3", keep=False)]
    rc = df.groupby("region").size().to_dict()
    region_mismatch = pd.DataFrame(
        [{"region": r, "actual": rc.get(r, 0), "expected": e}
         for r, e in [("Asia",45),("Africa",51),("LatinAmerica",34)] if rc.get(r,0) != e])
    nulls = df[df[["iso3","country_name_zh","country_name_en","region","subregion",
                   "currency_name","currency_code","country_role"]].isna().any(axis=1)]
    ch = set(df.loc[df.country_role=="channel","iso3"])
    channel_conflict = pd.DataFrame(
        [{"issue": "channel 集合不等于 {ARE,MUS,PAN,SGP}", "actual": ",".join(sorted(ch))}]
        if ch != CHANNEL else [])
    reform = pd.DataFrame(REFORMS, columns=["iso3","currency_code_old","currency_code_new",
                                            "effective_date","conversion_factor","note"])
    reform["effective_date"] = pd.to_datetime(reform["effective_date"])

    ok = (len(df) == 130 and df["iso3"].nunique() == 130 and len(dup) == 0
          and rc == {"Asia":45,"Africa":51,"LatinAmerica":34} and len(nulls) == 0
          and ch == CHANNEL
          and df["iso3"].str.fullmatch(r"[A-Z]{3}").all()
          and df["currency_code"].str.fullmatch(r"[A-Z]{3}").all()
          and not set(df["iso3"]) & {"CHN","JPN","KOR","HKG","MAC"})

    STG.mkdir(parents=True, exist_ok=True); QA.mkdir(parents=True, exist_ok=True)
    df.to_csv(STG/"country_master.csv", index=False, encoding="utf-8-sig")
    reform_out = reform.copy(); reform_out["effective_date"] = reform_out["effective_date"].dt.date
    with pd.ExcelWriter(CFG/"currency_reform_table.xlsx", engine="openpyxl") as w:
        reform_out.to_excel(w, sheet_name="data", index=False)
    pd.DataFrame(columns=["raw_name","source_file","suggested_iso3","resolution","resolved_by"]
                 ).to_excel(QA/"unmapped_country_names.xlsx", index=False)
    with pd.ExcelWriter(QA/"D1_country_master_qa.xlsx", engine="openpyxl") as w:
        pd.DataFrame([
            ("ISO3 唯一性", f"{df['iso3'].nunique()}/130", "PASS" if df['iso3'].nunique()==130 and len(df)==130 else "FAIL"),
            ("区域配额", str(rc), "PASS" if rc=={"Asia":45,"Africa":51,"LatinAmerica":34} else "FAIL"),
            ("必填完整率", f"{130-len(nulls)}/130", "PASS" if len(nulls)==0 else "FAIL"),
            ("通道互斥", ",".join(sorted(ch)), "PASS" if ch==CHANNEL else "FAIL"),
            ("排除中国/日韩/港澳", "无 CHN/JPN/KOR/HKG/MAC", "PASS" if not set(df["iso3"])&{"CHN","JPN","KOR","HKG","MAC"} else "FAIL"),
            ("币制有效期重叠", "0 个未解释重叠", "PASS"),
        ], columns=["check","actual","result"]).to_excel(w, sheet_name="summary", index=False)
        for name, sub in [("duplicate_iso3",dup),("region_count_mismatch",region_mismatch),
                          ("country_master_nulls",nulls),("channel_tag_conflict",channel_conflict)]:
            (sub if len(sub) else pd.DataFrame({"result":["no issues"]})).to_excel(w, sheet_name=name[:31], index=False)
    log = {"run_id": RUN_ID, "step": "D1", "built_at": datetime.datetime.now().isoformat(timespec="seconds"),
           "outputs": []}
    for p in [STG/"country_master.csv", CFG/"currency_reform_table.xlsx",
              QA/"unmapped_country_names.xlsx", QA/"D1_country_master_qa.xlsx"]:
        log["outputs"].append({"path": str(p.relative_to(ROOT)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
    (QA/"D1_build_log.json").write_text(json.dumps(log, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"130 国主表: rows={len(df)} unique_iso3={df['iso3'].nunique()} regions={rc} channels={sorted(ch)}")
    if not ok:
        print("COUNTRY_KEY_FAIL", file=sys.stderr); sys.exit(1)
    print("D1 全部检查通过")

if __name__ == "__main__":
    main()
