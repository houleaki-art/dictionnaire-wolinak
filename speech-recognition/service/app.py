import asyncio
import json
import os
import tempfile
import threading
from pathlib import Path

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from resolver import resolve_transcript


MODEL_DIRECTORY = Path(os.environ.get("ALN_ASR_MODEL_DIR", "../models/aln8ba-mms")).resolve()
LEXICON_PATH = Path(os.environ.get("ALN_ASR_LEXICON", "../build/approved-lexicon.json")).resolve()
MODEL_VERSION = os.environ.get("ALN_ASR_MODEL_VERSION", "untrained")
MAX_AUDIO_BYTES = int(os.environ.get("ALN_ASR_MAX_AUDIO_BYTES", str(5 * 1024 * 1024)))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "ALN_ASR_ALLOWED_ORIGINS",
        "https://houleaki-art.github.io,http://127.0.0.1:8765,http://localhost:8765",
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="Reconnaissance vocale aln8ba",
    description="Transcription expérimentale avec un adaptateur abe entraîné et un lexique vert fermé.",
    version=MODEL_VERSION,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Aln8ba-Voice-Consent"],
)


class RecognitionEngine:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._processor = None
        self._model = None
        self._torch = None
        self._torchaudio = None
        self._lexicon = None

    def paths_ready(self) -> bool:
        return MODEL_DIRECTORY.is_dir() and LEXICON_PATH.is_file()

    def _load(self) -> None:
        if self._model is not None:
            return
        if not self.paths_ready():
            raise RuntimeError("Modèle aln8ba ou lexique approuvé absent.")
        import torch
        import torchaudio
        from transformers import AutoProcessor, Wav2Vec2ForCTC

        self._lexicon = json.loads(LEXICON_PATH.read_text(encoding="utf-8"))
        self._processor = AutoProcessor.from_pretrained(MODEL_DIRECTORY, local_files_only=True)
        self._model = Wav2Vec2ForCTC.from_pretrained(MODEL_DIRECTORY, local_files_only=True)
        self._model.eval()
        self._torch = torch
        self._torchaudio = torchaudio

    def transcribe(self, audio_bytes: bytes, suffix: str) -> dict:
        with self._lock:
            self._load()
            temporary_path = None
            try:
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temporary:
                    temporary.write(audio_bytes)
                    temporary_path = Path(temporary.name)
                waveform, sample_rate = self._torchaudio.load(str(temporary_path))
                if waveform.numel() == 0:
                    raise ValueError("Enregistrement vide.")
                waveform = waveform.mean(dim=0, keepdim=True)
                if sample_rate != 16000:
                    waveform = self._torchaudio.functional.resample(waveform, sample_rate, 16000)
                    sample_rate = 16000
                duration = waveform.shape[-1] / sample_rate
                if duration < 0.25 or duration > 15:
                    raise ValueError("La durée doit être comprise entre 0,25 et 15 secondes.")
                values = waveform.squeeze(0).numpy()
                inputs = self._processor(values, sampling_rate=sample_rate, return_tensors="pt")
                with self._torch.inference_mode():
                    logits = self._model(**inputs).logits
                predicted_ids = self._torch.argmax(logits, dim=-1)
                raw = self._processor.batch_decode(predicted_ids)[0]
                resolution = resolve_transcript(raw, self._lexicon)
                return {
                    "model_version": MODEL_VERSION,
                    "raw_transcript": raw,
                    "resolution": resolution,
                    "notice": "Résultat expérimental; aucune validation linguistique officielle.",
                }
            finally:
                if temporary_path:
                    temporary_path.unlink(missing_ok=True)


engine = RecognitionEngine()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ready" if engine.paths_ready() else "model-missing",
        "model_version": MODEL_VERSION,
        "audio_saved": False,
        "language": "abe",
    }


@app.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    voice_consent: str | None = Header(default=None, alias="X-Aln8ba-Voice-Consent"),
) -> dict:
    if voice_consent != "one-shot":
        raise HTTPException(428, "Un consentement immédiat one-shot est requis pour cet envoi vocal.")
    if not engine.paths_ready():
        raise HTTPException(503, "Le modèle aln8ba validé n’est pas encore installé.")
    content_type = (audio.content_type or "").lower()
    suffixes = {
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/webm": ".webm",
        "audio/mp4": ".m4a",
        "audio/mpeg": ".mp3",
    }
    if content_type not in suffixes:
        raise HTTPException(415, "Format audio non pris en charge.")
    payload = await audio.read(MAX_AUDIO_BYTES + 1)
    await audio.close()
    if len(payload) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "Enregistrement trop volumineux.")
    try:
        return await asyncio.to_thread(engine.transcribe, payload, suffixes[content_type])
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    except RuntimeError as error:
        raise HTTPException(503, str(error)) from error

