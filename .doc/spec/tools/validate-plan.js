#!/usr/bin/env node
/**
 * 计划验证工具
 * 验证计划文件是否符合标准格式
 */

const fs = require('fs');
const path = require('path');

/**
 * 验证计划文件
 * @param {string} filePath - 计划文件路径
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validatePlan(filePath) {
  const errors = [];

  try {
    // 读取文件
    const content = fs.readFileSync(filePath, 'utf-8');

    // 验证 YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      errors.push('缺少 YAML frontmatter');
    } else {
      const frontmatter = frontmatterMatch[1];

      // 验证必填字段
      if (!frontmatter.includes('version:')) {
        errors.push('YAML frontmatter 缺少 version 字段');
      }
      if (!frontmatter.includes('timestamp:')) {
        errors.push('YAML frontmatter 缺少 timestamp 字段');
      }
      if (!frontmatter.includes('constraints_file:')) {
        errors.push('YAML frontmatter 缺少 constraints_file 字段');
      }
    }

    // 验证子任务结构
    const taskSections = content.match(/### 子任务 \d+\.\d+:[\s\S]*?(?=###|##|$)/g) || [];

    if (taskSections.length === 0) {
      errors.push('未找到任何子任务');
    }

    taskSections.forEach((section, index) => {
      const taskNum = index + 1;

      // 验证 7 个必填字段
      const requiredFields = [
        '文件范围',
        '操作类型',
        '实施步骤',
        '验收标准',
        '约束映射',
        '依赖',
        '并行分组'
      ];

      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`子任务 ${taskNum} 缺少必填字段：${field}`);
        }
      });

      // 验证操作类型格式
      if (section.includes('**操作类型**')) {
        const typeMatch = section.match(/\*\*操作类型\*\*：(新增|修改|删除)/);
        if (!typeMatch) {
          errors.push(`子任务 ${taskNum} 操作类型格式错误（应为 新增/修改/删除）`);
        }
      }

      // 验证并行分组格式
      if (section.includes('**并行分组**')) {
        const layerMatch = section.match(/\*\*并行分组\*\*：Layer \d+/);
        if (!layerMatch) {
          errors.push(`子任务 ${taskNum} 并行分组格式错误（应为 Layer N）`);
        }
      }

      // 验证文件范围格式
      if (section.includes('**文件范围**')) {
        const fileRangeSection = section.match(/\*\*文件范围\*\*：[\s\S]*?(?=\*\*|$)/);
        if (fileRangeSection) {
          const fileLines = fileRangeSection[0].split('\n').filter(line => line.trim().startsWith('-'));
          if (fileLines.length === 0) {
            errors.push(`子任务 ${taskNum} 文件范围为空`);
          }

          // 验证每个文件是否标注了操作类型
          fileLines.forEach(line => {
            if (!line.includes('（新建') && !line.includes('（修改') && !line.includes('（删除')) {
              errors.push(`子任务 ${taskNum} 文件范围中的文件未标注操作类型：${line.trim()}`);
            }
          });
        }
      }

      // 验证实施步骤格式
      if (section.includes('**实施步骤**')) {
        const stepsSection = section.match(/\*\*实施步骤\*\*：[\s\S]*?(?=\*\*|$)/);
        if (stepsSection) {
          const stepLines = stepsSection[0].split('\n').filter(line => /^\s*\d+\./.test(line));
          if (stepLines.length === 0) {
            errors.push(`子任务 ${taskNum} 实施步骤为空`);
          }
        }
      }
    });

    // 验证文件冲突检查表
    if (!content.includes('## 文件冲突检查')) {
      errors.push('缺少文件冲突检查章节');
    } else {
      // 提取所有文件路径
      const fileMap = new Map();
      taskSections.forEach((section, index) => {
        const taskNum = `子任务 ${index + 1}`;
        const fileRangeSection = section.match(/\*\*文件范围\*\*：[\s\S]*?(?=\*\*|$)/);
        if (fileRangeSection) {
          const fileLines = fileRangeSection[0].split('\n').filter(line => line.trim().startsWith('-'));
          fileLines.forEach(line => {
            const fileMatch = line.match(/`([^`]+)`/);
            if (fileMatch) {
              const filePath = fileMatch[1];
              if (!fileMap.has(filePath)) {
                fileMap.set(filePath, []);
              }
              fileMap.get(filePath).push(taskNum);
            }
          });
        }
      });

      // 检查文件冲突
      fileMap.forEach((tasks, filePath) => {
        if (tasks.length > 1) {
          // 检查冲突检查表中是否有记录
          const conflictTableMatch = content.match(/## 文件冲突检查[\s\S]*?(?=##|$)/);
          if (conflictTableMatch && !conflictTableMatch[0].includes(filePath)) {
            errors.push(`文件 ${filePath} 被多个任务修改但未在冲突检查表中记录`);
          }
        }
      });
    }

    // 验证并行分组章节
    if (!content.includes('## 并行分组')) {
      errors.push('缺少并行分组章节');
    }

    // 验证约束覆盖检查
    if (!content.includes('## 约束覆盖检查')) {
      errors.push('缺少约束覆盖检查章节');
    }

    // 验证依赖关系图
    if (!content.includes('## 依赖关系图')) {
      errors.push('缺少依赖关系图章节');
    }

    return {
      valid: errors.length === 0,
      errors
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`文件读取失败：${error.message}`]
    };
  }
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('用法: node validate-plan.js <计划文件路径>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  const result = validatePlan(filePath);

  if (result.valid) {
    console.log('✅ 计划格式验证通过');
    process.exit(0);
  } else {
    console.error('❌ 计划格式验证失败：');
    result.errors.forEach(error => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }
}

module.exports = { validatePlan };
