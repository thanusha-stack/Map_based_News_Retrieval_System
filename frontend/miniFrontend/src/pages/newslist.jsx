import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// ✅ Normalize city names
const normalizeCityName = (name) => {
  if (!name) return "India";

  const corrections = {
    erode: "erode",
    satyamangalam: "sathyamangalam",
    bengaluru: "bangalore",
    madras: "chennai",
    bombay: "mumbai",
    calcutta: "kolkata",
    pondicherry: "puducherry",
    trichur: "thrissur",
    trivandrum: "thiruvananthapuram",
  };

  const cleaned = name.trim().toLowerCase();
  return corrections[cleaned] || cleaned;
};

// 🔹 Reverse geocoding
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
    );
    const data = await res.json();

    let place =
      data.address.city ||
      data.address.town ||
      data.address.village ||
      data.address.state_district ||
      data.address.state ||
      "India";

    place = place.replace(/ district| division| state/gi, "").trim();
    return normalizeCityName(place);
  } catch {
    return "India";
  }
};

// 🔹 Fetch news from BACKEND
const fetchNews = async (city, category) => {
  try {
    const res = await fetch(`/api/news?city=${city}&category=${category}`)

    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
};

// 🔹 Fetch all categories
const fetchAllNewsForCity = async (city) => {
  const categories = ["general", "sports", "politics", "weather"];
  let all = [];

  for (const category of categories) {
    const articles = await fetchNews(city, category);
    all.push(
      ...articles.map((a) => ({
        ...a,
        category,
      }))
    );
    await new Promise((r) => setTimeout(r, 400));
  }

  // Deduplicate
  return all.filter(
    (v, i, a) =>
      i === a.findIndex((t) => t.url === v.url || t.title === v.title)
  );
};

const isWithinDays = (date, days) => {
  const diff = (new Date() - new Date(date)) / (1000 * 3600 * 24);
  return diff <= days;
};

const NewsListPage = () => {
  const locationHook = useLocation();
  const clickedLocation = locationHook.state?.clickedLocation || null;

  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [daysFilter, setDaysFilter] = useState("all");
  const [error, setError] = useState("");

  const loadedRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const key = clickedLocation
      ? `${clickedLocation[0]},${clickedLocation[1]}`
      : "default";

    if (loadedRef.current === key || loadingRef.current) return;

    const load = async () => {
      loadingRef.current = true;
      loadedRef.current = key;
      setLoading(true);
      setError("");

      try {
        let cityName = "India";
        if (clickedLocation) {
          const [lat, lng] = clickedLocation;
          cityName = await reverseGeocode(lat, lng);
        }

        setCity(cityName);
        const news = await fetchAllNewsForCity(cityName);
        setArticles(news);

        if (!news.length) setError(`No news found for ${cityName}`);
      } catch {
        setError("Failed to load news");
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    load();
  }, [clickedLocation]);

  const filteredArticles = articles.filter((a) => {
    const text = (a.title + a.description).toLowerCase();
    return (
      (selectedCategory === "all" || a.category === selectedCategory) &&
      (daysFilter === "all" ||
        isWithinDays(a.publishedAt, Number(daysFilter))) &&
      (!searchQuery || text.includes(searchQuery.toLowerCase()))
    );
  });

  const categories = [...new Set(articles.map((a) => a.category))];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-center text-red-600">
        News near {city}
      </h2>

      {loading && <p className="text-center mt-6">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        <input
          placeholder="Search..."
          className="p-2 border rounded"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="1">1 day</option>
          <option value="3">3 days</option>
          <option value="7">7 days</option>
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((a, i) => (
          <div key={i} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold">{a.title}</h3>
            <p className="text-sm">{a.description}</p>
            <a href={a.url} target="_blank" className="text-red-600">
              Read →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsListPage;
