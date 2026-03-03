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
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
    const data = await res.json().catch(() => ({})) as T;
    return { data, status: res.status };
  } catch (e) {
    return { error: String(e), status: 0 };
  }
}

// -- Auth ---------------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string) =>
    request<{ success?: boolean; pending?: boolean; message?: string; user?: UserInfo }>(
      '/api/oauth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  signup: (payload: SignupPayload) =>
    request<{ success?: boolean; pending?: boolean; email?: string; message?: string }>(
      '/api/oauth/signup', { method: 'POST', body: JSON.stringify(payload) }),

  me: (token: string) => request<UserInfo>('/api/me', {}, token),

  logout: (token: string) => request('/api/oauth/logout', { method: 'POST' }, token),

  resendVerification: (email: string) =>
    request('/api/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
};

// -- CAPI � Agent IA d'orientation --------------------------------------------

export const capiApi = {
  getSession: (token: string) =>
    request<CapiSession>('/api/capi/session', {}, token),

  saveSession: (token: string, data: Partial<CapiSession>) =>
    request<{ ok: boolean }>('/api/capi/session', {
      method: 'POST', body: JSON.stringify(data),
    }, token),

  evaluate: (token: string, profile: CapiProfileData) =>
    request<CapiEvaluation>('/api/capi/evaluate', {
      method: 'POST', body: JSON.stringify(profile),
    }, token),

  generateServices: (token: string, context: CapiServicesContext) =>
    request<{ services: CapiService[] }>('/api/capi/services', {
      method: 'POST', body: JSON.stringify(context),
    }, token),

  matchAdvisors: (token: string, context: CapiMatchContext) =>
    request<{ advisors: CapiAdvisor[] }>('/api/capi/advisors', {
      method: 'POST', body: JSON.stringify(context),
    }, token),

  activateProject: (token: string, payload: CapiActivationPayload) =>
    request<{ ok: boolean; projectId: string }>('/api/capi/activate', {
      method: 'POST', body: JSON.stringify(payload),
    }, token),
};

// -- Dashboard / Projet -------------------------------------------------------

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

// -- Types Auth ----------------------------------------------------------------

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'pro' | 'admin';
  account_type: 'client' | 'pro';
  avatar?: string | null;
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

// -- Types CAPI ----------------------------------------------------------------

export type CapiMotif =
  | 'visiter'
  | 'travailler'
  | 'etudier'
  | 'residence_permanente'
  | 'famille'
  | 'entreprendre'
  | 'regularisation';

export interface CapiSession {
  id?: string;
  step: number;
  motif?: CapiMotif;
  programme?: string;
  profile?: CapiProfileData;
  evaluation?: CapiEvaluation;
  services?: CapiService[];
  timeline?: CapiTimelineStep[];
  advisor?: CapiAdvisor;
  updatedAt?: string;
}

export interface CapiProfileData {
  motif: CapiMotif;
  programme?: string;
  age?: number;
  nationalite?: string;
  province?: string;
  diplome?: string;
  experience?: number;
  langues?: string[];
  situationFamiliale?: 'celibataire' | 'marie' | 'conjoint_fait';
  enfants?: number;
  delai?: string;
  budget?: string;
  refusAnterieur?: boolean;
  offreEmploi?: boolean;
  niveauEtudes?: string;
  chiffreAffaires?: number;
}

export interface CapiEvaluation {
  faisabilite: number;
  complexite: 'faible' | 'moyenne' | 'elevee';
  delaiEstime: string;
  risques: string[];
  points_forts: string[];
  disclaimer: string;
}

export interface CapiService {
  id: string;
  nom: string;
  description: string;
  categorie: 'immigration' | 'installation';
  priorite: 'obligatoire' | 'recommande' | 'optionnel';
  prixEstime?: number;
  devise?: string;
  selected: boolean;
}

export interface CapiTimelineStep {
  id: string;
  titre: string;
  description?: string;
  responsable: 'client' | 'conseiller' | 'gouvernement';
  dureeEstimee: string;
  documents?: string[];
  statut: 'a_faire' | 'en_cours' | 'termine';
}

export interface CapiAdvisor {
  id: string;
  nom: string;
  titre: string;
  avatar?: string;
  score: number;
  specialites: string[];
  langues: string[];
  province: string;
  tarifConsultation?: number;
  deviseConsultation?: string;
  disponibilite: string;
  experience?: string;
  nbClients?: number;
  bio?: string;
}

export interface CapiMatchContext {
  motif: CapiMotif;
  programme?: string;
  complexite: 'faible' | 'moyenne' | 'elevee';
  province?: string;
  langues?: string[];
  budget?: string;
}

export interface CapiServicesContext {
  motif: CapiMotif;
  programme?: string;
  profile: CapiProfileData;
  evaluation: CapiEvaluation;
}

export interface CapiActivationPayload {
  session: CapiSession;
  advisorId: string;
  selectedServiceIds: string[];
}

// -- Types Projet / Dashboard --------------------------------------------------

export interface ProjectData {
  id?: string;
  type?: string;
  status?: string;
  progress?: number;
  steps?: ProjectStep[];
  assignedPro?: { name: string; avatar?: string; role?: string };
  nextAction?: string;
  nextDeadline?: string;
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
  sender: 'user' | 'bot' | 'admin';
  senderName?: string;
  createdAt: string;
  attachments?: string[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: 'validated' | 'pending' | 'rejected' | 'missing';
  uploadedAt?: string | null;
  url?: string | null;
}

export interface Payment {
  id: string;
  label: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  receiptUrl?: string | null;
}
