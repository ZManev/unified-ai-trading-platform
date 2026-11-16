import test from "node:test";
import assert from "node:assert/strict";
import { ReadOnlyRpcClient } from "../src/alchemy/rpc-client.mjs";
import {
  createSolanaAdapter, createEthereumAdapter, createArbitrumAdapter,
  SOLANA_MAINNET_GENESIS_HASH
} from "../src/alchemy/adapters.mjs";

function fakeFetch(results) {
  return async (_url, init) => {
    const request = JSON.parse(init.body);
    const result = results[request.method];
    return { ok: true, json: async () => ({ jsonrpc: "2.0", id: request.id, result }) };
  };
}

test("read-only client rejects transaction and unknown write-like methods before network I/O", async () => {
  let calls = 0;
  const client = new ReadOnlyRpcClient({ endpoint: "https://example.invalid/rpc", fetchImpl: async () => { calls++; } });
  await assert.rejects(client.call("eth_sendRawTransaction", ["0xdead"]), /read-only policy/);
  await assert.rejects(client.call("sendTransaction", []), /read-only policy/);
  await assert.rejects(client.call("swapExactTokensForTokens", []), /read-only policy/);
  assert.equal(calls, 0);
});

test("Solana adapter validates health, mainnet genesis hash and slot", async () => {
  const adapter = createSolanaAdapter({
    env: { ALCHEMY_API_KEY: "test-only" },
    fetchImpl: fakeFetch({ getHealth: "ok", getGenesisHash: SOLANA_MAINNET_GENESIS_HASH, getSlot: 123 })
  });
  const result = await adapter.readiness();
  assert.equal(result.network, "solana-mainnet");
  assert.equal(result.probes.getSlot.result, 123);
});

test("Solana adapter rejects wrong genesis hash", async () => {
  const adapter = createSolanaAdapter({
    env: { ALCHEMY_API_KEY: "test-only" },
    fetchImpl: fakeFetch({ getHealth: "ok", getGenesisHash: "wrong", getSlot: 123 })
  });
  await assert.rejects(adapter.readiness(), /genesis hash mismatch/);
});

test("Ethereum and Arbitrum adapters validate chain IDs and block numbers", async () => {
  const eth = createEthereumAdapter({ env: { ALCHEMY_API_KEY: "test-only" },
    fetchImpl: fakeFetch({ eth_chainId: "0x1", eth_blockNumber: "0x123" }) });
  const arb = createArbitrumAdapter({ env: { ALCHEMY_API_KEY: "test-only" },
    fetchImpl: fakeFetch({ eth_chainId: "0xa4b1", eth_blockNumber: "0x456" }) });
  assert.equal((await eth.readiness()).network, "eth-mainnet");
  assert.equal((await arb.readiness()).network, "arb-mainnet");
});

test("EVM adapter rejects an unexpected chain ID", async () => {
  const eth = createEthereumAdapter({ env: { ALCHEMY_API_KEY: "test-only" },
    fetchImpl: fakeFetch({ eth_chainId: "0xa4b1", eth_blockNumber: "0x123" }) });
  await assert.rejects(eth.readiness(), /chain ID mismatch/);
});

test("missing API key fails closed", async () => {
  assert.throws(() => createEthereumAdapter({ env: {} }), /ALCHEMY_API_KEY is missing/);
});
