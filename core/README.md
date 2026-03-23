# Kamui — backend Python (`core/backend`)

API HTTP local (FastAPI), monitor de pasta, SQLite em `KAMUI_USER_DATA`, integração YouTube (Data v3 + Analytics v2).

Fluxo OAuth, quotas e detalhes de produto: ver [YOUTUBE_IMPLEMENTATION.md](./YOUTUBE_IMPLEMENTATION.md) (documento separado).

## Requisitos

- Python 3.10+
- Dependências: em `core/`, `uv sync` ou `pip install -e .` (inclui `opencv-python-headless` para miniaturas JPEG dos vídeos locais via `GET /folder/video/thumbnail`)
- Google Cloud: YouTube Data API v3; para métricas por período, **YouTube Analytics API** ativada no mesmo projeto
- Ficheiros sensíveis (não commitar): `client_secrets.json` e `token.pickle` ficam em `KAMUI_USER_DATA/credentials/` quando usas a app; em dev sem Electron, dados em `core/.kamui-dev-data/`

## Executar

```bash
cd core
uv sync
uv run python -m backend
```

O processo imprime `KAMUI_PORT=<porta>` no stdout; a UI Electron lê esta linha. URL base típica: `http://127.0.0.1:<porta>`.

Documentação interativa: `GET /docs`, schema `GET /openapi.json`.

## Variáveis de ambiente

| Variável | Uso |
|----------|-----|
| `KAMUI_USER_DATA` | Diretório de dados (Electron); contém `kamui.db`, `credentials/`, `logs/` |
| `KAMUI_PORT` | Se definida (número), o servidor usa esta porta em vez de escolher uma livre |
| `KAMUI_WATCH_FOLDER` | CLI (`python -m backend.cli`): pasta por omissão se não passares `--folder` |
| `KAMUI_PYTHON` | Electron: caminho absoluto do interpretador Python (ex.: `.venv/Scripts/python.exe`) |

## API HTTP

| Método | Caminho | Resumo | Query / body | Notas |
|--------|---------|--------|--------------|--------|
| GET | `/health` | Liveness | — | |
| GET | `/setup/status` | Setup, pasta, YouTube | — | |
| PUT | `/setup/profile` | Nome | `{"display_name"}` | |
| PUT | `/setup/folder` | Pasta monitorada | `{"watch_folder"}` | Pasta deve existir |
| PUT | `/setup/client-secrets` | Credenciais Google | `{"raw_json"}` | JSON do OAuth desktop |
| POST | `/setup/finalize` | Concluir setup | — | Valida passos pendentes |
| POST | `/auth/youtube` | OAuth browser | — | Grava `token.pickle` |
| POST | `/auth/youtube/disconnect` | Desconectar conta YouTube | — | Remove `token.pickle` local para forçar novo login |
| GET | `/youtube/status` | Ligação YouTube | — | |
| GET | `/youtube/channel` | Dados do canal | — | Requer token válido |
| GET | `/youtube/videos` | Lista uploads | `max_results`, `page_token` | |
| GET | `/youtube/video` | Detalhe de um vídeo | `id` | Busca um vídeo específico pelo ID |
| POST | `/youtube/videos/delete` | Remove vídeos do canal | `{"ids": ["<youtubeVideoId>", ...]}` | Resposta: `deleted`, `errors[]` parciais; requer scope `youtube.force-ssl` |
| POST | `/youtube/videos/update` | Atualiza um vídeo | `{"id", "title"?, "description"?, "privacy"?, "tags"?}` | Pelo menos um campo opcional; `privacy`: public \| unlisted \| private |
| POST | `/youtube/videos/privacy` | Privacidade em massa | `{"ids": [...], "privacy"}` | Resposta: `updated`, `errors[]` |
| GET | `/youtube/analytics` | Métricas período | `start_date`, `end_date` (YYYY-MM-DD) | Requer scope Analytics + API ativada |
| POST | `/monitor/start` | Inicia monitor | — | |
| POST | `/monitor/stop` | Para monitor | — | |
| GET | `/monitor/status` | Estado monitor | — | |
| GET | `/settings/preferences` | Preferências JSON | — | |
| PUT | `/settings/preferences` | Gravar prefs | `{"preferences": {...}}` | Chaves usadas: `auto_upload`, `default_privacy`, `default_tags`, `default_description`, etc. |
| POST | `/settings/reload` | Reinicia monitor com prefs | — | |
| GET | `/folder/summary` | Stats pasta + disco | — | Requer pasta configurada |
| GET | `/folder/videos` | Lista vídeos locais | — | Metadados do ficheiro na pasta monitorada (sem campo `uploaded`) |
| GET | `/folder/video/thumbnail` | Miniatura JPEG | `path` (caminho absoluto URL-encoded) | Só ficheiros dentro da pasta monitorada |
| POST | `/folder/videos/delete` | Apaga ficheiros no disco | `{"paths": ["<abs>", ...]}` | Resposta: `deleted`, `errors[]` parciais; remoção **permanente** (`unlink`), sem reciclagem do SO |
| GET | `/events` | Timeline | `limit`, `offset`, `type`, `since`, `until` | |
| GET | `/events/stats` | Contagens por tipo | — | |
| DELETE | `/events` | Apaga todos os eventos | — | |
| GET | `/dashboard/summary` | Métricas dashboard | — | Inclui `local_clips` (quantidade de vídeos na pasta agora), `total_uploads`, série 7 dias + views (Analytics) |
| POST | `/uploads/manual` | Upload por caminho | `{"path"}` | Ficheiro dentro da pasta monitorada; após upload bem-sucedido o Kamui **remove o ficheiro local** automaticamente |

## OAuth / scopes

- Credencial tipo **aplicação para computador**.
- Scopes usados: `youtube.upload`, `youtube.readonly`, `youtube.force-ssl` (eliminar, atualizar privacidade e metadados via API), `yt-analytics.readonly`.
- Ao adicionar ou alterar scopes, é necessário **voltar a autorizar** em Configurações (novo `token.pickle`). Sem `youtube.force-ssl`, eliminar ou editar vídeos na UI pode falhar por permissão.

## Notas rápidas

- `GET /setup/status` e `GET /youtube/status` aceitam `probe=true` para invalidar cache e forçar nova verificação imediata.
- O backend inicializa o monitor automaticamente no arranque quando o setup já está completo.
- O token OAuth pode ser removido via `POST /auth/youtube/disconnect` para trocar de conta sem apagar o resto das configurações.

## CLI (dev)

```bash
cd core
python -m backend.cli --help
```

Pasta por omissão: diretório atual ou `KAMUI_WATCH_FOLDER`.
