import type { APIRoute } from 'astro';

// KB packagée dans le bundle (compatible Cloudflare Workers, pas de fs)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import kb from '../../../../agent/capitune-kb/capitune-knowledge-base.json';

type Project = {
  type?: string;
  province?: string;
  pays?: string;
  nbpersonnes?: string;
  delai?: string;
  diplome?: string;
  domaine?: string;
  experience?: string;
  famille?: string;
  enfants?: string;
  conjoint?: string;
  langues?: string[];
};

type Body = {
  project?: Project | null;
  state?: {
    soumis?: boolean;
    packId?: string | null;
  };
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;'
  );
}

function projectLabel(type?: string) {
  const lbls: Record<string, string> = {
    rp: 'Résidence permanente',
    travail: 'Travail',
    etudes: 'Études',
    famille: 'Regroupement familial',
    investissement: 'Investissement / entrepreneur',
    refugie: 'Protection internationale',
    tourisme: 'Visiteur / tourisme',
  };
  return lbls[type || ''] || 'Projet Canada';
}

function topicFromProjectType(type?: string) {
  // On mappe vers les clés présentes dans la KB.
  if (type === 'etudes') return 'etudes';
  if (type === 'tourisme') return 'visiteur';
  if (type === 'travail') return 'travail';
  if (type === 'rp' || type === 'investissement' || type === 'refugie' || type === 'famille') {
    return 'immigration_permanente';
  }
  return null;
}

function officialLinkForType(type?: string) {
  const links: Record<string, { label: string; url: string }> = {
    rp: {
      label: 'Entrée Express (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html',
    },
    travail: {
      label: 'Permis de travail (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis.html',
    },
    etudes: {
      label: 'Étudier au Canada (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html',
    },
    famille: {
      label: 'Parrainer un membre de la famille (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/parrainer-membre-famille.html',
    },
    tourisme: {
      label: 'Visiter le Canada (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/visiter-canada.html',
    },
    refugie: {
      label: 'Réfugiés et asile (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies.html',
    },
    investissement: {
      label: 'Immigrer en tant qu’entrepreneur (IRCC) — officiel',
      url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada.html',
    },
  };
  return links[type || ''] || {
    label: 'Immigration Canada (IRCC) — officiel',
    url: 'https://www.canada.ca/fr/immigration-refugies-citoyennete.html',
  };
}

function pickArray<T>(arr: unknown, max: number): T[] {
  return Array.isArray(arr) ? (arr.slice(0, max) as T[]) : [];
}

export const POST: APIRoute = async ({ request }) => {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: 'Corps JSON invalide' }, 400);
  }

  const project: Project = (body.project ?? {}) || {};
  const type = String(project.type || '').trim();
  const topic = topicFromProjectType(type);

  const commonSteps = pickArray<string>((kb as any)?.parcours_projet_canada?.etapes_communes, 6);
  const qualificationQs = pickArray<string>((kb as any)?.parcours_projet_canada?.questions_de_qualification, 5);

  let nextSteps: string[] = [];
  if (topic === 'etudes') {
    nextSteps = pickArray<string>((kb as any)?.dossiers_specifiques?.etudes?.etapes_guidage, 6);
  } else if (topic === 'visiteur') {
    nextSteps = pickArray<string>((kb as any)?.dossiers_specifiques?.visiteur?.etapes, 6);
  } else {
    nextSteps = commonSteps;
  }
  if (!nextSteps.length) nextSteps = commonSteps;

  const projName = projectLabel(type);
  const official = officialLinkForType(type);

  // Message d’orientation (HTML simple) — uniquement contenu contrôlé serveur
  const province = project.province ? `Province visée : <strong>${escHtml(String(project.province))}</strong>` : '';
  const pays = project.pays ? `Depuis : <strong>${escHtml(String(project.pays))}</strong>` : '';
  const headerLine = [province, pays].filter(Boolean).join(' · ');

  const stepsHtml = nextSteps.map((s) => `<li>${escHtml(String(s))}</li>`).join('');
  const qsHtml = qualificationQs.map((q) => `<li>${escHtml(String(q))}</li>`).join('');

  const html =
    `<div class="msg-bot-section"><strong>🧭 Orientation — ${escHtml(projName)}</strong></div>` +
    `<div class="msg-bot-section" style="font-size:12px;color:#444;">` +
    `À titre indicatif (sans garantie), voici la prochaine séquence la plus logique selon votre profil.` +
    (headerLine ? `<br><span style="font-size:11px;color:#666;">${headerLine}</span>` : '') +
    `</div>` +
    `<div class="msg-bot-section"><strong>✅ Étapes suggérées (prochaines)</strong><ul class="msg-bot-list">${stepsHtml}</ul></div>` +
    `<div class="msg-bot-section"><strong>❓Questions rapides pour affiner</strong><ul class="msg-bot-list">${qsHtml}</ul></div>` +
    `<a href="${escHtml(official.url)}" target="_blank" rel="noopener" style="font-size:11px;color:#2980b9;display:block;margin-top:8px;">📎 ${escHtml(official.label)}</a>`;

  return json({
    replyHtml: html,
    // La notification (badge) peut refléter le nombre de messages en attente côté client.
    meta: {
      topic,
      hasProject: Boolean(type),
      soumis: Boolean(body.state?.soumis),
    },
  });
};

export const GET: APIRoute = async () => {
  return json(
    {
      error: 'Méthode non supportée. Utilisez POST avec un corps JSON.',
      allow: ['POST'],
      exampleBody: {
        project: { type: 'etudes', pays: 'France', province: 'QC' },
        state: { soumis: false },
      },
    },
    405
  );
};
