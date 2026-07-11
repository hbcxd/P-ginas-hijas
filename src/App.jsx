import React, { useEffect, useState } from 'react';
import { db } from './firebaseconfig'; 
import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';

// ID de la plataforma que vas a renderizar
const PLATFORMA_ID = "Dov8ARmYu9dtt4sOrZq6"; 

export default function App() {
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para el Sistema de Pedidos (Carrito)
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estados para el Formulario de Contacto
  const [formData, setFormData] = useState({ nombre: '', correo: '', telefono: '', mensaje: '' });
  const [formStatus, setFormStatus] = useState({ enviado: false, error: false, cargando: false });

  useEffect(() => {
    const docRef = doc(db, 'plataformas', PLATFORMA_ID); 
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setPlatform(docSnap.data());
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error al conectar con Firestore:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <p className="text-sm animate-pulse">Cargando sitio personalizado...</p>
      </div>
    );
  }

  if (!platform) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <p className="text-sm">El sitio web solicitado no está configurado.</p>
      </div>
    );
  }

  // Desestructuración segura de la configuración del cliente
  const { 
    name = '', 
    appearance = {}, 
    navigation = { links: [] }, 
    blocks = [], 
    features = {}, // Aquí controlas qué módulos compró el cliente
    exchangeRate = null,
    whatsappPhone = ''
  } = platform;

  // --- CONTROLADOR DE PRECIOS Y TASA EXTRA ESPECIAL ---
  const renderPrice = (priceUSD) => {
    if (!priceUSD) return null;
    const numericPrice = parseFloat(priceUSD.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(numericPrice)) return <span style={{ color: appearance.primaryColor }} className="font-bold">{priceUSD}</span>;
    
    // Si activaste el módulo de Tasa de Cambio en las características
    if (features.tasaCambio && exchangeRate && !isNaN(exchangeRate)) {
      const priceVES = (numericPrice * parseFloat(exchangeRate)).toFixed(2);
      return (
        <div className="flex flex-col">
          <span className="font-bold text-base" style={{ color: appearance.primaryColor }}>${numericPrice.toFixed(2)}</span>
          <span className="text-[11px] opacity-60 font-medium">{priceVES} Bs.</span>
        </div>
      );
    }
    return <span className="font-bold text-base" style={{ color: appearance.primaryColor }}>${numericPrice.toFixed(2)}</span>;
  };

  // --- CONTROLADOR DE CARRITO ---
  const addToCart = (item) => {
    setCart((prevCart) => {
      const itemExists = prevCart.find(cartItem => cartItem.title === item.title);
      // Si el cliente pagó Control de Inventario, validamos el stock
      const maxStock = features.inventario && item.stock !== undefined ? parseInt(item.stock) : 999;
      
      if (itemExists) {
        if (itemExists.cantidad >= maxStock) return prevCart;
        return prevCart.map(cartItem => 
          cartItem.title === item.title ? { ...cartItem, cantidad: cartItem.cantidad + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, cantidad: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (title, action) => {
    setCart((prevCart) => 
      prevCart.map(item => {
        if (item.title === title) {
          const newQty = action === 'increase' ? item.cantidad + 1 : item.cantidad - 1;
          const maxStock = features.inventario && item.stock !== undefined ? parseInt(item.stock) : 999;
          if (action === 'increase' && newQty > maxStock) return item;
          return { ...item, cantidad: newQty };
        }
        return item;
      }).filter(item => item.cantidad > 0)
    );
  };

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;
    let mensajeWA = `*Nuevo Pedido - ${name}*\n\n`;
    let totalUSD = 0;

    cart.forEach(item => {
      const numPrice = parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) || 0;
      const subtotal = numPrice * item.cantidad;
      totalUSD += subtotal;
      mensajeWA += `• ${item.cantidad}x ${item.title} - $${subtotal.toFixed(2)}\n`;
    });

    mensajeWA += `\n*Total a pagar:* $${totalUSD.toFixed(2)}`;
    if (features.tasaCambio && exchangeRate) {
      mensajeWA += ` / ${(totalUSD * exchangeRate).toFixed(2)} Bs.`;
    }

    window.open(`https://wa.me/${whatsappPhone || "584120000000"}?text=${encodeURIComponent(mensajeWA)}`, '_blank');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ enviado: false, error: false, cargando: true });
    try {
      await addDoc(collection(db, 'mensajes_clientes'), {
        plataformaId: PLATFORMA_ID,
        fecha: new Date().toISOString(),
        ...formData
      });
      setFormStatus({ enviado: true, error: false, cargando: false });
      setFormData({ nombre: '', correo: '', telefono: '', mensaje: '' });
    } catch (err) {
      setFormStatus({ enviado: false, error: true, cargando: false });
    }
  };

  const mainStyle = {
    backgroundColor: appearance.bgColor || '#0f172a',
    color: appearance.textColor || '#ffffff',
    scrollBehavior: 'smooth'
  };

  return (
    <div style={mainStyle} className="min-h-screen font-sans transition-colors duration-300 relative flex flex-col justify-between">
      
      <div>
        {/* MENU: Solo se muestra si añadiste enlaces desde la plataforma madre */}
        {navigation.links && navigation.links.length > 0 && (
          <nav style={{ backgroundColor: appearance.surfaceColor || '#1e293b' }} className="sticky top-0 z-40 border-b border-white/10 px-6 py-4 shadow-md">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <span className="text-lg font-bold">{name}</span>
              <ul className="flex gap-6 text-sm font-medium">
                {navigation.links.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.url} className="hover:opacity-80 transition-opacity" style={{ color: appearance.textColor }}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}

        {/* PROCESADOR DE BLOQUES: Si el array de bloques está vacío, la página se queda totalmente limpia */}
        <main className="max-w-6xl mx-auto px-6 py-12 space-y-28">
          {blocks && blocks.map((block, idx) => {
            const sectionId = block.title ? block.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') : block.type;

            // BLOQUE TIPO: HERO
            if (block.type === 'hero') {
              return (
                <section id={sectionId} key={idx} className="grid md:grid-cols-2 gap-8 items-center py-8 scroll-mt-24">
                  <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: appearance.textColor }}>{block.title}</h1>
                    <p className="text-lg opacity-80">{block.content || block.subtitle}</p>
                  </div>
                  {block.imageUrl && (
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                      <img src={block.imageUrl} alt={block.title} className="w-full h-auto object-cover max-h-[400px]" />
                    </div>
                  )}
                </section>
              );
            }

            // BLOQUE TIPO: TARJETAS (Muestra catálogo, y hereda condicionalmente inventario y carrito)
            if (block.type === 'tarjetas') {
              return (
                <section id={sectionId} key={idx} className="space-y-6 scroll-mt-24">
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <h2 className="text-2xl font-bold">{block.title}</h2>
                    <p className="text-sm opacity-80">{block.content || block.subtitle}</p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {block.items && block.items.map((item, itemIdx) => {
                      // Evalúa stock solo si el cliente compró el módulo de inventario
                      const stockActual = features.inventario && item.stock !== undefined ? parseInt(item.stock) : 999;
                      const estaAgotado = features.inventario && stockActual <= 0;

                      return (
                        <div key={itemIdx} style={{ backgroundColor: appearance.surfaceColor || '#1e293b' }} className="rounded-2xl p-5 border border-white/5 shadow-xl flex flex-col justify-between space-y-4">
                          <div className="space-y-3 relative">
                            {estaAgotado && (
                              <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">AGOTADO</span>
                            )}
                            {item.imageUrl && (
                              <div className="rounded-xl overflow-hidden h-48 bg-black/20">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <h3 className="font-bold text-lg">{item.title}</h3>
                            <p className="text-sm opacity-70 line-clamp-3">{item.description}</p>
                          </div>
                          
                          <div className="pt-2 flex items-center justify-between gap-2">
                            {renderPrice(item.price)}
                            
                            {/* BOTÓN CARRITO: Solo aparece si el cliente compró el Sistema de Pedidos */}
                            {features.sistemaPedidos && (
                              <button 
                                disabled={estaAgotado}
                                onClick={() => addToCart(item)}
                                style={{ backgroundColor: estaAgotado ? '#475569' : (appearance.primaryColor || '#3b82f6') }}
                                className="text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow hover:brightness-110 disabled:opacity-50"
                              >
                                + Carrito
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            }

            // BLOQUE TIPO: COLUMNAS DE TEXTO
            if (block.type === 'columnas') {
              return (
                <section id={sectionId} key={idx} className="space-y-8 py-4 scroll-mt-24">
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold">{block.title}</h2>
                    <p className="text-base opacity-70 mt-2">{block.subtitle}</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8">
                    {block.items && block.items.map((col, colIdx) => (
                      <div key={colIdx} className="space-y-2">
                        <h3 className="text-lg font-semibold" style={{ color: appearance.primaryColor }}>{col.title}</h3>
                        <p className="text-sm opacity-80 leading-relaxed">{col.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            // BLOQUE TIPO: FORMULARIO DE CONTACTO
            if (block.type === 'formulario') {
              return (
                <section id={sectionId} key={idx} className="max-w-xl mx-auto p-8 rounded-3xl border border-white/10 shadow-2xl scroll-mt-24" style={{ backgroundColor: appearance.surfaceColor || '#1e293b' }}>
                  <div className="text-center space-y-2 mb-6">
                    <h2 className="text-2xl font-bold">{block.title || 'Contáctanos'}</h2>
                  </div>
                  <form onSubmit={handleFormSubmit} className="space-y-4 text-sm">
                    <input type="text" placeholder="Nombre" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}/>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="email" placeholder="Correo" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" value={formData.correo} onChange={(e) => setFormData({...formData, correo: e.target.value})}/>
                      <input type="tel" placeholder="Teléfono" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}/>
                    </div>
                    <textarea placeholder="Mensaje" rows="3" required className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none resize-none" value={formData.mensaje} onChange={(e) => setFormData({...formData, mensaje: e.target.value})}></textarea>
                    <button type="submit" style={{ backgroundColor: appearance.primaryColor || '#3b82f6' }} className="w-full py-3 rounded-xl font-bold text-white shadow-lg hover:brightness-110">{formStatus.cargando ? 'Enviando...' : 'Enviar Mensaje'}</button>
                  </form>
                </section>
              );
            }

            return null;
          })}
        </main>
      </div>

      {/* --- VISUALIZACIÓN COMPLETA DEL CARRITO DE COMPRAS FLOTANTE --- */}
      {features.sistemaPedidos && cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setIsCartOpen(!isCartOpen)}
            style={{ backgroundColor: appearance.primaryColor || '#3b82f6' }}
            className="text-white p-4 rounded-full shadow-2xl flex items-center justify-center font-bold text-sm min-w-[60px] h-[60px] border border-white/20"
          >
            🛒 <span className="ml-1 bg-white text-black text-[11px] px-2 py-0.5 rounded-full">{cart.reduce((sum, i) => sum + i.cantidad, 0)}</span>
          </button>
        </div>
      )}

      {features.sistemaPedidos && isCartOpen && cart.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div style={{ backgroundColor: appearance.surfaceColor || '#1e293b' }} className="w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between border-l border-white/10 text-white">
            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="font-bold text-lg">Tu Carrito</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-sm opacity-60">Cerrar ✕</button>
              </div>
              <div className="mt-4 space-y-4 overflow-y-auto max-h-[60vh]">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm bg-black/10 p-3 rounded-xl border border-white/5">
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-xs opacity-60">{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateQuantity(item.title, 'decrease')} className="bg-white/10 w-6 h-6 rounded-md flex items-center justify-center font-bold">-</button>
                      <span className="font-medium">{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.title, 'increase')} className="bg-white/10 w-6 h-6 rounded-md flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-4 space-y-4">
              <div className="flex justify-between font-bold text-base">
                <span>Total:</span>
                <span style={{ color: appearance.primaryColor }}>
                  ${cart.reduce((sum, item) => sum + (parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) || 0) * item.cantidad, 0).toFixed(2)}
                </span>
              </div>
              <button onClick={sendWhatsAppOrder} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg">
                💬 Enviar Pedido a WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {name && (
        <footer className="w-full py-6 text-center text-xs opacity-40 border-t border-white/5">
          <p>© {new Date().getFullYear()} {name}. Todos los derechos reservados.</p>
        </footer>
      )}
    </div>
  );
}
