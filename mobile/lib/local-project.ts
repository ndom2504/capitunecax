import type { CapiService } from './api';

export const LOCAL_PROJECT_KEY = 'capitune_local_project_v1';

function toStepStatus(statut: unknown): 'pending' | 'in_progress' | 'completed' {
  const s = String(statut ?? '').toLowerCase();
  if (s === 'done' || s === 'complete' || s === 'completed' || s === 'termine' || s === 'terminé') return 'completed';
  if (s === 'in_progress' || s === 'en_cours' || s === 'encours') return 'in_progress';
  return 'pending';
}

export function buildLocalProjectFromCapiSession(session: any) {
  const timelineSteps: any[] = Array.isArray(session?.timeline) ? session.timeline : [];
  const steps = timelineSteps.map((t: any, idx: number) => ({
    id: t.id ?? `step-${idx + 1}`,
    title: t.title ?? t.titre ?? `Étape ${idx + 1}`,
    description: t.description ?? '',
    status: toStepStatus(t.status ?? t.statut),
    dueDate: t.dueDate,
  }));

  const rawServices: CapiService[] = Array.isArray(session?.services) ? session.services : [];
  const services = rawServices
    .filter((s) => s && (s.priorite === 'obligatoire' || s.priorite === 'recommande'))
    .map((s) => ({
      id: s.id,
      name: (s as any).name ?? s.nom,
      status: s.priorite === 'obligatoire' ? 'active' : 'pending',
    }));

  const advisor = session?.advisor ?? null;

  return {
    id: `local-${Date.now()}`,
    title: 'Projet CAPI',
    programme: session?.programme ?? session?.motif ?? 'Dossier immigration',
    steps,
    documents: [],
    services,
    advisor,
    source: 'local',
    createdAt: new Date().toISOString(),
  };
}
