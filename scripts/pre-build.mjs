import { renameSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 构建前预处理脚本
 *
 * ESA（阿里云 ESA）在执行 npm run build 之前会扫描项目根目录，
 * 如果发现 wrangler.jsonc/toml，会误判为 Workers Routine 项目，
 * 导致 CreateRoutine API 参数校验失败。
 *
 * 此脚本在 vite build 之前执行，临时重命名这些文件。
 * vite dev 启动时 deploy-compat 插件会自动恢复备份文件。
 */

const ROOT_DIR = process.cwd();
const RENAME_FILES = ['wrangler.jsonc', 'wrangler.toml'];
const RENAME_SUFFIX = '.esa-bak';

for (const file of RENAME_FILES) {
  const original = join(ROOT_DIR, file);
  const backup = original + RENAME_SUFFIX;
  if (existsSync(original) && !existsSync(backup)) {
    try {
      renameSync(original, backup);
      console.log(`[deploy-compat] Renamed ${file} -> ${file}${RENAME_SUFFIX}`);
    } catch (err) {
      console.warn(`[deploy-compat] Failed to rename ${file}:`, err.message);
    }
  }
}
