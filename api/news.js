export default async function handler(req, res) {
  const { city, category, from, to } = req.query;

  const API_KEY = process.env.GNEWS_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  const url = `https://gnews.io/api/v4/search?q=${city}&lang=en&country=in&max=10&from=${from}&to=${to}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch news" });
  }
}
