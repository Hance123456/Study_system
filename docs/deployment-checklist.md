# 部署与配置问题解决清单

按顺序做即可覆盖：**本机 `.env`、云托管环境变量、上传文件持久化、TTS 与网络、小程序域名**。

---

## 1. 本机开发：补齐 `.env`

1. 复制模板：  
   `backend/.env.example` → `backend/.env`（与 `backend` 目录同级，已在 `.gitignore` 中，不会提交）。
2. 在 `.env` 里改成你的真实值：
   - `DB_*`：与本机 MySQL 一致，并先执行 `database/init.sql`（或你的建库脚本）。
   - `JWT_SECRET`：随便一长串随机字符即可（本地可用，**生产务必换复杂随机串**）。
   - `WECHAT_APP_ID` / `WECHAT_APP_SECRET`：微信公众平台小程序后台获取。
   - `UPLOAD_BASE_DIR`：本地可留空或 `./uploads`（相对 `backend` 解析为绝对路径）。
   - `CORS_ORIGIN`：本地可 `*`；若前端有固定端口也可写 `http://localhost:5173`。
3. 在 `backend` 目录执行 `npm run dev`（或你的启动命令），确认能连库、能登录。

---

## 2. 云托管：环境变量怎么配

目标：**与 `.env.example` 同名、同含义**，在云平台「环境变量 / 配置」里逐条添加（不要打进镜像）。

| 变量 | 说明 |
|------|------|
| `DB_HOST` | 云 MySQL 地址（内网优先，若有）。 |
| `DB_PORT` | 一般为 `3306`。 |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | 与云数据库一致。 |
| `JWT_SECRET` | **新建强随机串**，与本地不同也可以。 |
| `WECHAT_APP_ID` / `WECHAT_APP_SECRET` | 与线上一致。 |
| `NODE_ENV` | `production`。 |
| `HOST` | `0.0.0.0`（容器内监听所有网卡）。 |
| `PORT` | 与云托管「容器端口」一致（常见 `3000`，以平台说明为准）。 |
| `CORS_ORIGIN` | 若只有小程序调 API，可先用 `*` 或填管理端域名；有浏览器固定来源时建议写具体域名。 |
| `UPLOAD_BASE_DIR` | 见下一节「持久化」。 |

部署后：在云控制台看服务日志，确认无数据库连接错误；浏览器或 curl 访问 `https://你的域名/health` 应返回正常。

---

## 3. 上传文件「发版就丢」怎么解决

**原因**：新镜像/新容器启动后，**未挂载卷**时，`/app/uploads` 是容器内临时层，重建会被清空。

**做法（二选一或组合）**：

**方案 A：云托管挂载「持久化目录」（推荐先做）**  
- 在微信云托管 / 其他平台找到「存储卷」「挂载」「持久化目录」等配置。  
- 将平台提供的目录（例如 `/data`）挂载到容器内路径，并把环境变量设为：  
  `UPLOAD_BASE_DIR=/data/uploads`（路径以平台文档为准）。  
- 确保应用启动前该目录存在（Dockerfile 里 `mkdir` 或平台自动创建）。

**方案 B：对象存储 OSS/COS（长期方案）**  
- 上传改走 SDK，数据库仍存 URL。  
- 需要改代码，毕业设计若时间紧可先用方案 A。

**论文表述**：本地用本机目录；云上通过 `UPLOAD_BASE_DIR` 指向容器内路径并配合持久化卷，避免随容器重建丢失文件。

---

## 4. TTS（edge-tts）失败怎么办

**常见原因**：容器出不了外网，或 DNS/证书问题。

**处理顺序**：

1. 看后端日志里 TTS 报错（`spawn`、`edge_tts`、超时等）。  
2. 在云托管确认「允许访问公网」或对 `*.microsoft.com` 等放行（以 edge-tts 实际访问域名为准，可查官方文档）。  
3. 若平台禁止外网：可暂时只用「上传音频文件」，不用一键 TTS；或在论文中说明「TTS 依赖外网，部署环境需放行」。  
4. Docker 镜像已含 Python + `edge-tts`，一般**无需**在控制台再装 Python。

---

## 5. 小程序连不上云端 API

1. 微信公众平台 → 开发 → 开发管理 → **服务器域名**：把 request 合法域名设为 `https://你的API域名`（需备案/HTTPS 按平台要求）。  
2. 小程序里 `request` 的 **baseURL** 改为线上 HTTPS 地址（不要用未配置的 `localhost`）。  
3. 若报跨域：浏览器调试管理端时注意 `CORS_ORIGIN`；**真机小程序主要受「服务器域名」限制**，不是浏览器 CORS。

---

## 6. 管理端（PC）连云端 API

- 把 admin 项目里的接口基地址改为云上的 `https://...`。  
- 若管理页在浏览器打开，需后端 `CORS_ORIGIN` 包含该页面来源，或为管理端单独配置。

---

## 7. 快速自检命令（本机 Docker 试跑）

在 `backend` 目录：

```bash
docker build -t study-api .
docker run --rm -p 3000:3000 ^
  -e DB_HOST=host.docker.internal -e DB_PORT=3306 ^
  -e DB_USER=root -e DB_PASSWORD=你的密码 -e DB_NAME=study_system_db ^
  -e JWT_SECRET=随便一长串 ^
  -e WECHAT_APP_ID=... -e WECHAT_APP_SECRET=... ^
  study-api
```

（Linux 把 `host.docker.internal` 换成可访问你 MySQL 的主机；或先把 MySQL 也容器化/用云库。）

访问 `http://localhost:3000/health` 应成功。

---

完成 **1 + 2** 即可「跑起来」；要 **上传不丢** 做 **3**；TTS 异常按 **4**；小程序按 **5**。
