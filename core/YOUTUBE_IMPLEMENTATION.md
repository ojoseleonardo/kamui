# Implementação do Upload para YouTube

Este documento descreve em detalhes como funciona a implementação do sistema de upload automático para YouTube no projeto Kamui.

## Visão Geral

A implementação utiliza a **API do YouTube Data v3** para upload e leitura de canal/vídeos. Para métricas por período (views, tempo de exibição) o backend usa também a **YouTube Analytics API** (`yt-analytics.readonly`) — ative a API no Google Cloud e faça **novo OAuth** quando os scopes mudarem.

O sistema é composto por três componentes principais:

1. **YouTubeUploader** (`youtube_uploader.py`) - Classe responsável pela comunicação com a API do YouTube
2. **VideoManager** (`video_manager.py`) - Gerenciador que integra monitoramento e upload
3. **Main** (`main.py`) - Interface CLI para execução e controle

## Arquitetura

### Componentes Principais

```
┌─────────────────┐
│   FileMonitor   │  Monitora pasta de vídeos
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  VideoManager   │  Gerencia uploads e monitoramento
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ YouTubeUploader │  Faz upload via API do YouTube
└─────────────────┘
```

### Classe YouTubeUploader

A classe `YouTubeUploader` é o núcleo da implementação. Ela encapsula toda a lógica de comunicação com a API do YouTube.

#### Inicialização

```python
uploader = YouTubeUploader(
    credentials_file="client_secrets.json",  # Arquivo OAuth2
    token_file="token.pickle"                 # Cache de token
)
```

Durante a inicialização:
1. Carrega token de autenticação existente (se houver)
2. Verifica se o token está válido
3. Renova token expirado (se possível)
4. Solicita nova autenticação OAuth2 (se necessário)
5. Inicializa o serviço do YouTube

#### Autenticação OAuth2

O processo de autenticação segue este fluxo:

1. **Carregamento de Token Existente**
   - Verifica se existe `token.pickle`
   - Tenta carregar credenciais salvas
   - Se válido, usa diretamente

2. **Renovação de Token**
   - Se o token expirou mas há `refresh_token`
   - Faz requisição para renovar automaticamente
   - Salva novo token

3. **Nova Autenticação**
   - Se não há token válido
   - Verifica existência de `client_secrets.json`
   - Abre navegador para autorização OAuth2
   - Usa `run_local_server(port=0)` para receber callback
   - Salva token para próximas execuções

**Escopos Utilizados:**
- `https://www.googleapis.com/auth/youtube.upload` - Permite upload de vídeos

## Processo de Upload

### Método `upload_video()`

O método principal de upload aceita os seguintes parâmetros:

```python
youtube_id = uploader.upload_video(
    file_path="videos/video.mp4",           # Caminho do arquivo
    title="Meu Vídeo",                      # Opcional (gerado automaticamente)
    description="Descrição",                # Opcional (gerada automaticamente)
    tags=["tag1", "tag2"],                 # Opcional (geradas automaticamente)
    privacy_status="private",              # 'public', 'unlisted' ou 'private'
    progress_callback=lambda p: print(p),  # Callback de progresso (0-100)
    metadata={"size_mb": 125.5}            # Metadados adicionais
)
```

### Fluxo de Upload

1. **Validações Iniciais**
   - Verifica se o serviço do YouTube está disponível
   - Confirma existência do arquivo
   - Valida status de privacidade

2. **Geração de Metadados**
   - Se não fornecidos, gera automaticamente:
     - **Título**: Baseado no nome do arquivo (remove underscores/hífens, capitaliza)
     - **Descrição**: Inclui nome do arquivo, tamanho, data de criação
     - **Tags**: Extrai palavras do nome do arquivo + tags padrão

3. **Preparação do Upload**
   - Cria objeto de metadados (`body`) com:
     - `snippet`: título, descrição, tags, categoria
     - `status`: privacidade
   - Cria objeto de mídia (`MediaFileUpload`) com:
     - `chunksize=-1`: upload em chunks automáticos
     - `resumable=True`: permite retomar upload interrompido
     - `mimetype='video/*'`: tipo de mídia

4. **Execução do Upload**
   - Inicia requisição resumable
   - Processa em chunks com monitoramento de progresso
   - Atualiza callback de progresso (0-100%)
   - Implementa retry automático (até 3 tentativas)

5. **Tratamento de Resposta**
   - Se bem-sucedido: retorna `youtube_video_id`
   - Se falhar: retorna `None` e registra erro

### Geração Automática de Metadados

#### Título (`_generate_title()`)

```python
# Exemplo: "meu_video_incrivel.mp4"
# Resultado: "Meu Video Incrivel"

file_name = Path(file_path).stem
title = file_name.replace('_', ' ').replace('-', ' ')
title = ' '.join(word.capitalize() for word in title.split())
```

#### Descrição (`_generate_description()`)

```python
# Inclui:
# - Nome do arquivo
# - Tamanho (se disponível em metadata)
# - Data de criação (se disponível)
# - Mensagem padrão "Upload automático via Kamui"
```

#### Tags (`_generate_tags()`)

```python
# Extrai palavras do nome do arquivo (mínimo 3 caracteres)
# Adiciona tags padrão: ['kamui', 'upload automático']
# Adiciona extensão do arquivo como tag
# Limita a 10 tags (YouTube permite até 500 caracteres)
```

## Monitoramento de Progresso

O sistema suporta callback de progresso em tempo real:

```python
def progress_callback(progress: float):
    print(f"Upload: {progress:.2f}%")

uploader.upload_video(
    file_path="video.mp4",
    progress_callback=progress_callback
)
```

O progresso é calculado pela API do YouTube e atualizado durante o upload resumable.

## Tratamento de Erros e Retry

### Sistema de Retry

O upload implementa retry automático:

```python
retry_count = 0
max_retries = 3

while response is None:
    try:
        status, response = insert_request.next_chunk()
        # ... processa progresso
    except Exception as e:
        retry_count += 1
        if retry_count > max_retries:
            # Falha após 3 tentativas
            return None
        # Tenta novamente
        continue
```

### Logging de Erros

Todos os erros são registrados usando o sistema de logging:

- **Erros de autenticação**: Logged como ERROR
- **Erros de upload**: Logged como ERROR com detalhes
- **Avisos**: Logged como WARNING (ex: token expirado)
- **Informações**: Logged como INFO (progresso, sucesso)

## Integração com VideoManager

O `VideoManager` integra o `YouTubeUploader` com o sistema de monitoramento:

### Upload Automático

Quando `auto_upload=True`:

1. **Detecção de Novo Vídeo**
   - `FileMonitor` detecta novo arquivo
   - Chama callback `_on_video_detected()`

2. **Enfileiramento**
   - `_queue_upload()` verifica se vídeo já foi enviado
   - Cria thread separada para upload

3. **Execução**
   - `_upload_video()` executa em thread separada
   - Não bloqueia monitoramento
   - Registra progresso e resultado

### Upload Manual

```python
youtube_id = manager.upload_video_manually(
    file_path="video.mp4",
    title="Título Personalizado",
    privacy_status="public"
)
```

### Rastreamento de Uploads

O sistema mantém um conjunto (`set`) de vídeos já enviados:

```python
self.uploaded_videos = set()  # Evita uploads duplicados
```

## Obtenção de Informações do Vídeo

### Método `get_video_info()`

Após o upload, é possível obter informações do vídeo:

```python
info = uploader.get_video_info(youtube_video_id)
# Retorna:
# {
#   'id': 'abc123',
#   'snippet': { ... },
#   'status': { ... },
#   'statistics': { ... }
# }
```

## Configuração e Requisitos

### Arquivos Necessários

1. **`client_secrets.json`**
   - Credenciais OAuth2 do Google Cloud Console
   - Tipo: "Aplicativo desktop"
   - Deve estar na pasta `core/`

2. **`token.pickle`** (gerado automaticamente)
   - Cache de token de autenticação
   - Criado após primeira autenticação
   - Renovado automaticamente quando expira

### Dependências

```python
googleapiclient.discovery      # Cliente da API do YouTube
google_auth_oauthlib.flow      # Fluxo OAuth2
google.auth.transport.requests # Requisições de autenticação
google.oauth2.credentials      # Credenciais OAuth2
```

### Status de Privacidade

- **`private`**: Apenas você pode ver (padrão)
- **`unlisted`**: Qualquer um com o link pode ver
- **`public`**: Visível publicamente

## Exemplo de Uso Completo

### Via CLI

```bash
# Upload manual
python main.py upload --path "videos/video.mp4" --privacy public

# Monitoramento com upload automático
python main.py watch --auto-upload --privacy private
```

### Via Código

```python
from youtube_uploader import YouTubeUploader

# Inicializar
uploader = YouTubeUploader()

# Upload com callback de progresso
def on_progress(progress):
    print(f"Progresso: {progress:.1f}%")

youtube_id = uploader.upload_video(
    file_path="videos/video.mp4",
    privacy_status="public",
    progress_callback=on_progress
)

if youtube_id:
    print(f"Upload concluído! ID: {youtube_id}")
    print(f"URL: https://www.youtube.com/watch?v={youtube_id}")
```

## Limitações e Considerações

1. **Tamanho de Arquivo**
   - YouTube aceita até 256GB por vídeo
   - Uploads grandes podem levar muito tempo

2. **Quota da API**
   - YouTube Data API v3 tem limites de quota
   - Uploads consomem unidades de quota

3. **Formato de Vídeo**
   - YouTube aceita vários formatos
   - Recomendado: MP4 (H.264 + AAC)

4. **Rede**
   - Uploads requerem conexão estável
   - Upload resumable permite retomar após interrupção

5. **Autenticação**
   - Primeira execução requer autorização manual no navegador
   - Token é salvo para próximas execuções
   - Token pode expirar após período de inatividade

## Logs e Debugging

O sistema registra todas as operações:

```
[INFO] Token de autenticação carregado
[INFO] Serviço do YouTube inicializado com sucesso
[INFO] Iniciando upload: videos/video.mp4
[INFO] Título: Meu Video
[INFO] Privacidade: private
[INFO] Progresso do upload: 25.50%
[INFO] Progresso do upload: 50.00%
[INFO] Progresso do upload: 75.25%
[INFO] Upload concluído com sucesso! ID do vídeo: abc123xyz
```

Logs são salvos em `logs/kamui_YYYYMMDD.log` e exibidos no console.

## Melhorias Futuras

Possíveis melhorias para a implementação:

1. **Fila de Uploads**: Processar múltiplos uploads sequencialmente
2. **Thumbnails**: Upload automático de thumbnails personalizados
3. **Playlists**: Adicionar vídeos automaticamente a playlists
4. **Notificações**: Notificar quando upload concluir
5. **Estatísticas**: Rastrear estatísticas de uploads (tempo, taxa de sucesso)
6. **Configuração Avançada**: Permitir configuração de categoria, idioma, etc.
