import { useEffect, useMemo, useState } from 'react';
import { compare, fmtTyre, parseTyre } from './tyre';

const PRESETS = [
  '175/65R14',
  '185/60R15',
  '195/65R15',
  '205/55R16',
  '215/60R16',
  '225/45R17',
  '225/65R17',
  '235/55R18',
  '245/40R18',
  '265/70R17',
  '275/55R20',
];

const SPEEDS = [40, 50, 60, 80, 100, 110];

function read() {
  try {
    const p = new URLSearchParams(window.location.search);
    return { a: p.get('a') || '205/55R16', b: p.get('b') || '225/45R17' };
  } catch {
    return { a: '205/55R16', b: '225/45R17' };
  }
}

const mm = (n: number) => `${(Math.round(n * 10) / 10).toFixed(1)} mm`;
const inch = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2)}"`;
const signPct = (n: number) => `${n >= 0 ? '+' : ''}${(Math.round(n * 100) / 100).toFixed(2)}%`;

export default function App() {
  const init = read();
  const [a, setA] = useState(init.a);
  const [b, setB] = useState(init.b);
  const [copied, setCopied] = useState(false);

  const ta = useMemo(() => parseTyre(a), [a]);
  const tb = useMemo(() => parseTyre(b), [b]);
  const cmp = useMemo(() => (ta && tb ? compare(ta, tb) : null), [ta, tb]);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('a', a);
      u.searchParams.set('b', b);
      window.history.replaceState(null, '', u.toString());
    } catch {
      /* ignore */
    }
  }, [a, b]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const pctChange = cmp?.diameterDiffPct ?? 0;
  const withinTol = Math.abs(pctChange) <= 3;

  return (
    <div className="app">
      <header>
        <h1>Tyre Size Calculator</h1>
        <p className="tag">
          Compare two tyre sizes and see how the overall diameter, rolling circumference, speedo
          reading and odometer change. A fitment that stays within about 3% of the original diameter
          keeps the speedo honest.
        </p>
      </header>

      <div className="inputs">
        <label className="f">
          <span>Original tyre</span>
          <input
            type="text"
            list="sizes"
            value={a}
            spellCheck={false}
            onChange={(e) => setA(e.target.value)}
            placeholder="e.g. 205/55R16"
          />
          {!ta && a.trim() !== '' && <em className="err">Not a valid tyre size</em>}
        </label>
        <label className="f">
          <span>New tyre</span>
          <input
            type="text"
            list="sizes"
            value={b}
            spellCheck={false}
            onChange={(e) => setB(e.target.value)}
            placeholder="e.g. 225/45R17"
          />
          {!tb && b.trim() !== '' && <em className="err">Not a valid tyre size</em>}
        </label>
        <datalist id="sizes">
          {PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      {cmp && ta && tb ? (
        <>
          <div className={`verdict ${withinTol ? 'ok' : 'warn'}`}>
            <strong>{signPct(pctChange)}</strong>
            <span>
              overall diameter change
              {withinTol
                ? ' — within the ~3% rule of thumb, speedo error stays small.'
                : ' — outside ~3%. Expect a noticeable speedo/odometer error and check guard clearance.'}
            </span>
          </div>

          <div className="cols">
            <div className="col">
              <h2>{fmtTyre(ta)}</h2>
              <dl>
                <div><dt>Sidewall</dt><dd>{mm(cmp.a.sidewallMm)}</dd></div>
                <div><dt>Diameter</dt><dd>{mm(cmp.a.diameterMm)}<i>{inch(cmp.a.diameterIn)}</i></dd></div>
                <div><dt>Circumference</dt><dd>{mm(cmp.a.circumferenceMm)}</dd></div>
                <div><dt>Revs / km</dt><dd>{Math.round(cmp.a.revsPerKm)}</dd></div>
              </dl>
            </div>
            <div className="col">
              <h2>{fmtTyre(tb)}</h2>
              <dl>
                <div><dt>Sidewall</dt><dd>{mm(cmp.b.sidewallMm)}<i>{signPct(((cmp.b.sidewallMm - cmp.a.sidewallMm) / cmp.a.sidewallMm) * 100)}</i></dd></div>
                <div><dt>Diameter</dt><dd>{mm(cmp.b.diameterMm)}<i>{inch(cmp.b.diameterIn)}</i></dd></div>
                <div><dt>Circumference</dt><dd>{mm(cmp.b.circumferenceMm)}</dd></div>
                <div><dt>Revs / km</dt><dd>{Math.round(cmp.b.revsPerKm)}</dd></div>
              </dl>
            </div>
          </div>

          <div className="deltas">
            <div><span>Diameter</span><b>{cmp.diameterDiffMm >= 0 ? '+' : ''}{mm(cmp.diameterDiffMm)}</b></div>
            <div><span>Radius (guard gap)</span><b>{cmp.clearanceTopMm >= 0 ? '+' : ''}{mm(cmp.clearanceTopMm)}</b></div>
            <div><span>Ride height</span><b>{cmp.groundToCentreDiffMm >= 0 ? '+' : ''}{mm(cmp.groundToCentreDiffMm)}</b></div>
            <div><span>Odometer reads</span><b>{signPct(cmp.odometerErrorPct)}</b></div>
          </div>

          <h3 className="th">Speedometer with the new tyre</h3>
          <p className="sub">
            Your speedo is calibrated for the original tyre. With the new size fitted, when it shows…
          </p>
          <table className="speedo">
            <thead>
              <tr><th>Speedo shows</th><th>Actual speed</th><th>Difference</th></tr>
            </thead>
            <tbody>
              {SPEEDS.map((s) => {
                const r = cmp.speedoAt(s);
                return (
                  <tr key={s}>
                    <td>{s} km/h</td>
                    <td>{r.trueSpeed.toFixed(1)} km/h</td>
                    <td className={Math.abs(r.error) < 0.05 ? '' : r.error > 0 ? 'up' : 'down'}>
                      {r.error >= 0 ? '+' : ''}{r.error.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button className="share" onClick={share}>{copied ? 'Link copied' : 'Copy shareable link'}</button>
        </>
      ) : (
        <p className="hint">Enter two tyre sizes like <code>205/55R16</code>.</p>
      )}

      <section className="explainer">
        <h2>How to read a tyre size</h2>
        <p>
          A marking like <b>225/45 R17</b> means a section width of <b>225&nbsp;mm</b>, a sidewall
          height that is <b>45%</b> of that width (the "aspect ratio", so about 101&nbsp;mm here), and
          a <b>17&nbsp;inch</b> wheel. The overall diameter is the wheel diameter plus twice the
          sidewall: 17&nbsp;×&nbsp;25.4 + 2&nbsp;×&nbsp;101 ≈ 634&nbsp;mm.
        </p>
        <h3>Why the diameter matters</h3>
        <p>
          Everything the car measures at the wheel — speed, distance, ABS, traction control, cruise
          control — assumes the tyre that was on it when it left the factory. Fit a tyre with a
          bigger rolling diameter and the car turns fewer revolutions per kilometre, so the speedo
          reads <em>low</em> (you are going faster than it says) and the odometer under-counts. A
          smaller diameter does the opposite.
        </p>
        <h3>The 3% rule</h3>
        <p>
          Tyre and suspension guides generally accept a replacement or "plus-size" fitment if the new
          overall diameter is within about <b>3%</b> of the original. Inside that band the speedo
          error stays within a few km/h and there is usually enough clearance in the wheel arch. Go
          much beyond it and you risk rubbing on full lock or over bumps, a speedo that is out enough
          to matter, and gearing/economy changes.
        </p>
        <h3>Plus-sizing</h3>
        <p>
          "Plus one" means going up an inch in wheel diameter while dropping the aspect ratio to keep
          the overall diameter roughly the same — for example 205/55&nbsp;R16 to 225/45&nbsp;R17.
          More wheel, less sidewall: sharper steering response, but a firmer ride and more risk of
          kerbing a rim.
        </p>
        <h3>Is anything sent to a server?</h3>
        <p>No. The maths runs in your browser and the two sizes are only stored in the page link so you can share a comparison.</p>
        <footer>Tyre Size Calculator · general information · check clearance and load rating before fitting · no sign-up</footer>
      </section>
    </div>
  );
}
