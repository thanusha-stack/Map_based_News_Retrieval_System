export default async function handler(req, res) {
  const { city, category, from, to } = req.query;

  const API_KEY = process.env.GNEWS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  const categoryKeywords = {
    sports: "sports OR cricket OR football",
    politics: "politics OR government OR election",
    weather: "weather OR climate OR rain",
    general: "news OR latest"
  };

  const query = `${city} ${categoryKeywords[category] || ""}`;

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
    query
  )}&lang=en&country=in&from=${from}&to=${to}&max=10&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}
