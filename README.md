# CBRS Tracker

A small live dashboard for comparing Cerebras (`CBRS`) IPO price discovery across:

- Hyperliquid / trade[XYZ] `xyz:CBRS`
- Polymarket's Cerebras IPO closing market-cap bracket markets
- Official Cerebras IPO share-count and pricing disclosures

The goal is to translate Polymarket's expected closing market capitalization into an implied per-share CBRS value, then compare that value with the live Hyperliquid/trade[XYZ] per-share market.

## What It Shows

- Polymarket-implied expected closing market cap
- Polymarket-implied CBRS share price
- Central Polymarket-implied value ranges
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

## Live Data Behavior

Hyperliquid:

- `xyz:CBRS` price streams over WebSocket.
- `xyz:CBRS` order book streams over WebSocket.
- Volume, open interest, mark, oracle, and fallback book context refresh every 5 seconds.

Polymarket:

- Event metadata comes from Gamma.
- Yes-token midpoints come from the CLOB midpoint endpoint.
- Order-book depth comes from the CLOB books endpoint.
- Polymarket CLOB/Gamma data refreshes every 5 seconds.

The app uses no private API keys.

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
