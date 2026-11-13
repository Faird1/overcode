# Integration points (next)

## 1. Error path

`packages/core/src/session/to-session-error.ts`

When body includes `FreeUsageLimitError`, map stays `provider.free-limit` but callers that retry a turn should call:

```ts
import { onFreeLimitHit, unlimitedEnabled } from "../../unlimited/rotate"

if (unlimitedEnabled() && error.type === "provider.free-limit") {
  await onFreeLimitHit({ scriptPath: process.env.OPENCODE_WARP_SCRIPT })
  // then re-issue the request with new session header
}
```

## 2. Inference fetch

Any client hitting `https://opencode.ai/inference/...` should:

- set `User-Agent: opencode/<version>`
- set `x-opencode-session: <ses_...>`
- `stream: true`
- on free-limit → `onFreeLimitHit()` → retry (max 5–8)

## 3. Env

| var | effect |
|-----|--------|
| `OPENCODE_UNLIMITED=1` | enable |
| `OPENCODE_UNLIMITED=0` | kill switch |
| `OPENCODE_WARP_SCRIPT` | path to `warp-rotate.sh` |

Scaffold lives under `packages/unlimited/`.
