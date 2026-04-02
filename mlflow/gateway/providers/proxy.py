"""
Generic proxy provider for the MLflow AI Gateway.

This provider forwards requests unchanged to any configured HTTP endpoint,
allowing users to route traffic through the gateway to arbitrary LLM APIs
(commercial providers, self-hosted models, etc.) that are not explicitly
supported by a built-in provider.
"""

from typing import Any, AsyncIterable

from mlflow.gateway.config import EndpointConfig, ProxyConfig
from mlflow.gateway.providers.base import BaseProvider
from mlflow.gateway.providers.utils import send_request, send_stream_request


class ProxyProvider(BaseProvider):
    """
    Generic HTTP proxy provider.

    Forwards POST requests (including streaming ones) to the configured
    ``proxy_url``, injecting any ``proxy_headers`` (e.g. an auth token)
    before forwarding.  The request payload and response are passed through
    without modification, so the caller must speak whatever wire format the
    remote endpoint expects.

    Example YAML configuration (legacy gateway)::

        endpoints:
          - name: my-proxy
            endpoint_type: llm/v1/proxy
            model:
              provider: proxy
              name: my-proxy
              config:
                proxy_url: https://api.example.com/v1
                proxy_headers:
                  Authorization: Bearer sk-...

    Example usage via the dynamic gateway route::

        POST / gateway / proxy / my - proxy / chat / completions
        {"model": "gpt-4o", "messages": [{"role": "user", "content": "Hello"}]}
    """

    NAME = "Proxy"
    CONFIG_TYPE = ProxyConfig
    SUPPORTED_ROUTE_TYPES: tuple[str, ...] = ()

    def __init__(self, config: EndpointConfig, enable_tracing: bool = False) -> None:
        super().__init__(config, enable_tracing=enable_tracing)
        if config.model.config is None or not isinstance(config.model.config, ProxyConfig):
            raise TypeError(
                f"Expected config type ProxyConfig, got {type(config.model.config).__name__}"
            )
        self._proxy_config: ProxyConfig = config.model.config

    def _build_headers(self, headers: dict[str, str] | None = None) -> dict[str, str]:
        """Build the final set of request headers for a proxied call.

        Client-supplied headers are forwarded (minus hop-by-hop / auth headers
        that the proxy must own), and then the configured ``proxy_headers``
        are merged on top so they always take precedence.
        """
        # Sanitise client headers: drop hop-by-hop + auth so the proxy's own
        # credentials are not accidentally overridden.
        _DROP = frozenset(("host", "content-length", "authorization"))
        filtered: dict[str, str] = (
            {k: v for k, v in headers.items() if k.lower() not in _DROP} if headers else {}
        )
        # Merge: proxy_headers win over filtered client headers.
        return filtered | (self._proxy_config.proxy_headers or {})

    async def proxy_request(
        self,
        path: str,
        payload: dict[str, Any],
        headers: dict[str, str] | None = None,
    ) -> dict[str, Any] | AsyncIterable[Any]:
        """Forward *payload* to ``proxy_url / path``.

        Streaming is detected from the ``stream`` boolean field in *payload*
        (the standard OpenAI convention).  When ``stream=true`` the response
        is returned as an async byte iterator; otherwise a parsed JSON dict
        is returned.

        Args:
            path: The URL sub-path to append to ``proxy_url``
                  (e.g. ``"v1/chat/completions"``).
            payload: The JSON-serialisable request body to forward.
            headers: Optional client request headers to pass through.

        Returns:
            Parsed JSON response dict for non-streaming requests, or an
            ``AsyncIterable[bytes]`` for streaming requests.
        """
        request_headers = self._build_headers(headers)
        if payload.get("stream"):
            stream = send_stream_request(
                headers=request_headers,
                base_url=self._proxy_config.proxy_url,
                path=path,
                payload=payload,
            )
            return self._stream_passthrough_with_usage(stream)
        return await send_request(
            headers=request_headers,
            base_url=self._proxy_config.proxy_url,
            path=path,
            payload=payload,
        )
