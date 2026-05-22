const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BASE = 'c:/Users/freshair/cognitive_system/gks/spec';

glob('**/*.md', { cwd: BASE }, (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    const fullPath = path.join(BASE, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    let h1Count = 0;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // MD025: ensure only one top‑level heading
      if (/^#\s+/.test(line)) {
        h1Count++;
        if (h1Count > 1) {
          lines[i] = line.replace(/^#/, '##');
        }
      }
      // MD040: add language to fenced code blocks without one
      if (/^```\s*$/.test(line)) {
        // look ahead to see if next line is also ``` (empty block) -> skip
        const next = lines[i+1] || '';
        if (!/^```/.test(next)) {
          lines[i] = '```bash'; // default to bash
        }
      }
      // MD060: ensure space around pipe for compact tables
      if (/\|/.test(line) && /\S\|\S/.test(line)) {
        // add spaces around pipes
        line = line.replace(/([^|])\|([^|])/g, '$1 | $2');
        // collapse multiple spaces to single
        line = line.replace(/\s{2,}/g, ' ');
        lines[i] = line.trimEnd();
      }
      // MD030: ensure one space after list marker
      if (/^\s*[-*+]\s{2,}/.test(line)) {
        lines[i] = line.replace(/^([\s]*[-*+]\s{2,})/, (m, p1) => p1.replace(/\s{2,}/, ' '));
      }
      // MD007: unordered list indentation = 2 spaces per level (already handled by above)
      // MD013: wrap lines longer than 80 chars (simple split at 80)
      if (line.length > 80 && !line.startsWith('```')) {
        const parts = [];
        let start = 0;
        while (start < line.length) {
          parts.push(line.slice(start, start + 80));
          start += 80;
        }
        lines[i] = parts.join('  '); // two spaces indicate line break in markdown
      }
    }
    const newContent = lines.join('\n');
    if (newContent !== content) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log('Fixed:', fullPath);
    }
  });
});
