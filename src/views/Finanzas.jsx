import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Finanzas({ autoOpen }) {
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, balance: 0 });
  const [resumenMensual, setResumenMensual] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(autoOpen || false);

  // Formulario nuevo
  const [tipo, setTipo] = useState('egreso');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('mantenimiento');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txList, resData] = await Promise.all([
        api.transacciones.list(),
        api.transacciones.resumen()
      ]);
      setTransacciones(txList);
      setResumen(resData.resumenGeneral || { ingresos: 0, egresos: 0, balance: 0 });
      setResumenMensual(resData.resumenMensual || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !categoria || !descripcion) {
      alert('Monto, categoría y descripción son obligatorios');
      return;
    }

    try {
      await api.transacciones.create({
        tipo,
        monto: parseFloat(monto),
        categoria,
        fecha,
        descripcion
      });

      // Resetear
      setTipo('egreso');
      setMonto('');
      setCategoria('mantenimiento');
      setFecha(new Date().toISOString().split('T')[0]);
      setDescripcion('');
      setShowAddForm(false);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Deseas eliminar este registro de caja?')) return;
    try {
      await api.transacciones.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Convertir datos del historial mensual en array legible para gráficos de Recharts
  const chartData = Object.entries(resumenMensual).map(([mes, info]) => {
    // Convertir YYYY-MM a "NombreMes YY"
    const [year, month] = mes.split('-');
    const date = new Date(year, month - 1, 1);
    const label = date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    return {
      name: label,
      Ingresos: info.ingresos,
      Egresos: info.egresos,
      Ganancia: info.balance
    };
  }).reverse(); // Más antiguo a más reciente

  const CATEGORIA_TEXTS = {
    reserva_senia: 'Seña Recibida',
    reserva_saldo: 'Saldo Recibido',
    limpieza: 'Limpieza',
    mantenimiento: 'Mantenimiento',
    servicios: 'Servicios (Luz/Gas)',
    impuestos: 'Impuestos',
    otros: 'Otros Gastos'
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
        <h2 className="text-2xl font-extrabold text-quinta-900 tracking-tight">Finanzas</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-xs font-bold shadow-md shadow-quinta-500/25 transition-all-300"
        >
          <Plus size={16} /> Registrar Movimiento
        </button>
      </div>

      {/* Tarjetas de Balances */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center space-y-1">
          <TrendingUp className="text-emerald-600 mx-auto" size={20} />
          <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Ingresos</span>
          <span className="text-sm md:text-lg font-bold text-emerald-950 block">${resumen.ingresos.toLocaleString('es-AR')}</span>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center space-y-1">
          <TrendingDown className="text-red-600 mx-auto" size={20} />
          <span className="text-[10px] font-bold text-red-800 uppercase block tracking-wider">Gastos</span>
          <span className="text-sm md:text-lg font-bold text-red-950 block">${resumen.egresos.toLocaleString('es-AR')}</span>
        </div>
        <div className="bg-quinta-50 p-4 rounded-xl border border-quinta-200 text-center space-y-1">
          <DollarSign className="text-quinta-600 mx-auto" size={20} />
          <span className="text-[10px] font-bold text-quinta-800 uppercase block tracking-wider">Balance</span>
          <span className="text-sm md:text-lg font-bold text-quinta-950 block">${resumen.balance.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Formulario Modal para Registrar Transacción */}
      {showAddForm && (
        <div className="fixed inset-0 bg-quinta-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-quinta-100 w-full max-w-md p-6 relative shadow-2xl animate-scaleUp">
            <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-quinta-400 hover:text-quinta-600 transition-all-300">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-quinta-900 mb-4">Registrar Movimiento de Caja</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-quinta-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setTipo('ingreso'); setCategoria('reserva_senia'); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all-300 ${
                    tipo === 'ingreso' ? 'bg-emerald-500 text-white shadow-sm' : 'text-quinta-500'
                  }`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => { setTipo('egreso'); setCategoria('mantenimiento'); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all-300 ${
                    tipo === 'egreso' ? 'bg-red-500 text-white shadow-sm' : 'text-quinta-500'
                  }`}
                >
                  Egreso (Gasto)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Monto ($)</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-quinta-500"
                >
                  {tipo === 'ingreso' ? (
                    <>
                      <option value="reserva_senia">Seña de Reserva</option>
                      <option value="reserva_saldo">Saldo de Reserva</option>
                      <option value="otros">Otros Ingresos</option>
                    </>
                  ) : (
                    <>
                      <option value="mantenimiento">Mantenimiento (Corte pasto/jardín)</option>
                      <option value="limpieza">Limpieza (Servicios/Cloro)</option>
                      <option value="servicios">Servicios (Luz, gas, internet)</option>
                      <option value="impuestos">Impuestos / Tasas</option>
                      <option value="otros">Otros Gastos</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de cloro para pileta"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-sm font-bold shadow-md shadow-quinta-500/25 transition-all-300"
              >
                Guardar Movimiento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Gráfico de Finanzas (Solo renderiza si hay datos) */}
      {chartData.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
          <h3 className="font-bold text-quinta-900 text-sm">Resumen de Caja por Mes</h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f3f0" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(84, 131, 84, 0.05)' }} />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Historial de Movimientos */}
      <div className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-4">
        <h3 className="font-bold text-quinta-900 text-sm">Historial de Caja</h3>
        <div className="divide-y divide-quinta-50 max-h-96 overflow-y-auto space-y-3 pr-1">
          {transacciones.length > 0 ? (
            transacciones.map(tx => {
              const isIngreso = tx.tipo === 'ingreso';
              return (
                <div key={tx.id} className="flex justify-between items-center py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isIngreso ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {isIngreso ? '+' : '-'}
                    </span>
                    <div>
                      <h4 className="font-bold text-quinta-900 text-sm">{tx.descripcion}</h4>
                      <div className="flex gap-2 items-center text-[10px] text-quinta-400 font-bold">
                        <span>{tx.fecha}</span>
                        <span>•</span>
                        <span className="uppercase">{CATEGORIA_TEXTS[tx.categoria] || tx.categoria}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${isIngreso ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isIngreso ? '+' : '-'}${parseFloat(tx.monto).toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-md transition-all-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-quinta-400 font-semibold py-4 text-center">No hay movimientos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
