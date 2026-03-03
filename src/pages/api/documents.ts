/**
 * GET /api/documents — Liste des documents requis et reçus pour le dossier actif
 *
 * Retourne une checklist de documents selon le type d'immigration du projet.
 * Le statut (pending/validated/missing) est dérivé des pièces jointes des messages.
 */
import type { APIRoute } from 'astro';
import {
  getActiveProjectAny,
  getMessagesAny,
  getNeonSqlClient,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../lib/db';

// Documents requis par type de projet immigration
const REQUIRED_DOCS: Record<string, { id: string; name: string; type: string }[]> = {
  default: [
    { id: 'passport', name: 'Passeport valide', type: 'identity' },
    { id: 'photo', name: 'Photos identité', type: 'identity' },
    { id: 'acte_naissance', name: 'Acte de naissance', type: 'civil' },
    { id: 'casier_judiciaire', name: 'Casier judiciaire', type: 'legal' },
  ],
  travail: [
    { id: 'passport', name: 'Passeport valide', type: 'identity' },
    { id: 'photo', name: 'Photos identité', type: 'identity' },
    { id: 'diplome', name: 'Diplôme(s)', type: 'education' },
    { id: 'cv', name: 'Curriculum vitae', type: 'work' },
    { id: 'lettre_emploi', name: "Lettre d'offre d'emploi", type: 'work' },
    { id: 'casier_judiciaire', name: 'Casier judiciaire', type: 'legal' },
    { id: 'acte_naissance', name: 'Acte de naissance', type: 'civil' },
  ],
  etudes: [
    { id: 'passport', name: 'Passeport valide', type: 'identity' },
    { id: 'photo', name: 'Photos identité', type: 'identity' },
    { id: 'diplome', name: 'Diplôme(s)', type: 'education' },
    { id: 'releves_notes', name: 'Relevés de notes', type: 'education' },
    { id: 'lettre_admission', name: "Lettre d'admission", type: 'education' },
    { id: 'preuve_fonds', name: 'Preuve de fonds suffisants', type: 'financial' },
    { id: 'acte_naissance', name: 'Acte de naissance', type: 'civil' },
  ],
  famille: [
    { id: 'passport', name: 'Passeport valide', type: 'identity' },
    { id: 'photo', name: 'Photos identité', type: 'identity' },
    { id: 'acte_mariage', name: 'Acte de mariage', type: 'civil' },
    { id: 'acte_naissance', name: 'Acte de naissance', type: 'civil' },
    { id: 'preuve_relation', name: 'Preuves de la relation', type: 'civil' },
    { id: 'casier_judiciaire', name: 'Casier judiciaire', type: 'legal' },
    { id: 'preuve_fonds', name: 'Preuve de revenus du répondant', type: 'financial' },
  ],
  residence_permanente: [
    { id: 'passport', name: 'Passeport valide', type: 'identity' },
    { id: 'photo', name: 'Photos identité', type: 'identity' },
    { id: 'diplome', name: 'Diplôme(s)', type: 'education' },
    { id: 'cv', name: 'Curriculum vitae', type: 'work' },
    { id: 'certificat_langue', name: 'Certificat de langue (IELTS/TEF)', type: 'language' },
    { id: 'casier_judiciaire', name: 'Casier judiciaire', type: 'legal' },
    { id: 'acte_naissance', name: 'Acte de naissance', type: 'civil' },
    { id: 'preuve_fonds', name: 'Preuve de fonds', type: 'financial' },
  ],
  tourisme: [
    { id: 'passport', name: 'Passeport valide', type: 'identity' },
    { id: 'photo', name: 'Photos identité', type: 'identity' },
    { id: 'itineraire', name: 'Itinéraire de voyage', type: 'travel' },
    { id: 'reservation_hotel', name: "Réservation d'hébergement", type: 'travel' },
    { id: 'preuve_fonds', name: 'Preuve de fonds suffisants', type: 'financial' },
    { id: 'assurance_voyage', name: 'Assurance voyage', type: 'financial' },
  ],
};

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    return json({ documents: [] });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProjectAny(db, user.id);

  // Déterminer les docs requis selon le type du projet
  const projectType = (project?.type ?? '').toLowerCase();
  const requiredDocs =
    REQUIRED_DOCS[projectType] ?? REQUIRED_DOCS['default'];

  // Récupérer les pièces jointes soumises via messages
  let uploadedNames: string[] = [];
  if (project) {
    try {
      const messages = await getMessagesAny(db, project.id);
      uploadedNames = messages.flatMap((m) => {
        try {
          const att = JSON.parse(m.attachments || '[]') as string[];
          return att.map((a) => a.toLowerCase());
        } catch {
          return [];
        }
      });
    } catch {
      // Pas bloquant
    }
  }

  // Calculer le statut de chaque document
  const documents = requiredDocs.map((doc) => {
    const isUploaded = uploadedNames.some(
      (name) =>
        name.includes(doc.id) ||
        name.includes(doc.name.toLowerCase().split(' ')[0]),
    );
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      status: isUploaded ? 'pending' : 'missing',
      uploadedAt: isUploaded ? new Date().toISOString() : null,
      url: null,
    };
  });

  return json({ documents, projectType: project?.type ?? null });
};

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' },
  });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
