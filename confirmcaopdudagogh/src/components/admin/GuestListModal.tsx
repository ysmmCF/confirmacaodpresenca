import React from 'react';
import { GuestGroup } from '../../types';
import { X, CheckCircle2, Clock, XCircle, Wine, Mars, Venus, User, Baby } from 'lucide-react';

interface GuestListModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: GuestGroup | null;
}

export const GuestListModal: React.FC<GuestListModalProps> = ({
  isOpen,
  onClose,
  group
}) => {
  if (!isOpen || !group) return null;

  const adults = group.adults || [];
  const children = group.children || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'going':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
          </span>
        );
      case 'notGoing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/50">
            <XCircle className="w-3.5 h-3.5" /> Não Vai
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-950/80 text-yellow-300 border border-yellow-700/50">
            <Clock className="w-3.5 h-3.5" /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#131b2e] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              {group.groupName}
            </h2>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              Lista detalhada de convidados e informações privadas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* ADULTOS */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 tracking-wider uppercase mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              Adultos ({adults.length})
            </h3>
            {adults.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhum adulto neste grupo.</p>
            ) : (
              <div className="space-y-2">
                {adults.map((adult) => (
                  <div
                    key={adult.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{adult.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
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

          {/* CRIANÇAS */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 tracking-wider uppercase mb-3 flex items-center gap-2">
              <Baby className="w-4 h-4 text-sky-400" />
              Crianças ({children.length})
            </h3>
            {children.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Nenhuma criança neste grupo.</p>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{child.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="text-amber-400/80 font-mono">slot_{child.slotIndex}</span>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
