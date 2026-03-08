import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://www.capitune.com';

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include', signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    let data: unknown = {};
    let nonJsonText: string | undefined;
    try {
      data = await res.json();
    } catch {
      try {
        nonJsonText = (await res.text()).trim();
      } catch {
        nonJsonText = undefined;
      }
    }

    const status = res.status;
    if (!res.ok) {
      const messageFromJson = (data as any)?.error as string | undefined;
      const messageFromText = nonJsonText ? nonJsonText.slice(0, 300) : undefined;
      return { data: data as T, status, error: messageFromJson ?? messageFromText ?? `HTTP ${status}` };
    }

    return { data: data as T, status };
  } catch (e) {
    const msg = String(e);
    // AbortError = timeout → message explicite
    if (msg.includes('AbortError') || msg.includes('aborted')) {
      return { error: 'Délai dépassé (serveur injoignable)', status: 0 };
    }
    return { error: msg, status: 0 };
  }
}

// -- Auth ---------------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string, accountType: 'client' | 'pro') =>
    request<{ success?: boolean; pending?: boolean; message?: string; token?: string; user?: UserInfo }>(
      '/api/oauth/signin/credentials',
      { method: 'POST', body: JSON.stringify({ email, password, accountType, mobile: true }) }
    ),

  signup: (payload: SignupPayload) =>
    request<{ success?: boolean; pending?: boolean; email?: string; message?: string }>(
      '/api/oauth/signup', { method: 'POST', body: JSON.stringify(payload) }),

  me: (token: string) => request<UserInfo>('/api/me', {}, token),

  logout: (token: string) => request('/api/oauth/signout', { method: 'POST' }, token),

  resendVerification: (email: string) =>
    request('/api/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
};

// -- Profil utilisateur -------------------------------------------------------

export const userApi = {
  getProfile: (token: string) => request<UserProfile>('/api/user/profile', {}, token),
  updateProfile: (token: string, payload: UserProfileUpdate) =>
    request<{ ok?: boolean; persisted?: boolean; error?: string }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, token),
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

// -- Agent KB (sans auth, compatible mobile) ---------------------------------

type AgentProject = {
  type?: string;
  province?: string;
  pays?: string;
  langues?: string[];
};

type AgentContext = 'general' | 'autonomie';

type AgentHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const agentApi = {
  answer: (
    message: string,
    project?: AgentProject | null,
    token?: string,
    context: AgentContext = 'general',
    history?: AgentHistoryMessage[] | null,
  ) =>
    request<{
      replyText?: string;
      replyHtml?: string;
      meta?: {
        topic?: string;
        source?: 'openai' | 'kb' | 'paywall' | 'error' | 'local';
        openaiError?: string;
      };
    }>(
      '/api/capi/answer',
      { method: 'POST', body: JSON.stringify({ message, project: project ?? null, context, history: history ?? null }) },
      token,
    ),
};

// -- Paiement Autonomie (Stripe Checkout) -----------------------------------

export const autonomiePaymentApi = {
  getPrice: (motif: CapiMotif) =>
    request<{ motif?: CapiMotif; unit_amount?: number; currency?: string; error?: string }>(
      `/api/autonomie/price?motif=${encodeURIComponent(String(motif))}`,
      {},
    ),

  stripeCheckout: (token: string, motif: CapiMotif) =>
    request<{ url?: string; error?: string }>('/api/autonomie/stripe-checkout', {
      method: 'POST',
      body: JSON.stringify({ motif }),
    }, token),

  stripeConfirm: (token: string, sessionId: string) =>
    request<{ ok?: boolean; persisted?: boolean; error?: string }>('/api/autonomie/stripe-confirm', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }, token),
};

// -- Conseillers / Équipe ----------------------------------------------------

export type TeamMember = {
  id: string;
  name: string;
  location: string;
  bio: string;
  avatar_key: string;
  pro_services: string[];
  pro_pack_prices: Record<string, number>;
  pro_pack_services: Record<string, string[]>;
  pro_diploma: string;
  pro_competences: string;
  pro_experience_years: number | null;
  created_at: string | null;
};

export const teamApi = {
  list: (token: string) => request<{ team: TeamMember[]; error?: string }>('/api/team', {}, token),
};

// -- Types Auth ----------------------------------------------------------------

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'pro' | 'admin';
  account_type: 'client' | 'pro';
  avatar?: string | null;
  premium_active?: boolean;
  autonomie_unlocked?: boolean;
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

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_key: string;
  role: 'client' | 'admin' | 'pro';
  notif_email: boolean;
  notif_rdv: boolean;
  notif_msg: boolean;
  currency_code: string;
  premium_expires_at: string | null;
  premium_active: boolean;
  autonomie_unlocked: boolean;
}

export type UserProfileUpdate = Partial<Pick<
  UserProfile,
  'name' | 'phone' | 'location' | 'bio' | 'notif_email' | 'notif_rdv' | 'notif_msg' | 'currency_code' | 'avatar_key'
>>;

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
  where?: 'inside' | 'outside';
  motif?: CapiMotif;
  programme?: string;
  profile?: CapiProfileData;
  evaluation?: CapiEvaluation;
  services?: CapiService[];
  timeline?: CapiTimelineStep[];
  advisor?: CapiAdvisor;
  autonomie?: AutonomieProject;
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
  // Champs spécifiques visa visiteur
  nombrePersonnes?: number;
  dureeSejour?: number;      // en jours
  paysResidence?: string;    // région pour estimation billets (RegionCode)
  paysCode?: string;         // code ISO 3166-1 alpha-2 du pays de résidence
  crdvVille?: string;        // centre biométrie le plus proche
  typeHebergement?: 'hotel' | 'famille_amis' | 'airbnb';
}

export interface VisiteurPlan {
  nombrePersonnes: number;
  dureeSejour: number;
  region: string;
  crdvVille?: string;
  notesPays?: string;
  fraisVisa: number;
  fraisBiometrie: number;
  fraisBiometrieTotal: number;
  examenMedical: boolean;
  coutExamenMedical: string;
  budgetParJourParPersonne: number;
  totalBudgetSejour: number;
  fourchetteBillets: string;
  coutEnvoiPasseport: string;
  preuveFondsMin: number;
  documents: string[];
  documentsOptionnels: string[];
  conseils: string[];
  totalEstimatif: number;
}

export interface MotifPlanFee {
  label: string;
  montant: string;
}

export interface MotifPlan {
  motif: CapiMotif;
  fraisGouvernementaux: MotifPlanFee[];
  totalGouvernement: number;
  biometrieRequise: boolean;
  crdvVille?: string;
  /** true = la position du centre est incertaine — l’utilisateur doit vérifier sur canada.ca */
  crdvIncertain?: boolean;
  examenMedical: boolean;
  notesPays?: string;
  documents: string[];
  documentsOptionnels: string[];
  conseils: string[];
}

export interface CapiEvaluation {
  faisabilite: number;
  complexite: 'faible' | 'moyenne' | 'elevee';
  delaiEstime: string;
  risques: string[];
  points_forts: string[];
  disclaimer: string;
  visiteurPlan?: VisiteurPlan;
  motifPlan?: MotifPlan;
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

// -- Types Autonomie Guidée --------------------------------------------------

export type AutonomieStepStatus = 'pending' | 'in_progress' | 'done';

export type AutonomieOfficialResourceKind = 'link' | 'button';

export interface AutonomieOfficialResource {
  label: string;
  url: string;
  kind?: AutonomieOfficialResourceKind;
}

export interface AutonomieCheckItem {
  id: string;
  label: string;
  done: boolean;
  officialResources?: AutonomieOfficialResource[];
}

export interface AutonomieRessource {
  titre: string;
  description: string;
  url: string;
}

export interface AutonomieStep {
  id: string;
  ordre: number;
  title: string;
  description: string;
  icon: string;
  status: AutonomieStepStatus;
  checkItems: AutonomieCheckItem[];   // affichés comme actions (non-cochables en UI)
  ressources: AutonomieRessource[];
  actionLabel?: string;
  actionUrl?: string;
  delaiEstime?: string;               // ex: "2–4 semaines"
  documents?: string[];               // documents requis pour cette étape
}

export interface BudgetCategorie {
  label: string;
  icon: string;
  montant: number;       // en CAD
  fourchette?: string;   // ex: "16 000 – 28 000"
  description: string;
}

export interface MotifBudget {
  motif: CapiMotif;
  categories: BudgetCategorie[];
  totalEstime: number;
  totalFourchette: string;
  devise: string;
  notesBudget: string;
}

export interface AutonomieProject {
  motif: CapiMotif;
  steps: AutonomieStep[];
  createdAt: string;
  scorePreparation: number; // 0-100
  hasPaidAutonomie?: boolean;
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
  advisorId?: string;
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
  sender: 'user' | 'bot' | 'admin' | 'pro' | 'client';
  senderName?: string;
  createdAt: string;
  attachments?: string[];
  read?: boolean;
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
