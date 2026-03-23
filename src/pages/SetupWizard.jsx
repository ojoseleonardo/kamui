import React, { useState } from 'react'
import { FolderOpen, KeyRound, User, Youtube } from 'lucide-react'
import { Button } from '@/components/ui'
import WindowControls from '@/components/layout/WindowControls'
import {
  apiGet,
  apiPost,
  apiPut,
  selectWatchFolderElectron,
} from '@/lib/api'
import { useBackendStatus } from '@/context/BackendStatusContext'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, title: 'Seu nome', icon: User },
  { id: 2, title: 'Pasta de clipes', icon: FolderOpen },
  { id: 3, title: 'Credenciais Google', icon: KeyRound },
  { id: 4, title: 'YouTube', icon: Youtube },
]

function SetupWizard({ onComplete }) {
  const { refresh: refreshYoutubeStatus } = useBackendStatus()
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState('')
  const [watchFolder, setWatchFolder] = useState('')
  const [clientSecretsText, setClientSecretsText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const pickFolder = async () => {
    setErr('')
    const p = await selectWatchFolderElectron()
    if (p) setWatchFolder(p)
  }

  const saveProfile = async () => {
    setErr('')
    if (!displayName.trim()) {
      setErr('Informe seu nome.')
      return
    }
    setBusy(true)
    try {
      await apiPut('/setup/profile', { display_name: displayName.trim() })
      setStep(2)
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const saveFolder = async () => {
    setErr('')
    if (!watchFolder.trim()) {
      setErr('Escolha uma pasta.')
      return
    }
    setBusy(true)
    try {
      await apiPut('/setup/folder', { watch_folder: watchFolder.trim() })
      setStep(3)
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const saveSecrets = async () => {
    setErr('')
    if (!clientSecretsText.trim()) {
      setErr('Cole o conteúdo do client_secrets.json.')
      return
    }
    setBusy(true)
    try {
      JSON.parse(clientSecretsText)
      await apiPut('/setup/client-secrets', { raw_json: clientSecretsText })
      setStep(4)
    } catch (e) {
      if (e instanceof SyntaxError) setErr('JSON inválido.')
      else setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const runYoutubeOAuth = async () => {
    setErr('')
    setBusy(true)
    try {
      await apiPost('/auth/youtube')
      await refreshYoutubeStatus({ probe: true })
      const st = await apiGet('/setup/status', { probe: true })
      if (!st.youtube_connected) {
        setErr('OAuth concluído, mas a API não respondeu. Tente de novo.')
        return
      }
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      await refreshYoutubeStatus({ probe: true })
      setBusy(false)
    }
  }

  const finalize = async () => {
    setErr('')
    setBusy(true)
    try {
      await apiPost('/setup/finalize')
      await refreshYoutubeStatus({ probe: true })
      onComplete()
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-kamui-black text-kamui-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-kamui-darker/80 px-4 drag-region">
        <div className="no-drag">
          <h1 className="font-display text-lg font-bold tracking-wider gradient-text">
            KAMUI
          </h1>
          <p className="text-[10px] text-kamui-white-muted">Configuração inicial</p>
        </div>
        <WindowControls />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 overflow-auto p-8">
        <div className="flex justify-between gap-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center text-[10px] sm:text-xs',
                step === s.id
                  ? 'border-kamui-red/50 bg-kamui-red/10'
                  : 'border-white/10 text-kamui-white-muted',
              )}
            >
              <s.icon size={18} className="shrink-0" />
              <span className="leading-tight">{s.title}</span>
            </div>
          ))}
        </div>

        {err && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-kamui-white-muted">
              Como você quer ser chamado no app?
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-kamui-white outline-none focus:border-kamui-red/50"
            />
            <Button variant="primary" onClick={saveProfile} disabled={busy} className="w-full">
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-kamui-white-muted">
              Pasta onde os clipes ficam salvos (monitoramento em tempo real).
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={watchFolder}
                placeholder="Nenhuma pasta selecionada"
                className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-kamui-white"
              />
              <Button type="button" variant="outline" onClick={pickFolder} disabled={busy}>
                Buscar
              </Button>
            </div>
            <Button variant="primary" onClick={saveFolder} disabled={busy} className="w-full">
              Continuar
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-kamui-white-muted">
              Cole o JSON completo do arquivo <code className="text-kamui-red">client_secrets.json</code> do
              Google Cloud Console (tipo app para computador).
            </p>
            <textarea
              value={clientSecretsText}
              onChange={(e) => setClientSecretsText(e.target.value)}
              rows={12}
              placeholder='{ "installed": { ... } }'
              className="w-full resize-y rounded-lg border border-white/10 bg-white/5 p-4 font-mono text-xs text-kamui-white outline-none focus:border-kamui-red/50"
            />
            <Button variant="primary" onClick={saveSecrets} disabled={busy} className="w-full">
              Continuar
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-kamui-white-muted">
              Conecte a conta do YouTube: o navegador vai abrir para você autorizar o Kamui. Depois confirme
              aqui para concluir.
            </p>
            <Button type="button" variant="outline" onClick={runYoutubeOAuth} disabled={busy} className="w-full">
              Abrir login YouTube (OAuth)
            </Button>
            <Button variant="primary" onClick={finalize} disabled={busy} className="w-full">
              Concluir configuração
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SetupWizard
