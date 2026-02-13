#!/usr/bin/env node
/**
 * 约束集验证工具
 * 验证约束集文件是否符合标准格式
 */

const fs = require('fs');
const path = require('path');

/**
 * 验证约束集文件
 * @param {string} filePath - 约束集文件路径
 * @returns {Object} 验证结果 { valid: boolean, errors: string[] }
 */
function validateConstraint(filePath) {
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
      if (!frontmatter.includes('task:')) {
        errors.push('YAML frontmatter 缺少 task 字段');
      }
    }

    // 验证约束编号格式
    const constraintPatterns = [
      { type: 'HC', regex: /### HC-(\d+):/g, name: '硬约束' },
      { type: 'SC', regex: /### SC-(\d+):/g, name: '软约束' },
      { type: 'DEP', regex: /### DEP-(\d+):/g, name: '依赖关系' },
      { type: 'RISK', regex: /### RISK-(\d+):/g, name: '风险' }
    ];

    constraintPatterns.forEach(({ type, regex, name }) => {
      const matches = [...content.matchAll(regex)];
      const numbers = matches.map(m => parseInt(m[1]));

      // 检查编号是否连续
      if (numbers.length > 0) {
        numbers.sort((a, b) => a - b);
        for (let i = 0; i < numbers.length; i++) {
          if (numbers[i] !== i + 1) {
            errors.push(`${name}编号不连续：期望 ${type}-${i + 1}，实际 ${type}-${numbers[i]}`);
            break;
          }
        }
      }
    });

    // 验证硬约束结构
    const hcSections = content.match(/### HC-\d+:[\s\S]*?(?=###|$)/g) || [];
    hcSections.forEach((section, index) => {
      const requiredFields = ['描述', '验证方式', '违反后果'];
      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`硬约束 HC-${index + 1} 缺少必填字段：${field}`);
        }
      });
    });

    // 验证软约束结构
    const scSections = content.match(/### SC-\d+:[\s\S]*?(?=###|$)/g) || [];
    scSections.forEach((section, index) => {
      const requiredFields = ['描述', '优先级', '权衡考虑'];
      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`软约束 SC-${index + 1} 缺少必填字段：${field}`);
        }
      });

      // 验证优先级格式
      if (section.includes('**优先级**')) {
        const priorityMatch = section.match(/\*\*优先级\*\*：(P0|P1|P2)/);
        if (!priorityMatch) {
          errors.push(`软约束 SC-${index + 1} 优先级格式错误（应为 P0/P1/P2）`);
        }
      }
    });

    // 验证依赖关系结构
    const depSections = content.match(/### DEP-\d+:[\s\S]*?(?=###|$)/g) || [];
    depSections.forEach((section, index) => {
      const requiredFields = ['类型', '描述', '影响范围'];
      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`依赖关系 DEP-${index + 1} 缺少必填字段：${field}`);
        }
      });

      // 验证类型格式
      if (section.includes('**类型**')) {
        const typeMatch = section.match(/\*\*类型\*\*：(技术依赖|数据依赖|时序依赖)/);
        if (!typeMatch) {
          errors.push(`依赖关系 DEP-${index + 1} 类型格式错误（应为 技术依赖/数据依赖/时序依赖）`);
        }
      }
    });

    // 验证风险结构
    const riskSections = content.match(/### RISK-\d+:[\s\S]*?(?=###|$)/g) || [];
    riskSections.forEach((section, index) => {
      const requiredFields = ['描述', '概率', '影响', '缓解措施'];
      requiredFields.forEach(field => {
        if (!section.includes(`**${field}**`)) {
          errors.push(`风险 RISK-${index + 1} 缺少必填字段：${field}`);
        }
      });

      // 验证概率和影响格式
      if (section.includes('**概率**')) {
        const probMatch = section.match(/\*\*概率\*\*：(高|中|低)/);
        if (!probMatch) {
          errors.push(`风险 RISK-${index + 1} 概率格式错误（应为 高/中/低）`);
        }
      }
      if (section.includes('**影响**')) {
        const impactMatch = section.match(/\*\*影响\*\*：(高|中|低)/);
        if (!impactMatch) {
          errors.push(`风险 RISK-${index + 1} 影响格式错误（应为 高/中/低）`);
        }
      }
    });

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
    console.error('用法: node validate-constraint.js <约束集文件路径>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  const result = validateConstraint(filePath);

  if (result.valid) {
    console.log('✅ 约束集格式验证通过');
    process.exit(0);
  } else {
    console.error('❌ 约束集格式验证失败：');
    result.errors.forEach(error => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }
}

module.exports = { validateConstraint };
