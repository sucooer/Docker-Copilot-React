# 构建阶段 - Build Stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ============================================
# 运行阶段 - Production Stage (nginx 同源反代)
# 前端与 /api 同源，保证 HttpOnly Cookie 认证可用
FROM nginx:alpine

ARG PORT=12713

# 前端静态文件
COPY --from=builder /app/dist /www
COPY --from=builder /app/src/config /www/config

# 启动脚本
COPY docker-config.sh /docker-config.sh
RUN chmod +x /docker-config.sh

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:${PORT}/ || exit 1

CMD ["/docker-config.sh"]
