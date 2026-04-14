import React, { useEffect, useState } from 'react';
import { getActiveCycles, getConsultants } from '../lib/supabase';
import type { Ciclo, Consultant } from '../lib/supabase';
import { filterTargetConsultants, isWithinCycleDates, interpolateMessage } from '../lib/rules';
import { runCampaign } from '../lib/zapi';
import type { SendResult } from '../lib/zapi';
import { useToast } from '../context/ToastContext';
import {
  Send, Beaker, Users, MessageSquare, Eye, ChevronDown,
  CheckCircle, XCircle, AlertTriangle, Loader, Phone,
  Type, Layout, ListChecks, Smartphone, Settings, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

const DEFAULT_TEMPLATE = `Hola {{nombre}} 👋

Te enviamos un recordatorio sobre tu pedido del ciclo {{ciclo}} de {{region}}.

Tu estado actual es: *{{estatus}}*

⏰ La fecha límite de tu ciclo es el {{fin_ciclo}}.

Si tienes alguna duda, no dudes en contactarnos. ¡Estamos para apoyarte! 💜`;

const VARIABLES = ['{{nombre}}', '{{nombre_completo}}', '{{estatus}}', '{{ciclo}}', '{{region}}', '{{ciudad}}', '{{semana}}', '{{fecha}}', '{{fin_ciclo}}'];

export function CampañaPage() {
  const { addToast } = useToast();
  const [cycles, setCycles] = useState<Ciclo[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [isTest, setIsTest] = useState(true);
  const [testPhone, setTestPhone] = useState(import.meta.env.VITE_TEST_PHONE || '');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewConsultant, setPreviewConsultant] = useState<Consultant | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'seleccion'>('editor');

  useEffect(() => {
    Promise.all([getActiveCycles(), getConsultants()])
      .then(([c, cs]) => {
        setCycles(c);
        setConsultants(cs);
        if (cs.length > 0) setPreviewConsultant(cs[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const targets = filterTargetConsultants(consultants);
  const activeCycle = cycles[0];
  const cycleOk = activeCycle ? isWithinCycleDates(activeCycle) : false;
  const previewText = previewConsultant && activeCycle
    ? interpolateMessage(template, previewConsultant, activeCycle)
    : template;

  const handleRun = async () => {
    if (!activeCycle || targets.length === 0) return;
    setShowConfirm(false);
    setRunning(true);
    setResults([]);
    setProgress(0);

    try {
      const res = await runCampaign({
        consultants: isTest ? [targets[0]] : targets,
        ciclo: activeCycle,
        messageTemplate: template,
        isTest,
        testPhone: isTest ? testPhone : undefined,
        onProgress: (result, index, total) => {
          setResults((prev) => [...prev, result]);
          setProgress(Math.round(((index + 1) / total) * 100));
        },
      });

      const successes = res.filter((r) => r.success).length;
      addToast({
        type: successes > 0 ? 'success' : 'error',
        title: isTest ? 'Prueba completada' : 'Campaña enviada',
        body: `${successes} enviados exitosamente`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Error en campaña', body: String(err) });
    } finally {
      setRunning(false);
    }
  };

  const insertVariable = (v: string) => {
    setTemplate((prev) => prev + v);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Compositor de Campaña</h2>
          <p className="text-sm font-medium text-foreground/40 italic">
            {cycleOk 
              ? `Ciclo ${activeCycle?.numero} activo · ${targets.length} destinos detectados`
              : "Validación de ciclo requerida para envíos en producción"}
          </p>
        </div>
      </div>

      {!cycleOk && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-tight">Envío Bloqueado</p>
            <p className="opacity-80">La fecha actual está fuera de la ventana operativa del ciclo activo. El modo producción no está disponible.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Main Workspace */}
        <div className="space-y-6">
          {/* Custom Tabs */}
          <div className="flex bg-surface-dim p-1 rounded-xl w-fit border border-border/50 shadow-inner">
            {[
              { id: 'editor', label: 'Editor', icon: Type },
              { id: 'preview', label: 'Preview', icon: Smartphone },
              { id: 'seleccion', label: 'Destinatarios', icon: ListChecks },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-surface text-primary shadow-sm" 
                    : "text-foreground/40 hover:text-foreground/60"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <Card className="min-h-[500px] border-border/30 overflow-hidden glass shadow-2xl">
            {activeTab === 'editor' && (
              <div className="animate-fade-in flex flex-col h-full">
                <CardHeader className="border-b border-border/30 bg-surface/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} /> Cuerpo del Mensaje
                    </CardTitle>
                    <Badge variant="ghost" className="text-[10px] opacity-40">
                      {template.length} caracteres
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                  <div>
                    <label className="text-[10px] font-black tracking-widest text-foreground/30 uppercase mb-3 block">Tokens Dinámicos</label>
                    <div className="flex flex-wrap gap-2">
                      {VARIABLES.map((v) => (
                        <button
                          key={v}
                          onClick={() => insertVariable(v)}
                          className="px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 text-[11px] font-mono text-primary font-bold hover:bg-primary/10 transition-colors"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[300px] relative">
                    <textarea
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="w-full h-full bg-transparent border-none focus:ring-0 resize-none font-mono text-sm leading-relaxed text-foreground/80 placeholder:text-foreground/20"
                      placeholder="Redacta tu mensaje aquí..."
                    />
                  </div>
                </CardContent>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="animate-fade-in p-8 flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-full max-w-sm mb-6">
                   <CardDescription className="text-center text-[10px] uppercase font-black mb-4 tracking-widest opacity-30">Simulación de Dispositivo</CardDescription>
                   <div className="w-full h-px bg-border/20 mb-6" />
                </div>
                
                {/* Real-ish Phone UI */}
                <div className="w-[300px] bg-[#0b141a] rounded-[3rem] p-3 border-[8px] border-[#1c2e35] shadow-2xl overflow-hidden relative group">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1c2e35] rounded-b-2xl z-10" />
                  
                  <div className="bg-[#128c7e] px-4 py-8 pt-10 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[#25d366] flex items-center justify-center text-[#075e54] font-bold">CM</div>
                    <div>
                      <h4 className="text-white text-sm font-bold leading-tight">Cardoso Modas</h4>
                      <p className="text-white/60 text-[10px]">En línea</p>
                    </div>
                  </div>

                  <div className="bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-contain p-4 min-h-[300px] space-y-4">
                    <div className="bg-[#056162] text-white p-3 rounded-tr-none rounded-2xl shadow-sm text-xs leading-relaxed max-w-[85%] ml-auto animate-fade-in">
                      {previewText}
                      <div className="text-[9px] text-white/40 text-right mt-1 font-medium">9:41 AM ✓✓</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <span className="text-xs text-foreground/40 font-bold uppercase">Previsualizar con:</span>
                  <select
                    className="bg-surface border border-border/50 text-xs px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={previewConsultant?.id || ''}
                    onChange={(e) => setPreviewConsultant(targets.find(c => c.id === e.target.value) || null)}
                  >
                    {targets.slice(0, 15).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'seleccion' && (
              <div className="animate-fade-in">
                <CardHeader className="bg-surface/30">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users size={16} /> Destinatarios ({targets.length})
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-surface z-10">
                      <tr className="border-b border-border/30">
                        <th className="px-6 py-3 text-[10px] font-black uppercase text-foreground/40">Nombre</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase text-foreground/40">Estatus</th>
                        <th className="px-6 py-3 text-[10px] font-black uppercase text-foreground/40">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {targets.map(c => (
                        <tr key={c.id} className="text-xs hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-3 font-semibold">{c.nombre}</td>
                          <td className="px-6 py-3"><Badge variant="outline">{c.estatus}</Badge></td>
                          <td className="px-6 py-3 font-mono opacity-60 text-[10px]">{c.telefono}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Configuration Panel */}
        <aside className="space-y-6">
          <Card className="bg-surface/30 backdrop-blur-xl border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Settings size={14} /> Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                onClick={() => setIsTest(true)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer group",
                  isTest ? "border-primary bg-primary/10 shadow-lg shadow-primary/5" : "border-border/40 bg-surface/40 hover:border-primary/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("size-5 rounded-full border-2 flex items-center justify-center transition-colors", isTest ? "border-primary bg-primary" : "border-foreground/20")}>
                    {isTest && <div className="size-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold italic">🧪 Modo Prueba</h5>
                    <p className="text-[10px] text-foreground/40 mt-0.5 leading-tight">Envío exclusivo a tu terminal de control personal.</p>
                  </div>
                </div>
                {isTest && (
                  <div className="mt-4 pt-4 border-t border-primary/20 space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60">Terminal de Control</label>
                    <Input 
                      className="bg-surface/60 border-primary/20 h-9 text-xs"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      onClear={() => setTestPhone('')}
                      placeholder="521XXXXXXXXXX"
                    />
                  </div>
                )}
              </div>

              <div 
                onClick={() => cycleOk && setIsTest(false)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer group",
                  !isTest ? "border-destructive bg-destructive/10 shadow-lg shadow-destructive/5" : "border-border/40 bg-surface/40",
                  !cycleOk && "opacity-50 grayscale cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("size-5 rounded-full border-2 flex items-center justify-center transition-colors", !isTest ? "border-destructive bg-destructive" : "border-foreground/20")}>
                    {!isTest && <div className="size-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold italic underline decoration-destructive/30 underline-offset-4">🚀 Producción</h5>
                    <p className="text-[10px] text-foreground/40 mt-0.5 leading-tight text-balance">Distribución real a todas las consultoras objetivo.</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant={isTest ? "default" : "destructive"} 
                className={cn("w-full h-12 shadow-xl", !isTest && "animate-pulse-subtle")}
                disabled={running || (!cycleOk && !isTest) || targets.length === 0}
                onClick={() => isTest ? handleRun() : setShowConfirm(true)}
              >
                {running ? (
                  <Loader className="animate-spin" size={18} />
                ) : (
                  <>
                    <Zap className={cn("size-4 fill-current", isTest ? "text-warning" : "text-white")} />
                    {isTest ? "Ejecutar Prueba" : "Lanzar Campaña Real"}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Action Log - Real time feedback */}
          {results.length > 0 && (
            <Card className="bg-surface/20 border-border/20">
              <CardHeader className="p-4 pb-2 border-b border-border/10">
                <CardTitle className="text-[10px] uppercase font-black tracking-widest opacity-40">Progreso en Vivo</CardTitle>
              </CardHeader>
              <CardContent className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                  {results.slice().reverse().map((r, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-surface/40 border border-border/10 animate-fade-in">
                      {r.success ? <CheckCircle className="text-success shrink-0" size={12} /> : <XCircle className="text-destructive shrink-0" size={12} />}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold truncate">{r.consultant.nombre}</span>
                        <span className="text-[9px] opacity-40 leading-none">{r.success ? "✓ Entregado" : "✗ Fallido"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Confirmation Overlay Premium */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in shadow-2xl">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowConfirm(false)} />
          <Card className="w-full max-w-lg relative z-10 glass-premium border-destructive/20 shadow-2xl animate-scale-in">
            <CardHeader>
              <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-4 shadow-inner">
                <AlertTriangle size={32} />
              </div>
              <CardTitle className="text-2xl font-black">¿Inciar Envío Masivo?</CardTitle>
              <CardDescription className="text-base font-medium mt-2">
                Esta acción enviará <span className="text-destructive font-black underline decoration-destructive/30">{targets.length} mensajes reales</span> vía Z-API. Esta operación es irreversible.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-4 pt-4 pb-8 px-8">
              <Button variant="ghost" className="flex-1 font-bold" onClick={() => setShowConfirm(false)}>Desechar</Button>
              <Button variant="destructive" className="flex-1 font-bold shadow-xl shadow-destructive/20 active:scale-95" onClick={handleRun}>Lanzar Ahora</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
