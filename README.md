# CBRS Tracker

A small live dashboard for comparing Cerebras (`CBRS`) IPO price discovery across:

- Hyperliquid / trade[XYZ] `xyz:CBRS`
- Polymarket's Cerebras IPO closing market-cap bracket markets
- Official Cerebras IPO share-count and pricing disclosures

The goal is to translate Polymarket's expected first-day closing market capitalization into an implied first-day closing per-share CBRS value, then compare that value with the live Hyperliquid/trade[XYZ] per-share market.

## What It Shows

- Polymarket-implied expected first-day closing market cap
- Polymarket-implied first-day closing CBRS share price
- Central Polymarket-implied closing value ranges
- Live Hyperliquid `xyz:CBRS` price
- Hyperliquid premium/discount versus Polymarket
- Hyperliquid order-book depth
- Polymarket bracket-level depth, volume, and liquidity
- IPO terms and official filing context

## Methodology

The dashboard combines two Polymarket event pages because they cover different strike ranges:

- `cerebras-ipo-closing-market-cap`
- `cerebras-ipo-closing-market-cap-539`

The lower-strike page is used for brackets below `$50B`; the upper-strike page is used for `$50B+` brackets. The overlapping `$50B` boundary markets are used to anchor the probability mass below and above `$50B`, then the individual bracket prices allocate probability within each side.

The definitive CBRS value is:

```text
E[Polymarket closing market cap] / official post-offering shares
```

The current official post-offering share count used by the app is `215,228,541`, based on `30.0m` offered Class A shares plus `185.228541m` Class B shares from the latest checked S-1/A context. Alternate official share-count views are shown only as methodology audit rows; they do not drive the headline comparison.

For the chart, historical Polymarket-implied CBRS values are reconstructed from public CLOB Yes-token price history for every required bracket and `$50B` anchor market. The app uses the highest-density accepted public history shape currently observed for this endpoint: 14 days at 5-minute fidelity. A historical point is emitted only after all required Yes tokens have historical coverage; current live prices are not backfilled into old points.

Chart controls select candle aggregation interval, not the visible date range. Hyperliquid candles and the Polymarket overlay are bucketed to the selected interval (`1m`, `5m`, `15m`, or `1h`) while the x-axis displays compact local time/date labels. The chart supports normal wheel/pinch zooming and drag panning; use `Fit` to reset the view to all loaded data.

The app also summarizes the Polymarket resolution rules: the markets resolve on Cerebras' market capitalization at the official first-day closing price, using official company filings/disclosures for share count and the primary exchange official listing page for closing price. Exact boundary values resolve to the higher bracket, and if no IPO occurs by June 30, 2026 at 11:59 PM ET, the no-IPO-before-July market resolves Yes.

## Live Data Behavior

Hyperliquid:

- `xyz:CBRS` price streams over WebSocket.
- `xyz:CBRS` order book streams over WebSocket.
- Volume, open interest, mark, oracle, and fallback book context refresh every 5 seconds.

Polymarket:

- Event metadata comes from Gamma.
- Yes-token midpoints come from the CLOB midpoint endpoint.
- Order-book depth comes from the CLOB books endpoint.
- Historical chart points come from the CLOB price-history endpoint.
- Polymarket CLOB/Gamma data refreshes every 5 seconds.

The app uses no private API keys.

## Privacy

The local setup instructions are for any user who clones the repo. Running the app does not read local files, wallet data, browser cookies, environment variables, or private account data. It only requests public market data from Polymarket and Hyperliquid/trade[XYZ] through the local Vite dev server proxy.

Those public API providers may still receive ordinary network metadata from whoever runs the app, such as IP address and user agent. The repo itself does not include telemetry, analytics, secrets, or user-specific data.

## Caveats

- This is an informational market-monitoring tool, not investment advice.
- Polymarket brackets are separate binary markets, not one perfectly normalized distribution, so the app documents and displays the blended distribution it uses.
- The value ranges are bracket-derived quantiles, not statistical confidence intervals.
- The open-ended `>= $100B` bracket is capped at `$110B` for quantile math.
- Filing context should be rechecked when a final prospectus or updated official disclosure appears.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

Build:

```bash
npm run build
```

## Tech

- Vite
- React
- TypeScript
- Hyperliquid Info API and WebSocket
- Polymarket Gamma and CLOB APIs
