import type { Plugin } from 'vite';
import { readdirSync, unlinkSync, statSync, renameSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * 部署兼容插件（BMS APP 版）
 *
 * 本地开发时（vite dev）恢复 pre-build.mjs 重命名的备份文件。
 * 构建后清理 dist 目录中的不兼容文件。
 */

const ESA_INCOMPATIBLE_PATTERNS = [
  /^esa-entry\.js$/i,
  /^_redirects$/i,
  /^_headers$/i,
  /^vercel\.json$/i,
  /^wrangler\.(jsonc|toml)$/i,
];

const ROOT_RENAME_FILES = ['wrangler.jsonc', 'wrangler.toml'];
const RENAME_SUFFIX = '.esa-bak';

export function deployCompatPlugin(): Plugin {
  return {
    name: 'deploy-compat',

    configResolved(config) {
      if (config.command === 'serve') {
        const rootDir = process.cwd();
        for (const file of ROOT_RENAME_FILES) {
          const original = join(rootDir, file);
          const backup = original + RENAME_SUFFIX;
          if (existsSync(backup) && !existsSync(original)) {
            try {
              renameSync(backup, original);
            } catch {
              /* 恢复失败忽略 */
            }
          }
        }
      }
    },

    writeBundle(options) {
      const outDir = options.dir || resolve(process.cwd(), 'dist');
      try {
        const files = readdirSync(outDir);
        for (const file of files) {
          if (ESA_INCOMPATIBLE_PATTERNS.some((p) => p.test(file))) {
            const filePath = join(outDir, file);
            try {
              if (statSync(filePath).isFile()) {
                unlinkSync(filePath);
              }
            } catch {
              /* 删除失败忽略 */
            }
          }
        }
      } catch {
        /* 目录读取失败忽略 */
      }
    },
  };
}
