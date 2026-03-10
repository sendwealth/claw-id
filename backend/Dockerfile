# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

# 设置npm镜像（解决国内网络问题）
RUN npm config set registry https://registry.npmmirror.com

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx --registry https://registry.npmmirror.com prisma generate

# 生产环境
FROM node:18-alpine AS production

WORKDIR /app

# 安全：非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

# 启动命令
CMD ["node", "src/app.js"]
