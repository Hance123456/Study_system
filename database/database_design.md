# 大学生碎片化学习系统 - 数据库设计文档

## 一、ER 实体关系图

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    ER 实体关系图                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐                                           ┌──────────┐
    │  admins  │                                           │  users   │
    │ 管理员表  │                                           │  用户表   │
    └──────────┘                                           └────┬─────┘
                                                                │
                                                                │ 1:N
                                    ┌───────────────────────────┼───────────────────────────┐
                                    │                           │                           │
                                    ▼                           ▼                           ▼
                          ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
                          │  user_progress  │         │  review_plans   │         │  learning_logs  │
                          │   用户学习进度   │         │    复习计划      │         │    学习日志      │
                          └────────┬────────┘         └────────┬────────┘         └─────────────────┘
                                   │                           │                           │
                                   │ N:1                       │ N:1                       │
                                   ▼                           ▼                           │
    ┌──────────┐           ┌──────────────┐                    │                           │
    │ courses  │ 1:N       │    cards     │◄───────────────────┘                           │
    │ 课程分类  │──────────►│   知识卡片    │                                                │
    └──────────┘           └──────┬───────┘                                                │
                                  │                                                        │
                                  │ 1:N                                                    │
                                  ▼                                                        │
                          ┌──────────────┐                                                 │
                          │   quizzes    │                                                 │
                          │   测验题目    │                                                 │
                          └──────┬───────┘                                                 │
                                 │                                                         │
                                 │ 1:N                                                     │
                                 ▼                                                         │
                          ┌──────────────┐                                                 │
                          │ quiz_records │◄────────────────────────────────────────────────┘
                          │   测验记录    │
                          └──────────────┘
                                 │
                                 │ N:1
                                 ▼
                          ┌─────────────────┐
                          │ user_daily_stats│
                          │   每日统计       │
                          └─────────────────┘
```

---

## 二、表关系说明

```
┌────────────────┬────────────────┬────────────────┬─────────────────────────────────┐
│     主表        │     从表        │    关系类型     │             说明                 │
├────────────────┼────────────────┼────────────────┼─────────────────────────────────┤
│ courses        │ cards          │ 1:N            │ 一个课程包含多个知识卡片           │
│ cards          │ quizzes        │ 1:N            │ 一个卡片可有多道测验题             │
│ cards          │ user_progress  │ 1:N            │ 一个卡片对应多个用户的学习进度      │
│ cards          │ review_plans   │ 1:N            │ 一个卡片对应多个复习计划           │
│ users          │ user_progress  │ 1:N            │ 一个用户有多条学习进度记录          │
│ users          │ review_plans   │ 1:N            │ 一个用户有多条复习计划             │
│ users          │ quiz_records   │ 1:N            │ 一个用户有多条测验记录             │
│ users          │ learning_logs  │ 1:N            │ 一个用户有多条学习日志             │
│ users          │ user_daily_stats│ 1:N           │ 一个用户有多条每日统计             │
│ quizzes        │ quiz_records   │ 1:N            │ 一道题有多条答题记录               │
└────────────────┴────────────────┴────────────────┴─────────────────────────────────┘
```

---

## 三、数据表详细结构

### 1. users 用户表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ openid          │ VARCHAR(100) │ NO       │ -       │ 微信openid (唯一)               │
│ union_id        │ VARCHAR(100) │ YES      │ NULL    │ 微信unionid                    │
│ nickname        │ VARCHAR(50)  │ YES      │ NULL    │ 昵称                           │
│ avatar          │ VARCHAR(500) │ YES      │ NULL    │ 头像URL                        │
│ gender          │ TINYINT      │ YES      │ 0       │ 性别：0未知 1男 2女              │
│ phone           │ VARCHAR(20)  │ YES      │ NULL    │ 手机号                          │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 注册时间                        │
│ updated_at      │ DATETIME     │ YES      │ NOW()   │ 更新时间                        │
│ last_login_at   │ DATETIME     │ YES      │ NULL    │ 最后登录时间                     │
│ status          │ TINYINT      │ YES      │ 1       │ 状态：0禁用 1正常                │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
索引：idx_openid (openid)
```

### 2. admins 管理员表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ username        │ VARCHAR(50)  │ NO       │ -       │ 用户名 (唯一)                   │
│ password        │ VARCHAR(255) │ NO       │ -       │ 密码(加密存储)                  │
│ name            │ VARCHAR(50)  │ YES      │ NULL    │ 姓名                           │
│ role            │ VARCHAR(20)  │ YES      │ admin   │ 角色：admin/super_admin         │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
│ updated_at      │ DATETIME     │ YES      │ NOW()   │ 更新时间                        │
│ status          │ TINYINT      │ YES      │ 1       │ 状态：0禁用 1正常                │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
```

### 3. courses 课程分类表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ name            │ VARCHAR(100) │ NO       │ -       │ 课程名称                        │
│ description     │ TEXT         │ YES      │ NULL    │ 课程描述                        │
│ icon            │ VARCHAR(500) │ YES      │ NULL    │ 课程图标URL                     │
│ sort_order      │ INT          │ YES      │ 0       │ 排序                           │
│ card_count      │ INT          │ YES      │ 0       │ 卡片数量                        │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
│ updated_at      │ DATETIME     │ YES      │ NOW()   │ 更新时间                        │
│ status          │ TINYINT      │ YES      │ 1       │ 状态：0禁用 1正常                │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
```

### 4. cards 知识卡片表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ course_id       │ INT          │ NO       │ -       │ 所属课程ID (外键)               │
│ title           │ VARCHAR(200) │ NO       │ -       │ 卡片标题                        │
│ content         │ TEXT         │ NO       │ -       │ 卡片内容(富文本)                 │
│ summary         │ VARCHAR(500) │ YES      │ NULL    │ 内容摘要                        │
│ image           │ VARCHAR(500) │ YES      │ NULL    │ 配图URL                        │
│ audio_url       │ VARCHAR(500) │ YES      │ NULL    │ 音频URL(TTS生成)                │
│ difficulty      │ TINYINT      │ YES      │ 1       │ 难度：1简单 2中等 3困难          │
│ sort_order      │ INT          │ YES      │ 0       │ 排序                           │
│ view_count      │ INT          │ YES      │ 0       │ 浏览次数                        │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
│ updated_at      │ DATETIME     │ YES      │ NOW()   │ 更新时间                        │
│ status          │ TINYINT      │ YES      │ 1       │ 状态：0禁用 1正常                │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
索引：idx_course_id (course_id)
外键：course_id -> courses(id) ON DELETE CASCADE
```

### 5. user_progress 用户学习进度表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ user_id         │ INT          │ NO       │ -       │ 用户ID (外键)                   │
│ card_id         │ INT          │ NO       │ -       │ 卡片ID (外键)                   │
│ mastery_level   │ TINYINT      │ YES      │ 0       │ 掌握程度：0未学 1了解 2熟悉 3掌握 4精通│
│ review_count    │ INT          │ YES      │ 0       │ 复习次数                        │
│ correct_count   │ INT          │ YES      │ 0       │ 答对次数                        │
│ wrong_count     │ INT          │ YES      │ 0       │ 答错次数                        │
│ last_study_at   │ DATETIME     │ YES      │ NULL    │ 最后学习时间                     │
│ next_review_at  │ DATETIME     │ YES      │ NULL    │ 下次复习时间(艾宾浩斯)            │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
│ updated_at      │ DATETIME     │ YES      │ NOW()   │ 更新时间                        │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
唯一索引：uk_user_card (user_id, card_id)
索引：idx_user_id (user_id), idx_next_review (next_review_at)
外键：user_id -> users(id), card_id -> cards(id)
```

### 6. review_plans 复习计划表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ user_id         │ INT          │ NO       │ -       │ 用户ID (外键)                   │
│ card_id         │ INT          │ NO       │ -       │ 卡片ID (外键)                   │
│ plan_date       │ DATE         │ NO       │ -       │ 计划复习日期                     │
│ review_stage    │ TINYINT      │ YES      │ 1       │ 复习阶段：1-6对应1/2/4/7/15/30天  │
│ is_completed    │ TINYINT      │ YES      │ 0       │ 是否完成：0否 1是                │
│ completed_at    │ DATETIME     │ YES      │ NULL    │ 完成时间                        │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
索引：idx_user_date (user_id, plan_date), idx_plan_date (plan_date)
外键：user_id -> users(id), card_id -> cards(id)
```

### 7. quizzes 测验题目表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ card_id         │ INT          │ NO       │ -       │ 关联卡片ID (外键)               │
│ question        │ TEXT         │ NO       │ -       │ 题目内容                        │
│ question_type   │ TINYINT      │ YES      │ 1       │ 题型：1单选 2多选 3判断 4填空     │
│ options         │ JSON         │ YES      │ NULL    │ 选项(JSON数组)                  │
│ answer          │ VARCHAR(200) │ NO       │ -       │ 正确答案                        │
│ explanation     │ TEXT         │ YES      │ NULL    │ 答案解析                        │
│ sort_order      │ INT          │ YES      │ 0       │ 排序                           │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
│ updated_at      │ DATETIME     │ YES      │ NOW()   │ 更新时间                        │
│ status          │ TINYINT      │ YES      │ 1       │ 状态                           │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
索引：idx_card_id (card_id)
外键：card_id -> cards(id) ON DELETE CASCADE
```

### 8. quiz_records 测验记录表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ user_id         │ INT          │ NO       │ -       │ 用户ID (外键)                   │
│ quiz_id         │ INT          │ NO       │ -       │ 题目ID (外键)                   │
│ card_id         │ INT          │ NO       │ -       │ 卡片ID (外键)                   │
│ user_answer     │ VARCHAR(200) │ YES      │ NULL    │ 用户答案                        │
│ is_correct      │ TINYINT      │ YES      │ 0       │ 是否正确：0错 1对               │
│ time_spent      │ INT          │ YES      │ 0       │ 答题耗时(秒)                    │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
索引：idx_user_id (user_id), idx_user_wrong (user_id, is_correct)
外键：user_id -> users(id), quiz_id -> quizzes(id), card_id -> cards(id)
```

### 9. learning_logs 学习日志表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ user_id         │ INT          │ NO       │ -       │ 用户ID (外键)                   │
│ card_id         │ INT          │ YES      │ NULL    │ 卡片ID                         │
│ course_id       │ INT          │ YES      │ NULL    │ 课程ID                         │
│ action_type     │ VARCHAR(20)  │ NO       │ -       │ 行为：view/listen/review/quiz   │
│ duration        │ INT          │ YES      │ 0       │ 学习时长(秒)                    │
│ learning_mode   │ VARCHAR(20)  │ YES      │ static  │ 模式：static静态/dynamic动态     │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
│ log_date        │ DATE         │ YES      │ TODAY   │ 日志日期                        │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
索引：idx_user_id (user_id), idx_user_date (user_id, log_date), idx_log_date (log_date)
外键：user_id -> users(id)
```

### 10. user_daily_stats 用户每日统计表

```
┌─────────────────┬──────────────┬──────────┬─────────┬────────────────────────────────┐
│      字段名      │    类型       │  可空     │  默认值  │             说明               │
├─────────────────┼──────────────┼──────────┼─────────┼────────────────────────────────┤
│ id              │ INT          │ NO       │ AUTO    │ 主键                           │
│ user_id         │ INT          │ NO       │ -       │ 用户ID (外键)                   │
│ stat_date       │ DATE         │ NO       │ -       │ 统计日期                        │
│ study_duration  │ INT          │ YES      │ 0       │ 学习时长(秒)                    │
│ cards_learned   │ INT          │ YES      │ 0       │ 学习卡片数                      │
│ cards_reviewed  │ INT          │ YES      │ 0       │ 复习卡片数                      │
│ quiz_count      │ INT          │ YES      │ 0       │ 答题数                         │
│ correct_count   │ INT          │ YES      │ 0       │ 答对数                         │
│ is_checked_in   │ TINYINT      │ YES      │ 0       │ 是否打卡                        │
│ created_at      │ DATETIME     │ YES      │ NOW()   │ 创建时间                        │
│ updated_at      │ DATETIME     │ YES      │ NOW()   │ 更新时间                        │
└─────────────────┴──────────────┴──────────┴─────────┴────────────────────────────────┘
唯一索引：uk_user_date (user_id, stat_date)
索引：idx_user_id (user_id)
外键：user_id -> users(id)
```

---

## 四、艾宾浩斯复习间隔说明

```
┌─────────────────┬─────────────────┬─────────────────────────────────────────┐
│    复习阶段      │    间隔天数      │                  说明                    │
├─────────────────┼─────────────────┼─────────────────────────────────────────┤
│ Stage 1         │ 1 天            │ 首次学习后第1天复习                       │
│ Stage 2         │ 2 天            │ 第1次复习后第2天复习                      │
│ Stage 3         │ 4 天            │ 第2次复习后第4天复习                      │
│ Stage 4         │ 7 天            │ 第3次复习后第7天复习                      │
│ Stage 5         │ 15 天           │ 第4次复习后第15天复习                     │
│ Stage 6         │ 30 天           │ 第5次复习后第30天复习 (记忆巩固)           │
└─────────────────┴─────────────────┴─────────────────────────────────────────┘

复习时间计算公式：next_review_at = last_study_at + interval_days[review_stage]
```

---

## 五、数据字典 - 枚举值说明

### 状态值 (status)
- `0` - 禁用/删除
- `1` - 正常/启用

### 性别 (gender)
- `0` - 未知
- `1` - 男
- `2` - 女

### 掌握程度 (mastery_level)
- `0` - 未学习
- `1` - 了解
- `2` - 熟悉
- `3` - 掌握
- `4` - 精通

### 题目类型 (question_type)
- `1` - 单选题
- `2` - 多选题
- `3` - 判断题
- `4` - 填空题

### 难度等级 (difficulty)
- `1` - 简单
- `2` - 中等
- `3` - 困难

### 学习行为 (action_type)
- `view` - 阅读卡片
- `listen` - 听音频
- `review` - 复习
- `quiz` - 测验答题

### 学习模式 (learning_mode)
- `static` - 静态模式(图文)
- `dynamic` - 动态模式(语音)

---

## 六、初始数据

### 默认管理员
- 用户名: `admin`
- 密码: `admin123` (需加密后存储)
- 角色: `super_admin`

### 示例课程
1. 高等数学
2. 大学英语
3. 思想政治
