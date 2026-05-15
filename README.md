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
- Hyperliquid order-book depth, spread, 24h volume, open interest, and funding
- Polymarket total volume, 24h volume, bracket-level depth, and liquidity
- Polymarket trade monitor with large-trade highlighting and bracket-level pressure
- IPO terms and official filing context

## Methodology

The dashboard combines two Polymarket event pages because they cover different strike ranges:

- `cerebras-ipo-closing-market-cap`
- `cerebras-ipo-closing-market-cap-539`

The lower-strike page is used for brackets below `$50B`; the upper-strike page is used for `$50B+` brackets. The overlapping `$50B` boundary markets are used to anchor the probability mass below and above `$50B`, then the individual bracket prices allocate probability within each side.

The headline CBRS value is a midpoint model:

```text
E[Polymarket closing market cap] / official post-offering shares
```

The current official share count used by the app is `219,295,148`, based on the May 14 S-8 reoffer prospectus: `30.0m` Class A shares, `185.613148m` Class B shares, and `3.682m` Class N shares. The `30.0m` offered shares are also shown separately as the base day-one public float, equal to about `13.7%` of the latest official share count before any underwriter option exercise. If the 4.5m-share option is fully exercised, option-adjusted IPO float is `34.5m` shares, or about `15.4%` of option-adjusted shares.

The methodology panel also includes denominator checks. These answer "what happens to the implied per-share price if more shares are included?" They do not mean those shares are day-one float, and they do not drive the headline comparison. For example, the listed-dilutive scenario includes options, RSUs, PRSUs, warrants, and post-December Class N shares listed in the S-1/A; it is a what-if denominator, not a statement that all of those shares will trade on day one.

For the chart, historical Polymarket-implied CBRS values are reconstructed from public CLOB Yes-token price history for every required bracket and `$50B` anchor market. The app uses the highest-density accepted public history shape currently observed for this endpoint: 14 days at 5-minute fidelity. A historical point is emitted only after all required Yes tokens have historical coverage; current live prices are not backfilled into old points.

Chart controls select candle interval, not the visible date range. Hyperliquid candles are fetched at the selected native interval (`1m`, `5m`, `15m`, or `1h`), and the Polymarket overlay is bucketed to that interval. The x-axis displays compact local time/date labels. The chart supports normal wheel/pinch zooming and drag panning; use `Fit` to reset the view to all loaded data.

Hyperliquid `candleSnapshot` only exposes the most recent 5000 candles for a given interval, so the app requests native candles per interval. For `xyz:CBRS`, `1m` history is shorter than `5m`, `15m`, or `1h` history; coarser intervals currently reach the earliest returned May 1 candles. Polymarket chart history is shorter because the CLOB price-history endpoint rejects longer high-density windows; the app keeps the two sources separate.

The app also summarizes the Polymarket resolution rules: the markets resolve on Cerebras' market capitalization at the official first-day closing price, using official company filings/disclosures for share count and the primary exchange official listing page for closing price. Exact boundary values resolve to the higher bracket, and if no IPO occurs by June 30, 2026 at 11:59 PM ET, the no-IPO-before-July market resolves Yes.

Every displayed market-cap bracket also shows its exact implied first-day closing CBRS price range under the current official denominator:

```text
bracket market-cap boundary / 219,295,148 latest official shares
```

Those bracket price ranges are deterministic filing-based mappings, not extra model output.

After Polymarket resolves, the app treats the winning market as a range, not an exact closing price. The displayed bracket midpoint is only the center of that bucket; the exact first-day close is pulled separately from Nasdaq's quote feed when available.

## Live Data Behavior

Hyperliquid:

- `xyz:CBRS` price streams over WebSocket.
- `xyz:CBRS` order book streams over WebSocket.
- Volume, open interest, mark, oracle, and fallback book context refresh every 5 seconds.

Polymarket:

- Event metadata comes from Gamma.
- Yes-token midpoints, matched trades, and book changes stream from the official CLOB market WebSocket when connected.
- REST CLOB midpoint/book endpoints remain as a 5-second fallback and reconciliation layer.
- Wallet-attributed recent bracket trades come from the public Polymarket Data API `/trades` endpoint.
- Historical chart points come from the CLOB price-history endpoint.
- Gamma volume/liquidity fields and wallet-attributed trades refresh every 5 seconds.

The trade monitor normalizes trade direction to the Yes side. `BUY Yes` and `SELL No` count as buying pressure for a bracket; `SELL Yes` and `BUY No` count as selling pressure. This makes a Polymarket pump/dump easier to explain even when the raw trade happened on the No token. Live CLOB trades are fastest but do not include wallet/profile fields; wallet-linked attribution appears when the Data API updates. The tape is scrollable and highlights large prints.

The top Polymarket-implied CBRS value is a robust quote/trade blend, not a raw midpoint and not last-trade-only. Tight, deep books follow the live quote midpoint more closely. Wide, shallow, quote-only, or trade-divergent moves are damped toward the latest trade/Gamma price so thin top-of-book orders cannot fully drive the headline. The live quote-change feed exists to explain non-trade moves.

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

## Deploy

The app is ready for Vercel. It does not need API keys and can be deployed from a local checkout without connecting a public GitHub repository.

Recommended private deploy path:

```bash
npm install
npm run build
npx vercel deploy --prod
```

Use Vercel's default Vite settings:

- Build command: `npm run build`
- Output directory: `dist`

The included `vercel.json` proxies these public endpoints in production:

- `/polymarket-gamma/*` -> Polymarket Gamma
- `/polymarket-clob/*` -> Polymarket CLOB
- `/polymarket-data/*` -> Polymarket Data API
- `/hyperliquid-info` -> Hyperliquid Info API
- `/nasdaq-api/*` -> Nasdaq quote API for the official close display

The live WebSocket connections go directly to Polymarket CLOB and Hyperliquid. `.vercelignore` excludes local task notes, `node_modules`, and build output from the deployment upload.

## Tech

- Vite
- React
- TypeScript
- Hyperliquid Info API and WebSocket
- Polymarket Gamma and CLOB APIs
