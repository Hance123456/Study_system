import request from '../utils/request';

export interface LoginParams {
  username: string;
  password: string;
}

export interface AdminInfo {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface AdminDashboardStats {
  userCount: number;
  viewCount: number;
}

export interface LoginResult {
  token: string;
  admin: AdminInfo;
}

// 管理员登录
export const login = (data: LoginParams) => {
  return request.post<any, { code: number; data: LoginResult }>('/admin/login', data);
};

// 获取管理员信息
export const getAdminInfo = () => {
  return request.get<any, { code: number; data: AdminInfo }>('/admin/info');
};

// 修改密码
export const changePassword = (data: { oldPassword: string; newPassword: string }) => {
  return request.put('/admin/password', data);
};

// 仪表盘统计
export const getAdminStats = () => {
  return request.get<any, { code: number; data: AdminDashboardStats }>('/admin/stats');
};
