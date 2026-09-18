import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { GroupCard } from '../components/admin/GroupCard';
import { GroupFormModal } from '../components/admin/GroupFormModal';
import { GuestListModal } from '../components/admin/GuestListModal';
import { listGroups, createGroup, updateGroup, deleteGroup, CreateGroupInput } from '../services/groupService';
import { GuestGroup } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Toast, ToastType } from '../components/common/Toast';
import { Plus, Search, Users, AlertTriangle } from 'lucide-react';

export const GroupsManagement: React.FC = () => {
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null);
  
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<GuestGroup | null>(null);

  const [deletingGroup, setDeletingGroup] = useState<GuestGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await listGroups();
      setGroups(data);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
      setToast({
        message: "Não foi possível carregar a lista de grupos.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateNew = () => {
    setEditingGroup(null);
    setIsFormOpen(true);
  };

  const handleEditGroup = (group: GuestGroup) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const handleViewGuests = (group: GuestGroup) => {
    setViewingGroup(group);
    setIsViewOpen(true);
  };

  const handleSaveForm = async (input: CreateGroupInput) => {
    if (editingGroup) {
      await updateGroup(editingGroup.publicToken, input);
      setToast({
        message: "Grupo atualizado com sucesso!",
        type: "success"
      });
    } else {
      await createGroup(input);
      setToast({
        message: "Grupo criado com sucesso!",
        type: "success"
      });
    }
    await loadGroups();
  };

  const ConfirmDeleteGroup = async () => {
    if (!deletingGroup) return;

    try {
      setIsDeleting(true);
      await deleteGroup(deletingGroup.publicToken);
      setToast({
        message: `Grupo "${deletingGroup.groupName}" e seus convidados foram excluídos.`,
        type: "success"
      });
      setDeletingGroup(null);
      await loadGroups();
    } catch (error) {
      console.error("Erro ao excluir grupo:", error);
      setToast({
        message: "Erro ao tentar excluir o grupo.",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
              Grupos de Convidados
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Cadastre famílias, grupos e acompanhe as confirmações de presença
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Novo Grupo</span>
          </button>
        </div>

        {/* Search & Counter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do grupo..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 focus:border-amber-500 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
            />
          </div>

          <div className="text-xs text-slate-400 self-end sm:self-center">
            Total de grupos: <strong className="text-amber-400">{groups.length}</strong>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Carregando grupos do evento..." />
        ) : filteredGroups.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">Nenhum grupo encontrado</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? `Nenhum grupo corresponde à busca "${searchQuery}".`
                  : 'Comece cadastrando o primeiro grupo de convidados para o evento.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-semibold text-sm transition-colors mt-2"
              >
                <Plus className="w-4 h-4" />
                Cadastrar primeiro grupo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={handleEditGroup}
                onViewGuests={handleViewGuests}
                onDelete={setDeletingGroup}
                onCopyLink={() => setToast({ message: 'Link copiado!', type: 'success' })}
              />
            ))}
          </div>
        )}
      </main>

      {/* Form Modal (Create / Edit) */}
      <GroupFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveForm}
        initialData={editingGroup}
      />

      {/* View Guests Modal */}
      <GuestListModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        group={viewingGroup}
      />

      {/* Delete Confirmation Modal */}
      {deletingGroup && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#131b2e] border border-rose-900/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                Excluir Grupo?
              </h3>
            </div>

            <p className="text-sm text-slate-300">
              Tem certeza que deseja excluir o grupo <strong className="text-white">"{deletingGroup.groupName}"</strong>?
              Esta ação excluirá permanentemente todos os convidados (adultos e crianças) e suas informações privadas.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                disabled={isDeleting}
                onClick={() => setDeletingGroup(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isDeleting}
                onClick={ConfirmDeleteGroup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Grupo'}
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
