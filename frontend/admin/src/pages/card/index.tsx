import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tag,
  Switch,
  Upload,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  getCardList,
  getCardDetail,
  createCard,
  updateCard,
  deleteCard,
} from '../../services/card';
import type { Card } from '../../services/card';
import { getCourseList } from '../../services/course';
import type { Course } from '../../services/course';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import request from '../../utils/request';

const { TextArea } = Input;

const difficultyMap: Record<number, { text: string; color: string }> = {
  1: { text: '简单', color: 'green' },
  2: { text: '中等', color: 'orange' },
  3: { text: '困难', color: 'red' },
};

const normalizeCardFields = (row: any): Card => {
  return {
    ...row,
    image: String((row && (row.image ?? row.image_url ?? row.cardimage ?? row.card_image ?? '')) || ''),
    audio_url: String((row && (row.audio_url ?? row.audio ?? '')) || ''),
    summary: String((row && (row.summary ?? '')) || ''),
  } as Card;
};

const CardPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState<{ course_id?: number; keyword?: string }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [form] = Form.useForm();
  const currentImageUrl = Form.useWatch('image', form);
  const currentAudioUrl = Form.useWatch('audio_url', form);

  // 编辑模式下：上传成功后自动持久化到数据库，避免“只回填未保存”的误解
  const persistFieldIfEditing = async (field: Partial<Card>) => {
    if (!editingCard) return;
    try {
      await updateCard(editingCard.id, field);
      setEditingCard({ ...editingCard, ...field });
      fetchCards(pagination.page, pagination.pageSize);
    } catch (err) {
      console.error('自动保存字段失败:', err);
      message.warning('上传成功，但自动保存失败，请点击“确定”手动保存');
    }
  };

  // 上传配图并自动回填 URL
  const handleUploadImage = async (options: UploadRequestOption) => {
    const { file, onSuccess, onError } = options;
    try {
      const formData = new FormData();
      formData.append('file', file as File);

      const res = await request.post('/upload/image?type=cards', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.code === 200 && res.data?.url) {
        form.setFieldsValue({ image: res.data.url });
        await persistFieldIfEditing({ image: res.data.url });
        onSuccess && onSuccess(res as any, file as any);
        message.success(editingCard ? '图片上传并保存成功' : '图片上传成功（请点击确定保存卡片）');
      } else {
        throw new Error(res.message || '上传失败');
      }
    } catch (err) {
      console.error('上传配图失败:', err);
      message.error('上传配图失败');
      onError && onError(err as any);
    }
  };

  // 上传音频并自动回填 URL
  const handleUploadAudio = async (options: UploadRequestOption) => {
    const { file, onSuccess, onError } = options;
    try {
      const formData = new FormData();
      formData.append('file', file as File);

      const res = await request.post('/upload/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.code === 200 && res.data?.url) {
        form.setFieldsValue({ audio_url: res.data.url });
        await persistFieldIfEditing({ audio_url: res.data.url });
        onSuccess && onSuccess(res as any, file as any);
        message.success(editingCard ? '音频上传并保存成功' : '音频上传成功（请点击确定保存卡片）');
      } else {
        throw new Error(res.message || '上传失败');
      }
    } catch (err) {
      console.error('上传音频失败:', err);
      message.error('上传音频失败');
      onError && onError(err as any);
    }
  };

  // 一键生成语音并回填 audio_url：使用卡片标题 + 卡片内容（不含摘要）
  const handleGenerateTts = async () => {
    try {
      const values = form.getFieldsValue();
      const title = (values.title || '').trim();
      const content = (values.content || '').trim();
      const parts: string[] = [];
      if (title) parts.push(title);
      if (content) parts.push(content);
      const sourceText = parts.join('。').trim();
      if (!sourceText) {
        message.warning('请先填写卡片标题和卡片内容');
        return;
      }

      setTtsLoading(true);
      const res = await request.post('/upload/tts', {
        text: sourceText,
        voice: 'zh-CN-XiaoxiaoNeural',
        rate: '+0%',
      });

      if (res.code === 200 && res.data?.url) {
        form.setFieldsValue({ audio_url: res.data.url });
        await persistFieldIfEditing({ audio_url: res.data.url });
        message.success('语音生成成功，已自动填入音频URL');
      } else {
        message.error(res.message || '语音生成失败');
      }
    } catch (error) {
      console.error('语音生成失败:', error);
      message.error('语音生成失败');
    } finally {
      setTtsLoading(false);
    }
  };

  const fetchCards = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await getCardList({ ...filters, page, pageSize });
      setCards((res.data.list || []).map((row: any) => normalizeCardFields(row)));
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('获取卡片列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await getCourseList({ status: 1 });
      setCourses(res.data);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchCards(pagination.page, pagination.pageSize);
  }, [filters]);

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchCards(pag.current || 1, pag.pageSize || 10);
  };

  const handleAdd = () => {
    setEditingCard(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = async (record: Card) => {
    try {
      // 以详情接口为准，避免列表数据延迟/字段缺失导致 image 看不到
      const detailRes = await getCardDetail(record.id);
      const normalized = normalizeCardFields(detailRes.data);
      setEditingCard(normalized);
      form.setFieldsValue(normalized);
      setModalVisible(true);
    } catch (error) {
      console.error('获取卡片详情失败，回退使用列表数据:', error);
      const normalized = normalizeCardFields(record);
      setEditingCard(normalized);
      form.setFieldsValue(normalized);
      setModalVisible(true);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCard(id);
      message.success('删除成功');
      fetchCards(pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleStatusChange = async (record: Card, checked: boolean) => {
    try {
      await updateCard(record.id, { status: checked ? 1 : 0 });
      message.success('状态更新成功');
      fetchCards(pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('状态更新失败:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCard) {
        await updateCard(editingCard.id, values);
        message.success('更新成功');
      } else {
        await createCard(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchCards(pagination.page, pagination.pageSize);
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const columns: ColumnsType<Card> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '所属课程',
      dataIndex: 'course_name',
      width: 120,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      width: 80,
      render: (difficulty: number) => {
        const item = difficultyMap[difficulty];
        return item ? <Tag color={item.color}>{item.text}</Tag> : '-';
      },
    },
    {
      title: '浏览量',
      dataIndex: 'view_count',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: number, record: Card) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange(record, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个卡片吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>卡片管理</h2>
        <Space>
          <Select
            placeholder="选择课程"
            style={{ width: 150 }}
            defaultValue={0}
            onChange={(value) =>
              setFilters({ ...filters, course_id: Number(value) === 0 ? undefined : Number(value) })
            }
          >
            <Select.Option value={0}>全部课程</Select.Option>
            {courses.map((course) => (
              <Select.Option key={course.id} value={course.id}>
                {course.name}
              </Select.Option>
            ))}
          </Select>
          <Input.Search
            placeholder="搜索卡片"
            style={{ width: 200 }}
            onSearch={(value) => setFilters({ ...filters, keyword: value })}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增卡片
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={cards}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingCard ? '编辑卡片' : '新增卡片'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="course_id"
            label="所属课程"
            rules={[{ required: true, message: '请选择课程' }]}
          >
            <Select placeholder="请选择课程">
              {courses.map((course) => (
                <Select.Option key={course.id} value={course.id}>
                  {course.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="卡片标题"
            rules={[{ required: true, message: '请输入卡片标题' }]}
          >
            <Input placeholder="请输入卡片标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="卡片内容"
            rules={[{ required: true, message: '请输入卡片内容' }]}
          >
            <TextArea rows={6} placeholder="请输入卡片内容" />
          </Form.Item>
          <Form.Item name="summary" label="内容摘要">
            <TextArea rows={2} placeholder="请输入内容摘要（用于列表展示）" />
          </Form.Item>
          <Form.Item name="image" label="配图资源">
            <Upload customRequest={handleUploadImage} showUploadList={false}>
              <Button type="link">上传图片并自动填写</Button>
            </Upload>
            {currentImageUrl ? (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, wordBreak: 'break-all' }}>
                当前图片URL：{currentImageUrl}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                尚未上传图片
              </div>
            )}
          </Form.Item>
          <Form.Item
            name="audio_url"
            label="音频资源"
            extra="一键生成语音会朗读上方「卡片标题」与「卡片内容」（中间用停顿连接），不使用「内容摘要」。"
          >
            <Space>
              <Button type="link" onClick={handleGenerateTts} loading={ttsLoading}>
                一键生成语音
              </Button>
              <Upload customRequest={handleUploadAudio} showUploadList={false}>
                <Button type="link">上传音频并自动填写</Button>
              </Upload>
            </Space>
            {currentAudioUrl ? (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4, wordBreak: 'break-all' }}>
                当前音频URL：{currentAudioUrl}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                尚未生成或上传音频
              </div>
            )}
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="difficulty" label="难度" initialValue={1}>
              <Select style={{ width: 120 }}>
                <Select.Option value={1}>简单</Select.Option>
                <Select.Option value={2}>中等</Select.Option>
                <Select.Option value={3}>困难</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="sort_order" label="排序" initialValue={0}>
              <InputNumber min={0} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CardPage;
