import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://capitunecax.vercel.app';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  sessionToken?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (sessionToken) {
    headers['Authorization'] = `Bearer ${sessionToken}`;
    headers['Cookie'] = `capitune_session=${sessionToken}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({})) as T;
    return { data, status: res.status };
  } catch (e) {
    return { error: String(e), status: 0 };
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ success?: boolean; pending?: boolean; message?: string; user?: UserInfo }>(
      '/api/oauth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),

  signup: (payload: SignupPayload) =>
    request<{ success?: boolean; pending?: boolean; email?: string; message?: string }>(
      '/api/oauth/signup',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  me: (token: string) =>
    request<UserInfo>('/api/me', {}, token),

  logout: (token: string) =>
    request('/api/oauth/logout', { method: 'POST' }, token),

  resendVerification: (email: string) =>
    request('/api/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getProject: (token: string) =>
    request<{ project: ProjectData | null }>('/api/projet', {}, token),

  getMessages: (token: string) =>
    request<{ messages: Message[] }>('/api/messages', {}, token),

  sendMessage: (token: string, content: string) =>
    request('/api/messages', { method: 'POST', body: JSON.stringify({ content }) }, token),

  getDocuments: (token: string) =>
    request<{ documents: Document[] }>('/api/documents', {}, token),

  getPayments: (token: string) =>
    request<{ payments: Payment[] }>('/api/payments', {}, token),
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'pro' | 'admin';
  account_type: 'client' | 'pro';
  avatar?: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  accountType: 'client' | 'pro';
}

export interface ProjectData {
  id?: string;
  title?: string;
  status?: string;
  progress?: number;
  steps?: ProjectStep[];
  assignedPro?: {
    name: string;
    avatar?: string;
    role?: string;
  };
}

export interface ProjectStep {
  id: string;
  label: string;
  status: 'done' | 'active' | 'pending';
  date?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'client' | 'pro' | 'admin';
  senderName: string;
  createdAt: string;
  read: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: 'validated' | 'pending' | 'rejected' | 'missing';
  uploadedAt?: string;
  url?: string;
}

export interface Payment {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  receiptUrl?: string;
}
