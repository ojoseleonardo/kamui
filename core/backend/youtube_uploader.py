"""
Uploader para YouTube — API Data v3, OAuth2.
"""

import json
import pickle
from pathlib import Path
from typing import Optional, Dict, List, Callable

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

from .logger_config import LoggerConfig

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]


def perform_youtube_oauth(credentials_file: Path, token_file: Path) -> tuple:
    """Abre o browser para OAuth; grava token.pickle. Usado pelo servidor/API."""
    logger = LoggerConfig.get_logger(__name__)
    if not credentials_file.exists():
        return False, "Arquivo client_secrets.json não encontrado."
    try:
        flow = InstalledAppFlow.from_client_secrets_file(str(credentials_file), SCOPES)
        creds = flow.run_local_server(port=0)
        token_file.parent.mkdir(parents=True, exist_ok=True)
        with open(token_file, "wb") as token:
            pickle.dump(creds, token)
        logger.info("OAuth do YouTube concluído; token salvo.")
        return True, ""
    except Exception as e:
        logger.error(f"OAuth YouTube falhou: {e}")
        return False, str(e)


class YouTubeUploader:
    """Gerenciador de uploads para YouTube usando API Data v3."""

    def __init__(
        self,
        credentials_file: str,
        token_file: str,
        defer_interactive: bool = False,
    ):
        self.credentials_file = Path(credentials_file)
        self.token_file = Path(token_file)
        self.defer_interactive = defer_interactive
        self.logger = LoggerConfig.get_logger(__name__)
        self.youtube_service = None
        self.google_credentials = None
        self._authenticate()

    def _authenticate(self):
        creds = None

        if self.token_file.exists():
            try:
                with open(self.token_file, "rb") as token:
                    creds = pickle.load(token)
                self.logger.info("Token de autenticação carregado")
            except Exception as e:
                self.logger.warning(f"Erro ao carregar token: {str(e)}")

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                    self.logger.info("Token de autenticação renovado")
                except Exception as e:
                    self.logger.error(f"Erro ao renovar token: {str(e)}")
                    creds = None

            if not creds:
                if not self.credentials_file.exists():
                    self.logger.error(
                        f"Arquivo de credenciais não encontrado: {self.credentials_file}"
                    )
                    return

                if self.defer_interactive:
                    self.logger.warning(
                        "Sem token válido no modo não interativo — inicie o OAuth em Configurações."
                    )
                    return

                try:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        str(self.credentials_file), SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                    self.logger.info("Autenticação OAuth2 concluída")
                except Exception as e:
                    self.logger.error(f"Erro na autenticação OAuth2: {str(e)}")
                    return

            try:
                with open(self.token_file, "wb") as token:
                    pickle.dump(creds, token)
                self.logger.info("Token de autenticação salvo")
            except Exception as e:
                self.logger.warning(f"Erro ao salvar token: {str(e)}")

        try:
            self.google_credentials = creds
            self.youtube_service = build("youtube", "v3", credentials=creds)
            self.logger.info("Serviço do YouTube inicializado com sucesso")
        except Exception as e:
            self.google_credentials = None
            self.logger.error(f"Erro ao inicializar serviço do YouTube: {str(e)}")

    def verify_connection(self) -> tuple:
        """Valida API com channels.list (requer token com readonly)."""
        if not self.youtube_service:
            return False, "YouTube não está autenticado."
        try:
            self.youtube_service.channels().list(part="snippet", mine=True, maxResults=1).execute()
            return True, ""
        except Exception as e:
            return False, str(e)

    def _generate_title(self, file_path: str) -> str:
        file_name = Path(file_path).stem
        title = file_name.replace("_", " ").replace("-", " ")
        title = " ".join(word.capitalize() for word in title.split())
        return title

    def _generate_description(self, file_path: str, metadata: Optional[Dict] = None) -> str:
        file_name = Path(file_path).name
        description = f"Vídeo: {file_name}\n\n"

        if metadata:
            if "size_mb" in metadata:
                description += f"Tamanho: {metadata['size_mb']} MB\n"
            if "created" in metadata:
                description += f"Data de criação: {metadata['created']}\n"

        description += "\nUpload automático via Kamui"
        return description

    def _generate_tags(self, file_path: str, metadata: Optional[Dict] = None) -> List[str]:
        tags = []
        file_name = Path(file_path).stem.lower()

        words = file_name.replace("_", " ").replace("-", " ").split()
        tags.extend([w for w in words if len(w) > 2][:5])

        tags.extend(["kamui", "upload automático"])

        extension = Path(file_path).suffix.lower()
        if extension:
            tags.append(extension[1:])

        return tags[:10]

    @staticmethod
    def _youtube_error_reasons(exc: BaseException) -> List[str]:
        if not isinstance(exc, HttpError) or not exc.content:
            return []
        try:
            payload = json.loads(exc.content.decode("utf-8", errors="replace"))
            errs = payload.get("error", {}).get("errors") or []
            return [str(item.get("reason", "")) for item in errs if isinstance(item, dict)]
        except (json.JSONDecodeError, TypeError, AttributeError):
            return []

    def upload_video(
        self,
        file_path: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        privacy_status: str = "private",
        progress_callback: Optional[Callable[[float], None]] = None,
        metadata: Optional[Dict] = None,
    ) -> Optional[str]:
        if not self.youtube_service:
            self.logger.error("Serviço do YouTube não está disponível.")
            return None

        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            self.logger.error(f"Arquivo não encontrado: {file_path}")
            return None

        if not title:
            title = self._generate_title(file_path)
        if not description:
            description = self._generate_description(file_path, metadata)
        if not tags:
            tags = self._generate_tags(file_path, metadata)

        if privacy_status not in ["public", "unlisted", "private"]:
            self.logger.warning(f"Status de privacidade inválido: {privacy_status}. Usando 'private'")
            privacy_status = "private"

        try:
            self.logger.info(f"Iniciando upload: {file_path}")

            body = {
                "snippet": {
                    "title": title,
                    "description": description,
                    "tags": tags,
                    "categoryId": "22",
                },
                "status": {"privacyStatus": privacy_status},
            }

            media = MediaFileUpload(
                str(file_path_obj),
                chunksize=-1,
                resumable=True,
                mimetype="video/*",
            )

            insert_request = self.youtube_service.videos().insert(
                part=",".join(body.keys()),
                body=body,
                media_body=media,
            )

            response = None
            retry_count = 0
            max_retries = 3

            while response is None:
                try:
                    status, response = insert_request.next_chunk()
                    if status:
                        progress = status.progress() * 100
                        self.logger.info(f"Progresso do upload: {progress:.2f}%")
                        if progress_callback:
                            progress_callback(progress)
                except Exception as e:
                    reasons = self._youtube_error_reasons(e)
                    if "uploadLimitExceeded" in reasons or "quotaExceeded" in reasons:
                        self.logger.error(
                            "YouTube recusou o upload (limite ou quota). Não será repetido: %s",
                            e,
                        )
                        return None
                    retry_count += 1
                    if retry_count > max_retries:
                        self.logger.error(f"Erro no upload após {max_retries} tentativas: {e}")
                        return None
                    self.logger.warning(f"Erro no upload (tentativa {retry_count}/{max_retries}): {e}")
                    continue

            if "id" in response:
                youtube_video_id = response["id"]
                self.logger.info(f"Upload concluído! ID: {youtube_video_id}")
                if progress_callback:
                    progress_callback(100.0)
                return youtube_video_id

            self.logger.error(f"Upload sem ID de vídeo: {response}")
            return None

        except Exception as e:
            self.logger.error(f"Erro durante upload: {str(e)}")
            return None

    def get_video_info(self, youtube_video_id: str) -> Optional[Dict]:
        if not self.youtube_service:
            return None

        try:
            request = self.youtube_service.videos().list(
                part="snippet,status,statistics", id=youtube_video_id
            )
            response = request.execute()

            if response["items"]:
                return response["items"][0]
            return None

        except Exception as e:
            self.logger.error(f"Erro ao obter informações do vídeo: {str(e)}")
            return None
