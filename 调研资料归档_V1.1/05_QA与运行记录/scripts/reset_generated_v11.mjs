import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const archiveRoot = path.resolve(scriptDir, "../../");
const expectedSuffix = path.join("数据创新平台-张奥", "调研资料归档_V1.1");
if (!archiveRoot.endsWith(expectedSuffix)) throw new Error(`拒绝清理非预期目录：${archiveRoot}`);
for (const name of ["01_新增原件", "02_提取正文", "03_提取表格", "04_替代来源"]) {
  const target = path.resolve(archiveRoot, name);
  if (path.dirname(target) !== archiveRoot) throw new Error(`拒绝清理越界目录：${target}`);
  await fsp.rm(target, { recursive: true, force: true });
  await fsp.mkdir(target, { recursive: true });
}
console.log(`已重置V1.1生成目录：${archiveRoot}`);
