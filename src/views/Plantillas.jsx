import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Plus, Trash2, X, Edit, Info } from 'lucide-react';

export default function Plantillas() {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Formulario fields
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await api.plantillas.list();
      setPlantillas(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!titulo || !mensaje) {
      alert('El título y el mensaje son obligatorios');
      return;
    }

    try {
      if (editingTemplate) {
        // Modo Edición
        await api.plantillas.update(editingTemplate.id, { titulo, mensaje });
      } else {
        // Modo Creación
        await api.plantillas.create({ titulo, mensaje });
      }

      setTitulo('');
      setMensaje('');
      setEditingTemplate(null);
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditClick = (template) => {
    setEditingTemplate(template);
    setTitulo(template.titulo);
    setMensaje(template.mensaje);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta plantilla?')) return;
    try {
      await api.plantillas.delete(id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const insertVariable = (variable) => {
    setMensaje(prev => prev + variable);
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
        <h2 className="text-2xl font-extrabold text-quinta-900 tracking-tight">Plantillas de WhatsApp</h2>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setTitulo('');
            setMensaje('');
            setShowAddForm(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-xs font-bold shadow-md shadow-quinta-500/25 transition-all-300"
        >
          <Plus size={16} /> Nueva Plantilla
        </button>
      </div>

      {/* Explicación de variables */}
      <div className="bg-white p-4 rounded-xl border border-quinta-100 flex gap-3 text-xs text-quinta-600 font-semibold items-start">
        <Info className="text-quinta-500 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1 leading-relaxed">
          <h4 className="font-extrabold text-quinta-900">¿Cómo funcionan las plantillas?</h4>
          <p>Podés escribir textos estándar y usar "etiquetas mágicas" que el sistema reemplazará con los datos del cliente al enviar el mensaje:</p>
          <ul className="list-disc pl-4 space-y-0.5 mt-1 font-bold text-quinta-700">
            <li><code className="bg-quinta-50 px-1 py-0.5 rounded text-quinta-600">{"{nombre}"}</code>: Nombre del cliente.</li>
            <li><code className="bg-quinta-50 px-1 py-0.5 rounded text-quinta-600">{"{fecha}"}</code>: Fecha de interés o reserva.</li>
            <li><code className="bg-quinta-50 px-1 py-0.5 rounded text-quinta-600">{"{monto}"}</code>: Monto (ej. precio de la seña o saldo).</li>
          </ul>
        </div>
      </div>

      {/* Formulario Modal (Nuevo / Editar) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-quinta-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-quinta-100 w-full max-w-md p-6 relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => { setShowAddForm(false); setEditingTemplate(null); }}
              className="absolute top-4 right-4 text-quinta-400 hover:text-quinta-600 transition-all-300"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold text-quinta-900 mb-4">
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Título de la Plantilla</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Confirmación Disponibilidad"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-quinta-500 uppercase tracking-wider mb-1">Cuerpo del Mensaje</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Hola {nombre}, te confirmo que..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  className="w-full px-3 py-2 border border-quinta-200 rounded-xl text-sm focus:ring-2 focus:ring-quinta-500 focus:outline-none font-sans"
                />
              </div>

              {/* Botonera de variables rápidas */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-quinta-400 block uppercase tracking-wider">Insertar etiqueta rápida:</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => insertVariable('{nombre}')}
                    className="px-2 py-1 bg-quinta-50 hover:bg-quinta-100 border border-quinta-200 rounded-lg text-xs font-bold text-quinta-700"
                  >
                    Nombre Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{fecha}')}
                    className="px-2 py-1 bg-quinta-50 hover:bg-quinta-100 border border-quinta-200 rounded-lg text-xs font-bold text-quinta-700"
                  >
                    Fecha
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('{monto}')}
                    className="px-2 py-1 bg-quinta-50 hover:bg-quinta-100 border border-quinta-200 rounded-lg text-xs font-bold text-quinta-700"
                  >
                    Monto
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-quinta-500 hover:bg-quinta-600 text-white rounded-xl text-sm font-bold shadow-md shadow-quinta-500/25 transition-all-300"
              >
                {editingTemplate ? 'Actualizar Plantilla' : 'Crear Plantilla'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Listado de Plantillas */}
      <div className="space-y-4">
        {plantillas.length > 0 ? (
          plantillas.map(template => (
            <div key={template.id} className="bg-white p-5 rounded-2xl border border-quinta-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-quinta-500" />
                  <h3 className="font-extrabold text-quinta-900 text-base">{template.titulo}</h3>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(template)}
                    className="p-1.5 hover:bg-quinta-50 text-quinta-600 rounded-lg transition-all-300"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-quinta-50/50 border border-quinta-100 rounded-xl text-xs text-quinta-700 whitespace-pre-wrap leading-relaxed font-semibold">
                {template.mensaje}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-quinta-100 shadow-sm">
            <p className="text-sm text-quinta-400 font-semibold">No hay plantillas registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
