import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPin, Plus, Trash2, X, AlertTriangle, CheckCircle, Send, ChevronDown, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function Visitas({ autoOpen }) {
  const [visitas, setVisitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(autoOpen || false);
  const [conflictWarning, setConflictWarning] = useState(null); // Para guardar advertencia de 1:30hs
  const [plantillas, setPlantillas] = useState([]);
  const [shareModal, setShareModal] = useState(null); // { phone: '', message: '' }

  // Formulario nuevo
  const [clienteId, setClienteId] = useState('');
  const [nombreVisitante, setNombreVisitante] = useState('');
  const [fechaHoraVisita, setFechaHoraVisita] = useState(() => {
    const pDate = localStorage.getItem('quinta_prefill_visit_date');
    const pTime = localStorage.getItem('quinta_prefill_visit_time');
    if (pDate && pTime) {
      localStorage.removeItem('quinta_prefill_visit_date');
      localStorage.removeItem('quinta_prefill_visit_time');
      return `${pDate}T${pTime}`;
    }
    return '';
  });
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [visList, clList, plList] = await Promise.all([
        api.visitas.list(),
        api.clientes.list(),
        api.plantillas.list().catch(() => [])
      ]);
      setVisitas(visList);
      setClientes(clList);
      setPlantillas(plList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e, forceInsert = false) => {
    if (e) e.preventDefault();
    if (!fechaHoraVisita) {
      alert('La fecha y hora de la visita son obligatorias.');
      return;
    }

    try {
      const response = await api.visitas.create({
        cliente_id: clienteId || null,
        nombre_visitante: clienteId ? null : nombreVisitante,
        fecha_hora_visita: new Date(fechaHoraVisita).toISOString(),
        motivo,
        notas,
        force: forceInsert
      });

      if (response.conflict) {
        // Disparar advertencia de conflicto de 1:30 hs
        setConflictWarning(response.message);
        return;
      }

      // Éxito, limpiar
      setClienteId('');
      setNombreVisitante('');
      setFechaHoraVisita('');
      setMotivo('');
      setNotas('');
      setShowAddForm(false);
      setConflictWarning(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta visita?')) return;
    try {
      await api.visitas.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReminder = (visit) => {
    const template = plantillas.find(p => p.titulo.toLowerCase().includes('visita') || p.titulo.toLowerCase().includes('recordatorio')) || 
      { mensaje: 'Hola {nombre}, te recordamos la visita a la quinta el día {fecha} a las {hora} hs.' };

    const dateObj = new Date(visit.fecha_hora_visita);
    const formattedDate = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const formattedTime = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const clientName = visit.clientes?.nombre || visit.nombre_visitante || 'cliente';
    
    let msg = template.mensaje
      .replace('{nombre}', clientName)
      .replace('{fecha}', formattedDate)
      .replace('{hora}', formattedTime);

    const phone = visit.clientes?.telefono || '';

    setShareModal({
      phone,
      message: msg,
      nombre: clientName
    });
  };

  // Helper para agrupar visitas del mismo día y calcular si hay conflictos visibles en la lista
  const checkProximityConflict = (visit, list) => {
    const vt = new Date(visit.fecha_hora_visita);
    const minDiffMs = 90 * 60 * 1000; // 1:30 hs

    return list.some(other => {
      if (other.id === visit.id) return false;
      const ot = new Date(other.fecha_hora_visita);
      return Math.abs(vt.getTime() - ot.getTime()) < minDiffMs;
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
        <h2 className="text-2xl font-extrabold text-quinta-900 tracking-tight">Visitas</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-xs font-bold shadow-md shadow-quinta-500/25 transition-all-300"
        >
          <Plus size={16} /> Agendar Visita
        </button>
      </div>

      {/* Formulario Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-quinta-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-quinta-100 w-full max-w-md p-6 relative shadow-2xl animate-scaleUp">
            <button onClick={() => { setShowAddForm(false); setConflictWarning(null); }} className="absolute top-4 right-4 text-quinta-400 hover:text-quinta-600 transition-all-300">
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold text-quinta-900 mb-4">Agendar Visita</h3>

            {conflictWarning ? (
              /* Bloque de Advertencia de 1:30 hs */
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 rounded-xl flex items-start gap-3 text-xs font-semibold">
                  <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-sm mb-1">¡Horario muy Cercano!</h4>
                    <p className="leading-relaxed">{conflictWarning}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAddSubmit(null, true)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md transition-all-300"
                  >
                    Sí, guardar de todas formas
                  </button>
                  <button
                    onClick={() => setConflictWarning(null)}
                    className="flex-1 py-2 bg-quinta-100 hover:bg-quinta-200 text-quinta-700 font-bold rounded-xl text-xs transition-all-300"
                  >
                    Modificar horario
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => handleAddSubmit(e, false)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Cliente Registrado (Opcional)</label>
                  <CustomSelect
                    value={clienteId}
                    onChange={(val) => {
                      setClienteId(val);
                      if (val) setNombreVisitante('');
                    }}
                    options={[
                      { value: '', label: '-- Seleccionar cliente --' },
                      ...clientes.map(c => ({ value: c.id, label: c.nombre }))
                    ]}
                  />
                </div>

                {!clienteId && (
                  <div>
                    <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Nombre Visitante (No Cliente)</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Gómez o Parquero Jorge"
                      value={nombreVisitante}
                      onChange={(e) => setNombreVisitante(e.target.value)}
                      className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Fecha y Hora de Visita</label>
                  <CustomDateTimePicker value={fechaHoraVisita} onChange={setFechaHoraVisita} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Motivo</label>
                  <input
                    type="text"
                    placeholder="Ej. Mostrar la quinta, electricista..."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Notas</label>
                  <textarea
                    rows="2"
                    placeholder="Notas internas..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-sm font-bold shadow-md shadow-quinta-500/25 transition-all-300"
                >
                  Agendar Visita
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lista de Visitas */}
      <div className="space-y-4">
        {visitas.length > 0 ? (
          visitas.map(visit => {
            const hasConflict = checkProximityConflict(visit, visitas);
            const dateObj = new Date(visit.fecha_hora_visita);
            const dayFormatted = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
            const timeFormatted = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={visit.id}
                className={`bg-white p-5 rounded-2xl border shadow-sm space-y-3 transition-all-300 ${
                  hasConflict ? 'border-amber-300 bg-amber-50/10' : 'border-quinta-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-quinta-900 text-base">
                        {visit.nombre_visitante || visit.clientes?.nombre || 'Visita'}
                      </h3>
                      {hasConflict && (
                        <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                          <AlertTriangle size={10} /> conflicto 1:30hs
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-quinta-700 font-bold bg-quinta-50 px-2.5 py-1 rounded w-fit capitalize">
                      {dayFormatted} a las {timeFormatted} hs
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSendReminder(visit)}
                      title="Enviar Recordatorio por WhatsApp"
                      className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all-300"
                    >
                      <Send size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(visit.id)}
                      title="Eliminar Visita"
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {visit.motivo && (
                  <p className="text-xs font-semibold text-quinta-600">
                    <span className="text-quinta-400 font-bold">Motivo:</span> {visit.motivo}
                  </p>
                )}
                
                {visit.notes && (
                  <div className="p-2.5 bg-quinta-50/50 rounded-lg text-xs font-semibold text-quinta-500 border border-quinta-50">
                    {visit.notes}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-quinta-100 shadow-sm">
            <p className="text-sm text-quinta-400 font-semibold">No hay visitas programadas.</p>
          </div>
        )}
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
              <h3 className="text-lg font-bold text-quinta-900">Enviar Recordatorio</h3>
              <p className="text-xs text-quinta-500 font-medium">Recordatorio de visita para {shareModal.nombre}.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">WhatsApp del Cliente</label>
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
              <h3 className="text-lg font-bold text-quinta-900">Enviar Recordatorio</h3>
              <p className="text-xs text-quinta-500 font-medium">Recordatorio de visita para {shareModal.nombre}.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">WhatsApp del Cliente</label>
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

// COMPONENTES AUXILIARES CUSTOMIZADOS
function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = options.find(o => o.value === value);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-quinta-500 text-left flex justify-between items-center font-semibold text-quinta-800 focus:outline-none"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : 'Seleccionar...'}</span>
        <ChevronDown size={14} className={`text-quinta-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute z-30 mt-1.5 w-full bg-white border border-quinta-100 rounded-xl shadow-lg py-1 animate-scaleUp max-h-60 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs font-semibold hover:bg-quinta-50 transition-colors ${
                  opt.value === value ? 'text-quinta-900 bg-quinta-50/50 font-extrabold' : 'text-quinta-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CustomDateTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const initialDateStr = value ? value.split('T')[0] : '';
  const initialTimeStr = value ? value.split('T')[1] : '16:00';
  
  const [selectedDate, setSelectedDate] = useState(initialDateStr);
  const [selectedTime, setSelectedTime] = useState(initialTimeStr);
  const [currentDate, setCurrentDate] = useState(initialDateStr ? new Date(initialDateStr + 'T00:00:00') : new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const cells = [];
  const prevDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevDays - i), isCurrent: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i), isCurrent: true });
  }
  const total = cells.length;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remaining; i++) {
    cells.push({ date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i), isCurrent: false });
  }

  const handleSelectDay = (cellDate) => {
    const y = cellDate.getFullYear();
    const m = String(cellDate.getMonth() + 1).padStart(2, '0');
    const d = String(cellDate.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleConfirm = () => {
    if (!selectedDate) {
      alert('Por favor selecciona un día');
      return;
    }
    onChange(`${selectedDate}T${selectedTime}`);
    setIsOpen(false);
  };

  const displayVal = value 
    ? new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' hs'
    : 'Seleccionar fecha y hora...';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-quinta-500 text-left flex justify-between items-center font-semibold text-quinta-850 focus:outline-none"
      >
        <span>{displayVal}</span>
        <CalendarDays size={16} className="text-quinta-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className="absolute z-30 mt-1.5 w-[280px] left-0 md:left-auto md:right-0 bg-white border border-quinta-100 rounded-xl shadow-lg p-3 animate-scaleUp space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-quinta-100 rounded">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-quinta-900 capitalize">
                {currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-quinta-100 rounded">
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-quinta-400 uppercase">
              <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {cells.map((cell, idx) => {
                const cStr = cell.date.toISOString().split('T')[0];
                const isSelected = selectedDate === cStr;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(cell.date)}
                    className={`py-1 text-xs rounded transition-all-300 font-semibold ${
                      isSelected 
                        ? 'bg-quinta-500 text-white font-extrabold shadow-sm'
                        : cell.isCurrent 
                          ? 'text-quinta-850 hover:bg-quinta-50' 
                          : 'text-quinta-300'
                    }`}
                  >
                    {cell.date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Time select */}
            <div className="flex items-center justify-between border-t border-quinta-50 pt-2.5">
              <span className="text-[11px] font-bold text-quinta-500">Hora:</span>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-2 py-1 border border-quinta-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-quinta-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-1.5 bg-quinta-500 hover:bg-quinta-600 text-white font-bold rounded-lg text-xs shadow-sm transition-all-300"
            >
              Confirmar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
