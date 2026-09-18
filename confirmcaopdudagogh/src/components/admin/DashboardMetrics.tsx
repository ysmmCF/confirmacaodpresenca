import React from 'react';
import { DashboardStats } from '../../types';
import { 
  Users, 
  UserCheck, 
  Clock, 
  UserX, 
  User, 
  Baby, 
  Wine, 
  FolderGit2,
  Mars,
  Venus
} from 'lucide-react';

interface DashboardMetricsProps {
  stats: DashboardStats;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total de Grupos',
      value: stats.totalGroups,
      icon: FolderGit2,
      color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30'
    },
    {
      title: 'Total de Convidados',
      value: stats.totalGuests,
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30'
    },
    {
      title: 'Confirmados',
      value: stats.confirmed,
      icon: UserCheck,
      color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: Clock,
      color: 'from-yellow-500/20 to-yellow-600/10 text-yellow-400 border-yellow-500/30'
    },
    {
      title: 'Não Vão',
      value: stats.notGoing,
      icon: UserX,
      color: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30'
    },
    {
      title: 'Adultos',
      value: stats.adultsCount,
      icon: User,
      color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30'
    },
    {
      title: 'Crianças',
      value: stats.childrenCount,
      icon: Baby,
      color: 'from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/30'
    },
    {
      title: 'Homens',
      value: stats.menCount,
      icon: Mars,
      color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30'
    },
    {
      title: 'Mulheres',
      value: stats.womenCount,
      icon: Venus,
      color: 'from-fuchsia-500/20 to-fuchsia-600/10 text-fuchsia-400 border-fuchsia-500/30'
    },
    {
      title: 'Bebem Álcool',
      value: stats.alcoholDrinkersCount,
      icon: Wine,
      color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-gradient-to-b ${card.color} border backdrop-blur-md transition-transform hover:-translate-y-1`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300 tracking-wide">
                {card.title}
              </span>
              <Icon className="w-4 h-4 opacity-80" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
};
