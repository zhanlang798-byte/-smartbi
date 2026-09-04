import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const out = path.dirname(fileURLToPath(import.meta.url));
const base = path.dirname(out);
const input = path.join(base, 'SMARTBI_TYPE_AUDIT_V50.xlsx');
const evidence = path.join(base, '字段类型截图/A03_平台无布尔类型_20260826.png');
const evidenceHash = crypto.createHash('sha256').update(await fs.readFile(evidence)).digest('hex');
if (evidenceHash !== '75ce129572ac215881c1a8278519629fe00b96c515ae40a5b2480b80015abddf') throw new Error('Evidence hash mismatch');
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
const sheet = wb.worksheets.getItemAt(0);
const before = sheet.getUsedRange().values;
const keys = new Set(['country_monthly_risk.xlsx|is_proxy','country_monthly_risk.xlsx|is_imputed','country_event.xlsx|known_at_decision_time','global_cycle_month.xlsx|vintage_reconstructed']);
const matches = before.map((r,i)=>({r,i})).filter(({r})=>keys.has(`${r[0]}|${r[1]}`));
if(matches.length!==4) throw new Error('Expected exactly four accepted boolean exceptions');
console.log((await wb.inspect({kind:'workbook,sheet,table',maxChars:2500,tableMaxRows:2,tableMaxCols:6})).ndjson);
console.log(JSON.stringify(matches));
console.log(wb.help('workbook.render',{include:'index,notes,examples',maxChars:5500}).ndjson);

if(process.argv[2] === '--preview-before'){
  for(const range of ['A94:F98','A134:F137','A177:F180']){
    const png=await wb.render({sheetName:sheet.name,range,scale:1,format:'png'});
    await fs.writeFile(path.join(out,`TYPE_BEFORE_${range.replace(':','_')}.png`),new Uint8Array(await png.arrayBuffer()));
  }
  process.exit(0);
}
if(process.argv[2] !== '--apply') process.exit(0);
const audit = [];
for(const {r,i} of matches){
  if(r[2]!=='布尔'||r[3]!=='字符串'||r[4]!=='FAIL') throw new Error(`Unexpected baseline at row ${i+1}`);
  const note = '2026-09-04回写既有平台限制放行：平台无布尔型，保留true/false字符串，不转1/0。依据A03_EXECUTION_LOG_V50.txt及字段类型截图/A03_平台无布尔类型_20260826.png。PASS为例外放行，并非XML改型；原记录和证据哈希见A03_RECHECK_20260904/A03_TYPE_WAIVER_CHANGELOG_20260904.json。';
  sheet.getRangeByIndexes(i,4,1,2).values=[['PASS',note]];
  sheet.getRangeByIndexes(i,0,1,6).format.autofitRows();
  audit.push({row:i+1,table:r[0],field:r[1],beforeStatus:r[4],afterStatus:'PASS',beforeNote:r[5],afterNote:note,exception:'DOCUMENTED_PLATFORM_BOOLEAN_LIMIT'});
}
const after=sheet.getUsedRange().values;
for(let i=0;i<before.length;i++)for(let j=0;j<before[i].length;j++){
  if(JSON.stringify(before[i][j])!==JSON.stringify(after[i][j]) && !(matches.some(m=>m.i===i)&&[4,5].includes(j))) throw new Error(`Unintended value edit: ${i},${j}`);
}
const candidate=path.join(out,'SMARTBI_TYPE_AUDIT_V50_candidate.xlsx');
await (await SpreadsheetFile.exportXlsx(wb)).save(candidate);
const check=await SpreadsheetFile.importXlsx(await FileBlob.load(candidate));
const actual=check.worksheets.getItemAt(0).getUsedRange().values;
if(JSON.stringify(actual)!==JSON.stringify(after))throw new Error('Round-trip value mismatch');
const counts={};
for(const r of actual.slice(1).filter(r=>r[0]&&r[1]))counts[r[4]]=(counts[r[4]]??0)+1;
if(counts.PASS!==383||counts.FAIL!==59)throw new Error('Unexpected final counts');
for(const range of ['A94:F98','A134:F137','A177:F180']){
  const png=await check.render({sheetName:sheet.name,range,scale:1,format:'png'});
  await fs.writeFile(path.join(out,`TYPE_AFTER_${range.replace(':','_')}.png`),new Uint8Array(await png.arrayBuffer()));
}
await fs.writeFile(path.join(out,'A03_TYPE_WAIVER_CHANGELOG_20260904.json'),JSON.stringify({date:'2026-09-04',scope:'Existing documented boolean exceptions only; no new platform type change',evidenceHash,counts,audit},null,2)+'\n');
console.log(JSON.stringify({candidate,counts,editedCells:8}));
