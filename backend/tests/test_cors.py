"""Tests for CORS configuration."""

from pydantic import ValidationError
import pytest

from app.config import Settings
from app.main import app
from fastapi.testclient import TestClient


# ==============================================================================
# 1. Development Default Tests
# ==============================================================================

def test_cors_default_origins_are_localhost():
    """Default CORS_ORIGINS contains only localhost origins for development."""
    s = Settings()
    assert s.CORS_ORIGINS == [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]


def test_cors_default_environment_is_development():
    """Default ENVIRONMENT is development."""
    s = Settings()
    assert s.ENVIRONMENT == "development"


# ==============================================================================
# 2. Environment Variable Override Tests
# ==============================================================================

def test_cors_origins_override_via_json_array():
    """CORS_ORIGINS can be overridden via JSON array string."""
    s = Settings(CORS_ORIGINS='["https://example.com","https://app.example.com"]')
    assert s.CORS_ORIGINS == ["https://example.com", "https://app.example.com"]


def test_cors_origins_override_via_comma_separated():
    """CORS_ORIGINS can be overridden via comma-separated string."""
    s = Settings(CORS_ORIGINS="https://example.com,https://app.example.com")
    assert s.CORS_ORIGINS == ["https://example.com", "https://app.example.com"]


def test_cors_origins_override_via_list():
    """CORS_ORIGINS can be overridden via Python list (programmatic)."""
    s = Settings(CORS_ORIGINS=["https://custom.com"])
    assert s.CORS_ORIGINS == ["https://custom.com"]


def test_cors_origins_strips_whitespace():
    """CORS_ORIGINS values are stripped of whitespace."""
    s = Settings(CORS_ORIGINS="  https://a.com , https://b.com  ")
    assert s.CORS_ORIGINS == ["https://a.com", "https://b.com"]


# ==============================================================================
# 3. Production Configuration Tests
# ==============================================================================

def test_production_cors_with_vercel_origin():
    """Production can specify Vercel frontend origin."""
    s = Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS=["https://v2-sih-2026-flood-guard-pi.vercel.app"]
    )
    assert s.ENVIRONMENT == "production"
    assert s.CORS_ORIGINS == ["https://v2-sih-2026-flood-guard-pi.vercel.app"]


def test_production_cors_with_multiple_origins():
    """Production can specify multiple origins."""
    s = Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS=["https://app.example.com", "https://admin.example.com"]
    )
    assert s.CORS_ORIGINS == ["https://app.example.com", "https://admin.example.com"]


# ==============================================================================
# 4. Production Misconfiguration Detection Tests
# ==============================================================================

def test_production_with_only_localhost_triggers_warning(caplog):
    """Production with only localhost origins triggers warning (not failure)."""
    import logging
    caplog.set_level(logging.WARNING)
    
    # This should not raise, but should log a warning
    s = Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:5173"]
    )
    
    # Check that warning was logged
    warning_messages = [record.message for record in caplog.records if record.levelno >= logging.WARNING]
    assert any("PRODUCTION MISCONFIGURATION DETECTED" in msg for msg in warning_messages)
    assert any("localhost" in msg.lower() for msg in warning_messages)


def test_production_with_empty_cors_triggers_warning(caplog):
    """Production with empty CORS_ORIGINS triggers warning."""
    import logging
    caplog.set_level(logging.WARNING)
    
    s = Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS=[]
    )
    
    warning_messages = [record.message for record in caplog.records if record.levelno >= logging.WARNING]
    assert any("PRODUCTION MISCONFIGURATION DETECTED" in msg for msg in warning_messages)
    assert any("empty" in msg.lower() for msg in warning_messages)


def test_production_with_mixed_origins_no_warning(caplog):
    """Production with at least one non-localhost origin does not trigger warning."""
    import logging
    caplog.set_level(logging.WARNING)
    
    s = Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS=["http://localhost:3000", "https://production.example.com"]
    )
    
    warning_messages = [record.message for record in caplog.records if record.levelno >= logging.WARNING]
    # Should not have the production misconfiguration warning
    assert not any("PRODUCTION MISCONFIGURATION DETECTED" in msg for msg in warning_messages)


def test_development_with_localhost_no_warning(caplog):
    """Development with localhost origins does not trigger warning."""
    import logging
    caplog.set_level(logging.WARNING)
    
    s = Settings(
        ENVIRONMENT="development",
        CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:5173"]
    )
    
    warning_messages = [record.message for record in caplog.records if record.levelno >= logging.WARNING]
    assert not any("PRODUCTION MISCONFIGURATION DETECTED" in msg for msg in warning_messages)


def test_production_warning_includes_actionable_guidance(caplog):
    """Production warning includes actionable guidance about setting Vercel URL."""
    import logging
    caplog.set_level(logging.WARNING)
    
    Settings(
        ENVIRONMENT="production",
        CORS_ORIGINS=["http://localhost:3000"]
    )
    
    warning_messages = [record.message for record in caplog.records if record.levelno >= logging.WARNING]
    assert any("vercel" in msg.lower() or "frontend" in msg.lower() for msg in warning_messages)


# ==============================================================================
# 5. Runtime CORS Middleware Tests
# ==============================================================================

def test_cors_middleware_uses_settings():
    """FastAPI app uses settings.CORS_ORIGINS for CORS middleware."""
    # The app is created at import time with settings.CORS_ORIGINS
    # Verify the middleware is configured
    cors_middleware = None
    for middleware in app.user_middleware:
        if middleware.cls.__name__ == "CORSMiddleware":
            cors_middleware = middleware
            break
    
    assert cors_middleware is not None
    # The options are stored in the middleware.kwargs
    assert cors_middleware.kwargs["allow_origins"] == Settings().CORS_ORIGINS


def test_cors_preflight_works():
    """CORS preflight (OPTIONS) requests work."""
    client = TestClient(app)
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        }
    )
    # Should not be 403 (CORS blocked)
    assert response.status_code != 403


def test_cors_allows_localhost_origin():
    """Requests from localhost origins are allowed."""
    client = TestClient(app)
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:3000"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_allows_configured_origin():
    """Requests from configured origins are allowed."""
    client = TestClient(app)
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "http://localhost:5173"}
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_blocks_unconfigured_origin():
    """Requests from unconfigured origins are blocked (no ACAO header)."""
    client = TestClient(app)
    response = client.get(
        "/api/v1/health",
        headers={"Origin": "https://evil.com"}
    )
    # Request succeeds but no ACAO header means browser will block
    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers


# ==============================================================================
# 6. Validation Edge Cases
# ==============================================================================

def test_cors_invalid_json_falls_back_to_comma_split():
    """Invalid JSON array falls back to comma-separated parsing."""
    s = Settings(CORS_ORIGINS='not-json,https://example.com')
    assert "https://example.com" in s.CORS_ORIGINS


def test_cors_empty_string_results_in_empty_list():
    """Empty CORS_ORIGINS string results in empty list."""
    s = Settings(CORS_ORIGINS="")
    assert s.CORS_ORIGINS == []


def test_cors_single_origin_works():
    """Single origin string works."""
    s = Settings(CORS_ORIGINS="https://single.example.com")
    assert s.CORS_ORIGINS == ["https://single.example.com"]