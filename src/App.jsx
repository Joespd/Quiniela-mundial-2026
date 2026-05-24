import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { Trophy, Users, MapPin, Target, PiggyBank, Calendar, ChevronRight } from 'lucide-react';

// 1. Inicialización segura de Firebase
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mundial-2026-prod';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState({ matches: [], teams: [], users: [] });

  // 2. Auth y carga de datos en tiempo real
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        signInAnonymously(auth);
      }
    });

    // Suscripciones a colecciones
    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (s) => 
      setData(prev => ({ ...prev, matches: s.docs.map(d => ({ id: d.id, ...d.data() })) }))
    );
    
    return () => { unsubAuth(); unsubMatches(); };
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center text-emerald-500 font-bold">Cargando Sistema Mundial...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Navbar Superior */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center">
        <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" /> MUNDIAL 2026
        </h1>
        <div className="bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 flex items-center gap-2">
          <PiggyBank size={16} className="text-emerald-400" />
          <span className="font-bold text-emerald-400">$5,000.00</span>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tarjeta de Resumen */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl">
              <h2 className="text-2xl font-bold mb-2">¡Bienvenido, Usuario!</h2>
              <p className="text-slate-400 mb-6">Gestiona tus pronósticos y sigue los resultados en tiempo real.</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Partidos', val: data.matches.length, icon: Calendar },
                  { label: 'Usuarios', val: '12', icon: Users },
                  { label: 'Estadios', val: '16', icon: MapPin },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                    <stat.icon className="mx-auto mb-1 text-emerald-500" size={20} />
                    <div className="text-xl font-black">{stat.val}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Listado de Partidos */}
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Target className="text-emerald-500" /> Próximos Encuentros
            </h3>
            <div className="space-y-3">
              {data.matches.length === 0 ? (
                <div className="p-8 text-center text-slate-600 italic">No hay partidos registrados aún.</div>
              ) : (
                data.matches.map(m => (
                  <div key={m.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex justify-between items-center hover:border-emerald-500/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold">{m.home || 'TBD'} vs {m.away || 'TBD'}</span>
                      <span className="text-xs text-slate-500">{m.date || 'Sin fecha'}</span>
                    </div>
                    <ChevronRight className="text-slate-600" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Menú inferior para móviles */}
      <div className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50">
        {['home', 'standings', 'profile'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`p-2 ${activeTab === tab ? 'text-emerald-400' : 'text-slate-500'}`}>
            <div className="capitalize font-bold text-xs">{tab}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
