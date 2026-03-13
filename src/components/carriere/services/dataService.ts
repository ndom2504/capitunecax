import { User, Dossier, DLI, Event, Post } from "../types";

export const dataService = {
  async getCurrentUser(): Promise<User> {
    const res = await fetch("/api/users/me");
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  },

  async getDossiers(): Promise<Dossier[]> {
    const res = await fetch("/api/dossiers");
    return res.json();
  },

  async createDossier(data: any): Promise<{ id: string; status: string }> {
    const res = await fetch("/api/dossiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    return res.json();
  },

  async getEED(): Promise<DLI[]> {
    const res = await fetch("/api/dli");
    if (!res.ok) return [];
    const json = await res.json();
    // L'API retourne { total, source, updatedAt, data: [{id, nom, admissionsUrl, ...}] }
    const raw: any[] = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
    return raw.map(r => ({
      id: r.id,
      name: r.name ?? r.nom ?? '',
      province: r.province ?? '',
      type: r.type ?? '',
      url: r.url ?? r.admissionsUrl ?? '',
    }));
  },

  // Local storage fallback for modules not yet in backend
  getLocal<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  },

  setLocal<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("local-data-updated", { detail: { key } }));
  },

  // Global Profile for automated matching
  getGlobalProfile(): any {
    return this.getLocal("capitune_global_profile", null);
  },

  saveGlobalProfile(profile: any): void {
    this.setLocal("capitune_global_profile", profile);
  }
};
