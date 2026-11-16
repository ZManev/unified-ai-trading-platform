const WRITE_METHODS = new Set([
  "eth_sendRawTransaction", "eth_sendTransaction", "personal_sendTransaction",
  "sendTransaction", "sendRawTransaction", "requestAirdrop",
  "signTransaction", "signAndSendTransaction", "wallet_sendCalls"
]);

export class ReadOnlyRpcClient {
  constructor({ endpoint, fetchImpl = globalThis.fetch, timeoutMs = 10_000 }) {
    if (!endpoint || !/^https:\/\//.test(endpoint)) throw new Error("A valid HTTPS RPC endpoint is required");
    if (typeof fetchImpl !== "function") throw new Error("fetch implementation is required");
    this.endpoint = endpoint;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async call(method, params = []) {
    if (typeof method !== "string" || !method) throw new Error("RPC method is required");
    if (WRITE_METHODS.has(method) || /send|sign|swap|bridge|submit|bundle|transfer/i.test(method)) {
      throw new Error("RPC method rejected by read-only policy");
    }
    const id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const started = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`RPC HTTP status ${response.status}`);
      const payload = await response.json();
      if (payload.id !== id) throw new Error("RPC response ID mismatch");
      if (payload.error) throw new Error(`RPC error ${payload.error.code ?? "unknown"}`);
      return {
        timestamp: new Date().toISOString(),
        requestId: id,
        latencyMs: Math.round((performance.now() - started) * 100) / 100,
        result: payload.result
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
