import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Phone, Globe, Shield, Save, Server, CreditCard, Lock } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [zapiInstance, setZapiInstance] = useState(import.meta.env.VITE_ZAPI_INSTANCE_ID || '');
  const [zapiToken, setZapiToken] = useState(import.meta.env.VITE_ZAPI_TOKEN || '');
  const [zapiClientToken, setZapiClientToken] = useState(import.meta.env.VITE_ZAPI_CLIENT_TOKEN || '');
  const [testPhone, setTestPhone] = useState(import.meta.env.VITE_TEST_PHONE || '');
  const [romanceUrl, setRomanceUrl] = useState(import.meta.env.VITE_ROMANCELEADS_API_URL || '');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Preferencias del Sistema</h2>
          <p className="text-sm text-foreground/40 font-medium italic italic">Configuración de endpoints, credenciales y seguridad</p>
        </div>
        <Button 
          variant="premium" 
          size="sm" 
          onClick={handleSave}
          className="shadow-xl"
        >
          {saved ? <span className="flex items-center gap-2">✅ Cambios Guardados</span> : <span className="flex items-center gap-2"><Save size={16} /> Guardar Cambios</span>}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        {/* Main Settings */}
        <div className="space-y-6">
          <Card className="bg-surface/30 border-border/30 overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-surface/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Key size={14} className="text-primary" /> Z-API Gateway
                  </CardTitle>
                  <CardDescription>Conexión principal con el servicio de WhatsApp</CardDescription>
                </div>
                <Badge variant="success">ACTIVO</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-sm">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">Instance ID</label>
                  <Input 
                    value={zapiInstance} 
                    onChange={e => setZapiInstance(e.target.value)} 
                    onClear={() => setZapiInstance('')}
                    placeholder="Ej: 3CB04239..."
                    icon={<Server size={18} />}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">Token de Instancia</label>
                  <Input 
                    type="password" 
                    value={zapiToken} 
                    onChange={e => setZapiToken(e.target.value)} 
                    placeholder="••••••••••••"
                    icon={<Lock size={18} />}
                  />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">Client Token</label>
                <Input 
                  type="password" 
                  value={zapiClientToken} 
                  onChange={e => setZapiClientToken(e.target.value)} 
                  placeholder="••••••••••••"
                  icon={<Shield size={18} />}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface/30 border-border/30 overflow-hidden">
            <CardHeader className="border-b border-border/20 bg-surface/50">
               <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-primary" /> RomanceLeads Integration
              </CardTitle>
              <CardDescription>Sincronización de base de datos externa</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2 text-sm">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1">URL del Servicio</label>
                <Input 
                  value={romanceUrl} 
                  onChange={e => setRomanceUrl(e.target.value)} 
                  onClear={() => setRomanceUrl('')}
                  placeholder="https://api.v1.romanceleads.io"
                  icon={<Globe size={18} />}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings/Info */}
        <aside className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Seguridad & Entorno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background/50 border border-primary/10 flex items-start gap-3">
                <Shield size={20} className="text-primary shrink-0" />
                <div className="text-[11px] leading-relaxed opacity-70 italic">
                  <b>Importante:</b> Los cambios realizados aquí se aplican únicamente a la sesión activa. Para persistir credenciales de forma permanente, edite el archivo <code className="bg-primary/10 px-1 rounded text-primary font-bold">.env</code> del servidor.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface/30 border-border/30">
            <CardHeader>
               <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Phone size={14} className="text-warning" /> Terminal de Test
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-sm">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1 text-warning">Número Predefinido</label>
                  <Input 
                    value={testPhone} 
                    onChange={e => setTestPhone(e.target.value)} 
                    onClear={() => setTestPhone('')}
                    placeholder="521XXXXXXXXXX"
                    icon={<Phone size={18} className="text-warning" />}
                  />
                  <p className="text-[10px] opacity-30 font-bold px-1 italic">Este número se usará por defecto en todas las pruebas rápidas del Compositor.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 border border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
            <div className="size-10 rounded-full bg-surface-bright flex items-center justify-center text-foreground/20">
              <CreditCard size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-20">Versión del Sistema: 4.0.0-Material3</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
