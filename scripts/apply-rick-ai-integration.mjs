// One-time feature-branch integration script. Safe to run repeatedly.
import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/main.jsx', import.meta.url);
let source = await readFile(path, 'utf8');

const importAnchor = 'import FocusTimer from "./Timer.jsx";';
const importLine = 'import RickAiPanel from "./rick-ai/RickAiPanel.jsx";';
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error('Rick IA import anchor not found');
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const closeAnchor = `        )}\n      </div>\n    </ReadOnlyContext.Provider>`;
const panelBlock = `        )}\n        <RickAiPanel\n          data={data}\n          page={page}\n          role={role}\n          setData={setData}\n          notify={notify}\n        />\n      </div>\n    </ReadOnlyContext.Provider>`;
if (!source.includes('<RickAiPanel')) {
  if (!source.includes(closeAnchor)) throw new Error('Rick IA render anchor not found');
  source = source.replace(closeAnchor, panelBlock);
}

await writeFile(path, source);
console.log('Rick IA integrated into src/main.jsx');