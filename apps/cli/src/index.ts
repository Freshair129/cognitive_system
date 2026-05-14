#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command()
  .name('gks')
  .description('Genesis Knowledge System CLI — for humans and AI agents')
  .version('0.1.0');

// ── Search ──────────────────────────────────────────────────────────────────
program
  .command('search <query>')
  .description('Semantic search across all atoms')
  .option('-n, --limit <n>', 'max results', '10')
  .option('-t, --type <type>', 'filter by atom type (CONCEPT, FEAT, ADR, ...)')
  .option('--json', 'output as JSON (for agent consumption)')
  .action(async (_query, _opts) => {
    // TODO: implement using @freshair129/gks
    console.error('gks search — not yet implemented');
    process.exit(1);
  });

// ── Get ─────────────────────────────────────────────────────────────────────
program
  .command('get <id>')
  .description('Get a single atom by ID (e.g. CONCEPT--TAXONOMY-V2-3)')
  .option('--json', 'output as JSON')
  .action(async (_id, _opts) => {
    // TODO: implement using @freshair129/gks
    console.error('gks get — not yet implemented');
    process.exit(1);
  });

// ── List ─────────────────────────────────────────────────────────────────────
program
  .command('list')
  .description('List all atoms')
  .option('-t, --type <type>', 'filter by atom type')
  .option('--json', 'output as JSON')
  .action(async (_opts) => {
    // TODO: implement using @freshair129/gks
    console.error('gks list — not yet implemented');
    process.exit(1);
  });

// ── Validate ─────────────────────────────────────────────────────────────────
program
  .command('validate')
  .description('Run atom validator (same as npm run msp:validate)')
  .action(async () => {
    // TODO: delegate to packages/msp validator
    console.error('gks validate — not yet implemented');
    process.exit(1);
  });

// ── Index ────────────────────────────────────────────────────────────────────
program
  .command('index')
  .description('Regenerate atomic_index.jsonl')
  .action(async () => {
    // TODO: delegate to packages/msp indexer
    console.error('gks index — not yet implemented');
    process.exit(1);
  });

program.parse();
