import request from '../utils/request';

export interface Quiz {
  id: number;
  card_id: number;
  question: string;
  question_type: number;
  options: string[] | null;
  answer: string;
  explanation: string;
  sort_order: number;
  status: number;
  created_at: string;
  card_title?: string;
  course_name?: string;
}

export interface QuizListResponse {
  list: Quiz[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateQuizData {
  card_id: number;
  question: string;
  question_type: number;
  options?: string[];
  answer: string;
  explanation?: string;
  sort_order?: number;
}

export interface UpdateQuizData extends Partial<CreateQuizData> {
  status?: number;
}

// 获取测验题目列表
export const getQuizList = (params: {
  card_id?: number;
  status?: number;
  page?: number;
  pageSize?: number;
}) => {
  return request.get<any, { code: number; data: QuizListResponse }>('/quiz/list', { params });
};

// 获取题目详情
export const getQuizDetail = (id: number) => {
  return request.get<any, { code: number; data: Quiz }>(`/quiz/detail/${id}`);
};

// 创建题目
export const createQuiz = (data: CreateQuizData) => {
  return request.post<any, { code: number; data: { id: number } }>('/quiz/create', data);
};

// 更新题目
export const updateQuiz = (id: number, data: UpdateQuizData) => {
  return request.put(`/quiz/update/${id}`, data);
};

// 删除题目
export const deleteQuiz = (id: number) => {
  return request.delete(`/quiz/delete/${id}`);
};
