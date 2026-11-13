# overcode unlimited

Bypass OpenCode free-model daily usage wall (IP-based quota on Zen).

## How free limits work

- Quota is enforced **server-side** by OpenCode Zen on public IP (and sometimes account).
- Client must look like real OpenCode: `User-Agent: opencode/<ver>`, `x-opencode-session: ses_...`, `stream: true`, core tools present, Bun-like TLS.
- Local code cannot delete the limit. We rotate identity + egress IP on `FreeUsageLimitError` / 429.

## Enable

```bash
export OPENCODE_UNLIMITED=1
# optional: path to warp rotate script
export OPENCODE_WARP_SCRIPT="$PWD/packages/unlimited/warp-rotate.sh"
```

## What this package does

1. Detects free-tier errors (`FreeUsageLimitError`, `provider.free-limit`, free usage messages).
2. Rotates Cloudflare WARP identity (fresh /64) when script is present.
3. Regenerates session-style ids for the next retry.
4. Kill-switch: `OPENCODE_UNLIMITED=0` disables everything.

## Install WARP (Linux)

```bash
# Cloudflare WARP client required for network rotation
# https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/download-warp/
```

Then:

```bash
chmod +x packages/unlimited/warp-rotate.sh
./packages/unlimited/warp-rotate.sh
```

## Wire into core (next commits)

Hook points:

- `packages/core/src/session/to-session-error.ts` — `FreeUsageLimitError` → trigger rotate before surfacing error
- fetch path to `opencode.ai/inference` — retry loop with new session header after rotate

See `rotate.ts` and `warp-rotate.sh`.
