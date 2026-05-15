import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  TickMarkType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type UTCTimestamp
} from "lightweight-charts";
import { Activity, AlertTriangle, BarChart3, CircleDollarSign, RefreshCw, Scale, Wifi } from "lucide-react";
import "./styles.css";

type PolymarketEvent = {
  slug: string;
  title: string;
  volume?: string | number | null;
  volume24hr?: string | number | null;
  liquidity?: string | number | null;
  liquidityClob?: string | number | null;
  active?: boolean | null;
  closed?: boolean | null;
  archived?: boolean | null;
  endDate?: string | null;
  markets: PolymarketMarket[];
};

type PolymarketMarket = {
  conditionId: string;
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
  active?: boolean | null;
  closed?: boolean | null;
  archived?: boolean | null;
  acceptingOrders?: boolean | null;
  endDate?: string | null;
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
  bidLevels: Array<{ price: number; size: number; notional: number; cumulative: number }>;
  askLevels: Array<{ price: number; size: number; notional: number; cumulative: number }>;
};

type PolymarketTrade = {
  proxyWallet: string;
  side: "BUY" | "SELL" | string;
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  name?: string;
  pseudonym?: string;
  transactionHash?: string;
  source?: "data" | "clob";
};

type PolymarketQuoteChange = {
  asset: string;
  conditionId: string;
  timestamp: number;
  outcome: string;
  bracketTitle: string;
  slug: string;
  eventSlug: string;
  bestBid: number | null;
  bestAsk: number | null;
  midpoint: number;
  previousMidpoint: number | null;
  delta: number | null;
  side?: string;
  size?: number | null;
};

type OutcomeTokenRef = {
  tokenId: string;
  conditionId: string;
  outcome: string;
  outcomeIndex: number;
  title: string;
  slug: string;
  eventSlug: string;
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

type HyperCandle = {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
};

type HyperQuality = {
  dayVolume: number | null;
  dayBaseVolume: number | null;
  openInterest: number | null;
  fundingRate: number | null;
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

type NasdaqClose = {
  close: number;
  timestamp: string;
  afterHoursPrice: number | null;
};

type PriceConfidence = "high" | "medium" | "low";

type MarketBracket = {
  id: string;
  conditionId: string;
  label: string;
  low: number | null;
  high: number | null;
  midpoint: number;
  pageYesPrice: number | null;
  yesPrice: number;
  quoteMidpoint: number | null;
  referencePrice: number | null;
  quoteWeight: number;
  priceBasis: string;
  priceConfidence: PriceConfidence;
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

type ChartMeasurement = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startPrice: number;
  endPrice: number;
  startTimeMs: number | null;
  endTimeMs: number | null;
};

type ChartCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartInterval = "1m" | "5m" | "15m" | "1h";
type ChartCandleMap = Record<ChartInterval, ChartCandle[]>;

const CHART_INTERVALS: Array<{ id: ChartInterval; label: string; ms: number }> = [
  { id: "1m", label: "1m", ms: 60_000 },
  { id: "5m", label: "5m", ms: 5 * 60_000 },
  { id: "15m", label: "15m", ms: 15 * 60_000 },
  { id: "1h", label: "1h", ms: 60 * 60_000 }
];

const emptyCandleMap = (): ChartCandleMap => ({
  "1m": [],
  "5m": [],
  "15m": [],
  "1h": []
});

type DashboardState = {
  lowerEvent: PolymarketEvent | null;
  upperEvent: PolymarketEvent | null;
  polymarketMidpoints: Record<string, number>;
  polymarketDepth: Record<string, PolymarketDepth>;
  polymarketTrades: PolymarketTrade[];
  polymarketQuoteChanges: PolymarketQuoteChange[];
  polymarketStreamStatus: "connecting" | "streaming" | "polling";
  hyperPrice: number | null;
  hyperQuality: HyperQuality | null;
  nasdaqClose: NasdaqClose | null;
  hyperStatus: "connecting" | "live" | "polling" | "stale" | "error";
  polymarketStatus: "loading" | "live" | "error";
  lastUpdated: number | null;
  error: string | null;
};

const LOWER_SLUG = "cerebras-ipo-closing-market-cap";
const UPPER_SLUG = "cerebras-ipo-closing-market-cap-539";
const HYPER_COIN = "xyz:CBRS";
const LIVE_REFRESH_MS = 5000;
const POLYMARKET_HISTORY_DAYS = 14;
const POLYMARKET_HISTORY_FIDELITY_MINUTES = 5;
const POLYMARKET_HISTORY_BUCKET_SECONDS = POLYMARKET_HISTORY_FIDELITY_MINUTES * 60;
const IPO_OFFER_PRICE = 185;
const IPO_OFFERED_SHARES = 30_000_000;
const IPO_OVERALLOTMENT_SHARES = 4_500_000;
const OFFICIAL_POST_OFFERING_SHARES = 219_295_148;
const OFFICIAL_POST_OFFERING_WITH_OPTION_SHARES = 223_795_148;
const POTENTIAL_DILUTED_SCENARIO_SHARES = 308_116_278;

const SHARE_BASES: ShareBasis[] = [
  {
    id: "official-basic",
    label: "Headline denominator",
    shares: OFFICIAL_POST_OFFERING_SHARES,
    note: "Current official market-cap denominator from the May 14 S-8 reoffer prospectus: 30.0m Class A, 185.613148m Class B, and 3.682m Class N shares."
  },
  {
    id: "official-overallotment",
    label: "If banks exercise option",
    shares: OFFICIAL_POST_OFFERING_WITH_OPTION_SHARES,
    note: "Adds the 4.5m underwriter option to the latest official share base. This can increase public shares after the IPO; it is not assumed in the headline."
  },
  {
    id: "official-potential-diluted",
    label: "If listed dilutives convert",
    shares: POTENTIAL_DILUTED_SCENARIO_SHARES,
    note: "Scenario only: listed options, RSUs, PRSUs, warrants, and post-Dec Class N become shares. Not day-one float; not assumed to happen all at once."
  }
];

const emptyHyperQuality = (): HyperQuality => ({
  dayVolume: null,
  dayBaseVolume: null,
  openInterest: null,
  fundingRate: null,
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

const formatMaybePercent = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? "n/a" : formatPercent(value);

const formatMaybeFundingRate = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? "n/a"
    : new Intl.NumberFormat("en-US", {
        style: "percent",
        maximumFractionDigits: 4,
        minimumFractionDigits: 4
      }).format(value);

const formatSignedUsd = (value: number, digits = 2) => `${value >= 0 ? "+" : ""}${formatUsd(value, digits)}`;

const formatSignedPercent = (value: number) => `${value >= 0 ? "+" : ""}${formatPercent(value)}`;

const formatVsIpo = (price: number | null | undefined) => {
  if (price == null || !Number.isFinite(price)) return "vs IPO: n/a";
  const diff = price - IPO_OFFER_PRICE;
  return `vs $185 IPO: ${formatSignedUsd(diff)} / ${formatSignedPercent(diff / IPO_OFFER_PRICE)}`;
};

const formatMaybeNumber = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? "n/a"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

const parseUsdValue = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatSignedCompactUsd = (value: number) => `${value >= 0 ? "+" : ""}${formatCompactUsd(value)}`;

const hyperOiNotional = (quality: HyperQuality | null | undefined, fallbackPrice?: number | null) => {
  const oi = quality?.openInterest;
  const price = quality?.oraclePrice ?? quality?.markPrice ?? fallbackPrice;
  return oi != null && Number.isFinite(oi) && price != null && Number.isFinite(price) ? oi * price : null;
};

const annualizedHyperFunding = (fundingRate: number | null | undefined) =>
  fundingRate == null || !Number.isFinite(fundingRate) ? null : fundingRate * 24 * 365;

const shortAddress = (value: string | null | undefined) => (value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "n/a");

const polymarketProfileHref = (wallet: string | null | undefined) => {
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) return null;
  return `https://polymarket.com/profile/${wallet}`;
};

const formatImpliedPriceRange = (low: number | null, high: number | null) => {
  const lowPrice = low == null ? null : low / OFFICIAL_POST_OFFERING_SHARES;
  const highPrice = high == null ? null : high / OFFICIAL_POST_OFFERING_SHARES;
  if (lowPrice == null && highPrice != null) return `<${formatUsd(highPrice, 2)}`;
  if (lowPrice != null && highPrice == null) return `>=${formatUsd(lowPrice, 2)}`;
  if (lowPrice != null && highPrice != null) return `${formatUsd(lowPrice, 2)}-${formatUsd(highPrice, 2)}`;
  return "n/a";
};

const formatLocalTime = (value: number | Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(value);

const formatLocalDateTime = (value: number | Date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(value);

const formatChartAxisTime = (value: number | Date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(value);

const chartTimeToMs = (time: Time | unknown) => {
  if (typeof time === "number") return time * 1000;
  if (typeof time === "string") return new Date(`${time}T00:00:00`).getTime();
  if (time && typeof time === "object" && "year" in time && "month" in time && "day" in time) {
    const businessDay = time as { year: number; month: number; day: number };
    return new Date(businessDay.year, businessDay.month - 1, businessDay.day).getTime();
  }
  return NaN;
};

const formatDuration = (milliseconds: number | null | undefined) => {
  if (milliseconds == null || !Number.isFinite(milliseconds)) return "n/a";
  const absoluteMinutes = Math.round(Math.abs(milliseconds) / 60_000);
  const days = Math.floor(absoluteMinutes / (24 * 60));
  const hours = Math.floor((absoluteMinutes % (24 * 60)) / 60);
  const minutes = absoluteMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatChartTick = (time: Time, tickMarkType: TickMarkType, locale: string) => {
  const timeMs = chartTimeToMs(time);
  if (!Number.isFinite(timeMs)) return null;
  const date = new Date(timeMs);
  if (tickMarkType === TickMarkType.Year) {
    return new Intl.DateTimeFormat(locale, { year: "numeric" }).format(date);
  }
  if (tickMarkType === TickMarkType.Month) {
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  }
  if (tickMarkType === TickMarkType.DayOfMonth) {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
  }
  if (tickMarkType === TickMarkType.TimeWithSeconds) {
    return new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(date);
  }
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const period = parts.find((part) => part.type === "dayPeriod")?.value?.slice(0, 1).toLowerCase() ?? "";
  return `${hour}:${minute}${period}`;
};

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

const clamp = (value: number, low = 0, high = 1) => Math.min(Math.max(value, low), high);

const finiteOrNull = (value: number | null | undefined) => (value != null && Number.isFinite(value) ? value : null);

const eventNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isPolymarketMarketClosed = (market: PolymarketMarket) =>
  market.closed === true || market.acceptingOrders === false || market.active === false || market.archived === true;

const isPolymarketEventClosed = (event: PolymarketEvent | null) =>
  event?.closed === true || event?.active === false || event?.archived === true || (event?.markets?.length ? event.markets.every(isPolymarketMarketClosed) : false);

const deriveRobustYesPrice = ({
  quoteMidpoint,
  bestBid,
  bestAsk,
  last,
  gammaPrice,
  nearTouchDepth
}: {
  quoteMidpoint: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  last: number | null;
  gammaPrice: number | null;
  nearTouchDepth: number;
}): {
  yesPrice: number;
  quoteMidpoint: number | null;
  referencePrice: number | null;
  quoteWeight: number;
  priceBasis: string;
  priceConfidence: PriceConfidence;
} => {
  const quote = finiteOrNull(quoteMidpoint);
  const reference = finiteOrNull(gammaPrice) ?? finiteOrNull(last);
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null;

  if (quote == null) {
    return {
      yesPrice: clamp(reference ?? 0),
      quoteMidpoint: null,
      referencePrice: reference,
      quoteWeight: 0,
      priceBasis: "Gamma / last trade fallback",
      priceConfidence: "low" as const
    };
  }

  if (reference == null) {
    const confidence: PriceConfidence = spread != null && spread <= 0.04 && nearTouchDepth >= 100 ? "medium" : "low";
    return {
      yesPrice: clamp(quote),
      quoteMidpoint: quote,
      referencePrice: null,
      quoteWeight: 1,
      priceBasis: "quote only",
      priceConfidence: confidence
    };
  }

  const spreadScore = spread == null ? 0.45 : clamp((0.1 - spread) / 0.08);
  const depthScore = clamp(Math.log10(1 + nearTouchDepth) / Math.log10(501));
  const divergence = Math.abs(quote - reference);
  const rawQuoteWeight = clamp(0.62 + spreadScore * 0.18 + depthScore * 0.12, 0.55, 0.92);
  const spreadCap =
    spread == null ? 0.7 : spread >= 0.2 ? 0.42 : spread >= 0.12 ? 0.55 : spread >= 0.08 ? 0.68 : spread >= 0.05 ? 0.8 : 0.92;
  const depthCap = nearTouchDepth < 10 ? 0.62 : nearTouchDepth < 50 ? 0.74 : nearTouchDepth < 100 ? 0.84 : 0.92;
  const divergenceFloor = divergence >= 0.08 && spread != null && spread <= 0.1 ? 0.78 : 0.55;
  const quoteWeight = clamp(Math.min(rawQuoteWeight, spreadCap, depthCap), Math.min(divergenceFloor, spreadCap, depthCap), 0.92);
  const yesPrice = clamp(quote * quoteWeight + reference * (1 - quoteWeight));
  const priceConfidence: PriceConfidence = quoteWeight >= 0.78 && spread != null && spread <= 0.08 ? "high" : quoteWeight >= 0.62 ? "medium" : "low";

  return {
    yesPrice,
    quoteMidpoint: quote,
    referencePrice: reference,
    quoteWeight,
    priceBasis: divergence >= 0.08 ? "CLOB-weighted; page price stale/divergent" : "robust quote/trade blend",
    priceConfidence
  };
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
  const bookDepth = depth[tokenId];
  const isClosed = isPolymarketMarketClosed(market);
  const rawBid = bookDepth?.bestBid ?? market.bestBid;
  const rawAsk = bookDepth?.bestAsk ?? market.bestAsk;
  const bid = isClosed || rawBid == null || rawAsk == null || rawAsk < rawBid ? (isClosed ? null : market.bestBid) : rawBid;
  const ask = isClosed || rawBid == null || rawAsk == null || rawAsk < rawBid ? (isClosed ? null : market.bestAsk) : rawAsk;
  const bboMidpoint = bid != null && ask != null ? (bid + ask) / 2 : null;
  const quoteMidpoint = isClosed ? null : bboMidpoint ?? finiteOrNull(midpoints[tokenId]);
  const pageYesPrice = finiteOrNull(prices[yesIndex]);
  const robustPrice = deriveRobustYesPrice({
    quoteMidpoint,
    bestBid: bid,
    bestAsk: ask,
    last: market.lastTradePrice,
    gammaPrice: pageYesPrice,
    nearTouchDepth: isClosed ? 0 : (bookDepth?.bidDepth2c ?? 0) + (bookDepth?.askDepth2c ?? 0)
  });
  return {
    id: `${source}-${market.slug}`,
    conditionId: market.conditionId,
    label: labelFor(parsed.low, parsed.high),
    low: parsed.low,
    high: parsed.high,
    midpoint: midpointFor(parsed.low, parsed.high),
    pageYesPrice,
    yesPrice: robustPrice.yesPrice,
    quoteMidpoint: robustPrice.quoteMidpoint,
    referencePrice: robustPrice.referencePrice,
    quoteWeight: robustPrice.quoteWeight,
    priceBasis: robustPrice.priceBasis,
    priceConfidence: robustPrice.priceConfidence,
    source,
    tokenId,
    bid,
    ask,
    last: market.lastTradePrice,
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

function getOutcomeTokenRefs(events: PolymarketEvent[]): OutcomeTokenRef[] {
  return events.flatMap((event) =>
    event.markets.flatMap((market) => {
      if (!market.conditionId || /not IPO before July/i.test(market.question) || !parseBracket(market.question)) return [];
      const outcomes = parseJsonArray<string>(market.outcomes);
      const tokens = parseJsonArray<string>(market.clobTokenIds);
      return tokens.flatMap((tokenId, outcomeIndex) =>
        tokenId
          ? [
              {
                tokenId,
                conditionId: market.conditionId,
                outcome: outcomes[outcomeIndex] ?? `Outcome ${outcomeIndex + 1}`,
                outcomeIndex,
                title: market.question,
                slug: market.slug,
                eventSlug: event.slug
              }
            ]
          : []
      );
    })
  );
}

function getBracketConditionIds(events: PolymarketEvent[]) {
  return events.flatMap((event) =>
    event.markets.flatMap((market) => {
      if (!market.conditionId || /not IPO before July/i.test(market.question) || !parseBracket(market.question)) return [];
      return [market.conditionId];
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

function summarizePolymarketBook(
  book: PolymarketBook,
  topOfBook?: { bestBid: number | null; bestAsk: number | null; spread: number | null }
): PolymarketDepth {
  const bids = book.bids
    .map((level) => ({ price: Number(level.price), size: Number(level.size) }))
    .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.size));
  const asks = book.asks
    .map((level) => ({ price: Number(level.price), size: Number(level.size) }))
    .filter((level) => Number.isFinite(level.price) && Number.isFinite(level.size));
  const rawBestBid = bids.length ? Math.max(...bids.map((level) => level.price)) : null;
  const rawBestAsk = asks.length ? Math.min(...asks.map((level) => level.price)) : null;
  const bestBid = topOfBook?.bestBid ?? rawBestBid;
  const bestAsk = topOfBook?.bestAsk ?? rawBestAsk;
  const spread = topOfBook?.spread ?? (bestBid != null && bestAsk != null ? bestAsk - bestBid : null);
  const bidFloor = bestBid == null ? null : Math.max(bestBid - 0.02, 0);
  const askCeiling = bestAsk == null ? null : Math.min(bestAsk + 0.02, 1);
  const bidDepth2c = bidFloor == null ? 0 : bids.filter((level) => level.price >= bidFloor).reduce((sum, level) => sum + level.price * level.size, 0);
  const askDepth2c = askCeiling == null ? 0 : asks.filter((level) => level.price <= askCeiling).reduce((sum, level) => sum + level.price * level.size, 0);
  const withCumulative = (levels: Array<{ price: number; size: number }>) => {
    let cumulative = 0;
    return levels.map((level) => {
      const notional = level.price * level.size;
      cumulative += notional;
      return { ...level, notional, cumulative };
    });
  };
  const bidLevels = withCumulative(bids.sort((a, b) => b.price - a.price).slice(0, 8));
  const askLevels = withCumulative(asks.sort((a, b) => a.price - b.price).slice(0, 8));
  return { bestBid, bestAsk, spread, bidDepth2c, askDepth2c, bidLevels, askLevels };
}

async function fetchPolymarketBooks(tokenIds: string[]) {
  if (tokenIds.length === 0) return {};
  const [booksResponse, pricesResponse, spreadsResponse] = await Promise.all([
    fetch("/polymarket-clob/books", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tokenIds.map((token_id) => ({ token_id })))
    }),
    fetch("/polymarket-clob/prices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tokenIds.flatMap((token_id) => [{ token_id, side: "BUY" }, { token_id, side: "SELL" }]))
    }),
    fetch("/polymarket-clob/spreads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tokenIds.map((token_id) => ({ token_id })))
    })
  ]);
  if (!booksResponse.ok) throw new Error(`Polymarket CLOB books returned ${booksResponse.status}`);
  const books = (await booksResponse.json()) as PolymarketBook[];
  const prices = pricesResponse.ok ? ((await pricesResponse.json()) as Record<string, { BUY?: string; SELL?: string }>) : {};
  const spreads = spreadsResponse.ok ? ((await spreadsResponse.json()) as Record<string, string>) : {};
  const topOfBook = Object.fromEntries(
    tokenIds.flatMap((tokenId) => {
      const buy = toNumber(prices[tokenId]?.BUY);
      const sell = toNumber(prices[tokenId]?.SELL);
      if (buy == null || sell == null) return [];
      const bestBid = Math.min(buy, sell);
      const bestAsk = Math.max(buy, sell);
      return [[tokenId, { bestBid, bestAsk, spread: toNumber(spreads[tokenId]) ?? bestAsk - bestBid }]];
    })
  ) as Record<string, { bestBid: number | null; bestAsk: number | null; spread: number | null }>;
  return Object.fromEntries(books.map((book) => [book.asset_id, summarizePolymarketBook(book, topOfBook[book.asset_id])]));
}

async function fetchPolymarketTrades(conditionIds: string[]) {
  if (conditionIds.length === 0) return [];
  const params = new URLSearchParams({
    market: [...new Set(conditionIds)].join(","),
    limit: "100",
    takerOnly: "true"
  });
  const response = await fetch(`/polymarket-data/trades?${params.toString()}`);
  if (!response.ok) throw new Error(`Polymarket trades returned ${response.status}`);
  const raw = (await response.json()) as PolymarketTrade[];
  return raw
    .map((trade) => ({
      ...trade,
      source: "data" as const,
      size: Number(trade.size),
      price: Number(trade.price),
      timestamp: Number(trade.timestamp)
    }))
    .filter((trade) => Number.isFinite(trade.size) && Number.isFinite(trade.price) && Number.isFinite(trade.timestamp));
}

const tradeKey = (trade: PolymarketTrade) => {
  if (trade.transactionHash) return `tx-${trade.transactionHash}-${trade.asset}`;
  return `${trade.source ?? "data"}-${trade.asset}-${trade.timestamp}-${trade.side}-${trade.outcome}-${trade.size}-${trade.price}`;
};

function mergePolymarketTrades(current: PolymarketTrade[], incoming: PolymarketTrade[]) {
  const byKey = new Map<string, PolymarketTrade>();
  [...incoming, ...current].forEach((trade) => {
    byKey.set(tradeKey(trade), trade);
  });
  return [...byKey.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 180);
}

const quoteChangeKey = (change: PolymarketQuoteChange) =>
  `${change.asset}-${change.timestamp}-${change.midpoint}-${change.bestBid ?? "na"}-${change.bestAsk ?? "na"}-${change.side ?? "na"}-${change.size ?? "na"}`;

function mergePolymarketQuoteChanges(current: PolymarketQuoteChange[], incoming: PolymarketQuoteChange[]) {
  const byKey = new Map<string, PolymarketQuoteChange>();
  [...incoming, ...current].forEach((change) => {
    byKey.set(quoteChangeKey(change), change);
  });
  return [...byKey.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
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
    .sort((a, b) => b.price - a.price)
    .slice(0, 20)
    .map((level) => ({ ...level, notional: level.price * level.size }));
  const askLevels = asks
    .sort((a, b) => a.price - b.price)
    .slice(0, 20)
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
    fundingRate: toNumber(ctx.funding),
    markPrice: toNumber(ctx.markPx),
    oraclePrice: toNumber(ctx.oraclePx),
    prevDayPrice: toNumber(ctx.prevDayPx),
    ...summarizeHyperBook(book, mid)
  };
}

async function fetchNasdaqClose() {
  const apiResponse = await fetch("/api/nasdaq-close", { headers: { accept: "application/json" } });
  if (apiResponse.ok) return (await apiResponse.json()) as NasdaqClose;

  const proxyResponse = await fetch("/nasdaq-api/quote/CBRS/info?assetclass=stocks", {
    headers: { accept: "application/json" }
  });
  if (!proxyResponse.ok) throw new Error(`Nasdaq quote returned ${proxyResponse.status}`);
  const payload = (await proxyResponse.json()) as {
    data?: {
      primaryData?: { lastSalePrice?: string; lastTradeTimestamp?: string };
      secondaryData?: { lastSalePrice?: string; lastTradeTimestamp?: string };
    };
  };
  const close = parseUsdValue(payload.data?.secondaryData?.lastSalePrice);
  if (close == null) return null;
  return {
    close,
    timestamp: payload.data?.secondaryData?.lastTradeTimestamp ?? "Closed at May 14, 2026 4:00 PM ET",
    afterHoursPrice: parseUsdValue(payload.data?.primaryData?.lastSalePrice)
  };
}

const normalizeHyperCandles = (candles: HyperCandle[]): ChartCandle[] =>
  candles
    .map((candle) => ({
      time: candle.t,
      open: Number(candle.o),
      high: Number(candle.h),
      low: Number(candle.l),
      close: Number(candle.c)
    }))
    .filter((candle) => [candle.open, candle.high, candle.low, candle.close].every(Number.isFinite));

const mergeLiveHyperTick = (candlesByInterval: ChartCandleMap, price: number, timeMs = Date.now()): ChartCandleMap =>
  Object.fromEntries(
    CHART_INTERVALS.map((interval) => {
      const bucketTime = Math.floor(timeMs / interval.ms) * interval.ms;
      const candles = candlesByInterval[interval.id] ?? [];
      const last = candles.at(-1);
      if (last && last.time === bucketTime) {
        return [
          interval.id,
          [
            ...candles.slice(0, -1),
            {
              ...last,
              high: Math.max(last.high, price),
              low: Math.min(last.low, price),
              close: price
            }
          ]
        ];
      }
      if (last && last.time > bucketTime) return [interval.id, candles];
      const open = last?.close ?? price;
      return [
        interval.id,
        [
          ...candles,
          {
            time: bucketTime,
            open,
            high: Math.max(open, price),
            low: Math.min(open, price),
            close: price
          }
        ].slice(-5000)
      ];
    })
  ) as ChartCandleMap;

async function fetchHyperCandles(interval: ChartInterval, startTime: number, endTime: number) {
  const response = await fetch("/hyperliquid-info", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: {
        coin: HYPER_COIN,
        interval,
        startTime,
        endTime
      }
    })
  });
  if (!response.ok) throw new Error(`Hyperliquid candles returned ${response.status}`);
  return (await response.json()) as HyperCandle[];
}

async function fetchPolymarketPriceHistory(tokenId: string, startTs: number, endTs: number) {
  const params = new URLSearchParams({
    market: tokenId,
    startTs: String(startTs),
    endTs: String(endTs),
    interval: "all",
    fidelity: String(POLYMARKET_HISTORY_FIDELITY_MINUTES)
  });
  const response = await fetch(`/polymarket-clob/prices-history?${params.toString()}`);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Polymarket price history returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  const payload = (await response.json()) as { history?: Array<{ t: number; p: number }> };
  return payload.history ?? [];
}

function buildHistoricalPolymarketSeries(lower: MarketBracket[], upper: MarketBracket[], histories: Record<string, Array<{ t: number; p: number }>>) {
  const tokenIds = [...new Set([...lower, ...upper].map((row) => row.tokenId).filter(Boolean))];
  const normalizedHistories = Object.fromEntries(
    Object.entries(histories).map(([tokenId, history]) => [
      tokenId,
      history
        .map((point) => ({ t: Math.floor(point.t / POLYMARKET_HISTORY_BUCKET_SECONDS) * POLYMARKET_HISTORY_BUCKET_SECONDS, p: Number(point.p) }))
        .filter((point) => Number.isFinite(point.p))
        .sort((a, b) => a.t - b.t)
    ])
  );
  const timestamps = [...new Set(Object.values(normalizedHistories).flatMap((history) => history.map((point) => point.t)))].sort((a, b) => a - b);
  const latest = new Map<string, number>();
  const cursors = new Map<string, number>(tokenIds.map((tokenId) => [tokenId, 0]));
  const points: Array<{ time: number; polymarket: number }> = [];

  timestamps.forEach((timestamp) => {
    tokenIds.forEach((tokenId) => {
      const history = normalizedHistories[tokenId] ?? [];
      let cursor = cursors.get(tokenId) ?? 0;
      while (cursor < history.length && history[cursor].t <= timestamp) {
        const price = Number(history[cursor].p);
        if (Number.isFinite(price)) latest.set(tokenId, price);
        cursor += 1;
      }
      cursors.set(tokenId, cursor);
    });

    const hasFullCoverage = tokenIds.every((tokenId) => latest.has(tokenId));
    if (!hasFullCoverage) return;
    const lowerAtTime = lower.map((row) => ({ ...row, yesPrice: latest.get(row.tokenId)! }));
    const upperAtTime = upper.map((row) => ({ ...row, yesPrice: latest.get(row.tokenId)! }));
    const distributionAtTime = buildDistribution(lowerAtTime, upperAtTime);
    const cap = expectedMarketCap(distributionAtTime);
    if (Number.isFinite(cap) && cap > 0) {
      points.push({
        time: timestamp * 1000,
        polymarket: cap / OFFICIAL_POST_OFFERING_SHARES
      });
    }
  });

  return points;
}

async function fetchHistoricalPriceSeries(lower: MarketBracket[], upper: MarketBracket[]) {
  const endMs = Date.now();
  const polymarketStartMs = endMs - POLYMARKET_HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const startTs = Math.floor(polymarketStartMs / 1000);
  const endTs = Math.floor(endMs / 1000);
  const tokenIds = [...new Set([...lower, ...upper].map((row) => row.tokenId).filter(Boolean))];
  const [hyperCandleEntries, polymarketResult] = await Promise.all([
    Promise.all(CHART_INTERVALS.map(async (interval) => [interval.id, normalizeHyperCandles(await fetchHyperCandles(interval.id, 0, endMs))] as const)),
    Promise.all(tokenIds.map(async (tokenId) => [tokenId, await fetchPolymarketPriceHistory(tokenId, startTs, endTs)] as const))
      .then((histories) => ({ histories, error: null }))
      .catch((error: unknown) => ({
        histories: [] as Array<readonly [string, Array<{ t: number; p: number }>]>,
        error: error instanceof Error ? error.message : "Polymarket history unavailable"
      }))
  ]);
  const candlesByInterval = Object.fromEntries(hyperCandleEntries) as ChartCandleMap;
  const hyperByTime = new Map<number, number>();
  candlesByInterval["5m"].forEach((candle) => {
    if (Number.isFinite(candle.close)) hyperByTime.set(candle.time, candle.close);
  });
  const pmPoints = polymarketResult.error ? [] : buildHistoricalPolymarketSeries(lower, upper, Object.fromEntries(polymarketResult.histories));
  return {
    points: pmPoints.map((point) => ({
      ...point,
      hyperliquid: hyperByTime.get(Math.floor(point.time / (5 * 60_000)) * 5 * 60_000) ?? null
    })),
    candlesByInterval,
    polymarketError: polymarketResult.error
  };
}

function useDashboardData() {
  const [state, setState] = React.useState<DashboardState>({
    lowerEvent: null,
    upperEvent: null,
    polymarketMidpoints: {},
    polymarketDepth: {},
    polymarketTrades: [],
    polymarketQuoteChanges: [],
    polymarketStreamStatus: "connecting",
    hyperPrice: null,
    hyperQuality: null,
    nasdaqClose: null,
    hyperStatus: "connecting",
    polymarketStatus: "loading",
    lastUpdated: null,
    error: null
  });

	  React.useEffect(() => {
	    let cancelled = false;
	    let hyperSocket: WebSocket | null = null;
	    let polymarketSocket: WebSocket | null = null;
	    let polymarketSocketKey = "";
	    let pollId: number | null = null;
	    let polymarketPingId: number | null = null;

	    const clearPolymarketPing = () => {
	      if (polymarketPingId != null) {
	        window.clearInterval(polymarketPingId);
	        polymarketPingId = null;
	      }
	    };

	    const loadPolymarket = async () => {
	      try {
	        const [lowerEvent, upperEvent] = await Promise.all([fetchEvent(LOWER_SLUG), fetchEvent(UPPER_SLUG)]);
	        const yesTokenIds = getYesTokenIds([lowerEvent, upperEvent]);
	        const outcomeTokenRefs = getOutcomeTokenRefs([lowerEvent, upperEvent]);
	        const conditionIds = getBracketConditionIds([lowerEvent, upperEvent]);
	        const [polymarketMidpoints, polymarketDepth, polymarketTrades] = await Promise.all([
	          fetchPolymarketMidpoints(yesTokenIds),
	          fetchPolymarketBooks(yesTokenIds),
	          fetchPolymarketTrades(conditionIds).catch(() => [] as PolymarketTrade[])
	        ]);
	        if (cancelled) return;
	        startPolymarketSocket(outcomeTokenRefs, yesTokenIds);
	        setState((current) => ({
	          ...current,
	          lowerEvent,
	          upperEvent,
	          polymarketMidpoints,
	          polymarketDepth,
	          polymarketTrades: mergePolymarketTrades(current.polymarketTrades, polymarketTrades),
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

	    const startPolymarketSocket = (outcomeTokenRefs: OutcomeTokenRef[], yesTokenIds: string[]) => {
	      const tokenIds = [...new Set(outcomeTokenRefs.map((ref) => ref.tokenId).filter(Boolean))];
	      const nextKey = tokenIds.join(",");
	      if (!tokenIds.length || nextKey === polymarketSocketKey) return;
	      polymarketSocketKey = nextKey;
	      clearPolymarketPing();
	      polymarketSocket?.close();
	      const refByToken = new Map(outcomeTokenRefs.map((ref) => [ref.tokenId, ref]));
	      const yesTokenSet = new Set(yesTokenIds);
	      const updateYesDepth = (assetId: string, depth: PolymarketDepth) => {
	        if (!yesTokenSet.has(assetId)) return;
	        const midpoint = depth.bestBid != null && depth.bestAsk != null ? (depth.bestBid + depth.bestAsk) / 2 : null;
	        setState((current) => ({
	          ...current,
	          polymarketDepth: { ...current.polymarketDepth, [assetId]: depth },
	          polymarketMidpoints: midpoint == null ? current.polymarketMidpoints : { ...current.polymarketMidpoints, [assetId]: midpoint },
	          polymarketStreamStatus: "streaming",
	          polymarketStatus: "live",
	          lastUpdated: Date.now()
	        }));
	      };
	      try {
	        polymarketSocket = new WebSocket("wss://ws-subscriptions-clob.polymarket.com/ws/market");
	        setState((current) => ({ ...current, polymarketStreamStatus: "connecting" }));
	        polymarketSocket.addEventListener("open", () => {
	          polymarketSocket?.send(JSON.stringify({ assets_ids: tokenIds, type: "market", custom_feature_enabled: true }));
	          clearPolymarketPing();
	          polymarketPingId = window.setInterval(() => {
	            if (polymarketSocket?.readyState === WebSocket.OPEN) polymarketSocket.send("PING");
	          }, 10_000);
	          setState((current) => ({ ...current, polymarketStreamStatus: "streaming", polymarketStatus: "live" }));
	        });
	        polymarketSocket.addEventListener("message", (event) => {
	          const rawMessage = event.data as string;
	          if (rawMessage === "PONG") return;
	          if (rawMessage === "PING") {
	            polymarketSocket?.send("PONG");
	            return;
	          }
	          const parsed = JSON.parse(rawMessage) as unknown;
	          const messages = Array.isArray(parsed) ? parsed : [parsed];
	          messages.forEach((message) => {
	            const payload = message as {
	              event_type?: string;
	              asset_id?: string;
	              market?: string;
	              bids?: BookLevel[];
	              asks?: BookLevel[];
	              timestamp?: string | number;
	              price?: string | number;
	              size?: string | number;
	              side?: string;
	              best_bid?: string | number;
	              best_ask?: string | number;
	              spread?: string | number;
	              price_changes?: Array<{ asset_id: string; best_bid?: string; best_ask?: string; price?: string; size?: string; side?: string }>;
	            };
	            if (payload.event_type === "book" && payload.asset_id && payload.bids && payload.asks) {
	              updateYesDepth(payload.asset_id, summarizePolymarketBook({ asset_id: payload.asset_id, bids: payload.bids, asks: payload.asks, timestamp: String(payload.timestamp ?? "") }));
	            }
	            if (payload.event_type === "best_bid_ask" && payload.asset_id && yesTokenSet.has(payload.asset_id)) {
	              const ref = refByToken.get(payload.asset_id);
	              const bid = toNumber(payload.best_bid);
	              const ask = toNumber(payload.best_ask);
	              if (!ref || bid == null || ask == null) return;
	              const midpoint = (bid + ask) / 2;
	              if (!Number.isFinite(midpoint)) return;
	              setState((current) => {
	                const existingDepth = current.polymarketDepth[payload.asset_id as string];
	                const previousMidpoint = current.polymarketMidpoints[payload.asset_id as string];
	                const delta = Number.isFinite(previousMidpoint) ? midpoint - previousMidpoint : null;
	                const depth: PolymarketDepth = {
	                  bidDepth2c: existingDepth?.bidDepth2c ?? 0,
	                  askDepth2c: existingDepth?.askDepth2c ?? 0,
	                  bestBid: bid,
	                  bestAsk: ask,
	                  spread: toNumber(payload.spread) ?? ask - bid,
	                  bidLevels: existingDepth?.bidLevels ?? [],
	                  askLevels: existingDepth?.askLevels ?? []
	                };
	                const quoteChanges =
	                  delta == null || Math.abs(delta) >= 0.0005
	                    ? [
	                        {
	                          asset: payload.asset_id as string,
	                          conditionId: ref.conditionId,
	                          timestamp: Number(payload.timestamp) > 10_000_000_000 ? Math.floor(Number(payload.timestamp) / 1000) : Number(payload.timestamp) || Math.floor(Date.now() / 1000),
	                          outcome: ref.outcome,
	                          bracketTitle: ref.title,
	                          slug: ref.slug,
	                          eventSlug: ref.eventSlug,
	                          bestBid: bid,
	                          bestAsk: ask,
	                          midpoint,
	                          previousMidpoint: Number.isFinite(previousMidpoint) ? previousMidpoint : null,
	                          delta,
	                          side: "BBO",
	                          size: null
	                        }
	                      ]
	                    : [];
	                return {
	                  ...current,
	                  polymarketMidpoints: { ...current.polymarketMidpoints, [payload.asset_id as string]: midpoint },
	                  polymarketDepth: { ...current.polymarketDepth, [payload.asset_id as string]: depth },
	                  polymarketQuoteChanges: quoteChanges.length
	                    ? mergePolymarketQuoteChanges(current.polymarketQuoteChanges, quoteChanges)
	                    : current.polymarketQuoteChanges,
	                  polymarketStreamStatus: "streaming",
	                  polymarketStatus: "live",
	                  lastUpdated: Date.now()
	                };
	              });
	            }
	            if (payload.event_type === "price_change" && payload.price_changes) {
	              const relevantChanges = payload.price_changes.filter((change) => yesTokenSet.has(change.asset_id));
	              if (relevantChanges.length) {
	                setState((current) => {
	                  const midpointUpdates: Record<string, number> = {};
	                  const depthUpdates: Record<string, PolymarketDepth> = {};
	                  const quoteChanges: PolymarketQuoteChange[] = [];
	                  relevantChanges.forEach((change) => {
	                    const ref = refByToken.get(change.asset_id);
	                    const bid = toNumber(change.best_bid);
	                    const ask = toNumber(change.best_ask);
	                    const price = toNumber(change.price);
	                    const midpoint = bid != null && ask != null && ask > 0 ? (bid + ask) / 2 : price;
	                    if (!ref || midpoint == null || !Number.isFinite(midpoint)) return;
	                    const previousMidpoint = current.polymarketMidpoints[change.asset_id];
	                    const delta = Number.isFinite(previousMidpoint) ? midpoint - previousMidpoint : null;
	                    midpointUpdates[change.asset_id] = midpoint;
	                    if (bid != null || ask != null) {
	                      const existingDepth = current.polymarketDepth[change.asset_id];
	                      depthUpdates[change.asset_id] = {
	                        bidDepth2c: existingDepth?.bidDepth2c ?? 0,
	                        askDepth2c: existingDepth?.askDepth2c ?? 0,
	                        bestBid: bid ?? existingDepth?.bestBid ?? null,
	                        bestAsk: ask ?? existingDepth?.bestAsk ?? null,
	                        spread: bid != null && ask != null ? ask - bid : existingDepth?.spread ?? null,
	                        bidLevels: existingDepth?.bidLevels ?? [],
	                        askLevels: existingDepth?.askLevels ?? []
	                      };
	                    }
	                    if (delta == null || Math.abs(delta) >= 0.0005) {
	                      quoteChanges.push({
	                        asset: change.asset_id,
	                        conditionId: ref.conditionId,
	                        timestamp: Number(payload.timestamp) > 10_000_000_000 ? Math.floor(Number(payload.timestamp) / 1000) : Number(payload.timestamp) || Math.floor(Date.now() / 1000),
	                        outcome: ref.outcome,
	                        bracketTitle: ref.title,
	                        slug: ref.slug,
	                        eventSlug: ref.eventSlug,
	                        bestBid: bid,
	                        bestAsk: ask,
	                        midpoint,
	                        previousMidpoint: Number.isFinite(previousMidpoint) ? previousMidpoint : null,
	                        delta,
	                        side: change.side,
	                        size: toNumber(change.size)
	                      });
	                    }
	                  });
	                  return {
	                    ...current,
	                    polymarketMidpoints: { ...current.polymarketMidpoints, ...midpointUpdates },
	                    polymarketDepth: Object.keys(depthUpdates).length ? { ...current.polymarketDepth, ...depthUpdates } : current.polymarketDepth,
	                    polymarketQuoteChanges: quoteChanges.length
	                      ? mergePolymarketQuoteChanges(current.polymarketQuoteChanges, quoteChanges)
	                      : current.polymarketQuoteChanges,
	                    polymarketStreamStatus: "streaming",
	                    polymarketStatus: "live",
	                    lastUpdated: Date.now()
	                  };
	                });
	              }
	            }
	            if (payload.event_type === "last_trade_price" && payload.asset_id) {
	              const ref = refByToken.get(payload.asset_id);
	              const price = Number(payload.price);
	              const size = Number(payload.size);
	              const timestampRaw = Number(payload.timestamp);
	              if (!ref || !Number.isFinite(price) || !Number.isFinite(size) || !Number.isFinite(timestampRaw)) return;
	              const trade: PolymarketTrade = {
	                proxyWallet: "",
	                side: payload.side ?? "UNKNOWN",
	                asset: payload.asset_id,
	                conditionId: ref.conditionId,
	                size,
	                price,
	                timestamp: timestampRaw > 10_000_000_000 ? Math.floor(timestampRaw / 1000) : timestampRaw,
	                title: ref.title,
	                slug: ref.slug,
	                eventSlug: ref.eventSlug,
	                outcome: ref.outcome,
	                outcomeIndex: ref.outcomeIndex,
	                pseudonym: "CLOB live",
	                source: "clob"
	              };
	              setState((current) => ({
	                ...current,
	                polymarketTrades: mergePolymarketTrades(current.polymarketTrades, [trade]),
	                polymarketStreamStatus: "streaming",
	                polymarketStatus: "live",
	                lastUpdated: Date.now()
	              }));
	            }
	          });
	        });
	        polymarketSocket.addEventListener("error", () => {
	          clearPolymarketPing();
	          setState((current) => ({ ...current, polymarketStreamStatus: "polling" }));
	        });
	        polymarketSocket.addEventListener("close", () => {
	          clearPolymarketPing();
	          if (!cancelled) {
	            setState((current) => ({ ...current, polymarketStreamStatus: "polling" }));
	            polymarketSocketKey = "";
	            window.setTimeout(() => startPolymarketSocket(outcomeTokenRefs, yesTokenIds), 2500);
	          }
	        });
	      } catch {
	        setState((current) => ({ ...current, polymarketStreamStatus: "polling" }));
	      }
	    };

    const pollHyper = async (status: DashboardState["hyperStatus"] = "polling") => {
      try {
        const [hyperPrice, hyperQuality, nasdaqClose] = await Promise.all([
          fetchHyperMid(),
          fetchHyperQuality(),
          fetchNasdaqClose().catch(() => null)
        ]);
        if (cancelled) return;
        setState((current) => ({
          ...current,
          hyperPrice,
          hyperQuality,
          nasdaqClose: nasdaqClose ?? current.nasdaqClose,
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
	      clearPolymarketPing();
	      hyperSocket?.close();
	      polymarketSocket?.close();
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

function MiniBar({ value, max, tone = "gold" }: { value: number; max: number; tone?: "green" | "red" | "gold" | "blue" }) {
  const width = max > 0 ? Math.max(Math.sqrt(value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="miniBar">
      <div className={`miniBarFill ${tone}`} style={{ width: `${Math.min(width, 100)}%` }} />
    </div>
  );
}

function MeasureCell({ value, max, tone }: { value: number; max: number; tone: "green" | "red" | "gold" | "blue" }) {
  return (
    <div className="measureCell">
      <span>{formatCompactUsd(value)}</span>
      <MiniBar value={value} max={max} tone={tone} />
    </div>
  );
}

function StrikePopover({
  row,
  maxDepth,
  maxVolume,
  maxLiquidity
}: {
  row: MarketBracket & {
    probability: number;
    depthTotal: number;
    bidDepth: number;
    askDepth: number;
    bidLevels: Array<{ price: number; size: number; notional: number; cumulative: number }>;
    askLevels: Array<{ price: number; size: number; notional: number; cumulative: number }>;
  };
  maxDepth: number;
  maxVolume: number;
  maxLiquidity: number;
}) {
  const maxLevelNotional = Math.max(...row.bidLevels.map((level) => level.notional), ...row.askLevels.map((level) => level.notional), 1);
  const depthTotal = row.bidDepth + row.askDepth;
  const bidShare = depthTotal ? (row.bidDepth / depthTotal) * 100 : 50;
  const topBidLevels = row.bidLevels.slice(0, 5);
  const topAskLevels = row.askLevels.slice(0, 5);

  return (
    <div className="strikePopover">
      <div className="strikePopoverHeader">
        <span>Market cap bracket</span>
        <strong>{row.label}</strong>
      </div>

      <div className="strikeProbGrid">
        <div>
          <span>PM page Yes</span>
          <strong>{row.pageYesPrice == null ? "n/a" : formatPercent(row.pageYesPrice)}</strong>
        </div>
        <div>
          <span>Robust Yes</span>
          <strong>{formatPercent(row.yesPrice)}</strong>
        </div>
        <div>
          <span>Blended prob</span>
          <strong>{formatPercent(row.probability)}</strong>
        </div>
        <div>
          <span>Bid / Ask</span>
          <strong>
            {row.bid == null ? "n/a" : formatPercent(row.bid)} / {row.ask == null ? "n/a" : formatPercent(row.ask)}
          </strong>
        </div>
        <div>
          <span>Implied close</span>
          <strong>{formatImpliedPriceRange(row.low, row.high)}</strong>
        </div>
      </div>

      <div className="depthImbalance">
        <div className="depthImbalanceLabels">
          <span>Bid support {formatCompactUsd(row.bidDepth)}</span>
          <span>Ask supply {formatCompactUsd(row.askDepth)}</span>
        </div>
        <div className="depthImbalanceTrack">
          <div className="bidShare" style={{ width: `${bidShare}%` }} />
          <div className="askShare" style={{ width: `${100 - bidShare}%` }} />
        </div>
      </div>

      <div className="limitBookViz">
        <div className="limitSide">
          <div className="limitSideHeader">
            <span>Bid limits</span>
            <b>Price · $ depth</b>
          </div>
          {topBidLevels.map((level) => (
            <div className="limitLevel bid" key={`bid-${row.id}-${level.price}`}>
              <span>{formatPercent(level.price)}</span>
              <MiniBar value={level.notional} max={maxLevelNotional} tone="green" />
              <b>{formatCompactUsd(level.notional)}</b>
            </div>
          ))}
          {topBidLevels.length === 0 ? <small>No visible bid levels</small> : null}
        </div>
        <div className="limitSide">
          <div className="limitSideHeader">
            <span>Ask limits</span>
            <b>Price · $ depth</b>
          </div>
          {topAskLevels.map((level) => (
            <div className="limitLevel ask" key={`ask-${row.id}-${level.price}`}>
              <span>{formatPercent(level.price)}</span>
              <MiniBar value={level.notional} max={maxLevelNotional} tone="red" />
              <b>{formatCompactUsd(level.notional)}</b>
            </div>
          ))}
          {topAskLevels.length === 0 ? <small>No visible ask levels</small> : null}
        </div>
      </div>

      <div className="strikeVisualRows">
        <label>
          <span>2c near-touch depth</span>
          <b>{formatCompactUsd(row.depthTotal)}</b>
        </label>
        <MiniBar value={row.depthTotal} max={maxDepth} tone="gold" />
        <label>
          <span>24h volume</span>
          <b>{formatCompactUsd(row.volume24h)}</b>
        </label>
        <MiniBar value={row.volume24h} max={maxVolume} tone="green" />
        <label>
          <span>Displayed liquidity</span>
          <b>{formatCompactUsd(row.liquidity)}</b>
        </label>
        <MiniBar value={row.liquidity} max={maxLiquidity} tone="red" />
      </div>
    </div>
  );
}

type AnnotatedTrade = PolymarketTrade & {
  bracketLabel: string;
  impliedPriceRange: string;
  notional: number;
  yesDirection: "up" | "down";
  pressure: number;
  traderLabel: string;
};

const annotateTrades = (trades: PolymarketTrade[], brackets: MarketBracket[]) => {
  const byCondition = new Map(brackets.map((row) => [row.conditionId, row]));
  return trades
    .map((trade) => {
      const bracket = byCondition.get(trade.conditionId);
      if (!bracket) return null;
      const side = trade.side.toUpperCase();
      const outcome = trade.outcome.toLowerCase();
      const isYes = outcome === "yes";
      const yesDirection: AnnotatedTrade["yesDirection"] = (isYes && side === "BUY") || (!isYes && side === "SELL") ? "up" : "down";
      const notional = trade.size * trade.price;
      return {
        ...trade,
        side,
        bracketLabel: bracket.label,
        impliedPriceRange: formatImpliedPriceRange(bracket.low, bracket.high),
        notional,
        yesDirection,
        pressure: notional * (yesDirection === "up" ? 1 : -1),
        traderLabel: trade.pseudonym || trade.name || shortAddress(trade.proxyWallet)
      };
    })
    .filter(Boolean) as AnnotatedTrade[];
};

const summarizeTradePressure = (trades: AnnotatedTrade[]) => {
  const latestTimestamp = Math.max(...trades.map((trade) => trade.timestamp), 0);
  const recent = latestTimestamp ? trades.filter((trade) => latestTimestamp - trade.timestamp <= 15 * 60) : trades;
  const byBracket = new Map<string, { label: string; impliedPriceRange: string; up: number; down: number; net: number; count: number }>();
  recent.forEach((trade) => {
    const current = byBracket.get(trade.bracketLabel) ?? {
      label: trade.bracketLabel,
      impliedPriceRange: trade.impliedPriceRange,
      up: 0,
      down: 0,
      net: 0,
      count: 0
    };
    if (trade.pressure >= 0) current.up += trade.notional;
    else current.down += trade.notional;
    current.net += trade.pressure;
    current.count += 1;
    byBracket.set(trade.bracketLabel, current);
  });
  return [...byBracket.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
};

const pressureShare = (value: number, total: number) => `${Math.max(4, total > 0 ? (value / total) * 100 : 0).toFixed(1)}%`;

type AnnotatedQuoteChange = PolymarketQuoteChange & {
  bracketLabel: string;
  impliedPriceRange: string;
};

const annotateQuoteChanges = (quoteChanges: PolymarketQuoteChange[], brackets: MarketBracket[]) => {
  const byCondition = new Map(brackets.map((row) => [row.conditionId, row]));
  return quoteChanges
    .map((change) => {
      const bracket = byCondition.get(change.conditionId);
      if (!bracket) return null;
      return {
        ...change,
        bracketLabel: bracket.label,
        impliedPriceRange: formatImpliedPriceRange(bracket.low, bracket.high)
      };
    })
    .filter(Boolean) as AnnotatedQuoteChange[];
};

const aggregateLineData = (
  points: PricePoint[],
  key: "polymarket" | "hyperliquid",
  intervalMs: number
): LineData<UTCTimestamp>[] => {
  const byTime = new Map<number, number>();
  [...points]
    .sort((a, b) => a.time - b.time)
    .forEach((point) => {
      const value = point[key];
      if (value == null || !Number.isFinite(value)) return;
      byTime.set(Math.floor(point.time / intervalMs) * Math.floor(intervalMs / 1000), value);
    });
  return [...byTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({ time: time as UTCTimestamp, value }));
};

const aggregatePricePoints = (points: PricePoint[], intervalMs: number): PricePoint[] => {
  const byTime = new Map<number, PricePoint>();
  [...points]
    .sort((a, b) => a.time - b.time)
    .forEach((point) => {
      const bucket = Math.floor(point.time / intervalMs) * intervalMs;
      byTime.set(bucket, {
        time: bucket,
        polymarket: point.polymarket,
        hyperliquid: point.hyperliquid
      });
    });
  return [...byTime.values()].sort((a, b) => a.time - b.time);
};

const toCandleData = (candles: ChartCandle[]): CandlestickData<UTCTimestamp>[] =>
  candles.map((candle) => ({
    time: Math.floor(candle.time / 1000) as UTCTimestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close
  }));

function PriceComparisonChart({
  points,
  candlesByInterval,
  historyStatus,
  hyperQuality
}: {
  points: PricePoint[];
  candlesByInterval: ChartCandleMap;
  historyStatus: string;
  hyperQuality: HyperQuality | null;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const pmSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
  const hlSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastAutoFitRef = React.useRef<{ interval: ChartInterval | null; start: number | null; end: number | null }>({ interval: null, start: null, end: null });
  const measurementStartRef = React.useRef<{ x: number; y: number; price: number; timeMs: number | null } | null>(null);
  const [interval, setInterval] = React.useState<ChartInterval>("15m");
  const [hover, setHover] = React.useState<{ time: number | null; polymarket: number | null; hyperliquid: number | null } | null>(null);
  const [measurement, setMeasurement] = React.useState<ChartMeasurement | null>(null);
  const selectedInterval = CHART_INTERVALS.find((item) => item.id === interval) ?? CHART_INTERVALS[1];
  const displayPoints = React.useMemo(() => aggregatePricePoints(points, selectedInterval.ms), [points, selectedInterval.ms]);
  const displayCandles = React.useMemo(() => candlesByInterval[interval] ?? [], [candlesByInterval, interval]);
  const hlHistoryStatus =
    displayCandles.length > 0
      ? `HL ${selectedInterval.label} returned range: ${formatLocalDateTime(displayCandles[0].time)} - ${formatLocalDateTime(displayCandles.at(-1)!.time)}`
      : `HL ${selectedInterval.label} history unavailable`;
  const latest = displayPoints.at(-1);

  const getMeasurementPoint = React.useCallback((event: PointerEvent) => {
    const container = containerRef.current;
    const series = hlSeriesRef.current ?? pmSeriesRef.current;
    const chart = chartRef.current;
    if (!container || !series || !chart) return null;
    const rect = container.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    const price = Number(series.coordinateToPrice(y));
    if (!Number.isFinite(price)) return null;
    const timeMs = chartTimeToMs(chart.timeScale().coordinateToTime(x));
    return { x, y, price, timeMs: Number.isFinite(timeMs) ? timeMs : null };
  }, []);

  React.useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    const container = containerRef.current;
    const chart = createChart(containerRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#fbfaf7" },
        textColor: "#415064",
        fontFamily: '"IBM Plex Mono", "SFMono-Regular", "Roboto Mono", Consolas, monospace',
        fontSize: 11
      },
      grid: {
        vertLines: { color: "rgba(82, 96, 120, 0.08)" },
        horzLines: { color: "rgba(82, 96, 120, 0.10)" }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#6b7280", labelBackgroundColor: "#111827" },
        horzLine: { color: "#6b7280", labelBackgroundColor: "#111827" }
      },
      rightPriceScale: {
        visible: true,
        borderColor: "rgba(82, 96, 120, 0.22)",
        scaleMargins: { top: 0.16, bottom: 0.16 }
      },
      leftPriceScale: {
        visible: false
      },
      timeScale: {
        borderColor: "rgba(82, 96, 120, 0.22)",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: formatChartTick,
        lockVisibleTimeRangeOnResize: true
      },
      localization: {
        timeFormatter: (time: unknown) => formatChartAxisTime(Number(time) * 1000),
        priceFormatter: (price: number) => formatUsd(price, 2)
      },
      handleScale: true,
      handleScroll: true
    });
    const pmSeries = chart.addSeries(LineSeries, {
      color: "#2557d6",
      lineWidth: 2,
      priceLineColor: "#2557d6",
      priceLineWidth: 1,
      lastValueVisible: true,
      priceScaleId: "right",
      title: "PM"
    });
    const hlSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#17815e",
      downColor: "#bb3e3e",
      borderUpColor: "#17815e",
      borderDownColor: "#bb3e3e",
      wickUpColor: "#17815e",
      wickDownColor: "#bb3e3e",
      priceScaleId: "right",
      lastValueVisible: true,
      title: "HL"
    });
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setHover(null);
        return;
      }
      const pmData = param.seriesData.get(pmSeries) as LineData<UTCTimestamp> | undefined;
      const hlData = param.seriesData.get(hlSeries) as CandlestickData<UTCTimestamp> | undefined;
      setHover({
        time: Number(param.time),
        polymarket: pmData?.value ?? null,
        hyperliquid: hlData?.close ?? null
      });
    });
    chartRef.current = chart;
    pmSeriesRef.current = pmSeries;
    hlSeriesRef.current = hlSeries;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      pmSeriesRef.current = null;
      hlSeriesRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!event.shiftKey || event.button !== 0) return;
      const point = getMeasurementPoint(event);
      if (!point) return;
      event.preventDefault();
      event.stopPropagation();
      measurementStartRef.current = point;
      setMeasurement({
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
        startPrice: point.price,
        endPrice: point.price,
        startTimeMs: point.timeMs,
        endTimeMs: point.timeMs
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      const start = measurementStartRef.current;
      if (!start) return;
      const point = getMeasurementPoint(event);
      if (!point) return;
      event.preventDefault();
      setMeasurement({
        startX: start.x,
        startY: start.y,
        endX: point.x,
        endY: point.y,
        startPrice: start.price,
        endPrice: point.price,
        startTimeMs: start.timeMs,
        endTimeMs: point.timeMs
      });
    };

    const onWindowPointerDown = () => {
      measurementStartRef.current = null;
      setMeasurement(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        measurementStartRef.current = null;
        setMeasurement(null);
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerdown", onWindowPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onWindowPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [getMeasurementPoint]);

  React.useEffect(() => {
    const pmData = aggregateLineData(points, "polymarket", selectedInterval.ms);
    const candleData = toCandleData(displayCandles);
    pmSeriesRef.current?.setData(pmData);
    hlSeriesRef.current?.setData(candleData);
    const dataTimes = [...pmData.map((point) => Number(point.time)), ...candleData.map((candle) => Number(candle.time))];
    if (dataTimes.length === 0) return;
    const start = Math.min(...dataTimes);
    const end = Math.max(...dataTimes);
    const previous = lastAutoFitRef.current;
    const shouldAutoFit =
      previous.start == null ||
      previous.interval !== interval ||
      (Number.isFinite(start) && previous.start != null && start < previous.start - selectedInterval.ms / 1000);
    if (shouldAutoFit) {
      chartRef.current?.timeScale().fitContent();
    }
    lastAutoFitRef.current = { interval, start, end };
  }, [points, displayCandles, interval, selectedInterval.ms]);

  const readout = hover ?? (latest ? { time: Math.floor(latest.time / 1000), polymarket: latest.polymarket, hyperliquid: latest.hyperliquid } : null);
  const readoutSpread = readout?.polymarket && readout.hyperliquid != null ? readout.hyperliquid - readout.polymarket : null;
  const readoutSpreadPct = readoutSpread != null && readout?.polymarket ? readoutSpread / readout.polymarket : null;
  const chartOiNotional = hyperOiNotional(hyperQuality, readout?.hyperliquid);
  const chartAnnualizedFunding = annualizedHyperFunding(hyperQuality?.fundingRate);
  const measurementDelta = measurement ? measurement.endPrice - measurement.startPrice : null;
  const measurementPct = measurement && measurement.startPrice !== 0 ? measurementDelta! / measurement.startPrice : null;
  const measurementLeft = measurement ? Math.min(measurement.startX, measurement.endX) : 0;
  const measurementTop = measurement ? Math.min(measurement.startY, measurement.endY) : 0;
  const measurementWidth = measurement ? Math.abs(measurement.endX - measurement.startX) : 0;
  const measurementHeight = measurement ? Math.abs(measurement.endY - measurement.startY) : 0;
  const measurementLabelX = measurement ? Math.min(Math.max(measurement.endX + 10, 8), Math.max(8, (containerRef.current?.clientWidth ?? 0) - 178)) : 0;
  const measurementLabelY = measurement ? Math.min(Math.max(measurement.endY - 18, 8), Math.max(8, (containerRef.current?.clientHeight ?? 0) - 86)) : 0;
  const measurementTimeDelta =
    measurement?.startTimeMs != null && measurement.endTimeMs != null ? measurement.endTimeMs - measurement.startTimeMs : null;
  const measurementTimeRange =
    measurement?.startTimeMs != null && measurement.endTimeMs != null
      ? `${formatLocalDateTime(Math.min(measurement.startTimeMs, measurement.endTimeMs))} - ${formatLocalDateTime(Math.max(measurement.startTimeMs, measurement.endTimeMs))}`
      : "Time range n/a";

  return (
    <section className="panel priceChartPanel">
      <div className="panelHeader chartHeader">
        <div>
          <p>Market Chart</p>
          <h2>PM midpoint close model vs Hyperliquid</h2>
        </div>
        <div className="rangeControls" aria-label="Candle interval">
          <span>Candles</span>
          {CHART_INTERVALS.map((item) => (
            <button className={interval === item.id ? "active" : ""} key={item.id} type="button" onClick={() => setInterval(item.id)}>
              {item.label}
            </button>
          ))}
          <button type="button" onClick={() => chartRef.current?.timeScale().fitContent()}>
            Fit
          </button>
        </div>
      </div>
      <div className="chartReadout">
        <span>
          Spread{" "}
          {readoutSpread == null
            ? "n/a"
            : `${readoutSpread >= 0 ? "+" : ""}${formatUsd(readoutSpread)} / ${readoutSpreadPct == null ? "n/a" : formatSignedPercent(readoutSpreadPct)}`}
        </span>
        <span>HL 24h vol {formatMaybeCompactUsd(hyperQuality?.dayVolume)}</span>
        <span>
          HL OI {formatMaybeCompactUsd(chartOiNotional)}
          <small>{formatMaybeNumber(hyperQuality?.openInterest)} CBRS</small>
        </span>
        <span
          className="tooltipChip"
          data-tooltip={`Annualized: ${formatMaybePercent(chartAnnualizedFunding)}. Hyperliquid funding is hourly; annualized = current hourly rate x 24 x 365.`}
        >
          HL funding {formatMaybeFundingRate(hyperQuality?.fundingRate)}
        </span>
        <span>{readout?.time ? formatChartAxisTime(readout.time * 1000) : "Waiting for data"}</span>
      </div>
      <div className="marketChart" ref={containerRef}>
        {measurement && measurementDelta != null ? (
          <div className="measureOverlay" aria-hidden="true">
            <div
              className={`measureBox ${measurementDelta >= 0 ? "up" : "down"}`}
              style={{ left: measurementLeft, top: measurementTop, width: measurementWidth, height: measurementHeight }}
            />
            <svg className="measureLine" viewBox={`0 0 ${containerRef.current?.clientWidth ?? 1} ${containerRef.current?.clientHeight ?? 1}`}>
              <line
                className={measurementDelta >= 0 ? "up" : "down"}
                x1={measurement.startX}
                y1={measurement.startY}
                x2={measurement.endX}
                y2={measurement.endY}
              />
            </svg>
            <div className={`measureLabel ${measurementDelta >= 0 ? "up" : "down"}`} style={{ left: measurementLabelX, top: measurementLabelY }}>
              <strong>
                {measurementDelta >= 0 ? "+" : ""}
                {formatUsd(measurementDelta)}
              </strong>
              <span>{measurementPct == null ? "n/a" : formatSignedPercent(measurementPct)}</span>
              <small>{formatDuration(measurementTimeDelta)}</small>
              <em>{measurementTimeRange}</em>
            </div>
          </div>
        ) : null}
      </div>
      <div className="chartFooter">
        <span>
          {hlHistoryStatus} · {historyStatus}
        </span>
        <span>
          {displayPoints.length} PM buckets · {displayCandles.length} HL {selectedInterval.label} candles · Shift-click measures %
        </span>
      </div>
    </section>
  );
}

function App() {
  const data = useDashboardData();
  const [hoveredBracketId, setHoveredBracketId] = React.useState<string | null>(null);
  const [hyperDepthPct, setHyperDepthPct] = React.useState(0.01);
  const { lower, upper } = getBrackets(data.lowerEvent, data.upperEvent, data.polymarketMidpoints, data.polymarketDepth);
  const distribution = buildDistribution(lower, upper);
  const expectedCap = expectedMarketCap(distribution);
  const capP10 = distributionQuantile(distribution, 0.1);
  const capP25 = distributionQuantile(distribution, 0.25);
  const capP75 = distributionQuantile(distribution, 0.75);
  const capP90 = distributionQuantile(distribution, 0.9);
  const allBrackets = [...lower, ...upper];
  const pmBracketVolume24h = allBrackets.reduce((sum, row) => sum + row.volume24h, 0);
  const pmBracketVolumeTotal = allBrackets.reduce((sum, row) => sum + row.volumeTotal, 0);
  const pmVolume24h =
    eventNumber(data.lowerEvent?.volume24hr) + eventNumber(data.upperEvent?.volume24hr) || pmBracketVolume24h;
  const pmVolumeTotal = eventNumber(data.lowerEvent?.volume) + eventNumber(data.upperEvent?.volume) || pmBracketVolumeTotal;
  const pmLiquidity =
    eventNumber(data.lowerEvent?.liquidityClob ?? data.lowerEvent?.liquidity) +
      eventNumber(data.upperEvent?.liquidityClob ?? data.upperEvent?.liquidity) || allBrackets.reduce((sum, row) => sum + row.liquidity, 0);
  const polymarketClosed = isPolymarketEventClosed(data.lowerEvent) && isPolymarketEventClosed(data.upperEvent);
  const polymarketAcceptingOrders = [data.lowerEvent, data.upperEvent].some((event) =>
    event?.markets?.some((market) => !isPolymarketMarketClosed(market) && market.acceptingOrders !== false)
  );
  const polymarketStatusLabel = polymarketClosed
    ? "closed"
    : polymarketAcceptingOrders
      ? data.polymarketStreamStatus === "streaming"
        ? "streaming"
        : data.polymarketStatus
      : "finalizing";
  const qualityRows = distribution.map((row) => {
    const depth = data.polymarketDepth[row.tokenId];
    return {
      ...row,
      depthTotal: (depth?.bidDepth2c ?? 0) + (depth?.askDepth2c ?? 0),
      bidDepth: depth?.bidDepth2c ?? 0,
      askDepth: depth?.askDepth2c ?? 0,
      bidLevels: depth?.bidLevels ?? [],
      askLevels: depth?.askLevels ?? []
    };
  });
  const distributionDepth = qualityRows.reduce((sum, row) => sum + row.depthTotal, 0);
  const maxQualityDepth = Math.max(...qualityRows.map((row) => row.depthTotal), 1);
  const maxQualityVolume = Math.max(...qualityRows.map((row) => row.volume24h), 1);
  const maxQualityTotalVolume = Math.max(...qualityRows.map((row) => row.volumeTotal), 1);
  const maxQualityLiquidity = Math.max(...qualityRows.map((row) => row.liquidity), 1);
  const annotatedTrades = React.useMemo(() => annotateTrades(data.polymarketTrades, allBrackets), [data.polymarketTrades, allBrackets]);
  const annotatedQuoteChanges = React.useMemo(() => annotateQuoteChanges(data.polymarketQuoteChanges, allBrackets), [data.polymarketQuoteChanges, allBrackets]);
  const tradePressureRows = React.useMemo(() => summarizeTradePressure(annotatedTrades), [annotatedTrades]);
  const pressureTotals = React.useMemo(
    () =>
      tradePressureRows.reduce(
        (totals, row) => ({
          up: totals.up + row.up,
          down: totals.down + row.down,
          count: totals.count + row.count
        }),
        { up: 0, down: 0, count: 0 }
      ),
    [tradePressureRows]
  );
  const pressureNet = pressureTotals.up - pressureTotals.down;
  const pressureTotalFlow = pressureTotals.up + pressureTotals.down;
  const largeTradeCutoff = React.useMemo(() => {
    const notionals = annotatedTrades.map((trade) => trade.notional).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
    return Math.max(250, notionals[Math.floor(notionals.length * 0.9)] ?? 0);
  }, [annotatedTrades]);
  const largestTrade = annotatedTrades.reduce<AnnotatedTrade | null>((largest, trade) => (!largest || trade.notional > largest.notional ? trade : largest), null);
  const hyperMidForDepth =
    data.hyperPrice ??
    data.hyperQuality?.markPrice ??
    (data.hyperQuality?.bestBid != null && data.hyperQuality?.bestAsk != null ? (data.hyperQuality.bestBid + data.hyperQuality.bestAsk) / 2 : null);
  const hyperBidLevels = (data.hyperQuality?.bidLevels ?? []).filter((level) => hyperMidForDepth == null || level.price >= hyperMidForDepth * (1 - hyperDepthPct));
  const hyperAskLevels = (data.hyperQuality?.askLevels ?? []).filter((level) => hyperMidForDepth == null || level.price <= hyperMidForDepth * (1 + hyperDepthPct));
  const hyperBidDepth = hyperBidLevels.reduce((sum, level) => sum + level.notional, 0);
  const hyperAskDepth = hyperAskLevels.reduce((sum, level) => sum + level.notional, 0);
  const hyperBookMax = Math.max(...hyperBidLevels.map((level) => level.notional), ...hyperAskLevels.map((level) => level.notional), 1);
  const hyperBboSpreadPct =
    data.hyperQuality?.spread != null && hyperMidForDepth != null && hyperMidForDepth > 0 ? data.hyperQuality.spread / hyperMidForDepth : null;
  const hyperOpenInterestNotional = hyperOiNotional(data.hyperQuality, hyperMidForDepth);
  const hyperAnnualizedFunding = annualizedHyperFunding(data.hyperQuality?.fundingRate);
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
  const nasdaqClosePrice = data.nasdaqClose?.close ?? null;
  const nasdaqCloseCap = nasdaqClosePrice == null ? null : nasdaqClosePrice * OFFICIAL_POST_OFFERING_SHARES;
  const nasdaqCloseVsMidpoint = nasdaqClosePrice == null ? null : nasdaqClosePrice - polymarketSharePrice;
  const officialIpoCap = IPO_OFFER_PRICE * OFFICIAL_POST_OFFERING_SHARES;
  const hyperImpliedCap = data.hyperPrice == null ? null : data.hyperPrice * OFFICIAL_POST_OFFERING_SHARES;
  const officialIpoCapWithOption = IPO_OFFER_PRICE * OFFICIAL_POST_OFFERING_WITH_OPTION_SHARES;
  const impliedFullyDilutedCap = IPO_OFFER_PRICE * POTENTIAL_DILUTED_SCENARIO_SHARES;
  const grossProceeds = IPO_OFFER_PRICE * IPO_OFFERED_SHARES;
  const grossProceedsWithOption = IPO_OFFER_PRICE * (IPO_OFFERED_SHARES + IPO_OVERALLOTMENT_SHARES);
  const offeredFloatPct = IPO_OFFERED_SHARES / OFFICIAL_POST_OFFERING_SHARES;
  const offeredFloatWithOptionPct = (IPO_OFFERED_SHARES + IPO_OVERALLOTMENT_SHARES) / OFFICIAL_POST_OFFERING_WITH_OPTION_SHARES;
  const maxProbability = Math.max(...distribution.map((row) => row.probability), 0.01);
  const probabilityTotal = distribution.reduce((sum, row) => sum + row.probability, 0);
  const topProbabilityRow = distribution.reduce<(MarketBracket & { probability: number; method: string }) | null>(
    (top, row) => (!top || row.probability > top.probability ? row : top),
    null
  );
  const resolvedBracketRow =
    polymarketClosed && distribution.length
      ? distribution.find((row) => row.pageYesPrice != null && row.pageYesPrice >= 0.99) ?? topProbabilityRow
      : null;
  const distributionLensRows = qualityRows.map((row) => {
    const { low, high } = boundsFor(row);
    return {
      ...row,
      lowPrice: low / OFFICIAL_POST_OFFERING_SHARES,
      highPrice: high / OFFICIAL_POST_OFFERING_SHARES,
      centerPrice: midpointFor(row.low, row.high) / OFFICIAL_POST_OFFERING_SHARES
    };
  });
  const lensPrices = [
    IPO_OFFER_PRICE,
    polymarketSharePrice,
    data.hyperPrice,
    nasdaqClosePrice,
    ...distributionLensRows.flatMap((row) => [row.lowPrice, row.highPrice])
  ].filter((value): value is number => value != null && Number.isFinite(value));
  const lensRawMin = lensPrices.length ? Math.min(...lensPrices) : IPO_OFFER_PRICE;
  const lensRawMax = lensPrices.length ? Math.max(...lensPrices) : IPO_OFFER_PRICE + 1;
  const lensPadding = Math.max(5, (lensRawMax - lensRawMin) * 0.07);
  const lensMin = Math.max(0, lensRawMin - lensPadding);
  const lensMax = lensRawMax + lensPadding;
  const lensSpan = Math.max(lensMax - lensMin, 1);
  const lensPosition = (price: number) => `${clamp((price - lensMin) / lensSpan) * 100}%`;
  const bracketReliability = (row: (typeof distributionLensRows)[number]) => {
    const spread = row.bid != null && row.ask != null ? row.ask - row.bid : null;
    const spreadQuality =
      spread == null ? 0.55 : spread >= 0.2 ? 0.25 : spread >= 0.12 ? 0.4 : spread >= 0.08 ? 0.55 : spread >= 0.05 ? 0.72 : 0.95;
    const depthQuality = clamp(Math.log10(1 + row.depthTotal) / Math.log10(501));
    const confidenceQuality = row.priceConfidence === "high" ? 0.95 : row.priceConfidence === "medium" ? 0.75 : 0.55;
    return clamp(0.2 + spreadQuality * 0.35 + depthQuality * 0.25 + confidenceQuality * 0.2, 0.25, 0.95);
  };
  const distributionReliability = probabilityTotal
    ? distributionLensRows.reduce((sum, row) => sum + row.probability * bracketReliability(row), 0) / probabilityTotal
    : 0;
  const qualityAdjustProbability = (probability: number) => 0.5 + (probability - 0.5) * distributionReliability;
  const probabilityAbovePrice = (price: number) =>
    distributionLensRows.reduce((sum, row) => {
      if (price <= row.lowPrice) return sum + row.probability;
      if (price >= row.highPrice) return sum;
      const insideBucketShare = (row.highPrice - price) / Math.max(row.highPrice - row.lowPrice, 1);
      return sum + row.probability * insideBucketShare;
    }, 0);
  const probabilityAboveIpo = probabilityAbovePrice(IPO_OFFER_PRICE);
  const probabilityAboveHlRaw = data.hyperPrice == null ? null : probabilityAbovePrice(data.hyperPrice);
  const probabilityAboveHlAdjusted = probabilityAboveHlRaw == null ? null : qualityAdjustProbability(probabilityAboveHlRaw);
  const weightedQuoteWeight = probabilityTotal
    ? distribution.reduce((sum, row) => sum + row.quoteWeight * row.probability, 0) / probabilityTotal
    : 0;
  const lowConfidenceMass = distribution.reduce((sum, row) => sum + (row.priceConfidence === "low" ? row.probability : 0), 0);
  const wideSpreadMass = distribution.reduce((sum, row) => {
    const spread = row.bid != null && row.ask != null ? row.ask - row.bid : null;
    return sum + (spread != null && spread >= 0.08 ? row.probability : 0);
  }, 0);
  const under50Anchor = upper.find((row) => row.low == null && row.high === 50e9)?.yesPrice ?? null;
  const atLeast50Anchor = lower.find((row) => row.low === 50e9 && row.high == null)?.yesPrice ?? null;
  const bookRowCount = Math.max(hyperBidLevels.length, hyperAskLevels.length);
  const noIpoPrice =
    upper.find((row) => /not IPO/i.test(row.label))?.yesPrice ??
    (data.upperEvent?.markets.find((market) => /not IPO before July/i.test(market.question))?.outcomePrices
      ? Number(parseJsonArray<string>(data.upperEvent.markets.find((market) => /not IPO before July/i.test(market.question))!.outcomePrices)[0])
      : null);
  const hoveredBracket = qualityRows.find((row) => row.id === hoveredBracketId) ?? qualityRows.find((row) => row.probability === maxProbability) ?? null;
  const [priceHistory, setPriceHistory] = React.useState<PricePoint[]>([]);
  const [historicalPriceHistory, setHistoricalPriceHistory] = React.useState<PricePoint[]>([]);
  const [hyperCandleHistory, setHyperCandleHistory] = React.useState<ChartCandleMap>(emptyCandleMap);
  const [historyStatus, setHistoryStatus] = React.useState("Loading public chart history");
  const historyKey = React.useMemo(() => [...lower, ...upper].map((row) => row.tokenId).join(":"), [lower, upper]);

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

  React.useEffect(() => {
    if (data.hyperPrice == null || !Number.isFinite(data.hyperPrice) || data.hyperPrice <= 0) return;
    const hyperPrice = data.hyperPrice;
    setHyperCandleHistory((current) => mergeLiveHyperTick(current, hyperPrice));
  }, [data.hyperPrice]);

  React.useEffect(() => {
    if (lower.length === 0 || upper.length === 0) return;
    let cancelled = false;
    setHistoryStatus("Loading public chart history");
    fetchHistoricalPriceSeries(lower, upper)
      .then(({ points, candlesByInterval, polymarketError }) => {
        if (cancelled) return;
        setHistoricalPriceHistory(points);
        setHyperCandleHistory(candlesByInterval);
        const pmFirst = points[0]?.time;
        const pmLast = points.at(-1)?.time;
        if (pmFirst && pmLast) {
          setHistoryStatus(
            `PM reconstruction loaded (${POLYMARKET_HISTORY_FIDELITY_MINUTES}m CLOB): ${formatLocalDateTime(pmFirst)} - ${formatLocalDateTime(pmLast)}`
          );
        } else if (polymarketError) {
          setHistoryStatus(`PM history unavailable: ${polymarketError}`);
        } else {
          setHistoryStatus("No historical Polymarket reconstruction found; showing live PM session");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setHistoricalPriceHistory([]);
        setHyperCandleHistory(emptyCandleMap());
        setHistoryStatus(error instanceof Error ? `History unavailable: ${error.message}` : "History unavailable; showing live session");
      });
    return () => {
      cancelled = true;
    };
  }, [historyKey]);
  const chartPoints = React.useMemo(() => {
    const merged = new Map<number, PricePoint>();
    historicalPriceHistory.forEach((point) => merged.set(Math.floor(point.time / 1000) * 1000, point));
    priceHistory.forEach((point) => merged.set(Math.floor(point.time / 1000) * 1000, point));
    return [...merged.values()].sort((a, b) => a.time - b.time);
  }, [historicalPriceHistory, priceHistory]);

  return (
    <main>
      <header className="topbar">
        <div>
          <div className="eyebrow">
            <Activity size={16} />
            {polymarketClosed ? "Archived first-day recap" : "Live CBRS IPO price discovery"}
          </div>
          <h1>{polymarketClosed ? "Cerebras IPO Recap" : "Cerebras IPO Data"}</h1>
          <a className="byline" href="https://x.com/blade_" target="_blank" rel="noreferrer">
            by @blade_
          </a>
        </div>
        {polymarketClosed ? (
          <div className="statusRow">
            <span className="status closed">
              <Wifi size={14} />
              Archived after May 14 close
            </span>
          </div>
        ) : (
          <div className="statusRow">
            <span className={`status ${data.polymarketStatus}`}>
              <Wifi size={14} />
              Polymarket {polymarketStatusLabel}
            </span>
            <span className={`status ${data.hyperStatus}`}>
              <RefreshCw size={14} />
              Hyperliquid {data.hyperStatus}
            </span>
          </div>
        )}
      </header>

      {data.error ? (
        <div className="notice">
          <AlertTriangle size={18} />
          {data.error}
        </div>
      ) : null}

      {polymarketClosed ? (
        <div className="notice">
          <AlertTriangle size={18} />
          Polymarket is resolved. The bracket midpoint is not the actual close; it is only the center of the winning market-cap range. Exact first-day close
          comes from Nasdaq{nasdaqClosePrice == null ? "." : `: ${formatUsd(nasdaqClosePrice)} (${data.nasdaqClose?.timestamp ?? "May 14 close"}).`}
        </div>
      ) : null}

      <section className="metricsGrid">
        {polymarketClosed ? (
          <>
            <MetricCard
              icon={<CircleDollarSign size={22} />}
              label="Nasdaq official close"
              value={nasdaqClosePrice == null ? "Loading" : formatUsd(nasdaqClosePrice)}
              detail={
                nasdaqClosePrice == null
                  ? "Waiting for Nasdaq close feed"
                  : `${formatVsIpo(nasdaqClosePrice)}; cap ${nasdaqCloseCap == null ? "n/a" : formatCompactUsd(nasdaqCloseCap)}`
              }
            />
            <MetricCard
              icon={<Scale size={22} />}
              label="Winning PM bracket"
              value={resolvedBracketRow ? resolvedBracketRow.label : "Loading"}
              detail={
                resolvedBracketRow
                  ? `Resolved Yes; implied close ${formatImpliedPriceRange(resolvedBracketRow.low, resolvedBracketRow.high)}`
                  : "Waiting for resolved market"
              }
            />
            <MetricCard
              icon={<BarChart3 size={22} />}
              label="Resolved bracket midpoint"
              value={expectedCap ? formatUsd(polymarketSharePrice) : "Loading"}
              detail={nasdaqClosePrice == null ? "Bracket center, not actual close" : `Actual close was ${formatUsd(nasdaqClosePrice)}`}
            />
            <MetricCard
              icon={<Activity size={22} />}
              label="Actual vs midpoint"
              value={nasdaqCloseVsMidpoint == null ? "Loading" : `${nasdaqCloseVsMidpoint >= 0 ? "+" : ""}${formatUsd(nasdaqCloseVsMidpoint)}`}
              detail="Nasdaq close minus PM winning-bracket midpoint"
              tone={nasdaqCloseVsMidpoint == null ? "neutral" : nasdaqCloseVsMidpoint >= 0 ? "positive" : "negative"}
            />
          </>
        ) : (
          <>
            <MetricCard
              icon={<BarChart3 size={22} />}
              label="PM implied closing cap"
              value={expectedCap ? formatCompactUsd(expectedCap) : "Loading"}
              detail="Blended from both bracket pages"
            />
            <MetricCard
              icon={<Scale size={22} />}
              label="PM midpoint close model"
              value={expectedCap ? formatUsd(polymarketSharePrice) : "Loading"}
              detail={
                expectedCap
                  ? `${formatVsIpo(polymarketSharePrice)}; assumes midpoint inside each PM bracket`
                  : `Using ${(selectedBasis.shares / 1e6).toFixed(1)}m official shares`
              }
            />
            <MetricCard
              icon={<Scale size={22} />}
              label="Most likely PM bracket"
              value={topProbabilityRow ? topProbabilityRow.label : "Loading"}
              detail={
                topProbabilityRow
                  ? `${formatPercent(topProbabilityRow.probability)} probability · implied close ${formatImpliedPriceRange(topProbabilityRow.low, topProbabilityRow.high)}`
                  : "Highest probability bucket from live PM distribution"
              }
            />
            <MetricCard
              icon={<CircleDollarSign size={22} />}
              label="Hyperliquid xyz:CBRS"
              value={data.hyperPrice == null ? "Loading" : formatUsd(data.hyperPrice)}
              detail={data.hyperPrice == null ? "trade[XYZ] per-share IPOP market" : `${formatVsIpo(data.hyperPrice)}; trade[XYZ] IPOP`}
            />
            <MetricCard
              icon={<Activity size={22} />}
              label="Adj PM close > HL"
              value={probabilityAboveHlAdjusted == null ? "Loading" : formatPercent(probabilityAboveHlAdjusted)}
              detail={
                data.hyperPrice == null
                  ? "Waiting for live Hyperliquid price"
                  : `Raw PM ${probabilityAboveHlRaw == null ? "n/a" : formatPercent(probabilityAboveHlRaw)}; reliability haircut ${formatPercent(distributionReliability)}`
              }
              tone={probabilityAboveHlAdjusted == null ? "neutral" : probabilityAboveHlAdjusted >= 0.5 ? "positive" : "negative"}
            />
            <MetricCard
              icon={<Activity size={22} />}
              label="HL vs PM midpoint"
              value={spread == null ? "Loading" : `${spread >= 0 ? "+" : ""}${formatUsd(spread)}`}
              detail={spreadPct == null ? "Waiting for live price" : `${spreadPct >= 0 ? "+" : ""}${formatPercent(spreadPct)} versus midpoint model`}
              tone={spread == null ? "neutral" : spread >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              icon={<BarChart3 size={22} />}
              label="PM 24h volume"
              value={formatMaybeCompactUsd(pmVolume24h)}
              detail="Event-level volume across both PM links"
            />
            <MetricCard
              icon={<BarChart3 size={22} />}
              label="PM total volume"
              value={formatMaybeCompactUsd(pmVolumeTotal)}
              detail="Combined lifetime volume across both event pages"
            />
            <MetricCard
              icon={<CircleDollarSign size={22} />}
              label="HL implied cap"
              value={hyperImpliedCap == null ? "Loading" : formatCompactUsd(hyperImpliedCap)}
              detail={
                hyperImpliedCap == null || data.hyperPrice == null
                  ? "Hyperliquid price x 219.3m official shares"
                  : `${formatUsd(data.hyperPrice)} x 219.3m official shares; ${formatSignedCompactUsd(hyperImpliedCap - officialIpoCap)} / ${formatSignedPercent(
                      (hyperImpliedCap - officialIpoCap) / officialIpoCap
                    )} vs IPO cap`
              }
            />
          </>
        )}
      </section>

      <section className="workspace">
        <PriceComparisonChart points={chartPoints} candlesByInterval={hyperCandleHistory} historyStatus={historyStatus} hyperQuality={data.hyperQuality} />

        <aside className="panel methodologyPanel">
          <div className="panelHeader compact">
            <div>
              <p>Methodology</p>
              <h2>One official share count</h2>
            </div>
          </div>
          <div className="methodFormula">
            <span>PM midpoint close model</span>
            <strong>
              E[first-day closing market cap] / {new Intl.NumberFormat("en-US").format(OFFICIAL_POST_OFFERING_SHARES)} shares
            </strong>
          </div>
          <p className="basisNote">
            The headline comparison uses the current official share count from the May 14 S-8 reoffer prospectus, which is newer than the last S-1/A. The rows below are denominator checks:
            they show how the PM implied price changes if more shares are included, but they do not mean those shares are day-one float and they do not
            drive the main dashboard.
          </p>
          <div className="basisAudit">
            {SHARE_BASES.map((basis) => (
              <div className="basisAuditRow" key={basis.id}>
                <div className="basisAuditText">
                  <span>{basis.label}</span>
                  <em>{basis.note}</em>
                </div>
                <strong>{(basis.shares / 1e6).toFixed(3)}m</strong>
                <small>{expectedCap ? formatUsd(expectedCap / basis.shares) : "Loading"}</small>
              </div>
            ))}
          </div>
          <div className="sourceBox">
            <strong>PM price treatment</strong>
            <span>
              The headline uses a robust quote/trade blend: tight, deep books follow the live midpoint; shallow, wide, or trade-divergent quotes are damped
              toward the current Gamma price, with last trade only as a fallback. Wide spreads are hit hard: &gt;=20c spread gives quote max 12%, &gt;=12c max
              20%, &gt;=8c max 30%, &gt;=5c max 50%.
            </span>
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
              <p>Blended distribution</p>
              <h2>Closing market cap brackets</h2>
            </div>
            <span>{data.lastUpdated ? formatLocalTime(data.lastUpdated) : "No update yet"}</span>
          </div>
          <div className="barLegend" aria-label="Bracket row legend">
            <span>Bracket</span>
            <span>Blended probability</span>
            <span>Implied close</span>
            <span>PM page Yes</span>
            <span>Blend</span>
          </div>
          <div className="bars">
            {qualityRows.map((row) => {
              const isActive = hoveredBracket?.id === row.id;
              return (
                <div
                  className={`barRow ${isActive ? "active" : ""}`}
                  key={row.id}
                  onBlur={() => setHoveredBracketId(null)}
                  onFocus={() => setHoveredBracketId(row.id)}
                  onMouseEnter={() => setHoveredBracketId(row.id)}
                  onMouseLeave={() => setHoveredBracketId(null)}
                  tabIndex={0}
                >
                  <div className="barLabel">{row.label}</div>
                  <div className="barTrack">
                    <div className="barFill" style={{ width: `${Math.max((row.probability / maxProbability) * 100, 2)}%` }} />
                  </div>
                  <div className="barPrice">{formatImpliedPriceRange(row.low, row.high)}</div>
                  <div className="barRaw">{row.pageYesPrice == null ? "n/a" : formatPercent(row.pageYesPrice)}</div>
                  <div className="barValue">{formatPercent(row.probability)}</div>
                  <StrikePopover row={row} maxDepth={maxQualityDepth} maxVolume={maxQualityVolume} maxLiquidity={maxQualityLiquidity} />
                </div>
              );
            })}
          </div>
          <div className="distributionLens" aria-label="Polymarket distribution skew lens">
            <div className="lensHeader">
              <div>
                <span>Skew lens</span>
                <strong>Probability by implied closing CBRS price</strong>
              </div>
              <em>wide bands are cap brackets; taller bands carry more PM probability</em>
            </div>
            <div className="lensPlot">
              {distributionLensRows.map((row) => {
                const widthPct = Math.max(((row.highPrice - row.lowPrice) / lensSpan) * 100, 0.8);
                const heightPct = Math.max((row.probability / maxProbability) * 86, 5);
                const isMode = topProbabilityRow?.id === row.id;
                const isActive = hoveredBracket?.id === row.id;
                return (
                  <button
                    aria-label={`${row.label} probability ${formatPercent(row.probability)}, implied close ${formatImpliedPriceRange(row.low, row.high)}`}
                    className={`lensBucket ${isMode ? "mode" : ""} ${isActive ? "active" : ""}`}
                    key={row.id}
                    onBlur={() => setHoveredBracketId(null)}
                    onFocus={() => setHoveredBracketId(row.id)}
                    onMouseEnter={() => setHoveredBracketId(row.id)}
                    onMouseLeave={() => setHoveredBracketId(null)}
                    style={{
                      left: lensPosition(row.lowPrice),
                      width: `${widthPct}%`,
                      height: `${heightPct}%`
                    }}
                    type="button"
                  >
                    <span>{row.label}</span>
                    <strong>{formatPercent(row.probability)}</strong>
                  </button>
                );
              })}
              <div className="lensMarker ipo" style={{ left: lensPosition(IPO_OFFER_PRICE) }}>
                <span>IPO {formatUsd(IPO_OFFER_PRICE, 0)}</span>
              </div>
              {Number.isFinite(polymarketSharePrice) ? (
                <div className="lensMarker pm" style={{ left: lensPosition(polymarketSharePrice) }}>
                  <span>PM {formatUsd(polymarketSharePrice)}</span>
                </div>
              ) : null}
              {nasdaqClosePrice == null ? null : (
                <div className="lensMarker actual" style={{ left: lensPosition(nasdaqClosePrice) }}>
                  <span>Close {formatUsd(nasdaqClosePrice)}</span>
                </div>
              )}
              {data.hyperPrice == null ? null : (
                <div className="lensMarker hl" style={{ left: lensPosition(data.hyperPrice) }}>
                  <span>HL {formatUsd(data.hyperPrice)}</span>
                </div>
              )}
            </div>
            <div className="lensAxis" aria-hidden="true">
              <span>{formatUsd(lensMin, 0)}</span>
              <span>{formatUsd((lensMin + lensMax) / 2, 0)}</span>
              <span>{formatUsd(lensMax, 0)}</span>
            </div>
            <div className="lensStats">
              <div>
                <span>Most likely bucket</span>
                <strong>{topProbabilityRow ? topProbabilityRow.label : "n/a"}</strong>
                <small>{topProbabilityRow ? `${formatPercent(topProbabilityRow.probability)} at ${formatImpliedPriceRange(topProbabilityRow.low, topProbabilityRow.high)}` : "Waiting for PM"}</small>
              </div>
              <div>
                <span>Adj PM above HL</span>
                <strong>{probabilityAboveHlAdjusted == null ? "n/a" : formatPercent(probabilityAboveHlAdjusted)}</strong>
                <small>
                  {data.hyperPrice == null
                    ? "Waiting for Hyperliquid"
                    : `Raw ${probabilityAboveHlRaw == null ? "n/a" : formatPercent(probabilityAboveHlRaw)} at live HL ${formatUsd(data.hyperPrice)}`}
                </small>
              </div>
              <div>
                <span>PM probability above IPO</span>
                <strong>{formatPercent(probabilityAboveIpo)}</strong>
                <small>Interpolated inside brackets above official $185 IPO</small>
              </div>
            </div>
          </div>
          <div className="formulaPanel">
            <div className="formulaHeader">
              <div>
                <span>{polymarketClosed ? "Resolved PM Calculation" : "Live PM Calculation"}</span>
                <strong>{polymarketClosed ? "Why the midpoint is not the final close" : "How the implied closing CBRS price is derived"}</strong>
              </div>
              <em>{polymarketClosed ? "Polymarket resolves brackets; Nasdaq gives the exact close" : "updates with Polymarket quotes, trades, depth, and brackets"}</em>
            </div>
            <div className="formulaGrid">
              <div className="equationStack" aria-label="Polymarket implied price equations">
                <div className="equationLine">
                  <code>
                    q<sub>i</sub> = w<sub>i</sub> quote<sub>i</sub> + (1 - w<sub>i</sub>) ref<sub>i</sub>
                  </code>
                  <span>robust Yes price per bracket</span>
                </div>
                <div className="equationLine">
                  <code>
                    p<sub>i</sub> = normalize(q<sub>i</sub>) across both strike pages
                  </code>
                  <span>blended probability for each cap range</span>
                </div>
                <div className="equationLine liveEquation">
                  <code>
                    E[M] = &Sigma; p<sub>i</sub> midpoint<sub>i</sub> = {formatCompactUsd(expectedCap)}
                  </code>
                  <span>expected first-day closing market cap</span>
                </div>
                <div className="equationLine liveEquation">
                  <code>
                    P<sub>CBRS close</sub> = E[M] / S = {formatCompactUsd(expectedCap)} /{" "}
                    {new Intl.NumberFormat("en-US").format(OFFICIAL_POST_OFFERING_SHARES)} = {formatUsd(polymarketSharePrice)}
                  </code>
                  <span>{polymarketClosed ? "after resolution, this is the winning-bracket midpoint, not the exact close" : "official post-offering shares drive the headline price"}</span>
                </div>
                {polymarketClosed && nasdaqClosePrice != null ? (
                  <div className="equationLine liveEquation">
                    <code>
                      P<sub>Nasdaq close</sub> = {formatUsd(nasdaqClosePrice)}; M = P x S ={" "}
                      {nasdaqCloseCap == null ? "n/a" : formatCompactUsd(nasdaqCloseCap)}
                    </code>
                    <span>official close lands inside the resolved {resolvedBracketRow?.label ?? "winning"} Polymarket bracket</span>
                  </div>
                ) : null}
                </div>
              <div className="formulaVars">
                <div>
                  <span>Probability mass</span>
                  <strong>{formatPercent(probabilityTotal)}</strong>
                  <small>Sum of blended bracket probabilities</small>
                </div>
                <div>
                  <span>{polymarketClosed ? "Winning bracket" : "Top bracket"}</span>
                  <strong>{(polymarketClosed ? resolvedBracketRow : topProbabilityRow) ? (polymarketClosed ? resolvedBracketRow : topProbabilityRow)!.label : "n/a"}</strong>
                  <small>
                    {(polymarketClosed ? resolvedBracketRow : topProbabilityRow)
                      ? `${polymarketClosed ? "Resolved Yes" : formatPercent(topProbabilityRow!.probability)} at ${formatImpliedPriceRange(
                          (polymarketClosed ? resolvedBracketRow : topProbabilityRow)!.low,
                          (polymarketClosed ? resolvedBracketRow : topProbabilityRow)!.high
                        )}`
                      : "Waiting for markets"}
                  </small>
                </div>
                <div>
                  <span>Quote weight</span>
                  <strong>{formatPercent(weightedQuoteWeight)}</strong>
                  <small>Probability-weighted live quote influence after spread/depth caps</small>
                </div>
                <div>
                  <span>Distribution reliability</span>
                  <strong>{formatPercent(distributionReliability)}</strong>
                  <small>Used to shrink threshold probabilities toward 50/50 when books are wide, shallow, or low-confidence</small>
                </div>
                <div>
                  <span>Wide-spread mass</span>
                  <strong>{formatPercent(wideSpreadMass)}</strong>
                  <small>Bracket probability with at least 8c bid/ask spread; quote influence is capped</small>
                </div>
                <div>
                  <span>Low-confidence mass</span>
                  <strong>{formatPercent(lowConfidenceMass)}</strong>
                  <small>Probability priced mostly from trades/Gamma because books are thin or wide</small>
                </div>
                <div>
                  <span>Anchor split</span>
                  <strong>
                    {under50Anchor == null ? "n/a" : formatPercent(under50Anchor)} / {atLeast50Anchor == null ? "n/a" : formatPercent(atLeast50Anchor)}
                  </strong>
                  <small>Raw P(&lt;$50B) / P(at least $50B)</small>
                </div>
              </div>
            </div>
          </div>
          <p className="caption">
            {polymarketClosed
              ? "After resolution, Polymarket only identifies the winning market-cap bracket. The displayed PM midpoint is the center of that bracket, so it can differ materially from the actual Nasdaq closing price inside the same range. "
              : "The PM midpoint close model is the expected first-day closing market cap from a robust live distribution, divided by the latest official post-offering share count. "}
            {!polymarketClosed ? (
              <>
                The bracket rows show both Polymarket's raw page Yes price and this dashboard's blended probability; they can differ
                because the two Polymarket pages are separate binary markets that are anchored through the &lt;$50B / at least $50B overlap before normalization.
                Each bracket uses live quotes when the book is tight and deep, but wide/shallow or quote-only moves are damped toward
                the current Gamma price, falling back to last trade only if needed, so a thin top-of-book spoof cannot fully drive the headline.
              </>
            ) : null} Historical PM chart
            points are reconstructed from the
            highest-density accepted public CLOB Yes-token history (
            {POLYMARKET_HISTORY_FIDELITY_MINUTES}-minute fidelity across the last {POLYMARKET_HISTORY_DAYS} days) for every required bracket/anchor market; no
            current prices are backfilled into historical points. Polymarket buckets are coarse: each $10B market-cap bracket is about{" "}
            {formatUsd(10e9 / OFFICIAL_POST_OFFERING_SHARES, 2)} wide per CBRS share. Quantile math assumes outcomes are uniformly distributed inside each
            bracket; the open-ended {">= $100B"} bracket is capped at $110B. Threshold metrics such as close above HL are quality-adjusted market-implied
            signals: they shrink raw PM probabilities toward 50/50 when the underlying bracket books are wide, shallow, or low-confidence.
          </p>
        </div>
      </section>

      {!polymarketClosed ? (
      <section className="panel qualityPanel">
        <div className="panelHeader">
          <div>
            <p>Market Quality</p>
            <h2>Volume, liquidity, and book depth</h2>
          </div>
          <span>HL book {data.hyperQuality?.bookTime ? formatLocalTime(data.hyperQuality.bookTime) : "n/a"}</span>
        </div>
        <div className="qualityGrid">
          <div>
            <span>Hyperliquid BBO</span>
            <strong>
              {formatMaybeUsd(data.hyperQuality?.bestBid)} / {formatMaybeUsd(data.hyperQuality?.bestAsk)}
            </strong>
            <small>
              Spread {formatMaybeUsd(data.hyperQuality?.spread, 2)} / {formatMaybePercent(hyperBboSpreadPct)}
            </small>
          </div>
          <div>
            <span>Hyperliquid mark / oracle</span>
            <strong>
              {formatMaybeUsd(data.hyperQuality?.markPrice)} / {formatMaybeUsd(data.hyperQuality?.oraclePrice)}
            </strong>
            <small>Prev day {formatMaybeUsd(data.hyperQuality?.prevDayPrice)}</small>
          </div>
          <div>
            <span>Hyperliquid 24h volume</span>
            <strong>{formatMaybeCompactUsd(data.hyperQuality?.dayVolume)}</strong>
            <small>{formatMaybeNumber(data.hyperQuality?.dayBaseVolume)} CBRS base volume</small>
          </div>
          <div>
            <span>Hyperliquid open interest</span>
            <strong>{formatMaybeCompactUsd(hyperOpenInterestNotional)}</strong>
            <small>{formatMaybeNumber(data.hyperQuality?.openInterest)} CBRS contracts</small>
          </div>
          <div>
            <span>Hyperliquid funding</span>
            <strong className="tooltipText" data-tooltip={`Annualized: ${formatMaybePercent(hyperAnnualizedFunding)}. Hyperliquid funding is hourly; annualized = current hourly rate x 24 x 365.`}>
              {formatMaybeFundingRate(data.hyperQuality?.fundingRate)}
            </strong>
            <small>{formatMaybePercent(hyperAnnualizedFunding)} annualized</small>
          </div>
          <div>
            <span>Polymarket combined 24h</span>
            <strong>{formatMaybeCompactUsd(pmVolume24h)}</strong>
            <small>Event-level volume across both links, including no-IPO markets</small>
          </div>
          <div>
            <span>Polymarket total volume</span>
            <strong>{formatMaybeCompactUsd(pmVolumeTotal)}</strong>
            <small>Lifetime event-level volume across both linked Polymarket pages</small>
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
              <span>
                Spread {formatMaybeUsd(data.hyperQuality?.spread, 2)} / {formatMaybePercent(hyperBboSpreadPct)} · window {(hyperDepthPct * 100).toFixed(2)}%
              </span>
            </div>
            <div className="depthControls" aria-label="Hyperliquid depth window">
              {[0.0025, 0.005, 0.01, 0.02].map((value) => (
                <button className={hyperDepthPct === value ? "active" : ""} key={value} type="button" onClick={() => setHyperDepthPct(value)}>
                  {(value * 100).toFixed(value < 0.01 ? 2 : 0)}%
                </button>
              ))}
            </div>
            <div className="bookTotals">
              <span>Bid depth {formatMaybeCompactUsd(hyperBidDepth)}</span>
              <span>Ask depth {formatMaybeCompactUsd(hyperAskDepth)}</span>
            </div>
            <div className="orderBook">
              <div className="orderBookHead">
                <span>Bid notional</span>
                <span>Bid</span>
                <span>Ask</span>
                <span>Ask notional</span>
              </div>
              {Array.from({ length: bookRowCount }).map((_, index) => {
                const bid = hyperBidLevels[index];
                const ask = hyperAskLevels[index];
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
              <span>Bars are row-relative; longer means larger versus the biggest row in that column</span>
            </div>
            <div className="qualityLegend" aria-label="Polymarket bracket quality legend">
              <span><i className="goldDot" /> 2c near-touch depth</span>
              <span><i className="greenDot" /> 24h volume</span>
              <span><i className="blueDot" /> Total volume</span>
              <span><i className="redDot" /> Displayed liquidity</span>
            </div>
            <div className="pmQualityTable">
              <div className="pmQualityHead">
                <span>Bracket</span>
                <span>Prob</span>
                <span>Implied close</span>
                <span>2c depth</span>
                <span>24h</span>
                <span>Total vol</span>
                <span>Liquidity</span>
              </div>
              {qualityRows.map((row) => (
                <div className="pmQualityRow" key={`quality-${row.id}`}>
                  <strong>{row.label}</strong>
                  <span>{formatPercent(row.probability)}</span>
                  <span>{formatImpliedPriceRange(row.low, row.high)}</span>
                  <MeasureCell value={row.depthTotal} max={maxQualityDepth} tone="gold" />
                  <MeasureCell value={row.volume24h} max={maxQualityVolume} tone="green" />
                  <MeasureCell value={row.volumeTotal} max={maxQualityTotalVolume} tone="blue" />
                  <MeasureCell value={row.liquidity} max={maxQualityLiquidity} tone="red" />
                </div>
              ))}
            </div>
          </div>
        </div>
	        <p className="caption">
	          Hyperliquid price and book depth stream over WebSocket, with volume/open-interest context refreshed every {LIVE_REFRESH_MS / 1000} seconds. Polymarket
	          CLOB prices, matched trades, and book updates stream over the official market websocket when connected; Gamma volume/liquidity and wallet-attributed
	          trades refresh every {LIVE_REFRESH_MS / 1000} seconds. Polymarket
	          depth is shallow near the touch in several brackets, so the visual bars matter more than the combined headline total of{" "}
          {formatMaybeCompactUsd(distributionDepth)}.
        </p>
      </section>
      ) : null}

      {!polymarketClosed ? (
      <section className="panel tradeMonitorPanel">
        <div className="panelHeader">
          <div>
            <p>Polymarket Trade Monitor</p>
            <h2>Recent bracket trades explaining PM moves</h2>
          </div>
	          <span>
	            {data.polymarketStreamStatus === "streaming" ? "CLOB websocket live" : "Polling fallback"} ·{" "}
	            {annotatedTrades.length ? `${annotatedTrades.length} latest trades` : "waiting for trades"}
	          </span>
        </div>
        <div className="tradeMonitorGrid">
          <div className="tradePressure">
            <div className="depthHeader">
              <strong>Last 15m flow</strong>
              <span>Matched trades grouped by closing-cap bracket</span>
            </div>
            <div className={`pressureSummary ${pressureNet >= 0 ? "up" : "down"}`}>
              <span>Net bracket pressure</span>
              <strong>{formatSignedCompactUsd(pressureNet)}</strong>
              <small>
                {pressureNet >= 0 ? "Buyers lifted bracket odds" : "Sellers lowered bracket odds"} across {pressureTotals.count} trade{pressureTotals.count === 1 ? "" : "s"}
              </small>
              <div className="flowSplit" aria-hidden="true">
                <span className="buyFlow" style={{ width: pressureShare(pressureTotals.up, pressureTotalFlow) }} />
                <span className="sellFlow" style={{ width: pressureShare(pressureTotals.down, pressureTotalFlow) }} />
              </div>
              <em>
                Buy pressure {formatCompactUsd(pressureTotals.up)} · sell pressure {formatCompactUsd(pressureTotals.down)}
              </em>
            </div>
            <div className="pressureRows" aria-label="Polymarket net flow by bracket">
              {tradePressureRows.slice(0, 4).map((row) => {
                const totalFlow = row.up + row.down;
                return (
                  <div className={`pressureRow ${row.net >= 0 ? "up" : "down"}`} key={`pressure-${row.label}`}>
                    <div className="pressureTopline">
                      <div>
                        <strong>{row.label}</strong>
                        <span>{row.impliedPriceRange}</span>
                      </div>
                      <div className="pressureNet">
                        <b className={row.net >= 0 ? "upText" : "downText"}>{formatSignedCompactUsd(row.net)}</b>
                        <small>{row.net >= 0 ? "net buying pressure" : "net selling pressure"}</small>
                      </div>
                    </div>
                    <div className="flowSplit" aria-hidden="true">
                      <span className="buyFlow" style={{ width: pressureShare(row.up, totalFlow) }} />
                      <span className="sellFlow" style={{ width: pressureShare(row.down, totalFlow) }} />
                    </div>
                    <small>
                      Buy {formatCompactUsd(row.up)} · sell {formatCompactUsd(row.down)} · {row.count} trade{row.count === 1 ? "" : "s"}
                    </small>
                  </div>
                );
              })}
              {tradePressureRows.length === 0 ? <p className="emptyState">No recent Polymarket trades returned yet.</p> : null}
            </div>
            <p className="pressureNote">Use this as a quick "which bracket drove the move?" summary. The tape to the right shows the individual prints.</p>
          </div>

          <div className="quoteFeed">
            <div className="depthHeader">
              <strong>Order-book moves</strong>
              <span>Best bid/ask changes that can move PM before a trade prints</span>
            </div>
            <div className="tapeExplainer">
              <span>Shows the live Yes-token book for each bracket</span>
              <span>Midpoint is best bid/ask center</span>
              <span>No matched trade required</span>
            </div>
            <div className="quoteRows">
              {annotatedQuoteChanges.slice(0, 24).map((change) => {
                const direction = change.delta == null ? "new" : change.delta >= 0 ? "up" : "down";
                return (
                  <div className={`quoteRow ${direction === "down" ? "down" : "up"}`} key={quoteChangeKey(change)}>
                    <div className="quoteMain">
                      <span className="tradeTime">{formatLocalTime(change.timestamp * 1000)}</span>
                      <strong>{change.bracketLabel}</strong>
                      <em>{change.impliedPriceRange}</em>
                    </div>
                    <div className="quoteImpact">
                      <span>{direction === "new" ? "New book quote" : `PM input moved ${direction}`}</span>
                      <b>{formatPercent(change.midpoint)}</b>
                      <small>{change.delta == null ? "First quote seen" : `${formatSignedPercent(change.delta)} midpoint move`}</small>
                    </div>
                    <div className="quoteBook">
                      <span>Best bid / ask</span>
                      <b>
                        {change.bestBid == null ? "n/a" : formatPercent(change.bestBid)} / {change.bestAsk == null ? "n/a" : formatPercent(change.bestAsk)}
                      </b>
                      <small>Book update, not necessarily a trade</small>
                    </div>
                  </div>
                );
              })}
              {annotatedQuoteChanges.length === 0 ? (
                <p className="emptyState">No order-book moves observed yet. When best bid/ask moves, PM implied can update here before any matched trade appears.</p>
              ) : null}
            </div>
          </div>

          <div className="tradeFeed">
            <div className="depthHeader">
              <strong>Trade feed</strong>
              <span>
                Scrollable tape · large prints at least {formatCompactUsd(largeTradeCutoff)} · biggest {largestTrade ? formatCompactUsd(largestTrade.notional) : "n/a"}
              </span>
            </div>
            <div className="tapeExplainer">
              <span>Shows matched Polymarket trades</span>
              <span>Large prints are highlighted</span>
              <span>Wallet labels appear when the Data API catches up</span>
            </div>
            <div className="tradeRows">
              {annotatedTrades.slice(0, 30).map((trade) => {
                const isLarge = trade.notional >= largeTradeCutoff;
                const isLargest = largestTrade === trade;
                const txHref = trade.transactionHash ? `https://polygonscan.com/tx/${trade.transactionHash}` : null;
                const profileHref = polymarketProfileHref(trade.proxyWallet);
                return (
                  <div
                    className={`tradeRow ${trade.yesDirection === "up" ? "up" : "down"} ${isLarge ? "large" : ""} ${isLargest ? "largest" : ""}`}
                    key={tradeKey(trade)}
                  >
                    <div className="tradeMain">
                      <span className="tradeTime">{formatLocalTime(trade.timestamp * 1000)}</span>
                      <strong>
                        {trade.bracketLabel}
                        {isLarge ? <i>{isLargest ? "BIGGEST" : "LARGE"}</i> : null}
                      </strong>
                      <em>{trade.impliedPriceRange}</em>
                    </div>
                    <div className="tradeDetail">
                      <b>{trade.yesDirection === "up" ? "Buying pressure" : "Selling pressure"}</b>
                      <span>
                        {trade.source === "clob" ? "Live CLOB" : "Wallet API"} · {trade.side} {trade.outcome} · {formatCompactUsd(trade.notional)} at{" "}
                        {formatPercent(trade.price)}
                      </span>
                    </div>
                    <div className="tradeWallet">
                      {profileHref ? (
                        <a className="profileLink" href={profileHref} target="_blank" rel="noreferrer">
                          {trade.traderLabel}
                        </a>
                      ) : (
                        <span>{trade.traderLabel}</span>
                      )}
                      <small>{trade.source === "clob" ? "wallet pending" : shortAddress(trade.proxyWallet)}</small>
                      {txHref ? (
                        <a href={txHref} target="_blank" rel="noreferrer">
                          tx
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {annotatedTrades.length === 0 ? <p className="emptyState">No trade feed data yet. CLOB websocket trades appear first; wallet attribution follows from the Data API poll.</p> : null}
            </div>
          </div>
        </div>
        <p className="caption">
          Order-book moves explain quote-driven PM changes; the trade feed explains matched trades. Buying pressure means BUY Yes or SELL No, which pushes that
          bracket's probability higher. Selling pressure means SELL Yes or BUY No, which pushes it lower. Live CLOB trade events are fastest but do not include
          wallets; wallet-linked rows come from the Data API as soon as it updates.
        </p>
      </section>
      ) : null}

      <section className="panel ipoPanel">
        <div className="panelHeader">
          <div>
            <p>IPO Terms</p>
            <h2>Official pricing details and price-action context</h2>
          </div>
          <span>Checked May 14, 2026</span>
        </div>
        <div className="detailGrid">
          <DetailItem label="Offer price" value={formatUsd(IPO_OFFER_PRICE)} note="Official pricing release dated May 13; Nasdaq trading expected May 14 under CBRS." />
          <DetailItem label="Base IPO float" value="30.0m" note="Class A shares sold in the IPO; this is the day-one public float before any underwriter option exercise." />
          <DetailItem label="Option-adjusted float" value="34.5m" note={`If the 4.5m underwriter option is fully exercised, float becomes ${formatPercent(offeredFloatWithOptionPct)} of option-adjusted post-offering shares.`} />
          <DetailItem label="Gross proceeds" value={formatCompactUsd(grossProceeds)} note={`Before discounts/expenses; ${formatCompactUsd(grossProceedsWithOption)} if the option is fully exercised.`} />
          <DetailItem label="Implied official cap" value={formatCompactUsd(officialIpoCap)} note={`Uses 219.295148m latest official shares; ${formatCompactUsd(officialIpoCapWithOption)} with over-allotment.`} />
          <DetailItem
            label="Implied fully diluted cap"
            value={formatCompactUsd(impliedFullyDilutedCap)}
            note={`Scenario at $185 using ${(POTENTIAL_DILUTED_SCENARIO_SHARES / 1e6).toFixed(3)}m listed-dilutive shares; not the headline resolution denominator.`}
          />
          <DetailItem label="Base float percent" value={formatPercent(offeredFloatPct)} note="30.0m IPO shares divided by 219.295148m latest official shares; this is separate from the market-cap denominator." />
          <DetailItem label="Non-float context" value="185.2m Class B" note="Class B holders retain most economic ownership and about 99.2% of voting power; lock-up and market-standoff restrictions apply with exceptions." />
          <DetailItem label="PM closing vs offer" value={`${offerToPm >= 0 ? "+" : ""}${formatUsd(offerToPm)}`} note={`${offerToPm >= 0 ? "+" : ""}${formatPercent(offerToPm / IPO_OFFER_PRICE)} versus $185.`} />
          <DetailItem
            label="Hyperliquid vs offer"
            value={offerToHl == null ? "Loading" : `${offerToHl >= 0 ? "+" : ""}${formatUsd(offerToHl)}`}
            note={offerToHl == null ? "Waiting for xyz:CBRS." : `${offerToHl >= 0 ? "+" : ""}${formatPercent(offerToHl / IPO_OFFER_PRICE)} versus $185.`}
          />
          <DetailItem label="Lead banks" value="Morgan Stanley, Citi, Barclays, UBS" note="Mizuho and TD Cowen bookrunners; Needham, Craig-Hallum, Wedbush, Rosenblatt, Academy, Credit Agricole CIB, MUFG, and First Citizens Capital Securities co-managers." />
        </div>
        <div className="watchList">
          <strong>Price-action notes</strong>
          <span>
            The offer price implies about {formatCompactUsd(officialIpoCap)} on the latest official share count, while the live Polymarket midpoint-model
            value is {formatCompactUsd(expectedCap)}. The S-1/A says Class B holders retain about 85.3% of shares and 99.2% of voting power after the
            offering, and lock-up/market-standoff restrictions generally run until the earlier of the second trading day after Q3 2026 earnings or 180 days
            after the prospectus date, with exceptions including some sell-to-cover activity. The S-1/A also highlights 2025 revenue of $510.0m, up 76%
            year over year, a multi-year OpenAI deal valued at more than $20B for 750 megawatts, and an AWS term sheet with binding provisions. The latest
            SEC/issuer filing pages checked showed May 14 S-8 filings with fresher share counts and no final 424B4 listed yet.
          </span>
        </div>
        <div className="marketRules">
          <div>
            <span>Resolution Rules</span>
            <strong>Polymarket closing market-cap basis</strong>
          </div>
          <ul>
            <li>Resolves on Cerebras Systems' market capitalization at the official closing price on its first trading day.</li>
            <li>Market cap is total outstanding shares times the official closing price of the publicly traded class, including other share classes and stated conversion ratios where needed.</li>
            <li>Outstanding shares come from official company filings or disclosures; closing price comes from the primary exchange's official listing page.</li>
            <li>If the value lands exactly between two brackets, the higher bracket resolves Yes.</li>
            <li>If no IPO occurs by June 30, 2026 at 11:59 PM ET, the no-IPO-before-July market resolves Yes.</li>
            <li>If trading is interrupted or abbreviated, the market uses the official close from that session; if none is published, it uses the next trading day with an official close.</li>
          </ul>
        </div>
      </section>

      {!polymarketClosed ? (
      <section className="panel tablePanel">
        <div className="panelHeader">
          <div>
            <p>Raw Inputs</p>
            <h2>Polymarket closing bracket prices</h2>
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
                <th>PM Page Yes</th>
                <th>Robust Yes</th>
                <th>Blended Prob.</th>
                <th>Bid / Ask</th>
                <th>Quote / Ref</th>
                <th>Reliability</th>
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
                  <td>{row.pageYesPrice == null ? "n/a" : formatPercent(row.pageYesPrice)}</td>
                  <td>{formatPercent(row.yesPrice)}</td>
                  <td>{formatPercent(row.probability)}</td>
                  <td>
                    {row.bid == null ? "n/a" : formatPercent(row.bid)} / {row.ask == null ? "n/a" : formatPercent(row.ask)}
                  </td>
                  <td>
                    {row.quoteMidpoint == null ? "n/a" : formatPercent(row.quoteMidpoint)} / {row.referencePrice == null ? "n/a" : formatPercent(row.referencePrice)}
                  </td>
                  <td>
                    {row.priceConfidence} · {formatPercent(row.quoteWeight)} quote · {row.priceBasis}
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
      ) : null}
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
window.__cbrsRoot.render(
  <>
    <App />
    <Analytics />
  </>
);
