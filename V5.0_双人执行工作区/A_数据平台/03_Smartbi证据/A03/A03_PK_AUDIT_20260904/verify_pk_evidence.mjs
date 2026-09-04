import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const out=path.dirname(fileURLToPath(import.meta.url));
const readJson=async f=>JSON.parse(await fs.readFile(path.join(out,f),'utf8'));
const packet=await readJson('A03_PK_PLATFORM_RESULTS_20260904.json');
const targets=await readJson('A03_PK_TARGETS_20260904.json');
const sql=await fs.readFile(path.join(out,'A03_PK_ALL_TABLES_20260904.sql'));
const sqlHash=crypto.createHash('sha256').update(sql).digest('hex');
const dom=await fs.readFile(path.join(out,'A03_PK_PLATFORM_DOM_20260904.txt'),'utf8');
if(packet.sqlSha256!==sqlHash||packet.rows.length!==21||packet.platformReportedTotal!==21||!dom.includes('generic: 共 21 行'))throw Error('Evidence completeness/hash mismatch');
if(new Set(packet.rows.map(r=>r[1])).size!==21)throw Error('Duplicate or missing target');
const verified=[];
for(const t of targets){
  const row=packet.rows.find(r=>r[1]===t.object);
  if(!row||row.length!==8||!dom.includes('- row "'+row.join(' ')+'"'))throw Error(`DOM does not corroborate ${t.object}`);
  const n=row.map((x,i)=>i===1?x:Number(String(x).replaceAll(',','')));
  if(n[0]!==t.order||n[2]!==t.expectedRows||n[3]!==n[2]||n.slice(4).some(v=>v!==0))throw Error(`Check failed ${t.object}`);
  verified.push({order:t.order,object:t.object,physical:t.physical,key:t.keys.join('+'),totalRows:n[2],keyGroups:n[3],duplicateKeyGroups:n[4],duplicateExtraRows:n[5],nullKeyRows:n[6],blankKeyRows:n[7],result:'PASS_PRIMARY_KEY_ONLY'});
}
const formalRows=verified.filter(r=>r.order<=18).reduce((s,r)=>s+r.totalRows,0);
if(formalRows!==313593)throw Error('Formal-table total mismatch');
const report={verifiedAt:new Date().toISOString(),platformCapturedAt:packet.capturedAt,scope:'Local verification of captured live platform aggregates; not a new platform query or full A03 signoff',sqlSha256:sqlHash,formalRows,auxiliaryRows:verified.filter(r=>r.order>18).map(r=>r.totalRows),tables:verified};
await fs.writeFile(path.join(out,'A03_PK_VERIFICATION_20260904.json'),JSON.stringify(report,null,2)+'\n');
const headers=Object.keys(verified[0]);
const quote=x=>'"'+String(x).replaceAll('"','""')+'"';
await fs.writeFile(path.join(out,'A03_PK_VERIFIED_20260904.csv'),[headers.join(','),...verified.map(r=>headers.map(k=>quote(r[k])).join(','))].join('\n')+'\n');
// Companion notebook makes the independent evidence checks inspectable without querying any hidden browser state.
const md='# A03 平台主键证据复核\n\n只读取同目录已捕获的 Smartbi SQL 结果、SQL 和 DOM，不直接连接数据库。平台原查询见 A03_PK_ALL_TABLES_20260904.sql。执行时间见结果 JSON，所有表采用原始主键分组，不做关联、不抽样、不先去重。\n';
const py=`from pathlib import Path
import json, hashlib
p = Path('.')
data = json.loads((p/'A03_PK_PLATFORM_RESULTS_20260904.json').read_text(encoding='utf-8'))
targets = json.loads((p/'A03_PK_TARGETS_20260904.json').read_text(encoding='utf-8'))
dom = (p/'A03_PK_PLATFORM_DOM_20260904.txt').read_text(encoding='utf-8')
assert hashlib.sha256((p/'A03_PK_ALL_TABLES_20260904.sql').read_bytes()).hexdigest() == data['sqlSha256']
assert len(data['rows']) == data['platformReportedTotal'] == 21
assert len({r[1] for r in data['rows']}) == 21
for target in targets:
    row = next(r for r in data['rows'] if r[1] == target['object'])
    assert '- row "' + ' '.join(row) + '"' in dom
    nums = [int(str(v).replace(',', '')) for v in row[2:]]
    assert nums[0] == nums[1] == target['expectedRows']
    assert nums[2:] == [0,0,0,0]
assert sum(int(r[2].replace(',','')) for r in data['rows'] if int(r[0]) <= 18) == 313593
print('21/21 平台主键聚合证据一致；类型、资源锁、B独立复核未由此签收。')
`;
const notebook={cells:[{cell_type:'markdown',metadata:{},source:md.split(/(?<=\n)/)},{cell_type:'code',execution_count:null,metadata:{},outputs:[],source:py.split(/(?<=\n)/)}],metadata:{kernelspec:{display_name:'Python 3',language:'python',name:'python3'}},nbformat:4,nbformat_minor:5};
await fs.writeFile(path.join(out,'A03_PK_EVIDENCE_CHECK_20260904.ipynb'),JSON.stringify(notebook,null,2)+'\n');
console.log(JSON.stringify({verifiedTables:21,formalRows,auxiliaryRows:report.auxiliaryRows,allPrimaryKeyChecksZero:true,scope:report.scope}));
