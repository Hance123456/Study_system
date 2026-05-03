/*
 Navicat Premium Dump SQL

 Source Server         : study_system
 Source Server Type    : MySQL
 Source Server Version : 90001 (9.0.1)
 Source Host           : localhost:3306
 Source Schema         : study_system_db

 Target Server Type    : MySQL
 Target Server Version : 90001 (9.0.1)
 File Encoding         : 65001

 Date: 02/05/2026 23:04:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admins
-- ----------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(加密)',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '姓名',
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'admin' COMMENT '角色：admin/super_admin',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：0禁用 1正常',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of admins
-- ----------------------------
INSERT INTO `admins` VALUES (1, 'admin', '$2b$10$v71M3r..CBxR.3pvG10QGehm.wFMfIcJGBZz4JCfftmGrHO1EBIPy', '系统管理员', 'super_admin', '2026-03-14 00:47:48', '2026-03-14 01:15:58', 1);

-- ----------------------------
-- Table structure for cards
-- ----------------------------
DROP TABLE IF EXISTS `cards`;
CREATE TABLE `cards`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL COMMENT '所属课程ID',
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '卡片标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '卡片内容(富文本)',
  `summary` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '内容摘要',
  `image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '配图URL',
  `audio_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '音频URL(TTS生成)',
  `difficulty` tinyint NULL DEFAULT 1 COMMENT '难度：1简单 2中等 3困难',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  `view_count` int NULL DEFAULT 0 COMMENT '浏览次数',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：0禁用 1正常',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_course_id`(`course_id` ASC) USING BTREE,
  CONSTRAINT `cards_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 42 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '知识卡片表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cards
-- ----------------------------
INSERT INTO `cards` VALUES (1, 2, '核心词汇 - ambiguous', '音标：/æmˈbɪɡjuəs/\n词性：形容词 (adj.)\n释义：模棱两可的；含糊不清的；有歧义的\n例句：The politician gave an ambiguous answer to avoid offending any voters.（这位政客给出了一个模棱两可的回答，以避免冒犯任何选民。）\n派生词：ambiguity (n. 歧义；含糊)\n', '形容词，意为 “模棱两可的”，常用来形容语言、态度等不明确。', '/uploads/images/cards/1775740936583_amgprg.png', '/uploads/audio/tts/tts_1775739541641_qi68op.mp3', 1, 0, 51, '2026-03-19 00:04:39', '2026-04-16 16:10:44', 1);
INSERT INTO `cards` VALUES (2, 2, '语法 - 虚拟语气（与过去事实相反）', '结构：If + 主语 + had + 过去分词，主语 + would/could/might + have + 过去分词含义：表示对过去已经发生事情的虚拟假设，即 “如果过去做了某事，就会 / 可能会……”例句：If I had studied harder, I would have passed the exam.（如果我当时学习更努力，我就会通过考试了。）变形：可省略 if，将 had 提前：Had I studied harder, I would have passed the exam.', '与过去事实相反的虚拟语气结构，用于表达对过去的遗憾或假设。', '/uploads/images/cards/1775740429237_kd5ch0.png', '/uploads/audio/tts/tts_1775739553877_krultt.mp3', 1, 0, 45, '2026-03-19 00:05:56', '2026-04-10 22:42:10', 1);
INSERT INTO `cards` VALUES (3, 3, '哲学的基本问题', '提出者：恩格斯\n内容：思维和存在（意识和物质）的关系问题\n两个方面：\n① 第一性：谁是本原？→ 划分唯物主义（物质第一）、唯心主义（意识第一）\n② 同一性：思维能否认识存在？→ 划分可知论（能认识）、不可知论（不能认识）\n\n', '哲学基本问题 = 物质与意识关系，分第一性（唯物 / 唯心）、同一性（可知 / 不可知）。', '', '/uploads/audio/tts/tts_1775741671575_3r4o9v.mp3', 1, 0, 21, '2026-04-09 21:34:24', '2026-04-16 16:54:32', 1);
INSERT INTO `cards` VALUES (4, 3, '物质的唯一特性', '列宁定义：物质是标志客观实在的哲学范畴\n唯一特性：客观实在性\n地位：不依赖于人的意识并能为人的意识所反映\n\n', '物质唯一特性 = 客观实在性，独立于意识、可被认知。', NULL, '/uploads/audio/tts/tts_1775742112932_7bswo6.mp3', 1, 0, 13, '2026-04-09 21:42:01', '2026-04-10 22:25:54', 1);
INSERT INTO `cards` VALUES (5, 3, '实践的本质与基本特征', '本质：人类能动地改造世界的社会性的物质活动\n三大特征：客观物质性、自觉能动性、社会历史性\n基本形式：物质生产实践（最基本）、社会政治实践、科学文化实践', '实践 = 能动改造世界的物质活动，三特征：客观、能动、社会历史。', NULL, '/uploads/audio/tts/tts_1775742244799_wr9qi0.mp3', 1, 0, 8, '2026-04-09 21:44:13', '2026-04-16 15:37:57', 1);
INSERT INTO `cards` VALUES (6, 3, '矛盾的普遍性与特殊性', '普遍性：矛盾无处不在、无时不有（共性）\n特殊性：不同事物 / 阶段矛盾各有特点（个性）\n关系：共性寓于个性之中，个性包含共性\n方法论：具体问题具体分析（马克思主义活的灵魂）\n\n', '矛盾共性（普遍）寓于个性（特殊），方法论：具体问题具体分析。', NULL, '/uploads/audio/tts/tts_1775742277204_09velq.mp3', 1, 0, 10, '2026-04-09 21:44:46', '2026-04-10 21:39:53', 1);
INSERT INTO `cards` VALUES (7, 3, '毛泽东思想活的灵魂', '三个基本方面：实事求是（精髓）、群众路线、独立自主\n群众路线：一切为了群众，一切依靠群众，从群众中来，到群众中去\n', '毛思想活的灵魂：实事求是（精髓）、群众路线、独立自主。', NULL, '/uploads/audio/tts/tts_1775742309275_spu3m7.mp3', 1, 0, 5, '2026-04-09 21:45:15', '2026-04-10 21:15:46', 1);
INSERT INTO `cards` VALUES (8, 3, '社会主义初级阶段的主要矛盾', '新时代表述：人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾\n决定因素：国情（初级阶段）、生产力发展水平\n', '新时代主要矛盾：美好生活需要 vs 发展不平衡不充分。\n', NULL, '/uploads/audio/tts/tts_1775742341619_qb9ojj.mp3', 1, 0, 5, '2026-04-09 21:45:51', '2026-04-10 21:15:48', 1);
INSERT INTO `cards` VALUES (9, 3, '新发展理念', '内容：创新、协调、绿色、开放、共享\n地位：习近平新时代中国特色社会主义经济思想的主要内容\n内涵：创新（第一动力）、协调（内在要求）、绿色（必要条件）、开放（必由之路）、共享（本质要求）\n', '新发展理念：创新、协调、绿色、开放、共享。', NULL, '/uploads/audio/tts/tts_1775742380798_y601mr.mp3', 1, 0, 5, '2026-04-09 21:46:27', '2026-04-10 21:15:49', 1);
INSERT INTO `cards` VALUES (10, 3, '全面深化改革总目标', '总目标：完善和发展中国特色社会主义制度，推进国家治理体系和治理能力现代化\n方向：坚持中国特色社会主义道路\n', '改革总目标：完善中国特色社会主义制度 + 推进国家治理现代化。\n', NULL, '/uploads/audio/tts/tts_1775742434897_j91qlk.mp3', 1, 0, 4, '2026-04-09 21:47:21', '2026-04-10 21:15:51', 1);
INSERT INTO `cards` VALUES (11, 3, '五四运动', '时间：1919 年 5 月 4 日\n导火索：巴黎和会外交失败\n意义：新民主主义革命的开端，促进马克思主义传播，为建党做思想干部准备\n', '五四运动 = 新民主主义革命开端，传播马克思主义。', NULL, '/uploads/audio/tts/tts_1775742458514_a7o49u.mp3', 1, 0, 4, '2026-04-09 21:47:44', '2026-04-10 21:15:52', 1);
INSERT INTO `cards` VALUES (12, 3, '中国共产党成立的意义', '时间：1921 年 7 月（中共一大）\n意义：开天辟地的大事变，中国革命有了坚强领导核心、科学指导思想、新的革命方法\n', '建党 = 开天辟地大事变，革命有领导、有指导、有方法。', NULL, '/uploads/audio/tts/tts_1775742493285_ophz3d.mp3', 1, 0, 4, '2026-04-09 21:48:19', '2026-04-10 21:15:53', 1);
INSERT INTO `cards` VALUES (13, 3, '遵义会议', '时间：1935 年 1 月\n内容：纠正王明 “左” 倾错误，确立毛泽东领导地位\n意义：生死攸关的转折点，党从幼稚走向成熟\n', '遵义会议 = 生死转折，确立毛领导，党走向成熟。', NULL, '/uploads/audio/tts/tts_1775742522109_oqu37t.mp3', 1, 0, 4, '2026-04-09 21:48:48', '2026-04-10 21:15:54', 1);
INSERT INTO `cards` VALUES (14, 3, '新中国成立的意义', '时间：1949 年 10 月 1 日\n意义：推翻三座大山，新民主主义革命基本胜利，中国进入新民主主义社会\n', '建国 = 新民主主义革命胜利，进入新民主主义社会。', NULL, '/uploads/audio/tts/tts_1775742549281_so8771.mp3', 1, 0, 4, '2026-04-09 21:49:15', '2026-04-10 21:15:55', 1);
INSERT INTO `cards` VALUES (15, 3, '人生观的核心', '人生观三内容：人生目的、人生态度、人生价值\n核心：人生目的（决定人生态度、人生价值）\n', '人生观核心 = 人生目的，决定态度与价值。', NULL, '/uploads/audio/tts/tts_1775742572713_00cadk.mp3', 1, 0, 4, '2026-04-09 21:49:43', '2026-04-10 21:15:55', 1);
INSERT INTO `cards` VALUES (16, 3, '社会主义核心价值观', '国家层面：富强、民主、文明、和谐\n社会层面：自由、平等、公正、法治\n个人层面：爱国、敬业、诚信、友善\n', '核心价值观：国家（富强民主文明和谐）、社会（自由平等公正法治）、个人（爱国敬业诚信友善）。\n', NULL, '/uploads/audio/tts/tts_1775742605016_0lejuk.mp3', 1, 0, 4, '2026-04-09 21:50:11', '2026-04-10 21:15:56', 1);
INSERT INTO `cards` VALUES (17, 3, '法律的本质', '本质：统治阶级意志的体现（我国 = 人民意志）\n特征：国家制定或认可、国家强制力保证实施\n', '法律本质 = 统治阶级意志（我国人民意志），国家强制力保障。', NULL, '/uploads/audio/tts/tts_1775742630119_gzkh1m.mp3', 1, 0, 6, '2026-04-09 21:50:38', '2026-04-10 21:16:39', 1);
INSERT INTO `cards` VALUES (18, 1, '等价无穷小（x→0）', '如图', 'x→0 常用等价无穷小，乘除可替换，加减需谨慎。', '/uploads/images/cards/1775743197968_4y32dx.png', NULL, 1, 0, 8, '2026-04-09 22:00:03', '2026-04-10 21:44:32', 1);
INSERT INTO `cards` VALUES (19, 1, '两个重要极限', '如图', 'sinx/x→1，(1+1/x)^x→e，是极限与未定式核心。\n', '/uploads/images/cards/1775743371400_2yx3cj.png', NULL, 1, 0, 7, '2026-04-09 22:02:58', '2026-04-10 21:39:57', 1);
INSERT INTO `cards` VALUES (20, 1, '导数定义', '如图', '导数是增量比极限，可导必连续，连续不一定可导。\n', '/uploads/images/cards/1775743426394_ts52rb.png', NULL, 1, 0, 10, '2026-04-09 22:03:47', '2026-04-10 21:55:43', 1);
INSERT INTO `cards` VALUES (21, 1, '常见求导公式', '如图', '基础函数求导公式 + 链式法则，求导核心工具。', '/uploads/images/cards/1775743472344_cg5x0n.png', NULL, 1, 0, 1, '2026-04-09 22:04:33', '2026-04-10 21:12:32', 1);
INSERT INTO `cards` VALUES (22, 1, '洛必达法则', '如图', '0/0、∞/∞ 可用洛必达，分子分母分别求导。', '/uploads/images/cards/1775743526325_9kv7v3.png', NULL, 1, 0, 1, '2026-04-09 22:05:27', '2026-04-10 21:12:35', 1);
INSERT INTO `cards` VALUES (23, 1, '极值与拐点判定', '如图', '一阶导为零找驻点，二阶断定极值；二阶导变号是拐点。', '/uploads/images/cards/1775743578095_7fbedj.png', NULL, 1, 0, 1, '2026-04-09 22:06:19', '2026-04-10 21:12:39', 1);
INSERT INTO `cards` VALUES (24, 1, '基本积分公式', '如图', '最常用不定积分公式，逆用求导。', '/uploads/images/cards/1775743606890_l5xhbb.png', NULL, 1, 0, 1, '2026-04-09 22:06:51', '2026-04-10 21:12:42', 1);
INSERT INTO `cards` VALUES (25, 1, '牛顿 - 莱布尼茨公式', '如图', '定积分 = 原函数在上、下限差值，连接不定积分与定积分。', '/uploads/images/cards/1775743641616_aprn9v.png', NULL, 1, 0, 1, '2026-04-09 22:07:26', '2026-04-10 21:12:44', 1);
INSERT INTO `cards` VALUES (26, 1, '换元积分与分部积分', '如图', '换元凑微分，分部降次，是积分两大核心方法。', '/uploads/images/cards/1775743695939_6sh7cd.png', NULL, 1, 0, 2, '2026-04-09 22:08:21', '2026-04-10 21:27:05', 1);
INSERT INTO `cards` VALUES (27, 1, '反常积分判敛', '如图', '无穷限 / 瑕积分 p 级数判敛，直接记结论。\n', '/uploads/images/cards/1775743750772_13gn6h.png', NULL, 1, 0, 1, '2026-04-09 22:09:22', '2026-04-10 21:27:07', 1);
INSERT INTO `cards` VALUES (28, 1, '偏导数定义', '如图', '偏导数即 “一元视另一变量为常数”，求导规则不变。\n', '/uploads/images/cards/1775743787165_gr1nxu.png', NULL, 1, 0, 1, '2026-04-09 22:09:57', '2026-04-10 21:27:08', 1);
INSERT INTO `cards` VALUES (29, 1, '全微分', '如图', '全微分 = 偏 dx + 偏 dy，可微强于连续与偏导存在。', '/uploads/images/cards/1775743850781_jh6bq2.png', NULL, 1, 0, 1, '2026-04-09 22:10:58', '2026-04-10 21:27:09', 1);
INSERT INTO `cards` VALUES (30, 1, '二重积分计算', '如图', '直角坐标穿线法，圆域用极坐标，注意 rdrdθ。', '/uploads/images/cards/1775743880904_a0k7se.png', NULL, 1, 0, 0, '2026-04-09 22:11:30', '2026-04-09 22:11:30', 1);
INSERT INTO `cards` VALUES (31, 1, '等比级数敛散性', '如图', '等比级数公比绝对值 < 1 收敛，否则发散。', '/uploads/images/cards/1775743918001_kes44e.png', NULL, 1, 0, 0, '2026-04-09 22:12:05', '2026-04-09 22:12:05', 1);
INSERT INTO `cards` VALUES (32, 1, '正项级数判敛', '如图', '正项级数用比值 / 比较，p 级数作参照。\n', '/uploads/images/cards/1775743951117_64lugr.png', NULL, 1, 0, 13, '2026-04-09 22:12:48', '2026-04-10 21:39:58', 1);
INSERT INTO `cards` VALUES (33, 4, '行列式性质', '如图', '行列式行变换规则，转置不变，数乘提 n 次方。\n', '/uploads/images/cards/1775744083959_ulhzrr.png', NULL, 1, 0, 16, '2026-04-09 22:14:54', '2026-04-16 14:38:54', 1);
INSERT INTO `cards` VALUES (34, 4, '矩阵乘法与逆矩阵', '如图', '矩阵乘法不交换，可逆等价于行列式非零、满秩。', '/uploads/images/cards/1775744213958_k68e1x.png', NULL, 1, 0, 8, '2026-04-09 22:17:13', '2026-04-16 16:50:59', 1);
INSERT INTO `cards` VALUES (35, 4, '线性相关与无关', '如图', '向量组秩 < 个数则相关，n+1 个 n 维必相关。\n', '/uploads/images/cards/1775744262664_cl5jee.png', NULL, 1, 0, 11, '2026-04-09 22:17:56', '2026-04-10 21:36:08', 1);
INSERT INTO `cards` VALUES (36, 4, '特征值与特征向量', '如图', '特征方程求 λ，迹 = 特征值和，行列式 = 乘积。\n', '/uploads/images/cards/1775744312544_7glw23.png', NULL, 1, 0, 12, '2026-04-09 22:18:57', '2026-04-16 14:38:50', 1);
INSERT INTO `cards` VALUES (37, 4, '相似与对角化', '如图', '相似保行列式与迹；实对称阵必可正交对角化。', '/uploads/images/cards/1775744358304_xbydiw.png', NULL, 1, 0, 11, '2026-04-09 22:19:26', '2026-04-16 14:38:52', 1);
INSERT INTO `cards` VALUES (38, 5, '加法公式与乘法公式', '如图', '并集减交，条件概率得乘法，独立即乘积。', '/uploads/images/cards/1775744473942_53ji32.png', NULL, 1, 0, 12, '2026-04-09 22:21:24', '2026-04-10 21:54:22', 1);
INSERT INTO `cards` VALUES (39, 5, '常见分布期望方差', '如图', '0-1、二项、泊松、正态的期望与方差直接记。\n', '/uploads/images/cards/1775744508467_itcudd.png', NULL, 1, 0, 19, '2026-04-09 22:21:56', '2026-04-10 21:55:34', 1);
INSERT INTO `cards` VALUES (40, 5, '二维期望与协方差', '如图', '和的期望 = 期望和；方差含协方差；独立必不相关。\n', '/uploads/images/cards/1775744544303_tz9kzm.png', NULL, 1, 0, 12, '2026-04-09 22:22:41', '2026-04-10 21:55:36', 1);
INSERT INTO `cards` VALUES (41, 5, '大数定律与中心极限定理', '大数定律：样本均值依概率收敛于期望\n中心极限定理：大量独立同分布和近似正态分布', '均值稳定于期望，大量和近似正态。', NULL, NULL, 1, 0, 9, '2026-04-09 22:23:04', '2026-04-10 21:55:38', 1);

-- ----------------------------
-- Table structure for courses
-- ----------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '课程名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '课程描述',
  `icon` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '课程图标URL',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序',
  `card_count` int NULL DEFAULT 0 COMMENT '卡片数量',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：0禁用 1正常',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '课程分类表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of courses
-- ----------------------------
INSERT INTO `courses` VALUES (1, '高等数学', '大学高等数学基础知识，包含极限、导数、积分等核心内容', NULL, 1, 15, '2026-03-14 00:47:48', '2026-04-09 22:12:48', 1);
INSERT INTO `courses` VALUES (2, '大学英语', '大学英语四六级核心词汇与语法知识', NULL, 2, -1, '2026-03-14 00:47:48', '2026-04-10 22:25:34', 1);
INSERT INTO `courses` VALUES (3, '思想政治', '马克思主义基本原理、毛泽东思想等政治理论知识', NULL, 3, 14, '2026-03-14 00:47:48', '2026-04-10 22:25:46', 1);
INSERT INTO `courses` VALUES (4, '线性代数', '大学线性代数相关知识，包括行列式、矩阵等。', NULL, 0, 5, '2026-04-09 22:13:01', '2026-04-10 22:46:23', 1);
INSERT INTO `courses` VALUES (5, '概率论与数理统计', '概率论与数理统计相关知识点', NULL, 0, 4, '2026-04-09 22:20:03', '2026-04-09 22:23:04', 1);

-- ----------------------------
-- Table structure for learning_logs
-- ----------------------------
DROP TABLE IF EXISTS `learning_logs`;
CREATE TABLE `learning_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `card_id` int NULL DEFAULT NULL COMMENT '卡片ID',
  `course_id` int NULL DEFAULT NULL COMMENT '课程ID',
  `action_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '行为类型：view/listen/review/quiz',
  `duration` int NULL DEFAULT 0 COMMENT '学习时长(秒)',
  `learning_mode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'static' COMMENT '学习模式：static静态/dynamic动态',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `log_date` date NULL DEFAULT (curdate()) COMMENT '日志日期',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_user_date`(`user_id` ASC, `log_date` ASC) USING BTREE,
  INDEX `idx_log_date`(`log_date` ASC) USING BTREE,
  CONSTRAINT `learning_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学习日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of learning_logs
-- ----------------------------
INSERT INTO `learning_logs` VALUES (16, 14, 2, 2, 'view', 14, 'static', '2026-03-31 20:21:06', '2026-03-31');
INSERT INTO `learning_logs` VALUES (17, 14, 1, 2, 'view', 7, 'static', '2026-03-31 20:21:16', '2026-03-31');
INSERT INTO `learning_logs` VALUES (18, 14, 2, 2, 'view', 9, 'static', '2026-03-31 20:22:05', '2026-03-31');
INSERT INTO `learning_logs` VALUES (19, 14, 2, 2, 'view', 305, 'static', '2026-03-31 20:29:07', '2026-03-31');
INSERT INTO `learning_logs` VALUES (20, 14, 1, 2, 'view', 7, 'static', '2026-04-09 20:52:19', '2026-04-09');
INSERT INTO `learning_logs` VALUES (21, 14, 2, 2, 'listen', 8, 'dynamic', '2026-04-09 20:54:39', '2026-04-09');
INSERT INTO `learning_logs` VALUES (22, 14, 2, 2, 'listen', 18, 'dynamic', '2026-04-09 20:56:24', '2026-04-09');
INSERT INTO `learning_logs` VALUES (23, 14, 1, 2, 'listen', 57, 'dynamic', '2026-04-09 20:57:22', '2026-04-09');
INSERT INTO `learning_logs` VALUES (24, 14, 2, 2, 'view', 29, 'static', '2026-04-09 21:00:12', '2026-04-09');
INSERT INTO `learning_logs` VALUES (25, 14, 1, 2, 'listen', 44, 'dynamic', '2026-04-09 21:00:58', '2026-04-09');
INSERT INTO `learning_logs` VALUES (26, 14, 2, 2, 'listen', 32, 'dynamic', '2026-04-09 21:02:37', '2026-04-09');
INSERT INTO `learning_logs` VALUES (27, 14, 1, 2, 'view', 233, 'static', '2026-04-09 21:06:30', '2026-04-09');
INSERT INTO `learning_logs` VALUES (28, 14, 2, 2, 'view', 15, 'static', '2026-04-09 21:07:57', '2026-04-09');
INSERT INTO `learning_logs` VALUES (29, 14, 1, 2, 'view', 13, 'static', '2026-04-09 21:08:37', '2026-04-09');
INSERT INTO `learning_logs` VALUES (30, 14, 2, 2, 'view', 9, 'static', '2026-04-09 21:08:48', '2026-04-09');
INSERT INTO `learning_logs` VALUES (31, 14, 1, 2, 'view', 7, 'static', '2026-04-09 21:08:57', '2026-04-09');
INSERT INTO `learning_logs` VALUES (32, 14, 1, 2, 'view', 15, 'static', '2026-04-09 21:09:26', '2026-04-09');
INSERT INTO `learning_logs` VALUES (33, 14, 1, 2, 'view', 12, 'static', '2026-04-09 21:22:53', '2026-04-09');
INSERT INTO `learning_logs` VALUES (34, 14, 2, 2, 'view', 104, 'static', '2026-04-09 21:24:39', '2026-04-09');
INSERT INTO `learning_logs` VALUES (35, 14, 18, 1, 'view', 18, 'static', '2026-04-09 22:00:31', '2026-04-09');
INSERT INTO `learning_logs` VALUES (36, 14, 3, 3, 'listen', 29, 'dynamic', '2026-04-09 22:01:05', '2026-04-09');
INSERT INTO `learning_logs` VALUES (37, 14, 6, 3, 'listen', 23, 'dynamic', '2026-04-09 22:01:30', '2026-04-09');
INSERT INTO `learning_logs` VALUES (38, 14, 38, 5, 'view', 10, 'static', '2026-04-09 22:32:41', '2026-04-09');
INSERT INTO `learning_logs` VALUES (39, 14, 20, 1, 'view', 7, 'static', '2026-04-09 22:35:21', '2026-04-09');
INSERT INTO `learning_logs` VALUES (40, 14, 33, 4, 'view', 12, 'static', '2026-04-09 22:36:33', '2026-04-09');
INSERT INTO `learning_logs` VALUES (41, 14, 37, 4, 'view', 22, 'static', '2026-04-09 22:37:02', '2026-04-09');
INSERT INTO `learning_logs` VALUES (42, 14, 36, 4, 'view', 122, 'static', '2026-04-09 22:39:19', '2026-04-09');
INSERT INTO `learning_logs` VALUES (43, 14, 38, 5, 'view', 1397, 'static', '2026-04-09 23:03:13', '2026-04-09');
INSERT INTO `learning_logs` VALUES (44, 14, 19, 1, 'view', 18, 'static', '2026-04-10 21:13:24', '2026-04-10');
INSERT INTO `learning_logs` VALUES (45, 14, 18, 1, 'view', 6, 'static', '2026-04-10 21:44:39', '2026-04-10');
INSERT INTO `learning_logs` VALUES (46, 14, 33, 4, 'view', 10, 'static', '2026-04-10 21:47:32', '2026-04-10');
INSERT INTO `learning_logs` VALUES (47, 14, 20, 1, 'view', 6, 'static', '2026-04-10 21:55:49', '2026-04-10');
INSERT INTO `learning_logs` VALUES (48, 14, 3, 3, 'view', 9, 'static', '2026-04-10 22:51:39', '2026-04-10');
INSERT INTO `learning_logs` VALUES (49, 14, 3, 3, 'view', 8, 'static', '2026-04-10 22:51:49', '2026-04-10');
INSERT INTO `learning_logs` VALUES (50, 14, 34, 4, 'view', 3, 'static', '2026-04-16 14:38:49', '2026-04-16');
INSERT INTO `learning_logs` VALUES (51, 14, 33, 4, 'view', 3, 'static', '2026-04-16 14:38:58', '2026-04-16');
INSERT INTO `learning_logs` VALUES (52, 14, 5, 3, 'view', 17, 'static', '2026-04-16 15:38:15', '2026-04-16');
INSERT INTO `learning_logs` VALUES (53, 14, 1, 2, 'view', 4, 'static', '2026-04-16 15:38:32', '2026-04-16');
INSERT INTO `learning_logs` VALUES (54, 14, 3, 3, 'view', 17, 'static', '2026-04-16 15:40:00', '2026-04-16');

-- ----------------------------
-- Table structure for quiz_records
-- ----------------------------
DROP TABLE IF EXISTS `quiz_records`;
CREATE TABLE `quiz_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `quiz_id` int NOT NULL COMMENT '题目ID',
  `card_id` int NOT NULL COMMENT '卡片ID',
  `user_answer` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户答案',
  `is_correct` tinyint NULL DEFAULT 0 COMMENT '是否正确：0错 1对',
  `time_spent` int NULL DEFAULT 0 COMMENT '答题耗时(秒)',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_user_wrong`(`user_id` ASC, `is_correct` ASC) USING BTREE,
  INDEX `quiz_id`(`quiz_id` ASC) USING BTREE,
  INDEX `card_id`(`card_id` ASC) USING BTREE,
  CONSTRAINT `quiz_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `quiz_records_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `quiz_records_ibfk_3` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '测验记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of quiz_records
-- ----------------------------
INSERT INTO `quiz_records` VALUES (1, 14, 4, 3, '哲学的基本问题由马克思提出，核心是思维与存在的辩证关系问题', 0, 0, '2026-04-10 22:51:45');
INSERT INTO `quiz_records` VALUES (2, 14, 4, 3, '哲学的基本问题由马克思提出，核心是思维与存在的辩证关系问题', 0, 0, '2026-04-10 22:52:00');
INSERT INTO `quiz_records` VALUES (3, 14, 4, 3, '认为物质第一性、意识第二性的观点，属于唯物主义阵营', 1, 0, '2026-04-16 15:39:54');
INSERT INTO `quiz_records` VALUES (4, 14, 4, 3, '哲学基本问题的第一性问题，划分了可知论与不可知论', 0, 0, '2026-04-16 15:40:10');

-- ----------------------------
-- Table structure for quizzes
-- ----------------------------
DROP TABLE IF EXISTS `quizzes`;
CREATE TABLE `quizzes`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `card_id` int NOT NULL COMMENT '关联卡片ID',
  `question` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '题目内容',
  `question_type` tinyint NULL DEFAULT 1 COMMENT '题型：1单选 2多选 3判断 4填空',
  `options` json NULL COMMENT '选项(JSON数组)',
  `answer` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '正确答案',
  `explanation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '答案解析',
  `sort_order` int NULL DEFAULT 0,
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` tinyint NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_card_id`(`card_id` ASC) USING BTREE,
  CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '测验题目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of quizzes
-- ----------------------------
INSERT INTO `quizzes` VALUES (4, 3, '关于哲学的基本问题，下列说法正确的是（ ）', 1, '[\"哲学的基本问题由马克思提出，核心是思维与存在的辩证关系问题\", \"哲学基本问题的第一性问题，划分了可知论与不可知论\", \"认为物质第一性、意识第二性的观点，属于唯物主义阵营\", \"认为思维不能认识存在的观点，属于唯心主义\"]', 'C', 'A 错误：哲学的基本问题是由恩格斯提出的，而非马克思；且哲学基本问题是思维和存在的关系问题，不是 “辩证关系问题”。\nB 错误：哲学基本问题的 ** 第一性（谁是本原）** 划分了唯物主义和唯心主义；** 同一性（思维能否认识存在）** 才划分了可知论与不可知论。\nC 正确：唯物主义的根本观点就是承认物质第一性，意识第二性，物质决定意识。\nD 错误：认为思维不能认识存在的观点属于不可知论，唯心主义是根据 “第一性” 问题划分的，二者范畴不同。', 0, '2026-04-10 22:44:14', '2026-04-10 22:50:31', 1);

-- ----------------------------
-- Table structure for review_plans
-- ----------------------------
DROP TABLE IF EXISTS `review_plans`;
CREATE TABLE `review_plans`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `card_id` int NOT NULL COMMENT '卡片ID',
  `plan_date` date NOT NULL COMMENT '计划复习日期',
  `review_stage` tinyint NULL DEFAULT 1 COMMENT '复习阶段：1/2/3/4/5/6对应1/2/4/7/15/30天',
  `is_completed` tinyint NULL DEFAULT 0 COMMENT '是否完成：0否 1是',
  `completed_at` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_date`(`user_id` ASC, `plan_date` ASC) USING BTREE,
  INDEX `idx_plan_date`(`plan_date` ASC) USING BTREE,
  INDEX `card_id`(`card_id` ASC) USING BTREE,
  CONSTRAINT `review_plans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `review_plans_ibfk_2` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 57 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '复习计划表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of review_plans
-- ----------------------------
INSERT INTO `review_plans` VALUES (4, 14, 2, '2026-04-01', 1, 1, '2026-04-09 20:52:05', '2026-03-31 20:22:00');
INSERT INTO `review_plans` VALUES (5, 14, 1, '2026-03-31', 1, 1, '2026-04-09 20:52:06', '2026-03-31 21:40:49');
INSERT INTO `review_plans` VALUES (6, 14, 1, '2026-04-11', 2, 1, '2026-04-09 20:52:06', '2026-04-09 20:52:03');
INSERT INTO `review_plans` VALUES (7, 14, 2, '2026-04-11', 2, 1, '2026-04-09 20:52:05', '2026-04-09 20:52:05');
INSERT INTO `review_plans` VALUES (8, 14, 2, '2026-04-10', 1, 0, NULL, '2026-04-09 20:52:05');
INSERT INTO `review_plans` VALUES (9, 14, 1, '2026-04-10', 1, 0, NULL, '2026-04-09 20:52:06');
INSERT INTO `review_plans` VALUES (10, 14, 18, '2026-04-09', 1, 1, '2026-04-10 21:12:55', '2026-04-09 22:00:12');
INSERT INTO `review_plans` VALUES (11, 14, 3, '2026-04-09', 1, 1, '2026-04-10 21:32:43', '2026-04-09 22:00:36');
INSERT INTO `review_plans` VALUES (12, 14, 6, '2026-04-09', 1, 1, '2026-04-10 21:39:56', '2026-04-09 22:01:07');
INSERT INTO `review_plans` VALUES (13, 14, 19, '2026-04-09', 1, 1, '2026-04-10 21:39:58', '2026-04-09 22:31:45');
INSERT INTO `review_plans` VALUES (14, 14, 32, '2026-04-09', 1, 1, '2026-04-10 21:40:01', '2026-04-09 22:31:52');
INSERT INTO `review_plans` VALUES (15, 14, 38, '2026-04-09', 1, 1, '2026-04-10 21:40:02', '2026-04-09 22:32:31');
INSERT INTO `review_plans` VALUES (16, 14, 39, '2026-04-09', 1, 1, '2026-04-10 21:55:35', '2026-04-09 22:32:52');
INSERT INTO `review_plans` VALUES (17, 14, 40, '2026-04-09', 1, 1, '2026-04-10 21:55:38', '2026-04-09 22:32:55');
INSERT INTO `review_plans` VALUES (18, 14, 41, '2026-04-09', 1, 1, '2026-04-10 21:55:41', '2026-04-09 22:32:59');
INSERT INTO `review_plans` VALUES (19, 14, 4, '2026-04-09', 1, 1, '2026-04-10 21:55:42', '2026-04-09 22:33:35');
INSERT INTO `review_plans` VALUES (20, 14, 20, '2026-04-09', 1, 1, '2026-04-10 21:55:49', '2026-04-09 22:33:57');
INSERT INTO `review_plans` VALUES (21, 14, 33, '2026-04-09', 1, 1, '2026-04-10 21:59:14', '2026-04-09 22:36:21');
INSERT INTO `review_plans` VALUES (22, 14, 37, '2026-04-09', 1, 0, NULL, '2026-04-09 22:36:33');
INSERT INTO `review_plans` VALUES (23, 14, 36, '2026-04-09', 1, 1, '2026-04-10 21:30:40', '2026-04-09 22:37:04');
INSERT INTO `review_plans` VALUES (24, 14, 35, '2026-04-09', 1, 1, '2026-04-10 21:30:26', '2026-04-09 22:37:07');
INSERT INTO `review_plans` VALUES (25, 14, 34, '2026-04-09', 1, 0, NULL, '2026-04-09 22:37:10');
INSERT INTO `review_plans` VALUES (26, 14, 21, '2026-04-10', 1, 0, NULL, '2026-04-10 21:12:32');
INSERT INTO `review_plans` VALUES (27, 14, 22, '2026-04-10', 1, 0, NULL, '2026-04-10 21:12:35');
INSERT INTO `review_plans` VALUES (28, 14, 23, '2026-04-10', 1, 0, NULL, '2026-04-10 21:12:39');
INSERT INTO `review_plans` VALUES (29, 14, 24, '2026-04-10', 1, 0, NULL, '2026-04-10 21:12:42');
INSERT INTO `review_plans` VALUES (30, 14, 25, '2026-04-10', 1, 0, NULL, '2026-04-10 21:12:44');
INSERT INTO `review_plans` VALUES (31, 14, 18, '2026-04-12', 2, 0, NULL, '2026-04-10 21:12:55');
INSERT INTO `review_plans` VALUES (32, 14, 5, '2026-04-10', 1, 0, NULL, '2026-04-10 21:13:48');
INSERT INTO `review_plans` VALUES (33, 14, 7, '2026-04-10', 1, 0, NULL, '2026-04-10 21:13:51');
INSERT INTO `review_plans` VALUES (34, 14, 8, '2026-04-10', 1, 0, NULL, '2026-04-10 21:13:52');
INSERT INTO `review_plans` VALUES (35, 14, 9, '2026-04-10', 1, 0, NULL, '2026-04-10 21:13:53');
INSERT INTO `review_plans` VALUES (36, 14, 10, '2026-04-10', 1, 0, NULL, '2026-04-10 21:14:55');
INSERT INTO `review_plans` VALUES (37, 14, 11, '2026-04-10', 1, 0, NULL, '2026-04-10 21:14:58');
INSERT INTO `review_plans` VALUES (38, 14, 12, '2026-04-10', 1, 0, NULL, '2026-04-10 21:14:59');
INSERT INTO `review_plans` VALUES (39, 14, 13, '2026-04-10', 1, 0, NULL, '2026-04-10 21:15:00');
INSERT INTO `review_plans` VALUES (40, 14, 14, '2026-04-10', 1, 0, NULL, '2026-04-10 21:15:01');
INSERT INTO `review_plans` VALUES (41, 14, 15, '2026-04-10', 1, 0, NULL, '2026-04-10 21:15:02');
INSERT INTO `review_plans` VALUES (42, 14, 16, '2026-04-10', 1, 0, NULL, '2026-04-10 21:15:03');
INSERT INTO `review_plans` VALUES (43, 14, 17, '2026-04-10', 1, 0, NULL, '2026-04-10 21:15:04');
INSERT INTO `review_plans` VALUES (44, 14, 35, '2026-04-12', 2, 0, NULL, '2026-04-10 21:30:26');
INSERT INTO `review_plans` VALUES (45, 14, 36, '2026-04-12', 2, 0, NULL, '2026-04-10 21:30:40');
INSERT INTO `review_plans` VALUES (46, 14, 3, '2026-04-12', 2, 0, NULL, '2026-04-10 21:32:43');
INSERT INTO `review_plans` VALUES (47, 14, 6, '2026-04-12', 2, 0, NULL, '2026-04-10 21:39:56');
INSERT INTO `review_plans` VALUES (48, 14, 19, '2026-04-12', 2, 0, NULL, '2026-04-10 21:39:58');
INSERT INTO `review_plans` VALUES (49, 14, 32, '2026-04-12', 2, 0, NULL, '2026-04-10 21:40:01');
INSERT INTO `review_plans` VALUES (50, 14, 38, '2026-04-12', 2, 0, NULL, '2026-04-10 21:40:02');
INSERT INTO `review_plans` VALUES (51, 14, 39, '2026-04-12', 2, 0, NULL, '2026-04-10 21:55:35');
INSERT INTO `review_plans` VALUES (52, 14, 40, '2026-04-12', 2, 0, NULL, '2026-04-10 21:55:38');
INSERT INTO `review_plans` VALUES (53, 14, 41, '2026-04-12', 2, 0, NULL, '2026-04-10 21:55:41');
INSERT INTO `review_plans` VALUES (54, 14, 4, '2026-04-12', 2, 0, NULL, '2026-04-10 21:55:42');
INSERT INTO `review_plans` VALUES (55, 14, 20, '2026-04-12', 2, 0, NULL, '2026-04-10 21:55:49');
INSERT INTO `review_plans` VALUES (56, 14, 33, '2026-04-12', 2, 0, NULL, '2026-04-10 21:59:14');

-- ----------------------------
-- Table structure for user_daily_stats
-- ----------------------------
DROP TABLE IF EXISTS `user_daily_stats`;
CREATE TABLE `user_daily_stats`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `stat_date` date NOT NULL COMMENT '统计日期',
  `study_duration` int NULL DEFAULT 0 COMMENT '学习时长(秒)',
  `cards_learned` int NULL DEFAULT 0 COMMENT '学习卡片数',
  `cards_reviewed` int NULL DEFAULT 0 COMMENT '复习卡片数',
  `quiz_count` int NULL DEFAULT 0 COMMENT '答题数',
  `correct_count` int NULL DEFAULT 0 COMMENT '答对数',
  `is_checked_in` tinyint NULL DEFAULT 0 COMMENT '是否打卡',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_date`(`user_id` ASC, `stat_date` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `user_daily_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户每日统计表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_daily_stats
-- ----------------------------
INSERT INTO `user_daily_stats` VALUES (5, 14, '2026-03-31', 335, 2, 0, 0, 0, 0, '2026-03-31 20:21:06', '2026-03-31 20:29:07');
INSERT INTO `user_daily_stats` VALUES (6, 14, '2026-04-09', 2243, 10, 4, 0, 0, 1, '2026-04-09 20:51:41', '2026-04-09 23:03:13');
INSERT INTO `user_daily_stats` VALUES (7, 14, '2026-04-10', 57, 5, 14, 2, 0, 1, '2026-04-10 19:34:47', '2026-04-10 22:52:00');
INSERT INTO `user_daily_stats` VALUES (8, 14, '2026-04-16', 44, 5, 0, 2, 1, 0, '2026-04-16 14:38:49', '2026-04-16 15:40:10');

-- ----------------------------
-- Table structure for user_progress
-- ----------------------------
DROP TABLE IF EXISTS `user_progress`;
CREATE TABLE `user_progress`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `card_id` int NOT NULL COMMENT '卡片ID',
  `mastery_level` tinyint NULL DEFAULT 0 COMMENT '掌握程度：0未学 1了解 2熟悉 3掌握 4精通',
  `review_count` int NULL DEFAULT 0 COMMENT '复习次数',
  `correct_count` int NULL DEFAULT 0 COMMENT '答对次数',
  `wrong_count` int NULL DEFAULT 0 COMMENT '答错次数',
  `last_study_at` datetime NULL DEFAULT NULL COMMENT '最后学习时间',
  `next_review_at` datetime NULL DEFAULT NULL COMMENT '下次复习时间(艾宾浩斯)',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_card`(`user_id` ASC, `card_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_next_review`(`next_review_at` ASC) USING BTREE,
  INDEX `card_id`(`card_id` ASC) USING BTREE,
  CONSTRAINT `user_progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_progress_ibfk_2` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 42 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户学习进度表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_progress
-- ----------------------------
INSERT INTO `user_progress` VALUES (3, 14, 2, 4, 2, 1, 1, '2026-04-09 21:24:39', NULL, '2026-03-31 20:20:54', '2026-04-09 21:24:39');
INSERT INTO `user_progress` VALUES (4, 14, 1, 4, 2, 1, 1, '2026-04-16 15:38:32', NULL, '2026-03-31 20:21:09', '2026-04-16 15:38:32');
INSERT INTO `user_progress` VALUES (5, 14, 18, 1, 1, 1, 0, '2026-04-10 21:44:39', NULL, '2026-04-09 22:00:12', '2026-04-10 21:44:39');
INSERT INTO `user_progress` VALUES (6, 14, 3, 2, 1, 2, 3, '2026-04-16 15:40:00', '2026-04-12 21:32:43', '2026-04-09 22:00:36', '2026-04-16 15:40:10');
INSERT INTO `user_progress` VALUES (7, 14, 6, 2, 1, 1, 0, '2026-04-10 21:39:56', '2026-04-12 21:39:56', '2026-04-09 22:01:07', '2026-04-10 21:39:56');
INSERT INTO `user_progress` VALUES (8, 14, 19, 2, 1, 1, 0, '2026-04-10 21:39:58', '2026-04-12 21:39:58', '2026-04-09 22:31:45', '2026-04-10 21:39:58');
INSERT INTO `user_progress` VALUES (9, 14, 32, 2, 1, 1, 0, '2026-04-10 21:40:01', '2026-04-12 21:40:01', '2026-04-09 22:31:52', '2026-04-10 21:40:01');
INSERT INTO `user_progress` VALUES (10, 14, 38, 4, 1, 1, 0, '2026-04-10 21:40:02', '2026-04-12 21:40:02', '2026-04-09 22:32:31', '2026-04-10 21:54:23');
INSERT INTO `user_progress` VALUES (11, 14, 39, 2, 1, 1, 0, '2026-04-10 21:55:35', '2026-04-12 21:55:35', '2026-04-09 22:32:52', '2026-04-10 21:55:35');
INSERT INTO `user_progress` VALUES (12, 14, 40, 2, 1, 1, 0, '2026-04-10 21:55:38', '2026-04-12 21:55:38', '2026-04-09 22:32:55', '2026-04-10 21:55:38');
INSERT INTO `user_progress` VALUES (13, 14, 41, 2, 1, 1, 0, '2026-04-10 21:55:41', '2026-04-12 21:55:41', '2026-04-09 22:32:59', '2026-04-10 21:55:41');
INSERT INTO `user_progress` VALUES (14, 14, 4, 2, 1, 1, 0, '2026-04-10 21:55:42', '2026-04-12 21:55:42', '2026-04-09 22:33:35', '2026-04-10 21:55:42');
INSERT INTO `user_progress` VALUES (15, 14, 20, 2, 1, 1, 0, '2026-04-10 21:55:49', '2026-04-12 21:55:49', '2026-04-09 22:33:57', '2026-04-10 21:55:49');
INSERT INTO `user_progress` VALUES (16, 14, 33, 2, 1, 1, 0, '2026-04-16 14:38:58', '2026-04-12 21:59:14', '2026-04-09 22:36:21', '2026-04-16 14:38:58');
INSERT INTO `user_progress` VALUES (17, 14, 37, 2, 0, 0, 0, '2026-04-09 22:37:02', '2026-04-09 22:36:33', '2026-04-09 22:36:33', '2026-04-09 22:37:02');
INSERT INTO `user_progress` VALUES (18, 14, 36, 1, 1, 1, 0, '2026-04-10 21:30:40', '2026-04-09 22:37:04', '2026-04-09 22:37:04', '2026-04-10 21:30:40');
INSERT INTO `user_progress` VALUES (19, 14, 35, 1, 1, 1, 0, '2026-04-10 21:30:26', NULL, '2026-04-09 22:37:07', '2026-04-10 21:30:26');
INSERT INTO `user_progress` VALUES (20, 14, 34, 1, 0, 0, 0, '2026-04-16 14:38:49', '2026-04-09 22:37:10', '2026-04-09 22:37:10', '2026-04-16 14:38:49');
INSERT INTO `user_progress` VALUES (21, 14, 21, 1, 0, 0, 0, '2026-04-10 21:12:32', NULL, '2026-04-10 21:12:32', '2026-04-10 21:12:32');
INSERT INTO `user_progress` VALUES (22, 14, 22, 1, 0, 0, 0, '2026-04-10 21:12:35', NULL, '2026-04-10 21:12:35', '2026-04-10 21:12:35');
INSERT INTO `user_progress` VALUES (23, 14, 23, 1, 0, 0, 0, '2026-04-10 21:12:39', NULL, '2026-04-10 21:12:39', '2026-04-10 21:12:39');
INSERT INTO `user_progress` VALUES (24, 14, 24, 1, 0, 0, 0, '2026-04-10 21:12:42', NULL, '2026-04-10 21:12:42', '2026-04-10 21:12:42');
INSERT INTO `user_progress` VALUES (25, 14, 25, 1, 0, 0, 0, '2026-04-10 21:12:44', NULL, '2026-04-10 21:12:44', '2026-04-10 21:12:44');
INSERT INTO `user_progress` VALUES (26, 14, 5, 1, 0, 0, 0, '2026-04-16 15:38:15', NULL, '2026-04-10 21:13:48', '2026-04-16 15:38:15');
INSERT INTO `user_progress` VALUES (27, 14, 7, 1, 0, 0, 0, '2026-04-10 21:13:51', NULL, '2026-04-10 21:13:51', '2026-04-10 21:13:51');
INSERT INTO `user_progress` VALUES (28, 14, 8, 1, 0, 0, 0, '2026-04-10 21:13:52', NULL, '2026-04-10 21:13:52', '2026-04-10 21:13:52');
INSERT INTO `user_progress` VALUES (29, 14, 9, 1, 0, 0, 0, '2026-04-10 21:13:53', NULL, '2026-04-10 21:13:53', '2026-04-10 21:13:53');
INSERT INTO `user_progress` VALUES (30, 14, 10, 1, 0, 0, 0, '2026-04-10 21:14:55', NULL, '2026-04-10 21:14:55', '2026-04-10 21:14:55');
INSERT INTO `user_progress` VALUES (31, 14, 11, 1, 0, 0, 0, '2026-04-10 21:14:58', '2026-04-10 21:14:58', '2026-04-10 21:14:58', '2026-04-10 21:14:58');
INSERT INTO `user_progress` VALUES (32, 14, 12, 1, 0, 0, 0, '2026-04-10 21:14:59', '2026-04-10 21:14:59', '2026-04-10 21:14:59', '2026-04-10 21:14:59');
INSERT INTO `user_progress` VALUES (33, 14, 13, 1, 0, 0, 0, '2026-04-10 21:15:00', '2026-04-10 21:15:00', '2026-04-10 21:15:00', '2026-04-10 21:15:00');
INSERT INTO `user_progress` VALUES (34, 14, 14, 1, 0, 0, 0, '2026-04-10 21:15:01', NULL, '2026-04-10 21:15:01', '2026-04-10 21:15:01');
INSERT INTO `user_progress` VALUES (35, 14, 15, 1, 0, 0, 0, '2026-04-10 21:15:02', NULL, '2026-04-10 21:15:02', '2026-04-10 21:15:02');
INSERT INTO `user_progress` VALUES (36, 14, 16, 1, 0, 0, 0, '2026-04-10 21:15:03', '2026-04-10 21:15:03', '2026-04-10 21:15:03', '2026-04-10 21:15:03');
INSERT INTO `user_progress` VALUES (37, 14, 17, 1, 0, 0, 0, '2026-04-10 21:15:04', NULL, '2026-04-10 21:15:04', '2026-04-10 21:15:04');
INSERT INTO `user_progress` VALUES (38, 14, 26, 1, 0, 0, 0, '2026-04-10 21:27:05', NULL, '2026-04-10 21:27:05', '2026-04-10 21:27:05');
INSERT INTO `user_progress` VALUES (39, 14, 27, 1, 0, 0, 0, '2026-04-10 21:27:07', NULL, '2026-04-10 21:27:07', '2026-04-10 21:27:07');
INSERT INTO `user_progress` VALUES (40, 14, 28, 1, 0, 0, 0, '2026-04-10 21:27:08', NULL, '2026-04-10 21:27:08', '2026-04-10 21:27:08');
INSERT INTO `user_progress` VALUES (41, 14, 29, 1, 0, 0, 0, '2026-04-10 21:27:09', NULL, '2026-04-10 21:27:09', '2026-04-10 21:27:09');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `openid` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '微信openid',
  `union_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '微信unionid',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `gender` tinyint NULL DEFAULT 0 COMMENT '性别：0未知 1男 2女',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_at` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `status` tinyint NULL DEFAULT 1 COMMENT '状态：0禁用 1正常',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `openid`(`openid` ASC) USING BTREE,
  INDEX `idx_openid`(`openid` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (14, 'oG6YJ7oGwNGiLtGzSC1xhe2k5KWI', NULL, 'Hance', '/uploads/images/avatars/1776321477123_0ocq1d.jpg', 0, NULL, '2026-03-31 20:07:03', '2026-04-16 16:50:54', '2026-04-16 16:50:54', 1);

SET FOREIGN_KEY_CHECKS = 1;
