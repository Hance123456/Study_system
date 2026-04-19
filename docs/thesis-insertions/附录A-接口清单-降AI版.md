# 附录A 接口清单（论文可直接粘贴）

## 接口说明（降 AI 版）

系统采用 REST 风格接口，业务数据统一使用 JSON 传输，文件上传接口使用 `multipart/form-data`。接口按业务模块划分，便于前后端联调和后续维护。除登录等公开接口外，其余接口都需要携带 JWT token。后端统一返回状态码和提示信息，前端在请求封装层集中处理提示与跳转。列表类接口默认支持分页和筛选，避免一次返回过多数据影响性能。完整接口见附录表。

---

> 统一前缀：`/api`  
> 鉴权说明：`user`=学习用户 token；`admin`=管理员 token；`无`=公开接口

| 模块 | 方法 | 路径 | 鉴权 | 主要参数 | 说明 |
|---|---|---|---|---|---|
| 系统 | GET | `/health` | 无 | - | 健康检查 |
| 管理员 | POST | `/admin/login` | 无 | `username,password` | 管理员登录，返回 token |
| 管理员 | GET | `/admin/info` | admin | - | 获取管理员信息 |
| 管理员 | PUT | `/admin/password` | admin | `oldPassword,newPassword` | 修改管理员密码 |
| 管理员 | GET | `/admin/stats` | admin | - | 后台仪表盘统计 |
| 用户 | POST | `/user/wxlogin` | 无 | `code,userInfo` | 小程序登录，返回 token |
| 用户 | GET | `/user/info` | user | - | 获取当前用户信息 |
| 用户 | PUT | `/user/update` | user | `nickname,avatar,gender` | 更新用户资料 |
| 用户 | GET | `/user/stats` | user | - | 获取学习统计汇总 |
| 课程 | GET | `/course/list` | 无 | `status,keyword` | 课程列表 |
| 课程 | GET | `/course/detail/:id` | 无 | `id` | 课程详情 |
| 课程 | POST | `/course/create` | admin | `name,description,icon,sort_order` | 新建课程 |
| 课程 | PUT | `/course/update/:id` | admin | 同上+`status` | 更新课程 |
| 课程 | DELETE | `/course/delete/:id` | admin | `id` | 删除课程（物理删除） |
| 卡片 | GET | `/card/list` | 无 | `course_id,status,difficulty,keyword,page,pageSize` | 卡片分页列表 |
| 卡片 | GET | `/card/detail/:id` | 无 | `id` | 卡片详情（含浏览计数） |
| 卡片 | POST | `/card/create` | admin | `course_id,title,content,...` | 新建卡片 |
| 卡片 | PUT | `/card/update/:id` | admin | 卡片字段 | 更新卡片 |
| 卡片 | DELETE | `/card/delete/:id` | admin | `id` | 删除卡片（物理删除） |
| 测验（用户） | GET | `/quiz/card/:cardId` | user | `cardId` | 获取卡片题目 |
| 测验（用户） | POST | `/quiz/submit` | user | `quiz_id,user_answer,time_spent` | 提交答题 |
| 测验（用户） | GET | `/quiz/wrong` | user | `page,pageSize` | 获取错题列表 |
| 测验（管理） | GET | `/quiz/list` | admin | `card_id,status,page,pageSize` | 题目列表 |
| 测验（管理） | GET | `/quiz/detail/:id` | admin | `id` | 题目详情 |
| 测验（管理） | POST | `/quiz/create` | admin | `card_id,question,question_type,options,answer,...` | 新建题目 |
| 测验（管理） | PUT | `/quiz/update/:id` | admin | 题目字段 | 更新题目 |
| 测验（管理） | DELETE | `/quiz/delete/:id` | admin | `id` | 删除题目（物理删除） |
| 复习 | GET | `/review/today` | user | - | 今日待复习列表 |
| 复习 | GET | `/review/upcoming` | user | - | 即将到来列表 |
| 复习 | POST | `/review/complete` | user | `plan_id,is_correct` | 完成复习并推进阶段 |
| 复习 | POST | `/review/add` | user | `card_id` | 手动加入复习计划 |
| 复习 | POST | `/review/add-today` | user | `card_id` | 加入今日复习 |
| 复习 | GET | `/review/stats` | user | - | 复习统计 |
| 学习进度 | POST | `/progress/record` | user | `card_id,course_id,action_type,duration,learning_mode` | 记录学习行为 |
| 学习进度 | POST | `/progress/mastery` | user | `card_id,mastery_level` | 更新掌握度 |
| 学习进度 | GET | `/progress/course/:courseId` | user | `courseId` | 课程维度进度 |
| 学习进度 | GET | `/progress/card/:cardId` | user | `cardId` | 卡片维度进度 |
| 学习进度 | GET | `/progress/course/:courseId/study-queue` | user | `courseId` | 学习队列 |
| 学习进度 | GET | `/progress/course/:courseId/study-list` | user | `courseId` | 学习列表 |
| 打卡 | POST | `/checkin/` | user | - | 当日打卡 |
| 打卡 | GET | `/checkin/status` | user | - | 查询今日打卡状态 |
| 打卡 | GET | `/checkin/calendar` | user | - | 最近30天日历数据 |
| 打卡 | GET | `/checkin/calendar/day` | user | `date=YYYY-MM-DD` | 指定日期明细 |
| 上传 | POST | `/upload/image` | 无/按前端策略 | `file` | 单图上传 |
| 上传 | POST | `/upload/images` | 无/按前端策略 | `files[]` | 批量图片上传 |
| 上传 | POST | `/upload/audio` | 无/按前端策略 | `file` | 音频上传 |
| 上传 | POST | `/upload/tts` | 无/按前端策略 | `text,voice,rate` | 一键 TTS 生成 MP3 |
| 上传 | DELETE | `/upload/file` | 无/按前端策略 | `url` | 删除文件 |

