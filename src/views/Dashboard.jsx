import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  TrendingUp,
  MessageCircle,
  CalendarDays,
  UserCheck,
  PlusCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  Home,
  Search,
  Check,
  X,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function Dashboard({ onViewChange, onOpenQuickAction }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ consultasPendientes: 0, reservasEsteMes: 0, balanceMes: 0 });
  const [hoyActividad, setHoyActividad] = useState({ reservas: [], visitas: [] });
  const [consultasRecientes, setConsultasRecientes] = useState([]);
  const [plantillas, setPlantillas] = useState([]);

  // Listas completas para búsqueda de disponibilidad
  const [reservas, setReservas] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Búsqueda de disponibilidad por RANGO o VISITA
  const [searchType, setSearchType] = useState('alquiler'); // 'alquiler' o 'visita'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visitTime, setVisitTime] = useState('16:00');
  const [checkResult, setCheckResult] = useState(null);
  const [visitResult, setVisitResult] = useState(null);
  const [miniCalDate, setMiniCalDate] = useState(new Date());
  const [shareModal, setShareModal] = useState(null);

  const getMiniCalCells = () => {
    const y = miniCalDate.getFullYear();
    const m = miniCalDate.getMonth();

    const firstDay = new Date(y, m, 1).getDay();
    const firstDayIdx = firstDay === 0 ? 6 : firstDay - 1; // Lunes = 0
    const daysInM = new Date(y, m + 1, 0).getDate();
    
    const cells = [];
    
    // Días mes anterior
    const prevDays = new Date(y, m, 0).getDate();
    for (let i = firstDayIdx - 1; i >= 0; i--) {
      cells.push({ date: new Date(y, m - 1, prevDays - i), isCurrent: false });
    }

    // Días mes actual
    for (let i = 1; i <= daysInM; i++) {
      cells.push({ date: new Date(y, m, i), isCurrent: true });
    }

    // Rellenar hasta completar semanas
    const totalCells = cells.length;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(y, m + 1, i), isCurrent: false });
    }

    return cells;
  };

  const handleDayClick = (dateStr) => {
    if (searchType === 'visita') {
      setStartDate(dateStr);
      setEndDate('');
      checkVisitAvailability(dateStr, visitTime);
    } else {
      if (!startDate || (startDate && endDate)) {
        setStartDate(dateStr);
        setEndDate('');
        checkRangeAvailability(dateStr, dateStr);
      } else {
        if (dateStr < startDate) {
          setStartDate(dateStr);
          setEndDate('');
          checkRangeAvailability(dateStr, dateStr);
        } else {
          setEndDate(dateStr);
          checkRangeAvailability(startDate, dateStr);
        }
      }
    }
  };

  const checkRangeAvailability = (start, end) => {
    const overlapping = reservas.filter(r => 
      r.estado_reserva !== 'cancelada' &&
      r.fecha_inicio <= end &&
      r.fecha_fin >= start
    );

    const consultasRango = consultas.filter(c => 
      c.estado === 'pendiente' &&
      c.fecha_interes >= start &&
      c.fecha_interes <= end
    );

    const visitasRango = visitas.filter(v => {
      const vDate = new Date(v.fecha_hora_visita);
      const visitDateStr = `${vDate.getFullYear()}-${String(vDate.getMonth() + 1).padStart(2, '0')}-${String(vDate.getDate()).padStart(2, '0')}`;
      return visitDateStr >= start && visitDateStr <= end;
    });

    setCheckResult({
      reservasConflicto: overlapping,
      consultas: consultasRango,
      visitas: visitasRango
    });
  };

  const checkVisitAvailability = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return;

    // 1. ¿Hay reserva activa ese día?
    const booking = reservas.find(r => 
      r.estado_reserva !== 'cancelada' &&
      r.fecha_inicio <= dateStr &&
      r.fecha_fin >= dateStr
    );

    // 2. ¿Hay conflicto de proximidad con otras visitas? (90 minutos)
    const targetDt = new Date(`${dateStr}T${timeStr}:00`);
    const minDiffMs = 90 * 60 * 1000;

    const nearby = visitas.find(v => {
      const otherDt = new Date(v.fecha_hora_visita);
      const otherDateStr = `${otherDt.getFullYear()}-${String(otherDt.getMonth() + 1).padStart(2, '0')}-${String(otherDt.getDate()).padStart(2, '0')}`;
      const sameDay = otherDateStr === dateStr;
      if (!sameDay) return false;
      return Math.abs(targetDt.getTime() - otherDt.getTime()) < minDiffMs;
    });

    setVisitResult({
      hasBooking: booking,
      nearbyVisit: nearby,
      targetDate: dateStr,
      targetTime: timeStr
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [allClientes, allConsultas, allReservas, allVisitas, resumenFin] = await Promise.all([
        api.clientes.list(),
        api.consultas.list(),
        api.reservas.list(),
        api.visitas.list(),
        api.transacciones.resumen()
      ]);

      const defaultPl = await api.plantillas.list();
      setPlantillas(defaultPl);

      // Calcular estadísticas
      const preReservasCount = allReservas.filter(r => r.estado_reserva === 'pre-reserva').length;
      
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const reservasMes = allReservas.filter(r => 
        r.fecha_inicio.substring(0, 7) === currentMonth && r.estado_reserva !== 'cancelada'
      ).length;

      const balanceMes = resumenFin?.resumenMensual?.[currentMonth]?.balance || 0;

      setStats({
        preReservasPendientes: preReservasCount,
        reservasEsteMes: reservasMes,
        balanceMes
      });

      // Actividad de hoy (reservas y visitas)
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const reservasHoy = allReservas.filter(r => 
        r.estado_reserva !== 'cancelada' &&
        (r.fecha_inicio === todayStr || r.fecha_fin === todayStr || (r.fecha_inicio <= todayStr && r.fecha_fin >= todayStr))
      );

      const visitasHoy = allVisitas.filter(v => {
        const vDate = new Date(v.fecha_hora_visita);
        const visitDateStr = `${vDate.getFullYear()}-${String(vDate.getMonth() + 1).padStart(2, '0')}-${String(vDate.getDate()).padStart(2, '0')}`;
        return visitDateStr === todayStr;
      });

      setHoyActividad({
        reservas: reservasHoy,
        visitas: visitasHoy
      });

      // Guardar listas completas para búsqueda
      setReservas(allReservas);
      setConsultas(allConsultas);
      setVisitas(allVisitas);
      setClientes(allClientes);

    } catch (error) {
      console.error('Error al cargar datos de Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectWhatsAppShare = (start, end) => {
    const template = plantillas.find(p => p.titulo === 'Disponibilidad Positiva' || p.titulo.toLowerCase().includes('disponi')) || 
      { mensaje: 'Hola, sí, tenemos disponibilidad para esas fechas:\nDesde: {fecha_inicio}\nHasta: {fecha_fin}' };

    const formattedStart = new Date(start + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const formattedEnd = end 
      ? new Date(end + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      : formattedStart;

    let msg = template.mensaje
      .replace('{fecha_inicio}', formattedStart)
      .replace('{fecha_fin}', formattedEnd)
      .replace('{fecha}', formattedStart)
      .replace('{nombre}', 'cliente');

    setShareModal({
      phone: '',
      message: msg
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
      {/* Saludo Principal */}
      <div className="bg-gradient-to-r from-quinta-500 to-quinta-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <Home size={120} className="text-white opacity-10 absolute -right-2 -bottom-4 pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <p className="text-quinta-100 text-sm font-semibold uppercase tracking-wider">¡Hola Miri!</p>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Bienvenida a Quinta Miri</h2>
          <p className="text-quinta-100 text-xs md:text-sm font-medium">Aquí tenés el resumen de todo lo que pasa hoy en tu quinta.</p>
        </div>
      </div>

      {/* Buscador Rápido de Disponibilidad por Rango o Visita */}
      <div className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
        
        {/* Selector de Tipo de Búsqueda */}
        <div className="flex justify-between items-center border-b border-quinta-50 pb-3 gap-4">
          <div className="flex items-center gap-2 text-quinta-900">
            <Search size={20} className="text-quinta-500" />
            <h3 className="font-bold text-base">Buscador Rápido</h3>
          </div>
          
          <div className="flex bg-quinta-100/80 p-0.5 rounded-lg border border-quinta-200/50 shrink-0">
            <button
              onClick={() => {
                setSearchType('alquiler');
                setStartDate('');
                setEndDate('');
                setCheckResult(null);
                setVisitResult(null);
              }}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all-300 ${
                searchType === 'alquiler'
                  ? 'bg-white text-quinta-900 shadow-sm'
                  : 'text-quinta-500 hover:text-quinta-700'
              }`}
            >
              Alquileres
            </button>
            <button
              onClick={() => {
                setSearchType('visita');
                setStartDate('');
                setEndDate('');
                setCheckResult(null);
                setVisitResult(null);
              }}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all-300 ${
                searchType === 'visita'
                  ? 'bg-white text-quinta-900 shadow-sm'
                  : 'text-quinta-500 hover:text-quinta-700'
              }`}
            >
              Visitas
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-bold text-quinta-600 bg-quinta-50 p-2.5 rounded-lg">
          <span>{searchType === 'alquiler' ? 'Buscar Disponibilidad de Rango:' : 'Buscar Horario de Visita:'}</span>
          <span className="text-quinta-850">
            {searchType === 'alquiler' ? (
              startDate ? (
                endDate ? (
                  `Del ${new Date(startDate + 'T00:00:00').toLocaleDateString('es-AR', {day:'numeric', month:'short'})} al ${new Date(endDate + 'T00:00:00').toLocaleDateString('es-AR', {day:'numeric', month:'short'})}`
                ) : (
                  `Desde el ${new Date(startDate + 'T00:00:00').toLocaleDateString('es-AR', {day:'numeric', month:'short'})} (esperando fin)`
                )
              ) : (
                'Toca el inicio y fin en el mapa'
              )
            ) : (
              startDate ? (
                `Día: ${new Date(startDate + 'T00:00:00').toLocaleDateString('es-AR', {day:'numeric', month:'short'})}`
              ) : (
                'Toca el día de la visita'
              )
            )}
          </span>
        </div>

        {/* Mini Calendario Inline */}
        <div className="border border-quinta-100 rounded-xl overflow-hidden bg-quinta-50/10">
          <div className="flex items-center justify-between p-3 bg-quinta-50 border-b border-quinta-100">
            <button
              onClick={() => setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() - 1, 1))}
              className="p-1 hover:bg-quinta-200/50 rounded text-quinta-700 transition-all-300"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-quinta-900 capitalize">
              {miniCalDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setMiniCalDate(new Date(miniCalDate.getFullYear(), miniCalDate.getMonth() + 1, 1))}
              className="p-1 hover:bg-quinta-200/50 rounded text-quinta-700 transition-all-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center py-1.5 bg-quinta-50/20 border-b border-quinta-100 text-[10px] font-bold text-quinta-400 uppercase tracking-wider">
            <span>Lu</span>
            <span>Ma</span>
            <span>Mi</span>
            <span>Ju</span>
            <span>Vi</span>
            <span>Sá</span>
            <span>Do</span>
          </div>

          <div className="grid grid-cols-7 gap-[1px] bg-quinta-100 text-center">
            {getMiniCalCells().map((cell, idx) => {
              const yCell = cell.date.getFullYear();
              const mCell = String(cell.date.getMonth() + 1).padStart(2, '0');
              const dCell = String(cell.date.getDate()).padStart(2, '0');
              const dStr = `${yCell}-${mCell}-${dCell}`;
              
              // Lógica de Selección de Rango o Día Único
              const isStart = startDate === dStr;
              const isEnd = endDate === dStr;
              const isInRange = searchType === 'alquiler' && startDate && endDate && dStr > startDate && dStr < endDate;
              const isSelectedSingle = startDate && (searchType === 'visita' || !endDate) && isStart;

              // Buscar reservas, visitas o consultas para colorear los días
              const isBooked = reservas.some(r => r.estado_reserva !== 'cancelada' && r.fecha_inicio <= dStr && r.fecha_fin >= dStr);
              const hasVis = visitas.some(v => new Date(v.fecha_hora_visita).toISOString().split('T')[0] === dStr);

              let statusColor = 'bg-white hover:bg-quinta-50/40 text-quinta-850';
              
              if (isBooked) statusColor = 'bg-red-50 hover:bg-red-100 text-red-700 font-bold';
              else if (hasVis) statusColor = 'bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold';

              if (!cell.isCurrent) {
                statusColor = 'bg-quinta-50/20 text-quinta-300';
              }

              // Estilos de rango (prioritarios)
              if (isStart || isEnd || isSelectedSingle) {
                statusColor = 'bg-quinta-500 hover:bg-quinta-600 text-white font-extrabold shadow-sm';
              } else if (isInRange) {
                if (isBooked) {
                  statusColor = 'bg-red-200 text-red-950 font-bold border-y border-red-300';
                } else if (hasVis) {
                  statusColor = 'bg-sky-200 text-sky-950 font-bold';
                } else {
                  statusColor = 'bg-quinta-100 text-quinta-900 font-bold';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(dStr)}
                  className={`py-2 text-xs transition-all-300 font-semibold focus:outline-none ${statusColor}`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Hora para Visita */}
        {searchType === 'visita' && startDate && (
          <div className="flex items-center justify-between bg-quinta-50 p-3 rounded-xl border border-quinta-100 animate-fadeIn gap-3">
            <span className="text-xs font-bold text-quinta-700">Hora de la Visita:</span>
            <input
              type="time"
              value={visitTime}
              onChange={(e) => {
                setVisitTime(e.target.value);
                checkVisitAvailability(startDate, e.target.value);
              }}
              className="px-3 py-1.5 border border-quinta-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-quinta-500 focus:outline-none"
            />
          </div>
        )}

        {/* RESULTADOS DE ALQUILERES */}
        {searchType === 'alquiler' && checkResult && startDate && (
          <div className="animate-fadeIn mt-2">
            {checkResult.reservasConflicto.length > 0 ? (
              <div className="p-4 bg-red-50 border border-red-100 text-red-950 rounded-xl flex items-start gap-3 text-xs font-semibold">
                <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-red-900">Ocupado (Conflicto en el Rango)</h4>
                  <p>La quinta ya tiene reservas activas en ese rango de fechas:</p>
                  <ul className="list-disc pl-4 space-y-1 font-bold text-red-800">
                    {checkResult.reservasConflicto.map(r => (
                      <li key={r.id}>
                        {r.clientes?.nombre} ({r.fecha_inicio} al {r.fecha_fin})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {checkResult.visitas.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 text-amber-950 rounded-xl space-y-1 text-xs font-semibold">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle size={18} />
                      <h4 className="font-bold text-sm">Visitas Programadas en el Rango</h4>
                    </div>
                    {checkResult.visitas.map(vis => (
                      <div key={vis.id} className="pl-2 border-l-2 border-sky-300 text-sky-950">
                        {vis.nombre_visitante || vis.clientes?.nombre}: {new Date(vis.fecha_hora_visita).toLocaleDateString('es-AR')} a las {new Date(vis.fecha_hora_visita).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-xl flex items-start gap-3 text-xs font-semibold">
                  <Check size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950">¡Disponible para Alquiler!</h4>
                    <p>No hay reservas agendadas en este rango de fechas.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onOpenQuickAction('nueva-reserva');
                      localStorage.setItem('quinta_prefill_start', startDate);
                      localStorage.setItem('quinta_prefill_end', endDate || startDate);
                    }}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md transition-all-300 text-center"
                  >
                    Registrar Reserva
                  </button>
                  <button
                    onClick={() => handleDirectWhatsAppShare(startDate, endDate)}
                    className="flex-1 py-2 bg-quinta-500 hover:bg-quinta-600 text-white font-bold rounded-xl text-xs shadow-md transition-all-300 text-center"
                  >
                    Responder por WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULTADOS DE VISITAS */}
        {searchType === 'visita' && visitResult && startDate && (
          <div className="animate-fadeIn mt-2">
            {visitResult.nearbyVisit ? (
              <div className="p-4 bg-red-50 border border-red-100 text-red-950 rounded-xl flex items-start gap-3 text-xs font-semibold">
                <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-red-900">Horario de Visita Ocupado</h4>
                  <p>Ya hay otra visita agendada para ese día a las <span className="font-bold">{new Date(visitResult.nearbyVisit.fecha_hora_visita).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</span>.</p>
                  <p className="text-[11px] text-red-700">Debe haber al menos 1:30 hs de diferencia entre visitas para no superponerlas.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {visitResult.hasBooking && (
                  <div className="p-4 bg-amber-50 border border-amber-100 text-amber-950 rounded-xl flex items-start gap-3 text-xs font-semibold">
                    <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-900">Aviso: Quinta Ocupada</h4>
                      <p>Ese día hay huéspedes alojados (Reserva de: <span className="font-bold">{visitResult.hasBooking.clientes?.nombre}</span>).</p>
                      <p className="text-[11px] text-amber-700 font-semibold">Puedes programar la visita, pero coordina bien con los huéspedes para no molestarlos.</p>
                    </div>
                  </div>
                )}

                {!visitResult.hasBooking && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-xl flex items-start gap-3 text-xs font-semibold">
                    <Check size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950">¡Horario de Visita Disponible!</h4>
                      <p>No hay conflictos de visitas ni huéspedes alojados en ese horario.</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    localStorage.setItem('quinta_prefill_visit_date', startDate);
                    localStorage.setItem('quinta_prefill_visit_time', visitTime);
                    onOpenQuickAction('nueva-visita');
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md transition-all-300 text-center"
                >
                  {visitResult.hasBooking ? 'Agendar Visita de todas formas' : 'Agendar Visita'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pre-reservas Sin Seña */}
        <div className="bg-white p-5 rounded-2xl border border-quinta-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all-300">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-quinta-400 uppercase tracking-wider block">Pre-reservas Sin Seña</span>
            <span className="text-2xl font-bold text-quinta-900 block">{stats.preReservasPendientes}</span>
          </div>
        </div>

        {/* Card 2: Reservas del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-quinta-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all-300">
          <div className="p-3 bg-quinta-50 rounded-xl text-quinta-600">
            <CalendarDays size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-quinta-400 uppercase tracking-wider block">Alquileres este Mes</span>
            <span className="text-2xl font-bold text-quinta-900 block">{stats.reservasEsteMes}</span>
          </div>
        </div>

        {/* Card 3: Ganancia Mes */}
        <div className="bg-white p-5 rounded-2xl border border-quinta-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all-300">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-quinta-400 uppercase tracking-wider block">Ganancia de este Mes</span>
            <span className="text-2xl font-bold text-quinta-900 block">${stats.balanceMes.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas en Móvil */}
      <div className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
        <h3 className="font-bold text-quinta-900 text-base">Acciones Rápidas</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onOpenQuickAction('nueva-reserva')}
            className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100/75 rounded-xl border border-emerald-100 text-center gap-2 group transition-all-300"
          >
            <PlusCircle size={22} className="text-emerald-600 group-hover:scale-110 transition-all-300" />
            <span className="text-xs font-bold text-emerald-800">Nueva Reserva</span>
          </button>
          
          <button
            onClick={() => onOpenQuickAction('nueva-visita')}
            className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100/75 rounded-xl border border-amber-100 text-center gap-2 group transition-all-300"
          >
            <PlusCircle size={22} className="text-amber-600 group-hover:scale-110 transition-all-300" />
            <span className="text-xs font-bold text-amber-800">Agendar Visita</span>
          </button>

          <button
            onClick={() => onOpenQuickAction('nuevo-gasto')}
            className="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-red-100/75 rounded-xl border border-red-100 text-center gap-2 group transition-all-300"
          >
            <PlusCircle size={22} className="text-red-600 group-hover:scale-110 transition-all-300" />
            <span className="text-xs font-bold text-red-800">Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Grid de Actividad del Día y Consultas Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Columna Izquierda: ¿Qué pasa hoy? */}
        <div className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-quinta-50 pb-3">
            <h3 className="font-bold text-quinta-900 text-base">Agenda para Hoy</h3>
            <span className="text-xs px-2.5 py-1 bg-quinta-100 text-quinta-700 rounded-full font-semibold">
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="space-y-3">
            {/* Alquileres activos */}
            {hoyActividad.reservas.length > 0 ? (
              hoyActividad.reservas.map(res => (
                <div key={res.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Huésped Activo</span>
                    <h4 className="font-bold text-quinta-900 text-sm">{res.clientes?.nombre || 'Reserva sin nombre'}</h4>
                    <p className="text-xs text-quinta-500 font-medium">{res.fecha_inicio} a {res.fecha_fin}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    res.estado_pago === 'total_pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {res.estado_pago === 'total_pagado' ? 'PAGADO COMPLETE' : 'DEBE SALDO'}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 bg-quinta-50/30 rounded-xl border border-dashed border-quinta-200">
                <p className="text-xs text-quinta-400 font-semibold">No hay huéspedes alojados hoy.</p>
              </div>
            )}

            {/* Visitas programadas */}
            {hoyActividad.visitas.length > 0 ? (
              hoyActividad.visitas.map(vis => (
                <div key={vis.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck size={12} /> Visita de Hoy
                    </span>
                    <h4 className="font-bold text-quinta-900 text-sm">
                      {vis.nombre_visitante || vis.clientes?.nombre || 'Visita'}
                    </h4>
                    <p className="text-xs text-quinta-500 font-medium">
                      Horario: {new Date(vis.fecha_hora_visita).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </p>
                    {vis.motivo && <p className="text-[11px] text-quinta-500 font-semibold mt-0.5">Motivo: {vis.motivo}</p>}
                  </div>
                </div>
              ))
            ) : null}
          </div>
        </div>

        {/* Columna Derecha: Próximas Visitas Programadas */}
        <div className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-quinta-50 pb-3">
            <h3 className="font-bold text-quinta-900 text-base">Próximas Visitas</h3>
            <button
              onClick={() => onViewChange('visitas')}
              className="text-xs font-bold text-quinta-500 hover:text-quinta-700 flex items-center gap-0.5"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {visitas
              .filter(v => new Date(v.fecha_hora_visita) >= new Date())
              .sort((a, b) => new Date(a.fecha_hora_visita) - new Date(b.fecha_hora_visita))
              .slice(0, 3).length > 0 ? (
                visitas
                  .filter(v => new Date(v.fecha_hora_visita) >= new Date())
                  .sort((a, b) => new Date(a.fecha_hora_visita) - new Date(b.fecha_hora_visita))
                  .slice(0, 3)
                  .map(vis => (
                    <div key={vis.id} className="p-4 rounded-xl border border-quinta-100 bg-quinta-50/20 hover:border-quinta-300 transition-all-300 space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-quinta-900 text-sm">
                            {vis.nombre_visitante || vis.clientes?.nombre || 'Visita'}
                          </h4>
                          <p className="text-[11px] text-quinta-500 font-semibold mt-0.5">
                            Fecha: {new Date(vis.fecha_hora_visita).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full">
                          {new Date(vis.fecha_hora_visita).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>
                      {vis.motivo && <p className="text-xs text-quinta-600 font-medium">Motivo: {vis.motivo}</p>}
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 bg-quinta-50/30 rounded-xl border border-dashed border-quinta-200">
                  <p className="text-xs text-quinta-400 font-semibold">No hay próximas visitas programadas.</p>
                </div>
              )}
          </div>
        </div>

      {/* Modal Personalizado para Compartir por WhatsApp */}
      {shareModal && (
        <div className="fixed inset-0 bg-quinta-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-quinta-100 w-full max-w-md p-6 relative shadow-2xl animate-scaleUp space-y-4">
            <button 
              onClick={() => setShareModal(null)} 
              className="absolute top-4 right-4 text-quinta-400 hover:text-quinta-600 transition-all-300"
            >
              <X size={20} />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-quinta-900">Responder por WhatsApp</h3>
              <p className="text-xs text-quinta-500 font-medium">Envía la disponibilidad directamente sin registrar en la base de datos.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">WhatsApp del Cliente (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 5491123456789"
                  value={shareModal.phone}
                  onChange={(e) => setShareModal(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                />
                <span className="text-[10px] text-quinta-400 font-medium mt-1 block">Si lo dejas vacío, podrás copiar el mensaje listo.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Vista Previa del Mensaje</label>
                <textarea
                  rows={6}
                  value={shareModal.message}
                  onChange={(e) => setShareModal(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-quinta-500 focus:outline-none font-mono bg-quinta-50/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.message);
                  alert("¡Mensaje copiado al portapapeles! Ya puedes pegarlo en WhatsApp.");
                  setShareModal(null);
                }}
                className="flex-1 py-2.5 bg-quinta-100 hover:bg-quinta-200 text-quinta-700 font-bold rounded-xl text-xs transition-all-300"
              >
                Copiar Mensaje
              </button>
              <button
                onClick={() => {
                  const cleanPhone = shareModal.phone.replace(/[^\d]/g, '');
                  if (cleanPhone) {
                    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareModal.message)}`;
                    window.open(url, '_blank');
                  } else {
                    navigator.clipboard.writeText(shareModal.message);
                    alert("No ingresaste un número. ¡Mensaje copiado al portapapeles!");
                  }
                  setShareModal(null);
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/25 transition-all-300"
              >
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
