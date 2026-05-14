import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Activity, AlertTriangle, BarChart3, CircleDollarSign, RefreshCw, Scale, Wifi } from "lucide-react";
import "./styles.css";

type PolymarketEvent = {
  slug: string;
  title: string;
  markets: PolymarketMarket[];
};

type PolymarketMarket = {
  question: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  clobTokenIds: string;
  bestBid: number | null;
  bestAsk: number | null;
  lastTradePrice: number | null;
  volumeNum: number | null;
  volume24hr: number | null;
  volume24hrClob: number | null;
  volumeClob: number | null;
  liquidityNum: number | null;
  liquidityClob: number | null;
};

type BookLevel = {
  price: string;
  size: string;
};

type PolymarketBook = {
  asset_id: string;
  bids: BookLevel[];
  asks: BookLevel[];
  timestamp: string;
};

type PolymarketDepth = {
  bidDepth2c: number;
  askDepth2c: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
};

type HyperLevel = {
  px: string;
  sz: string;
  n: number;
};

type HyperBook = {
  coin: string;
  time: number;
  levels: [HyperLevel[], HyperLevel[]];
};

type HyperCtx = {
  funding?: string;
  openInterest?: string;
  prevDayPx?: string;
  dayNtlVlm?: string;
  premium?: string;
  oraclePx?: string;
  markPx?: string;
  midPx?: string;
  dayBaseVlm?: string;
};

type HyperQuality = {
  dayVolume: number | null;
  dayBaseVolume: number | null;
  openInterest: number | null;
  markPrice: number | null;
  oraclePrice: number | null;
  prevDayPrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  bidDepth1Pct: number;
  askDepth1Pct: number;
  bidLevels: Array<{ price: number; size: number; notional: number }>;
  askLevels: Array<{ price: number; size: number; notional: number }>;
  bookTime: number | null;
};

type MarketBracket = {
  id: string;
  label: string;
  low: number | null;
  high: number | null;
  midpoint: number;
  yesPrice: number;
  source: "Lower strikes" | "Upper strikes";
  tokenId: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
};

type ShareBasis = {
  id: string;
  label: string;
  shares: number;
  note: string;
};

type PricePoint = {
  time: number;
  polymarket: number;
  hyperliquid: number | null;
};

type DashboardState = {
  lowerEvent: PolymarketEvent | null;
  upperEvent: PolymarketEvent | null;
  polymarketMidpoints: Record<string, number>;
  polymarketDepth: Record<string, PolymarketDepth>;
  hyperPrice: number | null;
  hyperQuality: HyperQuality | null;
  hyperStatus: "connecting" | "live" | "polling" | "stale" | "error";
  polymarketStatus: "loading" | "live" | "error";
  lastUpdated: number | null;
  error: string | null;
};

const LOWER_SLUG = "cerebras-ipo-closing-market-cap";
const UPPER_SLUG = "cerebras-ipo-closing-market-cap-539";
const HYPER_COIN = "xyz:CBRS";
const LIVE_REFRESH_MS = 5000;
const IPO_OFFER_PRICE = 185;
const IPO_OFFERED_SHARES = 30_000_000;
const IPO_OVERALLOTMENT_SHARES = 4_500_000;
const OFFICIAL_POST_OFFERING_SHARES = 215_228_541;
const OFFICIAL_POST_OFFERING_WITH_OPTION_SHARES = 219_728_541;

const SHARE_BASES: ShareBasis[] = [
  {
    id: "official-basic",
    label: "Official post-offering",
    shares: OFFICIAL_POST_OFFERING_SHARES,
    note: "30.0m Class A offered + 185.228541m Class B, latest S-1/A filed May 11, 2026."
  },
  {
    id: "official-overallotment",
    label: "With over-allotment",
    shares: OFFICIAL_POST_OFFERING_WITH_OPTION_SHARES,
    note: "Official post-offering share count if underwriters exercise the 4.5m share option in full."
  },
  {
    id: "official-potential-diluted",
    label: "Potential diluted",
    shares: 308_116_278,
    note: "Official post-offering shares plus specifically listed options, RSUs, PRSUs, warrants, and post-Dec Class N; excludes future 2026 plan/ESPP reserve pools."
  }
];

const emptyHyperQuality = (): HyperQuality => ({
  dayVolume: null,
  dayBaseVolume: null,
  openInterest: null,
  markPrice: null,
  oraclePrice: null,
  prevDayPrice: null,
  bestBid: null,
  bestAsk: null,
  spread: null,
  bidDepth1Pct: 0,
  askDepth1Pct: 0,
  bidLevels: [],
  askLevels: [],
  bookTime: null
});

const formatUsd = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);

const formatCompactUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 1
  }).format(value);

const formatMaybeUsd = (value: number | null | undefined, digits = 2) =>
  value == null || !Number.isFinite(value) ? "n/a" : formatUsd(value, digits);

const formatMaybeCompactUsd = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? "n/a" : formatCompactUsd(value);

const formatMaybeNumber = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? "n/a"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

const parseJsonArray = <T,>(value: string): T[] => {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
};

const parseBracket = (question: string) => {
  const less = question.match(/less than \$(\d+)B/i);
  if (less) return { low: null, high: Number(less[1]) * 1e9 };

  const between = question.match(/between \$(\d+)B and \$(\d+)B/i);
  if (between) return { low: Number(between[1]) * 1e9, high: Number(between[2]) * 1e9 };

  const atLeast = question.match(/at least \$(\d+)B/i);
  if (atLeast) return { low: Number(atLeast[1]) * 1e9, high: null };

  return null;
};

const midpointFor = (low: number | null, high: number | null) => {
  if (low == null && high != null) return high / 2;
  if (low != null && high == null) return low + 5e9;
  if (low != null && high != null) return (low + high) / 2;
  return 0;
};

const boundsFor = (row: Pick<MarketBracket, "low" | "high">) => {
  if (row.low == null && row.high != null) return { low: 0, high: row.high };
  if (row.low != null && row.high == null) return { low: row.low, high: row.low + 10e9 };
  if (row.low != null && row.high != null) return { low: row.low, high: row.high };
  return { low: 0, high: 0 };
};

const marketToBracket = (
  market: PolymarketMarket,
  source: MarketBracket["source"],
  midpoints: Record<string, number>,
  depth: Record<string, PolymarketDepth>
): MarketBracket | null => {
  if (/not IPO before July/i.test(market.question)) return null;
  const parsed = parseBracket(market.question);
  if (!parsed) return null;
  const outcomes = parseJsonArray<string>(market.outcomes);
  const prices = parseJsonArray<string>(market.outcomePrices).map(Number);
  const tokens = parseJsonArray<string>(market.clobTokenIds);
  const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
  const tokenId = tokens[yesIndex] ?? "";
  const yesPrice = midpoints[tokenId] ?? prices[yesIndex] ?? 0;
  const bookDepth = depth[tokenId];
  return {
    id: `${source}-${market.slug}`,
    label: labelFor(parsed.low, parsed.high),
    low: parsed.low,
    high: parsed.high,
    midpoint: midpointFor(parsed.low, parsed.high),
    yesPrice,
    source,
    tokenId,
    bid: bookDepth?.bestBid ?? market.bestBid,
    ask: bookDepth?.bestAsk ?? market.bestAsk,
    last: market.lastTradePrice
    ,
    volume24h: Number(market.volume24hrClob ?? market.volume24hr ?? 0),
    volumeTotal: Number(market.volumeClob ?? market.volumeNum ?? 0),
    liquidity: Number(market.liquidityClob ?? market.liquidityNum ?? 0)
  };
};

const labelFor = (low: number | null, high: number | null) => {
  if (low == null && high != null) return `<${formatCompactUsd(high)}`;
  if (low != null && high == null) return `>=${formatCompactUsd(low)}`;
  if (low != null && high != null) return `${formatCompactUsd(low)}-${formatCompactUsd(high)}`;
  return "Unknown";
};

const getBrackets = (
  lowerEvent: PolymarketEvent | null,
  upperEvent: PolymarketEvent | null,
  midpoints: Record<string, number>,
  depth: Record<string, PolymarketDepth>
) => {
  const lower = lowerEvent?.markets.map((market) => marketToBracket(market, "Lower strikes", midpoints, depth)).filter(Boolean) as
    | MarketBracket[]
    | undefined;
  const upper = upperEvent?.markets.map((market) => marketToBracket(market, "Upper strikes", midpoints, depth)).filter(Boolean) as
    | MarketBracket[]
    | undefined;
  return { lower: lower ?? [], upper: upper ?? [] };
};

const normalize = (rows: MarketBracket[]) => {
  const total = rows.reduce((sum, row) => sum + Math.max(row.yesPrice, 0), 0);
  if (!total) return rows.map((row) => ({ ...row, probability: 0 }));
  return rows.map((row) => ({ ...row, probability: Math.max(row.yesPrice, 0) / total }));
};

const buildDistribution = (lower: MarketBracket[], upper: MarketBracket[]) => {
  const under50Anchor = upper.find((row) => row.low == null && row.high === 50e9)?.yesPrice ?? null;
  const atLeast50Anchor = lower.find((row) => row.low === 50e9 && row.high == null)?.yesPrice ?? null;
  const lowerSubBrackets = lower.filter((row) => row.high !== null && row.high <= 50e9);
  const upperSubBrackets = upper.filter((row) => row.low !== null && row.low >= 50e9);

  if (under50Anchor == null || atLeast50Anchor == null || lowerSubBrackets.length === 0 || upperSubBrackets.length === 0) {
    return normalize([...lowerSubBrackets, ...upperSubBrackets]).map((row) => ({
      ...row,
      probability: row.probability,
      method: "Fallback normalized raw Yes prices"
    }));
  }

  const anchorTotal = under50Anchor + atLeast50Anchor;
  const under50Mass = anchorTotal ? under50Anchor / anchorTotal : 0;
  const atLeast50Mass = anchorTotal ? atLeast50Anchor / anchorTotal : 0;
  const lowerTotal = lowerSubBrackets.reduce((sum, row) => sum + row.yesPrice, 0);
  const upperTotal = upperSubBrackets.reduce((sum, row) => sum + row.yesPrice, 0);

  return [
    ...lowerSubBrackets.map((row) => ({
      ...row,
      probability: lowerTotal ? (row.yesPrice / lowerTotal) * under50Mass : 0,
      method: "Allocated within P(<$50B)"
    })),
    ...upperSubBrackets.map((row) => ({
      ...row,
      probability: upperTotal ? (row.yesPrice / upperTotal) * atLeast50Mass : 0,
      method: "Allocated within P(>=$50B)"
    }))
  ].sort((a, b) => a.midpoint - b.midpoint);
};

const expectedMarketCap = (distribution: Array<MarketBracket & { probability: number }>) =>
  distribution.reduce((sum, row) => sum + row.midpoint * row.probability, 0);

const distributionQuantile = (distribution: Array<MarketBracket & { probability: number }>, target: number) => {
  const normalizedTarget = Math.min(Math.max(target, 0), 1);
  let cumulative = 0;
  for (const row of distribution) {
    const { low, high } = boundsFor(row);
    const next = cumulative + row.probability;
    if (normalizedTarget <= next && row.probability > 0) {
      const withinBracket = (normalizedTarget - cumulative) / row.probability;
      return low + (high - low) * Math.min(Math.max(withinBracket, 0), 1);
    }
    cumulative = next;
  }
  const last = distribution.at(-1);
  return last ? boundsFor(last).high : 0;
};

async function fetchEvent(slug: string) {
  const response = await fetch(`/polymarket-gamma/events/slug/${slug}`);
  if (!response.ok) throw new Error(`Polymarket ${slug} returned ${response.status}`);
  return (await response.json()) as PolymarketEvent;
}

function getYesTokenIds(events: PolymarketEvent[]) {
  return events.flatMap((event) =>
    event.markets.flatMap((market) => {
      const outcomes = parseJsonArray<string>(market.outcomes);
      const tokens = parseJsonArray<string>(market.clobTokenIds);
      const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
      return tokens[yesIndex] ? [tokens[yesIndex]] : [];
    })
  );
}

async function fetchPolymarketMidpoints(tokenIds: string[]) {
  if (tokenIds.length === 0) return {};
  const response = await fetch("/polymarket-clob/midpoints", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tokenIds.map((token_id) => ({ token_id })))
  });
  if (!response.ok) throw new Error(`Polymarket CLOB midpoints returned ${response.status}`);
  const raw = (await response.json()) as Record<string, string>;
  return Object.fromEntries(Object.entries(raw).map(([tokenId, value]) => [tokenId, Number(value)]).filter(([, value]) => Number.isFinite(value)));
}

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function summarizePolymarketBook(book: PolymarketBook): PolymarketDepth {
  const bids = book.bids
    .map((level) => ({ price: Number(level.price), size: Number(level.size) }))
    .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.size));
  const asks = book.asks
    .map((level) => ({ price: Number(level.price), size: Number(level.size) }))
    .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.size));
  const bestBid = bids.length ? Math.max(...bids.map((level) => level.price)) : null;
  const bestAsk = asks.length ? Math.min(...asks.map((level) => level.price)) : null;
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;
  const bidFloor = bestBid == null ? null : Math.max(bestBid - 0.02, 0);
  const askCeiling = bestAsk == null ? null : Math.min(bestAsk + 0.02, 1);
  const bidDepth2c = bidFloor == null ? 0 : bids.filter((level) => level.price >= bidFloor).reduce((sum, level) => sum + level.price * level.size, 0);
  const askDepth2c = askCeiling == null ? 0 : asks.filter((level) => level.price <= askCeiling).reduce((sum, level) => sum + level.price * level.size, 0);
  return { bestBid, bestAsk, spread, bidDepth2c, askDepth2c };
}

async function fetchPolymarketBooks(tokenIds: string[]) {
  if (tokenIds.length === 0) return {};
  const response = await fetch("/polymarket-clob/books", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(tokenIds.map((token_id) => ({ token_id })))
  });
  if (!response.ok) throw new Error(`Polymarket CLOB books returned ${response.status}`);
  const books = (await response.json()) as PolymarketBook[];
  return Object.fromEntries(books.map((book) => [book.asset_id, summarizePolymarketBook(book)]));
}

async function fetchHyperMid() {
  const response = await fetch("/hyperliquid-info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "allMids", dex: "xyz" })
  });
  if (!response.ok) throw new Error(`Hyperliquid returned ${response.status}`);
  const mids = (await response.json()) as Record<string, string>;
  const value = Number(mids[HYPER_COIN]);
  if (!Number.isFinite(value)) throw new Error("Hyperliquid response did not include xyz:CBRS");
  return value;
}

function summarizeHyperBook(
  book: HyperBook,
  mid: number | null
): Pick<HyperQuality, "bestBid" | "bestAsk" | "spread" | "bidDepth1Pct" | "askDepth1Pct" | "bidLevels" | "askLevels" | "bookTime"> {
  const bids = book.levels[0]
    .map((level) => ({ price: Number(level.px), size: Number(level.sz) }))
    .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.size));
  const asks = book.levels[1]
    .map((level) => ({ price: Number(level.px), size: Number(level.sz) }))
    .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.size));
  const bestBid = bids.length ? Math.max(...bids.map((level) => level.price)) : null;
  const bestAsk = asks.length ? Math.min(...asks.map((level) => level.price)) : null;
  const bookMid = mid ?? (bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null);
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;
  const bidFloor = bookMid == null ? null : bookMid * 0.99;
  const askCeiling = bookMid == null ? null : bookMid * 1.01;
  const bidDepth1Pct = bidFloor == null ? 0 : bids.filter((level) => level.price >= bidFloor).reduce((sum, level) => sum + level.price * level.size, 0);
  const askDepth1Pct = askCeiling == null ? 0 : asks.filter((level) => level.price <= askCeiling).reduce((sum, level) => sum + level.price * level.size, 0);
  const bidLevels = bids
    .filter((level) => bidFloor == null || level.price >= bidFloor)
    .sort((a, b) => b.price - a.price)
    .slice(0, 12)
    .map((level) => ({ ...level, notional: level.price * level.size }));
  const askLevels = asks
    .filter((level) => askCeiling == null || level.price <= askCeiling)
    .sort((a, b) => a.price - b.price)
    .slice(0, 12)
    .map((level) => ({ ...level, notional: level.price * level.size }));
  return { bestBid, bestAsk, spread, bidDepth1Pct, askDepth1Pct, bidLevels, askLevels, bookTime: book.time };
}

async function fetchHyperQuality() {
  const [ctxResponse, bookResponse] = await Promise.all([
    fetch("/hyperliquid-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs", dex: "xyz" })
    }),
    fetch("/hyperliquid-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "l2Book", coin: HYPER_COIN, dex: "xyz" })
    })
  ]);
  if (!ctxResponse.ok) throw new Error(`Hyperliquid ctx returned ${ctxResponse.status}`);
  if (!bookResponse.ok) throw new Error(`Hyperliquid book returned ${bookResponse.status}`);
  const [meta, ctxs] = (await ctxResponse.json()) as [{ universe: Array<{ name: string }> }, HyperCtx[]];
  const book = (await bookResponse.json()) as HyperBook;
  const index = meta.universe.findIndex((asset) => asset.name === HYPER_COIN);
  const ctx = index >= 0 ? ctxs[index] : {};
  const mid = toNumber(ctx.midPx);
  return {
    dayVolume: toNumber(ctx.dayNtlVlm),
    dayBaseVolume: toNumber(ctx.dayBaseVlm),
    openInterest: toNumber(ctx.openInterest),
    markPrice: toNumber(ctx.markPx),
    oraclePrice: toNumber(ctx.oraclePx),
    prevDayPrice: toNumber(ctx.prevDayPx),
    ...summarizeHyperBook(book, mid)
  };
}

function useDashboardData() {
  const [state, setState] = React.useState<DashboardState>({
    lowerEvent: null,
    upperEvent: null,
    polymarketMidpoints: {},
    polymarketDepth: {},
    hyperPrice: null,
    hyperQuality: null,
    hyperStatus: "connecting",
    polymarketStatus: "loading",
    lastUpdated: null,
    error: null
  });

  React.useEffect(() => {
    let cancelled = false;
    let hyperSocket: WebSocket | null = null;
    let pollId: number | null = null;

    const loadPolymarket = async () => {
      try {
        const [lowerEvent, upperEvent] = await Promise.all([fetchEvent(LOWER_SLUG), fetchEvent(UPPER_SLUG)]);
        const yesTokenIds = getYesTokenIds([lowerEvent, upperEvent]);
        const [polymarketMidpoints, polymarketDepth] = await Promise.all([
          fetchPolymarketMidpoints(yesTokenIds),
          fetchPolymarketBooks(yesTokenIds)
        ]);
        if (cancelled) return;
        setState((current) => ({
          ...current,
          lowerEvent,
          upperEvent,
          polymarketMidpoints,
          polymarketDepth,
          polymarketStatus: "live",
          lastUpdated: Date.now(),
          error: null
        }));
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          polymarketStatus: "error",
          error: error instanceof Error ? error.message : "Polymarket fetch failed"
        }));
      }
    };

    const pollHyper = async (status: DashboardState["hyperStatus"] = "polling") => {
      try {
        const [hyperPrice, hyperQuality] = await Promise.all([fetchHyperMid(), fetchHyperQuality()]);
        if (cancelled) return;
        setState((current) => ({
          ...current,
          hyperPrice,
          hyperQuality,
          hyperStatus: current.hyperStatus === "live" && status === "polling" ? "live" : status,
          lastUpdated: Date.now(),
          error: current.polymarketStatus === "error" ? current.error : null
        }));
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          hyperStatus: "error",
          error: error instanceof Error ? error.message : "Hyperliquid fetch failed"
        }));
      }
    };

    const startHyperSocket = () => {
      try {
        hyperSocket = new WebSocket("wss://api.hyperliquid.xyz/ws");
        hyperSocket.addEventListener("open", () => {
          hyperSocket?.send(JSON.stringify({ method: "subscribe", subscription: { type: "allMids", dex: "xyz" } }));
          hyperSocket?.send(JSON.stringify({ method: "subscribe", subscription: { type: "l2Book", coin: HYPER_COIN, dex: "xyz" } }));
        });
        hyperSocket.addEventListener("message", (event) => {
          const payload = JSON.parse(event.data as string) as {
            channel?: string;
            data?: ({ mids?: Record<string, string> } & HyperBook);
          };
          const mid = payload.channel === "allMids" ? Number(payload.data?.mids?.[HYPER_COIN]) : NaN;
          if (Number.isFinite(mid)) {
            setState((current) => ({ ...current, hyperPrice: mid, hyperStatus: "live", lastUpdated: Date.now() }));
          }
          if (payload.channel === "l2Book" && payload.data?.levels) {
            setState((current) => ({
              ...current,
              hyperQuality: {
                ...(current.hyperQuality ?? emptyHyperQuality()),
                ...summarizeHyperBook(payload.data as HyperBook, current.hyperPrice)
              },
              hyperStatus: "live",
              lastUpdated: Date.now()
            }));
          }
        });
        hyperSocket.addEventListener("error", () => void pollHyper("polling"));
        hyperSocket.addEventListener("close", () => {
          if (!cancelled) window.setTimeout(startHyperSocket, 2500);
        });
      } catch {
        void pollHyper("polling");
      }
    };

    void loadPolymarket();
    void pollHyper("polling");
    startHyperSocket();
    pollId = window.setInterval(() => {
      void loadPolymarket();
      void pollHyper("polling");
    }, LIVE_REFRESH_MS);

    return () => {
      cancelled = true;
      if (pollId) window.clearInterval(pollId);
      hyperSocket?.close();
    };
  }, []);

  return state;
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <section className={`metric ${tone ?? "neutral"}`}>
      <div className="metricIcon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </section>
  );
}

function DetailItem({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="detailItem">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function MiniBar({ value, max, tone = "gold" }: { value: number; max: number; tone?: "green" | "red" | "gold" }) {
  const width = max > 0 ? Math.max(Math.sqrt(value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="miniBar">
      <div className={`miniBarFill ${tone}`} style={{ width: `${Math.min(width, 100)}%` }} />
    </div>
  );
}

function MeasureCell({ value, max, tone }: { value: number; max: number; tone: "green" | "red" | "gold" }) {
  return (
    <div className="measureCell">
      <span>{formatCompactUsd(value)}</span>
      <MiniBar value={value} max={max} tone={tone} />
    </div>
  );
}

function PriceComparisonChart({ points }: { points: PricePoint[] }) {
  const width = 760;
  const height = 260;
  const padding = { top: 24, right: 28, bottom: 34, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = points.flatMap((point) => [point.polymarket, point.hyperliquid]).filter((value): value is number => value != null && Number.isFinite(value));
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 1;
  const range = Math.max(maxValue - minValue, 1);
  const yMin = Math.max(minValue - range * 0.18, 0);
  const yMax = maxValue + range * 0.18;
  const yRange = Math.max(yMax - yMin, 1);
  const xFor = (index: number) => padding.left + (points.length <= 1 ? chartWidth : (index / (points.length - 1)) * chartWidth);
  const yFor = (value: number) => padding.top + (1 - (value - yMin) / yRange) * chartHeight;
  const pathFor = (key: "polymarket" | "hyperliquid") =>
    points
      .map((point, index) => ({ value: point[key], x: xFor(index) }))
      .filter((point): point is { value: number; x: number } => point.value != null && Number.isFinite(point.value))
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${yFor(point.value).toFixed(1)}`)
      .join(" ");
  const latest = points.at(-1);
  const first = points[0];
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => yMin + yRange * ratio);

  return (
    <section className="panel priceChartPanel">
      <div className="panelHeader">
        <div>
          <p>Live Chart</p>
          <h2>Implied CBRS vs Hyperliquid</h2>
        </div>
        <span>{points.length > 1 && first ? `${new Date(first.time).toLocaleTimeString()} - ${new Date(latest!.time).toLocaleTimeString()}` : "Building history"}</span>
      </div>
      <div className="chartLegend">
        <span className="legendItem pm">Polymarket implied</span>
        <span className="legendItem hl">Hyperliquid</span>
      </div>
      <svg className="lineChart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Live line chart comparing Polymarket implied CBRS and Hyperliquid CBRS">
        <defs>
          <linearGradient id="pmGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="hlGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line className="chartGridLine" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
              <text className="chartTick" x={padding.left - 10} y={y + 4} textAnchor="end">
                {formatUsd(tick, 0)}
              </text>
            </g>
          );
        })}
        <line className="chartAxis" x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} />
        {points.length > 1 ? (
          <>
            <path className="chartLine pmLine" d={pathFor("polymarket")} />
            <path className="chartLine hlLine" d={pathFor("hyperliquid")} />
          </>
        ) : (
          <text className="chartEmpty" x={width / 2} y={height / 2} textAnchor="middle">
            Waiting for live samples
          </text>
        )}
        {latest ? (
          <>
            <circle className="chartDot pmDot" cx={xFor(points.length - 1)} cy={yFor(latest.polymarket)} r="4.5" />
            {latest.hyperliquid == null ? null : <circle className="chartDot hlDot" cx={xFor(points.length - 1)} cy={yFor(latest.hyperliquid)} r="4.5" />}
          </>
        ) : null}
      </svg>
      <div className="chartFooter">
        <span>PM {latest ? formatUsd(latest.polymarket) : "n/a"}</span>
        <span>HL {latest?.hyperliquid == null ? "n/a" : formatUsd(latest.hyperliquid)}</span>
      </div>
    </section>
  );
}

function App() {
  const data = useDashboardData();
  const [hoveredBracketId, setHoveredBracketId] = React.useState<string | null>(null);
  const { lower, upper } = getBrackets(data.lowerEvent, data.upperEvent, data.polymarketMidpoints, data.polymarketDepth);
  const distribution = buildDistribution(lower, upper);
  const expectedCap = expectedMarketCap(distribution);
  const capP10 = distributionQuantile(distribution, 0.1);
  const capP25 = distributionQuantile(distribution, 0.25);
  const capP75 = distributionQuantile(distribution, 0.75);
  const capP90 = distributionQuantile(distribution, 0.9);
  const allBrackets = [...lower, ...upper];
  const pmVolume24h = allBrackets.reduce((sum, row) => sum + row.volume24h, 0);
  const pmLiquidity = allBrackets.reduce((sum, row) => sum + row.liquidity, 0);
  const qualityRows = distribution.map((row) => {
    const depth = data.polymarketDepth[row.tokenId];
    return {
      ...row,
      depthTotal: (depth?.bidDepth2c ?? 0) + (depth?.askDepth2c ?? 0),
      bidDepth: depth?.bidDepth2c ?? 0,
      askDepth: depth?.askDepth2c ?? 0
    };
  });
  const distributionDepth = qualityRows.reduce((sum, row) => sum + row.depthTotal, 0);
  const maxQualityDepth = Math.max(...qualityRows.map((row) => row.depthTotal), 1);
  const maxQualityVolume = Math.max(...qualityRows.map((row) => row.volume24h), 1);
  const maxQualityLiquidity = Math.max(...qualityRows.map((row) => row.liquidity), 1);
  const hyperBookMax = Math.max(
    ...(data.hyperQuality?.bidLevels ?? []).map((level) => level.notional),
    ...(data.hyperQuality?.askLevels ?? []).map((level) => level.notional),
    1
  );
  const selectedBasis = SHARE_BASES[0];
  const polymarketSharePrice = expectedCap / selectedBasis.shares;
  const shareP10 = capP10 / selectedBasis.shares;
  const shareP25 = capP25 / selectedBasis.shares;
  const shareP75 = capP75 / selectedBasis.shares;
  const shareP90 = capP90 / selectedBasis.shares;
  const spread = data.hyperPrice == null ? null : data.hyperPrice - polymarketSharePrice;
  const spreadPct = data.hyperPrice == null ? null : spread! / polymarketSharePrice;
  const offerToPm = polymarketSharePrice - IPO_OFFER_PRICE;
  const offerToHl = data.hyperPrice == null ? null : data.hyperPrice - IPO_OFFER_PRICE;
  const officialIpoCap = IPO_OFFER_PRICE * OFFICIAL_POST_OFFERING_SHARES;
  const officialIpoCapWithOption = IPO_OFFER_PRICE * OFFICIAL_POST_OFFERING_WITH_OPTION_SHARES;
  const grossProceeds = IPO_OFFER_PRICE * IPO_OFFERED_SHARES;
  const grossProceedsWithOption = IPO_OFFER_PRICE * (IPO_OFFERED_SHARES + IPO_OVERALLOTMENT_SHARES);
  const offeredFloatPct = IPO_OFFERED_SHARES / OFFICIAL_POST_OFFERING_SHARES;
  const maxProbability = Math.max(...distribution.map((row) => row.probability), 0.01);
  const bookRowCount = Math.max(data.hyperQuality?.bidLevels.length ?? 0, data.hyperQuality?.askLevels.length ?? 0);
  const noIpoPrice =
    upper.find((row) => /not IPO/i.test(row.label))?.yesPrice ??
    (data.upperEvent?.markets.find((market) => /not IPO before July/i.test(market.question))?.outcomePrices
      ? Number(parseJsonArray<string>(data.upperEvent.markets.find((market) => /not IPO before July/i.test(market.question))!.outcomePrices)[0])
      : null);
  const hoveredBracket = qualityRows.find((row) => row.id === hoveredBracketId) ?? qualityRows.find((row) => row.probability === maxProbability) ?? null;
  const [priceHistory, setPriceHistory] = React.useState<PricePoint[]>([]);

  React.useEffect(() => {
    if (!Number.isFinite(polymarketSharePrice) || polymarketSharePrice <= 0) return;
    const now = Date.now();
    setPriceHistory((current) => {
      const point = { time: now, polymarket: polymarketSharePrice, hyperliquid: data.hyperPrice };
      const previous = current.at(-1);
      if (previous && now - previous.time < 2200) {
        return [...current.slice(0, -1), point];
      }
      return [...current, point].slice(-90);
    });
  }, [polymarketSharePrice, data.hyperPrice]);

  return (
    <main>
      <header className="topbar">
        <div>
          <div className="eyebrow">
            <Activity size={16} />
            Live CBRS IPO price discovery
          </div>
          <h1>Cerebras market-cap implied share price</h1>
        </div>
        <div className="statusRow">
          <span className={`status ${data.polymarketStatus}`}>
            <Wifi size={14} />
            Polymarket {data.polymarketStatus}
          </span>
          <span className={`status ${data.hyperStatus}`}>
            <RefreshCw size={14} />
            Hyperliquid {data.hyperStatus}
          </span>
        </div>
      </header>

      {data.error ? (
        <div className="notice">
          <AlertTriangle size={18} />
          {data.error}
        </div>
      ) : null}

      <section className="metricsGrid">
        <MetricCard
          icon={<BarChart3 size={22} />}
          label="Polymarket expected cap"
          value={expectedCap ? formatCompactUsd(expectedCap) : "Loading"}
          detail="Blended from both bracket pages"
        />
        <MetricCard
          icon={<Scale size={22} />}
          label="Polymarket definitive CBRS"
          value={expectedCap ? formatUsd(polymarketSharePrice) : "Loading"}
          detail={`Expected value using official post-offering shares: ${(selectedBasis.shares / 1e6).toFixed(1)}m`}
        />
        <MetricCard
          icon={<Scale size={22} />}
          label="Polymarket value range"
          value={expectedCap ? `${formatUsd(shareP25, 0)}-${formatUsd(shareP75, 0)}` : "Loading"}
          detail={`Central 50%; central 80% is ${formatUsd(shareP10, 0)}-${formatUsd(shareP90, 0)}`}
        />
        <MetricCard
          icon={<CircleDollarSign size={22} />}
          label="Hyperliquid xyz:CBRS"
          value={data.hyperPrice == null ? "Loading" : formatUsd(data.hyperPrice)}
          detail="trade[XYZ] per-share IPOP market"
        />
        <MetricCard
          icon={<Activity size={22} />}
          label="HL premium / discount"
          value={spread == null ? "Loading" : `${spread >= 0 ? "+" : ""}${formatUsd(spread)}`}
          detail={spreadPct == null ? "Waiting for live price" : `${spreadPct >= 0 ? "+" : ""}${formatPercent(spreadPct)} versus Polymarket`}
          tone={spread == null ? "neutral" : spread >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          icon={<BarChart3 size={22} />}
          label="PM 24h volume"
          value={formatMaybeCompactUsd(pmVolume24h)}
          detail={`${formatMaybeCompactUsd(pmLiquidity)} combined CLOB liquidity`}
        />
        <MetricCard
          icon={<CircleDollarSign size={22} />}
          label="HL 24h notional"
          value={formatMaybeCompactUsd(data.hyperQuality?.dayVolume)}
          detail={`${formatMaybeNumber(data.hyperQuality?.dayBaseVolume)} CBRS base volume`}
        />
      </section>

      <section className="workspace">
        <PriceComparisonChart points={priceHistory} />

        <aside className="panel methodologyPanel">
          <div className="panelHeader compact">
            <div>
              <p>Methodology</p>
              <h2>One official share count</h2>
            </div>
          </div>
          <div className="methodFormula">
            <span>PM implied CBRS</span>
            <strong>
              E[market cap] / {new Intl.NumberFormat("en-US").format(OFFICIAL_POST_OFFERING_SHARES)} shares
            </strong>
          </div>
          <p className="basisNote">
            The headline comparison uses the official post-offering share count from the latest S-1/A: 30.0m offered Class A shares plus 185.228541m
            Class B shares. The alternatives below are audit views only; they do not drive the main dashboard.
          </p>
          <div className="basisAudit">
            {SHARE_BASES.map((basis) => (
              <div className="basisAuditRow" key={basis.id}>
                <span>{basis.label}</span>
                <strong>{(basis.shares / 1e6).toFixed(3)}m</strong>
                <small>{expectedCap ? formatUsd(expectedCap / basis.shares) : "Loading"}</small>
              </div>
            ))}
          </div>
          <div className="sourceBox">
            <strong>trade[XYZ] treatment</strong>
            <span>IPOP price is a cash-settled per-share derivative. Their displayed FD share count is indicative only, so it is not used as a default.</span>
          </div>
        </aside>
      </section>

      <section className="workspace distributionWorkspace">
        <div className="panel chartPanel">
          <div className="panelHeader">
            <div>
              <p>Normalized Distribution</p>
              <h2>Closing market cap brackets</h2>
            </div>
            <span>{data.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : "No update yet"}</span>
          </div>
          <div className="bars">
            {distribution.map((row) => (
              <div
                className={`barRow ${hoveredBracket?.id === row.id ? "active" : ""}`}
                key={row.id}
                onFocus={() => setHoveredBracketId(row.id)}
                onMouseEnter={() => setHoveredBracketId(row.id)}
                tabIndex={0}
              >
                <div className="barLabel">{row.label}</div>
                <div className="barTrack">
                  <div className="barFill" style={{ width: `${Math.max((row.probability / maxProbability) * 100, 2)}%` }} />
                </div>
                <div className="barValue">{formatPercent(row.probability)}</div>
              </div>
            ))}
          </div>
          {hoveredBracket ? (
            <div className="strikeTooltip">
              <div>
                <span>Selected strike</span>
                <strong>{hoveredBracket.label}</strong>
              </div>
              <div>
                <span>Raw Yes / blended</span>
                <strong>
                  {formatPercent(hoveredBracket.yesPrice)} / {formatPercent(hoveredBracket.probability)}
                </strong>
              </div>
              <div>
                <span>Bid / ask</span>
                <strong>
                  {hoveredBracket.bid == null ? "n/a" : formatPercent(hoveredBracket.bid)} / {hoveredBracket.ask == null ? "n/a" : formatPercent(hoveredBracket.ask)}
                </strong>
              </div>
              <div>
                <span>2c depth</span>
                <strong>{formatCompactUsd(hoveredBracket.depthTotal)}</strong>
              </div>
              <div>
                <span>24h volume</span>
                <strong>{formatCompactUsd(hoveredBracket.volume24h)}</strong>
              </div>
              <div>
                <span>Liquidity / midpoint</span>
                <strong>
                  {formatCompactUsd(hoveredBracket.liquidity)} / {formatCompactUsd(hoveredBracket.midpoint)}
                </strong>
              </div>
            </div>
          ) : null}
          <p className="caption">
            The definitive value is the expected market cap from this live blended distribution, divided by the official post-offering share count. The value
            range assumes outcomes are uniformly distributed inside each bracket; the open-ended {">= $100B"} bracket is capped at $110B for quantile math.
          </p>
        </div>
      </section>

      <section className="panel qualityPanel">
        <div className="panelHeader">
          <div>
            <p>Market Quality</p>
            <h2>Volume, liquidity, and book depth</h2>
          </div>
          <span>HL book {data.hyperQuality?.bookTime ? new Date(data.hyperQuality.bookTime).toLocaleTimeString() : "n/a"}</span>
        </div>
        <div className="qualityGrid">
          <div>
            <span>Hyperliquid BBO</span>
            <strong>
              {formatMaybeUsd(data.hyperQuality?.bestBid)} / {formatMaybeUsd(data.hyperQuality?.bestAsk)}
            </strong>
            <small>Spread {formatMaybeUsd(data.hyperQuality?.spread, 2)}</small>
          </div>
          <div>
            <span>Hyperliquid mark / oracle</span>
            <strong>
              {formatMaybeUsd(data.hyperQuality?.markPrice)} / {formatMaybeUsd(data.hyperQuality?.oraclePrice)}
            </strong>
            <small>Prev day {formatMaybeUsd(data.hyperQuality?.prevDayPrice)}</small>
          </div>
          <div>
            <span>Polymarket combined 24h</span>
            <strong>{formatMaybeCompactUsd(pmVolume24h)}</strong>
            <small>Both linked event pages, bracket markets only</small>
          </div>
          <div>
            <span>Polymarket displayed liquidity</span>
            <strong>{formatMaybeCompactUsd(pmLiquidity)}</strong>
            <small>Gamma/CLOB liquidity fields, refreshed by polling</small>
          </div>
        </div>
        <div className="depthVisuals">
          <div className="depthCard">
            <div className="depthHeader">
              <strong>Hyperliquid depth ladder</strong>
              <span>Within 1% of mid, notional by level</span>
            </div>
            <div className="bookTotals">
              <span>Bid depth {formatMaybeCompactUsd(data.hyperQuality?.bidDepth1Pct)}</span>
              <span>Ask depth {formatMaybeCompactUsd(data.hyperQuality?.askDepth1Pct)}</span>
            </div>
            <div className="orderBook">
              <div className="orderBookHead">
                <span>Bid notional</span>
                <span>Bid</span>
                <span>Ask</span>
                <span>Ask notional</span>
              </div>
              {Array.from({ length: bookRowCount }).map((_, index) => {
                const bid = data.hyperQuality?.bidLevels[index];
                const ask = data.hyperQuality?.askLevels[index];
                return (
                  <div className="orderBookRow" key={`book-${index}`}>
                    <MeasureCell value={bid?.notional ?? 0} max={hyperBookMax} tone="green" />
                    <strong className="bidText">{bid ? formatUsd(bid.price, 2) : "-"}</strong>
                    <strong className="askText">{ask ? formatUsd(ask.price, 2) : "-"}</strong>
                    <MeasureCell value={ask?.notional ?? 0} max={hyperBookMax} tone="red" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="depthCard">
            <div className="depthHeader">
              <strong>Polymarket bracket quality</strong>
              <span>Probability, 2c depth, 24h volume, and displayed liquidity</span>
            </div>
            <div className="pmQualityTable">
              <div className="pmQualityHead">
                <span>Bracket</span>
                <span>Prob</span>
                <span>2c depth</span>
                <span>24h</span>
                <span>Liquidity</span>
              </div>
              {qualityRows.map((row) => (
                <div className="pmQualityRow" key={`quality-${row.id}`}>
                  <strong>{row.label}</strong>
                  <span>{formatPercent(row.probability)}</span>
                  <MeasureCell value={row.depthTotal} max={maxQualityDepth} tone="gold" />
                  <MeasureCell value={row.volume24h} max={maxQualityVolume} tone="green" />
                  <MeasureCell value={row.liquidity} max={maxQualityLiquidity} tone="red" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="caption">
          Hyperliquid price and book depth stream over WebSocket, with volume/open-interest context refreshed every {LIVE_REFRESH_MS / 1000} seconds. Polymarket
          CLOB midpoints and books are polled every {LIVE_REFRESH_MS / 1000} seconds; Gamma volume/liquidity fields refresh on that same cadence. Polymarket
          depth is shallow near the touch in several brackets, so the visual bars matter more than the combined headline total of{" "}
          {formatMaybeCompactUsd(distributionDepth)}.
        </p>
      </section>

      <section className="panel ipoPanel">
        <div className="panelHeader">
          <div>
            <p>IPO Terms</p>
            <h2>Official pricing details and price-action context</h2>
          </div>
          <span>Checked May 13, 2026 PDT</span>
        </div>
        <div className="detailGrid">
          <DetailItem label="Offer price" value={formatUsd(IPO_OFFER_PRICE)} note="Priced May 13; Nasdaq trading expected May 14 under CBRS." />
          <DetailItem label="Shares offered" value="30.0m" note="Class A common stock; 4.5m underwriter option for 30 days." />
          <DetailItem label="Gross proceeds" value={formatCompactUsd(grossProceeds)} note={`${formatCompactUsd(grossProceedsWithOption)} if the option is fully exercised.`} />
          <DetailItem label="Implied official cap" value={formatCompactUsd(officialIpoCap)} note={`${formatCompactUsd(officialIpoCapWithOption)} with over-allotment share count.`} />
          <DetailItem label="Offered float" value={formatPercent(offeredFloatPct)} note="Offered shares divided by post-offering shares before over-allotment." />
          <DetailItem label="Polymarket vs offer" value={`${offerToPm >= 0 ? "+" : ""}${formatUsd(offerToPm)}`} note={`${offerToPm >= 0 ? "+" : ""}${formatPercent(offerToPm / IPO_OFFER_PRICE)} versus $185.`} />
          <DetailItem
            label="Hyperliquid vs offer"
            value={offerToHl == null ? "Loading" : `${offerToHl >= 0 ? "+" : ""}${formatUsd(offerToHl)}`}
            note={offerToHl == null ? "Waiting for xyz:CBRS." : `${offerToHl >= 0 ? "+" : ""}${formatPercent(offerToHl / IPO_OFFER_PRICE)} versus $185.`}
          />
          <DetailItem label="Lead banks" value="MS, Citi, Barclays, UBS" note="Mizuho and TD Cowen bookrunners; additional co-managers." />
        </div>
        <div className="watchList">
          <strong>Price-action notes</strong>
          <span>
            The offer price implies about {formatCompactUsd(officialIpoCap)} on the official post-offering share count, while the live Polymarket expected
            value is {formatCompactUsd(expectedCap)}. The S-1/A says Class B holders retain about 85.3% of shares and 99.2% of voting power after the
            offering, and lock-up/market-standoff restrictions generally run until the earlier of the second trading day after Q3 2026 earnings or 180 days
            after the prospectus date, with exceptions including some sell-to-cover activity. The S-1/A also highlights 2025 revenue of $510.0m, up 76%
            year over year, a multi-year OpenAI deal valued at more than $20B for 750MW, and a binding AWS term sheet. No final 424B4 was visible in the SEC
            feed during the latest check.
          </span>
        </div>
      </section>

      <section className="panel tablePanel">
        <div className="panelHeader">
          <div>
            <p>Raw Inputs</p>
            <h2>Polymarket bracket prices</h2>
          </div>
          <span>
            Live CLOB/Gamma poll every {LIVE_REFRESH_MS / 1000}s · No-IPO upper market: {noIpoPrice == null ? "n/a" : formatPercent(noIpoPrice)}
          </span>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Bracket</th>
                <th>Source</th>
                <th>Raw Yes</th>
                <th>Blended Prob.</th>
                <th>Bid / Ask</th>
                <th>2c Depth</th>
                <th>24h Vol.</th>
                <th>Midpoint</th>
              </tr>
            </thead>
            <tbody>
              {distribution.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{row.source}</td>
                  <td>{formatPercent(row.yesPrice)}</td>
                  <td>{formatPercent(row.probability)}</td>
                  <td>
                    {row.bid == null ? "n/a" : formatPercent(row.bid)} / {row.ask == null ? "n/a" : formatPercent(row.ask)}
                  </td>
                  <td>{formatMaybeCompactUsd((data.polymarketDepth[row.tokenId]?.bidDepth2c ?? 0) + (data.polymarketDepth[row.tokenId]?.askDepth2c ?? 0))}</td>
                  <td>{formatMaybeCompactUsd(row.volume24h)}</td>
                  <td>{formatCompactUsd(row.midpoint)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

declare global {
  interface Window {
    __cbrsRoot?: Root;
  }
}

const container = document.getElementById("root")!;
window.__cbrsRoot ??= createRoot(container);
window.__cbrsRoot.render(<App />);
