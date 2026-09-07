# tyre-size-calculator

Compare two tyre sizes (e.g. `205/55R16` vs `225/45R17`) and see the change in
overall diameter, sidewall height, rolling circumference, revs per km, the
speedometer reading at a range of speeds, and the odometer error. Flags whether
the fitment stays within the ~3% diameter rule. Both sizes live in the URL.

**Live:** https://tyre-size-calculator.correia95.workers.dev/

## Stack

- React 18 + TypeScript + Vite, no runtime deps beyond React
- Static-assets Cloudflare Worker

## Engine

[`src/tyre.ts`](src/tyre.ts): `parseTyre(str)` → `{ width, aspect, rim }`;
`derive(tyre)` → sidewall / diameter / circumference / revs per km/mile;
`compare(a, b)` → diameter diff (mm and %), `speedoAt(kmh)`, odometer error,
clearance change.

Verified in Node: 225/45R17 → 634.3 mm; 245/40R18 → 653.2 mm; the pair is
+2.98% diameter and reads 103.0 km/h true at an indicated 100.

## Develop / deploy

```bash
npm install
npm run dev
npm run deploy
```
