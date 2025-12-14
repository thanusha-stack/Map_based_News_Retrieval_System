export default async function handler(req, res) {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing coordinates" });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "MapBasedNewsApp/1.0 (your-email@example.com)"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Nominatim error" });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Reverse geocoding failed" });
  }
}
