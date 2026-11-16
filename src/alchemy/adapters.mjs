import { ReadOnlyRpcClient } from "./rpc-client.mjs";

export const SOLANA_MAINNET_GENESIS_HASH = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

function requireKey(env) {
  if (!env.ALCHEMY_API_KEY) throw new Error("ALCHEMY_API_KEY is missing");
  return env.ALCHEMY_API_KEY;
}
function endpoint(network, env) {
  const key = encodeURIComponent(requireKey(env));
  return `https://${network}.g.alchemy.com/v2/${key}`;
}

export function createSolanaAdapter({ env = process.env, fetchImpl } = {}) {
  const client = new ReadOnlyRpcClient({ endpoint: endpoint("solana-mainnet", env), fetchImpl });
  return {
    async readiness() {
      const [health, genesis, slot] = await Promise.all([
        client.call("getHealth"), client.call("getGenesisHash"), client.call("getSlot", [{ commitment: "finalized" }])
      ]);
      if (health.result !== "ok") throw new Error("Solana getHealth did not return ok");
      if (genesis.result !== SOLANA_MAINNET_GENESIS_HASH) throw new Error("Solana genesis hash mismatch");
      if (!Number.isSafeInteger(slot.result) || slot.result <= 0) throw new Error("Solana slot response is invalid");
      return { network: "solana-mainnet", probes: { getHealth: health, getGenesisHash: genesis, getSlot: slot } };
    }
  };
}

function createEvmAdapter(network, expectedChainId, { env = process.env, fetchImpl } = {}) {
  const client = new ReadOnlyRpcClient({ endpoint: endpoint(network, env), fetchImpl });
  return {
    async readiness() {
      const [chain, block] = await Promise.all([client.call("eth_chainId"), client.call("eth_blockNumber")]);
      if (chain.result?.toLowerCase() !== expectedChainId) throw new Error(`${network} chain ID mismatch`);
      if (typeof block.result !== "string" || !/^0x[0-9a-f]+$/i.test(block.result)) throw new Error(`${network} block number is invalid`);
      return { network, probes: { eth_chainId: chain, eth_blockNumber: block } };
    }
  };
}

export const createEthereumAdapter = (options) => createEvmAdapter("eth-mainnet", "0x1", options);
export const createArbitrumAdapter = (options) => createEvmAdapter("arb-mainnet", "0xa4b1", options);
