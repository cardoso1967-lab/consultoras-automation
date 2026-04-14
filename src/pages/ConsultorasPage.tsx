import React, { useEffect, useState } from 'react';
import { getConsultants, updateConsultant, deleteConsultant } from '../lib/supabase';
import type { Consultant } from '../lib/supabase';
import { RefreshCw, Search, Filter, SlidersHorizontal, UserPlus, MoreHorizontal, Phone, MapPin } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';
import { Dropdown } from '../components/ui/Dropdown';
import { Eye, Send, Copy, X, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function ConsultorasPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const fetchData = () => {
    setLoading(true);
    getConsultants()
      .then(setConsultants)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = consultants.filter((c) => {
    const matchSearch = !search || c.nombre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.estatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'success',
      title: 'Copiado',
      body: `${label} copiado al portapapeles`
    });
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hola ${name}, te contacto desde AutoMensajes...`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleEdit = (consultant: Consultant) => {
    setEditingConsultant({ ...consultant });
  };

  const handleSaveEdit = async () => {
    if (!editingConsultant) return;
    setIsSaving(true);
    try {
      const { id, ...updates } = editingConsultant;
      await updateConsultant(id, updates);
      setConsultants(prev => prev.map(c => c.id === id ? editingConsultant : c));
      addToast({ type: 'success', title: 'Actualización Exitosa', body: `Los datos de ${editingConsultant.nombre} han sido actualizados.` });
      setEditingConsultant(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Error de Guardado', body: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a "${nombre}"? Esta acción será irreversible.`)) return;
    
    setIsDeleting(true);
    try {
      await deleteConsultant(id);
      setConsultants(prev => prev.filter(c => c.id !== id));
      addToast({ type: 'success', title: 'Registro Eliminado', body: `Se ha eliminado satisfactoriamente a ${nombre}.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Error al Eliminar', body: String(err) });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Directorio de Consultoras</h2>
          <p className="text-sm text-foreground/40 font-medium">{consultants.length} registros sincronizados con Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="glass">
            <RefreshCw size={14} className={cn(loading && "animate-spin")} />
            Sincronizar
          </Button>
          <Button variant="premium" size="sm">
            <UserPlus size={14} />
            Nueva Consultora
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="bg-surface/30 backdrop-blur-md border-border/40">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por nombre, localidad o ID…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              icon={<Search size={18} aria-hidden="true" />}
              className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              aria-label="Buscar consultoras"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-border/50 hidden lg:block mx-2" />
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {['all', 'Pendiente', 'Retrasada', 'Agendado', 'Cerrado'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                    filterStatus === status 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface/50 text-foreground/40 border-border/50 hover:border-primary/30"
                  )}
                >
                  {status === 'all' ? 'Todos' : status}
                </button>
              ))}
            </div>

            <Button variant="ghost" size="icon" className="shrink-0">
              <SlidersHorizontal size={18} className="text-foreground/40" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Container */}
      <Card className="overflow-hidden border-border/30 bg-surface/20">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="size-20 bg-surface rounded-full flex items-center justify-center mx-auto text-foreground/20 border border-border/50">
              <Search size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No se encontraron resultados</h3>
              <p className="text-sm text-foreground/40">Intenta ajustar los filtros de búsqueda</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterStatus('all'); }}>
              Limpiar Filtros
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-surface/40">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Información Consultora</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Estado Operativo</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Ubicación</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Ciclo</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((c) => (
                  <tr key={c.id} className="group hover:bg-primary/5 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-surface-bright border border-border/50 flex items-center justify-center font-black text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {c.nombre.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm tracking-tight">{c.nombre}</span>
                          <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-tighter">ID: {c.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge 
                          variant={
                            c.estatus === 'Retrasada' ? 'destructive' :
                            c.estatus === 'Pendiente' ? 'warning' :
                            c.estatus === 'Agendado' ? 'success' : 'ghost'
                          } 
                          className="w-fit"
                        >
                          {c.estatus}
                        </Badge>
                        <span className="text-[10px] font-bold opacity-30 flex items-center gap-1">
                          <div className={cn("size-1 rounded-full", c.situacion === 'Activa' ? "bg-success" : "bg-foreground/20")} />
                          {c.situacion}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground/60">
                        <Phone size={14} className="opacity-40" />
                        <span className="text-xs font-mono">{c.telefono || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-foreground/60">
                        <MapPin size={14} className="opacity-40" />
                        <span className="text-xs font-medium">{c.ciudad || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="px-2 py-1 bg-surface-bright/50 border border-border/50 rounded-md inline-block">
                        <span className="text-[10px] font-black tracking-widest leading-none">S{c.semana || '--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setSelectedConsultant(c)}
                          className="p-2 rounded-lg hover:bg-primary/10 text-foreground/20 hover:text-primary transition-all group/btn"
                          title="Ver Detalles"
                        >
                          <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <Dropdown 
                          items={[
                            { 
                              label: 'Editar Datos', 
                              icon: Edit2, 
                              onClick: () => handleEdit(c) 
                            },
                            { 
                              label: 'Enviar WhatsApp', 
                              icon: Send, 
                              onClick: () => handleWhatsApp(c.telefono || '', c.nombre) 
                            },
                            { 
                              label: 'Copiar ID', 
                              icon: Copy, 
                              onClick: () => handleCopy(c.id, 'ID') 
                            },
                            { 
                              label: 'Eliminar Registro', 
                              icon: Trash2, 
                              variant: 'destructive',
                              onClick: () => handleDelete(c.id, c.nombre) 
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedConsultant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setSelectedConsultant(null)} />
          <Card className="w-full max-w-lg relative z-10 glass-premium border-primary/20 shadow-2xl animate-scale-in overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-foreground" />
            
            <CardContent className="p-0">
              <div className="p-8 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary">
                      {selectedConsultant.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">{selectedConsultant.nombre}</h3>
                      <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest mt-1">ID: {selectedConsultant.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedConsultant(null)}
                    className="p-2 rounded-xl bg-surface/50 border border-border/50 hover:bg-destructive/10 hover:text-destructive transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surface/30 border border-border/30 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Estado Principal</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedConsultant.estatus === 'Retrasada' ? 'destructive' : 'warning'}>
                        {selectedConsultant.estatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface/30 border border-border/30 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Situación</span>
                    <div className="flex items-center gap-2">
                       <div className={cn("size-2 rounded-full", selectedConsultant.situacion === 'Activa' ? "bg-success" : "bg-foreground/20")} />
                       <span className="text-sm font-bold italic">{selectedConsultant.situacion}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 px-2">Información de Contacto</h4>
                  <div className="space-y-2">
                    {[
                      { icon: Phone, label: 'Teléfono', value: selectedConsultant.telefono || 'No registrado' },
                      { icon: MapPin, label: 'Ciudad', value: selectedConsultant.ciudad || 'No registrada' },
                      { icon: MapPin, label: 'Región', value: selectedConsultant.region || '—' },
                    ].map((info, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface/20 border border-border/10 group hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <info.icon size={16} className="text-foreground/30 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium">{info.value}</span>
                        </div>
                        <button 
                          onClick={() => handleCopy(info.value, info.label)}
                          className="text-[10px] font-black uppercase text-primary/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        >
                          Copiar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-bright/30 border-t border-border/30 flex gap-4">
                <Button className="flex-1 font-bold h-12" onClick={() => handleWhatsApp(selectedConsultant.telefono || '', selectedConsultant.nombre)}>
                  <Send size={18} />
                  Enviar WhatsApp
                </Button>
                <Button variant="outline" className="flex-1 font-bold h-12" onClick={() => setSelectedConsultant(null)}>
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingConsultant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => !isSaving && setEditingConsultant(null)} />
          <Card className="w-full max-w-lg relative z-10 glass-premium border-primary/20 shadow-2xl animate-scale-in overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black">Editar Consultora</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-40">
                    ID: {editingConsultant.id}
                  </CardDescription>
                </div>
                <button 
                  onClick={() => setEditingConsultant(null)}
                  disabled={isSaving}
                  className="p-2 hover:bg-surface rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-8 pt-2 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Nombre Completo</label>
                  <Input 
                    value={editingConsultant.nombre}
                    onChange={(e) => setEditingConsultant({ ...editingConsultant, nombre: e.target.value })}
                    className="bg-surface/50 border-border/50 text-sm h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">WhatsApp</label>
                    <Input 
                      value={editingConsultant.telefono || ''}
                      onChange={(e) => setEditingConsultant({ ...editingConsultant, telefono: e.target.value })}
                      className="bg-surface/50 border-border/50 text-sm h-11 font-mono"
                      placeholder="521..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Ciudad</label>
                    <Input 
                      value={editingConsultant.ciudad || ''}
                      onChange={(e) => setEditingConsultant({ ...editingConsultant, ciudad: e.target.value })}
                      className="bg-surface/50 border-border/50 text-sm h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Estatus</label>
                    <select 
                      value={editingConsultant.estatus}
                      onChange={(e) => setEditingConsultant({ ...editingConsultant, estatus: e.target.value as any })}
                      className="w-full h-11 bg-surface/50 border border-border/50 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Retrasada">Retrasada</option>
                      <option value="Agendado">Agendado</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Situación</label>
                    <select 
                      value={editingConsultant.situacion}
                      onChange={(e) => setEditingConsultant({ ...editingConsultant, situacion: e.target.value as any })}
                      className="w-full h-11 bg-surface/50 border border-border/50 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>

            <div className="p-6 bg-surface-bright/30 border-t border-border/30 flex gap-4">
              <Button 
                className="flex-1 font-bold h-12" 
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? <Loader className="animate-spin mr-2" size={18} /> : null}
                Guardar Cambios
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 font-bold h-12" 
                onClick={() => setEditingConsultant(null)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
