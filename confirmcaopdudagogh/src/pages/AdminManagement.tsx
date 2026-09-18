import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { listAdmins, addAdmin, updateAdminStatus, removeAdmin } from '../services/adminService';
import { AdminRecord } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Toast, ToastType } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserPlus, Power, Trash2, Mail, CheckCircle2, XCircle } from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form input
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Delete modal
  const [deletingAdmin, setDeletingAdmin] = useState<AdminRecord | null>(null);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await listAdmins();
      setAdmins(data);
    } catch (error) {
      console.error("Erro ao carregar administradores:", error);
      setToast({
        message: "Não foi possível carregar a lista de administradores.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      setSubmitting(true);
      await addAdmin(newEmail);
      setToast({
        message: `Administrador "${newEmail.trim().toLowerCase()}" adicionado com sucesso!`,
        type: "success"
      });
      setNewEmail('');
      await loadAdmins();
    } catch (error: any) {
      console.error("Erro ao adicionar admin:", error);
      setToast({
        message: error.message || "Erro ao adicionar administrador.",
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminRecord) => {
    try {
      const newStatus = !admin.active;
      await updateAdminStatus(admin.email, newStatus);
      setToast({
        message: `Status de ${admin.email} alterado para ${newStatus ? 'Ativo' : 'Desativado'}.`,
        type: "info"
      });
      await loadAdmins();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setToast({
        message: "Erro ao atualizar status do administrador.",
        type: "error"
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAdmin) return;

    // Não permite remover a si próprio
    if (currentUser?.email?.toLowerCase() === deletingAdmin.email.toLowerCase()) {
      setToast({
        message: "Você não pode remover seu próprio usuário da lista.",
        type: "error"
      });
      setDeletingAdmin(null);
      return;
    }

    try {
      await removeAdmin(deletingAdmin.email);
      setToast({
        message: `Administrador ${deletingAdmin.email} foi removido.`,
        type: "success"
      });
      setDeletingAdmin(null);
      await loadAdmins();
    } catch (error) {
      console.error("Erro ao remover admin:", error);
      setToast({
        message: "Erro ao remover administrador.",
        type: "error"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
            Gerenciamento de Administradores
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre novos e-mails administrativos e controle quem possui permissão de acesso ao painel
          </p>
        </div>

        {/* Add Admin Form Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white font-['Outfit'] mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            Adicionar Novo Administrador
          </h2>

          <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="novo.admin@gmail.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-amber-500 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Adicionando...' : 'Adicionar Admin'}</span>
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-3">
            * O e-mail informado terá permissão de login no painel assim que criar sua conta no Firebase Authentication.
          </p>
        </div>

        {/* Admin List Table / Cards */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            Administradores Cadastrados ({admins.length})
          </h2>

          {loading ? (
            <LoadingSpinner message="Buscando lista de administradores..." />
          ) : admins.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-4">Nenhum administrador cadastrado.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {admins.map((admin) => {
                const isCurrent = currentUser?.email?.toLowerCase() === admin.email.toLowerCase();

                return (
                  <div key={admin.email} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center border border-slate-700 shrink-0">
                        {admin.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{admin.email}</p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Função: <span className="text-slate-300 font-medium">admin</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {/* Status badge */}
                      {admin.active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/50">
                          <XCircle className="w-3.5 h-3.5" /> Desativado
                        </span>
                      )}

                      {/* Toggle status button */}
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        disabled={isCurrent}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          admin.active
                            ? 'text-yellow-400 border-yellow-800/40 hover:bg-yellow-950/30'
                            : 'text-emerald-400 border-emerald-800/40 hover:bg-emerald-950/30'
                        } disabled:opacity-40 disabled:pointer-events-none`}
                        title={admin.active ? 'Desativar administrador' : 'Reativar administrador'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{admin.active ? 'Desativar' : 'Reativar'}</span>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeletingAdmin(admin)}
                        disabled={isCurrent}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none"
                        title="Remover administrador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Admin Modal */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131b2e] border border-rose-900/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Remover Administrador?
            </h3>
            <p className="text-sm text-slate-300">
              Tem certeza que deseja remover o e-mail <strong className="text-white">{deletingAdmin.email}</strong> da lista de administradores autorizados?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setDeletingAdmin(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/20 transition-all"
              >
                Sim, Remover Admin
              </button>
            </div>
          </div>
        </div>
      )}

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
