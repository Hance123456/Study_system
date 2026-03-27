import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Switch, message, Tag, Card, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getQuizList, createQuiz, updateQuiz, deleteQuiz } from '../../services/quiz';
import type { Quiz } from '../../services/quiz';
import { getCardList } from '../../services/card';
import type { Card as CardType } from '../../services/card';

const { TextArea } = Input;
const { Option } = Select;

const QuizPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [cardList, setCardList] = useState<CardType[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [filterCardId, setFilterCardId] = useState<number | undefined>();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchQuizList();
    fetchCardList();
  }, [pagination.current, filterCardId]);

  const fetchQuizList = async () => {
    setLoading(true);
    try {
      const res = await getQuizList({
        card_id: filterCardId,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setQuizList(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.pagination.total }));
    } catch (error) {
      message.error('获取题目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCardList = async () => {
    try {
      const res = await getCardList({ pageSize: 1000 });
      setCardList(res.data.list);
    } catch (error) {
      console.error('获取卡片列表失败:', error);
    }
  };

  const handleAdd = () => {
    setEditingQuiz(null);
    form.resetFields();
    form.setFieldsValue({
      question_type: 1,
      options: ['', '', '', ''],
      sort_order: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: Quiz) => {
    setEditingQuiz(record);
    form.setFieldsValue({
      ...record,
      options: record.options || ['', '', '', ''],
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这道题目吗？',
      onOk: async () => {
        try {
          await deleteQuiz(id);
          message.success('删除成功');
          fetchQuizList();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleStatusChange = async (id: number, status: boolean) => {
    try {
      await updateQuiz(id, { status: status ? 1 : 0 });
      message.success('状态更新成功');
      fetchQuizList();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 过滤空选项
      if (values.options) {
        values.options = values.options.filter((opt: string) => opt && opt.trim());
      }

      if (editingQuiz) {
        await updateQuiz(editingQuiz.id, values);
        message.success('更新成功');
      } else {
        await createQuiz(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchQuizList();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  const getQuestionTypeLabel = (type: number) => {
    const types: Record<number, string> = {
      1: '单选题',
      2: '多选题',
      3: '判断题',
      4: '填空题',
    };
    return types[type] || '未知';
  };

  const columns: ColumnsType<Quiz> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: '所属卡片',
      dataIndex: 'card_title',
      width: 150,
      ellipsis: true,
    },
    {
      title: '所属课程',
      dataIndex: 'course_name',
      width: 120,
    },
    {
      title: '题目内容',
      dataIndex: 'question',
      ellipsis: true,
    },
    {
      title: '题型',
      dataIndex: 'question_type',
      width: 80,
      render: (type: number) => <Tag>{getQuestionTypeLabel(type)}</Tag>,
    },
    {
      title: '答案',
      dataIndex: 'answer',
      width: 100,
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 60,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: number, record) => (
        <Switch 
          checked={status === 1} 
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="筛选卡片"
              allowClear
              style={{ width: 250 }}
              onChange={(value) => {
                setFilterCardId(value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              showSearch
              optionFilterProp="children"
            >
              {cardList.map(card => (
                <Option key={card.id} value={card.id}>
                  [{card.course_name}] {card.title}
                </Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加题目
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={quizList}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      <Modal
        title={editingQuiz ? '编辑题目' : '添加题目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="card_id"
            label="所属卡片"
            rules={[{ required: true, message: '请选择所属卡片' }]}
          >
            <Select 
              placeholder="请选择卡片"
              showSearch
              optionFilterProp="children"
            >
              {cardList.map(card => (
                <Option key={card.id} value={card.id}>
                  [{card.course_name}] {card.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="question_type"
            label="题目类型"
            rules={[{ required: true, message: '请选择题目类型' }]}
          >
            <Select placeholder="请选择题目类型">
              <Option value={1}>单选题</Option>
              <Option value={2}>多选题</Option>
              <Option value={3}>判断题</Option>
              <Option value={4}>填空题</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="question"
            label="题目内容"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={3} placeholder="请输入题目内容" />
          </Form.Item>

          <Form.Item label="选项（选择题填写）">
            <Form.List name="options">
              {(fields) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {fields.map((field, index) => (
                    <Input
                      key={field.key}
                      {...form.getFieldValue(['options', index])}
                      placeholder={`选项 ${String.fromCharCode(65 + index)}`}
                      onChange={(e) => {
                        const options = form.getFieldValue('options') || [];
                        options[index] = e.target.value;
                        form.setFieldsValue({ options });
                      }}
                      addonBefore={String.fromCharCode(65 + index)}
                    />
                  ))}
                </div>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item
            name="answer"
            label="正确答案"
            rules={[{ required: true, message: '请输入正确答案' }]}
            extra={'单选题填写选项内容，判断题填写"对"或"错"，填空题填写正确答案'}
          >
            <Input placeholder="请输入正确答案" />
          </Form.Item>

          <Form.Item
            name="explanation"
            label="解析说明"
          >
            <TextArea rows={2} placeholder="答案解析（可选）" />
          </Form.Item>

          <Form.Item
            name="sort_order"
            label="排序"
          >
            <InputNumber min={0} placeholder="排序值" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuizPage;
