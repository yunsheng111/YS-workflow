#!/bin/bash
# 代理注册表验证器
# 用途：在 Level 2 调度前，验证代理文件是否存在

validate_agent() {
  local agent_name="$1"
  local agent_file="agents/ccg/${agent_name}.md"

  if [ -f "$agent_file" ]; then
    echo "✅ $agent_name"
    return 0
  else
    echo "❌ $agent_name - 文件不存在: $agent_file"
    return 1
  fi
}

# 从命令文档中提取所有 subagent_type
echo "=== 验证命令-代理映射 ==="
echo ""

failed=0
total=0

for cmd_file in commands/ccg/*.md; do
  cmd_name=$(basename "$cmd_file" .md)

  # 提取 subagent_type
  agents=$(grep "subagent_type:" "$cmd_file" 2>/dev/null | sed 's/.*subagent_type: "\([^"]*\)".*/\1/')

  if [ -z "$agents" ]; then
    echo "⚪ $cmd_name - 无 Task 调用（主代理直接执行）"
    continue
  fi

  for agent in $agents; do
    echo -n "📋 $cmd_name → "
    ((total++))

    if validate_agent "$agent"; then
      :
    else
      ((failed++))
    fi
  done
done

echo ""
echo "=== 统计 ==="
echo "总数: $total"
echo "失败: $failed"

if [ $failed -eq 0 ]; then
  echo ""
  echo "✅ 所有命令-代理映射有效"
  exit 0
else
  echo ""
  echo "❌ 存在无效的代理映射"
  exit 1
fi
