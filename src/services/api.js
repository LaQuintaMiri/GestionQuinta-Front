// API Service with localStorage Mock Fallback
const API_BASE_URL = 'http://localhost:5000/api';

// Datos de prueba iniciales (mock data)
const DEFAULT_CLIENTES = [
  { id: 'c1', nombre: 'María González', telefono: '+5491133334444', email: 'maria@gmail.com', notas: 'Cliente frecuente' },
  { id: 'c2', nombre: 'Juan Pérez', telefono: '+5491155556666', email: 'juan.perez@hotmail.com', notas: 'Preguntó por cumpleaños de 15' },
  { id: 'c3', nombre: 'Carlos Rodríguez', telefono: '+5491122228888', email: 'carlos@yahoo.com', notas: 'Quiere ir fin de semana largo' },
  { id: 'c4', nombre: 'Sofía Martínez', telefono: '+5491199990000', email: 'sofia.m@outlook.com', notas: '' },
  { id: 'c5', nombre: 'Pedro Electricista', telefono: '+5491144441111', email: '', notas: 'Mantenimiento luces quinta' }
];

const DEFAULT_PLANTILLAS = [
  { id: 'p1', titulo: 'Disponibilidad Positiva', mensaje: '¡Hola {nombre}! Te confirmo que el día {fecha} la quinta está libre. El valor de la estadía es de {monto}. Si te interesa, decime y te reservo provisionalmente el día por 24 horas.' },
  { id: 'p2', titulo: 'Solicitud de Seña', mensaje: '¡Hola {nombre}! Para confirmar la reserva de la quinta el día {fecha}, te pido una seña de {monto}. Podés transferir al alias: quinta.mama.mp y enviarme el comprobante. ¡Muchas gracias!' },
  { id: 'p3', titulo: 'Confirmación de Reserva', mensaje: '¡Hola {nombre}! Recibí la seña correctamente. Tu reserva para el día {fecha} ya está confirmada. ¡Te esperamos!' },
  { id: 'p4', titulo: 'Recordatorio de Saldo', mensaje: '¡Hola {nombre}! Te recuerdo que el saldo pendiente de tu reserva para el día {fecha} es de {monto}. Podés abonarlo por transferencia antes de ingresar. ¡Saludos!' }
];

// Obtener fecha de hoy y días cercanos en formato YYYY-MM-DD
const todayStr = new Date().toISOString().split('T')[0];
const getFutureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const DEFAULT_CONSULTAS = [
  { id: 'con1', cliente_id: 'c1', fecha_consulta: todayStr, fecha_interes: getFutureDate(5), estado: 'pendiente', notas: 'Consulta por fin de semana completo, 10 personas.', clientes: DEFAULT_CLIENTES[0] },
  { id: 'con2', cliente_id: 'c2', fecha_consulta: getFutureDate(-2), fecha_interes: getFutureDate(12), estado: 'respondida', notas: 'Preguntó precios. Dijo que iba a confirmar con la familia.', clientes: DEFAULT_CLIENTES[1] }
];

const DEFAULT_RESERVAS = [
  { id: 'r1', cliente_id: 'c3', fecha_inicio: getFutureDate(1), fecha_fin: getFutureDate(3), monto_total: 120000, monto_senia: 40000, estado_pago: 'senia_pagada', estado_reserva: 'confirmada', notas: 'Entra a las 10:00 hs, sale a las 18:00 hs.', clientes: DEFAULT_CLIENTES[2] },
  { id: 'r2', cliente_id: 'c4', fecha_inicio: getFutureDate(15), fecha_fin: getFutureDate(16), monto_total: 70000, monto_senia: 70000, estado_pago: 'total_pagado', estado_reserva: 'confirmada', notas: 'Paga completo por adelantado.', clientes: DEFAULT_CLIENTES[3] }
];

const DEFAULT_VISITAS = [
  { id: 'v1', cliente_id: null, nombre_visitante: 'Parquero Jorge', fecha_hora_visita: `${getFutureDate(1)}T09:00:00.000Z`, motivo: 'Mantenimiento pasto y pileta', notas: 'Viene por la mañana' },
  // Creamos dos visitas muy juntas a propósito para que el usuario experimente la advertencia de conflicto de 1:30 hs
  { id: 'v2', cliente_id: 'c1', nombre_visitante: null, fecha_hora_visita: `${getFutureDate(4)}T16:00:00.000Z`, motivo: 'Conocer la quinta', notas: 'Viene con el esposo', clientes: DEFAULT_CLIENTES[0] },
  { id: 'v3', cliente_id: 'c2', nombre_visitante: null, fecha_hora_visita: `${getFutureDate(4)}T17:00:00.000Z`, motivo: 'Revisar dimensiones para evento', notas: 'Quiere ver el parque', clientes: DEFAULT_CLIENTES[1] }
];

const DEFAULT_TRANSACCIONES = [
  { id: 't1', tipo: 'ingreso', monto: 40000, categoria: 'reserva_senia', fecha: getFutureDate(-5), reserva_id: 'r1', descripcion: 'Seña reserva Carlos Rodríguez', reservas: { id: 'r1', clientes: DEFAULT_CLIENTES[2] } },
  { id: 't2', tipo: 'ingreso', monto: 70000, categoria: 'reserva_senia', fecha: getFutureDate(-2), reserva_id: 'r2', descripcion: 'Pago completo Sofía Martínez', reservas: { id: 'r2', clientes: DEFAULT_CLIENTES[3] } },
  { id: 't3', tipo: 'egreso', monto: 12000, categoria: 'mantenimiento', fecha: getFutureDate(-4), reserva_id: null, descripcion: 'Corte de pasto Jorge' },
  { id: 't4', tipo: 'egreso', monto: 8500, categoria: 'limpieza', fecha: getFutureDate(-1), reserva_id: null, descripcion: 'Productos de limpieza y cloro' }
];

// Inicializar localStorage si no existe
const initStorage = () => {
  if (!localStorage.getItem('quinta_clientes')) localStorage.setItem('quinta_clientes', JSON.stringify(DEFAULT_CLIENTES));
  if (!localStorage.getItem('quinta_plantillas')) localStorage.setItem('quinta_plantillas', JSON.stringify(DEFAULT_PLANTILLAS));
  if (!localStorage.getItem('quinta_consultas')) localStorage.setItem('quinta_consultas', JSON.stringify(DEFAULT_CONSULTAS));
  if (!localStorage.getItem('quinta_reservas')) localStorage.setItem('quinta_reservas', JSON.stringify(DEFAULT_RESERVAS));
  if (!localStorage.getItem('quinta_visitas')) localStorage.setItem('quinta_visitas', JSON.stringify(DEFAULT_VISITAS));
  if (!localStorage.getItem('quinta_transacciones')) localStorage.setItem('quinta_transacciones', JSON.stringify(DEFAULT_TRANSACCIONES));
};

initStorage();

// Helper para mock backend
const getStorageItem = (key) => JSON.parse(localStorage.getItem(key));
const setStorageItem = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Switch global para usar API real o Mock
let useMock = false;

// Comprobar si el backend responde, sino forzar mock
const checkBackend = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/clientes`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      useMock = false;
      console.log('Conectado al servidor Express real.');
    } else {
      useMock = true;
    }
  } catch (e) {
    useMock = true;
    console.warn('Servidor Express no disponible. Ejecutando en modo Offline (Mock local).');
  }
};

// Ejecutar comprobación al cargar el script
checkBackend();

export const api = {
  // CLIENTES
  clientes: {
    list: async () => {
      if (useMock) return getStorageItem('quinta_clientes');
      const res = await fetch(`${API_BASE_URL}/clientes`);
      return res.json();
    },
    create: async (data) => {
      if (useMock) {
        const list = getStorageItem('quinta_clientes');
        const newItem = { ...data, id: 'c_' + Date.now() };
        list.push(newItem);
        setStorageItem('quinta_clientes', list);
        return newItem;
      }
      const res = await fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id, data) => {
      if (useMock) {
        const list = getStorageItem('quinta_clientes');
        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...data };
          setStorageItem('quinta_clientes', list);
          return list[index];
        }
        throw new Error('Cliente no encontrado');
      }
      const res = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id) => {
      if (useMock) {
        const list = getStorageItem('quinta_clientes');
        const filtered = list.filter(i => i.id !== id);
        setStorageItem('quinta_clientes', filtered);
        return { success: true };
      }
      const res = await fetch(`${API_BASE_URL}/clientes/${id}`, { method: 'DELETE' });
      return res.json();
    }
  },

  // CONSULTAS
  consultas: {
    list: async () => {
      if (useMock) {
        const list = getStorageItem('quinta_consultas');
        const clientes = getStorageItem('quinta_clientes');
        return list.map(c => ({
          ...c,
          clientes: clientes.find(cl => cl.id === c.cliente_id)
        }));
      }
      const res = await fetch(`${API_BASE_URL}/consultas`);
      return res.json();
    },
    create: async (data) => {
      if (useMock) {
        const list = getStorageItem('quinta_consultas');
        const clientes = getStorageItem('quinta_clientes');
        let clienteId = data.cliente_id;

        // Auto-crear cliente si se envía nombre
        if (!clienteId && data.nombre) {
          const newCl = { id: 'c_' + Date.now(), nombre: data.nombre, telefono: data.telefono, email: data.email, notas: '' };
          clientes.push(newCl);
          setStorageItem('quinta_clientes', clientes);
          clienteId = newCl.id;
        }

        const currentClient = clientes.find(cl => cl.id === clienteId);
        const newItem = {
          id: 'con_' + Date.now(),
          cliente_id: clienteId,
          fecha_consulta: todayStr,
          fecha_interes: data.fecha_interes,
          estado: data.estado || 'pendiente',
          notas: data.notas,
          clientes: currentClient
        };

        list.push(newItem);
        setStorageItem('quinta_consultas', list);
        return newItem;
      }
      const res = await fetch(`${API_BASE_URL}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar la consulta');
      }
      return res.json();
    },
    update: async (id, data) => {
      if (useMock) {
        const list = getStorageItem('quinta_consultas');
        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...data };
          setStorageItem('quinta_consultas', list);
          return list[index];
        }
        throw new Error('Consulta no encontrada');
      }
      const res = await fetch(`${API_BASE_URL}/consultas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id) => {
      if (useMock) {
        const list = getStorageItem('quinta_consultas');
        const filtered = list.filter(i => i.id !== id);
        setStorageItem('quinta_consultas', filtered);
        return { success: true };
      }
      const res = await fetch(`${API_BASE_URL}/consultas/${id}`, { method: 'DELETE' });
      return res.json();
    }
  },

  // RESERVAS
  reservas: {
    list: async () => {
      if (useMock) {
        const list = getStorageItem('quinta_reservas');
        const clientes = getStorageItem('quinta_clientes');
        return list.map(r => ({
          ...r,
          clientes: clientes.find(cl => cl.id === r.cliente_id)
        }));
      }
      const res = await fetch(`${API_BASE_URL}/reservas`);
      return res.json();
    },
    create: async (data) => {
      if (useMock) {
        const list = getStorageItem('quinta_reservas');
        const clientes = getStorageItem('quinta_clientes');
        let clienteId = data.cliente_id;

        // Auto-crear cliente si se envía nombre
        if (!clienteId && data.nombre) {
          const newCl = { id: 'c_' + Date.now(), nombre: data.nombre, telefono: data.telefono, email: data.email, notas: '' };
          clientes.push(newCl);
          setStorageItem('quinta_clientes', clientes);
          clienteId = newCl.id;
        }

        // Chequear solapamiento
        const isOverlap = list.some(r =>
          r.estado_reserva !== 'cancelada' &&
          r.fecha_inicio <= data.fecha_fin &&
          r.fecha_fin >= data.fecha_inicio
        );

        if (isOverlap) {
          throw new Error('La quinta ya está reservada para ese rango de fechas.');
        }

        const currentClient = clientes.find(cl => cl.id === clienteId);
        const newItem = {
          id: 'r_' + Date.now(),
          cliente_id: clienteId,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          monto_total: parseFloat(data.monto_total || 0),
          monto_senia: parseFloat(data.monto_senia || 0),
          estado_pago: data.estado_pago || 'pendiente',
          estado_reserva: data.estado_reserva || 'pre-reserva',
          notas: data.notas,
          clientes: currentClient
        };

        list.push(newItem);
        setStorageItem('quinta_reservas', list);

        // Registrar seña en contabilidad automáticamente
        if (newItem.monto_senia > 0) {
          const txs = getStorageItem('quinta_transacciones');
          txs.push({
            id: 't_' + Date.now(),
            tipo: 'ingreso',
            monto: newItem.monto_senia,
            categoria: 'reserva_senia',
            fecha: newItem.fecha_inicio,
            reserva_id: newItem.id,
            descripcion: `Seña recibida por reserva de ${currentClient.nombre}`
          });
          setStorageItem('quinta_transacciones', txs);
        }

        return newItem;
      }
      const res = await fetch(`${API_BASE_URL}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar la reserva');
      }
      return res.json();
    },
    update: async (id, data) => {
      if (useMock) {
        const list = getStorageItem('quinta_reservas');
        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
          // Chequear solapamiento excluyendo la actual
          const isOverlap = list.some(r =>
            r.id !== id &&
            r.estado_reserva !== 'cancelada' &&
            r.fecha_inicio <= data.fecha_fin &&
            r.fecha_fin >= data.fecha_inicio
          );

          if (isOverlap) {
            throw new Error('La quinta ya está reservada para ese rango de fechas.');
          }

          const oldItem = list[index];
          const updated = { ...oldItem, ...data };
          list[index] = updated;
          setStorageItem('quinta_reservas', list);

          // Si pasó a pagado total y antes no lo estaba, auto-registrar saldo
          if (data.estado_pago === 'total_pagado' && oldItem.estado_pago !== 'total_pagado') {
            const saldo = updated.monto_total - updated.monto_senia;
            if (saldo > 0) {
              const txs = getStorageItem('quinta_transacciones');
              txs.push({
                id: 't_' + Date.now(),
                tipo: 'ingreso',
                monto: saldo,
                categoria: 'reserva_saldo',
                fecha: todayStr,
                reserva_id: id,
                descripcion: `Saldo liquidado por reserva de ${updated.clientes?.nombre || 'Cliente'}`
              });
              setStorageItem('quinta_transacciones', txs);
            }
          }

          return updated;
        }
        throw new Error('Reserva no encontrada');
      }
      const res = await fetch(`${API_BASE_URL}/reservas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al actualizar la reserva');
      }
      return res.json();
    },
    delete: async (id) => {
      if (useMock) {
        const list = getStorageItem('quinta_reservas');
        const filtered = list.filter(i => i.id !== id);
        setStorageItem('quinta_reservas', filtered);
        return { success: true };
      }
      const res = await fetch(`${API_BASE_URL}/reservas/${id}`, { method: 'DELETE' });
      return res.json();
    }
  },

  // VISITAS
  visitas: {
    list: async () => {
      if (useMock) {
        const list = getStorageItem('quinta_visitas');
        const clientes = getStorageItem('quinta_clientes');
        return list.map(v => ({
          ...v,
          clientes: v.cliente_id ? clientes.find(cl => cl.id === v.cliente_id) : null
        }));
      }
      const res = await fetch(`${API_BASE_URL}/visitas`);
      return res.json();
    },
    create: async (data) => {
      if (useMock) {
        const list = getStorageItem('quinta_visitas');
        const clientes = getStorageItem('quinta_clientes');
        const newVisitDate = new Date(data.fecha_hora_visita);
        const minDiffMs = 90 * 60 * 1000;

        // Comprobar conflictos de 1:30 hs
        const rangeStart = new Date(newVisitDate.getTime() - minDiffMs);
        const rangeEnd = new Date(newVisitDate.getTime() + minDiffMs);

        const conflicts = list.filter(v => {
          const vt = new Date(v.fecha_hora_visita);
          return vt >= rangeStart && vt <= rangeEnd;
        });

        if (conflicts.length > 0 && !data.force) {
          const conflict = conflicts[0];
          const conflictTime = new Date(conflict.fecha_hora_visita).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          const conflictName = conflict.nombre_visitante || (clientes.find(c => c.id === conflict.cliente_id)?.nombre) || 'Otro visitante';
          return {
            conflict: true,
            message: `Conflicto de horario: Ya existe una visita agendada con ${conflictName} a las ${conflictTime}. Debe haber al menos 1:30 hs de diferencia.`
          };
        }

        const newItem = {
          id: 'v_' + Date.now(),
          cliente_id: data.cliente_id || null,
          nombre_visitante: data.nombre_visitante || null,
          fecha_hora_visita: data.fecha_hora_visita,
          motivo: data.motivo,
          notas: data.notas,
          clientes: data.cliente_id ? clientes.find(cl => cl.id === data.cliente_id) : null
        };

        list.push(newItem);
        setStorageItem('quinta_visitas', list);
        return { success: true, data: newItem };
      }

      const res = await fetch(`${API_BASE_URL}/visitas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id, data) => {
      if (useMock) {
        const list = getStorageItem('quinta_visitas');
        const clientes = getStorageItem('quinta_clientes');
        const newVisitDate = new Date(data.fecha_hora_visita);
        const minDiffMs = 90 * 60 * 1000;

        const rangeStart = new Date(newVisitDate.getTime() - minDiffMs);
        const rangeEnd = new Date(newVisitDate.getTime() + minDiffMs);

        const conflicts = list.filter(v => {
          if (v.id === id) return false;
          const vt = new Date(v.fecha_hora_visita);
          return vt >= rangeStart && vt <= rangeEnd;
        });

        if (conflicts.length > 0 && !data.force) {
          const conflict = conflicts[0];
          const conflictTime = new Date(conflict.fecha_hora_visita).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
          const conflictName = conflict.nombre_visitante || (clientes.find(c => c.id === conflict.cliente_id)?.nombre) || 'Otro visitante';
          return {
            conflict: true,
            message: `Conflicto de horario: Ya existe otra visita agendada con ${conflictName} a las ${conflictTime}. Debe haber al menos 1:30 hs de diferencia.`
          };
        }

        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
          const updated = {
            ...list[index],
            ...data,
            clientes: data.cliente_id ? clientes.find(cl => cl.id === data.cliente_id) : null
          };
          list[index] = updated;
          setStorageItem('quinta_visitas', list);
          return { success: true, data: updated };
        }
        throw new Error('Visita no encontrada');
      }

      const res = await fetch(`${API_BASE_URL}/visitas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id) => {
      if (useMock) {
        const list = getStorageItem('quinta_visitas');
        const filtered = list.filter(i => i.id !== id);
        setStorageItem('quinta_visitas', filtered);
        return { success: true };
      }
      const res = await fetch(`${API_BASE_URL}/visitas/${id}`, { method: 'DELETE' });
      return res.json();
    }
  },

  // TRANSACCIONES
  transacciones: {
    list: async () => {
      if (useMock) {
        const list = getStorageItem('quinta_transacciones');
        const reservas = getStorageItem('quinta_reservas');
        const clientes = getStorageItem('quinta_clientes');
        return list.map(t => ({
          ...t,
          reservas: t.reserva_id ? {
            id: t.reserva_id,
            clientes: clientes.find(cl => cl.id === (reservas.find(r => r.id === t.reserva_id)?.cliente_id))
          } : null
        }));
      }
      const res = await fetch(`${API_BASE_URL}/transacciones`);
      return res.json();
    },
    resumen: async () => {
      if (useMock) {
        const list = getStorageItem('quinta_transacciones');
        let ingresos = 0;
        let egresos = 0;
        const mensual = {};

        list.forEach(tx => {
          const monto = parseFloat(tx.monto);
          const f = new Date(tx.fecha);
          const mesKey = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;

          if (!mensual[mesKey]) mensual[mesKey] = { ingresos: 0, egresos: 0, balance: 0 };

          if (tx.tipo === 'ingreso') {
            ingresos += monto;
            mensual[mesKey].ingresos += monto;
          } else {
            egresos += monto;
            mensual[mesKey].egresos += monto;
          }
          mensual[mesKey].balance = mensual[mesKey].ingresos - mensual[mesKey].egresos;
        });

        return {
          resumenGeneral: { ingresos, egresos, balance: ingresos - egresos },
          resumenMensual: mensual
        };
      }
      const res = await fetch(`${API_BASE_URL}/transacciones/resumen`);
      return res.json();
    },
    create: async (data) => {
      if (useMock) {
        const list = getStorageItem('quinta_transacciones');
        const newItem = {
          id: 't_' + Date.now(),
          tipo: data.tipo,
          monto: parseFloat(data.monto),
          categoria: data.categoria,
          fecha: data.fecha || todayStr,
          reserva_id: data.reserva_id || null,
          descripcion: data.descripcion
        };
        list.push(newItem);
        setStorageItem('quinta_transacciones', list);
        return newItem;
      }
      const res = await fetch(`${API_BASE_URL}/transacciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id, data) => {
      if (useMock) {
        const list = getStorageItem('quinta_transacciones');
        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...data, monto: parseFloat(data.monto) };
          setStorageItem('quinta_transacciones', list);
          return list[index];
        }
        throw new Error('Transacción no encontrada');
      }
      const res = await fetch(`${API_BASE_URL}/transacciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id) => {
      if (useMock) {
        const list = getStorageItem('quinta_transacciones');
        const filtered = list.filter(i => i.id !== id);
        setStorageItem('quinta_transacciones', filtered);
        return { success: true };
      }
      const res = await fetch(`${API_BASE_URL}/transacciones/${id}`, { method: 'DELETE' });
      return res.json();
    }
  },

  // PLANTILLAS WHATSAPP
  plantillas: {
    list: async () => {
      if (useMock) return getStorageItem('quinta_plantillas');
      const res = await fetch(`${API_BASE_URL}/plantillas`);
      return res.json();
    },
    create: async (data) => {
      if (useMock) {
        const list = getStorageItem('quinta_plantillas');
        const newItem = { ...data, id: 'p_' + Date.now() };
        list.push(newItem);
        setStorageItem('quinta_plantillas', list);
        return newItem;
      }
      const res = await fetch(`${API_BASE_URL}/plantillas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id, data) => {
      if (useMock) {
        const list = getStorageItem('quinta_plantillas');
        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...data };
          setStorageItem('quinta_plantillas', list);
          return list[index];
        }
        throw new Error('Plantilla no encontrada');
      }
      const res = await fetch(`${API_BASE_URL}/plantillas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id) => {
      if (useMock) {
        const list = getStorageItem('quinta_plantillas');
        const filtered = list.filter(i => i.id !== id);
        setStorageItem('quinta_plantillas', filtered);
        return { success: true };
      }
      const res = await fetch(`${API_BASE_URL}/plantillas/${id}`, { method: 'DELETE' });
      return res.json();
    }
  }
};
