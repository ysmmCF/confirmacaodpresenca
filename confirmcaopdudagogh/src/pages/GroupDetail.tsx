import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { getGroup } from '../services/groupService';
import { GuestGroup } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Toast, ToastType } from '../components/common/Toast';
import { ArrowLeft, Copy, ExternalLink, Users, User, Baby, Wine, Mars, Venus, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<GuestGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getGroup(id);
        setGroup(data);
      } catch (error) {
        console.error("Erro ao carregar detalhes do grupo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <LoadingSpinner message="Carregando informações do grupo..." />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white font-['Outfit']">Grupo não encontrado</h2>
          <p className="text-slate-400 text-sm">O grupo solicitado não existe ou foi excluído.</p>
          <Link
            to="/admin/grupos"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Grupos
          </Link>
        </main>
      </div>
    );
  }

  const basePath = window.location.pathname.startsWith('/confirmacaodpresenca') ? '/confirmacaodpresenca' : '';
  const publicUrl = `${window.location.origin}${basePath}/confirmacao/${group.publicToken}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setToast({ message: 'Link copiado!', type: 'success' });
  };

  const adults = group.adults || [];
  const children = group.children || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'going':
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmado</span>;
      case 'notGoing':
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/50 inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Não Vai</span>;
      default:
        return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-950/80 text-yellow-300 border border-yellow-700/50 inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pendente</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Back & Header */}
        <div className="space-y-4">
          <Link
            to="/admin/grupos"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Lista de Grupos
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
                {group.groupName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Token público: <code className="text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">{group.publicToken}</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-bold text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Link Público</span>
              </button>

              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Abrir página pública"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Guest Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Total de Pessoas</span>
            <p className="text-2xl font-bold text-white font-['Outfit'] mt-1">{adults.length + children.length}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Adultos</span>
            <p className="text-2xl font-bold text-indigo-400 font-['Outfit'] mt-1">{adults.length}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Crianças</span>
            <p className="text-2xl font-bold text-sky-400 font-['Outfit'] mt-1">{children.length}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Confirmados</span>
            <p className="text-2xl font-bold text-emerald-400 font-['Outfit'] mt-1">
              {[...adults, ...children].filter(g => g.status === 'going').length}
            </p>
          </div>
        </div>

        {/* Detailed Guest Tables */}
        <div className="space-y-6">
          {/* Adultos */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Adultos do Grupo ({adults.length})
            </h3>
            {adults.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum adulto cadastrado neste grupo.</p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {adults.map(adult => (
                  <div key={adult.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{adult.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          {adult.privateData?.gender === 'male' ? (
                            <><Mars className="w-3.5 h-3.5 text-cyan-400" /> Homem</>
                          ) : (
                            <><Venus className="w-3.5 h-3.5 text-fuchsia-400" /> Mulher</>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wine className="w-3.5 h-3.5 text-purple-400" />
                          {adult.privateData?.drinksAlcohol ? 'Bebe álcool' : 'Não bebe'}
                        </span>
                      </div>
                    </div>
                    <div>{getStatusBadge(adult.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Crianças */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <Baby className="w-5 h-5 text-sky-400" />
              Crianças do Grupo ({children.length})
            </h3>
            {children.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhuma criança cadastrada neste grupo.</p>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {children.map(child => (
                  <div key={child.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{child.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="text-amber-400 font-mono">slot_{child.slotIndex}</span>
                        <span className="flex items-center gap-1">
                          {child.privateData?.gender === 'male' ? (
                            <><Mars className="w-3.5 h-3.5 text-cyan-400" /> Homem</>
                          ) : (
                            <><Venus className="w-3.5 h-3.5 text-fuchsia-400" /> Mulher</>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wine className="w-3.5 h-3.5 text-purple-400" />
                          {child.privateData?.drinksAlcohol ? 'Bebe álcool' : 'Não bebe'}
                        </span>
                      </div>
                    </div>
                    <div>{getStatusBadge(child.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
