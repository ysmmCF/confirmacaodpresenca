import React from 'react';
import { GuestGroup } from '../../types';
import { 
  Users, 
  Copy, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Baby,
  User
} from 'lucide-react';

interface GroupCardProps {
  group: GuestGroup;
  onEdit: (group: GuestGroup) => void;
  onViewGuests: (group: GuestGroup) => void;
  onDelete: (group: GuestGroup) => void;
  onCopyLink: (link: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onEdit,
  onViewGuests,
  onDelete,
  onCopyLink
}) => {
  const adults = group.adults || [];
  const children = group.children || [];
  const allGuests = [...adults, ...children];

  const totalPeople = allGuests.length;
  const confirmedCount = allGuests.filter(g => g.status === 'going').length;
  const pendingCount = allGuests.filter(g => g.status === 'pending').length;
  const notGoingCount = allGuests.filter(g => g.status === 'notGoing').length;

  const basePath = window.location.pathname.startsWith('/confirmacaodpresenca') ? '/confirmacaodpresenca' : '';
  const publicUrl = `${window.location.origin}${basePath}/confirmacao/${group.publicToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    onCopyLink(publicUrl);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between gap-4">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-bold text-white font-['Outfit'] truncate">
            {group.groupName}
          </h3>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 text-amber-300 border border-slate-700/60 shrink-0">
            <Users className="w-3.5 h-3.5" />
            {totalPeople} {totalPeople === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>

        {/* Counts breakdown */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80 my-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span>Adultos: <strong className="text-white">{adults.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Baby className="w-3.5 h-3.5 text-sky-400" />
            <span>Crianças: <strong className="text-white">{children.length}</strong></span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {confirmedCount} Confirmados
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-950/60 text-yellow-300 border border-yellow-800/40">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} Pendentes
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/40">
            <XCircle className="w-3.5 h-3.5" />
            {notGoingCount} Não vão
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewGuests(group)}
            className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Ver detalhes dos convidados"
          >
            <Eye className="w-4 h-4" />
            <span>Ver</span>
          </button>

          <button
            onClick={() => onEdit(group)}
            className="p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800/60 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="Editar grupo"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg border border-amber-500/20 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Copiar link público"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Link</span>
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Abrir link em nova aba"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => onDelete(group)}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Excluir grupo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
