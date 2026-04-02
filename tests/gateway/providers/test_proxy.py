"""Tests for the generic proxy gateway provider."""

from typing import Any
from unittest import mock

import aiohttp
import pytest

from mlflow.gateway.config import EndpointConfig, ProxyConfig
from mlflow.gateway.providers.proxy import ProxyProvider

# ---------------------------------------------------------------------------
# Minimal mock utilities (avoid importing tests.gateway.tools which pulls in
# sentence_transformers as a top-level dependency)
# ---------------------------------------------------------------------------


class _MockAsyncResponse:
    def __init__(self, data: dict[str, Any], status: int = 200):
        self.status = status
        self.headers = data.pop("headers", {"Content-Type": "application/json"})
        self._content = data

    def raise_for_status(self) -> None:
        if 400 <= self.status < 600:
            raise aiohttp.ClientResponseError(None, None, status=self.status)

    async def json(self) -> dict[str, Any]:
        return self._content

    async def text(self) -> str:
        import json

        return json.dumps(self._content)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        pass


class _MockAsyncStreamingResponse:
    def __init__(self, data: list[bytes], status: int = 200):
        self.status = status
        self.headers = {}
        self._content = data

    def raise_for_status(self) -> None:
        if 400 <= self.status < 600:
            raise aiohttp.ClientResponseError(None, None, status=self.status)

    async def _async_content(self):
        for line in self._content:
            yield line

    @property
    def content(self):
        return self._async_content()

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        pass


class _MockHttpClient(mock.Mock):
    def __init__(self, mock_response=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._mock_response = mock_response
        self.post = mock.Mock(return_value=mock_response)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        pass


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_provider(proxy_url: str = "https://api.example.com/v1", proxy_headers=None):
    """Build a :class:`ProxyProvider` backed by the given configuration."""
    config = EndpointConfig(
        name="test-proxy",
        endpoint_type="llm/v1/proxy",
        model={
            "provider": "proxy",
            "name": "test-proxy",
            "config": {
                "proxy_url": proxy_url,
                **({"proxy_headers": proxy_headers} if proxy_headers else {}),
            },
        },
    )
    return ProxyProvider(config)


# ---------------------------------------------------------------------------
# Construction / config tests
# ---------------------------------------------------------------------------


def test_provider_name():
    provider = _make_provider()
    assert provider.NAME == "Proxy"


def test_config_type():
    assert ProxyProvider.CONFIG_TYPE is ProxyConfig


# ---------------------------------------------------------------------------
# Header construction
# ---------------------------------------------------------------------------


def test_build_headers_no_proxy_headers():
    provider = _make_provider(proxy_headers=None)
    result = provider._build_headers(None)
    assert result == {}


def test_build_headers_with_proxy_headers():
    proxy_headers = {"Authorization": "Bearer sk-123", "X-Custom": "val"}
    provider = _make_provider(proxy_headers=proxy_headers)
    result = provider._build_headers(None)
    assert result == proxy_headers


def test_build_headers_proxy_wins_over_client():
    """proxy_headers override same-name client headers."""
    provider = _make_provider(proxy_headers={"Authorization": "Bearer proxy-key"})
    client_headers = {"Authorization": "Bearer client-key", "X-Forwarded-For": "1.2.3.4"}
    result = provider._build_headers(client_headers)
    assert result["Authorization"] == "Bearer proxy-key"
    assert result["X-Forwarded-For"] == "1.2.3.4"


def test_build_headers_drops_hop_by_hop():
    """host, content-length, and authorization from client are dropped before merge."""
    provider = _make_provider(proxy_headers=None)
    client_headers = {
        "host": "gateway.example.com",
        "content-length": "42",
        "Authorization": "Bearer client",
        "Accept": "application/json",
    }
    result = provider._build_headers(client_headers)
    assert "host" not in result
    assert "content-length" not in result
    assert "Authorization" not in result
    assert result.get("Accept") == "application/json"


# ---------------------------------------------------------------------------
# Non-streaming proxy_request
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_proxy_request_non_streaming():
    provider = _make_provider(proxy_headers={"Authorization": "Bearer sk-abc"})
    mock_response = {
        "id": "chatcmpl-xyz",
        "choices": [{"message": {"role": "assistant", "content": "Hi!"}}],
        "headers": {"Content-Type": "application/json"},
    }
    payload = {"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}

    with mock.patch(
        "aiohttp.ClientSession",
        return_value=_MockHttpClient(_MockAsyncResponse(mock_response)),
    ):
        result = await provider.proxy_request(
            path="chat/completions", payload=payload, headers=None
        )

    assert result["id"] == "chatcmpl-xyz"


@pytest.mark.asyncio
async def test_proxy_request_streaming():
    provider = _make_provider(proxy_headers={"Authorization": "Bearer sk-abc"})
    stream_chunks = [
        b'data: {"id":"1","choices":[{"delta":{"content":"Hi"}}]}\n\n',
        b"data: [DONE]\n\n",
    ]
    payload = {
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": "Hello"}],
        "stream": True,
    }

    # The mock must remain active during iteration because the streaming generator
    # holds a live aiohttp connection.
    with mock.patch(
        "aiohttp.ClientSession",
        return_value=_MockHttpClient(_MockAsyncStreamingResponse(stream_chunks)),
    ):
        result = await provider.proxy_request(
            path="chat/completions", payload=payload, headers=None
        )

        chunks = []
        async for chunk in result:
            chunks.append(chunk)

    assert len(chunks) == 2


# ---------------------------------------------------------------------------
# ProxyConfig construction / validation
# ---------------------------------------------------------------------------


def test_proxy_config_minimal():
    cfg = ProxyConfig(proxy_url="https://api.example.com/v1")
    assert cfg.proxy_url == "https://api.example.com/v1"
    assert cfg.proxy_headers is None


def test_proxy_config_with_headers():
    cfg = ProxyConfig(
        proxy_url="https://api.example.com/v1",
        proxy_headers={"Authorization": "Bearer tok"},
    )
    assert cfg.proxy_headers == {"Authorization": "Bearer tok"}
