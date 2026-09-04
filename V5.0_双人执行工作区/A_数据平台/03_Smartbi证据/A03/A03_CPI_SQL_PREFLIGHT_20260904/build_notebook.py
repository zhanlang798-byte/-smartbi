"""Build a dependency-free companion notebook and execute Python cells in order.

nbformat/nbclient are unavailable in the bundled Python runtime. This validates
the nbformat-4 structure and executes code in one Python namespace, not a Jupyter
kernel. SQL is printed for review, never sent to Smartbi by this script.
"""
from pathlib import Path
import contextlib
import io
import json
import os

HERE = Path(__file__).resolve().parent
cells = []


def md(text):
    cells.append({'id': f'cell-{len(cells):02d}', 'cell_type': 'markdown',
                  'metadata': {}, 'source': text.splitlines(keepends=True)})


def code(text):
    cells.append({'id': f'cell-{len(cells):02d}', 'cell_type': 'code',
                  'metadata': {}, 'source': text.splitlines(keepends=True),
                  'execution_count': None, 'outputs': []})


md('''# A03 CPI SQL 与引用预检 · 2026-09-04
## tl;dr
完整18列只读转换查询、聚合、主键及空值预检通过。正式模型未修改，CPI最终验收仍FAIL。
查询：7680行、7616非空、64空值；MAX=47,954.24，AVG=375.80；主键重复=0。
''')
md('''## Context & Methods
粒度为iso3+month_end，40国，2010-01-31至2025-12-31。本次读取日期为2026-09-04（Asia/Shanghai）。
平台：Smartbi“可导入数据库”，input.v50_country_monthly_risk；正式模型MDL_XH202612_V50_COUNTRY_RESERVE。
### Key Assumptions
不加筛选、连接、去重或填零；仅cpi_index在聚合前CAST为DECIMAL(30,12)。
聚合只按界面两位小数和既有独立源文件基准比对，不宣称全精度相等。
SQL通过平台原生查询界面人工/浏览器执行；本笔记本只核验已保存证据，不重新查询数据库。
原表“编辑”菜单禁用，原因未确定；不据此断定账号权限不足。
''')
md('''## Data
输入为同目录SQL、原生DOM、复制SQL、引用JSON与前序源端基准；详见README.md。
当前模型引用取9/4受控导出；页面字段引用取8/31历史XML，不能充当最新完整租户依赖扫描。
执行环境：Python标准库；无nbformat/nbclient。本文件代码单元已在同一Python命名空间顺序执行并保存输出，
未在Jupyter内核验证。如需内核复验，安装jupyter/nbconvert后在本目录运行：
`python -m jupyter nbconvert --execute --to notebook --inplace CPI_SQL_PREFLIGHT.ipynb`。
''')
code('''from pathlib import Path
import json
import runpy
folder = Path.cwd()
assert (folder / 'verify_preflight.py').is_file(), '请以本证据目录为工作目录运行'
''')
md('### 1. 查看平台实际执行的查询')
code('''for name in ['CPI_FULL_QUERY_CHECK.sql', '04_FULL_18_COLUMN_EXECUTED.sql', 'CPI_KEY_NULL_CHECK.sql']:
    print(name)
    print((folder / name).read_text(encoding='utf-8'))
''')
md('## Results\n### 2. 核验原生结果、SQL一致性和保护文件哈希')
code('''checks = runpy.run_path(str(folder / 'verify_preflight.py'))
report = checks['verify']()
print(json.dumps({k: report[k] for k in ['sqlPreflight', 'formalRepairStatus', 'metrics', 'grainAndNullCheck', 'queryDiscardedWithoutSaving', 'formalModelPublished']}, ensure_ascii=False, indent=2))
''')
md('### 3. 核对依赖边界')
code('''refs = json.loads((folder / 'REFERENCE_AUDIT.json').read_text(encoding='utf-8'))
print('原字段数:', refs['sourceFieldCount'])
print('来源关系数:', len(refs['relationsInvolvingSource']))
print('历史直接CPI组件:', [(p['name'], c['id']) for p in refs['pages'] for c in p['portlets']])
print(refs['scope'])
''')
md('''## Takeaways
预检材料可共享，但不代表正式修复验收。主模型没有发布，测试SQL已不保存关闭。
下一步需确认保留18字段ID/2关系及DB02私有度量引用的原位数值化或受控替换入口。
正式上线后才复测原生MAX、AVG、趋势/筛选并交B独立复核。Excel状态、B签署和AI六题跳过状态不变。
''')

old_cwd = Path.cwd()
try:
    os.chdir(HERE)
    namespace = {'__name__': '__notebook__'}
    count = 0
    for cell in cells:
        assert cell['cell_type'] in {'code', 'markdown'} and isinstance(cell['source'], list)
        if cell['cell_type'] == 'code':
            count += 1
            buf = io.StringIO()
            with contextlib.redirect_stdout(buf):
                exec(compile(''.join(cell['source']), cell['id'], 'exec'), namespace)
            cell['execution_count'] = count
            if buf.getvalue():
                cell['outputs'] = [{'output_type': 'stream', 'name': 'stdout',
                                    'text': buf.getvalue().splitlines(keepends=True)}]
finally:
    os.chdir(old_cwd)
notebook = {'nbformat': 4, 'nbformat_minor': 5, 'cells': cells,
            'metadata': {'kernelspec': {'display_name': 'Python 3', 'language': 'python', 'name': 'python3'},
                         'language_info': {'name': 'python'},
                         'validation': {'mode': 'Sequential standard-library Python; not Jupyter kernel',
                                        'codeCellsExecuted': count}}}
assert len({c['id'] for c in cells}) == len(cells)
assert all(c['execution_count'] is not None for c in cells if c['cell_type'] == 'code')
(HERE / 'CPI_SQL_PREFLIGHT.ipynb').write_text(json.dumps(notebook, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
print(f'Notebook structure checked; {count} Python code cells executed sequentially (not a Jupyter kernel).')
