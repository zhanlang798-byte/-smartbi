import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {FileBlob,SpreadsheetFile} from '@oai/artifact-tool';
const out=path.dirname(fileURLToPath(import.meta.url));
const target=path.join(out,'../SMARTBI_IMPORT_RECONCILIATION_V50.xlsx');
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(target));
const sheet=wb.worksheets.getItemAt(0);
const before=sheet.getUsedRange().values;
console.log((await wb.inspect({kind:'workbook,sheet,table',maxChars:2500,tableMaxRows:3,tableMaxCols:11})).ndjson);
console.log(JSON.stringify({lastRow:before.at(-1),lastRowFormulas:sheet.getRange(`A${before.length}:K${before.length}`).formulas}));
if(process.argv[2]!=='--apply'){
  for(const range of ['G1:K6','G15:K22']){
    const png=await wb.render({sheetName:sheet.name,range,scale:1,format:'png'});
    await fs.writeFile(path.join(out,`RECON_BEFORE_${range.replace(':','_')}.png`),new Uint8Array(await png.arrayBuffer()));
  }
  console.log(JSON.stringify(before.slice(0,3)));
  process.exit(0);
}
const data=JSON.parse(await fs.readFile(path.join(out,'A03_PK_PLATFORM_RESULTS_20260904.json'),'utf8'));
const targets=JSON.parse(await fs.readFile(path.join(out,'A03_PK_TARGETS_20260904.json'),'utf8'));
const hash=crypto.createHash('sha256').update(await fs.readFile(path.join(out,'A03_PK_ALL_TABLES_20260904.sql'))).digest('hex');
if(data.sqlSha256!==hash||data.rows.length!==21||data.platformReportedTotal!==21)throw Error('Incomplete or mismatched platform evidence');
const changes=[];
for(const t of targets){
  const r=data.rows.find(r=>Number(r[0])===t.order&&r[1]===t.object);
  if(!r||r.length!==8)throw Error(`Missing platform row ${t.object}`);
  const nums=r.map((x,i)=>i===1?x:Number(String(x).replaceAll(',','')));
  if(nums[2]!==t.expectedRows||nums[3]!==nums[2]||nums.slice(4).some(n=>n!==0))throw Error(`Non-passing platform result ${t.object}`);
  const i=before.findIndex(r=>Number(r[0])===t.order&&r[2]===t.object);
  if(i<1||Number(before[i][6])!==nums[2])throw Error('Reconciliation baseline mismatch');
  const note='BLOCKED（主键平台实测PASS；类型/资源锁待核）。证据：A03_PK_AUDIT_20260904/README.md';
  sheet.getRangeByIndexes(i,8,1,3).values=[[nums[5],nums[6]+nums[7],note]];
  // Extend only changed rows so the existing wrapped evidence note remains readable.
  sheet.getRangeByIndexes(i,0,1,11).format.autofitRows();
  changes.push({row:i+1,object:t.object,before:before[i].slice(8,11),after:[nums[5],nums[6]+nums[7],note]});
}
const after=sheet.getUsedRange().values;
for(let i=0;i<before.length;i++)for(let j=0;j<before[i].length;j++)if(JSON.stringify(before[i][j])!==JSON.stringify(after[i][j])&&!(changes.some(c=>c.row===i+1)&&j>=8&&j<=10))throw Error(`Out-of-scope cell ${i},${j}`);
const delivery=process.argv[3];
if(!delivery)throw Error('Provide explicit output path');
await fs.mkdir(path.dirname(delivery),{recursive:true});
await(await SpreadsheetFile.exportXlsx(wb)).save(delivery);
const check=await SpreadsheetFile.importXlsx(await FileBlob.load(delivery));
if(JSON.stringify(check.worksheets.getItemAt(0).getUsedRange().values)!==JSON.stringify(after))throw Error('Roundtrip mismatch');
console.log((await check.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'Final error scan'})).ndjson);
for(const range of ['G1:K6','G15:K22']){
  const png=await check.render({sheetName:sheet.name,range,scale:1,format:'png'});
  await fs.writeFile(path.join(out,`RECON_AFTER_${range.replace(':','_')}.png`),new Uint8Array(await png.arrayBuffer()));
}
await fs.writeFile(path.join(out,'A03_RECON_CHANGELOG_20260904.json'),JSON.stringify({date:'2026-09-04',scope:'Platform full-table primary-key checks only; A03 overall remains pending',sqlSha256:hash,changes},null,2)+'\n');
console.log(JSON.stringify({delivery,verifiedPlatformTables:21,changedCells:63,scopePreserved:true}));
