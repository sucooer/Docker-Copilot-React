#!/bin/sh

# 统一的前端配置和启动脚本
# 用途1 (Docker): docker-config.sh               -> 容器启动时运行（nginx 同源反代，HttpOnly Cookie 认证）
# 用途2 (本地): ./docker-config.sh http://... ./dist -> 手动配置 dist

set -eu

# 校验 PORT 为合法端口号
validate_port() {
  case "$1" in
    ''|*[!0-9]*) echo "Error: PORT '$1' 不是有效数字" >&2; exit 1 ;;
  esac
  if [ "$1" -lt 1 ] || [ "$1" -gt 65535 ]; then
    echo "Error: PORT '$1' 超出有效范围 1-65535" >&2
    exit 1
  fi
}

# 校验并规范化后端地址：必须 http(s)://，并去除尾斜杠
normalize_backend_url() {
  case "$1" in
    http://*|https://*)
      # 去除尾斜杠，避免 proxy_pass 路径语义改变
      printf '%s' "$1" | sed 's#/$##'
      ;;
    *)
      echo "Error: 后端地址 '$1' 必须以 http:// 或 https:// 开头" >&2
      exit 1
      ;;
  esac
}

# 解析参数
if [ $# -eq 0 ]; then
  # Docker 容器内运行模式
  BACKEND_URL="$(normalize_backend_url "${BACKEND_URL:-${VITE_API_BASE_URL:-http://backend:12712}}")"
  DIST_DIR="/www"
  PORT="${PORT:-12713}"
  validate_port "$PORT"
  START_SERVER=true
else
  # 本地配置模式
  API_BASE_URL="$(normalize_backend_url "${1}")"
  DIST_DIR="${2:-.}/dist"
  PORT="${3:-12713}"
  validate_port "$PORT"
  START_SERVER=false
fi

echo "================================================"
echo "Frontend Configuration & Startup"
echo "================================================"
echo "Distribution: $DIST_DIR"
echo "Server Port:  $PORT"
if [ "$START_SERVER" = "true" ]; then
  echo "Backend Upstream: $BACKEND_URL"
fi
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

# 本地配置模式：在 index.html 中注入 API 配置（直连后端，需保证同源或配置 CORS 才能使用 Cookie 认证）
if [ "$START_SERVER" = "false" ]; then
  echo "Injecting API configuration..."

  # 已注入过则跳过，避免重复注入产生多个 <script>
  if grep -q 'window.__API_BASE_URL' "${DIST_DIR}/index.html"; then
    echo "Configuration already injected, skipping."
    exit 0
  fi

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

  echo "Configuration completed."
  exit 0
fi

# Docker 模式：生成 nginx 配置，前端与 /api 同源，HttpOnly Cookie 认证方可生效
echo "Generating nginx configuration..."

NGINX_CONF="/etc/nginx/conf.d/default.conf"

cat > "$NGINX_CONF" <<EOF
server {
    listen ${PORT};
    server_name _;
    root ${DIST_DIR};
    index index.html;

    client_max_body_size 50m;

    location /api/ {
        proxy_pass ${BACKEND_URL};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    location /src/config/image/ {
        proxy_pass ${BACKEND_URL};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

echo "nginx configuration generated at ${NGINX_CONF}"

# 启动前校验 nginx 配置，避免非法配置导致容器退出且无提示
if ! nginx -t 2>&1; then
  echo "Error: nginx 配置校验失败，请检查 BACKEND_URL 和 PORT 设置" >&2
  exit 1
fi

# 启动 nginx
echo "Starting nginx on port ${PORT}..."

exec nginx -g 'daemon off;'
