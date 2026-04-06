"""
config.py – Centralised settings loaded from environment / .env file.
"""
from __future__ import annotations

import os
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Server ────────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"
    cors_origins: str = "https://4citeb4u.github.io"

    # ── Modes ─────────────────────────────────────────────────────────────────
    offline_mode: bool = False

    # ── Gemini ────────────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"

    # ── STT ───────────────────────────────────────────────────────────────────
    whisper_model: str = "base.en"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"

    # ── Local LLM ─────────────────────────────────────────────────────────────
    llama_model_path: str = "./models/llama-3.2-1b-instruct.Q4_K_M.gguf"
    llama_max_tokens: int = 256
    llama_context_size: int = 2048
    llama_threads: int = 4

    # ── TTS ───────────────────────────────────────────────────────────────────
    piper_executable: str = "piper"
    piper_model_path: str = "./piper_models/en_US-lessac-medium.onnx"
    tts_sample_rate: int = 22050

    # ── VAD ───────────────────────────────────────────────────────────────────
    vad_threshold: float = 0.5
    vad_sample_rate: int = 16000
    vad_window_size_samples: int = 1536
    vad_silence_duration: float = 0.8

    # ── Router ────────────────────────────────────────────────────────────────
    router_gemini_threshold: float = 0.6

    # ── Memory ────────────────────────────────────────────────────────────────
    memory_db_path: str = "./data/memory.db"
    memory_max_context_tokens: int = 512

    @field_validator("cors_origins")
    @classmethod
    def parse_cors(cls, v: str) -> str:
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_gemini_available(self) -> bool:
        return bool(self.gemini_api_key) and not self.offline_mode

    def ensure_data_dir(self) -> None:
        Path(self.memory_db_path).parent.mkdir(parents=True, exist_ok=True)


settings = Settings()
