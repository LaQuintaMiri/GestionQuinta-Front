import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  BookmarkCheck,
  MapPin,
  DollarSign,
  FileText,
  Home
} from 'lucide-react';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'reservas', label: 'Reservas', icon: BookmarkCheck },
  { id: 'visitas', label: 'Visitas', icon: MapPin },
  { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
  { id: 'plantillas', label: 'Plantillas', icon: FileText },
];

export default function Navigation({ currentView, onViewChange }) {
  return (
    <>
      {/* SIDEBAR PARA ESCRITORIO (Visible en md en adelante) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-quinta-100 h-screen sticky top-0">
        <div className="p-6 border-b border-quinta-100 flex items-center gap-3">
          <Home size={24} className="text-quinta-500" />
          <div>
            <h1 className="font-bold text-quinta-900 tracking-tight text-lg">Quinta Miri</h1>
            <p className="text-xs text-quinta-500 font-medium">Panel de Control</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all-300 ${
                  isActive
                    ? 'bg-quinta-500 text-white shadow-md shadow-quinta-500/25'
                    : 'text-quinta-600 hover:bg-quinta-50/50 hover:text-quinta-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-quinta-500'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-quinta-100 bg-quinta-50/30 text-center">
          <p className="text-xs text-quinta-400 font-semibold">Administración Quinta Miri</p>
        </div>
      </aside>

      {/* BARRA DE NAVEGACIÓN MÓVIL INFERIOR (Visible en celular, oculta en md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-quinta-100 px-2 py-1.5 flex justify-around items-center z-50 shadow-lg">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 text-center"
            >
              <div
                className={`p-1.5 rounded-lg transition-all-300 ${
                  isActive ? 'bg-quinta-500 text-white shadow-sm' : 'text-quinta-500'
                }`}
              >
                <Icon size={18} />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-semibold tracking-wide ${
                  isActive ? 'text-quinta-900 font-bold' : 'text-quinta-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
