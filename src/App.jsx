import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Trophy, Users, MapPin, Target, Calendar, ChevronRight, Activity, Bell, UserCircle } from 'lucide-react';

// Inicialización de Firebase (Configuración segura)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mundial-2026-prod';
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({ matches: [], standings: [], news: [] });

  // Autenticación y Carga de Datos
  useEffect(() => {
    const initAuth = async () => {
      onAuthStateChanged(auth, async (u) => {
        if (u) {
          setUser(u);
          setLoading(false);
        } else {
          await signInAnonymously(auth);
        }
      });
    };
    initAuth();

    // Suscripciones a Firestore (Datos públicos)
    const matchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const unsub = onSnapshot(matchesRef, (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(prev => ({ ...prev, matches: matchesData }));
    }, (error) => console.error("Error en Firestore:", error));

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-emerald-400">
        <div className="animate-pulse flex flex-col items-center">
          <Trophy size={48} className="mb-4" />
          <span className="font-bold text-xl uppercase tracking-widest">Iniciando Sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/20">
      {/* Header Fijo */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <Trophy className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight">MUNDIAL 2026</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Dashboard Oficial</p>
          </div>
        </div>
        <button className="bg-slate-800 p-2 rounded-full border border-slate-700">
          <Bell size={20} className="text-slate-400" />
        </button>
      </header>

      {/* Contenido Dinámico */}
      <main className="max-w-2xl mx-auto p-4 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Tarjeta de bienvenida/estatus */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity size={120} />
              </div>
              <h2 className="text-xl font-bold mb-1">Estado del Campeonato</h2>
              <p className="text-slate-400 text-sm mb-4">Todo al día. Los próximos partidos están listos.</p>
              <div className="flex gap-4">
                <StatCard icon={Users} label="Usuarios" value="1,240" />
                <StatCard icon={Target} label="Pronósticos" value="8,902" />
              </div>
            </div>

            {/* Listado de Partidos */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-bold text-lg">Próximos Partidos</h3>
                <span className="text-xs text-emerald-500 font-bold cursor-pointer">Ver todos</span>
              </div>
              
              <div className="space-y-3">
                {data.matches.length === 0 ? (
                  <div className="text-center py-10 bg-slate-900 rounded-2xl border border-dashed border-slate-700 text-slate-500 italic">
                    Sin partidos programados
                  </div>
                ) : (
                  data.matches.map((m) => (
                    <div key={m.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between hover:bg-slate-800 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Oct</div>
                          <div className="text-lg font-black">12</div>
                        </div>
                        <div>
                          <div className="font-bold text-sm">{m.home || 'Equipo Local'}</div>
                          <div className="font-bold text-sm">{m.away || 'Equipo Visitante'}</div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-600" />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Navegación Inferior */}
      <nav className="fixed bottom-0 w-full bg-slate-950 border-t border-slate-800 p-4 flex justify-around">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Activity} label="Inicio" />
        <NavButton active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={MapPin} label="Sedes" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={UserCircle} label="Perfil" />
      </nav>
    </div>
  );
}

// Componentes Auxiliares
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 flex-1">
      <Icon className="text-emerald-500 mb-1" size={16} />
      <div className="text-xl font-black text-white">{value}</div>
      <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{label}</div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-emerald-400' : 'text-slate-600'}`}>
      <Icon size={24} />
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
