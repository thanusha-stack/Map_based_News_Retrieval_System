import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const API_KEY = import.meta.env.VITE_GNEWS_API_KEY;

// 🔹 Reverse geocoding to get city + district + state
const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
    );
    const data = await res.json();

    const { city, town, village, state_district, state } = data.address;

    return {
      city:
        (city || town || village || state_district || state || "India")
          .replace(/ district| division| state/gi, "")
          .trim(),
      district:
        (state_district || city || state || "India")
          .replace(/ district| division| state/gi, "")
          .trim(),
      state:
        (state || "India")
          .replace(/ district| division| state/gi, "")
          .trim(),
    };
  } catch (error) {
    console.error("❌ Error in reverse geocoding:", error);
    return { city: "India", district: "India", state: "India" };
  }
};

// 🔹 Fetch news for a city/category
const fetchNews = async (query, category = "general") => {
  const categoryKeywords = {
    sports: "sports OR cricket OR football OR match",
    politics: "politics OR government OR election OR minister",
    weather: "weather OR climate OR rain OR temperature",
    general: "news OR latest OR update",
  };

  const searchQuery = `${query} ${categoryKeywords[category] || ""}`;
  console.log(`🔍 Fetching ${category} news for: ${searchQuery}`);

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
      searchQuery
    )}&lang=en&country=in&max=10&apikey=${API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} error`);

    const data = await res.json();
    const articles = data.articles || [];

    // Add category for tracking
    return articles.map((a) => ({ ...a, category }));
  } catch (err) {
    console.error(`❌ Error fetching ${category} news:`, err);
    return [];
  }
};

// 🔹 Fetch only for city and district (NO broader fallback)
const fetchAllNewsForCity = async (geoInfo) => {
  const { city, district } = geoInfo;
  const categories = ["general", "sports", "politics", "weather"];
  let allArticles = [];

  console.log(`🏙 Fetching strictly for city: ${city} and district: ${district}`);

  for (const category of categories) {
    // Fetch for city
    const cityArticles = await fetchNews(city, category);
    const filteredCity = cityArticles.filter((a) => {
      const text = (
        (a.title || "") +
        (a.description || "") +
        (a.content || "")
      ).toLowerCase();
      return text.includes(city.toLowerCase());
    });

    // Fetch for district (only if no city results)
    let districtArticles = [];
    if (filteredCity.length === 0 && district && district !== city) {
      const distArticles = await fetchNews(district, category);
      districtArticles = distArticles.filter((a) => {
        const text = (
          (a.title || "") +
          (a.description || "") +
          (a.content || "")
        ).toLowerCase();
        return text.includes(district.toLowerCase());
      });
    }

    allArticles.push(...filteredCity, ...districtArticles);
    await new Promise((resolve) => setTimeout(resolve, 400)); // prevent rate limit
  }

  // Deduplicate by URL
  const unique = allArticles.reduce((acc, current) => {
    if (!acc.find((a) => a.url === current.url)) acc.push(current);
    return acc;
  }, []);

  console.log(`✨ Total unique strict matches: ${unique.length}`);
  return unique;
};

// 🔹 Helper for date filtering
const isWithinDays = (dateString, days) => {
  try {
    const articleDate = new Date(dateString);
    const today = new Date();
    const diff = (today - articleDate) / (1000 * 3600 * 24);
    return diff <= days;
  } catch {
    return true;
  }
};

const NewsListPage = () => {
  const locationHook = useLocation();
  const clickedLocation = locationHook.state?.clickedLocation || null;

  const [loading, setLoading] = useState(true);
  const [geoInfo, setGeoInfo] = useState({ city: "", district: "", state: "" });
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [daysFilter, setDaysFilter] = useState("all");
  const [error, setError] = useState("");

  const loadedLocationRef = useRef(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!API_KEY) {
      setError("Missing API key in .env file!");
      setLoading(false);
      return;
    }

    const locationKey = clickedLocation
      ? `${clickedLocation[0].toFixed(6)},${clickedLocation[1].toFixed(6)}`
      : "default";

    if (loadedLocationRef.current === locationKey || isLoadingRef.current) return;

    const loadData = async () => {
      isLoadingRef.current = true;
      loadedLocationRef.current = locationKey;
      setLoading(true);
      setError("");

      try {
        let geo = { city: "India", district: "India", state: "India" };

        if (clickedLocation) {
          const [lat, lng] = clickedLocation;
          console.log(`📍 Reverse geocoding for ${lat}, ${lng}`);
          geo = await reverseGeocode(lat, lng);
        }

        setGeoInfo(geo);

        const news = await fetchAllNewsForCity(geo);
        setArticles(news);

        if (news.length === 0) {
          setError(
            `No news found specifically for ${geo.city} or ${geo.district}.`
          );
        }
      } catch (e) {
        console.error("❌ Error loading news:", e);
        setError("Failed to load news. Try again later.");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadData();
  }, [clickedLocation?.[0], clickedLocation?.[1]]);

  // 🔹 Filtering logic
  const filteredArticles = articles.filter((a) => {
    const text = (a.title + " " + (a.description || "")).toLowerCase();
    const matchesCategory =
      selectedCategory === "all" || a.category === selectedCategory;
    const matchesDate =
      daysFilter === "all" || isWithinDays(a.publishedAt, parseInt(daysFilter));
    const matchesSearch = !searchQuery || text.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDate && matchesSearch;
  });

  const availableCategories = [...new Set(articles.map((a) => a.category))].sort();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong>Note:</strong> {error}
        </div>
      )}

      <h2 className="text-3xl font-bold mb-2 text-center text-red-600">
        News near {geoInfo.city || "your location"}
      </h2>
      <p className="text-center text-gray-600 mb-6">
        {filteredArticles.length} of {articles.length} articles found{" "}
        {articles.length > 0 &&
          `(${availableCategories.join(", ")}) from ${geoInfo.city || geoInfo.state}`}
      </p>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by title or description..."
          className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Categories</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(e.target.value)}
          className="p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Dates</option>
          <option value="1">Last 1 Day</option>
          <option value="3">Last 3 Days</option>
          <option value="5">Last 5 Days</option>
          <option value="7">Last 7 Days</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p>Loading news for {geoInfo.city || "your area"}...</p>
        </div>
      )}

      {/* Articles */}
      {!loading && filteredArticles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((a, i) => (
            <div
              key={`${a.url}-${i}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <img
                src={a.image || "https://via.placeholder.com/400x200?text=No+Image"}
                alt={a.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between mb-2">
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    {a.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(a.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{a.title}</h3>
                <p className="text-gray-700 text-sm mb-3">
                  {a.description || "No description available."}
                </p>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Read full article →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg mb-4">
              No articles found matching your filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setDaysFilter("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All Filters
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default NewsListPage;