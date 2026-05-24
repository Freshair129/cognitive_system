import { WebSocketServer, WebSocket } from 'ws';
import { spawn } from 'node:child_process';
import { resolveTaskToAtom } from '../memory/backlinks/task-resolver.js';
import * as path from 'node:path';
import * as os from 'node:os';

interface WsTaskPayload {
  task_id: string;
  agent?: string;
  system_prompt?: string;
  workspace_path?: string;
}

export function startWsServer(port: number = 8787, getWorkspaceRoot: () => string = () => process.cwd()) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WS] Client connected');

    ws.on('message', async (data: Buffer) => {
      try {
        const payload: WsTaskPayload = JSON.parse(data.toString());
        if (!payload.task_id) {
          ws.send(JSON.stringify({ type: 'error', data: 'Missing task_id in payload' }));
          return;
        }

        const workspaceRoot = getWorkspaceRoot();

        ws.send(JSON.stringify({ type: 'status', data: `Received task_id: ${payload.task_id}` }));

        // Resolve task to atom
        ws.send(JSON.stringify({ type: 'status', data: 'Resolving task ID...' }));
        const resolution = await resolveTaskToAtom(workspaceRoot, payload.task_id);
        
        if (!resolution.atomId) {
          ws.send(JSON.stringify({ type: 'error', data: `Task ID ${payload.task_id} not found in GKS index.` }));
          return;
        }

        ws.send(JSON.stringify({ type: 'status', data: `Resolved to atom: ${resolution.atomId}` }));
        ws.send(JSON.stringify({ type: 'status', data: `Atom path: ${resolution.atomPath}` }));
        ws.send(JSON.stringify({ type: 'status', data: 'Spawning agent...' }));

        // Choose CLI based on OS or specific agent logic.
        const agent = payload.agent || 'qwen';
        let cmd = 'qwen';
        let args = ['--task', resolution.atomId];

        if (agent === 'eva') {
          cmd = 'eva';
          args = ['vibe', '--task', resolution.atomId];
        } else if (agent === 'qwen') {
          cmd = 'qwen';
          args = ['--task', resolution.atomId];
        } else if (agent === 'local') {
          // Fallback or local dev command
          cmd = 'node';
          args = [path.join(workspaceRoot, 'packages/msp/dist/usage/cli/gks-cli.js'), '--task', resolution.atomId];
        }

        const useShell = os.platform() === 'win32';
        
        ws.send(JSON.stringify({ type: 'status', data: `Running: ${cmd} ${args.join(' ')}` }));

        const child = spawn(cmd, args, {
          shell: useShell,
          cwd: payload.workspace_path || workspaceRoot,
          env: {
            ...process.env,
            AGENT_SYSTEM_PROMPT: payload.system_prompt || '',
            WORKSPACE_PATH: payload.workspace_path || workspaceRoot
          }
        });

        child.stdout.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'agent_output', data: chunk.toString('utf8') }));
        });

        child.stderr.on('data', (chunk) => {
          ws.send(JSON.stringify({ type: 'agent_error', data: chunk.toString('utf8') }));
        });

        child.on('error', (err) => {
          ws.send(JSON.stringify({ type: 'error', data: `Failed to start process: ${err.message}` }));
        });

        child.on('close', (code) => {
          ws.send(JSON.stringify({ type: 'status', data: `Agent process exited with code ${code}` }));
        });

      } catch (err: any) {
        ws.send(JSON.stringify({ type: 'error', data: `Server error: ${err.message}` }));
      }
    });

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });
  });

  console.log(`[WS] WebSocket server is listening on ws://127.0.0.1:${port}`);
  return wss;
}
