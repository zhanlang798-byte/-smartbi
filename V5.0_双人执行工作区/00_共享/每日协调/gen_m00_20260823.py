# -*- coding: utf-8 -*-
# M00 2026-08-23 早会输出生成：M00_MORNING / DAILY_OBJECT_LOCK / DAILY_GATE_STATUS
# 基于真实读取：B_REVIEW_A00_20260822.md、M00_EVENING_20260822.txt、DAILY_GATE_STATUS_20260822.xlsx、
# 02_G0-G6门槛与签收清单.md；问题单/模型交接目录实测不存在。
import os, zipfile
from xml.sax.saxutils import escape

DIR = r"C:\Users\33625\Desktop\数据创新平台-张奥\V5.0_双人执行工作区\00_共享\每日协调"

def write_xlsx(path, sheet_name, rows):
    def col(n):
        s=""
        while n>0:
            n,r=divmod(n-1,26); s=chr(65+r)+s
        return s
    srs=[]
    for ri,row in enumerate(rows,1):
        cells=[f'<c r="{col(ci)}{ri}" t="inlineStr"><is><t xml:space="preserve">{escape(str(v))}</t></is></c>' for ci,v in enumerate(row,1)]
        srs.append(f'<row r="{ri}">{"".join(cells)}</row>')
    sheet=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
     +"".join(srs)+'</sheetData></worksheet>')
    wb=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
     'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
     f'<sheets><sheet name="{escape(sheet_name)}" sheetId="1" r:id="rId1"/></sheets></workbook>')
    rels=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
     '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    wb_rels=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
     '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
    ct=('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
     '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
     '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
     '<Default Extension="xml" ContentType="application/xml"/>'
     '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
     '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
    with zipfile.ZipFile(path,"w",zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml",ct); z.writestr("_rels/.rels",rels)
        z.writestr("xl/workbook.xml",wb); z.writestr("xl/_rels/workbook.xml.rels",wb_rels)
        z.writestr("xl/worksheets/sheet1.xml",sheet)

# ---------- 1) M00_MORNING_20260823.txt ----------
morning = """M00 每日会·早会记录 2026-08-23
==================================================
会议时间：2026-08-23 10:41 +0800（实际执行，晚于09:00基准，已记录）
协调方式：AI总控读取真实文件生成；签收由A/B人工完成
最终截止：2026-08-31（剩8天）

--------------------------------------------------
步骤1：读取昨日日报、当前门槛、问题单 → 正常
--------------------------------------------------
读数（均为真实文件，非口头）：
1. M00_EVENING_20260822.txt（B写）：A00=PASS；B交叉复核=PASS；G0升级PASS；硬失败0；阻塞0。
   注意：签收行仍为「A ______（待补签）」→ 今日待办T0。
2. B_REVIEW_A00_20260822.md：B独立重算18表SHA-256全匹配、行列全对、主键0/0、合计313,593行。
3. DAILY_GATE_STATUS_20260822.xlsx：G0=PASS（B已签/A待补签）；G1=OPEN（截至今日18:00）。
4. 问题单目录：不存在 → 未决问题单=0（读数，非假设）。
5. 模型交接目录：不存在 → 模型尚未建立，符合当前阶段（G1前）。

--------------------------------------------------
步骤2：今日任务分级
--------------------------------------------------
【今日必须完成（关键路径，G1截至18:00）】
T1（A）A01 生成三张MVP辅助表：MVP_country_latest 40行 / MVP_company_data_status 20行 / MVP_cycle_state 660行。
T2（A）A02 四表P0小样门：P0_dim_country、P0_dim_date、P0_country_monthly_risk、P0_global_cycle_month
   上传+类型+关系+XML路径验证。Smartbi上传/点击为A人工操作，AI只出脚本与核对。
【可并行（离线，不占Smartbi）】
T3（B）25问基准全量计算：只读镜像读取，产出填入 02_25问基准框架_V50.xlsx。
【依赖A冻结（今日不启动）】
A03全量导入待G1通过；B的页面搭建待G2模型冻结。
【可离线做】
T3即离线任务；另B可预写AI知识库条目草稿（不入库，仅草稿）。

--------------------------------------------------
步骤3：对象所有权确认 → 无冲突
--------------------------------------------------
A写：共享模型、DB01/02/04、XML、02_MVP辅助表、03_Smartbi证据/A01-A07。
B写：DB03/05/06、AI知识库、材料、02_25问基准框架_V50.xlsx。
共同写：00_共享/每日协调（含本记录）、00_共享/问题单。
今日A与B的操作对象无交集；问题单与模型交接目录由首位需要者创建，不视为缺失。

--------------------------------------------------
步骤4：逐项开始/停止条件、证据与18:00读数
--------------------------------------------------
T0（A，5分钟）补签8/22晚报与门槛表A签收列。
  开始条件：无。停止条件：两处「待补签」均已签收。
  证据：M00_EVENING_20260822.txt与DAILY_GATE_STATUS_20260822.xlsx更新后时间戳。
T1（A）开始条件：G0=PASS（已满足）、镜像21表在位、yaml可读（已实测）。
  停止条件：三表行数=40/20/660、主键重复0空0、含view_run_id/view_version=V5.0/generated_at；缺一即FAIL不得进T2。
  证据：03_Smartbi证据/A01/ 下脚本+逐表读数+QA导出。
  18:00读数：三表实际行数、QA结果。
T2（A）开始条件：T1 PASS。停止条件：四表P0上传成功、导入前后行数一致、类型正确、
  建关系后事实行数不膨胀、XML可导出并记录哈希路径。
  证据：03_Smartbi证据/A02/ 截图+导出行数+XML哈希。
  18:00读数：四表导入行数与源行数比对、XML路径与哈希。
T3（B）开始条件：镜像只读访问（已具备）。停止条件：25问逐问有计算值或明示缺失；
  缺失保持空不填0。证据：02_25问基准框架_V50.xlsx + 计算说明。
  18:00读数：已完成问数/25。

--------------------------------------------------
步骤5-7（18:00晚会执行，预告）
--------------------------------------------------
步骤5：逐项核对T0-T3实际证据，口头说明无效。
步骤6：更新G0-G6状态表（仅按证据升级G1）、硬失败数、对象变更。
步骤7：按P0真实性与必交材料优先级生成次日（8/24）清单。

--------------------------------------------------
今日风险提示
--------------------------------------------------
R1：G1截至今日18:00，T1+T2全在A一人身上，为关键路径；T2含Smartbi人工上传，预留排队时间。
R2：A未补签昨日晚报（T0），先签再开工，保证G0证据链闭环。
R3：代理端口变动会影响晚间同步推送；推送前先确认代理在线。

早会状态：PASS（限早会部分；全天判定待18:00晚会证据核对）
A签收：______　B签收：______
"""
p1 = os.path.join(DIR, "M00_MORNING_20260823.txt")
open(p1, "w", encoding="utf-8").write(morning)
print("written:", p1)

# ---------- 2) DAILY_OBJECT_LOCK_20260823.xlsx ----------
lock_rows = [
 ["对象","所有者","今日操作者","今日动作","状态","备注"],
 ["01_输入只读镜像（21表+周期规则）","A","A读/B读","只读","冻结","G0已锁定，任何人不得写入"],
 ["02_MVP辅助表","A","A","新建3张辅助表(A01)","进行中","行数门槛40/20/660"],
 ["03_Smartbi证据/A01","A","A","写证据","进行中",""],
 ["03_Smartbi证据/A02","A","A","写证据(T2启动后)","待开始",""],
 ["Smartbi内P0四表","A","A","人工上传/建关系(A02)","待开始","T1 PASS前不得开始"],
 ["共享模型/DB01/DB02/DB04/XML","A","无","不动","锁定","G2冻结前仅A可写"],
 ["02_25问基准框架_V50.xlsx","B","B","填写25问基准值(T3)","进行中","缺失留空不填0"],
 ["DB03/DB05/DB06/AI知识库/材料","B","无","不动","锁定","G2后启用"],
 ["00_共享/每日协调","A+B共同","AI生成,AB签收","写今日M00记录","进行中","双方人工签收"],
 ["00_共享/问题单","A+B共同","无","无未决问题单","空闲","目录待首位需要者创建"],
 ["00_共享/模型交接","A","无","不动","空闲","G2时由A创建交接包"],
]
p2 = os.path.join(DIR, "DAILY_OBJECT_LOCK_20260823.xlsx")
write_xlsx(p2, "对象锁", lock_rows)
print("written:", p2)

# ---------- 3) DAILY_GATE_STATUS_20260823.xlsx ----------
gate_rows = [
 ["日期","门槛","通过条件","证据","状态","决定","B签收","A签收"],
 ["2026-08-22","G0 输入锁定","路径、18+3、只读、哈希、负责人","A00证据包+B独立复核记录","PASS","已升级(8/22晚报)","✅ 2026-08-22","待补签→T0"],
 ["2026-08-23","G1 数据P0","40/20/660；四表上传/类型/关系/XML路径PASS","待T1/T2证据","OPEN","今日18:00按证据判定","",""],
 ["2026-08-24","G2 模型冻结","313,593；主键0/0；关系指标交接签收","","未开始","","",""],
 ["2026-08-26","G3 六页初验","六页可开；每页≤4组件；筛选/来源/边界可用","","未开始","","",""],
 ["2026-08-28","G4 AIChat初验","25问全测；数值≥90%；关键误差≤1%；拒答全对","","未开始","","",""],
 ["2026-08-29","G5 恢复与材料","干净恢复；KPI一致；报告视频合规齐全","","未开始","","",""],
 ["2026-08-31","G6 最终放行","双人交叉复核；硬失败0；清单哈希截图齐全","","未开始","","",""],
]
p3 = os.path.join(DIR, "DAILY_GATE_STATUS_20260823.xlsx")
write_xlsx(p3, "门槛状态", gate_rows)
print("written:", p3)

# 自检
for p in (p2,p3):
    with zipfile.ZipFile(p) as z:
        n = z.read("xl/worksheets/sheet1.xml").decode("utf-8").count("<row ")
    print(os.path.basename(p), "rows:", n)
