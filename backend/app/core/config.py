"""Environment-driven configuration for Proxmox mode and automation."""

import json
from functools import lru_cache
from typing import Literal, Union

from pydantic import field_validator
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment. Singleton via get_settings()."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROXMOX_MODE: Literal["mock", "real", "hybrid"] = "mock"
    PROXMOX_HOST: str = ""
    PROXMOX_USER: str = ""
    PROXMOX_PASSWORD: str = ""
    PROXMOX_TOKEN_NAME: str = ""
    PROXMOX_TOKEN_VALUE: str = ""
    PROXMOX_VERIFY_SSL: bool = True
    PROXMOX_HYBRID_CONFIG: Union[str, dict] = "{}"
    AUTOMATION_ENABLED: bool = False

    @field_validator("PROXMOX_HYBRID_CONFIG", mode="before")
    @classmethod
    def parse_hybrid_config(cls, v: str | dict) -> dict:
        if isinstance(v, dict):
            return v
        if not v or v.strip() in ("", "{}"):
            return {}
        try:
            return json.loads(v)
        except json.JSONDecodeError:
            return {}

    def hybrid_config_dict(self) -> dict[str, str]:
        """Return parsed PROXMOX_HYBRID_CONFIG as dict node_id -> "mock"|"real"."""
        raw = self.PROXMOX_HYBRID_CONFIG
        if isinstance(raw, dict):
            return {k: str(v).lower() for k, v in raw.items()}
        if not raw or (isinstance(raw, str) and raw.strip() in ("", "{}")):
            return {}
        if isinstance(raw, str):
            try:
                data = json.loads(raw)
                return {k: str(v).lower() for k, v in (data or {}).items()}
            except json.JSONDecodeError:
                return {}
        return {}

    def validate_for_mode(self) -> None:
        """Raise ValueError if required fields missing for current mode."""
        if self.PROXMOX_MODE == "real":
            if not self.PROXMOX_HOST or not self.PROXMOX_USER:
                raise ValueError("PROXMOX_MODE=real requires PROXMOX_HOST and PROXMOX_USER")
            if not self.PROXMOX_PASSWORD and not (self.PROXMOX_TOKEN_NAME and self.PROXMOX_TOKEN_VALUE):
                raise ValueError("PROXMOX_MODE=real requires PROXMOX_PASSWORD or PROXMOX_TOKEN_NAME+PROXMOX_TOKEN_VALUE")
        if self.PROXMOX_MODE == "hybrid":
            if not self.PROXMOX_HOST or not self.PROXMOX_USER:
                raise ValueError("PROXMOX_MODE=hybrid requires PROXMOX_HOST and PROXMOX_USER")
            if not self.PROXMOX_PASSWORD and not (self.PROXMOX_TOKEN_NAME and self.PROXMOX_TOKEN_VALUE):
                raise ValueError("PROXMOX_MODE=hybrid requires PROXMOX_PASSWORD or token")


@lru_cache
def get_settings() -> Settings:
    """Singleton settings instance."""
    return Settings()
