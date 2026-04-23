# Relative Rotation Graph (RRG) Starter

This app now supports larger sector sets and lets you load your own real JSON data directly in the UI.

## What is real vs sample right now?

- `data.json` in this repository is **sample/demo data**.
- The app **does work with real data** if you provide the same JSON structure (via file upload control or by replacing `data.json`).

## Features

- RRG quadrants (Leading, Improving, Lagging, Weakening)
- Multiple sectors (expanded demo dataset)
- Tail-length slider
- Weekly/daily timeframe switch
- Optional partial-candle extension in daily mode
- Zone visibility toggle
- Animation
- Checkbox-based sector visibility controls
- Upload your own JSON data file from the UI

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## JSON format for real data

```json
{
  "asOfDate": "2026-04-17",
  "benchmark": "NIFTY 50",
  "benchmarks": ["NIFTY 50", "NIFTY 500"],
  "series": [
    {
      "name": "NIFTY BANK",
      "color": "#1f77ff",
      "price": 56565.70,
      "pctChange": -2.11,
      "points": [
        { "date": "2026-03-06", "ratio": 101.80, "momentum": 99.10 },
        { "date": "2026-03-13", "ratio": 102.20, "momentum": 99.50 }
      ]
    }
  ]
}
```

### Notes

- Keep at least 2 `points` per sector.
- Dates should be ISO format (`YYYY-MM-DD`).
- RS-Ratio and RS-Momentum should already be computed before loading.
