const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SPEC_ROOT = 'c:/Users/freshair/cognitive_system/gks/spec';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  let inFence = false;
  let fenceChar = '';
  let h1Seen = false;
  const newLines = [];
  for (let line of lines) {
    // Detect fenced code block start/end
    const fenceMatch = line.match(/^(`{3,}|~{3,})(\w*)/);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceMatch[1];
        // Add language if missing
        if (!fenceMatch[2]) {
          line = `${fenceChar} markdown` + (line.length > fenceMatch[1].length ? line.slice(fenceMatch[1].length) : '');
        }
      } else {
        // Closing fence
        if (line.startsWith(fenceChar)) {
          inFence = false;
          fenceChar = '';
        }
      }
      newLines.push(line);
      continue;
    }
    if (!inFence) {
      // Demote extra H1 headings (keep only the first one)
      if (/^#\s/.test(line)) {
        if (h1Seen) {
          line = line.replace(/^#\s/, '## ');
        } else {
          h1Seen = true;
        }
      }
      // Wrap lines longer than 80 characters (skip tables and list items)
      if (line.length > 80 && !/^\s*\|/.test(line) && !/^\s*[-*+]\s/.test(line)) {
        while (line.length > 80) {
          const chunk = line.slice(0, 80);
          newLines.push(chunk);
          line = line.slice(80);
        }
        if (line.length) newLines.push(line);
        continue;
      }
    }
    newLines.push(line);
  }
  const fixed = newLines.join('\n');
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log('Fixed', filePath);
  }
}

// Use glob.sync for simplicity
const files = glob.sync('**/*.md', { cwd: SPEC_ROOT, absolute: true });
files.forEach(fixFile);
console.log('All markdown files processed.');
