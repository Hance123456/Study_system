import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Switch,
  Upload,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getCourseList,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../../services/course';
import type { Course } from '../../services/course';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import request from '../../utils/request';

const CoursePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form] = Form.useForm();

  // 上传课程图标并自动回填 URL
  const handleUploadIcon = async (options: UploadRequestOption) => {
    const { file, onSuccess, onError } = options;
    try {
      const formData = new FormData();
      formData.append('file', file as File);

      const res = await request.post('/upload/image?type=courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.code === 200 && res.data?.url) {
        form.setFieldsValue({ icon: res.data.url });
        onSuccess && onSuccess(res as any, file as any);
        message.success('图标上传成功');
      } else {
        throw new Error(res.message || '上传失败');
      }
    } catch (err) {
      console.error('上传图标失败:', err);
      message.error('上传图标失败');
      onError && onError(err as any);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getCourseList();
      setCourses(res.data);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAdd = () => {
    setEditingCourse(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Course) => {
    setEditingCourse(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCourse(id);
      message.success('删除成功');
      fetchCourses();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleStatusChange = async (record: Course, checked: boolean) => {
    try {
      await updateCourse(record.id, { status: checked ? 1 : 0 });
      message.success('状态更新成功');
      fetchCourses();
    } catch (error) {
      console.error('状态更新失败:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingCourse) {
        await updateCourse(editingCourse.id, values);
        message.success('更新成功');
      } else {
        await createCourse(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchCourses();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const columns: ColumnsType<Course> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '课程名称',
      dataIndex: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '卡片数量',
      dataIndex: 'card_count',
      width: 100,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: number, record: Course) => (
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
            title="确定要删除这个课程吗？"
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
        <h2>课程管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增课程
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={courses}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingCourse ? '编辑课程' : '新增课程'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="课程名称"
            rules={[{ required: true, message: '请输入课程名称' }]}
          >
            <Input placeholder="请输入课程名称" />
          </Form.Item>
          <Form.Item name="description" label="课程描述">
            <Input.TextArea rows={3} placeholder="请输入课程描述" />
          </Form.Item>
          <Form.Item name="icon" label="图标URL">
            <Input
              placeholder="请输入图标URL，或点击下方按钮上传自动填写"
              style={{ marginBottom: 8 }}
            />
            <Upload customRequest={handleUploadIcon} showUploadList={false}>
              <Button type="link">上传图标并自动填写</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="sort_order" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CoursePage;
