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
// MARCADOR: Cambiarás este ID en cada clonación rápida desde tu teléfono
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
 if (loading) {
 return (
Sincronizando identidad visual...);
 }
 // Si no se ha configurado un ID válido aún en la clonación
 if (!appearance) {
 return (
¡Estructura Base Lista!
Por favor, edita el archivo App.jsx e ingresa un ID de proyecto válido desde tu teléfono.
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
 .custom-btn { background-color: var(--child-primary) !important; border-radius: var(--child-
radius) !important; }
 .custom-card { background-color: var(--child-surface) !important; border-radius: var(--
child-radius) !important; }
 `;
 return (Plataforma Hija
Conectada al ecosistema centralizado en tiempo real
ID del Canal Activo
{CONFIG_DOCUMENT_ID}
 Acción Dinámica
 );
}