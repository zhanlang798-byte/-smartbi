# -*- coding: utf-8 -*-
"""
KB md → 知识配置模板CSV 转换器（B04 · KB 导入用）
用法：python3 kb_md_to_template_csv.py
输出：KB_TEMPLATE_IMPORT/ 下每文件一个 csv + ALL_IN_IMPORT_ORDER.csv（按推荐导入顺序合并）
列口径（已按平台探针实测修正）：
  标题=文件主题-小节名｜知识=小节正文｜标签=类别名+V50｜字段召回=口径类"是"其余"否"
  应用范围=固定模型名｜类型=PLAIN（平台枚举：PLAIN/CODE/DYNAMIC）
  ⚠️ 数据行第7列=版本、第8列=状态ENABLE：平台模板表头写"状态/版本"，但解析数据按"版本7/状态8"读（探针实证 2026-08-31）
  使用时机=留空｜描述=清单摘要
"""
import csv, re
from pathlib import Path

BASE = Path("/Users/tanshuo888/Code/pre-code/Smartbi/-smartbi/V5.0_双人执行工作区/B_AI交付")
SRC = BASE / "03_AIChat配置" / "KB_UPLOAD_READY"
OUT = BASE / "05_工具脚本" / "kb_csv_out"

# 文件元数据（与 KB_FILE_MANIFEST_V50.xlsx 当前版本对齐）
META = {
    "01_模型与字段绑定说明_V50.md":   ("V50-KB01-LOCAL_READY-r1", "模型交接与字段字典",   "固定模型、22张表、最小字段域、版本冲突和已知缺口", False),
    "02_指标公式空值日期口径_V50.md": ("V50-KB02-LOCAL_FINAL-r1", "指标公式空值日期口径", "汇率/CPI/ODI/储备/组合公式；缺失不补0；独立截止期", True),
    "03_六页页面说明_V50.md":        ("V50-KB03-LOCAL_READY-r2", "六页页面说明",        "DB01—DB06问题、组件、筛选、联动、当前证据边界", False),
    "04_source_id追溯规则_V50.md":   ("V50-KB04-LOCAL_READY-r1", "source_id追溯规则",   "source_id字段、完整率、正式使用状态、缺失与冲突处理", False),
    "05_企业历史政策模拟边界_V50.md": ("V50-KB05-LOCAL_FINAL-r1", "企业历史政策模拟边界", "企业不越级；历史待核；政策转人工；模拟/代理明示", False),
    "06_25问基准判分规范_V50.md":    ("V50-KB06-LOCAL_FINAL-r1", "25问基准判分规范",    "数值/集合/来源/合规/拒答判分；修一题全25回归", False),
    "07_合规声明与拒答模板_V50.md":   ("V50-KB07-LOCAL_FINAL-r1", "合规声明与拒答模板",  "第一句拒答、缺口、事实边界、合法补证、转人工", False),
}
# KB_FILE_MANIFEST 推荐导入顺序
IMPORT_ORDER = ["07_合规声明与拒答模板_V50.md", "05_企业历史政策模拟边界_V50.md",
                "02_指标公式空值日期口径_V50.md", "04_source_id追溯规则_V50.md",
                "01_模型与字段绑定说明_V50.md", "03_六页页面说明_V50.md", "06_25问基准判分规范_V50.md"]

HEADER = ["标题", "知识", "标签", "字段召回", "应用范围", "类型", "状态", "版本", "使用时机", "描述"]
MODEL = "MDL_XH202612_V50_COUNTRY_RESERVE"


def safe(s):
    """平台csv解析器不支持引号多行字段（探针实证）：换行压空格、ASCII分隔符转中文"""
    s = re.sub(r"[\r\n]+", " ", str(s))   # 换行→空格
    s = s.replace(",", "，")               # 英文逗号→中文逗号
    s = s.replace('"', "“")               # 英文引号→中文引号
    s = s.replace(";", "；")               # 分号→中文分号
    s = s.replace("｜", "，").replace("|", "，")  # 竖线→中文逗号
    return re.sub(r" {2,}", " ", s).strip()


def split_sections(text):
    """按二级标题 ## 拆条；返回 [(小节标题, 正文)]"""
    lines = text.splitlines()
    doc_title = next((l.lstrip("# ").strip() for l in lines if l.startswith("# ")), "")
    parts, cur_t, cur = [], None, []
    for l in lines:
        if l.startswith("## "):
            if cur_t is not None:
                parts.append((cur_t, "\n".join(cur).strip()))
            cur_t, cur = l[3:].strip(), []
        elif cur_t is not None:
            cur.append(l)
    if cur_t is not None:
        parts.append((cur_t, "\n".join(cur).strip()))
    return doc_title, [(t, b) for t, b in parts if b]


def short_theme(fname):
    return re.sub(r"^\d+_|_V50\.md$", "", fname)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    all_rows = []
    summary = []
    for fname in IMPORT_ORDER:
        ver, cat, desc, field_recall = META[fname]
        text = (SRC / fname).read_text(encoding="utf-8")
        doc_title, sections = split_sections(text)
        rows = []
        for sec_title, body in sections:
            rows.append([
                safe(f"{short_theme(fname)}-{sec_title}"),     # 标题
                safe(body),                                    # 知识（单行化）
                safe(f"{cat};V50"),                            # 标签（分号已转中文）
                "是" if field_recall else "否",                 # 字段召回
                MODEL,                                         # 应用范围
                "PLAIN",                                       # 类型（平台枚举：PLAIN/CODE/DYNAMIC）
                "ENABLE",                                      # 第7列=状态（模板标准顺序，探针2实证通过）
                "V1",                                          # 第8列=版本（选择型字段，只认平台已存在版本；V1探针实证通过，V50/V50-KBxx均被拒）
                "",                                            # 使用时机（待平台口径）
                safe(f"KB版本:{ver}｜{desc}"),                 # 描述（完整KB版本号保留在此）
            ])
        out_csv = OUT / (fname.replace("_V50.md", "_模板导入.csv"))
        with open(out_csv, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f)
            w.writerow(HEADER)
            w.writerows(rows)
        all_rows.extend(rows)
        summary.append((fname, len(sections), out_csv.name))
        print(f"{fname}: {len(sections)} 条 -> {out_csv.name}")

    with open(OUT / "ALL_IN_IMPORT_ORDER.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        w.writerows(all_rows)
    print(f"\n合并文件：ALL_IN_IMPORT_ORDER.csv 共 {len(all_rows)} 条（顺序 07→05→02→04→01→03→06）")
    print("输出目录：", OUT)
    print("\n列口径待平台首条验证：字段召回/应用范围/类型/状态/使用时机 的合法取值以平台导入反馈为准。")


if __name__ == "__main__":
    main()
