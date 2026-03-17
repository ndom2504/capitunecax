import React, { useState, useEffect } from 'react';
import { AlertCircle, Mail, FolderOpen, FileText, CheckCircle, Search, Loader } from 'lucide-react';

export type ProClientRow = {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  avatar_key?: string | null;
  suspended?: number | boolean | null;
  project_id?: string | null;
  project_type?: string | null;
  project_status?: string | null;
  project_updated?: string | null;
  last_msg?: string | null;
  last_msg_at?: string | null;
  msg_count?: number | null;
  paid_count?: number | null;
  total_paid?: number | null;
};

interface ProClientListProps {
  onClientSelect?: (clientId: string, clientName: string, clientEmail: string) => void;
}

export default function ProClientList({ onClientSelect }: ProClientListProps) {
  const [clients, setClients] = useState<ProClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [walletTotal, setWalletTotal] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Format CAD currency
  const formatCad = (amount: number | null): string => {
    if (amount === null) return '—';
    try {
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: 'CAD',
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${amount?.toFixed(2) ?? '0'} CA$`;
    }
  };

  // Load clients list
  const loadClients = async (searchQ = q, pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ scope: 'me', page: String(pageNum) });
      if (searchQ) params.set('q', searchQ);
      
      const res = await fetch(`/api/admin/clients?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json() as any;
        throw new Error((data as any)?.error || `HTTP ${res.status}`);
      }

      const data = await res.json() as any;
      setClients((data as any)?.clients || []);
      setPages((data as any)?.pages || 1);
      setPage(pageNum);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Load wallet total
  const loadWallet = async () => {
    try {
      setWalletLoading(true);
      let total = 0;
      let currentPage = 1;
      let maxPages = 1;

      for (;;) {
        const params = new URLSearchParams({ scope: 'me', page: String(currentPage) });
        const res = await fetch(`/api/admin/clients?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) break;
        const data = await res.json() as any;
        maxPages = (data as any)?.pages || 1;
        const rows = ((data as any)?.clients || []) as ProClientRow[];
        total += rows.reduce((acc: number, c) => acc + Number(c.total_paid ?? 0), 0);

        if (currentPage >= maxPages) break;
        currentPage += 1;
      }

      setWalletTotal(total);
    } catch (err) {
      console.error('Wallet load error:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadClients(q, 1);
  }, []);

  // Load wallet
  useEffect(() => {
    loadWallet();
  }, []);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients(q, 1);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  // Calculate stats
  const counts = clients.reduce(
    (acc, c) => {
      const st = String(c.project_status ?? '').toLowerCase();
      if (st && st !== 'annule') acc.withProject += 1;
      if (st === 'proposition') acc.propositions += 1;
      if (st === 'demarre' || st === 'en_cours') acc.actifs += 1;
      return acc;
    },
    { withProject: 0, propositions: 0, actifs: 0 },
  );

  // Get initials from name or email
  const getInitials = (name?: string | null, email?: string | null): string => {
    const displayName = (name || email || 'C').trim();
    return displayName[0]?.toUpperCase() || 'C';
  };

  // Get status label and color
  const getStatusInfo = (status?: string | null) => {
    const s = String(status || '').toLowerCase();
    const colors: Record<string, string> = {
      proposition: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      demarre: 'bg-green-100 text-green-800 border border-green-300',
      en_cours: 'bg-blue-100 text-blue-800 border border-blue-300',
      soumis: 'bg-purple-100 text-purple-800 border border-purple-300',
      annule: 'bg-red-100 text-red-800 border border-red-300',
    };
    const labels: Record<string, string> = {
      proposition: 'Proposition',
      demarre: 'Démarré',
      en_cours: 'En cours',
      soumis: 'Soumis',
      annule: 'Annulé',
    };
    return {
      label: labels[s] || '',
      color: colors[s] || 'bg-gray-100 text-gray-800 border border-gray-300',
    };
  };

  return (
    <div className="space-y-6">
      {/* Wallet */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-orange-600" />
          <div>
            <div className="text-sm font-medium text-gray-600">Portefeuille</div>
            <div className="text-2xl font-bold text-orange-600">
              {walletLoading ? '…' : formatCad(walletTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
          <div className="text-sm text-gray-600">Clients assignés</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600">{counts.withProject}</div>
          <div className="text-sm text-gray-600">Dossiers</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{counts.propositions}</div>
          <div className="text-sm text-gray-600">Propositions</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600">{counts.actifs}</div>
          <div className="text-sm text-gray-600">Actifs</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un client…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Clients</h3>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader className="w-6 h-6 text-orange-600 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
            <button
              onClick={() => loadClients(q, page)}
              className="mt-3 text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && clients.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Mail className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun client assigné pour le moment.</p>
          </div>
        )}

        {!loading && !error && clients.length > 0 && (
          <div className="space-y-2">
            {clients.map((client) => {
              const displayName = (client.name || client.email || 'Client').trim();
              const preview = (client.last_msg || 'Aucun message').slice(0, 80);
              const status = getStatusInfo(client.project_status);

              return (
                <button
                  key={client.id}
                  onClick={() => {
                    if (onClientSelect) {
                      onClientSelect(client.id, displayName, client.email);
                    }
                  }}
                  className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-orange-700 uppercase">
                        {getInitials(client.name, client.email)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">{displayName}</span>
                        {status.label && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${status.color}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>
                    </div>
                    <div className="text-gray-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {page} sur {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
