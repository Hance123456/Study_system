-- =============================================
-- 大学生碎片化学习系统 - 数据库初始化脚本
-- =============================================

-- 1. 用户表
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `openid` VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
  `union_id` VARCHAR(100) DEFAULT NULL COMMENT '微信unionid',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别：0未知 1男 2女',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `status` TINYINT DEFAULT 1 COMMENT '状态：0禁用 1正常',
  INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 管理员表
CREATE TABLE `admins` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  `name` VARCHAR(50) DEFAULT NULL COMMENT '姓名',
  `role` VARCHAR(20) DEFAULT 'admin' COMMENT '角色：admin/super_admin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` TINYINT DEFAULT 1 COMMENT '状态：0禁用 1正常'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 3. 课程分类表
CREATE TABLE `courses` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '课程名称',
  `description` TEXT DEFAULT NULL COMMENT '课程描述',
  `icon` VARCHAR(500) DEFAULT NULL COMMENT '课程图标URL',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `card_count` INT DEFAULT 0 COMMENT '卡片数量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` TINYINT DEFAULT 1 COMMENT '状态：0禁用 1正常'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程分类表';

-- 4. 知识卡片表
CREATE TABLE `cards` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `course_id` INT NOT NULL COMMENT '所属课程ID',
  `title` VARCHAR(200) NOT NULL COMMENT '卡片标题',
  `content` TEXT NOT NULL COMMENT '卡片内容(富文本)',
  `summary` VARCHAR(500) DEFAULT NULL COMMENT '内容摘要',
  `image` VARCHAR(500) DEFAULT NULL COMMENT '配图URL',
  `audio_url` VARCHAR(500) DEFAULT NULL COMMENT '音频URL(TTS生成)',
  `difficulty` TINYINT DEFAULT 1 COMMENT '难度：1简单 2中等 3困难',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `view_count` INT DEFAULT 0 COMMENT '浏览次数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` TINYINT DEFAULT 1 COMMENT '状态：0禁用 1正常',
  INDEX `idx_course_id` (`course_id`),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识卡片表';

-- 5. 用户学习进度表
CREATE TABLE `user_progress` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `card_id` INT NOT NULL COMMENT '卡片ID',
  `mastery_level` TINYINT DEFAULT 0 COMMENT '掌握程度：0未学 1了解 2熟悉 3掌握 4精通',
  `review_count` INT DEFAULT 0 COMMENT '复习次数',
  `correct_count` INT DEFAULT 0 COMMENT '答对次数',
  `wrong_count` INT DEFAULT 0 COMMENT '答错次数',
  `last_study_at` DATETIME DEFAULT NULL COMMENT '最后学习时间',
  `next_review_at` DATETIME DEFAULT NULL COMMENT '下次复习时间(艾宾浩斯)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_card` (`user_id`, `card_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_next_review` (`next_review_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户学习进度表';

-- 6. 复习计划表
CREATE TABLE `review_plans` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `card_id` INT NOT NULL COMMENT '卡片ID',
  `plan_date` DATE NOT NULL COMMENT '计划复习日期',
  `review_stage` TINYINT DEFAULT 1 COMMENT '复习阶段：1/2/3/4/5/6对应1/2/4/7/15/30天',
  `is_completed` TINYINT DEFAULT 0 COMMENT '是否完成：0否 1是',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_date` (`user_id`, `plan_date`),
  INDEX `idx_plan_date` (`plan_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='复习计划表';

-- 7. 测验题目表
CREATE TABLE `quizzes` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `card_id` INT NOT NULL COMMENT '关联卡片ID',
  `question` TEXT NOT NULL COMMENT '题目内容',
  `question_type` TINYINT DEFAULT 1 COMMENT '题型：1单选 2多选 3判断 4填空',
  `options` JSON DEFAULT NULL COMMENT '选项(JSON数组)',
  `answer` VARCHAR(200) NOT NULL COMMENT '正确答案',
  `explanation` TEXT DEFAULT NULL COMMENT '答案解析',
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` TINYINT DEFAULT 1,
  INDEX `idx_card_id` (`card_id`),
  FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测验题目表';

-- 8. 测验记录表(含错题)
CREATE TABLE `quiz_records` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `quiz_id` INT NOT NULL COMMENT '题目ID',
  `card_id` INT NOT NULL COMMENT '卡片ID',
  `user_answer` VARCHAR(200) DEFAULT NULL COMMENT '用户答案',
  `is_correct` TINYINT DEFAULT 0 COMMENT '是否正确：0错 1对',
  `time_spent` INT DEFAULT 0 COMMENT '答题耗时(秒)',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_user_wrong` (`user_id`, `is_correct`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='测验记录表';

-- 9. 学习日志表
CREATE TABLE `learning_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `card_id` INT DEFAULT NULL COMMENT '卡片ID',
  `course_id` INT DEFAULT NULL COMMENT '课程ID',
  `action_type` VARCHAR(20) NOT NULL COMMENT '行为类型：view/listen/review/quiz',
  `duration` INT DEFAULT 0 COMMENT '学习时长(秒)',
  `learning_mode` VARCHAR(20) DEFAULT 'static' COMMENT '学习模式：static静态/dynamic动态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `log_date` DATE DEFAULT (CURRENT_DATE) COMMENT '日志日期',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_user_date` (`user_id`, `log_date`),
  INDEX `idx_log_date` (`log_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习日志表';

-- 10. 用户每日统计表(便于快速查询)
CREATE TABLE `user_daily_stats` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `study_duration` INT DEFAULT 0 COMMENT '学习时长(秒)',
  `cards_learned` INT DEFAULT 0 COMMENT '学习卡片数',
  `cards_reviewed` INT DEFAULT 0 COMMENT '复习卡片数',
  `quiz_count` INT DEFAULT 0 COMMENT '答题数',
  `correct_count` INT DEFAULT 0 COMMENT '答对数',
  `is_checked_in` TINYINT DEFAULT 0 COMMENT '是否打卡',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_date` (`user_id`, `stat_date`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户每日统计表';

-- =============================================
-- 插入初始数据
-- =============================================

-- 插入默认管理员 (密码: admin123, 需要后端加密后更新)
INSERT INTO `admins` (`username`, `password`, `name`, `role`) VALUES 
('admin', 'admin123', '系统管理员', 'super_admin');

-- 插入示例课程
INSERT INTO `courses` (`name`, `description`, `sort_order`) VALUES 
('高等数学', '大学高等数学基础知识，包含极限、导数、积分等核心内容', 1),
('大学英语', '大学英语四六级核心词汇与语法知识', 2),
('思想政治', '马克思主义基本原理、毛泽东思想等政治理论知识', 3);

SELECT '数据库初始化完成！' AS message;
