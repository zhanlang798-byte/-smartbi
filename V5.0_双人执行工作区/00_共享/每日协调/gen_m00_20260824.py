# -*- coding: utf-8 -*-
# M00 2026-08-23补记晚报 + 2026-08-24早会：4份输出
import os, sys, zipfile
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

# ---------- 1) 8/23晚报（补记） ----------
evening = """M00 每日会·晚会记录 2026-08-23（补记）
==================================================
补记时间：2026-08-24 01:36 +0800（昨晚未开，如实补记，不倒填时间）
说明：本记录所有读数来自证据文件实测，非口头回忆。

【8/23实际完成】
- A01 三张MVP辅助表 → PASS（2026-08-23 上午）
  证据：A_数据平台/03_Smartbi证据/A01/（QA 33项：27 PASS + 6项DQ41 FAIL如实上报；
  5国手算误差0.00e+00；无未来信息审计最大差5.6e-17）
- A02 P0门 → PASS（2026-08-24 01:05 完成，属8/23任务的跨日延期）
  证据：A_数据平台/03_Smartbi证据/P0/（P0_ACCEPTANCE.txt、migrate.xml SHA-256
  881ff177…bcdd2、行数72/24截图、筛选验证截图）
  过程故障记录：初版关系误用“大于”运算符致预览塌缩3/1行→改“等于”恢复72/24；
  平台误判2字段为string→手改double；均未改数据。
- A补签8/22晚报与G0门槛表 → 完成（2026-08-23 14:58落盘）
- B：25问基准计算 → 未见交付证据（B最后证据为8/22的A00复核记录）

【硬失败】0 起（DQ41单测未全命中已开问题单ISS-20260823-001，属上游冻结数据问题，不计执行硬失败）

【门槛状态】
G1 数据P0：原定8/23 18:00 → 实际8/24 01:05证据齐（A01 40/20/660 + A02四表P0全PASS）
→ 延期完成，不倒填。B签收待补。

【阻塞】
1. ISS-20260823-001（DQ41，对象属V4.2冻结数据/规则）→ 建议G2前裁决，今日跟踪。
2. B的25问基准无交付证据 → 需B本人今日报告进度。

【遗留（A03前必清）】
P0内部表节点别名未带前缀（与正式资源名同形）；恢复未验收；2个改型字段仅凭A声明。

双方签收：A ______　B ______
"""

# ---------- 2) 8/24早会 ----------
morning = """M00 每日会·早会记录 2026-08-24
==================================================
生成时间：2026-08-24 01:36 +0800（随8/23补记晚报一并生成，09:00由A/B确认生效）
最终截止：2026-08-31（剩7天）

--------------------------------------------------
步骤1：读取昨日日报、门槛、问题单 → 正常
--------------------------------------------------
读数：8/23晚报（补记，A01 PASS、A02 PASS延期、G1延期完成）；G0=PASS双签齐；
问题单1张未决（ISS-20260823-001 DQ41）；B侧最新证据停留在8/22。
今日G2截止18:00：模型冻结（313,593行、主键0/0、关系、指标、交接签收）。

--------------------------------------------------
步骤2：今日任务分级
--------------------------------------------------
【必须完成（关键路径→G2 18:00）】
T1（A）A03前置清理：处理P0表节点别名与正式资源名冲突（改别名或删P0对象）。
T2（A）A03全量导入18张正式表+3张辅助表：按1-18固定顺序，合计313,593行、主键0/0。
T3（B）A01/A02证据只读复核并签收（G1闭环要件）。
【可并行】
T4（B）25问基准计算（昨日未见交付，今日续报进度）。
【依赖A冻结（G2后不启动）】
A04指标定义与冻结、B01页面3。
【离线可做】
T4即离线；B可继续AI知识库草稿。

--------------------------------------------------
步骤3：对象所有权 → 无冲突
--------------------------------------------------
A写：共享模型、DB01/02/04、XML、02_MVP辅助表、Smartbi内正式资源。
B写：DB03/05/06、AI、材料、02_25问基准框架_V50.xlsx。
共同：00_共享。今日无交叉。

--------------------------------------------------
步骤4：开始/停止条件、证据、18:00读数
--------------------------------------------------
T1 开始：随时。停止：P0对象与正式名无冲突。证据：改名或删除后截图。
T2 开始：T1完成。停止：18+3表导入行数与控制清单一致（合计313,593）、主键0/0；
   证据：03_Smartbi证据/A03/ 逐表对账+截图。18:00读数：已导入表数/21、累计行数。
T3 开始：证据目录可读（已具备）。停止：B在P0_ACCEPTANCE.txt与A01回执签复核意见。
T4 开始：随时。停止：25/25问有值或明示缺失。18:00读数：已完成问数/25。

风险：
R1 G2今晚18:00，A03体量大（313,593行），A single-threaded，预留导入排队时间。
R2 DQ41问题单今日需裁决方向，否则页面4周期状态需标注限制。
R3 昨日GitHub未同步，B看不到A01/A02证据 → 今早第一动作前先推送（需A确认）。

早会状态：待09:00双方确认
A签收：______　B签收：______
"""

open(os.path.join(DIR,'M00_EVENING_20260823.txt'),'w',encoding='utf-8').write(evening)
open(os.path.join(DIR,'M00_MORNING_20260824.txt'),'w',encoding='utf-8').write(morning)

# ---------- 3) 对象锁表 8/24 ----------
lock = [
 ["对象","所有者","今日操作者","今日动作","状态","备注"],
 ["01_输入只读镜像","A","A读/B读","只读","冻结","G0锁定不变"],
 ["02_MVP辅助表（3张）","A","无","不动","已交付","A01 PASS"],
 ["Smartbi内P0对象","A","A","改别名或删除(T1)","待处理","与正式资源名冲突，A03前必清"],
 ["Smartbi内18+3正式表","A","A","全量导入(T2)","进行中","目标313,593行、主键0/0"],
 ["共享模型/DB01/DB02/DB04/XML","A","A","随A03推进","进行中","G2冻结目标"],
 ["03_Smartbi证据/A03","A","A","写证据","待开始",""],
 ["02_25问基准框架_V50.xlsx","B","B","续算25问(T4)","进行中","昨日未见交付证据"],
 ["A01/A02证据复核","B","B","只读复核+签收(T3)","待开始","G1闭环要件"],
 ["DB03/DB05/DB06/AI/材料","B","B","离线草稿","离线","不入库"],
 ["00_共享/问题单","A+B","共同","跟踪ISS-20260823-001","未决1张","建议G2前裁决"],
 ["00_共享/模型交接","A","无","不动","空闲","G2时由A创建"],
]
write_xlsx(os.path.join(DIR,'DAILY_OBJECT_LOCK_20260824.xlsx'),'对象锁',lock)

# ---------- 4) 门槛状态表 8/24 ----------
gate = [
 ["日期","门槛","通过条件","证据","状态","决定","B签收","A签收"],
 ["2026-08-22","G0 输入锁定","路径、18+3、只读、哈希、负责人","A00证据包+B独立复核","PASS","已升级","✅ 2026-08-22","✅ 2026-08-23"],
 ["2026-08-24","G1 数据P0","40/20/660；四表上传/类型/关系/XML路径PASS","A01证据包(8/23)+P0证据包(8/24 01:05)","PASS(延期)","延期完成，不倒填时间","待签收","✅(P0验收单待A签)"],
 ["2026-08-24","G2 模型冻结","313,593；主键0/0；关系指标交接签收","待A03/A04证据","OPEN","今日18:00按证据判定","",""],
 ["2026-08-26","G3 六页初验","六页可开；每页≤4组件；筛选/来源/边界可用","","未开始","","",""],
 ["2026-08-28","G4 AIChat初验","25问全测；数值≥90%；关键误差≤1%；拒答全对","","未开始","","",""],
 ["2026-08-29","G5 恢复与材料","干净恢复；KPI一致；报告视频合规齐全","","未开始","","",""],
 ["2026-08-31","G6 最终放行","双人交叉复核；硬失败0；清单哈希截图齐全","","未开始","","",""],
]
write_xlsx(os.path.join(DIR,'DAILY_GATE_STATUS_20260824.xlsx'),'门槛状态',gate)
print('4份文件已生成')
