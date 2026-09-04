"""Build and execute a short companion; no Excel authoring or live queries."""
from pathlib import Path
import contextlib
import io
import json
import os

HERE = Path(__file__).resolve().parent
def markdown(source):
    return {'cell_type':'markdown', 'metadata':{}, 'source':source.splitlines(keepends=True)}


def code(source):
    return {'cell_type':'code', 'metadata':{}, 'source':source.splitlines(keepends=True),
            'execution_count':None, 'outputs':[]}


nb = {'nbformat':4, 'nbformat_minor':5, 'metadata':{
    'kernelspec':{'display_name':'Python 3', 'language':'python', 'name':'python3'},
    'validation':{'method':'sequential_python_exec', 'jupyterKernelExecuted':False,
                  'reason':'Bundled runtime has no nbformat/nbclient; cells executed in order with shared globals.'}}, 'cells':[
    markdown('''# A侧三项风险证据复核

## tl;dr
21项资源锁历史均不可追溯，当前快照身份21项匹配不等于历史无覆盖。规定名称13项超过历史记录的30字符限制，当前名称均不超过。政策事实2744行，40条2026记录未匹配2010—2025年份维，全部为待人工核验记录；无膨胀不等于无遗漏。原工作簿不改，风险最终接受和B签署均未完成。

## Context & Methods
2026-09-04，Asia/Shanghai。只读现有工作簿和本机快照，不进行平台查询、恢复、CPI或AI测试。先使用同目录inspect_risks.mjs提取原表；verify_risks.py校验源文件哈希并复算。该脚本正文为完整检查逻辑，可供检查。

### Key Assumptions
30字符是8月24日执行日志中的历史说明，本次未重新测试平台限制。年份比较按源表整数键精确匹配；左连接保留未匹配事实，不填0、不删行。结果只证明源数据和已有台账，不自动证明当前页面过滤行为。

## Data
资源锁、A侧/共享两份关系审计、country_policy_year.xlsx及dim_year.xlsx。以下检查绑定源文件哈希；若尚无outputs/READ_ONLY_INPUTS.json，先在具备@oai/artifact-tool的环境执行node inspect_risks.mjs。

验证方式：当前捆绑环境缺nbformat/nbclient，因此本文件以标准库构造nbformat 4结构，全部代码单元用同一Python上下文按顺序执行并保留输出，另作结构断言；没有启动Jupyter内核。'''),
    code('''from pathlib import Path
import importlib.util
import json

here = Path.cwd()
assert (here / 'verify_risks.py').exists(), 'Run this notebook from its own folder'
spec = importlib.util.spec_from_file_location('risk_check', here / 'verify_risks.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
report = module.evaluate()
print(json.dumps({k: {'path':v['path'], 'sha256':v['sha256']} for k,v in report['sourceWorkbooks'].items()}, ensure_ascii=False, indent=2))'''),
    markdown('## Results\n### 资源历史及命名长度'),
    code('''print(json.dumps(report['resourceHistory'], ensure_ascii=False, indent=2))
print(json.dumps({k:v for k,v in report['naming'].items() if k != 'mapping'}, ensure_ascii=False, indent=2))'''),
    markdown('### 年度政策匹配与原台账'),
    code('''print(json.dumps(report['relation14'], ensure_ascii=False, indent=2))
assert report['relation14']['factRows'] == report['relation14']['sourceInnerJoinRows'] + report['relation14']['unmatchedRows']
assert report['relation14']['sourceLeftJoinRows'] == report['relation14']['factRows']
assert not any(report['boundaries'][k] for k in ('bSigned','finalWaiverGranted','finalFreezeCreated','independentRestoreExecuted','cpiRepairOrRetest','skippedAiRetested'))
print('本地证据复算一致；没有改写源表或新增平台/最终验收PASS。')'''),
    markdown('''## Takeaways
- A可确认实现现状与风险披露，不能补签上传前无同名，也不能用本地源表结果替代平台实测。
- 对象别名、视图ID、物理表及源文件联合定位；V50_自身不保证跨项目唯一。旧生成器有默认拒绝重建保护，现行只读入口另行登记。
- 40条差异占全政策表约1.46%，却占2026分区100%。保留原记录与待核标志；不扩只读年份维、不把2026搬到2025、不把匹配行数2704称作全量2744。
- 原关系审计A15:H15的PASS原样保留，本说明明确它不能证明无遗漏或最终豁免。G2既有启动裁决不变，不重列为B执行DB05的前置任务。
- 本次A处置说明见共享区A_RISK_DISPOSITION_20260904.md；最终风险接受、独立恢复和B最终签收未完成。'''),
]}
path = HERE / 'RISK_REVIEW.ipynb'
scope = {'__name__':'__notebook__'}
previous_cwd = Path.cwd()
count = 0
try:
    os.chdir(HERE)
    for i, cell in enumerate(nb['cells']):
        cell['id'] = f'risk-cell-{i+1}'
        if cell['cell_type'] == 'code':
            count += 1
            captured = io.StringIO()
            with contextlib.redirect_stdout(captured):
                exec(compile(''.join(cell['source']),f'cell-{i+1}','exec'),scope)
            cell['execution_count'] = count
            cell['outputs'] = [{'output_type':'stream','name':'stdout','text':captured.getvalue().splitlines(keepends=True)}]
finally:
    os.chdir(previous_cwd)
assert count == 3 and len({c['id'] for c in nb['cells']}) == len(nb['cells'])
assert all(c['cell_type'] in ('markdown','code') and isinstance(c['source'],list) for c in nb['cells'])
assert all(o['output_type'] == 'stream' for c in nb['cells'] if c['cell_type']=='code' for o in c['outputs'])
encoded = json.dumps(nb,ensure_ascii=False,indent=2)+'\n'
assert json.loads(encoded) == nb
path.write_text(encoded,encoding='utf-8')
print('PASS: 3 code cells executed sequentially in Python and notebook JSON checked; Jupyter kernel NOT run (nbformat/nbclient unavailable).')
