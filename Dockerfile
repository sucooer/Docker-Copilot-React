# 构建阶段 - Build Stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ============================================
# 运行阶段 - Production Stage (darkhttpd)
FROM alpine:latest

# 极简静态文件服务器 (43KB)
RUN apk add --no-cache darkhttpd

# 前端静态文件
COPY --from=builder /app/dist /www
COPY --from=builder /app/src/config /www/config

# 启动脚本
COPY docker-config.sh /docker-config.sh
RUN chmod +x /docker-config.sh

EXPOSE 12713

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:12713/ || exit 1

CMD ["/docker-config.sh"]
