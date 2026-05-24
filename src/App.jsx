import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { Trophy, Users, MapPin, Target, Calendar, ChevronRight, Activity, Bell, UserCircle, Search, Filter, Shield, Award } from 'lucide-react';

// Configuración de Firebase
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mundial-2026-full';
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({ users: 0, predictions: 0 });
  const [error, setError] = useState(null);

  // Inicialización de Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        setError("Error de conexión");
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Carga de datos de Firestore con manejo robusto
  useEffect(() => {
    if (!user) return;
    
    const matchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const unsub = onSnapshot(query(matchesRef), (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatches(data);
    }, (err) => {
      console.error("Firestore error:", err);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-emerald-500 font-black tracking-widest text-xl">CARGANDO...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Header />
      
      <main className="max-w-3xl mx-auto p-4 pb-32">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <StatsSection />
            <MatchesSection matches={matches} />
            <NewsSection />
          </div>
        )}
        
        {activeTab === 'map' && <MapSection />}
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

// --- Componentes Detallados ---

const Header = () => (
  <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 p-4 flex justify-between items-center">
    <div>
      <h1 className="text-xl font-black text-white">MUNDIAL 2026</h1>
      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Plataforma oficial</p>
    </div>
    <div className="flex gap-2">
      <button className="p-2 bg-slate-900 rounded-full border border-slate-800"><Search size={18} /></button>
      <button className="p-2 bg-slate-900 rounded-full border border-slate-800"><Bell size={18} /></button>
    </div>
  </header>
);

const StatsSection = () => (
  <div className="grid grid-cols-2 gap-4 mt-4">
    <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-2xl border border-slate-800">
      <Users className="text-emerald-500 mb-2" />
      <div className="text-2xl font-black">1.2K</div>
      <div className="text-[10px] uppercase text-slate-400">Usuarios activos</div>
    </div>
    <div className="bg-gradient-to-br from-blue-900/30 to-slate-900 p-4 rounded-2xl border border-slate-800">
      <Target className="text-blue-500 mb-2" />
      <div className="text-2xl font-black">8.9K</div>
      <div className="text-[10px] uppercase text-slate-400">Pronósticos</div>
    </div>
  </div>
);

const MatchesSection = ({ matches }) => (
  <section>
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold text-lg text-white">Próximos Encuentros</h2>
      <Filter size={16} className="text-slate-500" />
    </div>
    <div className="space-y-3">
      {matches.length > 0 ? matches.map(m => (
        <div key={m.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="text-center font-bold text-sm bg-slate-800 p-2 rounded-lg text-emerald-400">{m.date || '---'}</div>
             <div>
               <div className="font-bold">{m.home || 'TBD'}</div>
               <div className="font-bold text-slate-500">{m.away || 'TBD'}</div>
             </div>
           </div>
           <ChevronRight className="text-slate-600" />
        </div>
      )) : (
        <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
          No hay partidos programados actualmente
        </div>
      )}
    </div>
  </section>
);

const NewsSection = () => (
  <section className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
    <h2 className="font-bold mb-4 flex items-center gap-2"><Award size={18} /> Noticias Destacadas</h2>
    <div className="text-sm text-slate-400">Última actualización: Estadio Azteca confirmado para la inauguración.</div>
  </section>
);

const MapSection = () => (
  <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-3xl">
    <MapPin size={48} className="text-slate-700 mb-4" />
    <p className="text-slate-500">Mapa de sedes en mantenimiento</p>
  </div>
);

const Footer = ({ activeTab, setActiveTab }) => (
  <nav className="fixed bottom-0 w-full bg-slate-950 border-t border-slate-800 p-4 flex justify-around z-50">
    {['dashboard', 'map', 'profile'].map((tab) => (
      <button key={tab} onClick={() => setActiveTab(tab)} className={`p-2 flex flex-col items-center ${activeTab === tab ? 'text-emerald-500' : 'text-slate-600'}`}>
        {tab === 'dashboard' && <Activity size={24} />}
        {tab === 'map' && <MapPin size={24} />}
        {tab === 'profile' && <UserCircle size={24} />}
        <span className="text-[10px] font-bold mt-1 capitalize">{tab}</span>
      </button>
    ))}
  </nav>
);
