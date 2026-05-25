from __future__ import annotations

import io
import hashlib
import json
import os
import sys
import urllib.request
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT_DIR / ".silero"
MODEL_PATH = MODEL_DIR / "v5_ru.pt"
MODEL_URL = "https://models.silero.ai/models/tts/ru/v5_ru.pt"
MODEL_SHA256 = "7ba04d42340fe0398042eed2e0d12d62e23096d626b1b9feff4dcb1309197ab4"
HOST = "127.0.0.1"
PORT = 8892
SAMPLE_RATE = 48000
MAX_REQUEST_BYTES = 8 * 1024
MAX_TEXT_CHARS = 600
LOCAL_ORIGINS = ("http://127.0.0.1:", "http://localhost:")
VOICES = [
    {"id": "baya", "label": "Baya"},
    {"id": "kseniya", "label": "Kseniya"},
    {"id": "xenia", "label": "Xenia"},
    {"id": "aidar", "label": "Aidar"},
    {"id": "eugene", "label": "Eugene"},
]


def safe_print(message: str, *, stream: Any = sys.stdout) -> None:
    try:
        print(message, file=stream, flush=True)
    except (BrokenPipeError, OSError):
        pass


class SileroRuntime:
    def __init__(self) -> None:
        self._torch: Any | None = None
        self._model: Any | None = None

    def load(self) -> None:
        if self._model is not None:
            return

        try:
            import torch
        except ImportError as error:
            raise RuntimeError(
                "Python package 'torch' is not installed. Install it before starting Silero TTS."
            ) from error

        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        ensure_model_file()

        torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
        package = torch.package.PackageImporter(str(MODEL_PATH))
        model = package.load_pickle("tts_models", "model")
        model.to(torch.device("cpu"))

        self._torch = torch
        self._model = model
        safe_print("Silero Russian TTS is ready")

    def synthesize(self, text: str, speaker: str) -> bytes:
        self.load()
        if self._model is None or self._torch is None:
            raise RuntimeError("Silero model is not loaded")

        audio = self._model.apply_tts(
            text=text,
            speaker=speaker,
            sample_rate=SAMPLE_RATE,
            put_accent=True,
            put_yo=True,
        )
        return tensor_to_wav(audio, self._torch)


runtime = SileroRuntime()


class RequestError(ValueError):
    def __init__(self, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.status = status


def ensure_model_file() -> None:
    if MODEL_PATH.exists() and verify_file_sha256(MODEL_PATH, MODEL_SHA256):
        return

    if MODEL_PATH.exists():
        safe_print("Existing Silero model checksum mismatch; downloading a fresh copy.")
        MODEL_PATH.unlink()

    safe_print(f"Downloading Silero model to {MODEL_PATH}")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)

    if not verify_file_sha256(MODEL_PATH, MODEL_SHA256):
        MODEL_PATH.unlink(missing_ok=True)
        raise RuntimeError("Downloaded Silero model checksum mismatch.")


def verify_file_sha256(path: Path, expected_hash: str) -> bool:
    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest().lower() == expected_hash.lower()


def tensor_to_wav(audio: Any, torch: Any) -> bytes:
    clipped = torch.clamp(audio.detach().cpu(), -1.0, 1.0)
    pcm = (clipped * 32767).to(torch.int16).numpy().tobytes()

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(pcm)

    return buffer.getvalue()


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/v1/health":
            self.write_json({"ok": True, "engine": "silero", "voices": VOICES})
            return

        if self.path == "/v1/voices":
            self.write_json({"voices": VOICES})
            return

        self.write_json({"error": "Not found"}, status=404)

    def do_POST(self) -> None:
        if self.path != "/v1/synthesize":
            self.write_json({"error": "Not found"}, status=404)
            return

        try:
            payload = self.read_json()
            text = str(payload.get("text", "")).strip()
            voice = str(payload.get("voice", VOICES[0]["id"]))

            if not text:
                self.write_json({"error": "Text is required"}, status=400)
                return

            if len(text) > MAX_TEXT_CHARS:
                self.write_json(
                    {"error": f"Text is too long. Limit: {MAX_TEXT_CHARS} characters."},
                    status=400,
                )
                return

            if voice not in {item["id"] for item in VOICES}:
                self.write_json({"error": f"Unknown voice: {voice}"}, status=400)
                return

            audio = runtime.synthesize(text, voice)
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(audio)))
            self.end_headers()
            self.wfile.write(audio)
        except RequestError as error:
            self.write_json({"error": str(error)}, status=error.status)
        except Exception as error:
            self.write_json({"error": str(error)}, status=500)

    def read_json(self) -> dict[str, Any]:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise RequestError("Invalid Content-Length header.") from error

        if length > MAX_REQUEST_BYTES:
            self.close_connection = True
            raise RequestError(
                f"Request body is too large. Limit: {MAX_REQUEST_BYTES} bytes.",
                status=413,
            )

        data = self.rfile.read(length)
        if not data:
            return {}

        try:
            return json.loads(data.decode("utf-8"))
        except json.JSONDecodeError as error:
            raise RequestError("Request body must be valid JSON.") from error

    def write_json(self, payload: dict[str, Any], status: int = 200) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_cors_headers(self) -> None:
        origin = self.headers.get("Origin", "")
        allow_origin = origin if origin.startswith(LOCAL_ORIGINS) else "http://127.0.0.1:5173"

        self.send_header("Access-Control-Allow-Origin", allow_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args: Any) -> None:
        safe_print(f"{self.address_string()} - {format % args}")


def main() -> None:
    try:
        runtime.load()
    except Exception as error:
        safe_print(f"Silero startup warning: {error}", stream=sys.stderr)
        safe_print("The server will still start and report the error on synthesize.")

    server = ThreadingHTTPServer((HOST, PORT), Handler)
    safe_print(f"Silero TTS server listening at http://{HOST}:{PORT}/v1")
    server.serve_forever()


if __name__ == "__main__":
    main()
