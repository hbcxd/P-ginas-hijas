import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

// Credenciales fijas de tu Base de Datos Maestra
const firebaseConfig = {
  apiKey: "AIzaSyAP79oeDD4d6stMPXwMToQhQQTEneb6iww",
  authDomain: "base-de-datos-maestra-5a5a7.firebaseapp.com",
  projectId: "base-de-datos-maestra-5a5a7",
  storageBucket: "base-de-datos-maestra-5a5a7.firebasestorage.app",
  messagingSenderId: "998538522792",
  appId: "1:998538522792:web:b80a0239fcc749282b929d",
  measurementId: "G-TTVVXRQR37"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// SÍ, AQUÍ ES DONDE PEGAS EL ID QUE TE DIO EL PANEL MAESTRO
const CONFIG_DOCUMENT_ID = "REEMPLAZAR_CON_EL_ID_DEL_PANEL_MAESTRO";

export default function App() {
  const [appearance, setAppearance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (CONFIG_DOCUMENT_ID.startsWith("REEMPLAZAR")) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "plataformas", CONFIG_DOCUMENT_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppearance(docSnap.data().appearance);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. Pantalla de carga con sus etiquetas correctas
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center space-y-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] text-slate-500 tracking-wider">Sincronizando identidad visual...</p>
        </div>
      </div>
    );
  }

  // 2. Pantalla de aviso si no hay ID configurado aún
  if (!appearance) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-400 font-sans p-6 text-center">
        <div>
          <p className="text-sm font-bold text-white mb-1">¡Estructura Base Lista!</p>
          <p className="text-xs text-slate-500">Por favor, edita el archivo App.jsx e ingresa un ID de proyecto válido desde tu teléfono.</p>
        </div>
      </div>
    );
  }

  // Inyección dinámica de variables CSS basadas en tu panel maestro
  const dynamicStyles = `
    :root {
      --child-bg: ${appearance.bgColor || '#0f172a'};
      --child-surface: ${appearance.surfaceColor || '#1e293b'};
      --child-primary: ${appearance.primaryColor || '#3b82f6'};
      --child-secondary: ${appearance.secondaryColor || '#10b981'};
      --child-text: ${appearance.textColor || '#ffffff'};
      --child-muted: ${appearance.mutedColor || '#94a3b8'};
      --child-radius: ${appearance.borderRadius || '12px'};
    }
    .custom-bg { background-color: var(--child-bg) !important; }
    .custom-surface { background-color: var(--child-surface) !important; }
    .custom-text { color: var(--child-text) !important; }
    .custom-muted { color: var(--child-muted) !important; }
    .custom-btn { background-color: var(--child-primary) !important; border-radius: var(--child-radius) !important; }
    .custom-card { background-color: var(--child-surface) !important; border-radius: var(--child-radius) !important; }
  `;

  // 3. Estructura visual de la interfaz de la página hija
  return (
    <div className="min-h-screen custom-bg custom-text font-sans p-6 flex flex-col items-center justify-center transition-colors duration-300">
      <style>{dynamicStyles}</style>
      
      <div className="custom-card p-8 max-w-md w-full text-center border border-white/5 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Plataforma Hija</h1>
          <p className="text-xs custom-muted mt-1">Conectada al ecosistema centralizado en tiempo real</p>
        </div>

        <div className="p-3 bg-black/20 rounded-xl text-left border border-white/5">
          <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">ID del Canal Activo</p>
          <p className="font-mono text-xs text-emerald-400 truncate font-semibold">{CONFIG_DOCUMENT_ID}</p>
        </div>

        <button className="custom-btn w-full py-3 font-semibold text-white shadow-lg shadow-blue-500/10 hover:opacity-90 active:scale-[0.98] transition-all text-sm">
          Acción Dinámica
        </button>
      </div>
    </div>
  );
}
