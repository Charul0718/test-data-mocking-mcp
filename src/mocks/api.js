const DEFAULT_LATENCY_BY_STATUS = {
  200: 120,
  201: 150,
  400: 80,
  401: 60,
  403: 60,
  404: 70,
  408: 8000,
  500: 200,
  502: 250,
  503: 300,
  504: 8000,
};

function bodyForStatus(status, endpoint) {
  if (status >= 200 && status < 300) {
    return { success: true, endpoint, data: {} };
  }
  if (status === 408 || status === 504) {
    return { success: false, error: { code: "TIMEOUT", message: `Request to ${endpoint} timed out.` } };
  }
  if (status === 400) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "One or more fields failed validation.", fields: ["amount", "email"] },
    };
  }
  if (status === 401 || status === 403) {
    return { success: false, error: { code: "UNAUTHORIZED", message: "Request lacks valid authentication." } };
  }
  if (status === 404) {
    return { success: false, error: { code: "NOT_FOUND", message: `${endpoint} not found.` } };
  }
  return { success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } };
}

/**
 * Simulates an HTTP response from any backend/API endpoint — success,
 * validation error, timeout, or 5xx — without calling the real endpoint.
 */
export function mockApiResponse({ endpoint, status, latency_ms }) {
  const latency = typeof latency_ms === "number" ? latency_ms : (DEFAULT_LATENCY_BY_STATUS[status] ?? 150);
  return {
    endpoint,
    status,
    latency_ms: latency,
    headers: { "content-type": "application/json", "x-mocked-by": "test-data-mocking-mcp" },
    body: bodyForStatus(status, endpoint),
  };
}
