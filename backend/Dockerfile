# Study System API - 微信云托管优化版
# 支持 edge-tts + TypeScript + 生产环境优化

FROM node:20-bookworm-slim

WORKDIR /app

# 安装 Python 和 edge-tts（TTS功能需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python-is-python3 \
    ca-certificates \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install --no-cache-dir --break-system-packages edge-tts

# 复制依赖文件并安装
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

# 创建必要的目录
RUN mkdir -p uploads

# 生产环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 健康检查路径（云托管需要）
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

EXPOSE 3000

CMD ["node", "dist/index.js"]
