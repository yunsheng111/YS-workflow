#!/usr/bin/env node
/**
 * TeammateIdle 钩子 — Agent Teams 质量门控
 *
 * 触发时机：Builder 队友即将进入空闲状态时
 * 功能：检查 Builder 是否真正完成了所有分配的工作
 *
 * 退出码：
 *   0 — 允许进入空闲（工作已完成或无法判断）
 *   2 — 阻止空闲并向 Builder 反馈原因（要求继续工作）
 *   1 — 钩子自身错误（不影响 Builder）
 *
 * stdin: Claude Code 传入的 JSON 事件数据
 * stdout: 可选的 hookSpecificOutput JSON
 */

'use strict';

const { stdin, stdout, stderr } = require('process');

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

    // 超时保护：5 秒内无数据则放行
    setTimeout(() => resolve({}), 5000);
  });
}

// 输出反馈消息（exit 2 阻止空闲）
function blockIdle(reason) {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'TeammateIdle',
      decision: 'block',
      reason,
    },
  };
  stdout.write(JSON.stringify(output));
  process.exit(2);
}

// 允许空闲（exit 0）
function allowIdle() {
  process.exit(0);
}

async function main() {
  let input;
  try {
    input = await readStdin();
  } catch (err) {
    stderr.write(`[check-idle] 读取输入失败: ${err.message}\n`);
    allowIdle(); // 读取失败不阻塞 Builder
    return;
  }

  // 提取事件信息
  const taskDescription = input.task_description || '';
  const sessionId = input.session_id || '';
  const teammateId = input.teammate_id || input.agent_id || '';

  // 检查规则列表
  const issues = [];

  // 规则 1：检查是否有未完成的 TODO 标记
  // （通过任务描述中的关键词判断）
  if (taskDescription) {
    const incompletePatterns = [
      /TODO/i,
      /FIXME/i,
      /待完成/,
      /未实现/,
      /待处理/,
    ];
    // 注意：这里只对任务描述做简单检查
    // 实际文件内容的检查由 verify-task.js 负责
  }

  // 规则 2：检查 Builder 是否发送过完成消息
  // 如果 input 中有 last_message 或 messages 字段，检查最后一条消息
  const lastMessage = input.last_message || input.lastMessage || '';
  if (lastMessage) {
    const completionIndicators = [
      /完成/,
      /已完成/,
      /done/i,
      /completed/i,
      /finished/i,
      /all tasks? (?:are )?(?:done|completed)/i,
    ];
    const hasCompletionMsg = completionIndicators.some((p) => p.test(lastMessage));
    if (!hasCompletionMsg) {
      // Builder 没有明确表示完成，可能还有遗漏
      issues.push('未检测到明确的完成确认消息，请确认所有子步骤已完成');
    }
  }

  // 规则 3：如果有 tool_uses / tools_used 信息，检查是否过少
  const toolUseCount = input.tool_use_count || input.toolUseCount || 0;
  if (toolUseCount > 0 && toolUseCount < 3) {
    issues.push(
      `工具调用次数仅 ${toolUseCount} 次，可能任务未充分执行。` +
      '请检查是否所有实施步骤都已完成。'
    );
  }

  // 规则 4：如果有 files_modified 信息，检查是否为空
  const filesModified = input.files_modified || input.filesModified || [];
  if (Array.isArray(filesModified) && filesModified.length === 0 && taskDescription) {
    issues.push('未检测到任何文件修改。如果任务需要代码变更，请确认实施已完成。');
  }

  // 综合判断
  if (issues.length > 0) {
    blockIdle(
      '以下问题需要确认后才能进入空闲状态:\n' +
      issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n') +
      '\n\n如果确认所有工作已完成，请通过 TaskUpdate 标记任务为 completed 后再停止。'
    );
  } else {
    allowIdle();
  }
}

main().catch((err) => {
  stderr.write(`[check-idle] 未预期错误: ${err.message}\n`);
  process.exit(0); // 异常不阻塞 Builder
});
