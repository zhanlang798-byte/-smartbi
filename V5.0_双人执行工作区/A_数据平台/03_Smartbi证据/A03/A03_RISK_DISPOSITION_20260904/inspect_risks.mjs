import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {FileBlob, SpreadsheetFile} from '@oai/artifact-tool';

// Read-only source and ledger inspection. No workbook export or platform action.
const here=path.dirname(fileURLToPath(import.meta.url));
const work=path.resolve(here,'../../../..');
const source='A_数据平台/01_输入只读镜像/D0-D12_数据交付_V4.2/data/smartbi/';
const inputs=[
  ['lock','A_数据平台/03_Smartbi证据/A03/SMARTBI_RESOURCE_LOCK_V50.xlsx'],
  ['auditA','A_数据平台/03_Smartbi证据/模型/RELATIONSHIP_AUDIT_V50.xlsx'],
  ['auditShared','00_共享/模型交接/RELATIONSHIP_AUDIT_V50.xlsx'],
  ['policy',source+'country_policy_year.xlsx'],
  ['years',source+'dim_year.xlsx'],
];
const sha=b=>createHash('sha256').update(b).digest('hex');
const result={scope:'READ_ONLY_LOCAL_SOURCES_AND_EXISTING_LEDGER_NOT_LIVE_RETEST',inputs:{}};
for(const [key,rel] of inputs){
  const full=path.join(work,rel), before=sha(await fs.readFile(full));
  const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(full));
  console.log(key,(await wb.inspect({kind:'workbook,sheet,table',maxChars:1300,tableMaxRows:2,tableMaxCols:5})).ndjson);
  const sheet=wb.worksheets.getItemAt(0), values=sheet.getUsedRange().values;
  const rows=values.slice(1).filter(r=>r.some(v=>v!==null&&v!==''));
  assert.equal(sha(await fs.readFile(full)),before);
  result.inputs[key]={path:rel,sha256:before,sheet:sheet.name,headers:values[0],rowCount:rows.length,rows};
  if(key.startsWith('audit'))console.log(key,JSON.stringify({headers:values[0],relation14:rows.find(r=>Number(r[0])===14)}));
  if(key==='policy'||key==='years')console.log(key,JSON.stringify({headers:values[0],rowCount:rows.length,sample:rows.slice(0,1)}));
}
// Intermediate extraction is ignored; report builder publishes only bounded evidence.
await fs.mkdir(path.join(here,'outputs'),{recursive:true});
await fs.writeFile(path.join(here,'outputs/READ_ONLY_INPUTS.json'),JSON.stringify(result,null,2)+'\n');
console.log('PASS: all five input workbooks unchanged; read-only extraction saved locally.');
