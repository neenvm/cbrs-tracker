const parseUsdValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const parsed = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

export default async function handler(_request, response) {
  try {
    const nasdaqResponse = await fetch("https://api.nasdaq.com/api/quote/CBRS/info?assetclass=stocks", {
      headers: {
        accept: "application/json, text/plain, */*",
        origin: "https://www.nasdaq.com",
        referer: "https://www.nasdaq.com/",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      }
    });

    if (!nasdaqResponse.ok) {
      response.status(nasdaqResponse.status).json({ error: `Nasdaq returned ${nasdaqResponse.status}` });
      return;
    }

    const payload = await nasdaqResponse.json();
    const close = parseUsdValue(payload?.data?.secondaryData?.lastSalePrice);
    if (close == null) {
      response.status(502).json({ error: "Nasdaq close missing" });
      return;
    }

    response.setHeader("cache-control", "s-maxage=30, stale-while-revalidate=300");
    response.status(200).json({
      close,
      timestamp: payload?.data?.secondaryData?.lastTradeTimestamp ?? "Closed at May 14, 2026 4:00 PM ET",
      afterHoursPrice: parseUsdValue(payload?.data?.primaryData?.lastSalePrice)
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Nasdaq close fetch failed" });
  }
}
