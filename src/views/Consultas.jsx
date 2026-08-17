import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MessageSquare, Plus, Search, Send, CheckCircle, Trash2, X } from 'lucide-react';

export default function Consultas({ autoOpen }) {
  const [consultas, setConsultas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pendiente'); // 'todos', 'pendiente', 'respondida'
  const [showAddForm, setShowAddForm] = useState(autoOpen || false);

  // Formulario nuevo
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaInteres, setFechaInteres] = useState(() => {
    const prefill = localStorage.getItem('quinta_prefill_date');
    if (prefill) {
      localStorage.removeItem('quinta_prefill_date');
      return prefill;
    }
    return '';
  });
  const [notas, setNotas] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [conList, plList] = await Promise.all([
        api.consultas.list(),
        api.plantillas.list()
      ]);
      setConsultas(conList);
      setPlantillas(plList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !fechaInteres) {
      alert('Nombre y Fecha de Interés son obligatorios');
      return;
    }

    try {
      await api.consultas.create({
        nombre,
        telefono,
        fecha_interes: fechaInteres,
        notas,
        estado: 'pendiente'
      });
      // Resetear
      setNombre('');
      setTelefono('');
      setFechaInteres('');
      setNotas('');
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, nuevoEstado) => {
    try {
      await api.consultas.update(id, { estado: nuevoEstado });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro de eliminar esta consulta?')) return;
    try {
      await api.consultas.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendWhatsApp = (consulta, templateId) => {
    if (!consulta.clientes || !consulta.clientes.telefono) {
      alert('El cliente no tiene un teléfono registrado.');
      return;
    }

    const template = plantillas.find(p => p.id === templateId) || plantillas[0];
    if (!template) {
      alert('No hay plantillas de WhatsApp disponibles.');
      return;
    }

    const formattedMsg = template.mensaje
      .replace('{nombre}', consulta.clientes.nombre)
      .replace('{fecha}', new Date(consulta.fecha_interes).toLocaleDateString('es-AR'))
      .replace('{monto}', '$80.000'); // Precio placeholder, se puede editar en WhatsApp

    const cleanPhone = consulta.clientes.telefono.replace(/[^\d+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedMsg)}`;
    window.open(url, '_blank');

    // Cambiar estado a respondida automáticamente
    if (consulta.estado === 'pendiente') {
      handleStatusChange(consulta.id, 'respondida');
    }
  };

  // Filtrado y Búsqueda
  const filteredConsultas = consultas.filter(c => {
    const matchesSearch = c.clientes?.nombre.toLowerCase().includes(search.toLowerCase()) || 
      c.fecha_interes.includes(search);
    const matchesFilter = filter === 'todos' ? true : c.estado === filter;
    return matchesSearch && matchesFilter;
  });

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
        <h2 className="text-2xl font-extrabold text-quinta-900 tracking-tight">Consultas</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-xs font-bold shadow-md shadow-quinta-500/25 transition-all-300"
        >
          <Plus size={16} /> Nueva Consulta
        </button>
      </div>

      {/* Formulario Modal para Agregar Consulta */}
      {showAddForm && (
        <div className="fixed inset-0 bg-quinta-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-quinta-100 w-full max-w-md p-6 relative shadow-2xl animate-scaleUp">
            <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-quinta-400 hover:text-quinta-600 transition-all-300">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-quinta-900 mb-4">Nueva Consulta</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Nombre del Interesado</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-quinta-500 focus:border-transparent transition-all-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Celular (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="Ej. +5491122223333"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-quinta-500 focus:border-transparent transition-all-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Día de Interés</label>
                <input
                  type="date"
                  required
                  value={fechaInteres}
                  onChange={(e) => setFechaInteres(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-quinta-500 focus:border-transparent transition-all-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Notas / Detalles</label>
                <textarea
                  rows="3"
                  placeholder="Ej. Preguntó por alquiler de día completo, 12 adultos..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-quinta-500 focus:border-transparent transition-all-300"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-sm font-bold shadow-md shadow-quinta-500/25 transition-all-300"
              >
                Guardar Consulta
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Buscador e Interruptor de Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-quinta-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por interesado o fecha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-quinta-100 bg-white rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-quinta-500"
          />
        </div>

        {/* Selector de Filtros */}
        <div className="flex gap-1.5 p-1 bg-quinta-100 rounded-xl w-fit">
          <button
            onClick={() => setFilter('pendiente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all-300 ${
              filter === 'pendiente' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('respondida')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all-300 ${
              filter === 'respondida' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
            }`}
          >
            Respondidas
          </button>
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all-300 ${
              filter === 'todos' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Listado de Consultas */}
      <div className="space-y-4">
        {filteredConsultas.length > 0 ? (
          filteredConsultas.map(consulta => (
            <div key={consulta.id} className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-quinta-900 text-base">{consulta.clientes?.nombre}</h3>
                    {consulta.clientes?.telefono && (
                      <span className="text-[10px] text-quinta-400 font-semibold">{consulta.clientes.telefono}</span>
                    )}
                  </div>
                  <p className="text-xs text-quinta-500 font-bold bg-quinta-50 px-2 py-0.5 rounded w-fit">
                    Pregunta por el {new Date(consulta.fecha_interes).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {consulta.estado === 'pendiente' && (
                    <button
                      onClick={() => handleStatusChange(consulta.id, 'respondida')}
                      title="Marcar como respondida"
                      className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all-300"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(consulta.id)}
                    title="Eliminar consulta"
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {consulta.notas && (
                <div className="p-3 bg-quinta-50/50 border border-quinta-100 rounded-xl text-xs text-quinta-700 font-semibold">
                  {consulta.notas}
                </div>
              )}

              {/* Botón WhatsApp con Selección de Plantilla */}
              <div className="pt-2 border-t border-quinta-50 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] font-semibold text-quinta-400">
                  Creada el {new Date(consulta.fecha_consulta).toLocaleDateString()}
                </span>
                
                {consulta.clientes?.telefono ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-quinta-500 font-bold mr-1">Responder con:</span>
                    {plantillas.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleSendWhatsApp(consulta, template.id)}
                        className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm shadow-emerald-500/10 transition-all-300"
                      >
                        <Send size={10} /> {template.titulo.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 font-bold italic">Sin celular para WhatsApp</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-quinta-100 shadow-sm">
            <p className="text-sm text-quinta-400 font-semibold">No se encontraron consultas con esos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
