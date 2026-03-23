import React, { useCallback, useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  Youtube,
  FolderOpen,
  Upload,
  Database,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ConfirmModal } from '@/components/ui'
import { useBackendStatus } from '@/context/BackendStatusContext'
import { apiGet, apiPost, apiPut, selectWatchFolderElectron } from '@/lib/api'
import { formatBytes } from '@/lib/utils'
import { useFolderSummary } from '@/hooks/useFolderSummary'
import KamuiLoader from '@/components/ui/KamuiLoader'

function YoutubeAccountPanel({ settings, updateSetting, showError }) {
  const { youtubeConnected, youtubeMessage, refresh } = useBackendStatus()
  const [busy, setBusy] = useState(false)
  const [disconnectBusy, setDisconnectBusy] = useState(false)

  const reconnect = async () => {
    setBusy(true)
    try {
      await apiPost('/auth/youtube')
    } catch (e) {
      showError(e.message || String(e), 'YouTube')
    } finally {
      await refresh({ probe: true })
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setDisconnectBusy(true)
    try {
      await apiPost('/auth/youtube/disconnect')
    } catch (e) {
      showError(e.message || String(e), 'YouTube')
    } finally {
      await refresh({ probe: true })
      setDisconnectBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-kamui-gray/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Youtube className="text-red-500" size={24} />
          <div>
            <p className="font-medium text-kamui-white">API do YouTube</p>
            <p className="text-sm text-kamui-white-muted">
              {youtubeConnected ? 'Conta conectada' : youtubeMessage || 'Não conectado'}
            </p>
          </div>
        </div>
        <Badge variant={youtubeConnected ? 'success' : 'error'}>
          {youtubeConnected ? 'Conectado' : 'Desconectado'}
        </Badge>
      </div>

      <Button
        variant="primary"
        className="w-full"
        type="button"
        onClick={reconnect}
        disabled={busy || disconnectBusy}
        loading={busy}
      >
        Conectar ou renovar conta do YouTube (OAuth)
      </Button>

      <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={disconnect}
        disabled={busy || disconnectBusy}
        loading={disconnectBusy}
      >
        Desconectar conta (apagar sessão local)
      </Button>
      <p className="text-xs text-kamui-white-muted">
        Ao reconectar, o navegador deve pedir qual conta Google usar. Se continuar na conta antiga,
        use &quot;Desconectar&quot; e depois &quot;Conectar&quot;, ou abra o link do Google numa
        janela anónima.
      </p>

      <div className="space-y-2">
        <label className="font-medium text-kamui-white">Privacidade padrão</label>
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
        <label className="font-medium text-kamui-white">Tags padrão</label>
        <input
          type="text"
          value={settings.defaultTags}
          onChange={(e) => updateSetting('defaultTags', e.target.value)}
          placeholder="gaming, clips"
          className="w-full bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50"
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium text-kamui-white">Descrição padrão</label>
        <textarea
          value={settings.defaultDescription}
          onChange={(e) => updateSetting('defaultDescription', e.target.value)}
          rows={3}
          className="w-full bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white placeholder:text-kamui-white-muted focus:outline-none focus:border-kamui-red/50 resize-none"
        />
      </div>

      <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={() => window.open('https://studio.youtube.com/', '_blank', 'noopener,noreferrer')}
      >
        <ExternalLink size={16} />
        YouTube Studio
      </Button>
    </div>
  )
}

function StorageSection({ settings, updateSetting, showError }) {
  const { backendReachable } = useBackendStatus()
  const { data, error, loading, refresh } = useFolderSummary(backendReachable)

  const pickFolder = async () => {
    const p = await selectWatchFolderElectron()
    if (!p) return
    try {
      await apiPut('/setup/folder', { watch_folder: p })
      updateSetting('monitorPath', p)
      await refresh()
    } catch (e) {
      showError(e.message || String(e), 'Pasta monitorada')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="font-medium text-kamui-white">Pasta monitorada</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={settings.monitorPath}
            className="flex-1 bg-kamui-gray border border-white/10 rounded-lg px-4 py-2.5 text-sm text-kamui-white focus:outline-none"
          />
          <Button variant="outline" type="button" onClick={pickFolder}>
            <FolderOpen size={16} />
            Procurar
          </Button>
        </div>
        <p className="text-xs text-kamui-white-muted">
          Altere aqui ou no assistente de configuração. Salvar grava também as outras preferências.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <KamuiLoader size="sm" />
        </div>
      )}
      {error && <p className="text-sm text-amber-400">{error}</p>}
      {data && !loading && (
        <div className="p-4 bg-kamui-gray/50 rounded-lg space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-kamui-white-muted">Vídeos na pasta</span>
            <span className="text-kamui-white">{data.total_videos}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-kamui-white-muted">Tamanho dos clipes</span>
            <span className="text-kamui-white">{formatBytes(data.total_size_bytes || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-kamui-white-muted">Disco (volume)</span>
            <span className="text-kamui-white">
              {formatBytes(data.disk_used_bytes || 0)} / {formatBytes(data.disk_total_bytes || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-kamui-white-muted">Livre</span>
            <span className="text-kamui-white">{formatBytes(data.disk_free_bytes || 0)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function Settings() {
  const [saveBusy, setSaveBusy] = useState(false)
  const [loadBusy, setLoadBusy] = useState(true)
  const [settings, setSettings] = useState({
    autoUpload: true,
    deleteAfterUpload: false,
    generateThumbnail: true,
    defaultPrivacy: 'private',
    defaultTags: '',
    defaultDescription: '',
    monitorPath: '',
    maxFileSize: 2048,
    videoQuality: 'original',
  })

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const [notice, setNotice] = useState(null)
  const showError = useCallback((body, title = 'Erro') => {
    setNotice({ title, body })
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [prefs, setup] = await Promise.all([
          apiGet('/settings/preferences'),
          apiGet('/setup/status'),
        ])
        if (!alive) return
        setSettings((s) => ({
          ...s,
          autoUpload: prefs.auto_upload !== false,
          defaultPrivacy: prefs.default_privacy || 'private',
          deleteAfterUpload: !!prefs.delete_after_upload,
          generateThumbnail: prefs.generate_thumbnail !== false,
          videoQuality: prefs.video_quality || 'original',
          maxFileSize: Number(prefs.max_file_size_mb) || 2048,
          defaultTags: typeof prefs.default_tags === 'string' ? prefs.default_tags : '',
          defaultDescription: typeof prefs.default_description === 'string' ? prefs.default_description : '',
          monitorPath: setup.watch_folder || '',
        }))
      } catch (_) {
        /* mantém defaults */
      } finally {
        if (alive) setLoadBusy(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      type="button"
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

  const saveWatchFolderIfNeeded = async () => {
    const cur = settings.monitorPath?.trim()
    if (!cur) return
    try {
      const setup = await apiGet('/setup/status')
      if (setup.watch_folder === cur) return
      await apiPut('/setup/folder', { watch_folder: cur })
    } catch (e) {
      showError(e.message || String(e), 'Pasta')
    }
  }

  const saveToBackend = async () => {
    setSaveBusy(true)
    try {
      await saveWatchFolderIfNeeded()
      await apiPut('/settings/preferences', {
        preferences: {
          auto_upload: settings.autoUpload,
          default_privacy: settings.defaultPrivacy,
          delete_after_upload: settings.deleteAfterUpload,
          generate_thumbnail: settings.generateThumbnail,
          video_quality: settings.videoQuality,
          max_file_size_mb: settings.maxFileSize,
          default_tags: settings.defaultTags,
          default_description: settings.defaultDescription,
        },
      })
      await apiPost('/settings/reload')
    } catch (e) {
      showError(e.message || String(e))
    } finally {
      setSaveBusy(false)
    }
  }

  const sections = [
    {
      id: 'upload',
      title: 'Upload',
      icon: Upload,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Upload automático</p>
              <p className="text-sm text-kamui-white-muted">Enviar ao detetar novo ficheiro</p>
            </div>
            <ToggleSwitch
              enabled={settings.autoUpload}
              onChange={(v) => updateSetting('autoUpload', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Excluir após upload</p>
              <p className="text-sm text-kamui-white-muted">Ainda não aplicado no backend</p>
            </div>
            <ToggleSwitch
              enabled={settings.deleteAfterUpload}
              onChange={(v) => updateSetting('deleteAfterUpload', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-kamui-white">Gerar thumbnail</p>
              <p className="text-sm text-kamui-white-muted">Reservado para futuras versões</p>
            </div>
            <ToggleSwitch
              enabled={settings.generateThumbnail}
              onChange={(v) => updateSetting('generateThumbnail', v)}
            />
          </div>
          <div className="space-y-2">
            <label className="font-medium text-kamui-white">Qualidade do vídeo</label>
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
            <label className="font-medium text-kamui-white">Tamanho máximo (MB)</label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value, 10) || 0)}
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
      content: <YoutubeAccountPanel settings={settings} updateSetting={updateSetting} showError={showError} />,
    },
    {
      id: 'storage',
      title: 'Armazenamento',
      icon: Database,
      content: <StorageSection settings={settings} updateSetting={updateSetting} showError={showError} />,
    },
  ]

  const [activeSection, setActiveSection] = useState('upload')

  if (loadBusy) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <KamuiLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={notice != null}
        titleId="settings-notice-title"
        title={notice?.title ?? ''}
        confirmLabel="OK"
        cancelLabel={null}
        confirmVariant="primary"
        onClose={() => setNotice(null)}
        onConfirm={() => setNotice(null)}
      >
        <p className="text-kamui-white/90">{notice?.body}</p>
      </ConfirmModal>

      <div>
        <h1 className="text-2xl font-bold text-kamui-white flex items-center gap-3">
          <SettingsIcon size={28} className="text-kamui-red" />
          Configurações
        </h1>
        <p className="text-kamui-white-muted mt-1">Preferências do Kamui</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 p-2 h-fit">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
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

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {sections.find((s) => s.id === activeSection)?.icon &&
                React.createElement(sections.find((s) => s.id === activeSection).icon, {
                  size: 20,
                  className: 'text-kamui-red',
                })}
              {sections.find((s) => s.id === activeSection)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>{sections.find((s) => s.id === activeSection)?.content}</CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="primary" type="button" onClick={saveToBackend} disabled={saveBusy} loading={saveBusy}>
          <Check size={16} />
          Salvar alterações
        </Button>
      </div>
    </div>
  )
}

export default Settings
