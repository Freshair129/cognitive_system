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
        const next = lines[i+1] || '';
        if (!/^```/.test(next)) {
          lines[i] = '```bash';
        }
      }
      // MD060: ensure space around pipe for compact tables
      if (/\|/.test(line) && /\S\|\S/.test(line)) {
        line = line.replace(/([^|])\|([^|])/g, '$1 | $2');
        line = line.replace(/\s{2,}/g, ' ');
        lines[i] = line.trimEnd();
      }
      // MD030: one space after list marker
      if (/^\s*[-*+]\s{2,}/.test(line)) {
        lines[i] = line.replace(/^([\s]*[-*+]\s{2,})/, (m, p1) => p1.replace(/\s{2,}/, ' '));
      }
      // MD013: wrap long lines (simple split at 80, keep code blocks intact)
      if (line.length > 80 && !line.startsWith('```')) {
        const parts = [];
        let start = 0;
        while (start < line.length) {
          parts.push(line.slice(start, start + 80));
          start += 80;
        }
        lines[i] = parts.join('  ');
      }
    }
    const newContent = lines.join('\n');
    if (newContent !== content) {
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log('Fixed:', fullPath);
    }
  });
});
