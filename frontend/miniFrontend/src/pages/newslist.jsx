import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const API_KEY = import.meta.env.VITE_GNEWS_API_KEY;

// ✅ Normalize and correct known spelling variants for Indian cities
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

// 🔹 Reverse geocoding to get city name
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
    const normalized = normalizeCityName(place);
    console.log(`📍 Normalized city name: ${place} → ${normalized}`);
    return normalized;
  } catch (error) {
    console.error("❌ Error in reverse geocoding:", error);
    return "India";
  }
};

// 🔹 Fetch news with 7-day date range
const fetchNews = async (city, category = "general") => {
  let query = city;

  // Add category-specific keywords for better results
  const categoryKeywords = {
    sports: "sports OR cricket OR football OR match",
    politics: "politics OR government OR election OR minister",
    weather: "weather OR climate OR rain OR temperature",
    general: "news OR latest OR update",
  };

  query = `${city} ${categoryKeywords[category] || ""}`;

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const fromDate = sevenDaysAgo.toISOString().split("T")[0];
  const toDate = today.toISOString().split("T")[0];

  console.log(`🗓 Fetching news from ${fromDate} to ${toDate}`);

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
      query
    )}&lang=en&country=in&from=${fromDate}&to=${toDate}&max=10&apikey=${API_KEY}`;

    console.log(`📡 API URL: ${url.replace(API_KEY, "API_KEY_HIDDEN")}`);

    const res = await fetch(url);

    if (!res.ok) {
      console.error(`❌ HTTP error! status: ${res.status} for ${category}`);
      throw new Error(`HTTP ${res.status} - Failed to fetch ${category} news`);
    }

    const data = await res.json();
    console.log(`✅ ${category} news response:`, data);

    if (!data.articles || data.articles.length === 0) {
      console.warn(`⚠ No articles found for ${category} in ${city}`);
      return [];
    }

    // Add category to each article
    return data.articles.map((article) => ({
      ...article,
      category,
    }));
  } catch (err) {
    console.error(`❌ Error fetching ${category} news:`, err);
    return [];
  }
};

// 🔹 Fetch all categories for a given city
const fetchAllNewsForCity = async (city) => {
  if (!city || city === "India") city = "India";
  const categories = ["general", "sports", "politics", "weather"];
  const allArticles = [];

  for (const category of categories) {
    const articles = await fetchNews(city, category);
    allArticles.push(...articles);
    await new Promise((resolve) => setTimeout(resolve, 500)); // delay
  }

  // Deduplicate by URL
  const uniqueArticles = allArticles.reduce((acc, current) => {
    const isDuplicate = acc.find(
      (a) => a.url === current.url || a.title === current.title
    );
    if (!isDuplicate) acc.push(current);
    return acc;
  }, []);

  return uniqueArticles;
};

// 🔹 Helper for date filtering
const isWithinDays = (dateString, days) => {
  try {
    const articleDate = new Date(dateString);
    const today = new Date();
    const diffInDays = (today - articleDate) / (1000 * 3600 * 24);
    return diffInDays <= days;
  } catch {
    return true;
  }
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

  const loadedLocationRef = useRef(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!API_KEY) {
      setError("API key is missing. Please check your configuration.");
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
        let cityName = "India";
        if (clickedLocation) {
          const [lat, lng] = clickedLocation;
          cityName = await reverseGeocode(lat, lng);
        }
        setCity(cityName);

        const allNews = await fetchAllNewsForCity(cityName);
        setArticles(allNews);

        if (allNews.length === 0) {
          setError(`No news found for ${cityName}.`);
        }
      } catch {
        setError("Failed to load news. Please try again later.");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadData();
  }, [clickedLocation?.[0], clickedLocation?.[1]]);

  // 🔹 Apply filters
  const filteredArticles = articles.filter((article) => {
    const text = (article.title + " " + (article.description || "")).toLowerCase();
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    const matchesDate =
      daysFilter === "all" || isWithinDays(article.publishedAt, parseInt(daysFilter));
    const matchesSearch = !searchQuery || text.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDate && matchesSearch;
  });

  const availableCategories = [
    ...new Set(articles.map((article) => article.category)),
  ].sort();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      

      <h2 className="text-3xl font-bold mb-2 text-center text-red-600">
        News near {city || "your location"}
      </h2>

      <p className="text-center text-gray-600 mb-6">
        {filteredArticles.length} of {articles.length} articles found
      </p>

      {/* 🔹 Filters */}
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
          {availableCategories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
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

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
          <p className="text-lg">Loading news for {city || "your location"}...</p>
        </div>
      )}

      {!loading && filteredArticles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article, index) => (
            <div
              key={`${article.url}-${index}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <img
                src={
                  article.image ||
                  "https://via.placeholder.com/400x200?text=No+Image"
                }
                alt={article.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/400x200?text=No+Image";
                }}
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-700 text-sm line-clamp-3">
                  {article.description || "No description available"}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-red-600 hover:text-red-800 font-medium text-sm"
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
