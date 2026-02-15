/**
 * 证据解析器 - 从文档内容中提取证据
 */
class EvidenceParser {
  /**
   * 提取 SESSION_ID
   * @param {string} content - 文档内容
   * @returns {string|null} SESSION_ID
   */
  static extractSessionId(content) {
    if (!content) return null;

    // 匹配 UUID 格式的 SESSION_ID
    const pattern = /SESSION_ID[:\s]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
    const match = content.match(pattern);

    return match ? match[1] : null;
  }

  /**
   * 检查是否包含双模型调用证据
   * @param {string} content - 文档内容
   * @returns {boolean}
   */
  static hasDualModelEvidence(content) {
    if (!content) return false;

    const hasCodex = /Codex/i.test(content);
    const hasGemini = /Gemini/i.test(content);

    return hasCodex || hasGemini;
  }
}

module.exports = EvidenceParser;
