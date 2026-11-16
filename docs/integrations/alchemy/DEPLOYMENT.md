# Alchemy read-only deployment checklist

## Local developer environment

1. Copy `.env.example` to `.env`.
2. Set `ALCHEMY_API_KEY` in the local environment or secret manager. Never commit `.env`.
3. Install Node.js 20+; run `npm test`.
4. Run `npm run alchemy:readiness` only in an approved environment with the key injected by its secret manager.
5. The readiness script prints sanitized JSON records only. It never prints endpoint URLs, headers, or environment values.

## GitHub Actions

Add repository Actions secret `ALCHEMY_API_KEY` in GitHub Settings → Secrets and variables → Actions. The secret value is not readable through this integration. The RPC job is skipped when the secret is absent; unit tests still run. A skipped RPC job is NOT VERIFIED, not PASS.

## MCP OAuth (separate client authorization)

The project-level `.mcp.json` only declares the hosted endpoint. It does not authenticate a user. In a Codex client that supports remote HTTP MCP servers, register `https://mcp.alchemy.com/mcp`, complete the browser OAuth flow, and verify the connected server using the client's own MCP status/list-tools command. Do not put OAuth tokens in this repository or CI. OAuth status is NOT VERIFIED until the client reports a successful authenticated connection.

## Safety

Only Solana `getHealth`, `getGenesisHash`, `getSlot`, and EVM `eth_chainId`, `eth_blockNumber` are used by the readiness adapters. Transaction signing, send methods, swaps, bridges, Jito submission, agentic-gateway, x402, MPP, and payments are out of scope and disabled. Do not enable them as part of deployment.
