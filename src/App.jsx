import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc } from 'firebase/firestore';
import { Trophy, Users, MapPin, Target, ShieldCheck, PiggyBank, Plus, Save, Trash2 } from 'lucide-react';

// Configuración Firebase (Usando el appId del entorno)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'spd-mundial-2026';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Estados para formularios
  const [newTeam, setNewTeam] = useState({ name: '', code: '', group: 'A' });
  const [newMatch, setNewMatch] = useState({ home: '', away: '', venue: '', stage: 'Fecha 1', date: '' });

  useEffect(() => {
    signInAnonymously(auth);
    const unsubTeams = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (s) => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubVenues = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'venues'), (s) => setVenues(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMatches = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'matches'), (s) => setMatches(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubTeams(); unsubVenues(); unsubMatches(); };
  }, []);

  const handleAddTeam = async () => {
    if (!newTeam.name) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), newTeam);
    setNewTeam({ name: '', code: '', group: 'A' });
  };

  const getStandings = (group) => {
    const groupTeams = teams.filter(t => t.group === group);
    return groupTeams.map(team => {
      const teamMatches = matches.filter(m => (m.home === team.name || m.away === team.name) && m.result);
      let pts = 0;
      teamMatches.forEach(m => {
        const [h, a] = m.result.split('-').map(Number);
        if (m.home === team.name) {
          if (h > a) pts += 3; else if (h === a) pts += 1;
        } else {
          if (a > h) pts += 3; else if (a === h) pts += 1;
        }
      });
      return { ...team, pts };
    }).sort((a, b) => b.pts - a.pts);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      {/* Header con Premio */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl mb-6 border border-slate-800">
        <h1 className="font-bold text-lg text-emerald-400">SPD MUNDIAL 2026</h1>
        <div className="flex items-center gap-3">
          <PiggyBank className="text-emerald-500 w-8 h-8" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase">Premio</p>
            <p className="font-black text-emerald-400 text-lg">$5,000.00</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        {[{id:'matches', label:'Partidos'}, {id:'standings', label:'Grupos'}, {id:'admin', label:'Admin'}].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === t.id ? 'bg-emerald-600' : 'bg-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-4 rounded-xl">
            <h2 className="font-bold mb-4 flex items-center gap-2"><ShieldCheck size={18}/> Equipos</h2>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nombre" className="bg-slate-800 p-2 rounded" onChange={e => setNewTeam({...newTeam, name: e.target.value})} value={newTeam.name}/>
              <input placeholder="Abrev." className="bg-slate-800 p-2 rounded" onChange={e => setNewTeam({...newTeam, code: e.target.value})} value={newTeam.code}/>
              <select className="bg-slate-800 p-2 rounded col-span-2" onChange={e => setNewTeam({...newTeam, group: e.target.value})} value={newTeam.group}>
                {['A','B','C','D','E','F','G','H'].map(g => <option key={g} value={g}>Grupo {g}</option>)}
              </select>
              <button onClick={handleAddTeam} className="col-span-2 bg-emerald-600 p-2 rounded font-bold">Guardar Equipo</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="space-y-4">
          {['A','B','C','D','E','F','G','H'].map(group => (
            <div key={group} className="bg-slate-900 p-4 rounded-xl">
              <h3 className="font-bold text-emerald-400 mb-2">GRUPO {group}</h3>
              {getStandings(group).map(t => (
                <div key={t.id} className="flex justify-between py-1 border-b border-slate-800 text-sm">
                  <span>{t.name} ({t.code})</span>
                  <span className="font-bold">{t.pts} pts</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
