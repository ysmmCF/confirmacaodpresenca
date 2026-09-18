import React, { useState, useEffect } from 'react';
import { GuestGroup, Gender, AttendanceStatus } from '../../types';
import { CreateGroupInput } from '../../services/groupService';
import { X, Plus, Trash2, UserPlus, Baby, Save } from 'lucide-react';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateGroupInput) => Promise<void>;
  initialData?: GuestGroup | null;
}

interface GuestItemForm {
  id?: string;
  name: string;
  gender: Gender;
  drinksAlcohol: boolean;
  status: AttendanceStatus;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [groupName, setGroupName] = useState('');
  const [adults, setAdults] = useState<GuestItemForm[]>([]);
  const [children, setChildren] = useState<GuestItemForm[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setGroupName(initialData.groupName || '');

      // Popula adultos
      const mappedAdults: GuestItemForm[] = (initialData.adults || []).map(a => ({
        id: a.id,
        name: a.name,
        gender: a.privateData?.gender || 'male',
        drinksAlcohol: a.privateData?.drinksAlcohol ?? true,
        status: a.status || 'pending'
      }));
      setAdults(mappedAdults.length > 0 ? mappedAdults : [{ name: '', gender: 'male', drinksAlcohol: true, status: 'pending' }]);

      // Popula crianças
      const mappedChildren: GuestItemForm[] = (initialData.children || []).map(c => ({
        id: c.id,
        name: c.name,
        gender: c.privateData?.gender || 'male',
        drinksAlcohol: c.privateData?.drinksAlcohol ?? false,
        status: c.status || 'pending'
      }));
      setChildren(mappedChildren);
    } else {
      setGroupName('');
      setAdults([{ name: '', gender: 'male', drinksAlcohol: true, status: 'pending' }]);
      setChildren([]);
    }
    setErrorMessage('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddAdult = () => {
    setAdults([...adults, { name: '', gender: 'male', drinksAlcohol: true, status: 'pending' }]);
  };

  const handleRemoveAdult = (index: number) => {
    setAdults(adults.filter((_, i) => i !== index));
  };

  const handleAdultChange = (index: number, field: keyof GuestItemForm, value: any) => {
    const updated = [...adults];
    updated[index] = { ...updated[index], [field]: value };
    setAdults(updated);
  };

  const handleAddChild = () => {
    setChildren([...children, { name: '', gender: 'male', drinksAlcohol: false, status: 'pending' }]);
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, field: keyof GuestItemForm, value: any) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!groupName.trim()) {
      setErrorMessage('Por favor, informe o nome do grupo.');
      return;
    }

    const validAdults = adults.filter(a => a.name.trim().length > 0);
    const validChildren = children.filter(c => c.name.trim().length > 0);

    if (validAdults.length === 0 && validChildren.length === 0) {
      setErrorMessage('O grupo precisa ter ao menos um convidado cadastrado com nome.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        groupName,
        adults: validAdults,
        children: validChildren
      });
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar grupo:", err);
      setErrorMessage(err.message || 'Ocorreu um erro ao salvar o grupo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#131b2e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white font-['Outfit']">
            {initialData ? 'Editar Grupo de Convidados' : 'Criar Novo Grupo de Convidados'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-sm rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Nome do Grupo */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Nome do Grupo *
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Família Silva, Colegas de trabalho..."
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all"
            />
          </div>

          {/* ADULTOS SECTION */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                ADULTOS ({adults.length})
              </h3>
              <button
                type="button"
                onClick={handleAddAdult}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Adulto</span>
              </button>
            </div>

            {adults.map((adult, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">Adulto #{idx + 1}</span>
                  {adults.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAdult(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Remover adulto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Nome */}
                  <div className="lg:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={adult.name}
                      onChange={(e) => handleAdultChange(idx, 'name', e.target.value)}
                      placeholder="Nome do adulto"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Sexo */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sexo (Privado)</label>
                    <select
                      value={adult.gender}
                      onChange={(e) => handleAdultChange(idx, 'gender', e.target.value as Gender)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
                    >
                      <option value="male">Homem</option>
                      <option value="female">Mulher</option>
                    </select>
                  </div>

                  {/* Bebe álcool */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Bebe Álcool? (Privado)</label>
                    <select
                      value={adult.drinksAlcohol ? 'true' : 'false'}
                      onChange={(e) => handleAdultChange(idx, 'drinksAlcohol', e.target.value === 'true')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-xs text-slate-400 mb-1">Status de Presença</label>
                    <select
                      value={adult.status}
                      onChange={(e) => handleAdultChange(idx, 'status', e.target.value as AttendanceStatus)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-amber-500 outline-none"
                    >
                      <option value="pending">Pendente (Aguardando resposta)</option>
                      <option value="going">Confirmado (Vou)</option>
                      <option value="notGoing">Não vai (Não poderei comparecer)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CRIANÇAS SECTION */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-sky-400 flex items-center gap-2">
                <Baby className="w-5 h-5" />
                CRIANÇAS ({children.length})
              </h3>
              <button
                type="button"
                onClick={handleAddChild}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Criança</span>
              </button>
            </div>

            {children.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">Nenhuma criança adicionada a este grupo.</p>
            ) : (
              children.map((child, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-sky-400">Criança #{idx + 1} (slot_{idx})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChild(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Remover criança"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Nome */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={child.name}
                        onChange={(e) => handleChildChange(idx, 'name', e.target.value)}
                        placeholder="Nome da criança"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-sky-500 outline-none"
                      />
                    </div>

                    {/* Sexo */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Sexo (Privado)</label>
                      <select
                        value={child.gender}
                        onChange={(e) => handleChildChange(idx, 'gender', e.target.value as Gender)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-sky-500 outline-none"
                      >
                        <option value="male">Homem</option>
                        <option value="female">Mulher</option>
                      </select>
                    </div>

                    {/* Bebe álcool */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Bebe Álcool? (Privado)</label>
                      <select
                        value={child.drinksAlcohol ? 'true' : 'false'}
                        onChange={(e) => handleChildChange(idx, 'drinksAlcohol', e.target.value === 'true')}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-sky-500 outline-none"
                      >
                        <option value="false">Não</option>
                        <option value="true">Sim</option>
                      </select>
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="block text-xs text-slate-400 mb-1">Status de Presença</label>
                      <select
                        value={child.status}
                        onChange={(e) => handleChildChange(idx, 'status', e.target.value as AttendanceStatus)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:border-sky-500 outline-none"
                      >
                        <option value="pending">Pendente (Aguardando resposta)</option>
                        <option value="going">Confirmado (Vou)</option>
                        <option value="notGoing">Não vai (Não poderei comparecer)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Salvando...' : 'Salvar Grupo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
