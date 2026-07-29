import { promises as fs } from 'node:fs'
import path from 'node:path'

export function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}
export async function resolveWorkspaceRoot(
  serverRoot: string,
  requested?: string,
): Promise<string> {
  const root = await fs.realpath(path.resolve(serverRoot))
  const workspace = await fs.realpath(path.resolve(requested ?? serverRoot))
  if (!isInside(root, workspace)) {
    throw new Error(`workspace_root is outside the MSP server root: ${workspace}`)
  }
  return workspace
}

export function assertSafeId(id: string, label = 'record_id'): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(id)) {
    throw new Error(`${label} contains unsafe characters`)
  }
}
