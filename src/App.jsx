import React, { useState } from 'react';
import { User, Home } from 'lucide-react';
import Navigation from './components/Navigation';
import Dashboard from './views/Dashboard';
import CalendarView from './views/CalendarView';
import Reservas from './views/Reservas';
import Visitas from './views/Visitas';
import Finanzas from './views/Finanzas';
import Plantillas from './views/Plantillas';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [quickAction, setQuickAction] = useState(null);

  // Mapeo de vistas
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            onViewChange={setCurrentView}
            onOpenQuickAction={(action) => {
              setQuickAction(action);
              // Redirigir a la vista correspondiente
              if (action === 'nueva-reserva') setCurrentView('reservas');
              if (action === 'nueva-visita') setCurrentView('visitas');
              if (action === 'nuevo-gasto') setCurrentView('finanzas');
            }}
          />
        );
      case 'calendar':
        return <CalendarView />;
      case 'reservas':
        return <Reservas autoOpen={quickAction === 'nueva-reserva'} />;
      case 'visitas':
        return <Visitas autoOpen={quickAction === 'nueva-visita'} />;
      case 'finanzas':
        return <Finanzas autoOpen={quickAction === 'nuevo-gasto'} />;
      case 'plantillas':
        return <Plantillas />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-quinta-50/50 flex flex-col md:flex-row">
      {/* Sistema de Navegación Responsivo */}
      <Navigation currentView={currentView} onViewChange={(v) => { setCurrentView(v); setQuickAction(null); }} />

      {/* Área de Contenido Principal */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Cabecera superior para Escritorio */}
        <header className="hidden md:flex justify-between items-center mb-8 pb-4 border-b border-quinta-100">
          <div>
            <h2 className="text-xl font-extrabold text-quinta-900 tracking-tight capitalize">
              {currentView === 'dashboard' ? 'Panel de Control' : currentView}
            </h2>
            <p className="text-xs font-semibold text-quinta-400">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-quinta-100 shadow-sm">
            <User size={16} className="text-quinta-600" />
            <span className="text-xs font-bold text-quinta-850">Administrador Quinta</span>
          </div>
        </header>

        {/* Cabecera superior para Celular */}
        <header className="md:hidden flex justify-between items-center mb-4 py-2 border-b border-quinta-100">
          <div className="flex items-center gap-2">
            <Home size={18} className="text-quinta-500" />
            <h1 className="font-extrabold text-quinta-900 tracking-tight text-base">Quinta Miri</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-quinta-100 shadow-sm text-xs font-bold text-quinta-700">
            <span>Admin</span>
          </div>
        </header>

        {/* Vista Renderizada */}
        <div className="animate-fadeIn">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
