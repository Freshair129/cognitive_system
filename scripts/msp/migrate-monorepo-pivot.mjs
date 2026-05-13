#!/usr/bin/env node
/**
 * Agentic Monorepo Pivot — Brain Unification Migration.
 * 
 * Materialises the canonical root gks/ by merging package-level atom vaults.
 * 
 * Responsibilities:
 * 1. Move atoms: packages/{gks,msp}/gks/<type>/<id>.md → gks/<type>/<id>.md
 * 2. Move atomic_contract.yaml: packages/msp/.brain/msp/LLM_Contract/atomic_contract.yaml → msp/LLM_Contract/atomic_contract.yaml
 * 3. Delete old indexes: packages/{gks,msp}/gks/00_index/atomic_index.jsonl
 * 4. Rewrite path strings in all markdown files.
 * 
 * Usage:
 *   node scripts/msp/migrate-monorepo-pivot.mjs --dry-run
 *   node scripts/msp/migrate-monorepo-pivot.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), '..', '..');
const DRY_RUN = process.argv.includes('--dry-run');

const PATH_RENAMES = [
  // Atom vaults
  ['packages/gks/gks/', 'gks/'],
  ['packages/msp/gks/', 'gks/'],
  // LLM Contract
  ['packages/msp/.brain/msp/LLM_Contract/', 'msp/LLM_Contract/'],
  // Scripts (to be moved in Phase C, but refs updated now)
  ['packages/msp/scripts/msp/', 'scripts/msp/'],
  ['packages/gks/scripts/', 'scripts/msp/'],
  // Docs (to be moved in Phase C)
  ['packages/gks/docs/', 'docs/gks/'],
  ['packages/msp/docs/', 'docs/msp/'],
  // Specific files
  ['ULTRAPLAN--AGENTIC-MONOREPO-PIVOT.md', 'docs/plans/ULTRAPLAN--AGENTIC-MONOREPO-PIVOT.md'],
];

const stats = {
  atomsMoved: 0,
  pathRefsRewritten: 0,
  filesEdited: new Set(),
  dirsDeleted: 0,
};

function log(...args) {
  console.log(DRY_RUN ? '[dry-run]' : '[migrate]', ...args);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles(root) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      if (err.code === 'ENOENT') return;
      throw err;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === '.claude') continue;
        await walk(full);
      } else if (e.isFile() && e.name.endsWith('.md')) {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

async function moveAtomVaults() {
  const sources = ['packages/gks/gks', 'packages/msp/gks'];
  const targetRoot = path.join(REPO_ROOT, 'gks');

  for (const src of sources) {
    const srcPath = path.join(REPO_ROOT, src);
    if (!(await exists(srcPath))) continue;

    const types = await fs.readdir(srcPath, { withFileTypes: true });
    for (const type of types) {
      if (!type.isDirectory()) continue;
      if (type.name === '00_index') {
        log(`skip index dir: ${path.join(src, type.name)} (will be regenerated)`);
        continue;
      }

      const typeSrcPath = path.join(srcPath, type.name);
      const typeDestPath = path.join(targetRoot, type.name);

      const atoms = await fs.readdir(typeSrcPath);
      for (const atom of atoms) {
        if (!atom.endsWith('.md')) continue;

        const atomSrc = path.join(typeSrcPath, atom);
        const atomDest = path.join(typeDestPath, atom);

        if (!DRY_RUN) {
          await fs.mkdir(typeDestPath, { recursive: true });
          await fs.rename(atomSrc, atomDest);
        }
        log(`move atom: ${path.relative(REPO_ROOT, atomSrc)} -> ${path.relative(REPO_ROOT, atomDest)}`);
        stats.atomsMoved++;
      }
    }
  }
}

async function moveContract() {
  const src = path.join(REPO_ROOT, 'packages/msp/.brain/msp/LLM_Contract/atomic_contract.yaml');
  const dest = path.join(REPO_ROOT, 'msp/LLM_Contract/atomic_contract.yaml');

  if (await exists(src)) {
    log(`move contract: ${path.relative(REPO_ROOT, src)} -> ${path.relative(REPO_ROOT, dest)}`);
    if (!DRY_RUN) {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.rename(src, dest);
    }
    stats.atomsMoved++; // just count as a "move"
  } else {
    log(`warn: contract not found at ${path.relative(REPO_ROOT, src)}`);
  }
}

async function rewriteReferences() {
  const mdFiles = await listMarkdownFiles(REPO_ROOT);
  for (const file of mdFiles) {
    const original = await fs.readFile(file, 'utf8');
    let updated = original;

    for (const [oldPath, newPath] of PATH_RENAMES) {
      // Use split/join for simple replacement to avoid regex escape issues
      const parts = updated.split(oldPath);
      if (parts.length > 1) {
        stats.pathRefsRewritten += (parts.length - 1);
        updated = parts.join(newPath);
        stats.filesEdited.add(file);
      }
    }

    if (updated !== original) {
      if (!DRY_RUN) await fs.writeFile(file, updated, 'utf8');
    }
  }
}

async function cleanup() {
  const sources = ['packages/gks/gks', 'packages/msp/gks'];
  for (const src of sources) {
    const srcPath = path.join(REPO_ROOT, src);
    if (!(await exists(srcPath))) continue;

    if (!DRY_RUN) {
      await fs.rm(srcPath, { recursive: true, force: true });
    }
    log(`deleted directory: ${src}`);
    stats.dirsDeleted++;
  }
}

async function main() {
  log(`mode: ${DRY_RUN ? 'DRY RUN' : 'APPLY'}`);
  log(`repo root: ${REPO_ROOT}`);

  await moveAtomVaults();
  await moveContract();
  await rewriteReferences();
  await cleanup();

  console.log('\nSummary:');
  console.log(`  atoms/files moved:     ${stats.atomsMoved}`);
  console.log(`  path refs rewritten:   ${stats.pathRefsRewritten}`);
  console.log(`  markdown files edited: ${stats.filesEdited.size}`);
  console.log(`  directories deleted:   ${stats.dirsDeleted}`);

  if (DRY_RUN) {
    console.log('\n(no files were modified - pass without --dry-run to apply)');
  }
}

main().catch(err => {
  console.error('migration failed:', err);
  process.exit(1);
});
