#!/bin/bash
# 代理注册表生成器
# 用途：扫描 agents/ccg/ 目录，生成代理清单

OUTPUT_FILE=".ccg/agents-registry.json"

echo "正在扫描代理文件..."

# 初始化 JSON
echo "{" > "$OUTPUT_FILE"
echo '  "generated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",' >> "$OUTPUT_FILE"
echo '  "agents": [' >> "$OUTPUT_FILE"

first=true
for agent_file in agents/ccg/*.md; do
  # 跳过模板文件
  if [[ "$agent_file" == *"template"* ]]; then
    continue
  fi
  
  # 提取代理名称
  agent_name=$(basename "$agent_file" .md)
  
  # 提取描述
  description=$(grep "^description:" "$agent_file" | sed 's/description: "\(.*\)"/\1/')
  
  # 提取工具集
  tools=$(grep "^tools:" "$agent_file" | sed 's/tools: //')
  
  # 添加逗号（除了第一个）
  if [ "$first" = false ]; then
    echo "," >> "$OUTPUT_FILE"
  fi
  first=false
  
  # 写入 JSON
  echo "    {" >> "$OUTPUT_FILE"
  echo "      \"name\": \"$agent_name\"," >> "$OUTPUT_FILE"
  echo "      \"file\": \"$agent_file\"," >> "$OUTPUT_FILE"
  echo "      \"description\": \"$description\"," >> "$OUTPUT_FILE"
  echo "      \"tools\": \"$tools\"," >> "$OUTPUT_FILE"
  echo "      \"last_modified\": \"$(stat -c %y "$agent_file" 2>/dev/null || stat -f %Sm -t "%Y-%m-%d %H:%M:%S" "$agent_file")\"" >> "$OUTPUT_FILE"
  echo -n "    }" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"
echo "  ]" >> "$OUTPUT_FILE"
echo "}" >> "$OUTPUT_FILE"

echo "✅ 代理注册表已生成: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
