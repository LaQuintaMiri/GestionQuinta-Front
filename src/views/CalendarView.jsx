import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ChevronLeft, ChevronRight, MessageSquare, BookmarkCheck, MapPin } from 'lucide-react';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservas, setReservas] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState({ date: null, events: [] });

  const getLocalDayStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [resList, conList, visList] = await Promise.all([
        api.reservas.list(),
        api.consultas.list(),
        api.visitas.list()
      ]);
      setReservas(resList);
      setConsultas(conList);
      setVisitas(visList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de navegación de calendario
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Obtener nombre del mes en español
  const getMonthName = (date) => {
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  // Construir matriz de días para el mes actual
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Primer día de la semana para el primer día del mes (0: Domingo, 1: Lunes...)
  // Lo convertimos para que el Lunes sea 0 y Domingo 6
  const getFirstDayOfMonth = () => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Ajuste para iniciar en Lunes
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = getFirstDayOfMonth();

  // Generar cuadrícula del calendario
  const calendarCells = [];

  // Agregar días del mes anterior vacíos o semi-transparentes
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const cellDate = new Date(year, month - 1, day);
    calendarCells.push({ date: cellDate, isCurrentMonth: false, dayNum: day });
  }

  // Agregar días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    const cellDate = new Date(year, month, i);
    calendarCells.push({ date: cellDate, isCurrentMonth: true, dayNum: i });
  }

  // Rellenar con días del mes siguiente hasta completar múltiplos de 7 (filas completas)
  const remainingCells = 42 - calendarCells.length; // Max 6 filas
  for (let i = 1; i <= remainingCells; i++) {
    const cellDate = new Date(year, month + 1, i);
    calendarCells.push({ date: cellDate, isCurrentMonth: false, dayNum: i });
  }

  // Helper para buscar reservas en una fecha dada
  const getDayStatus = (cellDate) => {
    const dateStr = getLocalDayStr(cellDate);
    
    // Buscar reservas confirmadas
    const res = reservas.find(r => 
      r.estado_reserva !== 'cancelada' &&
      r.fecha_inicio <= dateStr &&
      r.fecha_fin >= dateStr
    );
    if (res) return { status: 'reservado', data: res };

    // Buscar consultas
    const con = consultas.find(c => 
      c.estado === 'pendiente' &&
      c.fecha_interes === dateStr
    );
    if (con) return { status: 'consulta', data: con };

    // Buscar visitas
    const vis = visitas.find(v => {
      const vDate = new Date(v.fecha_hora_visita);
      const visitDateStr = getLocalDayStr(vDate);
      return visitDateStr === dateStr;
    });
    if (vis) return { status: 'visita', data: vis };

    return { status: 'libre', data: null };
  };

  const handleCellClick = (cellDate) => {
    const dateStr = getLocalDayStr(cellDate);
    const dayEvents = [];

    // Buscar reservas en esta fecha
    reservas.forEach(r => {
      if (r.estado_reserva !== 'cancelada' && r.fecha_inicio <= dateStr && r.fecha_fin >= dateStr) {
        dayEvents.push({ type: 'reserva', ...r });
      }
    });

    // Buscar consultas
    consultas.forEach(c => {
      if (c.fecha_interes === dateStr) {
        dayEvents.push({ type: 'consulta', ...c });
      }
    });

    // Buscar visitas
    visitas.forEach(v => {
      const vDate = new Date(v.fecha_hora_visita);
      const visitDateStr = getLocalDayStr(vDate);
      if (visitDateStr === dateStr) {
        dayEvents.push({ type: 'visita', ...v });
      }
    });

    setSelectedDayEvents({
      date: cellDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
      events: dayEvents
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-quinta-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between border-b border-quinta-100 pb-4">
        <h2 className="text-2xl font-extrabold text-quinta-900 tracking-tight">Calendario</h2>
        <span className="text-xs px-2.5 py-1 bg-quinta-100 text-quinta-700 rounded-full font-semibold">
          Estados de la Quinta
        </span>
      </div>

      {/* Leyenda */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-quinta-100 text-center text-xs font-semibold text-quinta-600">
        <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg bg-emerald-50 text-emerald-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Libre
        </div>
        <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg bg-red-50 text-red-800">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Reservado
        </div>
        <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg bg-amber-50 text-amber-800">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Consulta
        </div>
        <div className="flex items-center justify-center gap-1.5 py-1 rounded-lg bg-sky-50 text-sky-800">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Visita
        </div>
      </div>

      {/* Contenedor del Calendario */}
      <div className="bg-white rounded-2xl border border-quinta-100 shadow-sm overflow-hidden">
        {/* Cabecera del Mes */}
        <div className="flex items-center justify-between p-4 bg-quinta-50 border-b border-quinta-100">
          <button onClick={prevMonth} className="p-2 hover:bg-quinta-200/50 rounded-lg text-quinta-700 transition-all-300">
            <ChevronLeft size={20} />
          </button>
          <h3 className="font-extrabold text-quinta-900 text-base capitalize">{getMonthName(currentDate)}</h3>
          <button onClick={nextMonth} className="p-2 hover:bg-quinta-200/50 rounded-lg text-quinta-700 transition-all-300">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Días de la Semana */}
        <div className="grid grid-cols-7 text-center py-2 bg-quinta-50/50 border-b border-quinta-100 text-xs font-bold text-quinta-500">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        {/* Cuadrícula de Celdas */}
        <div className="grid grid-cols-7 gap-[1px] bg-quinta-100">
          {calendarCells.map((cell, idx) => {
            const dayStatus = getDayStatus(cell.date);
            let bgColor = 'bg-white';
            let textColor = 'text-quinta-900';
            let dotColor = null;

            if (!cell.isCurrentMonth) {
              bgColor = 'bg-quinta-50/50';
              textColor = 'text-quinta-300';
            }

            if (cell.isCurrentMonth) {
              if (dayStatus.status === 'reservado') {
                bgColor = 'bg-red-50 hover:bg-red-100';
                textColor = 'text-red-900 font-bold';
                dotColor = 'bg-red-500';
              } else if (dayStatus.status === 'consulta') {
                bgColor = 'bg-amber-50 hover:bg-amber-100';
                textColor = 'text-amber-900 font-bold';
                dotColor = 'bg-amber-500';
              } else if (dayStatus.status === 'visita') {
                bgColor = 'bg-sky-50 hover:bg-sky-100';
                textColor = 'text-sky-900 font-bold';
                dotColor = 'bg-sky-400';
              } else {
                bgColor = 'bg-white hover:bg-emerald-50/30';
              }
            }

            const isToday = new Date().toISOString().split('T')[0] === cell.date.toISOString().split('T')[0];

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(cell.date)}
                className={`h-16 md:h-20 flex flex-col justify-between p-1.5 transition-all-300 ${bgColor} ${textColor}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-xs md:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday ? 'bg-quinta-500 text-white font-bold' : ''
                  }`}>
                    {cell.dayNum}
                  </span>
                  {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>}
                </div>
                {/* Nombre de cliente corto en pantallas md en adelante */}
                <div className="hidden md:block w-full text-left">
                  {dayStatus.status === 'reservado' && (
                    <span className="text-[9px] truncate block text-red-700 bg-red-100 px-1 rounded">
                      {dayStatus.data.clientes?.nombre}
                    </span>
                  )}
                  {dayStatus.status === 'consulta' && (
                    <span className="text-[9px] truncate block text-amber-700 bg-amber-100 px-1 rounded">
                      {dayStatus.data.clientes?.nombre}
                    </span>
                  )}
                  {dayStatus.status === 'visita' && (
                    <span className="text-[9px] truncate block text-sky-700 bg-sky-100 px-1 rounded">
                      {dayStatus.data.nombre_visitante || dayStatus.data.clientes?.nombre || 'Visita'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel de Eventos del Día Seleccionado */}
      {selectedDayEvents.date && (
        <div className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4 animate-fadeIn">
          <div className="border-b border-quinta-50 pb-2">
            <h4 className="font-extrabold text-quinta-900 text-sm capitalize">Detalles de la fecha:</h4>
            <p className="text-xs text-quinta-500 font-semibold">{selectedDayEvents.date}</p>
          </div>

          <div className="space-y-3">
            {selectedDayEvents.events.length > 0 ? (
              selectedDayEvents.events.map((event, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    event.type === 'reserva'
                      ? 'bg-red-50/50 border-red-100 text-red-950'
                      : event.type === 'consulta'
                      ? 'bg-amber-50/50 border-amber-100 text-amber-950'
                      : 'bg-sky-50/50 border-sky-100 text-sky-950'
                  }`}
                >
                  <div className="mt-0.5">
                    {event.type === 'reserva' && <BookmarkCheck size={18} className="text-red-500" />}
                    {event.type === 'consulta' && <MessageSquare size={18} className="text-amber-500" />}
                    {event.type === 'visita' && <MapPin size={18} className="text-sky-500" />}
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-extrabold uppercase tracking-wider text-[9px] block">
                      {event.type} {event.estado_reserva || event.estado || ''}
                    </span>
                    <h5 className="font-bold text-sm">
                      {event.clientes?.nombre || event.nombre_visitante || 'Sin Nombre'}
                    </h5>
                    {event.type === 'reserva' && (
                      <p className="font-medium">
                        Monto: ${event.monto_total} | Seña: ${event.monto_senia} ({event.estado_pago.replace('_', ' ')})
                      </p>
                    )}
                    {event.type === 'visita' && (
                      <p className="font-medium">
                        Horario: {new Date(event.fecha_hora_visita).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                      </p>
                    )}
                    {event.notas && <p className="text-quinta-600 bg-white/40 px-2 py-1 rounded mt-1 font-semibold">{event.notes || event.notas}</p>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-quinta-50/20 rounded-xl">
                <p className="text-xs text-quinta-400 font-semibold">No hay ninguna reserva, consulta ni visita agendada en este día. ¡Está libre!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
