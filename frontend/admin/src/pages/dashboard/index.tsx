import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { BookOutlined, CreditCardOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons';
import { getCourseList } from '../../services/course';
import { getCardList } from '../../services/card';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    courseCount: 0,
    cardCount: 0,
    userCount: 0,
    viewCount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [courseRes, cardRes] = await Promise.all([
          getCourseList(),
          getCardList({ pageSize: 1 }),
        ]);
        
        setStats({
          courseCount: courseRes.data.length,
          cardCount: cardRes.data.pagination.total,
          userCount: 0,
          viewCount: 0,
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="课程总数"
              value={stats.courseCount}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="卡片总数"
              value={stats.cardCount}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={stats.userCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总浏览量"
              value={stats.viewCount}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快速入门" style={{ marginTop: 24 }}>
        <p>欢迎使用大学生碎片化学习系统管理后台！</p>
        <ul>
          <li>在【课程管理】中创建学习课程（如高等数学、大学英语等）</li>
          <li>在【卡片管理】中为每个课程添加知识卡片</li>
          <li>知识卡片支持富文本内容、配图和语音</li>
        </ul>
      </Card>
    </div>
  );
};

export default DashboardPage;
