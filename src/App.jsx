import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc
} from 'firebase/firestore';
import { 
  Trophy, 
  Calendar, 
  Lock, 
  Unlock, 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  UserPlus, 
  Grid,
  ShieldAlert,
  Sliders,
  DollarSign,
  Bell,
  Info,
  Check,
  XCircle,
  Award,
  ChevronDown,
  ChevronUp,
  LogOut,
  Mail,
  ShieldCheck
} from 'lucide-react';

// === CONFIGURACIÓN DE BASE DE DATOS (NUBE DE FIREBASE) ===
const appId = 'quiniela-mundial-2026-gt';

// Configuración de tu consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAottz3glWQTC6ouO9tiwmoaquIQstnOBg",
  authDomain: "proyecto-bf596.firebaseapp.com",
  projectId: "proyecto-bf596",
  storageBucket: "proyecto-bf596.firebasestorage.app",
  messagingSenderId: "200730450180",
  appId: "1:200730450180:web:81729e9cd3ce74ae821851",
  measurementId: "G-Z1VD950GPD"
};

// Inicialización de Firebase
let app, auth, db, googleProvider;
try {
  const finalConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
  app = initializeApp(finalConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.error("Error al inicializar Firebase SDK:", e);
}

// === DATOS SEMILLA (PARTIDOS DE INAUGURACIÓN POR DEFECTO) ===
const SEED_MATCHES = [
  {
    id: 'm1',
    homeTeam: 'México',
    awayTeam: 'Sudáfrica',
    homeFlag: 'mx',
    awayFlag: 'za',
    venue: 'Estadio Azteca, CDMX',
    date: '2026-06-11T16:00:00-06:00', // CST Guatemala
    realHome: 2,
    realAway: 1,
  },
  {
    id: 'm2',
    homeTeam: 'Canadá',
    awayTeam: 'Suiza',
    homeFlag: 'ca',
    awayFlag: 'ch',
    venue: 'BMO Field, Toronto',
    date: '2026-06-12T14:00:00-06:00', // CST Guatemala
    realHome: 1,
    realAway: 1,
  },
  {
    id: 'm3',
    homeTeam: 'Estados Unidos',
    awayTeam: 'Australia',
    homeFlag: 'us',
    awayFlag: 'au',
    venue: 'SoFi Stadium, Los Ángeles',
    date: '2026-06-12T19:00:00-06:00', // CST Guatemala
    realHome: null,
    realAway: null,
  }
];

// === DICCIONARIO INTELIGENTE DE PAÍSES A BANDERAS ===
const COUNTRY_CODES = {
  // Norte y Centroamérica
  "méxico": "mx", "mexico": "mx",
  "estados unidos": "us", "usa": "us", "eeuu": "us",
  "canadá": "ca", "canada": "ca",
  "guatemala": "gt", "costa rica": "cr", "panamá": "pa", "panama": "pa", 
  "honduras": "hn", "el salvador": "sv", "jamaica": "jm",

  // Sudamérica
  "argentina": "ar", "brasil": "br", "uruguay": "uy", "colombia": "co", 
  "ecuador": "ec", "chile": "cl", "perú": "pe", "peru": "pe", 
  "venezuela": "ve", "paraguay": "py", "bolivia": "bo",

  // Europa
  "españa": "es", "espana": "es", "alemania": "de", "francia": "fr", "italia": "it", 
  "inglaterra": "gb-eng", "portugal": "pt", "países bajos": "nl", "paises bajos": "nl", 
  "holanda": "nl", "bélgica": "be", "belgica": "be", "croacia": "hr", "suiza": "ch", 
  "dinamarca": "dk", "suecia": "se", "polonia": "pl", "gales": "gb-wls", "escocia": "gb-sct", "serbia": "rs",

  // África
  "marruecos": "ma", "senegal": "sn", "egipto": "eg", "camerún": "cm", "camerun": "cm", 
  "ghana": "gh", "nigeria": "ng", "costa de marfil": "ci", "argelia": "dz", 
  "túnez": "tn", "tunez": "tn", "sudáfrica": "za", "sudafrica": "za",

  // Asia y Oceanía
  "japón": "jp", "japon": "jp", "corea del sur": "kr", "arabia saudita": "sa", 
  "irán": "ir", "iran": "ir", "australia": "au", "qatar": "qa", "nueva zelanda": "nz"
};

export default function App() {
  // === ESTADOS GENERALES ===
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [autorizados, setAutorizados] = useState([]);
  const [teams, setTeams] = useState([]);      
  const [venues, setVenues] = useState([]);    
  
  // Estados de Sesión de Usuario
  const [currentUser, setCurrentUser] = useState(null); 
  const [authorizedUserRecord, setAuthorizedUserRecord] = useState(null); 
  const [activeUserId, setActiveUserId] = useState(''); 
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [errorAcceso, setErrorAcceso] = useState(null);

  // Valores de Entrada de Dinero (Quetzales Q)
  const costTotal = 60;
  const costPrize = 50;
  const costService = 10;

  // Fecha y hora del sistema en base a Guatemala (CST)
  const [simulatedTime, setSimulatedTime] = useState('');
  const [useRealTime, setUseRealTime] = useState(true);
  const [showTester, setShowTester] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');

  // Formularios de administración
  const [newUserName, setNewUserName] = useState('');
  const [newUserPaid, setNewUserPaid] = useState(false);
  const [nuevoCorreoAutorizar, setNuevoCorreoAutorizar] = useState('');
  
  // FORMULARIO DE NUEVO PARTIDO
  const [newMatch, setNewMatch] = useState({
    homeTeam: '',
    awayTeam: '',
    homeFlag: '',
    awayFlag: '',
    venue: '',
    date: '2026-06-15T18:00:00-06:00'
  });

  const [toast, setToast] = useState(null);

  // Obtener hora actual de Guatemala (UTC-6)
  const getGuatemalaTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * -6));
  };

  // Mantener actualizado el reloj
  useEffect(() => {
    if (useRealTime) {
      const updateClock = () => {
        const gtTime = getGuatemalaTime();
        const localISO = new Date(gtTime.getTime() - (gtTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
        setSimulatedTime(localISO);
      };
      updateClock();
      const interval = setInterval(updateClock, 1000);
      return () => clearInterval(interval);
    }
  }, [useRealTime]);

  // === (1) FLUJO DE AUTENTICACIÓN CON GOOGLE ===
  useEffect(() => {
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const emailLower = firebaseUser.email.toLowerCase();
        
        // Verificar si está en la lista blanca de Firestore
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'autorizados', emailLower);
        try {
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setCurrentUser(firebaseUser);
            setAuthorizedUserRecord(docSnap.data());
            setErrorAcceso(null);
            
            // Auto-crear perfil en colección 'users' si no existe
            const userProfileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', emailLower);
            const profileSnap = await getDoc(userProfileRef);
            if (!profileSnap.exists()) {
              await setDoc(userProfileRef, {
                id: emailLower,
                name: firebaseUser.displayName || 'Participante',
                paid: docSnap.data().paid || false,
                predictions: {}
              });
            }
            setActiveUserId(emailLower);
          } else {
            setErrorAcceso({
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              photo: firebaseUser.photoURL
            });
            await signOut(auth);
          }
        } catch (err) {
          console.error("Error validando permisos de acceso:", err);
          setErrorAcceso({
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            photo: firebaseUser.photoURL,
            error: "Error del servidor de base de datos"
          });
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
        setAuthorizedUserRecord(null);
      }
      setCargandoAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // === (2) CARGA DE DATOS EN TIEMPO REAL DESDE FIRESTORE ===
  useEffect(() => {
    if (!currentUser || !db) return;

    const matchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'matches');
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const autorizadosRef = collection(db, 'artifacts', appId, 'public', 'data', 'autorizados');
    const teamsRef = collection(db, 'artifacts', appId, 'public', 'data', 'teams');
    const venuesRef = collection(db, 'artifacts', appId, 'public', 'data', 'venues');

    const unsubscribeMatches = onSnapshot(matchesRef, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      if (list.length > 0) {
        list.sort((a, b) => new Date(a.date) - new Date(b.date));
        setMatches(list);
      } else {
        SEED_MATCHES.forEach(async (m) => {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', m.id), m);
        });
      }
    });

    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      if (list.length > 0) setUsers(list);
    });

    const unsubscribeAutorizados = onSnapshot(autorizadosRef, (snapshot) => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setAutorizados(list);
    });

    const unsubscribeTeams = onSnapshot(teamsRef, (snap) => {
      setTeams(snap.docs.map(d => ({
        id: d.id,
        nombre: d.data().nombre || d.data().nombre,
        codigo: d.data().código || d.data().codigo,
        grupo: d.data().grupo || d.data().grupo
      })));
    });

    const unsubscribeVenues = onSnapshot(venuesRef, (snap) => {
      setVenues(snap.docs.map(d => ({
        id: d.id,
        nombre: d.data().Sede || d.data().nombre
      })));
    });

    return () => {
      unsubscribeMatches();
      unsubscribeUsers();
      unsubscribeAutorizados();
      unsubscribeTeams();
      unsubscribeVenues();
    };
  }, [currentUser]);

  const handleGoogleLogin = async () => {
    try {
      setCargandoAuth(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Error en popup de Google:", err);
      showToast("Error de conexión al iniciar sesión con Google", "error");
      setCargandoAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setAuthorizedUserRecord(null);
      setErrorAcceso(null);
      showToast("Has cerrado sesión correctamente.");
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isMatchLocked = (matchDate) => {
    const matchTime = new Date(matchDate).getTime();
    const systemTime = new Date(simulatedTime + '-06:00').getTime();
    return systemTime >= matchTime;
  };

  const getTimeDifferenceHours = (date1, date2) => {
    const diffMs = new Date(date1) - new Date(date2 + '-06:00');
    return diffMs / (1000 * 60 * 60);
  };

  const formatMatchDate = (dateString) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours24 = d.getHours();
    const ampm = hours24 >= 12 ? 'p. m.' : 'a. m.';
    const hours12 = hours24 % 12 || 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours12}:${minutes} ${ampm}`;
  };

  const calculateMatchPoints = (predHome, predAway, realHome, realAway) => {
    if (
      predHome === undefined || predAway === undefined || 
      predHome === null || predAway === null || 
      realHome === null || realAway === null ||
      predHome === '' || predAway === ''
    ) {
      return 0;
    }

    const pH = parseInt(predHome);
    const pA = parseInt(predAway);
    const rH = parseInt(realHome);
    const rA = parseInt(realAway);

    if (isNaN(pH) || isNaN(pA) || isNaN(rH) || isNaN(rA)) return 0;

    if (pH === rH && pA === rA) {
      return 3;
    }

    const predictedWinner = pH > pA ? 'H' : pA > pH ? 'A' : 'D';
    const realWinner = rH > rA ? 'H' : rA > rH ? 'A' : 'D';

    if (predictedWinner === realWinner) {
      return 2;
    }

    return 0;
  };

  const getUserStats = (userItem) => {
    let total = 0;
    let exacts = 0;
    let winners = 0;
    let draws = 0;
    let fails = 0;
    let predictedCount = 0;

    matches.forEach(match => {
      const pred = userItem.predictions?.[match.id];
      if (pred && pred.home !== undefined && pred.away !== undefined && pred.home !== '' && pred.away !== '') {
        predictedCount++;
        if (match.realHome !== null && match.realAway !== null) {
          const pts = calculateMatchPoints(pred.home, pred.away, match.realHome, match.realAway);
          total += pts;
          
          const pH = parseInt(pred.home);
          const pA = parseInt(pred.away);
          const rH = parseInt(match.realHome);
          const rA = parseInt(match.realAway);

          if (pH === rH && pA === rA) {
            exacts++;
          } else {
            const predWinner = pH > pA ? 'H' : pA > pH ? 'A' : 'D';
            const realWinner = rH > rA ? 'H' : rA > rH ? 'A' : 'D';

            if (predWinner === realWinner) {
              if (realWinner === 'D') draws++;
              else winners++;
            } else {
              fails++;
            }
          }
        }
      }
    });

    return { total, exacts, winners, draws, fails, predictedCount };
  };

  const handlePredictionChange = async (matchId, team, value) => {
    const match = matches.find(m => m.id === matchId);
    if (isMatchLocked(match.date)) {
      showToast('Este partido ya comenzó. Pronósticos cerrados.', 'error');
      return;
    }

    const valInt = value === '' ? '' : parseInt(value);
    if (valInt !== '' && (isNaN(valInt) || valInt < 0)) return;

    const myProfile = users.find(u => u.id === currentUser.email.toLowerCase());
    if (!myProfile) return;

    const nextPred = {
      ...(myProfile.predictions || {}),
      [matchId]: {
        ...(myProfile.predictions?.[matchId] || { home: '', away: '' }),
        [team]: valInt
      }
    };

    if (db && currentUser) {
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.email.toLowerCase());
      try {
        await updateDoc(userDocRef, { predictions: nextPred });
      } catch (err) {
        console.error("Error al guardar pronóstico:", err);
      }
    }
  };

  const handleRealScoreChange = async (matchId, team, value) => {
    const valInt = value === '' ? null : parseInt(value);
    if (valInt !== null && (isNaN(valInt) || valInt < 0)) return;

    const matchObj = matches.find(m => m.id === matchId);
    if (!matchObj) return;

    const updatedMatch = {
      ...matchObj,
      [`real${team.charAt(0).toUpperCase() + team.slice(1)}`]: valInt
    };

    if (db && currentUser) {
      const matchDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId);
      try {
        await setDoc(matchDocRef, updatedMatch);
      } catch (err) {
        console.error("Error al actualizar marcador oficial:", err);
      }
    }
  };

  const handleAutorizarEmail = async (e) => {
    e.preventDefault();
    const emailLower = nuevoCorreoAutorizar.toLowerCase().trim();
    if (!emailLower.includes("@")) {
      showToast("Ingresa un correo de Gmail válido", "error");
      return;
    }

    try {
      const authDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'autorizados', emailLower);
      await setDoc(authDocRef, {
        email: emailLower,
        paid: newUserPaid,
        fechaAutorizacion: new Date().toISOString(),
        autorizadoPor: currentUser.email
      });

      const userProfileRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', emailLower);
      const userSnap = await getDoc(userProfileRef);
      if (userSnap.exists()) {
        await updateDoc(userProfileRef, { paid: newUserPaid });
      } else {
        await setDoc(userProfileRef, {
          id: emailLower,
          name: emailLower.split('@')[0],
          paid: newUserPaid,
          predictions: {}
        });
      }

      setNuevoCorreoAutorizar('');
      setNewUserPaid(false);
      showToast(`¡Correo ${emailLower} autorizado con éxito!`);
    } catch (err) {
      console.error("Error autorizando correo:", err);
      showToast("No tienes permisos suficientes en Firebase.", "error");
    }
  };

  const handleTogglePayment = async (userId) => {
    const userProfile = users.find(u => u.id === userId);
    if (!userProfile) return;

    const nextState = !userProfile.paid;

    try {
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userId);
      await updateDoc(userDocRef, { paid: nextState });

      const authDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'autorizados', userId);
      await updateDoc(authDocRef, { paid: nextState });

      showToast(`Pago de ${userProfile.name}: ${nextState ? 'PAGADO (Q60)' : 'PENDIENTE'}`);
    } catch (err) {
      console.error("Error al actualizar pago:", err);
    }
  };

  const handleAddMatch = async (e) => {
    e.preventDefault();
    if (!newMatch.homeTeam || !newMatch.awayTeam || !newMatch.venue) {
      showToast('Completa los campos obligatorios del partido.', 'error');
      return;
    }

    const createdMatch = {
      id: 'm_' + Date.now(),
      homeTeam: newMatch.homeTeam,
      awayTeam: newMatch.awayTeam,
      homeFlag: newMatch.homeFlag || 'un', 
      awayFlag: newMatch.awayFlag || 'un',
      venue: newMatch.venue,
      date: newMatch.date,
      realHome: null,
      realAway: null
    };

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', createdMatch.id), createdMatch);
        setNewMatch({
          homeTeam: '',
          awayTeam: '',
          homeFlag: '',
          awayFlag: '',
          venue: '',
          date: '2026-06-15T18:00:00-06:00'
        });
        showToast('Encuentro añadido al fixture.');
      } catch (err) {
        console.error("Error creando partido:", err);
      }
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (db && currentUser) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'matches', matchId));
        showToast('Partido removido del mundial.', 'warning');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const activeUserObject = users.find(u => u.id === activeUserId) || users[0] || { name: 'Cargando...', predictions: {} };

  const sortedLeaderboard = [...users].map(u => ({
    ...u,
    stats: getUserStats(u)
  })).sort((a, b) => b.stats.total - a.stats.total || b.stats.exacts - a.stats.exacts);

  const totalInscritos = users.length;
  const pagadosCount = users.filter(u => u.paid).length;
  const pozoPremiosReal = pagadosCount * costPrize;

  const premio1erLugar = pozoPremiosReal * 0.70;
  const premio2doLugar = pozoPremiosReal * 0.20;
  const premio3erLugar = pozoPremiosReal * 0.10;

  const upcomingClosures = matches.filter(match => {
    const hoursToStart = getTimeDifferenceHours(match.date, simulatedTime);
    return hoursToStart > 0 && hoursToStart <= 3;
  });

  const esAdministrador = authorizedUserRecord?.rol === 'admin' || currentUser?.email.toLowerCase() === 'joseh.gxz@gmail.com';

  // === INTERFAZ DE LOGUEO ===
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
        {cargandoAuth ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold text-slate-400">Verificando credenciales de acceso...</p>
          </div>
        ) : (
          <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-slate-950 text-3xl font-black shadow-lg shadow-emerald-500/20">
              ⚽
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              Quiniela Mundial 2026
              </h1>
              <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                Sigue tus resultados
              </p>
            </div>

            {errorAcceso && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-xl text-left space-y-2.5">
                <div className="flex gap-2 text-rose-400 items-start">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase">Acceso No Autorizado</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Hola <strong>{errorAcceso.name}</strong>. Tu correo <strong>{errorAcceso.email}</strong> está autenticado con Google, pero no se encuentra en la lista de participantes autorizados de la quiniela.
                    </p>
                  </div>
                </div>
                <div className="text-[10px] text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800 leading-normal">
                  💡 <strong>¿Cómo ingresar?</strong> Comunícate con <strong>José (Administrador)</strong> para coordinar tu cuota de inscripción de <strong>Q60.00</strong> y solicitar que registre tu correo en el sistema.
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-3 transition shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.41 7.59l3.86 3c.96-2.87 3.66-5.55 6.73-5.55z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.98 3.7-8.62z" />
                  <path fill="#FBBC05" d="M5.27 14.26c-.25-.76-.39-1.57-.39-2.41s.14-1.65.39-2.41l-3.86-3C.53 8.07 0 9.97 0 12s.53 3.93 1.41 5.56l3.86-3z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.52 1.18-4.23 1.18-3.07 0-5.77-2.68-6.73-5.55l-3.86 3C3.37 20.32 7.35 23 12 23z" />
                </svg>
                INICIAR SESIÓN CON GOOGLE
              </button>

              <div className="text-[10px] text-slate-500 leading-normal">
                Al ingresar, tu correo de Google se utilizará exclusivamente para cargar tus pronósticos y verificar tu pago correspondiente de la cuotas de ingreso.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === INTERFAZ PRINCIPAL DE LA QUINIELA ===
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* CABECERA */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl text-slate-950 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent leading-none">
                App SPD
              </h1>
              <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                Control de Quiniela Mundialista
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/90 py-1 px-3 rounded-lg border border-slate-800 text-[11px]">
            <div className="text-center pr-2.5 border-r border-slate-800">
              <span className="text-[8px] text-slate-400 block uppercase font-bold">Pozo GT</span>
              <span className="font-extrabold text-emerald-400">Q{pozoPremiosReal.toFixed(2)}</span>
            </div>
            <div className="text-center">
              <span className="text-[8px] text-slate-400 block uppercase font-bold">Pagados</span>
              <span className="font-bold text-slate-200">{pagadosCount} / {totalInscritos}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/85 p-1 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-[8px] text-slate-400 pl-1 font-bold uppercase">QUINIE:</span>
              <select
                value={activeUserId}
                onChange={(e) => setActiveUserId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-100 py-0.5 px-1 rounded text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({getUserStats(u).total} pts) {u.paid ? '✓' : '✗'}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-lg text-slate-400 hover:text-rose-400 transition"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-slate-950 to-slate-900 border-t border-slate-800/80 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-[11px]">
            <button 
              onClick={() => setShowTester(!showTester)}
              className="flex items-center gap-1 text-amber-400 font-bold hover:text-amber-300"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hora GT:</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/20 text-white font-mono text-[10px]">
                {new Date(simulatedTime + '-06:00').toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {showTester ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showTester && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                <input 
                  type="checkbox" 
                  id="realTimeToggle"
                  checked={useRealTime} 
                  onChange={(e) => setUseRealTime(e.target.checked)} 
                  className="rounded text-emerald-500 w-3.5 h-3.5"
                />
                <label htmlFor="realTimeToggle" className="text-[9px] text-slate-400 cursor-pointer">Hora Real</label>
                {!useRealTime && (
                  <input
                    type="datetime-local"
                    value={simulatedTime}
                    onChange={(e) => setSimulatedTime(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-[9px] px-1 rounded font-mono"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 mt-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <div>
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-400" /> REGLAS DE ENTRADA GT:
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              • Cuota: <strong className="text-white">Q60.00 quetzales</strong> por participante.<br/>
              • Destino: <strong className="text-emerald-400">Q50.00</strong> directos al pozo de premios y <strong className="text-indigo-400">Q10.00</strong> de servicio administrativo.
            </p>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mb-1">REGLAS OFICIALES DE PUNTOS (OPCIÓN A)</h4>
            <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="block text-slate-400 text-[8px] font-bold">MARCADOR EXACTO</span>
                <strong className="text-emerald-400 font-black">+3 pts</strong>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="block text-slate-400 text-[8px] font-bold">GANADOR</span>
                <strong className="text-emerald-400 font-black">+2 pts</strong>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800">
                <span className="block text-slate-400 text-[8px] font-bold">EMPATE</span>
                <strong className="text-emerald-400 font-black">+2 pts</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800/80 mb-3 text-center">
          <button onClick={() => setActiveTab('predictions')} className={`py-2 px-0.5 rounded-md text-[9px] font-black tracking-tight transition ${activeTab === 'predictions' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>PRONÓSTICOS</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`py-2 px-0.5 rounded-md text-[9px] font-black tracking-tight transition ${activeTab === 'leaderboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>TABLA Y POZO</button>
          <button onClick={() => setActiveTab('matrix')} className={`py-2 px-0.5 rounded-md text-[9px] font-black tracking-tight transition ${activeTab === 'matrix' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>COMPARAR</button>
          <button onClick={() => setActiveTab('admin')} className={`py-2 px-0.5 rounded-md text-[9px] font-black tracking-tight transition ${activeTab === 'admin' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}>ADMINISTRA</button>
        </div>

        {toast && (
          <div className="bg-slate-950 text-emerald-400 border border-slate-850 text-[11px] font-bold p-2 text-center rounded-lg mb-3 shadow-md animate-fade-in">
            📢 {toast.message}
          </div>
        )}

        {upcomingClosures.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400 animate-bounce" />
              <div>
                <h4 className="text-xs font-black text-white uppercase">Cierres Críticos de Pronósticos</h4>
                <p className="text-[10px] text-slate-400">Hay partidos próximos a iniciarse en menos de 3 horas.</p>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {upcomingClosures.map(m => (
                <span key={m.id} className="bg-slate-900/90 text-rose-300 text-[9px] font-bold px-2 py-0.5 rounded border border-rose-500/20">
                  ⏱️ {m.homeTeam} cierra en {Math.round(getTimeDifferenceHours(m.date, simulatedTime) * 60)}m
                </span>
              ))}
            </div>
          </div>
        )}

        {/* TAB 1: MIS PRONÓSTICOS */}
        {activeTab === 'predictions' && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">
                Quiniela de: <strong className="text-emerald-400">{activeUserObject.name}</strong>
              </span>
              <span className="font-extrabold text-emerald-400">
                Puntos: {getUserStats(activeUserObject).total} pts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matches.map(match => {
                const isLocked = isMatchLocked(match.date);
                const pred = activeUserObject.predictions?.[match.id] || { home: '', away: '' };
                const hasRealResult = match.realHome !== null && match.realAway !== null;
                const pointsEarned = hasRealResult ? calculateMatchPoints(pred.home, pred.away, match.realHome, match.realAway) : null;
                const hoursLeft = getTimeDifferenceHours(match.date, simulatedTime);
                const esMio = activeUserObject.id === currentUser.email.toLowerCase();

                return (
                  <div key={match.id} className="bg-slate-900/60 rounded-xl border border-slate-800 p-3 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-850 pb-1.5 mb-2.5">
                      <span className="font-mono text-slate-400 font-semibold">{formatMatchDate(match.date)}</span>
                      {isLocked ? (
                        <span className="text-amber-500 font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded text-[8px]">🔒 CERRADO</span>
                      ) : hoursLeft <= 3 ? (
                        <span className="text-rose-400 font-extrabold bg-rose-500/10 px-1.5 py-0.5 rounded text-[8px] animate-pulse">⏱️ CIERRA EN {Math.round(hoursLeft * 60)}m</span>
                      ) : (
                        <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[8px]">✓ EDITABLE</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      
                      {/* LADO LOCAL (CON IMAGEN DE BANDERA) */}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-[11px] font-bold text-slate-100 truncate">{match.homeTeam}</span>
                        <img src={`https://flagcdn.com/w40/${match.homeFlag}.png`} alt={match.homeTeam} className="w-6 h-4 object-cover rounded-sm shadow-sm" onError={(e) => e.target.style.display = 'none'} />
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pred.home !== undefined ? pred.home : ''}
                          onChange={(e) => handlePredictionChange(match.id, 'home', e.target.value)}
                          disabled={isLocked || !esMio}
                          className={`w-8 h-8 text-center text-xs font-black rounded-md focus:outline-none ${!esMio ? 'bg-slate-950/40 text-slate-500 border border-slate-850' : 'bg-slate-950 text-emerald-400 border border-slate-700'}`}
                          placeholder="-"
                        />
                        <span className="text-slate-500 font-bold">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pred.away !== undefined ? pred.away : ''}
                          onChange={(e) => handlePredictionChange(match.id, 'away', e.target.value)}
                          disabled={isLocked || !esMio}
                          className={`w-8 h-8 text-center text-xs font-black rounded-md focus:outline-none ${!esMio ? 'bg-slate-950/40 text-slate-500 border border-slate-850' : 'bg-slate-950 text-emerald-400 border border-slate-700'}`}
                          placeholder="-"
                        />
                      </div>

                      {/* LADO VISITANTE (CON IMAGEN DE BANDERA) */}
                      <div className="flex items-center gap-2 flex-1 justify-start">
                        <img src={`https://flagcdn.com/w40/${match.awayFlag}.png`} alt={match.awayTeam} className="w-6 h-4 object-cover rounded-sm shadow-sm" onError={(e) => e.target.style.display = 'none'} />
                        <span className="text-[11px] font-bold text-slate-100 truncate">{match.awayTeam}</span>
                      </div>

                    </div>

                    {hasRealResult && (
                      <div className="mt-2.5 pt-1.5 border-t border-slate-850 flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Resultado Oficial: <strong className="text-slate-300 font-mono">{match.realHome}-{match.realAway}</strong></span>
                        <span className="font-extrabold text-emerald-400 bg-emerald-500/15 py-0.5 px-2 rounded-full">
                          +{pointsEarned} Pts
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: TABLA Y POZO */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
              <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Bolsa de Premios Acumulada SPD (70% / 20% / 10%)
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-center">
                  <span className="text-[8px] text-amber-400 font-bold block">🥇 1ER LUGAR</span>
                  <span className="text-xs font-black text-white">Q{premio1erLugar.toFixed(2)}</span>
                </div>
                <div className="bg-slate-400/10 border border-slate-400/20 p-2 rounded-lg text-center">
                  <span className="text-[8px] text-slate-300 font-bold block">🥈 2DO LUGAR</span>
                  <span className="text-xs font-black text-white">Q{premio2doLugar.toFixed(2)}</span>
                </div>
                <div className="bg-amber-700/10 border border-amber-700/20 p-2 rounded-lg text-center">
                  <span className="text-[8px] text-amber-600 font-bold block">🥉 3ER LUGAR</span>
                  <span className="text-xs font-black text-white">Q{premio3erLugar.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase">
                      <th className="py-2 px-3 text-center w-10">Pos</th>
                      <th className="py-2 px-3">Jugador</th>
                      <th className="py-2 px-3 text-center">Pago</th>
                      <th className="py-2 px-3 text-center">Exactos</th>
                      <th className="py-2 px-3 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {sortedLeaderboard.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-850/40 transition">
                        <td className="py-3 px-3 text-center font-bold">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-100 truncate max-w-[120px]">{u.name}</td>
                        <td className="py-3 px-3 text-center">
                          {u.paid ? <span className="text-[8px] bg-emerald-500/10 text-emerald-400 py-0.5 px-1.5 rounded font-black border border-emerald-500/20">Q60 ✓</span> : <span className="text-[8px] bg-amber-500/10 text-amber-400 py-0.5 px-1.5 rounded font-black border border-amber-500/20">PEND ✗</span>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{u.stats.exacts}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-400">{u.stats.total} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPARATIVAS */}
        {activeTab === 'matrix' && (
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase">
                    <th className="py-3 px-3">Encuentro</th>
                    <th className="py-3 px-3 text-center bg-slate-950">Real</th>
                    {users.map(u => (
                      <th key={u.id} className="py-3 px-2 text-center border-l border-slate-800/80 min-w-[80px]">
                        <span className="text-slate-200 font-black block truncate max-w-[70px]">{u.name}</span>
                        <span className="text-[8px] text-slate-500 block">{u.paid ? '✓ Q60' : '✗ PEND'}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {matches.map(match => {
                    const hasRealResult = match.realHome !== null && match.realAway !== null;
                    return (
                      <tr key={match.id} className="hover:bg-slate-850/20 transition">
                        <td className="py-3 px-3 font-bold text-slate-200">
                          {/* COMPARATIVA CON BANDERITAS */}
                          <div className="flex items-center gap-1.5">
                            <img src={`https://flagcdn.com/w20/${match.homeFlag}.png`} className="w-4 h-3 object-cover rounded-sm shadow-sm" alt="" />
                            <span className="text-[10px]">vs</span>
                            <img src={`https://flagcdn.com/w20/${match.awayFlag}.png`} className="w-4 h-3 object-cover rounded-sm shadow-sm" alt="" />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center bg-slate-950 font-bold">
                          {hasRealResult ? `${match.realHome}-${match.realAway}` : 'PEND'}
                        </td>
                        {users.map(u => {
                          const pred = u.predictions?.[match.id];
                          const isPredicted = pred && pred.home !== '' && pred.away !== '';
                          const pts = hasRealResult && isPredicted ? calculateMatchPoints(pred.home, pred.away, match.realHome, match.realAway) : 0;
                          
                          return (
                            <td key={u.id} className="py-3 px-2 text-center border-l border-slate-800/50">
                              {isPredicted ? (
                                <div className="inline-block px-1 py-0.5 bg-slate-800 rounded">
                                  <span className="font-mono text-[9px] font-bold">{pred.home}-{pred.away}</span>
                                  {hasRealResult && <span className="block text-[7px] text-emerald-400 font-bold">+{pts} Pts</span>}
                                </div>
                              ) : (
                                <span className="text-slate-600 italic text-[9px]">Sin prono</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ADMINISTRACIÓN */}
        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Control de Acceso
              </h3>
              <p className="text-[10px] text-slate-400 mb-3 leading-normal">
                Escribe el correo de Google de tu amigo para concederle acceso a la aplicación.
              </p>

              {esAdministrador ? (
                <form onSubmit={handleAutorizarEmail} className="space-y-3 mb-4">
                  <input type="email" placeholder="ejemplo@gmail.com" value={nuevoCorreoAutorizar} onChange={(e) => setNuevoCorreoAutorizar(e.target.value)} className="w-full bg-slate-950 border border-slate-700 py-1.5 px-3 rounded-lg text-xs text-white placeholder-slate-600" required />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="newUserPaid" checked={newUserPaid} onChange={(e) => setNewUserPaid(e.target.checked)} className="rounded text-emerald-500 bg-slate-950 border-slate-700 w-3.5 h-3.5" />
                    <label htmlFor="newUserPaid" className="text-[10px] text-slate-300">¿Pagó los Q60 de inmediato?</label>
                  </div>
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-1.5 rounded-lg transition uppercase">
                    Autorizar Correo Google
                  </button>
                </form>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg text-[10px] text-rose-300 mb-4">
                  ❌ Panel de control exclusivo para el Administrador (José).
                </div>
              )}

              <div className="border-t border-slate-800 pt-3">
                <span className="text-[9px] text-slate-400 font-bold block mb-2">Correos Autorizados en Firebase:</span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {autorizados.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-850 text-[11px]">
                      <span className="truncate max-w-[140px] text-slate-300">{item.email}</span>
                      {esAdministrador ? (
                        <button onClick={() => handleTogglePayment(item.id)} className={`text-[9px] px-2 py-0.5 rounded font-black ${item.paid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {item.paid ? 'Q60 ✓' : 'Cobrar'}
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-500">{item.paid ? '✓' : '✗'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2.5 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Marcadores Oficiales
                </h3>

                {/* --- SECCIÓN NUEVA: GESTIÓN DE CATÁLOGOS (EQUIPOS Y SEDES) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 p-4 bg-slate-950/40 rounded-xl border border-slate-800">
                  
                  {/* GESTIÓN DE EQUIPOS */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-emerald-400 uppercase">Gestión de Equipos ({teams.length})</h3>
                    
                    {/* Formulario para agregar */}
                    <div className="bg-slate-900 p-3 rounded-lg space-y-2 border border-slate-800">
                      <input id="newTeamName" placeholder="Nombre Equipo" className="w-full bg-slate-950 text-white p-2 rounded text-xs" />
                      <div className="flex gap-2">
                        <input id="newTeamCode" placeholder="Código (ej. BRA)" className="flex-1 bg-slate-950 text-white p-2 rounded text-xs" />
                        <input id="newTeamGroup" placeholder="Grupo" className="w-16 bg-slate-950 text-white p-2 rounded text-xs" />
                      </div>
                      <button 
                        onClick={async () => {
                          const nombre = document.getElementById('newTeamName').value;
                          const codigo = document.getElementById('newTeamCode').value;
                          const grupo = document.getElementById('newTeamGroup').value;
                          if(nombre && codigo) {
                            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), { nombre, codigo, grupo });
                            document.getElementById('newTeamName').value = '';
                            document.getElementById('newTeamCode').value = '';
                            document.getElementById('newTeamGroup').value = '';
                          }
                        }}
                        className="w-full bg-emerald-600 py-2 rounded text-white font-bold text-xs hover:bg-emerald-500"
                      >+ Agregar Equipo</button>
                    </div>

                    {/* TABLA DE EQUIPOS */}
                    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-slate-900 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                        <span>Grupo</span>
                        <span>Código</span>
                        <span>Nombre</span>
                      </div>
                     
// ... dentro de tu componente, en la sección de la lista:
<div className="max-h-60 overflow-y-auto">
{teams.map(t => (
  <div key={t.id} className="grid grid-cols-3 gap-2 px-3 py-2 border-b border-slate-800/50 text-[10px] text-slate-300 hover:bg-slate-900 items-center">
    <span className="font-bold text-emerald-500">{t.grupo}</span>
    <div className="flex items-center gap-2">
      <img 
        src={`https://countryflagsapi.netlify.app/flag/${t.codigo.toUpperCase()}.png`} 
        alt={t.nombre} 
        className="w-5 h-3.5 object-cover rounded-sm shadow-sm"
        onError={(e) => { e.target.style.display = 'none'; }}
      />
      <span className="font-mono">{t.codigo.toUpperCase()}</span>
    </div>
    <span className="truncate">{t.nombre}</span>
  </div>
))}
                  {/* GESTIÓN DE SEDES */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-blue-400 uppercase">Gestión de Sedes ({venues.length})</h3>
                    
                    <div className="bg-slate-900 p-3 rounded-lg space-y-2 border border-slate-800">
                      <input id="newVenueName" placeholder="Nombre de la Sede" className="w-full bg-slate-950 text-white p-2 rounded text-xs" />
                      <button 
                        onClick={async () => {
                          const nombre = document.getElementById('newVenueName').value;
                          if(nombre) {
                            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'venues'), { nombre });
                            document.getElementById('newVenueName').value = '';
                          }
                        }}
                        className="w-full bg-blue-600 py-2 rounded text-white font-bold text-xs hover:bg-blue-500"
                      >+ Agregar Sede</button>
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {venues.map(v => (
                        <div key={v.id} className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                          {v.nombre}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* --- FIN SECCIÓN CATÁLOGOS --- */}

                <div className="space-y-2">
                  {matches.map(match => (
                    <div key={match.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2 text-xs">
                      
                      {/* BANDERITAS EN EL ADMIN PANEL */}
                      <div className="flex items-center gap-1.5 font-semibold truncate max-w-[150px]">
                        <img src={`https://flagcdn.com/w20/${match.homeFlag}.png`} className="w-4 h-3 rounded-sm" alt="" onError={(e) => e.target.style.display = 'none'} />
                        <span className="truncate">{match.homeTeam} vs {match.awayTeam}</span>
                        <img src={`https://flagcdn.com/w20/${match.awayFlag}.png`} className="w-4 h-3 rounded-sm" alt="" onError={(e) => e.target.style.display = 'none'} />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input type="number" placeholder="L" value={match.realHome === null ? '' : match.realHome} onChange={(e) => handleRealScoreChange(match.id, 'home', e.target.value)} disabled={!esAdministrador} className="w-9 py-0.5 text-center bg-slate-900 border border-slate-700 rounded font-bold text-emerald-400" />
                        <span>:</span>
                        <input type="number" placeholder="V" value={match.realAway === null ? '' : match.realAway} onChange={(e) => handleRealScoreChange(match.id, 'away', e.target.value)} disabled={!esAdministrador} className="w-9 py-0.5 text-center bg-slate-900 border border-slate-700 rounded font-bold text-emerald-400" />
                        {esAdministrador && (
                          <button onClick={() => handleDeleteMatch(match.id)} className="text-slate-500 hover:text-rose-400 ml-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Crear Partido (Admin) - CON SELECTS VINCULADOS A LA TABLA DE EQUIPOS */}
                {esAdministrador && (
                  <div className="border-t border-slate-800 pt-3 mt-4">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-wider mb-2">Crear Partido en Fixture</h3>
                    <form onSubmit={handleAddMatch} className="grid grid-cols-2 gap-2 text-xs">
                      
                      {/* SELECT PARA EQUIPO LOCAL */}
                      <select 
                        value={newMatch.homeTeam} 
                        onChange={(e) => {
                          const selectedTeam = teams.find(t => t.nombre === e.target.value);
                          if (selectedTeam) {
                            setNewMatch({
                              ...newMatch, 
                              homeTeam: selectedTeam.nombre, 
                              homeFlag: selectedTeam.codigo.toLowerCase()
                            });
                          }
                        }} 
                        className="bg-slate-950 border border-slate-700 py-1.5 px-2 rounded-lg text-white" 
                        required
                      >
                        <option value="">Selecciona Local</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.nombre}>{t.nombre}</option>
                        ))}
                      </select>

                      {/* SELECT PARA EQUIPO VISITANTE */}
                      <select 
                        value={newMatch.awayTeam} 
                        onChange={(e) => {
                          const selectedTeam = teams.find(t => t.nombre === e.target.value);
                          if (selectedTeam) {
                            setNewMatch({
                              ...newMatch, 
                              awayTeam: selectedTeam.nombre, 
                              awayFlag: selectedTeam.codigo.toLowerCase()
                            });
                          }
                        }} 
                        className="bg-slate-950 border border-slate-700 py-1.5 px-2 rounded-lg text-white" 
                        required
                      >
                        <option value="">Selecciona Visitante</option>
                      {teams.map(t => (
            <option key={t.id} value={t.nombre}>{t.nombre}</option>
          ))}


                      </select>
                      
                      {/* Los códigos de bandera se actualizan automáticamente al elegir el equipo */}
                      <input type="text" readOnly placeholder="Cód. L" value={newMatch.homeFlag} className="bg-slate-900 border border-slate-700 py-1 px-2 rounded-lg text-emerald-400 font-mono font-bold text-center" />
                      <input type="text" readOnly placeholder="Cód. V" value={newMatch.awayFlag} className="bg-slate-900 border border-slate-700 py-1 px-2 rounded-lg text-emerald-400 font-mono font-bold text-center" />
                      
                      <input type="text" placeholder="Estadio / Sede" value={newMatch.venue} onChange={(e) => setNewMatch({...newMatch, venue: e.target.value})} className="bg-slate-950 border border-slate-700 py-1 px-2 rounded-lg col-span-2 text-white" required />
                      <input type="datetime-local" value={newMatch.date} onChange={(e) => setNewMatch({...newMatch, date: e.target.value})} className="bg-slate-950 border border-slate-700 py-1 px-2 rounded-lg col-span-2 font-mono text-white" required />
                      <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-black py-2 rounded-lg col-span-2 uppercase transition-all">Añadir Encuentro</button>
</form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pie de página */}
        <footer className="border-t border-slate-800 bg-slate-950 py-3 text-center text-[10px] text-slate-500 mt-6">
          <p>App SPD • Copa del Mundo 2026 Guatemala</p>
        </footer>
      </div>
    </div>
  );
}
