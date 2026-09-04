import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const dir = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(path.dirname(dir), 'SMARTBI_TYPE_AUDIT_V50.xlsx');
const evidence = JSON.parse(await fs.readFile(path.join(dir, 'TYPE_LAYER_RECONCILIATION.json'), 'utf8'));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const inputBytes = await fs.readFile(input);
if (hash(inputBytes) !== evidence.historicalLedgerSha256Unchanged) throw new Error('Baseline workbook changed');
if (evidence.fields.length !== 59 || evidence.fields.some(r=>!r.liveMatchesPersisted || !r.modelTypeCompatible)) throw new Error('Incomplete evidence');
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
const sheet = wb.worksheets.getItemAt(0);
const before = sheet.getUsedRange().values;
const matches = evidence.fields.map(field=>{
  const found = before.map((r,i)=>({r,i})).filter(({r})=>r[0]===field.table && r[1]===field.field);
  if(found.length!==1 || found[0].r[4]!=='FAIL') throw new Error('Unexpected ledger key/status');
  return {...found[0], field};
});
const previewRange = 'A87:F89';
if(process.argv[2]==='--preview') {
  console.log((await wb.inspect({kind:'table',range:`'${sheet.name}'!${previewRange}`,include:'values,formulas',tableMaxRows:3,tableMaxCols:6})).ndjson);
  const image=await wb.render({sheetName:sheet.name,range:previewRange,scale:1,format:'png'});
  await fs.writeFile(path.join(dir,'TYPE_NOTES_BEFORE.png'),new Uint8Array(await image.arrayBuffer()));
  process.exit(0);
}
if(process.argv[2]!=='--apply') throw new Error('Use --preview or --apply');
const changes=[];
for(const {r,i,field} of matches) {
  const note=`2026-09-04分层复核：9/1底表${field.sourceViewType_20260901}，模型${field.persistedModelType_20260901}；在线${field.liveModelType_20260904}一致。旧FAIL保留底表口径，计算/取值域和B复核待完成。证据：A03_TYPE_PERSISTENCE_20260904/TYPE_LAYER_RECONCILIATION.json。`;
  sheet.getRangeByIndexes(i,5,1,1).values=[[note]];
  sheet.getRangeByIndexes(i,0,1,6).format.autofitRows();
  changes.push({cell:`F${i+1}`,table:r[0],field:r[1],before:r[5],after:note});
}
const after=sheet.getUsedRange().values;
for(let i=0;i<before.length;i++) for(let j=0;j<before[i].length;j++) {
  if(JSON.stringify(before[i][j])!==JSON.stringify(after[i][j]) && !(j===5 && matches.some(m=>m.i===i))) throw new Error('Unintended value edit');
}
const counts={};
for(const r of after.slice(1).filter(r=>r[0]&&r[1])) counts[r[4]]=(counts[r[4]]??0)+1;
if(counts.PASS!==383 || counts.FAIL!==59) throw new Error('Acceptance statuses must stay unchanged');
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},summary:'formula error scan'})).ndjson);
const outputDir=path.join(dir,'outputs','type-persistence-20260904');
await fs.mkdir(outputDir,{recursive:true});
const output=path.join(outputDir,'SMARTBI_TYPE_AUDIT_V50.xlsx');
await (await SpreadsheetFile.exportXlsx(wb)).save(output);
const saved=await SpreadsheetFile.importXlsx(await FileBlob.load(output));
if(JSON.stringify(saved.worksheets.getItemAt(0).getUsedRange().values)!==JSON.stringify(after)) throw new Error('Round-trip values changed');
const image=await saved.render({sheetName:sheet.name,range:previewRange,scale:1,format:'png'});
await fs.writeFile(path.join(dir,'TYPE_NOTES_AFTER.png'),new Uint8Array(await image.arrayBuffer()));
await fs.writeFile(path.join(dir,'TYPE_NOTES_CHANGELOG.json'),JSON.stringify({checkedAt:new Date().toISOString(),scope:'59 note cells only; no acceptance status or B signature changes',inputSha256:hash(inputBytes),outputSha256:hash(await fs.readFile(output)),counts,changes},null,2)+'\n');
console.log(JSON.stringify({output,changedNoteCells:changes.length,counts}));
