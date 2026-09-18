import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicGroup, savePublicResponses, PublicResponseInput } from '../services/rsvpService';
import { GuestGroup, AttendanceStatus } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Toast, ToastType } from '../components/common/Toast';
import { CheckCircle2, HeartHandshake, Sparkles, AlertCircle, Save } from 'lucide-react';

interface GuestState {
  id: string;
  name: string;
  type: 'adult' | 'child';
  status: AttendanceStatus;
}

export const PublicRSVP: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [group, setGroup] = useState<GuestGroup | null>(null);
  const [guestStates, setGuestStates] = useState<GuestState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const loadGroup = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getPublicGroup(token);
        setGroup(data);

        if (data) {
          const list: GuestState[] = [];
          (data.adults || []).forEach(a => {
            list.push({ id: a.id, name: a.name, type: 'adult', status: a.status || 'pending' });
          });
          (data.children || []).forEach(c => {
            list.push({ id: c.id, name: c.name, type: 'child', status: c.status || 'pending' });
          });
          setGuestStates(list);
        }
      } catch (error) {
        console.error("Erro ao carregar página de confirmação:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [token]);

  const handleStatusChange = (guestId: string, newStatus: AttendanceStatus) => {
    setSavedSuccess(false);
    setGuestStates(prev =>
      prev.map(g => (g.id === guestId ? { ...g, status: g.status === newStatus ? 'pending' : newStatus } : g))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      const responses: PublicResponseInput[] = guestStates.map(g => ({
        guestId: g.id,
        type: g.type,
        status: g.status
      }));

      await savePublicResponses(token, responses);
      setSavedSuccess(true);
      setToast({
        message: "Suas respostas foram registradas com sucesso!",
        type: "success"
      });
    } catch (error) {
      console.error("Erro ao salvar respostas:", error);
      setToast({
        message: "Não foi possível registrar suas respostas. Tente novamente.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <LoadingSpinner message="Carregando convite..." />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-['Outfit']">Convite Não Encontrado</h2>
          <p className="text-sm text-slate-400">
            O link de confirmação acessado é inválido ou expirou. Verifique o link com quem o enviou.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] py-8 sm:py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Header Invitation Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl text-center border border-amber-500/20 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 shadow-xl shadow-amber-500/20 mb-4 text-slate-950">
            <HeartHandshake className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit'] tracking-tight">
            Confirmação de Presença
          </h1>
          <div className="mt-2 inline-block px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 font-semibold text-sm">
            {group.groupName}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-3 max-w-md mx-auto">
            Por favor, selecione abaixo quem estará presente no nosso evento especial.
          </p>
        </div>

        {/* Feedback Banner if saved */}
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-center shadow-xl animate-fade-in flex items-center justify-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-sm sm:text-base">
              Suas respostas foram registradas.
            </span>
          </div>
        )}

        {/* RSVP Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-3">
            {guestStates.map((guest) => {
              return (
                <div
                  key={guest.id}
                  className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-base font-bold text-white font-['Outfit']">
                      {guest.name}
                    </h3>
                  </div>

                  {/* Options Buttons */}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(guest.id, 'going')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        guest.status === 'going'
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Vou</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(guest.id, 'notGoing')}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        guest.status === 'notGoing'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 ring-2 ring-rose-500'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <span>Não vou</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                <span>Salvando respostas...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Confirmar respostas</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 pt-4">
          Agradecemos a sua confirmação!
        </p>
      </div>

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
