# Alchemy integration

This repository uses Alchemy as the blockchain data/RPC provider through three independent adapters:

- **Solana** — Alchemy Solana JSON-RPC / DAS where applicable.
- **Ethereum** — Alchemy EVM JSON-RPC on `eth-mainnet`.
- **Arbitrum One** — Alchemy EVM JSON-RPC on `arb-mainnet`.

## Two separate integration surfaces

### Agent Skills — API knowledge for code generation

Install the official Alchemy skill bundle from the repository root:

```bash
npx skills add alchemyplatform/skills --yes
```

For shipped application code, select `alchemy-api` when using a standard Alchemy API key. The `agentic-gateway` skill is a separate, optional path for applications that deliberately use wallet-authenticated x402/MPP payments; do not activate it implicitly. Follow its mandatory protocol-selection prompt before any gateway setup.

Skills are documentation/instructions consumed by the coding agent. They do not create a live RPC connection and do not provide runtime tools by themselves.

### Alchemy MCP — live tools for the coding assistant

The root `.mcp.json` registers Alchemy's hosted MCP endpoint:

```json
{
  "mcpServers": {
    "alchemy": {
      "type": "http",
      "url": "https://mcp.alchemy.com/mcp"
    }
  }
}
```

The MCP client must complete Alchemy OAuth sign-in. MCP exposes live tools to a compatible assistant; it is not the production application's RPC adapter and should not be imported by backend services.

**In short:** Skills teach the agent how to use Alchemy APIs; MCP lets a compatible agent call Alchemy tools live. Use both for development.

## API key setup

1. Create an Alchemy app/API key in the [Alchemy Dashboard](https://dashboard.alchemy.com/).
2. Copy `.env.example` to `.env` locally and set `ALCHEMY_API_KEY`.
3. Add `ALCHEMY_API_KEY` as a GitHub Actions repository secret for CI.
4. Configure the same secret in the deployment secret manager. Do not commit `.env`, paste keys into issues/PRs, or print endpoint URLs containing the key.
5. Restrict the key in the Alchemy dashboard where supported and rotate it if exposed.

No API key has been created or configured by this commit. Do not use public/demo RPC endpoints as a fallback.

## Runtime safety boundary

The initial integration is **READ-ONLY / SIMULATION ONLY**:

- No private keys or wallet seed phrases in this application, repository, GitHub Actions, or Alchemy API configuration.
- No transaction signing, `eth_sendRawTransaction`, Solana `sendTransaction`, swaps, bridges, Jito bundle submission, or live order execution.
- Read methods, subscriptions, metadata/data APIs, and supported simulation endpoints only.
- Unknown RPC methods fail closed. Write-capable methods are rejected by default.
- Alchemy availability does not grant execution authority. Any future signer and sender must be a separately reviewed component with an independent approval gate and kill switch.

## Adapter contract

Each chain adapter should expose the same read-only application interface while keeping chain-specific transport and response validation isolated:

| Adapter | Alchemy network | Required first probes |
|---|---|---|
| Solana | `solana-mainnet` | `getHealth`, `getGenesisHash`, `getSlot` |
| Ethereum | `eth-mainnet` | `eth_chainId` (must be `0x1`), `eth_blockNumber` |
| Arbitrum One | `arb-mainnet` | `eth_chainId` (must be `0xa4b1`), `eth_blockNumber` |

A probe is PASS only after a real request succeeds and the returned chain identity is validated. Configuration presence alone is NOT VERIFIED. Record endpoint/network (never the secret), timestamp, request ID, latency, and sanitized result in the audit log.

## Current status

- Repository wiring/configuration: committed in this branch.
- Alchemy account/API key: NOT CONFIGURED.
- MCP OAuth connection: NOT VERIFIED.
- Solana/Ethereum/Arbitrum RPC probes: NOT RUN.
- Production adapter implementation and tests: NOT IMPLEMENTED in this setup commit.
- Signing/submission/live trading: DISABLED.
