import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, X, ChevronDown, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Finanzas({ autoOpen }) {
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState({
    ingresosARS: 0, egresosARS: 0, balanceARS: 0,
    ingresosUSD: 0, egresosUSD: 0, balanceUSD: 0
  });
  const [resumenMensual, setResumenMensual] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(autoOpen || false);
  const [activeCurrency, setActiveCurrency] = useState('ARS');

  // Formulario nuevo
  const [tipo, setTipo] = useState('egreso');
  const [monto, setMonto] = useState('');
  const [divisa, setDivisa] = useState('ARS');
  const [isOpenDivisa, setIsOpenDivisa] = useState(false);
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
      setResumen(resData.resumenGeneral || { 
        ingresosARS: 0, egresosARS: 0, balanceARS: 0,
        ingresosUSD: 0, egresosUSD: 0, balanceUSD: 0
      });
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
        divisa,
        categoria,
        fecha,
        descripcion
      });

      // Resetear
      setTipo('egreso');
      setMonto('');
      setDivisa('ARS');
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
    
    const isUSD = activeCurrency === 'USD';
    const ing = isUSD ? (info.ingresosUSD || 0) : (info.ingresosARS || 0);
    const egr = isUSD ? (info.egresosUSD || 0) : (info.egresosARS || 0);
    const bal = isUSD ? (info.balanceUSD || 0) : (info.balanceARS || 0);

    return {
      name: label,
      Ingresos: ing,
      Egresos: egr,
      Ganancia: bal
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

  const sym = activeCurrency === 'USD' ? 'US$' : '$';
  const valIng = activeCurrency === 'USD' ? (resumen.ingresosUSD || 0) : (resumen.ingresosARS || 0);
  const valEgr = activeCurrency === 'USD' ? (resumen.egresosUSD || 0) : (resumen.egresosARS || 0);
  const valBal = activeCurrency === 'USD' ? (resumen.balanceUSD || 0) : (resumen.balanceARS || 0);

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

      {/* Selector de Divisa de Visualización */}
      <div className="flex bg-quinta-100/80 p-0.5 rounded-lg border border-quinta-200/50 w-fit">
        <button
          onClick={() => setActiveCurrency('ARS')}
          className={`px-3 py-1 text-xs font-bold rounded-md transition-all-300 ${
            activeCurrency === 'ARS' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
          }`}
        >
          Pesos (ARS)
        </button>
        <button
          onClick={() => setActiveCurrency('USD')}
          className={`px-3 py-1 text-xs font-bold rounded-md transition-all-300 ${
            activeCurrency === 'USD' ? 'bg-white text-quinta-900 shadow-sm' : 'text-quinta-500'
          }`}
        >
          Dólares (USD)
        </button>
      </div>

      {/* Tarjetas de Balances */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center space-y-1">
          <TrendingUp className="text-emerald-600 mx-auto" size={20} />
          <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">Ingresos</span>
          <span className="text-sm md:text-lg font-bold text-emerald-950 block">{sym} {valIng.toLocaleString('es-AR')}</span>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center space-y-1">
          <TrendingDown className="text-red-600 mx-auto" size={20} />
          <span className="text-[10px] font-bold text-red-800 uppercase block tracking-wider">Gastos</span>
          <span className="text-sm md:text-lg font-bold text-red-950 block">{sym} {valEgr.toLocaleString('es-AR')}</span>
        </div>
        <div className="bg-quinta-50 p-4 rounded-xl border border-quinta-200 text-center space-y-1">
          <DollarSign className="text-quinta-600 mx-auto" size={20} />
          <span className="text-[10px] font-bold text-quinta-800 uppercase block tracking-wider">Balance</span>
          <span className="text-sm md:text-lg font-bold text-quinta-950 block">{sym} {valBal.toLocaleString('es-AR')}</span>
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
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Monto y Divisa</label>
                <div className="flex border border-quinta-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-quinta-500 focus-within:border-transparent bg-white">
                  {/* Selector de Moneda (Izquierda) */}
                  <div className="relative border-r border-quinta-100 bg-quinta-50/50 shrink-0 w-20">
                    <button
                      type="button"
                      onClick={() => setIsOpenDivisa(!isOpenDivisa)}
                      className="w-full h-full px-2.5 py-2 text-xs font-extrabold text-quinta-700 flex items-center justify-between focus:outline-none"
                    >
                      <span>{divisa === 'USD' ? 'US$' : '$'}</span>
                      <ChevronDown size={12} className="text-quinta-400" />
                    </button>
                    
                    {isOpenDivisa && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsOpenDivisa(false)} />
                        <div className="absolute z-30 mt-1.5 left-0 w-24 bg-white border border-quinta-100 rounded-xl shadow-lg py-1 animate-scaleUp">
                          <button
                            type="button"
                            onClick={() => { setDivisa('ARS'); setIsOpenDivisa(false); }}
                            className="w-full px-3 py-1.5 text-left text-xs font-bold text-quinta-600 hover:bg-quinta-50 transition-colors"
                          >
                            ARS ($)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDivisa('USD'); setIsOpenDivisa(false); }}
                            className="w-full px-3 py-1.5 text-left text-xs font-bold text-quinta-600 hover:bg-quinta-50 transition-colors"
                          >
                            USD (US$)
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Campo de Número (Derecha) */}
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 text-sm text-quinta-900 placeholder-quinta-300 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Categoría</label>
                <CustomSelect
                  value={categoria}
                  onChange={setCategoria}
                  options={tipo === 'ingreso' ? [
                    { value: 'reserva_senia', label: 'Seña de Reserva' },
                    { value: 'reserva_saldo', label: 'Saldo de Reserva' },
                    { value: 'otros', label: 'Otros Ingresos' }
                  ] : [
                    { value: 'mantenimiento', label: 'Mantenimiento (Corte pasto/jardín)' },
                    { value: 'limpieza', label: 'Limpieza (Servicios/Cloro)' },
                    { value: 'servicios', label: 'Servicios (Luz, gas, internet)' },
                    { value: 'impuestos', label: 'Impuestos / Tasas' },
                    { value: 'otros', label: 'Otros Gastos' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Fecha</label>
                <CustomDatePicker value={fecha} onChange={setFecha} />
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
                      {isIngreso ? '+' : '-'}{tx.divisa === 'USD' ? 'US$ ' : '$ '}{parseFloat(tx.monto).toLocaleString('es-AR')}
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

// COMPONENTES AUXILIARES CUSTOMIZADOS
function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOpt = options.find(o => o.value === value);

  return (
    <div className="relative flex-1 min-w-0">
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

function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());

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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (cellDate) => {
    const y = cellDate.getFullYear();
    const m = String(cellDate.getMonth() + 1).padStart(2, '0');
    const d = String(cellDate.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const displayVal = value 
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Seleccionar fecha...';

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
              <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-quinta-100 rounded">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-quinta-900 capitalize">
                {currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-quinta-100 rounded">
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-quinta-400 uppercase">
              <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {cells.map((cell, idx) => {
                const cStr = cell.date.toISOString().split('T')[0];
                const isSelected = value === cStr;
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
          </div>
        </>
      )}
    </div>
  );
}
