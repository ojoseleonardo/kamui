import React, { useState } from 'react'
import { 
  Settings as SettingsIcon,
  Youtube,
  FolderOpen,
  Upload,
  Bell,
  Palette,
  Shield,
  Database,
  Key,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import SharinganIcon from '@/components/ui/SharinganIcon'

function Settings() {
  const [settings, setSettings] = useState({
    autoUpload: true,
    deleteAfterUpload: false,
    generateThumbnail: true,
    defaultPrivacy: 'public',
    defaultTags: 'gaming, valorant, clips',
    defaultDescription: 'Clipe capturado automaticamente pelo Kamui',
    notifyOnComplete: true,
    notifyOnError: true,
    soundEnabled: true,
    theme: 'dark',
    monitorPath: 'C:/Users/Clips',
    maxFileSize: 2048,
    videoQuality: 'original',
  })

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-kamui-red' : 'bg-kamui-gray-light'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  )

  const sections = [
    {
      id: 'upload',
      title: 'Configurações de Upload',
      icon: Upload,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Upload Automático</p>
              <p className="text-sm text-kamui-white-muted">Enviar clipes automaticamente ao detectar</p>
            </div>
            <ToggleSwitch 
              enabled={settings.autoUpload}
              onChange={(v) => updateSetting('autoUpload', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Deletar Após Upload</p>
              <p className="text-sm text-kamui-white-muted">Remover arquivo local após envio bem-sucedido</p>
            </div>
            <ToggleSwitch 
              enabled={settings.deleteAfterUpload}
              onChange={(v) => updateSetting('deleteAfterUpload', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Gerar Thumbnail</p>
              <p className="text-sm text-kamui-white-muted">Criar thumbnail automaticamente</p>
            </div>
            <ToggleSwitch 
              enabled={settings.generateThumbnail}
              onChange={(v) => updateSetting('generateThumbnail', v)}
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-kamui-white">Qualidade do Vídeo</label>
            <select
              value={settings.videoQuality}
              onChange={(e) => updateSetting('videoQuality', e.target.value)}
              className="w-full bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
            >
              <option value="original">Original</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-kamui-white">Tamanho Máximo (MB)</label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
              className="w-full bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'youtube',
      title: 'YouTube',
      icon: Youtube,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-kamui-gray/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Youtube className="text-red-500" size={24} />
              <div>
                <p className="font-medium text-kamui-white">Conta Conectada</p>
                <p className="text-sm text-kamui-white-muted">jogador@gmail.com</p>
              </div>
            </div>
            <Badge variant="success">Conectado</Badge>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-kamui-white">Privacidade Padrão</label>
            <select
              value={settings.defaultPrivacy}
              onChange={(e) => updateSetting('defaultPrivacy', e.target.value)}
              className="w-full bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
            >
              <option value="public">Público</option>
              <option value="unlisted">Não listado</option>
              <option value="private">Privado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="font-medium text-kamui-white">Tags Padrão</label>
            <input
              type="text"
              value={settings.defaultTags}
              onChange={(e) => updateSetting('defaultTags', e.target.value)}
              placeholder="gaming, valorant, clips"
              className="w-full bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50"
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium text-kamui-white">Descrição Padrão</label>
            <textarea
              value={settings.defaultDescription}
              onChange={(e) => updateSetting('defaultDescription', e.target.value)}
              rows={3}
              className="w-full bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 resize-none"
            />
          </div>

          <Button variant="outline" className="w-full">
            <ExternalLink size={16} />
            Gerenciar Canal no YouTube
          </Button>
        </div>
      ),
    },
    {
      id: 'storage',
      title: 'Armazenamento',
      icon: Database,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="font-medium text-kamui-white">Pasta Monitorada</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.monitorPath}
                onChange={(e) => updateSetting('monitorPath', e.target.value)}
                className="flex-1 bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none focus:border-kamui-red/50"
              />
              <Button variant="outline">
                <FolderOpen size={16} />
                Procurar
              </Button>
            </div>
          </div>

          <div className="p-4 bg-kamui-gray/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-kamui-white-muted">Espaço Usado</span>
              <span className="text-sm font-medium text-kamui-white">342.5 GB / 500 GB</span>
            </div>
            <div className="h-2 bg-kamui-gray rounded-full overflow-hidden">
              <div className="h-full w-[68%] bg-gradient-to-r from-kamui-red-dark to-kamui-red" />
            </div>
            <div className="flex items-center justify-between text-xs text-kamui-white-muted">
              <span>Clipes: 156.2 GB</span>
              <span>Processados: 128.5 GB</span>
              <span>Sistema: 57.8 GB</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Limpar Cache
            </Button>
            <Button variant="danger" className="flex-1">
              Limpar Processados
            </Button>
          </div>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: Bell,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Notificar ao Concluir</p>
              <p className="text-sm text-kamui-white-muted">Exibir notificação quando upload terminar</p>
            </div>
            <ToggleSwitch 
              enabled={settings.notifyOnComplete}
              onChange={(v) => updateSetting('notifyOnComplete', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Notificar Erros</p>
              <p className="text-sm text-kamui-white-muted">Alertar quando ocorrer falha</p>
            </div>
            <ToggleSwitch 
              enabled={settings.notifyOnError}
              onChange={(v) => updateSetting('notifyOnError', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 size={20} className="text-kamui-red" />
              ) : (
                <VolumeX size={20} className="text-kamui-white-muted" />
              )}
              <div>
                <p className="font-medium text-kamui-white">Sons</p>
                <p className="text-sm text-kamui-white-muted">Reproduzir sons de notificação</p>
              </div>
            </div>
            <ToggleSwitch 
              enabled={settings.soundEnabled}
              onChange={(v) => updateSetting('soundEnabled', v)}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'appearance',
      title: 'Aparência',
      icon: Palette,
      content: (
        <div className="space-y-6">
          <div>
            <p className="font-medium text-kamui-white mb-3">Tema</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'dark', label: 'Escuro', icon: Moon },
                { id: 'light', label: 'Claro', icon: Sun },
                { id: 'system', label: 'Sistema', icon: Monitor },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => updateSetting('theme', theme.id)}
                  className={`p-4 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                    settings.theme === theme.id
                      ? 'border-kamui-red bg-kamui-red/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <theme.icon size={24} className={settings.theme === theme.id ? 'text-kamui-red' : 'text-kamui-white-muted'} />
                  <span className="text-sm">{theme.label}</span>
                  {settings.theme === theme.id && (
                    <Check size={16} className="text-kamui-red" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-medium text-kamui-white mb-3">Cor de Destaque</p>
            <div className="flex gap-2">
              {['#c41e3a', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'].map((color) => (
                <button
                  key={color}
                  className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-white/50 transition-all"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api',
      title: 'API & Integrações',
      icon: Key,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-kamui-gray/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <SharinganIcon size={32} />
              <div>
                <p className="font-medium text-kamui-white">Kamui API</p>
                <p className="text-xs text-kamui-white-muted">Chave de API para integrações</p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value="sk_live_xxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="flex-1 bg-kamui-gray border border-white/10 rounded-lg px-4 py-2 text-sm text-kamui-white font-mono"
              />
              <Button variant="outline" size="sm">Copiar</Button>
              <Button variant="outline" size="sm">Regenerar</Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-medium text-kamui-white">Webhooks</p>
            <div className="p-3 bg-kamui-gray/30 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-kamui-white">Discord Webhook</p>
                <p className="text-xs text-kamui-white-muted">Notificações no Discord</p>
              </div>
              <Badge variant="success">Ativo</Badge>
            </div>
            <div className="p-3 bg-kamui-gray/30 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-kamui-white">Twitch Integration</p>
                <p className="text-xs text-kamui-white-muted">Sincronizar com Twitch</p>
              </div>
              <Badge variant="info">Desativado</Badge>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Adicionar Integração
          </Button>
        </div>
      ),
    },
  ]

  const [activeSection, setActiveSection] = useState('upload')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
          <SettingsIcon size={28} className="text-kamui-red" />
          Configurações
        </h1>
        <p className="text-kamui-white-muted mt-1">
          Personalize o Kamui do seu jeito
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 p-2 h-fit">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                  activeSection === section.id
                    ? 'bg-kamui-red/20 text-kamui-white'
                    : 'text-kamui-white-muted hover:text-kamui-white hover:bg-white/5'
                }`}
              >
                <section.icon size={18} />
                <span className="flex-1">{section.title}</span>
                <ChevronRight size={16} className={activeSection === section.id ? 'text-kamui-red' : ''} />
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sections.find(s => s.id === activeSection)?.icon && 
                React.createElement(sections.find(s => s.id === activeSection).icon, {
                  size: 20,
                  className: 'text-kamui-red'
                })
              }
              {sections.find(s => s.id === activeSection)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sections.find(s => s.id === activeSection)?.content}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancelar</Button>
        <Button variant="primary">
          <Check size={16} />
          Salvar Alterações
        </Button>
      </div>
    </div>
  )
}

export default Settings
