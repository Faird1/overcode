/**
 * Free-tier rotate helpers for overcode unlimited branch.
 * Server enforces quota by IP; we rotate egress + session shape on free-limit errors.
 */

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

export function unlimitedEnabled(): boolean {
  return process.env.OPENCODE_UNLIMITED !== "0" && process.env.OPENCODE_UNLIMITED !== "false"
}

/** ses_ + 12 lowercase hex + 14 base62 (OpenCode-style session id shape) */
export function generateSessionId(): string {
  const counter = (Math.random() * 0x1000) | 0
  const n = ~(Date.now() * 0x1000 + counter) >>> 0
  const hex = (BigInt(Date.now()) * 0x1000n + BigInt(counter) & 0xffffffffffffn)
    .toString(16)
    .padStart(12, "0")
    .slice(-12)
  let tail = ""
  for (let i = 0; i < 14; i++) tail += BASE62[(Math.random() * 62) | 0]
  return `ses_${hex}${tail}`
}

export function isFreeLimitError(status: number, body: string): boolean {
  if (status !== 429 && status !== 403) return false
  return /FreeUsageLimitError|FreeTierError|free usage|today's free|provider\.free-limit|Free usage limit/i.test(
    body,
  )
}

export async function rotateWarp(scriptPath?: string): Promise<boolean> {
  if (!unlimitedEnabled()) return false
  const script = scriptPath || process.env.OPENCODE_WARP_SCRIPT
  if (!script) return false
  try {
    const proc = Bun.spawn(["bash", script], {
      stdout: "inherit",
      stderr: "inherit",
    })
    const code = await proc.exited
    return code === 0
  } catch {
    return false
  }
}

export async function onFreeLimitHit(opts?: { scriptPath?: string; sleepMs?: number }): Promise<{
  sessionId: string
  rotated: boolean
}> {
  const rotated = await rotateWarp(opts?.scriptPath)
  const ms = opts?.sleepMs ?? 800 + Math.floor(Math.random() * 1200)
  await Bun.sleep(ms)
  return { sessionId: generateSessionId(), rotated }
}

export const FREE_LIMIT_TYPES = ["provider.free-limit", "FreeUsageLimitError", "FreeTierError"] as const
