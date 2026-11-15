#!/usr/bin/env bash
set -euo pipefail

# Installs the official Alchemy Agent Skills into this project.
# This is a developer-machine setup step; it does not configure API credentials
# or connect the hosted MCP server.
npx skills add alchemyplatform/skills --yes
