#!/usr/bin/env node
/**
 * 审查报告验证工具
 * 验证审查报告文件是否符合标准格式
 */

const fs = require('fs');
const path = require('path');

/**
 * 验证审查报告文件
 * @param {string} filePath - 审查报告文件路径
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validateReview(filePath) {
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
      if (!frontmatter.includes('plan_file:')) {
        errors.push('YAML frontmatter 缺少 plan_file 字段');
      }
      if (!frontmatter.includes('reviewer:')) {
        errors.push('YAML frontmatter 缺少 reviewer 字段');
      }
    }

    // 验证问题汇总表
    if (!content.includes('## 问题汇总')) {
      errors.push('缺少问题汇总章节');
    } else {
      const summaryMatch = content.match(/## 问题汇总[\s\S]*?\| Critical \| (\d+) \|[\s\S]*?\| Warning \| (\d+) \|[\s\S]*?\| Info \| (\d+) \|/);
      if (!summaryMatch) {
        errors.push('问题汇总表格式错误');
      }
    }

    // 验证 Critical 问题结构
    const criticalSections = content.match(/### C-\d+:[\s\S]*?(?=###|##|$)/g) || [];
    criticalSections.forEach((section, index) => {
      const issueNum = index + 1;

      // 验证必填字段
      const requiredFields = ['位置', '描述', '影响', '违反约束', '修复建议', '验证方式'];
      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`Critical 问题 C-${issueNum} 缺少必填字段：${field}`);
        }
      });

      // 验证位置格式
      if (section.includes('**位置**')) {
        const locationMatch = section.match(/\*\*位置\*\*：`([^`]+)`/);
        if (!locationMatch) {
          errors.push(`Critical 问题 C-${issueNum} 位置格式错误（应为 \`文件路径:行号\`）`);
        }
      }

      // 验证修复建议格式
      if (section.includes('**修复建议**')) {
        const suggestionsSection = section.match(/\*\*修复建议\*\*：[\s\S]*?(?=\*\*|$)/);
        if (suggestionsSection) {
          const stepLines = suggestionsSection[0].split('\n').filter(line => /^\s*\d+\./.test(line));
          if (stepLines.length === 0) {
            errors.push(`Critical 问题 C-${issueNum} 修复建议为空`);
          }
        }
      }
    });

    // 验证 Warning 问题结构
    const warningSections = content.match(/### W-\d+:[\s\S]*?(?=###|##|$)/g) || [];
    warningSections.forEach((section, index) => {
      const issueNum = index + 1;

      // 验证必填字段
      const requiredFields = ['位置', '描述', '影响', '违反约束', '修复建议', '优先级'];
      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`Warning 问题 W-${issueNum} 缺少必填字段：${field}`);
        }
      });

      // 验证优先级格式
      if (section.includes('**优先级**')) {
        const priorityMatch = section.match(/\*\*优先级\*\*：(高|中|低)/);
        if (!priorityMatch) {
          errors.push(`Warning 问题 W-${issueNum} 优先级格式错误（应为 高/中/低）`);
        }
      }
    });

    // 验证 Info 问题结构
    const infoSections = content.match(/### I-\d+:[\s\S]*?(?=###|##|$)/g) || [];
    infoSections.forEach((section, index) => {
      const issueNum = index + 1;

      // 验证必填字段
      const requiredFields = ['位置', '描述', '优化建议', '预期收益'];
      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`Info 问题 I-${issueNum} 缺少必填字段：${field}`);
        }
      });
    });

    // 验证约束合规性检查
    if (!content.includes('## 约束合规性检查')) {
      errors.push('缺少约束合规性检查章节');
    }

    // 验证修复计划
    if (!content.includes('## 修复计划')) {
      errors.push('缺少修复计划章节');
    } else {
      // 检查是否有立即修复章节（如果有 Critical 问题）
      if (criticalSections.length > 0 && !content.includes('### 立即修复（Critical）')) {
        errors.push('存在 Critical 问题但缺少立即修复计划');
      }
    }

    // 验证评分
    if (content.includes('**总体评分**')) {
      const scoreMatch = content.match(/\*\*总体评分\*\*：(\d+)/);
      if (!scoreMatch) {
        errors.push('总体评分格式错误（应为 0-100 的数字）');
      } else {
        const score = parseInt(scoreMatch[1]);
        if (score < 0 || score > 100) {
          errors.push('总体评分超出范围（应为 0-100）');
        }

        // 验证评分与问题数量的一致性
        const summaryMatch = content.match(/\| Critical \| (\d+) \|/);
        if (summaryMatch) {
          const criticalCount = parseInt(summaryMatch[1]);
          if (criticalCount > 0 && score >= 70) {
            errors.push('存在 Critical 问题但评分 >= 70（不符合评分标准）');
          }
        }
      }
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
    console.error('用法: node validate-review.js <审查报告文件路径>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  const result = validateReview(filePath);

  if (result.valid) {
    console.log('✅ 审查报告格式验证通过');
    process.exit(0);
  } else {
    console.error('❌ 审查报告格式验证失败：');
    result.errors.forEach(error => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }
}

module.exports = { validateReview };
