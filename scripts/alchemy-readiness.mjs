import {
  createSolanaAdapter, createEthereumAdapter, createArbitrumAdapter
} from "../src/alchemy/adapters.mjs";

const adapters = [
  ["Solana", createSolanaAdapter],
  ["Ethereum", createEthereumAdapter],
  ["Arbitrum One", createArbitrumAdapter]
];

if (!process.env.ALCHEMY_API_KEY) {
  console.error("BLOCKED: ALCHEMY_API_KEY is not present in this runtime.");
  process.exitCode = 2;
} else {
  for (const [name, create] of adapters) {
    try {
      const result = await create().readiness();
      console.log(JSON.stringify({ status: "PASS", name, ...result }));
    } catch (error) {
      // Never print request URLs, headers, environment values, or raw response bodies.
      console.log(JSON.stringify({ status: "FAIL", name, error: String(error?.message ?? "RPC check failed") }));
      process.exitCode = 1;
    }
  }
}
