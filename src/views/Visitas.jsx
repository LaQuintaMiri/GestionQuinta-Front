import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPin, Plus, Trash2, X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Visitas({ autoOpen }) {
  const [visitas, setVisitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(autoOpen || false);
  const [conflictWarning, setConflictWarning] = useState(null); // Para guardar advertencia de 1:30hs

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
      const [visList, clList] = await Promise.all([
        api.visitas.list(),
        api.clientes.list()
      ]);
      setVisitas(visList);
      setClientes(clList);
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
                  <select
                    value={clienteId}
                    onChange={(e) => {
                      setClienteId(e.target.value);
                      if (e.target.value) setNombreVisitante('');
                    }}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-quinta-500"
                  >
                    <option value="">-- Seleccionar cliente --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {!clienteId && (
                  <div>
                    <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Nombre Visitante (No Cliente)</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Gómez o Parquero Jorge"
                      value={nombreVisitante}
                      onChange={(e) => setNombreVisitante(e.target.value)}
                      className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Fecha y Hora de Visita</label>
                  <input
                    type="datetime-local"
                    required
                    value={fechaHoraVisita}
                    onChange={(e) => setFechaHoraVisita(e.target.value)}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500"
                  />
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

                  <button
                    onClick={() => handleDelete(visit.id)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all-300"
                  >
                    <Trash2 size={16} />
                  </button>
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
      </div>
    </div>
  );
}
