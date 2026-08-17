import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookmarkCheck, Plus, Search, CheckCircle, Trash2, X, DollarSign, Send } from 'lucide-react';

export default function Reservas({ autoOpen }) {
  const [reservas, setReservas] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('confirmada'); // 'todos', 'pre-reserva', 'confirmada', 'cancelada'
  const [showAddForm, setShowAddForm] = useState(autoOpen || false);

  // Formulario nuevo
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaInicio, setFechaInicio] = useState(() => {
    const start = localStorage.getItem('quinta_prefill_start');
    if (start) return start;
    const single = localStorage.getItem('quinta_prefill_date');
    return single || '';
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const end = localStorage.getItem('quinta_prefill_end');
    if (end) {
      localStorage.removeItem('quinta_prefill_start');
      localStorage.removeItem('quinta_prefill_end');
      return end;
    }
    const single = localStorage.getItem('quinta_prefill_date');
    if (single) localStorage.removeItem('quinta_prefill_date');
    return single || '';
  });
  const [montoTotal, setMontoTotal] = useState('');
  const [montoSenia, setMontoSenia] = useState('');
  const [divisaTotal, setDivisaTotal] = useState('ARS');
  const [divisaSenia, setDivisaSenia] = useState('ARS');
  const [estadoPago, setEstadoPago] = useState('pendiente');
  const [estadoReserva, setEstadoReserva] = useState('pre-reserva');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resList, plList] = await Promise.all([
        api.reservas.list(),
        api.plantillas.list()
      ]);
      setReservas(resList);
      setPlantillas(plList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !fechaInicio || !fechaFin || !montoTotal) {
      alert('Nombre, fechas y precio total son obligatorios');
      return;
    }

    try {
      await api.reservas.create({
        nombre,
        telefono,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        monto_total: parseFloat(montoTotal),
        monto_senia: parseFloat(montoSenia || 0),
        divisa_total: divisaTotal,
        divisa_senia: divisaSenia,
        estado_pago: estadoPago,
        estado_reserva: estadoReserva,
        notas
      });

      // Resetear
      setNombre('');
      setTelefono('');
      setFechaInicio('');
      setFechaFin('');
      setMontoTotal('');
      setMontoSenia('');
      setDivisaTotal('ARS');
      setDivisaSenia('ARS');
      setEstadoPago('pendiente');
      setEstadoReserva('pre-reserva');
      setNotas('');
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, payload) => {
    try {
      await api.reservas.update(id, payload);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendWhatsApp = (reserva, templateTitle) => {
    if (!reserva.clientes || !reserva.clientes.telefono) {
      alert('El cliente no tiene teléfono cargado.');
      return;
    }

    const template = plantillas.find(p => p.titulo === templateTitle);
    if (!template) {
      alert('Plantilla no encontrada.');
      return;
    }

    const symTotal = reserva.divisa_total === 'USD' ? 'US$' : '$';
    const symSenia = reserva.divisa_senia === 'USD' ? 'US$' : '$';
    const sameDivisa = reserva.divisa_total === reserva.divisa_senia;
    
    const saldoText = sameDivisa 
      ? `${symTotal}${reserva.monto_total - reserva.monto_senia}`
      : `${symTotal}${reserva.monto_total} (menos seña de ${symSenia}${reserva.monto_senia})`;

    const formattedMsg = template.mensaje
      .replace('{nombre}', reserva.clientes.nombre)
      .replace('{fecha}', `${reserva.fecha_inicio} al ${reserva.fecha_fin}`)
      .replace('{monto}', templateTitle === 'Recordatorio de Saldo' ? saldoText : `${symSenia}${reserva.monto_senia}`);

    const cleanPhone = reserva.clientes.telefono.replace(/[^\d+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedMsg)}`;
    window.open(url, '_blank');
  };

  // Filtrado y Búsqueda
  const filteredReservas = reservas.filter(r => {
    const matchesSearch = r.clientes?.nombre.toLowerCase().includes(search.toLowerCase()) || 
      r.fecha_inicio.includes(search);
    const matchesFilter = filter === 'todos' ? true : r.estado_reserva === filter;
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
        <h2 className="text-2xl font-extrabold text-quinta-900 tracking-tight">Reservas</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-xs font-bold shadow-md shadow-quinta-500/25 transition-all-300"
        >
          <Plus size={16} /> Nueva Reserva
        </button>
      </div>

      {/* Formulario Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-quinta-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-quinta-100 w-full max-w-md p-6 relative shadow-2xl overflow-y-auto max-h-[90vh] animate-scaleUp">
            <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-quinta-400 hover:text-quinta-600 transition-all-300">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-quinta-900 mb-4">Registrar Reserva</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Rodríguez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ej. +5491133334444"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Fecha Entrada</label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Fecha Salida</label>
                  <input
                    type="date"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Monto Total</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      required
                      placeholder="Total"
                      value={montoTotal}
                      onChange={(e) => setMontoTotal(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                    />
                    <select
                      value={divisaTotal}
                      onChange={(e) => setDivisaTotal(e.target.value)}
                      className="px-2 py-2 border border-quinta-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-quinta-500 font-bold text-quinta-700 shrink-0"
                    >
                      <option value="ARS">ARS ($)</option>
                      <option value="USD">USD (US$)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Monto Seña</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="Seña"
                      value={montoSenia}
                      onChange={(e) => setMontoSenia(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                    />
                    <select
                      value={divisaSenia}
                      onChange={(e) => setDivisaSenia(e.target.value)}
                      className="px-2 py-2 border border-quinta-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-quinta-500 font-bold text-quinta-700 shrink-0"
                    >
                      <option value="ARS">ARS ($)</option>
                      <option value="USD">USD (US$)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Estado Pago</label>
                  <select
                    value={estadoPago}
                    onChange={(e) => setEstadoPago(e.target.value)}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-quinta-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="senia_pagada">Seña Pagada</option>
                    <option value="total_pagado">Total Pagado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Estado Reserva</label>
                  <select
                    value={estadoReserva}
                    onChange={(e) => setEstadoReserva(e.target.value)}
                    className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-quinta-500"
                  >
                    <option value="pre-reserva">Pre-reserva</option>
                    <option value="confirmada">Confirmada</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Notas</label>
                <textarea
                  rows="2"
                  placeholder="Detalles sobre mascotas, depósito de garantía, etc..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-sm font-bold shadow-md shadow-quinta-500/25 transition-all-300"
              >
                Crear Reserva
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Buscador y Filtros */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-quinta-400 pointer-events-none">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por huésped o fecha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-quinta-100 bg-white rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-quinta-500"
          />
        </div>

        <div className="flex gap-1.5 p-1 bg-quinta-100 rounded-xl w-fit overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter('confirmada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all-300 whitespace-nowrap ${
              filter === 'confirmada' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
            }`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setFilter('pre-reserva')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all-300 whitespace-nowrap ${
              filter === 'pre-reserva' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
            }`}
          >
            Pre-reservas
          </button>
          <button
            onClick={() => setFilter('cancelada')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all-300 whitespace-nowrap ${
              filter === 'cancelada' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
            }`}
          >
            Canceladas
          </button>
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all-300 whitespace-nowrap ${
              filter === 'todos' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Lista de Reservas */}
      <div className="space-y-4">
        {filteredReservas.length > 0 ? (
          filteredReservas.map(res => {
            const symTotal = res.divisa_total === 'USD' ? 'US$' : '$';
            const symSenia = res.divisa_senia === 'USD' ? 'US$' : '$';
            const sameDivisa = res.divisa_total === res.divisa_senia;
            
            const saldo = sameDivisa ? (res.monto_total - res.monto_senia) : null;
            return (
              <div key={res.id} className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-quinta-900 text-base">{res.clientes?.nombre}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        res.estado_reserva === 'confirmada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {res.estado_reserva}
                      </span>
                    </div>
                    <p className="text-xs text-quinta-700 font-bold bg-quinta-50 px-2 py-0.5 rounded w-fit">
                      Entrada: {res.fecha_inicio} | Salida: {res.fecha_fin}
                    </p>
                  </div>
                  
                  {/* Cancelar Reserva */}
                  {res.estado_reserva !== 'cancelada' && (
                    <button
                      onClick={() => handleStatusChange(res.id, { estado_reserva: 'cancelada' })}
                      title="Cancelar Reserva"
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all-300"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Detalles de dinero */}
                <div className="grid grid-cols-3 gap-3 bg-quinta-50/50 p-3 rounded-xl border border-quinta-100 text-center text-xs font-semibold">
                  <div>
                    <span className="text-[10px] text-quinta-400 block font-bold">PRECIO TOTAL</span>
                    <span className="text-sm font-bold text-quinta-800">{symTotal} {res.monto_total}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-quinta-400 block font-bold">SEÑA</span>
                    <span className="text-sm font-bold text-emerald-600">{symSenia} {res.monto_senia}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-quinta-400 block font-bold">SALDO</span>
                    <span className={`text-sm font-bold ${res.estado_pago === 'total_pagado' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {res.estado_pago === 'total_pagado' ? (
                        sameDivisa ? `${symTotal} 0` : 'Saldado'
                      ) : (
                        sameDivisa ? (
                          `${symTotal} ${saldo}`
                        ) : (
                          `Debe ${symTotal} ${res.monto_total}`
                        )
                      )}
                    </span>
                  </div>
                </div>

                {res.notas && (
                  <p className="text-xs text-quinta-600 italic bg-quinta-50/30 px-3 py-1.5 rounded-lg border border-quinta-100 font-semibold">
                    Notas: {res.notas}
                  </p>
                )}

                {/* Acciones de Cobro y WhatsApp */}
                <div className="pt-3 border-t border-quinta-50 flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    {/* Botones de acción de Pago */}
                    {res.estado_pago !== 'total_pagado' && res.estado_reserva !== 'cancelada' && (
                      <button
                        onClick={() => handleStatusChange(res.id, { estado_pago: 'total_pagado' })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all-300"
                      >
                        <DollarSign size={14} /> Cobrar Total
                      </button>
                    )}
                    {res.estado_pago === 'pendiente' && res.estado_reserva !== 'cancelada' && (
                      <button
                        onClick={() => handleStatusChange(res.id, { estado_pago: 'senia_pagada' })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-all-300"
                      >
                        <DollarSign size={14} /> Registrar Seña
                      </button>
                    )}
                  </div>

                  {res.clientes?.telefono && res.estado_reserva !== 'cancelada' && (
                    <div className="flex gap-1.5">
                      {res.estado_pago === 'pendiente' && (
                        <button
                          onClick={() => handleSendWhatsApp(res, 'Solicitud de Seña')}
                          className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all-300"
                        >
                          <Send size={10} /> Pedir Seña
                        </button>
                      )}
                      {res.estado_pago === 'senia_pagada' && (
                        <>
                          <button
                            onClick={() => handleSendWhatsApp(res, 'Confirmación de Reserva')}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all-300"
                          >
                            <Send size={10} /> Confirmar Reserva
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(res, 'Recordatorio de Saldo')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all-300"
                          >
                            <Send size={10} /> Recordar Saldo
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-quinta-100 shadow-sm">
            <p className="text-sm text-quinta-400 font-semibold">No se encontraron reservas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
