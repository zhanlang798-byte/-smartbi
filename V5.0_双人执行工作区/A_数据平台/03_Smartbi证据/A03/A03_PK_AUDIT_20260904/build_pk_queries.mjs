import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const out=path.dirname(fileURLToPath(import.meta.url));
const prior=JSON.parse(await fs.readFile(path.join(out,'../A03_RECHECK_20260904/A03_WORKBOOK_PREFLIGHT_20260904.json'),'utf8'));
// Physical names observed in the Smartbi source resource tree, not model aliases.
const physicalOverrides={
  V50_dim_country:'dim_country_gi0c3510b657b27001',
  V50_dim_date:'dim_date_dpkgi0c3510fdb4327001',
  V50_dim_year:'dim_year_dpkgi0c35120bf6b27000',
  V50_dim_company:'dim_company',
  V50_dim_asset:'dim_asset',
  V50_dim_event:'dim_event_pkgi0c35127cfcb27000',
  V50_MVP_company_data_status:'mvp_company_data_status'
};
const targets=prior.objectChecks.map(x=>({order:x.order,object:x.object,physical:physicalOverrides[x.object]??x.object.toLowerCase(),keys:x.key.split('+'),expectedRows:Number(x.expectedRows)}));
if(targets.length!==21)throw Error('Expected 21 targets');
for(const t of targets){
  for(const s of [t.object,t.physical,...t.keys])if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(s))throw Error('Unsafe identifier');
}
const sql=targets.map(t=>{
  const nk=t.keys.map(k=>`${k} IS NULL`).join(' OR ');
  const bk=t.keys.map(k=>`TRIM(CAST(${k} AS CHAR)) = ''`).join(' OR ');
  return `SELECT ${t.order} AS audit_order, '${t.object}' AS object_name,
  COALESCE(SUM(n),0) AS total_rows, COUNT(*) AS key_groups,
  COALESCE(SUM(CASE WHEN n > 1 THEN 1 ELSE 0 END),0) AS duplicate_key_groups,
  COALESCE(SUM(n - 1),0) AS duplicate_extra_rows,
  COALESCE(SUM(CASE WHEN ${nk} THEN n ELSE 0 END),0) AS null_key_rows,
  COALESCE(SUM(CASE WHEN ${bk} THEN n ELSE 0 END),0) AS blank_key_rows
FROM (SELECT ${t.keys.join(', ')}, COUNT(*) AS n FROM input.${t.physical} GROUP BY ${t.keys.join(', ')}) AS pk_groups`;
}).join('\nUNION ALL\n')+'\nORDER BY audit_order';
// This prepares local SQL only. Platform execution must use the visible SQL editor.
await fs.writeFile(path.join(out,'A03_PK_TARGETS_20260904.json'),JSON.stringify(targets,null,2)+'\n');
await fs.writeFile(path.join(out,'A03_PK_ALL_TABLES_20260904.sql'),sql+'\n');
console.log(JSON.stringify({targets:targets.length,sqlBytes:Buffer.byteLength(sql),scope:'query preparation only; no platform execution'}));
