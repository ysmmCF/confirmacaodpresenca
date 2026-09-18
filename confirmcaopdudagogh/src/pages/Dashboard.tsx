import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { DashboardMetrics } from '../components/admin/DashboardMetrics';
import { getDashboardStats } from '../services/groupService';
import { DashboardStats } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Toast, ToastType } from '../components/common/Toast';
import { Link } from 'react-router-dom';
import { Plus, Users, ShieldCheck, RefreshCw } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error: any) {
      console.error("Erro ao carregar estatísticas do dashboard:", error);
      setToast({
        message: "Não foi possível carregar as estatísticas em tempo real.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
              Visão Geral do Evento
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Estatísticas e métricas agregadas em tempo real dos grupos e convidados
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadStats}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
              title="Atualizar estatísticas"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <Link
              to="/admin/grupos"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Gerenciar Grupos</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Content */}
        {loading && !stats ? (
          <LoadingSpinner message="Calculando dados reais do Firestore..." />
        ) : stats ? (
          <div className="space-y-8">
            <DashboardMetrics stats={stats} />

            {/* Quick Actions & Shortcut Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white font-['Outfit']">
                    Gestão de Grupos & Links
                  </h3>
                  <p className="text-xs text-slate-400">
                    Crie novos grupos de convidados, cadastre adultos e crianças com informações privadas e compartilhe os links públicos de confirmação.
                  </p>
                  <Link
                    to="/admin/grupos"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:underline pt-1"
                  >
                    Ver todos os grupos &rarr;
                  </Link>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white font-['Outfit']">
                    Administradores do Sistema
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gerencie o e-mail dos administradores autorizados com acesso às estatísticas privadas e ao controle do evento.
                  </p>
                  <Link
                    to="/admin/administradores"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:underline pt-1"
                  >
                    Gerenciar equipe de admins &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Nenhum dado encontrado no momento.
          </div>
        )}
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
