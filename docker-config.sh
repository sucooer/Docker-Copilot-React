#!/bin/sh

# 统一的前端配置和启动脚本
# 用途1 (Docker): docker-config.sh               -> 容器启动时运行
# 用途2 (本地): ./docker-config.sh http://... ./dist -> 手动配置 dist

set -e

# 解析参数
if [ $# -eq 0 ]; then
  # Docker 容器内运行模式
  API_BASE_URL="${VITE_API_BASE_URL:-http://localhost}"
  DIST_DIR="/www"
  PORT="${PORT:-12713}"
  START_SERVER=true
else
  # 本地配置模式
  API_BASE_URL="${1}"
  DIST_DIR="${2:-.}/dist"
  PORT="${3:-12713}"
  START_SERVER=false
fi

echo "================================================"
echo "Frontend Configuration & Startup"
echo "================================================"
echo "API Base URL: $API_BASE_URL"
echo "Distribution: $DIST_DIR"
echo "Server Port:  $PORT"
echo "================================================"

# 检查 dist 目录
if [ ! -d "$DIST_DIR" ]; then
  echo "Error: $DIST_DIR not found"
  exit 1
fi

# 检查 index.html
if [ ! -f "${DIST_DIR}/index.html" ]; then
  echo "Error: ${DIST_DIR}/index.html not found"
  exit 1
fi

echo "Config files are built into the image"

# 在 index.html 中注入 API 配置
echo "Injecting API configuration..."

TEMP_FILE="${DIST_DIR}/index.html.tmp"

awk -v api_url="$API_BASE_URL" '
  BEGIN { injected = 0 }
  /<head>/ && injected == 0 {
    print $0
    print "<script>"
    print "  window.__API_BASE_URL = '"'"'" api_url "'"'"';"
    print "</script>"
    injected = 1
    next
  }
  { print }
' "${DIST_DIR}/index.html" > "$TEMP_FILE"

if [ $? -eq 0 ]; then
  mv "$TEMP_FILE" "${DIST_DIR}/index.html"
  echo "Configuration injected successfully"
else
  rm -f "$TEMP_FILE"
  exit 1
fi

# 如果是本地运行模式，不启动服务器
if [ "$START_SERVER" = "false" ]; then
  echo "Configuration completed."
  exit 0
fi

# Docker 模式：使用 darkhttpd 启动
echo "Starting darkhttpd on port ${PORT}..."

exec darkhttpd ${DIST_DIR} --port ${PORT} --no-server-id --uid 0