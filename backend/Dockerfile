# Study System API — 云托管 / 通用容器部署
# 包含：Node 后端 + Python3 + edge-tts（与 routes/upload.ts 中 TTS 逻辑一致）
#
# 构建：docker build -t study-api .
# 运行：docker run -p 3000:3000 -e PORT=3000 -e DB_HOST=... study-api
#
# 云托管：在控制台配置环境变量（DB_*、JWT_SECRET、WECHAT_*、CORS_ORIGIN 等），
#        健康检查路径填 /health

FROM node:20-bookworm

WORKDIR /app

# Python：upload.ts 使用 `python -m edge_tts`（需 PATH 中有 python）
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python-is-python3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# edge-tts（Debian bookworm 需 break-system-packages）
RUN python3 -m pip install --no-cache-dir --break-system-packages edge-tts

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

RUN mkdir -p uploads

ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js"]
