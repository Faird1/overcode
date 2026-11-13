#!/usr/bin/env bash
# Rotate Cloudflare WARP identity to get a fresh egress /64 for OpenCode free tier.
# Requires: cloudflare-warp (warp-cli) installed and previously registered once.
set -euo pipefail

if ! command -v warp-cli >/dev/null 2>&1; then
  echo "warp-cli not found — install Cloudflare WARP first" >&2
  exit 1
fi

echo "[unlimited] disconnecting WARP..."
warp-cli disconnect 2>/dev/null || true
sleep 1

# Prefer fresh registration when supported; fall back to reconnect
if warp-cli registration new 2>/dev/null; then
  echo "[unlimited] new WARP registration"
else
  echo "[unlimited] registration new failed — reconnecting existing"
fi

warp-cli connect

# Wait for tunnel
for i in $(seq 1 30); do
  if warp-cli status 2>/dev/null | grep -qi connected; then
    echo "[unlimited] WARP connected"
    exit 0
  fi
  sleep 0.5
done

echo "[unlimited] WARP did not report connected in time" >&2
exit 1
