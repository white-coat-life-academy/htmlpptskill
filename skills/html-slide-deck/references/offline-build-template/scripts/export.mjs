import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: {
  'skill-dir': { type: 'string' },
  renderers: { type: 'string' },
} });
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const enclosingSkill = resolve(root, '../..');
const codexSkill = join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'skills', 'html-slide-deck');
const converterPath = (dir) => join(dir, 'scripts', 'content-to-pptx.mjs');
const skill = values['skill-dir'] || [enclosingSkill, codexSkill].find((dir) => existsSync(converterPath(dir)));
if (!skill || !existsSync(converterPath(resolve(skill)))) {
  console.error('找不到 html-slide-deck。請用 --skill-dir 指向技能目錄。');
  process.exit(2);
}

function run(script, ...args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${basename(script)} 執行失敗（${result.signal || result.status}）`);
}

const exportsDir = join(root, 'dist', 'exports');
const contentPath = join(root, 'content.js');
const source = readFileSync(contentPath);
mkdirSync(exportsDir, { recursive: true });
const staging = mkdtempSync(join(exportsDir, '.building-'));
const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
const output = join(exportsDir, `${timestamp}-${basename(staging).slice('.building-'.length)}`);
try {
  run('build.js', staging);
  run('scripts/check.mjs', staging, join(staging, 'qa'));
  const nativeArgs = ['content.js', join(staging, 'editable.pptx'), '--img-dirs', 'shots,assets', '--strict', '--require-renderers'];
  if (values.renderers) nativeArgs.push('--renderers', resolve(values.renderers));
  run(converterPath(resolve(skill)), ...nativeArgs);
  if (!source.equals(readFileSync(contentPath))) throw new Error('輸出期間 content.js 有變更，請重新執行 npm run export。');
  // 同一批 HTML 與 PPTX 在檢查通過後才一起交付。
  renameSync(staging, output);
  console.log(`交付目錄 ${relative(root, output)}/（index.html、editable.pptx、qa/）`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rmSync(staging, { recursive: true, force: true });
}
