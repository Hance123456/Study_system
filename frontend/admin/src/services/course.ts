import request from '../utils/request';

export interface Course {
  id: number;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  card_count: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CourseListParams {
  status?: number;
  keyword?: string;
}

// 获取课程列表
export const getCourseList = (params?: CourseListParams) => {
  return request.get<any, { code: number; data: Course[] }>('/course/list', { params });
};

// 获取课程详情
export const getCourseDetail = (id: number) => {
  return request.get<any, { code: number; data: Course }>(`/course/detail/${id}`);
};

// 创建课程
export const createCourse = (data: Partial<Course>) => {
  return request.post<any, { code: number; data: { id: number } }>('/course/create', data);
};

// 更新课程
export const updateCourse = (id: number, data: Partial<Course>) => {
  return request.put(`/course/update/${id}`, data);
};

// 删除课程
export const deleteCourse = (id: number) => {
  return request.delete(`/course/delete/${id}`);
};
