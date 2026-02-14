#!/usr/bin/env node
/**
 * TaskCompleted 钩子 — Agent Teams 质量门控
 *
 * 触发时机：Builder 标记任务为 completed 时
 * 功能：验证任务产出质量（文件存在性、基础语法检查）
 *
 * 退出码：
 *   0 — 允许标记为完成
 *   2 — 阻止完成并要求 Builder 修复问题
 *   1 — 钩子自身错误（不影响任务状态）
 *
 * stdin: Claude Code 传入的 JSON 事件数据
 * stdout: 可选的 hookSpecificOutput JSON
 */

'use strict';

const { stdin, stdout, stderr } = require('process');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 从 stdin 读取 JSON 输入
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => { data += chunk; });
    stdin.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error(`stdin JSON 解析失败: ${e.message}`));
      }
    });
    stdin.on('error', reject);

    // 超时保护
    setTimeout(() => resolve({}), 5000);
  });
}

// 阻止完成并返回原因（exit 2）
function blockCompletion(reason) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'TaskCompleted',
      decision: 'deny',
      reason,
    },
  };
  stdout.write(JSON.stringify(output));
  process.exit(2);
}

// 允许完成（exit 0）
function allowCompletion() {
  process.exit(0);
}

// 安全执行命令，返回 { success, output }
function safeExec(cmd, options = {}) {
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
      ...options,
    });
    return { success: true, output: output.trim() };
  } catch (err) {
    return { success: false, output: (err.stderr || err.message || '').trim() };
  }
}

// 检查文件是否存在且非空
function checkFileExists(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size > 0;
  } catch {
    return false;
  }
}

// 检测项目是否有可用的 lint/typecheck 命令
function detectProjectTools(workdir) {
  const tools = { hasEslint: false, hasTsc: false, hasPrettier: false };

  const packageJsonPath = path.join(workdir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      const scripts = pkg.scripts || {};

      tools.hasEslint = !!deps.eslint || !!scripts.lint;
      tools.hasTsc = !!deps.typescript || !!scripts.typecheck || !!scripts['type-check'];
      tools.hasPrettier = !!deps.prettier || !!scripts.format;
    } catch {
      // package.json 解析失败，忽略
    }
  }

  return tools;
}

async function main() {
  let input;
  try {
    input = await readStdin();
  } catch (err) {
    stderr.write(`[verify-task] 读取输入失败: ${err.message}\n`);
    allowCompletion();
    return;
  }

  const taskDescription = input.task_description || '';
  const filesModified = input.files_modified || input.filesModified || [];
  const workdir = input.workdir || input.cwd || process.cwd();
  const issues = [];

  // === 检查 1：修改的文件是否存在 ===
  if (Array.isArray(filesModified) && filesModified.length > 0) {
    const missingFiles = [];
    for (const file of filesModified) {
      const fullPath = path.isAbsolute(file) ? file : path.join(workdir, file);
      if (!checkFileExists(fullPath)) {
        missingFiles.push(file);
      }
    }
    if (missingFiles.length > 0) {
      issues.push(
        `以下文件不存在或为空:\n` +
        missingFiles.map((f) => `  - ${f}`).join('\n')
      );
    }
  }

  // === 检查 2：对变更文件运行基础语法检查 ===
  if (Array.isArray(filesModified) && filesModified.length > 0) {
    const tools = detectProjectTools(workdir);

    // 筛选 JS/TS 文件
    const jstsFiles = filesModified.filter((f) =>
      /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(f)
    );

    if (jstsFiles.length > 0) {
      // TypeScript 类型检查（仅在有 tsconfig 时）
      if (tools.hasTsc) {
        const tsconfigPath = path.join(workdir, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
          const result = safeExec('npx tsc --noEmit --pretty 2>&1', { cwd: workdir });
          if (!result.success) {
            // 仅提取与变更文件相关的错误
            const relevantErrors = result.output
              .split('\n')
              .filter((line) =>
                jstsFiles.some((f) => line.includes(path.basename(f)))
              );
            if (relevantErrors.length > 0) {
              issues.push(
                'TypeScript 类型检查发现错误:\n' +
                relevantErrors.slice(0, 10).map((l) => `  ${l}`).join('\n') +
                (relevantErrors.length > 10 ? `\n  ... 还有 ${relevantErrors.length - 10} 个错误` : '')
              );
            }
          }
        }
      }

      // ESLint 检查
      if (tools.hasEslint) {
        const filesToLint = jstsFiles
          .map((f) => (path.isAbsolute(f) ? f : path.join(workdir, f)))
          .filter((f) => fs.existsSync(f))
          .map((f) => `"${f}"`)
          .join(' ');

        if (filesToLint) {
          const result = safeExec(
            `npx eslint --no-error-on-unmatched-pattern ${filesToLint} 2>&1`,
            { cwd: workdir }
          );
          if (!result.success && result.output) {
            // 只报告 error 级别（忽略 warning）
            const errorLines = result.output
              .split('\n')
              .filter((line) => /error/i.test(line) && !/warning/i.test(line));
            if (errorLines.length > 0) {
              issues.push(
                'ESLint 发现错误:\n' +
                errorLines.slice(0, 10).map((l) => `  ${l}`).join('\n') +
                (errorLines.length > 10 ? `\n  ... 还有 ${errorLines.length - 10} 个错误` : '')
              );
            }
          }
        }
      }
    }

    // 检查 JSON 文件语法
    const jsonFiles = filesModified.filter((f) => /\.json$/.test(f));
    for (const jsonFile of jsonFiles) {
      const fullPath = path.isAbsolute(jsonFile) ? jsonFile : path.join(workdir, jsonFile);
      if (fs.existsSync(fullPath)) {
        try {
          JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        } catch (e) {
          issues.push(`JSON 语法错误 — ${jsonFile}: ${e.message}`);
        }
      }
    }
  }

  // === 检查 3：检查变更文件中是否有 TODO/FIXME 残留 ===
  if (Array.isArray(filesModified) && filesModified.length > 0) {
    const todoFiles = [];
    for (const file of filesModified) {
      const fullPath = path.isAbsolute(file) ? file : path.join(workdir, file);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const todoMatches = content.match(/(?:TODO|FIXME|HACK|XXX)(?:\s*[:：]|\s+\S)/gi);
          if (todoMatches && todoMatches.length > 0) {
            todoFiles.push({ file, count: todoMatches.length });
          }
        } catch {
          // 读取失败忽略（可能是二进制文件）
        }
      }
    }
    if (todoFiles.length > 0) {
      issues.push(
        '以下文件包含 TODO/FIXME 标记（可能有未完成的工作）:\n' +
        todoFiles.map((f) => `  - ${f.file} (${f.count} 处)`).join('\n')
      );
    }
  }

  // 综合判断
  if (issues.length > 0) {
    blockCompletion(
      '任务完成前需要修复以下问题:\n\n' +
      issues.map((issue, i) => `### 问题 ${i + 1}\n${issue}`).join('\n\n') +
      '\n\n请修复上述问题后重新标记任务为 completed。'
    );
  } else {
    allowCompletion();
  }
}

main().catch((err) => {
  stderr.write(`[verify-task] 未预期错误: ${err.message}\n`);
  process.exit(0); // 异常不阻塞任务完成
});
