# Relative Rotation Graph (Sector Demo)

Simple front-end demo to recreate a sector-based **Relative Rotation Graph (RRG)** similar to your screenshot.

## Run locally

Because this is a static project, you can open `index.html` directly, or run a small server:

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

## What is included

- Four sectors (Pharma, FMCG, Bank, IT) with 7-point historical trails.
- Tail length slider to control how many weeks are shown.
- Animate button that reveals the trail gradually.
- Quadrant coloring and labels: Leading, Improving, Lagging, Weakening.
- Data table with latest ratio/momentum and sample price/% change.

## Next steps

- Replace sample trail data with live market data.
- Add multi-select sector filtering.
- Add export button (CSV/PNG).
- Add benchmark-relative calculations from your own backend.
