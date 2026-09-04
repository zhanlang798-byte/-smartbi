import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {FileBlob, SpreadsheetFile} from '@oai/artifact-tool';

// Read only: preserve the historical checks, owners and lock timestamps.
const here = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(here, '../SMARTBI_RESOURCE_LOCK_V50.xlsx');
const bytes = await fs.readFile(input);
const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(input));
console.log((await wb.inspect({kind:'workbook,sheet,table',maxChars:1800,tableMaxRows:3,tableMaxCols:7})).ndjson);
const sheet = wb.worksheets.getItemAt(0);
const values = sheet.getUsedRange().values;
const report = {capturedAt:new Date().toISOString(), source:'SMARTBI_RESOURCE_LOCK_V50.xlsx',
  sha256:createHash('sha256').update(bytes).digest('hex'),
  sheet:sheet.name, headers:values[0], rows:values.slice(1),
  scope:'Read-only current workbook snapshot; not evidence of pre-import name absence.'};
await fs.writeFile(path.join(here,'LOCK_WORKBOOK_BASELINE.json'),JSON.stringify(report,null,2)+'\n','utf8');
const image = await wb.render({sheetName:sheet.name,range:'A1:G5',scale:1,format:'png'});
await fs.writeFile(path.join(here,'LOCK_BASELINE_PREVIEW.png'),new Uint8Array(await image.arrayBuffer()));
console.log(JSON.stringify({rows:report.rows.length,headers:report.headers,sha256:report.sha256}));
