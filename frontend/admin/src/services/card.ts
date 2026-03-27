import request from '../utils/request';

export interface Card {
  id: number;
  course_id: number;
  course_name?: string;
  title: string;
  content: string;
  summary: string;
  image: string;
  audio_url: string;
  difficulty: number;
  sort_order: number;
  view_count: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CardListParams {
  course_id?: number;
  status?: number;
  difficulty?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CardListResult {
  list: Card[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 获取卡片列表
export const getCardList = (params?: CardListParams) => {
  return request.get<any, { code: number; data: CardListResult }>('/card/list', { params });
};

// 获取卡片详情
export const getCardDetail = (id: number) => {
  return request.get<any, { code: number; data: Card }>(`/card/detail/${id}`);
};

// 创建卡片
export const createCard = (data: Partial<Card>) => {
  return request.post<any, { code: number; data: { id: number } }>('/card/create', data);
};

// 更新卡片
export const updateCard = (id: number, data: Partial<Card>) => {
  return request.put(`/card/update/${id}`, data);
};

// 删除卡片
export const deleteCard = (id: number) => {
  return request.delete(`/card/delete/${id}`);
};
