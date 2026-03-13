export type UserRole = "PARTICULIER" | "PROFESSIONNEL" | "PARTENAIRE" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  banner?: string;
  points: number;
  credibility_score: number;
  province?: string;
  specialty?: string;
  bio?: string;
  verified: boolean;
}

export interface Dossier {
  id: string;
  user_id: string;
  status: "Ouvert" | "En attente expert" | "En cours" | "Clôturé";
  step: number;
  data: any;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface DLI {
  id: string | number;
  name: string;
  province: string;
  type: string;
  url: string;
  logo?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  status: "Brouillon" | "Publié" | "En direct" | "Replay";
  date: string;
  link?: string;
  created_by: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  category: string;
  media_url?: string;
  created_at: string;
}
