/**
 * Grid-level audit: run the real scene draw at given times and report
 * where specific characters landed — no rendering needed, runs in seconds.
 *
 * Usage:
 *   npx tsx scripts/audit_grid.ts <t1,t2,...> [chars] [rowsCsv]
 *   npx tsx scripts/audit_grid.ts 117.8,159.4 "┌┐└┘·" "29,32"
 *
 * cols=147 / cellW=13 / rows=45 / cellH=24 are the REAL CharStage metrics
 * (GridProbe, ADR-0014). If font/metrics ever change, re-probe first.
 */
import { Grid } from '../src/engine/grid';
import { sceneAt } from '../src/FullPV';

const times = process.argv[2].split(',').map(Number);
const chars = process.argv[3] ?? '┌┐└┘·';
const rowFilter = process.argv[4]
  ? new Set(process.argv[4].split(',').map(Number))
  : null;

const cols = 147, rows = 45;
const g = new Grid(cols, rows);

for (const t of times) {
  g.clear();
  sceneAt(t).draw(g, t, Math.round(t * 30));
  const hits: string[] = [];
  for (let y = 0; y < rows; y++) {
    if (rowFilter && !rowFilter.has(y)) continue;
    for (let x = 0; x < cols; x++) {
      const c = g.ch[y * cols + x];
      if (c !== ' ' && chars.includes(c)) {
        hits.push(`${c}@(${x},${y})ci${g.col[y * cols + x]}`);
      }
    }
  }
  // full row dumps for the requested rows (or rows 3/29 when none given)
  const dumpRows = rowFilter ? [...rowFilter] : [3, 29];
  const dumps = dumpRows
    .filter(y => y >= 0 && y < rows)
    .map(y => {
      let s = '';
      for (let x = 0; x < cols; x++) s += g.ch[y * cols + x];
      return `r${y}: ${s.replace(/ /g, '.').replace(/\.$/, '')}`;
    });
  console.log(`== t=${t} ==`);
  console.log(`hits(${hits.length}): ${hits.slice(0, 80).join(' ')}`);
  for (const d of dumps) console.log(d);
}
