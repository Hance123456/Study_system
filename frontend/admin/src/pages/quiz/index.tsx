import React, { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Tag,
  Card,
  InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getQuizList, getQuizDetail, createQuiz, updateQuiz, deleteQuiz } from '../../services/quiz';
import type { Quiz } from '../../services/quiz';
import { getCardList } from '../../services/card';
import type { Card as CardType } from '../../services/card';
import { useLocation } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

/** 编辑表单用：把接口里的 options（可能是 JSON 字符串 / 数组）铺成至少 4 行输入 */
function normalizeOptionsForForm(record: Quiz): string[] {
  let raw: unknown = record.options as unknown;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) {
    raw = [];
  }
  const arr = (raw as unknown[]).map((x) => String(x));
  while (arr.length < 4) {
    arr.push('');
  }
  return arr;
}

const QuizPage: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [cardList, setCardList] = useState<CardType[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [filterCardId, setFilterCardId] = useState<number | undefined>();
  const [form] = Form.useForm();
  const editingQuizRef = useRef<Quiz | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const qCardId = Number(sp.get('cardId') || 0);
    if (qCardId > 0) {
      setFilterCardId(qCardId);
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  }, [location.search]);

  useEffect(() => {
    fetchQuizList();
    fetchCardList();
  }, [pagination.current, filterCardId]);

  const fillCreateDefaults = () => {
    form.setFieldsValue({
      card_id: filterCardId,
      question_type: 1,
      question: '',
      options: ['', '', '', ''],
      answer: '',
      explanation: '',
      sort_order: 0,
    });
  };

  const fillEditForm = (record: Quiz) => {
    const qType = Number(record.question_type || 1);
    form.setFieldsValue({
      card_id: record.card_id,
      question_type: qType,
      question: record.question || '',
      explanation: record.explanation || '',
      sort_order: record.sort_order ?? 0,
    });
    // 条件渲染字段（options/answer）在题型确定后再写入，避免被 Form 丢值
    setTimeout(() => {
      form.setFieldsValue({
        options: normalizeOptionsForForm(record),
        answer: record.answer || '',
      });
    }, 0);
    // 再做一次兜底写入，覆盖可能的异步渲染清空
    setTimeout(() => {
      form.setFieldsValue({
        options: normalizeOptionsForForm(record),
        answer: record.answer || '',
      });
    }, 80);
  };

  const fetchQuizList = async () => {
    setLoading(true);
    try {
      const res = await getQuizList({
        card_id: filterCardId,
        page: pagination.current,
        pageSize: pagination.pageSize,
      });
      setQuizList(res.data.list);
      setPagination((prev) => ({ ...prev, total: res.data.pagination.total }));
    } catch {
      message.error('获取题目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCardList = async () => {
    try {
      const res = await getCardList({ pageSize: 1000 });
      setCardList(res.data.list);
    } catch (e) {
      console.error('获取卡片列表失败:', e);
    }
  };

  const handleAdd = () => {
    editingQuizRef.current = null;
    setEditingQuiz(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (record: Quiz) => {
    try {
      const detailRes = await getQuizDetail(record.id);
      const detail = detailRes.data;
      editingQuizRef.current = detail;
      setEditingQuiz(detail);
      setModalVisible(true);
    } catch (error) {
      console.error('获取题目详情失败，回退使用列表数据:', error);
      editingQuizRef.current = record;
      setEditingQuiz(record);
      setModalVisible(true);
    }
  };

  const handleModalAfterOpenChange = (open: boolean) => {
    if (!open) return;
    form.resetFields();
    const current = editingQuizRef.current;
    if (current) {
      fillEditForm(current);
    } else {
      fillCreateDefaults();
    }
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
        } catch {
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
    } catch {
      message.error('状态更新失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const qType = Number(values.question_type);

      if (values.options && (qType === 1 || qType === 2)) {
        values.options = (values.options as string[]).filter((opt) => opt && String(opt).trim());
        if (values.options.length < 2) {
          message.warning('单选/多选题请至少填写 2 个选项');
          return;
        }
      } else {
        delete values.options;
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
    } catch (e) {
      console.error('提交失败:', e);
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
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '所属卡片', dataIndex: 'card_title', width: 150, ellipsis: true },
    { title: '所属课程', dataIndex: 'course_name', width: 120 },
    { title: '题目内容', dataIndex: 'question', ellipsis: true },
    {
      title: '题型',
      dataIndex: 'question_type',
      width: 80,
      render: (type: number) => <Tag>{getQuestionTypeLabel(type)}</Tag>,
    },
    { title: '答案', dataIndex: 'answer', width: 100, ellipsis: true },
    { title: '排序', dataIndex: 'sort_order', width: 60 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: number, record) => (
        <Switch checked={status === 1} onChange={(checked) => handleStatusChange(record.id, checked)} />
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
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
              value={filterCardId}
              onChange={(value) => {
                setFilterCardId(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              showSearch
              optionFilterProp="children"
            >
              {cardList.map((card) => (
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
              setPagination((prev) => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
            },
          }}
        />
      </Card>

      <Modal
        title={editingQuiz ? '编辑题目' : '添加题目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        afterOpenChange={handleModalAfterOpenChange}
        forceRender
        width={720}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="card_id"
            label="所属卡片"
            rules={[{ required: true, message: '请选择所属卡片' }]}
          >
            <Select placeholder="请选择卡片" showSearch optionFilterProp="children">
              {cardList.map((card) => (
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
            <Select
              placeholder="请选择题目类型"
              onChange={(value) => {
                if (value === 1 || value === 2) {
                  const cur = form.getFieldValue('options');
                  if (!Array.isArray(cur) || cur.length === 0) {
                    form.setFieldsValue({ options: ['', '', '', ''] });
                  }
                }
              }}
            >
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

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.question_type !== cur.question_type}>
            {() => {
              const t = Number(form.getFieldValue('question_type'));
              if (t !== 1 && t !== 2) {
                return (
                  <div style={{ marginBottom: 16, color: '#888', fontSize: 13 }}>
                    判断题无需填写选项；填空题无需填写选项，在「正确答案」中填写标准答案。
                  </div>
                );
              }
              return (
                <Form.Item
                  label="选项（选择题）"
                  required
                  tooltip="每项一行，至少 2 个非空选项。正确答案可填选项字母（如 B）或选项完整文字。"
                >
                  <Form.List name="options">
                    {(fields, { add, remove }) => (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {fields.map((field) => (
                          <Space key={field.key} style={{ display: 'flex', marginBottom: 0 }} align="baseline">
                            <span style={{ width: 28, textAlign: 'center', fontWeight: 600 }}>
                              {String.fromCharCode(65 + Number(field.name))}
                            </span>
                            <Form.Item
                              name={field.name}
                              rules={[]}
                              style={{ flex: 1, marginBottom: 0 }}
                            >
                              <Input placeholder={`选项 ${String.fromCharCode(65 + Number(field.name))}`} />
                            </Form.Item>
                            {fields.length > 2 && (
                              <MinusCircleOutlined
                                style={{ color: '#ff4d4f' }}
                                onClick={() => remove(field.name)}
                              />
                            )}
                          </Space>
                        ))}
                        <Button type="dashed" onClick={() => add('')} block icon={<PlusOutlined />}>
                          添加选项
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.question_type !== cur.question_type}>
            {() => {
              const t = Number(form.getFieldValue('question_type'));
              if (t === 3) {
                return (
                  <Form.Item
                    name="answer"
                    label="正确答案"
                    rules={[{ required: true, message: '请选择正确答案' }]}
                    extra="判断题固定为「对」「错」两个选项；小程序与判分均按此两项比较。"
                  >
                    <Select placeholder="请选择">
                      <Option value="对">对</Option>
                      <Option value="错">错</Option>
                    </Select>
                  </Form.Item>
                );
              }
              return (
                <Form.Item
                  name="answer"
                  label="正确答案"
                  rules={[{ required: true, message: '请输入正确答案' }]}
                  extra={
                    t === 4
                      ? '填空题：学员输入会去掉首尾空格，判分时忽略连续空格及英文大小写。'
                      : '单选/多选：可填选项字母（如 B）或与选项完全一致的文案；提交时按选项全文与正确答案比较（英文忽略大小写）。'
                  }
                >
                  <Input placeholder={t === 4 ? '标准答案' : '如 B 或与选项一致的原文'} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="explanation" label="解析说明">
            <TextArea rows={2} placeholder="答案解析（可选）" />
          </Form.Item>

          <Form.Item name="sort_order" label="排序">
            <InputNumber min={0} placeholder="排序值" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuizPage;
