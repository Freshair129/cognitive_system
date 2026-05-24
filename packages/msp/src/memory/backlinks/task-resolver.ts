import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as readline from 'node:readline';

export interface TaskResolution {
  taskId: string;
  atomId: string | null;
  atomPath: string | null;
}

/**
 * Resolves a given taskId to its corresponding GKS atom by scanning
 * the atomic_index.jsonl for an atom that contains the taskId within its `attributes.task_ids` array.
 */
export async function resolveTaskToAtom(workspaceRoot: string, taskId: string): Promise<TaskResolution> {
  const indexPath = path.join(workspaceRoot, 'gks', '00_index', 'atomic_index.jsonl');
  
  try {
    const fileHandle = await fs.open(indexPath, 'r');
    const rl = readline.createInterface({
      input: fileHandle.createReadStream(),
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (entry.attributes && Array.isArray(entry.attributes.task_ids)) {
          if (entry.attributes.task_ids.includes(taskId)) {
            await fileHandle.close();
            return {
              taskId,
              atomId: entry.id,
              atomPath: entry.path ? path.join(workspaceRoot, 'gks', entry.path) : null
            };
          }
        }
      } catch (err) {
        // Skip invalid JSON lines
        continue;
      }
    }
    await fileHandle.close();
  } catch (err) {
    console.error(`Failed to read atomic_index.jsonl at ${indexPath}:`, err);
  }

  return { taskId, atomId: null, atomPath: null };
}
