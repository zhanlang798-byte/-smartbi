import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

// Read-only workbook audit. Does not export, save, or modify any source workbook.
const out = path.dirname(fileURLToPath(import.meta.url));
const base = path.dirname(out);
const names = ['SMARTBI_IMPORT_RECONCILIATION_V50.xlsx', 'SMARTBI_RESOURCE_LOCK_V50.xlsx', 'SMARTBI_TYPE_AUDIT_V50.xlsx'];
const sheets = {};
for (const name of names) {
  const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(base, name)));
  console.log(name, (await wb.inspect({kind:'workbook,sheet,table', maxChars:2400, tableMaxRows:3, tableMaxCols:11})).ndjson);
  sheets[name] = wb.worksheets.getItemAt(0).getUsedRange().values;
}
const recon = sheets[names[0]].slice(1).filter(r => Number(r[0]) >= 1 && Number(r[0]) <= 21);
const lock = sheets[names[1]].slice(1).filter(r => Number(r[0]) >= 1 && Number(r[0]) <= 21);
const types = sheets[names[2]].slice(1).filter(r => r[0] && r[1]);
const statusCounts = {};
for (const r of types) statusCounts[String(r[4] ?? 'EMPTY')] = (statusCounts[String(r[4] ?? 'EMPTY')] ?? 0) + 1;
const byObject = new Map(lock.map(r => [r[1], r]));
const objectChecks = recon.map(r => ({
  order:Number(r[0]), source:r[1], object:r[2], expectedRows:r[3], key:r[5], recordedPlatformRows:r[6],
  recordedDuplicates:r[8], recordedNullKeys:r[9], recordedResult:r[10],
  prefixMatches:r[2] === 'V50_' + String(r[1]).replace(/\.xlsx$/, ''),
  lockNameMatches:byObject.has(r[2]), historicalNameCheck:byObject.get(r[2])?.[3] ?? null
}));
const report = {
  inspectedAt:new Date().toISOString(), scope:'Existing workbook records only; not a live Smartbi query',
  headers:Object.fromEntries(names.map(n => [n,sheets[n][0]])),
  objectCount:objectChecks.length,
  formalExpectedRows:recon.filter(r=>Number(r[0])<=18).reduce((s,r)=>s+Number(r[3]),0),
  auxiliaryExpectedRows:recon.filter(r=>Number(r[0])>18).map(r=>Number(r[3])),
  namingMismatches:objectChecks.filter(r=>!r.prefixMatches || !r.lockNameMatches).length,
  typeCount:types.length, typeRecordedStatusCounts:statusCounts,
  typeRecordedExceptions:types.filter(r=>r[4] !== 'PASS').map(r=>({table:r[0],field:r[1],expected:r[2],recordedPlatformType:r[3],recordedStatus:r[4],note:r[5]})),
  objectChecks,
  warnings:['Historical same-name absence cannot be proven by a current resource listing.', 'Do not translate source-side primary-key counts into platform results.', 'Do not automatically mark type exceptions PASS without current evidence.']
};
await fs.writeFile(path.join(out,'A03_WORKBOOK_PREFLIGHT_20260904.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify(report,null,2));
