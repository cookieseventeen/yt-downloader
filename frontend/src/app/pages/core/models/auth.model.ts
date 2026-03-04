export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  displayName: string;
  createdAt?: string;
}

export interface OperationRecord {
  id: number;
  userId: number;
  type: string;
  detail: string;
  ipAddress: string;
  createdAt: string;
}

export interface OperationRecordPage {
  items: OperationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
